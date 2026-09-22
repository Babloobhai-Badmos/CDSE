// Renders the Medium-style blog archive on blog.html using js/posts.js.
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

  function renderFeatured(post, container) {
    container.innerHTML =
      '<article class="featured-post">' +
      '<div style="display:flex;align-items:center;justify-content:center;' +
      'background:#111;color:#fff;font-family:Cardo,serif;font-style:italic;' +
      'font-size:1.1rem;text-align:center;padding:1.5rem;aspect-ratio:4/3;border-radius:10px;">' +
      "CDSE Blog</div>" +
      "<div>" +
      '<span class="tag">Latest</span>' +
      "<h2>" + escapeHTML(post.title) + "</h2>" +
      '<p class="post-meta">' + escapeHTML(post.author) + "</p>" +
      '<p style="margin-top:1rem;">' + readMore(post) + "</p>" +
      "</div>" +
      "</article>";
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

  async function init() {
    var featuredEl = document.getElementById("featured-post");
    var gridEl = document.getElementById("post-grid");
    if (!featuredEl || !gridEl || !window.CDSEPosts) return;

    var posts = await window.CDSEPosts.getPosts();
    if (!posts.length) {
      featuredEl.innerHTML = "";
      gridEl.innerHTML = '<div class="empty-state">No posts yet — check back soon, or <a href="#submit">submit the first one</a>.</div>';
      return;
    }

    renderFeatured(posts[0], featuredEl);
    gridEl.innerHTML = posts.slice(1).map(renderCard).join("");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
