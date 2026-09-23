// Renders the three-tier blog listing on blog.html using js/posts.js:
//   1. Hero — the single most recent post, big image, big fonts
//   2. Latest — the next three posts, as cards
//   3. Archives — everything else, as a compact text grid (asterisk mark,
//      underlined small-caps title, byline)
(function () {
  "use strict";

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function readMore(post) {
    return (
      '<a class="post-link" href="' + escapeHTML(post.external_url) +
      '" target="_blank" rel="noopener">Read full post →</a>'
    );
  }

  function renderHero(post, container) {
    container.innerHTML =
      '<div class="blog-hero-media" aria-hidden="true">CDSE Blog</div>' +
      '<span class="tag">Latest</span>' +
      "<h2>" + escapeHTML(post.title) + "</h2>" +
      '<p class="post-meta">' + escapeHTML(post.author) + "</p>" +
      '<p style="margin-top:1.25rem;">' + readMore(post) + "</p>";
  }

  function renderCard(post) {
    return (
      '<article class="post-card">' +
      "<h3>" + escapeHTML(post.title) + "</h3>" +
      '<p class="excerpt">' + escapeHTML(post.author) + "</p>" +
      '<p style="margin-top:0.4rem;">' + readMore(post) + "</p>" +
      "</article>"
    );
  }

  function renderArchiveItem(post) {
    return (
      '<article class="archive-item">' +
      '<span class="archive-mark" aria-hidden="true">✳</span>' +
      "<h3><a href=\"" + escapeHTML(post.external_url) + "\" target=\"_blank\" rel=\"noopener\">" +
      escapeHTML(post.title) + "</a></h3>" +
      "<p>" + escapeHTML(post.author) + "</p>" +
      "</article>"
    );
  }

  async function init() {
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
