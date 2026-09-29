// CDSE site behaviour: mobile nav, accessibility toolbar.
(function () {
  "use strict";

  /* ---------- Header shrinks to a pill on scroll ---------- */
  var header = document.querySelector(".header");
  if (header) {
    // Hysteresis (different on/off thresholds) stops the class from
    // flapping — and the transition restarting — when the scroll
    // position hovers right at a single trigger point (e.g. 15-20px).
    var ON_AT = 90;
    var OFF_AT = 20;
    var ticking = false;

    var updateHeaderScrolled = function () {
      ticking = false;
      var y = window.scrollY;
      if (!header.classList.contains("is-scrolled") && y > ON_AT) {
        header.classList.add("is-scrolled");
      } else if (header.classList.contains("is-scrolled") && y < OFF_AT) {
        header.classList.remove("is-scrolled");
      }
    };

    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeaderScrolled);
      }
    };

    updateHeaderScrolled();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector(".mobile-menu-btn");
  var nav = document.querySelector(".header-nav");
  if (navToggle && nav) {
    var BARS = "M4 6h16v1.5H4zM4 11.25h16v1.5H4zM4 16.5h16v1.5H4z";
    var CROSS = "M4.47 5.53L5.53 4.47L19.53 18.47L18.47 19.53zM18.47 4.47L19.53 5.53L5.53 19.53L4.47 18.47z";
    var toggleIcon = navToggle.querySelector("path");

    var setNav = function (open) {
      nav.classList.toggle("active", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (toggleIcon) toggleIcon.setAttribute("d", open ? CROSS : BARS);
    };

    navToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setNav(!nav.classList.contains("active"));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("active") && !nav.contains(event.target)) setNav(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("active")) {
        setNav(false);
        navToggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && nav.classList.contains("active")) setNav(false);
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
