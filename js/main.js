// CDSE site behaviour: mobile nav, accessibility toolbar.
(function () {
  "use strict";

  /* ---------- Header goes translucent on scroll ---------- */
  var header = document.querySelector(".header");
  if (header) {
    var updateHeaderScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeaderScrolled();
    window.addEventListener("scroll", updateHeaderScrolled, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".mobile-menu-btn");
  var nav = document.querySelector(".header-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("active");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- "More" overflow nav dropdown ---------- */
  var moreBtn = document.querySelector(".nav-more-btn");
  var moreMenu = document.querySelector(".nav-more-menu");
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      var open = moreMenu.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (event) {
      if (!moreMenu.classList.contains("open")) return;
      if (moreMenu.contains(event.target) || moreBtn.contains(event.target)) return;
      moreMenu.classList.remove("open");
      moreBtn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && moreMenu.classList.contains("open")) {
        moreMenu.classList.remove("open");
        moreBtn.setAttribute("aria-expanded", "false");
        moreBtn.focus();
      }
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
    document.body.classList.toggle("high-contrast", on);
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
    applyContrast(!document.body.classList.contains("high-contrast"));
  });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
