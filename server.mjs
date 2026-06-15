import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const crmWebhookUrl = process.env.CRM_WEBHOOK_URL || "";
const requests = new Map();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp"
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 50_000) throw new Error("Solicitud demasiado grande.");
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const isRateLimited = (request) => {
  const address = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const recent = (requests.get(address) || []).filter((timestamp) => now - timestamp < 60_000);
  recent.push(now);
  requests.set(address, recent);
  return recent.length > 8;
};

const validateLead = (lead) => {
  const required = ["name", "whatsapp", "email", "city", "clientType", "people"];
  const missing = required.filter((key) => !String(lead[key] || "").trim());

  if (missing.length) return "Completa todos los campos obligatorios.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "El correo no es válido.";
  if (String(lead.whatsapp).replace(/\D/g, "").length < 10) return "El WhatsApp no es válido.";
  if (!["hogar", "empresa"].includes(lead.clientType)) return "El tipo de cliente no es válido.";

  const people = Number(lead.people);
  if (!Number.isInteger(people) || people < 1 || people > 10000) {
    return "El número de personas no es válido.";
  }

  return "";
};

const handleLead = async (request, response) => {
  if (isRateLimited(request)) {
    sendJson(response, 429, { message: "Demasiados intentos. Espera un momento e intenta nuevamente." });
    return;
  }

  try {
    const lead = await readBody(request);
    if (lead.companyWebsite) {
      sendJson(response, 202, { ok: true });
      return;
    }

    const validationError = validateLead(lead);
    if (validationError) {
      sendJson(response, 400, { message: validationError });
      return;
    }

    const normalizedLead = {
      source: "simple-landing",
      receivedAt: new Date().toISOString(),
      name: String(lead.name).trim().slice(0, 120),
      whatsapp: String(lead.whatsapp).trim().slice(0, 30),
      email: String(lead.email).trim().toLowerCase().slice(0, 160),
      city: String(lead.city).trim().slice(0, 120),
      clientType: lead.clientType,
      people: Number(lead.people),
      message: String(lead.message || "").trim().slice(0, 1500)
    };

    if (crmWebhookUrl) {
      const crmResponse = await fetch(crmWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedLead),
        signal: AbortSignal.timeout(8000)
      });

      if (!crmResponse.ok) throw new Error(`CRM respondió con ${crmResponse.status}`);
    } else {
      console.info("Lead recibido:", normalizedLead);
    }

    sendJson(response, 202, { ok: true });
  } catch (error) {
    console.error("No se pudo procesar el lead:", error);
    sendJson(response, 500, {
      message: "No pudimos enviar tus datos. Intenta nuevamente o contáctanos por WhatsApp."
    });
  }
};

const handleCoverageInterest = async (request, response) => {
  if (isRateLimited(request)) {
    sendJson(response, 429, { message: "Demasiados intentos. Espera un momento e intenta nuevamente." });
    return;
  }

  try {
    const interest = await readBody(request);
    const postalCode = String(interest.postalCode || "").trim();
    const contact = String(interest.contact || "").trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const validPhone = contact.replace(/\D/g, "").length >= 10;

    if (!/^\d{5}$/.test(postalCode)) {
      sendJson(response, 400, { message: "El código postal no es válido." });
      return;
    }
    if (!validEmail && !validPhone) {
      sendJson(response, 400, { message: "Escribe un correo o WhatsApp válido." });
      return;
    }

    const normalizedInterest = {
      source: "simple-coverage-waitlist",
      receivedAt: new Date().toISOString(),
      postalCode,
      contact: contact.toLowerCase().slice(0, 160)
    };

    if (crmWebhookUrl) {
      const crmResponse = await fetch(crmWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedInterest),
        signal: AbortSignal.timeout(8000)
      });

      if (!crmResponse.ok) throw new Error(`CRM respondió con ${crmResponse.status}`);
    } else {
      console.info("Interesado en cobertura:", normalizedInterest);
    }

    sendJson(response, 202, { ok: true });
  } catch (error) {
    console.error("No se pudo registrar el interés de cobertura:", error);
    sendJson(response, 500, {
      message: "No pudimos registrar tus datos. Intenta nuevamente o contáctanos por WhatsApp."
    });
  }
};

const serveFile = (request, response) => {
  const rawPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requestedPath = rawPath === "/" ? "/index.html" : rawPath;
  const safePath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Acceso denegado");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Página no encontrada");
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const cacheControl = [".html", ".css", ".js"].includes(extension)
    ? "no-cache, no-store, must-revalidate"
    : "public, max-age=604800";
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN"
  });
  createReadStream(filePath).pipe(response);
};

createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/lead") {
    await handleLead(request, response);
    return;
  }

  if (request.method === "POST" && request.url === "/api/coverage-interest") {
    await handleCoverageInterest(request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD, POST" });
    response.end();
    return;
  }

  serveFile(request, response);
}).listen(port, () => {
  console.log(`SIMPLE disponible en http://localhost:${port}`);
  if (!crmWebhookUrl) console.log("CRM_WEBHOOK_URL no configurado; los leads se mostrarán en consola.");
});
