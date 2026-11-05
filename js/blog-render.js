// Renders the three-tier blog listing on blogs.html using js/posts.js:
//   1. Hero — the single most recent post, image left, big fonts right
//   2. Latest — the next three posts, as cards
//   3. Archives — everything else, as a compact text grid (asterisk mark,
//      underlined small-caps title, byline)
// The home page reuses renderCard for a 3-post "From the Blog" teaser.
// Every title (hero, latest, archives) is itself the link to the full post.
(function () {
  "use strict";

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function titleLink(post) {
    var attrs = post.isExternal ? ' target="_blank" rel="noopener"' : "";
    // Warm the post cache on hover/focus so the click renders instantly.
    var pre = !post.isExternal && post.slug
      ? ' data-prefetch-slug="' + escapeHTML(post.slug) + '"'
      : "";
    var badge = post.audioUrl
      ? ' <span class="audio-badge" title="Audio version available">Audio</span>'
      : "";
    return '<a href="' + escapeHTML(post.url) + '"' + attrs + pre + ">" + escapeHTML(post.title) + "</a>" + badge;
  }

  function renderHero(post, container) {
    var media = post.imageUrl
      ? '<img class="blog-hero-media" src="' + escapeHTML(post.imageUrl) + '" alt="' +
        escapeHTML(post.imageAlt || post.title) + '" decoding="async">'
      : '<div class="blog-hero-media" aria-hidden="true">CDSE Blog</div>';
    container.innerHTML =
      media +
      "<div>" +
      '<span class="tag">Latest</span>' +
      "<h2>" + titleLink(post) + "</h2>" +
      '<p class="post-meta">' + escapeHTML(post.author) + "</p>" +
      "</div>";
  }

  function renderCard(post) {
    // The thumbnail is decorative: the title next to it is the real link text,
    // so an empty alt avoids announcing the same thing twice.
    var thumb = post.imageUrl
      ? '<img src="' + escapeHTML(post.imageUrl) + '" alt="" loading="lazy" decoding="async">'
      : "";
    return (
      '<article class="post-card">' +
      thumb +
      "<h3>" + titleLink(post) + "</h3>" +
      '<p class="excerpt">' + escapeHTML(post.author) + "</p>" +
      "</article>"
    );
  }

  function renderArchiveItem(post) {
    return (
      '<article class="archive-item">' +
      '<span class="archive-mark" aria-hidden="true">✳</span>' +
      "<h3>" + titleLink(post) + "</h3>" +
      "<p>" + escapeHTML(post.author) + "</p>" +
      "</article>"
    );
  }

  async function initHome() {
    var gridEl = document.getElementById("home-blog-grid");
    var sectionEl = document.getElementById("home-blog-section");
    if (!gridEl || !window.CDSEPosts) return false;
    var posts = await window.CDSEPosts.getPosts();
    if (!posts.length) {
      if (sectionEl) sectionEl.style.display = "none";
    } else {
      gridEl.innerHTML = posts.slice(0, 3).map(renderCard).join("");
    }
    return true;
  }

  async function init() {
    if (await initHome()) return;
    var heroEl = document.getElementById("blog-hero");
    var latestGridEl = document.getElementById("latest-grid");
    var latestSectionEl = document.getElementById("latest-section");
    var archiveGridEl = document.getElementById("archive-grid");
    var archiveSectionEl = document.getElementById("archive-section");
    if (!heroEl || !window.CDSEPosts) return;

    var posts = await window.CDSEPosts.getPosts();
    if (!posts.length) {
      heroEl.innerHTML = "";
      if (latestSectionEl) latestSectionEl.style.display = "none";
      if (archiveSectionEl) archiveSectionEl.style.display = "none";
      var empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML = 'No posts yet — check back soon, or <a href="/submit-blog">submit the first one</a>.';
      heroEl.parentNode.appendChild(empty);
      return;
    }

    var hero = posts[0];
    var latest = posts.slice(1, 4);
    var archive = posts.slice(4);

    renderHero(hero, heroEl);

    if (latest.length && latestGridEl) {
      latestGridEl.innerHTML = latest.map(renderCard).join("");
    } else if (latestSectionEl) {
      latestSectionEl.style.display = "none";
    }

    if (archive.length && archiveGridEl) {
      archiveGridEl.innerHTML = archive.map(renderArchiveItem).join("");
    } else if (archiveSectionEl) {
      archiveSectionEl.style.display = "none";
    }
  }

  // One delegated listener for the whole page, not one per card.
  function wirePrefetch() {
    if (!window.CDSEPosts || !window.CDSEPosts.prefetch) return;
    function warm(node) {
      var a = node && node.closest ? node.closest("a[data-prefetch-slug]") : null;
      if (a) window.CDSEPosts.prefetch(a.getAttribute("data-prefetch-slug"));
    }
    document.addEventListener("pointerover", function (e) { warm(e.target); }, { passive: true });
    document.addEventListener("focusin", function (e) { warm(e.target); });
  }

  document.addEventListener("DOMContentLoaded", wirePrefetch);
  document.addEventListener("DOMContentLoaded", init);
})();
