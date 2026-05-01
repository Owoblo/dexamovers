/* ---- NAV ---- */
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const year = document.querySelector("#year");

if (year) year.textContent = new Date().getFullYear();

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.getAttribute("data-open") === "true";
    siteNav.setAttribute("data-open", String(!isOpen));
    navToggle.setAttribute("aria-expanded", String(!isOpen));
  });
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.setAttribute("data-open", "false");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---- SCROLL REVEAL ---- */
const revealEls = document.querySelectorAll("[data-reveal]");
if (revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
}

/* ---- FORMS ---- */
const forms = document.querySelectorAll(".lead-form");
forms.forEach((form) => {
  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!status || !(submitButton instanceof HTMLButtonElement)) return;

    status.textContent = "Sending your request…";
    status.dataset.state = "";
    submitButton.disabled = true;

    const endpoint = form.dataset.endpoint || "/api/lead";
    const formData = new FormData(form);
    formData.set("sourcePage", window.location.pathname || "/");
    formData.set("submittedAt", new Date().toISOString());
    formData.set("formName", form.dataset.formName || "Lead Form");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ||
            payload.errors?.[0]?.message ||
            "Unable to send your request right now."
        );
      }

      form.reset();
      status.dataset.state = "success";
      status.textContent = "Thanks — your request has been sent. We'll be in touch shortly.";
    } catch (error) {
      status.dataset.state = "error";
      status.textContent =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
    } finally {
      submitButton.disabled = false;
    }
  });
});
