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

document.querySelector("[data-year]").textContent = new Date().getFullYear();

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
  let currentIndex = 0;
  let touchStartX = 0;

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

  previousButton?.addEventListener("click", () => showSlide(currentIndex - 1));
  nextButton?.addEventListener("click", () => showSlide(currentIndex + 1));

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => showSlide(dotIndex));
  });

  carousel.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0]?.clientX || 0;
    },
    { passive: true }
  );

  carousel.addEventListener(
    "touchend",
    (event) => {
      const touchEndX = event.changedTouches[0]?.clientX || 0;
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) < 45) return;
      showSlide(currentIndex + (deltaX < 0 ? 1 : -1));
    },
    { passive: true }
  );

  showSlide(0);
});

assistedForm?.querySelector('[name="postalCode"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 5);
});

assistedForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = assistedForm.querySelector("[data-assisted-error]");
  const formData = new FormData(assistedForm);
  const lead = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
    email: String(formData.get("email") || "").trim()
  };

  error.textContent = "";

  if (!assistedForm.checkValidity() || !/^\d{5}$/.test(lead.postalCode)) {
    error.textContent = "Completa tus datos para enviarlos por WhatsApp.";
    assistedForm.reportValidity();
    return;
  }

  const message = [
    "Hola, vi su página y quiero contratar SIMPLE. Me interesa recibir apoyo con el proceso y el link de pago.",
    "",
    "Mis datos:",
    `Nombre: ${lead.name}`,
    `Teléfono: ${lead.phone}`,
    `Dirección: ${lead.city}`,
    `Código postal: ${lead.postalCode}`,
    `Correo: ${lead.email}`
  ].join("\n");

  window.open(getWhatsAppHref(message), "_blank", "noopener,noreferrer");
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
  button.addEventListener("click", () => {
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
            <p>Tenemos cobertura en ${borough}. Puedes continuar con la contratación desde la app.</p>
          </div>
        </div>
        <div class="coverage-result-actions">
          <a class="button button-primary" href="${config.appStoreUrl}" target="_blank" rel="noopener noreferrer">Descargar en App Store</a>
          <a class="button button-primary" href="${config.googlePlayUrl}" target="_blank" rel="noopener noreferrer">Descargar en Google Play</a>
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
