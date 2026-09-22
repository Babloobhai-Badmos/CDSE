// Renders the Medium-style blog listing on blog.html using js/posts.js.
(function () {
  "use strict";

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function readMore(post) {
    if (post.external_url) {
      return (
        '<a class="post-link" href="' + escapeHTML(post.external_url) +
        '" target="_blank" rel="noopener">Read on ' + escapeHTML(post.external_source) + " →</a>"
      );
    }
    return '<span class="post-link" aria-hidden="true">Full story coming soon</span>';
  }

  function metaLine(post) {
    return (
      '<p class="post-meta">' + escapeHTML(post.author) +
      '<span class="dot">·</span>' + escapeHTML(window.CDSEPosts.formatDate(post.published_at)) +
      '<span class="dot">·</span>' + post.read_time_minutes + " min read</p>"
    );
  }

  function imageOrPlaceholder(post, className) {
    if (post.image_url) {
      return '<img src="' + escapeHTML(post.image_url) + '" alt="" class="' + className + '">';
    }
    return (
      '<div class="' + className + '" style="display:flex;align-items:center;justify-content:center;' +
      'background:#111;color:#fff;font-family:Cardo,serif;font-style:italic;font-size:1.1rem;text-align:center;padding:1rem;">' +
      escapeHTML(post.tag) + "</div>"
    );
  }

  function renderFeatured(post, container) {
    container.innerHTML =
      '<article class="featured-post">' +
      imageOrPlaceholder(post, "") +
      "<div>" +
      '<span class="tag">' + escapeHTML(post.tag) + "</span>" +
      "<h2>" + escapeHTML(post.title) + "</h2>" +
      '<p class="excerpt">' + escapeHTML(post.excerpt) + "</p>" +
      metaLine(post) +
      '<p style="margin-top:1rem;">' + readMore(post) + "</p>" +
      "</div>" +
      "</article>";
  }

  function renderCard(post) {
    return (
      '<article class="post-card">' +
      imageOrPlaceholder(post, "") +
      '<span class="tag">' + escapeHTML(post.tag) + "</span>" +
      "<h3>" + escapeHTML(post.title) + "</h3>" +
      '<p class="excerpt">' + escapeHTML(post.excerpt) + "</p>" +
      metaLine(post) +
      '<p style="margin-top:0.6rem;">' + readMore(post) + "</p>" +
      "</article>"
    );
  }

  async function init() {
    var featuredEl = document.getElementById("featured-post");
    var gridEl = document.getElementById("post-grid");
    var tabsEl = document.getElementById("blog-tabs");
    if (!featuredEl || !gridEl || !window.CDSEPosts) return;

    var posts = await window.CDSEPosts.getPosts();
    if (!posts.length) {
      featuredEl.innerHTML = "";
      gridEl.innerHTML = '<div class="empty-state">No posts yet — check back soon, or <a href="#submit">submit the first one</a>.</div>';
      return;
    }

    var featured = posts[0];
    var rest = posts.slice(1);

    renderFeatured(featured, featuredEl);
    gridEl.innerHTML = rest.map(renderCard).join("");

    if (tabsEl) {
      var tags = ["All"].concat(
        Array.from(new Set(posts.map(function (p) { return p.tag; })))
      );
      tabsEl.innerHTML = tags
        .map(function (tag, i) {
          return (
            '<button type="button" class="blog-tab' + (i === 0 ? " active" : "") +
            '" data-tag="' + escapeHTML(tag) + '">' + escapeHTML(tag) + "</button>"
          );
        })
        .join("");

      tabsEl.addEventListener("click", function (event) {
        var btn = event.target.closest(".blog-tab");
        if (!btn) return;
        tabsEl.querySelectorAll(".blog-tab").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        var tag = btn.getAttribute("data-tag");
        var filtered = tag === "All" ? posts : posts.filter(function (p) { return p.tag === tag; });
        if (!filtered.length) {
          featuredEl.innerHTML = "";
          gridEl.innerHTML = '<div class="empty-state">No posts under "' + escapeHTML(tag) + '" yet.</div>';
          return;
        }
        renderFeatured(filtered[0], featuredEl);
        gridEl.innerHTML = filtered.slice(1).map(renderCard).join("");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
