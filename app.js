const config = window.SIMPLE_CONFIG || {};
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const header = document.querySelector("[data-header]");
const toast = document.querySelector("[data-toast]");
const coverageModal = document.querySelector("[data-coverage-modal]");
const coverageCheckForm = document.querySelector("[data-coverage-check-form]");
const coverageWaitlistForm = document.querySelector("[data-coverage-waitlist-form]");
const coverageResult = document.querySelector("[data-coverage-result]");
const assistedForm = document.querySelector("[data-assisted-form]");
let coverageDataPromise;
let lastCoverageTrigger;

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
};

const closeMenu = () => {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
  menuToggle.querySelector("use").setAttribute("href", "#icon-menu");
  mobileNav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  menuToggle.setAttribute("aria-label", open ? "Abrir menú" : "Cerrar menú");
  menuToggle.querySelector("use").setAttribute("href", open ? "#icon-menu" : "#icon-close");
  mobileNav.classList.toggle("is-open", !open);
  document.body.classList.toggle("menu-open", !open);
});

mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("is-scrolled", window.scrollY > 10),
  { passive: true }
);

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const getWhatsAppHref = (message) => {
  const whatsappText = encodeURIComponent(message);
  return config.whatsappNumber
    ? `https://wa.me/${String(config.whatsappNumber).replace(/\D/g, "")}?text=${whatsappText}`
    : `https://wa.me/?text=${whatsappText}`;
};

const whatsappHref = getWhatsAppHref(
  "Hola, vi su página y me interesa saber más sobre la contratación."
);

document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
  link.href = whatsappHref;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

document.querySelectorAll("[data-app-link]").forEach((link) => {
  if (config.appUrl) {
    link.href = config.appUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Agrega el enlace oficial de la app en site-config.js.");
  });
});

const storeMap = {
  appStore: config.appStoreUrl || config.appUrl,
  googlePlay: config.googlePlayUrl || config.appUrl
};

document.querySelectorAll("[data-store-link]").forEach((link) => {
  const url = storeMap[link.dataset.storeLink];
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Agrega el enlace oficial de esta tienda en site-config.js.");
  });
});

const socialMap = {
  instagram: config.instagramUrl,
  facebook: config.facebookUrl,
  linkedin: config.linkedinUrl
};

document.querySelectorAll("[data-social]").forEach((link) => {
  const url = socialMap[link.dataset.social];
  if (url) {
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return;
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Agrega la URL oficial de esta red en site-config.js.");
  });
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const autoplayDelay = Number(carousel.dataset.carouselAutoplay || 0);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentIndex = 0;
  let touchStartX = 0;
  let autoplayTimer;

  const showSlide = (index) => {
    if (!track || !slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === currentIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", String(active));
    });
  };

  const stopAutoplay = () => {
    if (!autoplayTimer) return;
    window.clearInterval(autoplayTimer);
    autoplayTimer = undefined;
  };

  const startAutoplay = () => {
    if (!autoplayDelay || slides.length < 2 || prefersReducedMotion || autoplayTimer) return;
    autoplayTimer = window.setInterval(() => showSlide(currentIndex + 1), autoplayDelay);
  };

  const goToSlide = (index) => {
    showSlide(index);
    stopAutoplay();
    startAutoplay();
  };

  previousButton?.addEventListener("click", () => goToSlide(currentIndex - 1));
  nextButton?.addEventListener("click", () => goToSlide(currentIndex + 1));

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => goToSlide(dotIndex));
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
      stopAutoplay();
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      const touchEndX = event.changedTouches[0]?.clientX || 0;
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) >= 45) showSlide(currentIndex + (deltaX < 0 ? 1 : -1));
      startAutoplay();
    },
    { passive: true }
  );

  showSlide(0);
  startAutoplay();
});

assistedForm?.querySelector('[name="postalCode"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 5);
});

assistedForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = assistedForm.querySelector("[data-assisted-error]");
  const submitButton = assistedForm.querySelector('button[type="submit"]');
  const formData = new FormData(assistedForm);
  const lead = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
    email: String(formData.get("email") || "").trim()
  };

  message.textContent = "";
  message.classList.remove("is-success", "is-waitlist");

  if (!assistedForm.checkValidity() || !/^\d{5}$/.test(lead.postalCode)) {
    message.textContent = "Completa tus datos y un código postal de cinco dígitos.";
    assistedForm.reportValidity();
    return;
  }

  submitButton.disabled = true;
  const originalButtonText = submitButton.textContent;
  submitButton.lastChild.textContent = "Validando cobertura...";

  try {
    const coverageData = await loadCoverageData();
    const coverageZone = coverageData.postalCodes[lead.postalCode];

    if (!coverageZone) {
      const contact = lead.email || lead.phone;
      const response = await fetch(config.coverageEndpoint || "/api/coverage-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: lead.postalCode,
          contact,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          address: lead.city,
          source: "assisted-contract-form"
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "No pudimos registrar tus datos. Intenta nuevamente o escríbenos por WhatsApp.");
      }

      message.classList.add("is-waitlist");
      message.textContent = "Gracias. Aún no tenemos cobertura en tu código postal; registramos tus datos y te avisaremos cuando SIMPLE llegue a tu zona.";
      showToast("Te avisaremos cuando tengamos cobertura en tu zona.");
      return;
    }

    message.classList.add("is-success");
    message.textContent = `Tenemos cobertura en ${coverageZone}. Te llevamos a contratación.`;

    const params = new URLSearchParams({
      name: lead.name,
      phone: lead.phone,
      address: lead.city,
      cp: lead.postalCode,
      email: lead.email
    });

    window.setTimeout(() => {
      window.location.href = `contratacion.html?${params.toString()}`;
    }, 650);
  } catch (coverageError) {
    message.textContent = coverageError.message || "No pudimos validar cobertura. Intenta nuevamente.";
  } finally {
    window.setTimeout(() => {
      submitButton.disabled = false;
      submitButton.lastChild.textContent = originalButtonText.trim();
    }, 700);
  }
});

const loadCoverageData = () => {
  if (!coverageDataPromise) {
    coverageDataPromise = fetch("assets/data/coverage-cdmx.json", { cache: "no-store" }).then(
      async (response) => {
        if (!response.ok) throw new Error("No pudimos consultar la cobertura.");
        return response.json();
      }
    );
  }

  return coverageDataPromise;
};

const closeCoverageModal = () => {
  if (!coverageModal) return;
  coverageModal.hidden = true;
  document.body.classList.remove("modal-open");
  lastCoverageTrigger?.focus();
};

const resetCoverageModal = () => {
  coverageCheckForm?.reset();
  coverageWaitlistForm?.reset();
  coverageCheckForm?.querySelector("[data-coverage-error]")?.replaceChildren();
  coverageWaitlistForm?.querySelector("[data-waitlist-error]")?.replaceChildren();

  if (coverageResult) {
    coverageResult.hidden = true;
    coverageResult.className = "coverage-result";
    coverageResult.replaceChildren();
  }

  if (coverageWaitlistForm) {
    coverageWaitlistForm.hidden = true;
  }
};

document.querySelectorAll("[data-coverage-open]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    lastCoverageTrigger = button;
    resetCoverageModal();
    coverageModal.hidden = false;
    document.body.classList.add("modal-open");
    coverageCheckForm?.querySelector('[name="postalCode"]')?.focus();
  });
});

document.querySelectorAll("[data-coverage-close]").forEach((button) => {
  button.addEventListener("click", closeCoverageModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && coverageModal && !coverageModal.hidden) {
    closeCoverageModal();
  }
});

coverageCheckForm?.querySelector('[name="postalCode"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 5);
});

coverageCheckForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const postalCodeInput = coverageCheckForm.querySelector('[name="postalCode"]');
  const error = coverageCheckForm.querySelector("[data-coverage-error]");
  const postalCode = postalCodeInput.value.trim();

  error.textContent = "";
  coverageResult.hidden = true;
  coverageWaitlistForm.hidden = true;

  if (!/^\d{5}$/.test(postalCode)) {
    error.textContent = "Ingresa un código postal de cinco dígitos.";
    postalCodeInput.focus();
    return;
  }

  try {
    const coverageData = await loadCoverageData();
    const borough = coverageData.postalCodes[postalCode];

    coverageResult.hidden = false;
    if (borough) {
      coverageResult.className = "coverage-result is-covered";
      coverageResult.innerHTML = `
        <div class="coverage-result-heading">
          <span class="coverage-result-icon"><svg aria-hidden="true"><use href="#icon-check"></use></svg></span>
          <div>
            <h3>¡Tu zona está lista para recibir SIMPLE!</h3>
            <p>Tenemos cobertura en ${borough}. Puedes continuar con tus datos de contratación y pago.</p>
          </div>
        </div>
        <div class="coverage-result-actions coverage-result-actions-three">
          <a class="button button-primary" href="contratacion.html?cp=${encodeURIComponent(postalCode)}">Continuar contratación</a>
          <a class="button button-secondary" href="${config.appStoreUrl}" target="_blank" rel="noopener noreferrer">App Store</a>
          <a class="button button-secondary" href="${config.googlePlayUrl}" target="_blank" rel="noopener noreferrer">Google Play</a>
        </div>
      `;
      return;
    }

    coverageResult.className = "coverage-result is-unavailable";
    coverageResult.innerHTML = `
      <div class="coverage-result-heading">
        <span class="coverage-result-icon"><svg aria-hidden="true"><use href="#icon-location"></use></svg></span>
        <div>
          <h3>Aún no tenemos cobertura en este código postal</h3>
          <p>Déjanos tu correo o WhatsApp y te avisaremos cuando SIMPLE llegue a tu zona.</p>
        </div>
      </div>
    `;
    coverageWaitlistForm.hidden = false;
    coverageWaitlistForm.querySelector('[name="postalCode"]').value = postalCode;
    coverageWaitlistForm.querySelector('[name="contact"]').focus();
  } catch (error) {
    coverageResult.hidden = false;
    coverageResult.className = "coverage-result is-unavailable";
    coverageResult.innerHTML = `<p>${error.message || "No pudimos verificar la cobertura. Intenta nuevamente."}</p>`;
  }
});

coverageWaitlistForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const contactInput = coverageWaitlistForm.querySelector('[name="contact"]');
  const privacyInput = coverageWaitlistForm.querySelector('[name="privacy"]');
  const postalCode = coverageWaitlistForm.querySelector('[name="postalCode"]').value;
  const error = coverageWaitlistForm.querySelector("[data-waitlist-error]");
  const contact = contactInput.value.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const validPhone = contact.replace(/\D/g, "").length >= 10;

  error.textContent = "";
  if (!validEmail && !validPhone) {
    error.textContent = "Escribe un correo o WhatsApp válido.";
    contactInput.focus();
    return;
  }
  if (!privacyInput.checked) {
    error.textContent = "Necesitamos tu aceptación para registrar el aviso.";
    privacyInput.focus();
    return;
  }

  const message = [
    "Hola, vi su página y quiero recibir aviso cuando SIMPLE llegue a mi zona.",
    "",
    "Mis datos:",
    `Código postal: ${postalCode}`,
    `Contacto: ${contact}`
  ].join("\n");

  window.open(getWhatsAppHref(message), "_blank", "noopener,noreferrer");
});

document.documentElement.dataset.appReady = "true";


const checkoutForm = document.querySelector("[data-checkout-form]");

const appendQuery = (url, params) => {
  const target = new URL(url, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) target.searchParams.set(key, value);
  });
  return target.toString();
};

const buildCheckoutWhatsAppMessage = (lead) => [
  `Hola, vi su página y quiero contratar SIMPLE con el código ${config.promoCode || "AGUASIMPLE"}. Me interesa recibir apoyo con el proceso y el link de pago.`,
  "",
  "Mis datos:",
  `Nombre: ${lead.firstName} ${lead.lastName} ${lead.secondLastName}`.trim(),
  `Celular: ${lead.phone}`,
  `Correo: ${lead.email}`,
  `Fecha de nacimiento: ${lead.birthDate || "No indicada"}`,
  `Dirección: ${lead.streetType} ${lead.street} ${lead.externalNumber}${lead.internalNumber ? " Int. " + lead.internalNumber : ""}`,
  `Colonia: ${lead.neighborhood}`,
  `Código postal: ${lead.postalCode}`,
  `Municipio/Alcaldía: ${lead.municipality}`,
  `Estado: ${lead.state}`,
  `Referencia: ${lead.reference || "No indicada"}`,
  `Cómo se enteró: ${lead.source}`
].join("\n");

checkoutForm?.querySelector('[name="postalCode"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 5);
});

if (checkoutForm) {
  const params = new URLSearchParams(window.location.search);
  const prefillMap = {
    firstName: params.get("name") || "",
    phone: params.get("phone") || "",
    email: params.get("email") || "",
    postalCode: params.get("cp") || params.get("postalCode") || "",
    street: params.get("address") || ""
  };

  Object.entries(prefillMap).forEach(([name, value]) => {
    const field = checkoutForm.querySelector(`[name="${name}"]`);
    if (field && value) field.value = value;
  });

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = checkoutForm.querySelector("[data-checkout-error]");
    const formData = new FormData(checkoutForm);
    const lead = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value).trim()]));
    error.textContent = "";

    if (!checkoutForm.checkValidity() || !/^\d{5}$/.test(lead.postalCode || "")) {
      error.textContent = "Completa los campos requeridos para continuar.";
      checkoutForm.reportValidity();
      return;
    }

    try {
      const coverageData = await loadCoverageData();
      if (!coverageData.postalCodes[lead.postalCode]) {
        error.textContent = "Este código postal aún no aparece en cobertura. Escríbenos por WhatsApp para revisarlo contigo.";
        return;
      }
    } catch (coverageError) {
      error.textContent = "No pudimos validar cobertura en este momento. Intenta nuevamente o escríbenos por WhatsApp.";
      return;
    }

    const message = buildCheckoutWhatsAppMessage(lead);
    window.localStorage?.setItem("simpleCheckoutLead", JSON.stringify({ ...lead, promoCode: config.promoCode || "AGUASIMPLE", createdAt: new Date().toISOString() }));

    if (config.stripePaymentLink) {
      const paymentUrl = appendQuery(config.stripePaymentLink, {
        prefilled_email: lead.email,
        client_reference_id: `${lead.postalCode}-${Date.now()}`
      });
      window.location.href = paymentUrl;
      return;
    }

    window.open(getWhatsAppHref(message), "_blank", "noopener,noreferrer");
  });
}
