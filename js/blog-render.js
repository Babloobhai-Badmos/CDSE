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
    return (
      '<a href="' + escapeHTML(post.external_url) + '" target="_blank" rel="noopener">' +
      escapeHTML(post.title) + "</a>"
    );
  }

  function renderHero(post, container) {
    container.innerHTML =
      '<div class="blog-hero-media" aria-hidden="true">CDSE Blog</div>' +
      "<div>" +
      '<span class="tag">Latest</span>' +
      "<h2>" + titleLink(post) + "</h2>" +
      '<p class="post-meta">' + escapeHTML(post.author) + "</p>" +
      "</div>";
  }

  function renderCard(post) {
    return (
      '<article class="post-card">' +
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
      empty.innerHTML = 'No posts yet — check back soon, or <a href="submit-blog.html">submit the first one</a>.';
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

  document.addEventListener("DOMContentLoaded", init);
})();
