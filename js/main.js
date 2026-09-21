// CDSE site behaviour: nav toggle, accessibility toolbar, form handling.
(function () {
  "use strict";

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Accessibility toolbar: text size + contrast ---------- */
  var root = document.documentElement;
  var STORAGE_SIZE = "cdse-font-scale";
  var STORAGE_CONTRAST = "cdse-contrast";

  function applyFontScale(scale) {
    root.style.fontSize = scale + "%";
    try { localStorage.setItem(STORAGE_SIZE, scale); } catch (e) {}
  }

  function applyContrast(on) {
    if (on) {
      root.setAttribute("data-contrast", "high");
    } else {
      root.removeAttribute("data-contrast");
    }
    try { localStorage.setItem(STORAGE_CONTRAST, on ? "1" : "0"); } catch (e) {}
    var btn = document.getElementById("contrast-toggle");
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  (function initFromStorage() {
    var savedScale = 100, savedContrast = false;
    try {
      savedScale = parseInt(localStorage.getItem(STORAGE_SIZE), 10) || 100;
      savedContrast = localStorage.getItem(STORAGE_CONTRAST) === "1";
    } catch (e) {}
    applyFontScale(savedScale);
    applyContrast(savedContrast);
  })();

  var incBtn = document.getElementById("font-increase");
  var decBtn = document.getElementById("font-decrease");
  var resetBtn = document.getElementById("font-reset");
  var contrastBtn = document.getElementById("contrast-toggle");

  function currentScale() {
    return parseInt(root.style.fontSize, 10) || 100;
  }

  if (incBtn) incBtn.addEventListener("click", function () {
    applyFontScale(Math.min(currentScale() + 10, 150));
  });
  if (decBtn) decBtn.addEventListener("click", function () {
    applyFontScale(Math.max(currentScale() - 10, 80));
  });
  if (resetBtn) resetBtn.addEventListener("click", function () {
    applyFontScale(100);
  });
  if (contrastBtn) contrastBtn.addEventListener("click", function () {
    applyContrast(root.getAttribute("data-contrast") !== "high");
  });

  /* ---------- Accessible AJAX form submission (Netlify Forms compatible) ---------- */
  function handleForm(formId, statusId, successMessage) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form || !status) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      var formData = new FormData(form);

      fetch(form.getAttribute("action") || "/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      })
        .then(function (response) {
          if (response.ok) {
            status.textContent = successMessage;
            status.className = "form-status success visible";
            status.setAttribute("role", "status");
            form.reset();
          } else {
            throw new Error("Network response was not ok");
          }
        })
        .catch(function () {
          status.textContent =
            "We could not submit this automatically. Please email us directly at cdse@nlujodhpur.ac.in with your details, or try again in a moment.";
          status.className = "form-status error visible";
          status.setAttribute("role", "alert");
        });

      status.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  handleForm("contact-form", "contact-status", "Thank you — your message has been sent to CDSE. We will respond as soon as possible.");
  handleForm("membership-form", "membership-status", "Thank you for applying to join CDSE. Our team will review your application and get in touch.");
  handleForm("survey-form", "survey-status", "Thank you for reporting this. CDSE's accessibility audit team will review it.");
  handleForm("blog-form", "blog-status", "Thank you — your blog submission has been received by the Editorial Board.");

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
