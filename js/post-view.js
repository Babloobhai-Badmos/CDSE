// Renders a single blog post on post.html (?slug=...), with its audio player.
(function () {
  "use strict";

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text; // textContent only: post text is never parsed as HTML
    return n;
  }

  function message(root, text, linkHref, linkText) {
    root.innerHTML = "";
    var p = h("p", "empty-state", text + " ");
    if (linkHref) {
      var a = h("a", null, linkText);
      a.href = linkHref;
      p.appendChild(a);
    }
    root.appendChild(p);
  }

  function renderBody(body) {
    var wrap = h("div", "post-body");
    body.split(/\n\s*\n/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      if (block.indexOf("## ") === 0) wrap.appendChild(h("h2", null, block.slice(3).trim()));
      else wrap.appendChild(h("p", null, block));
    });
    return wrap;
  }

  async function init() {
    var root = document.getElementById("post-root");
    if (!root || !window.CDSEPosts) return;
    var slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) return message(root, "No post selected.", "blogs.html", "Browse all blogs");

    var post = await window.CDSEPosts.getPost(slug);
    if (!post) return message(root, "We couldn't find that post.", "blogs.html", "Browse all blogs");

    document.title = post.title + " — CDSE, NLU Jodhpur";
    root.innerHTML = "";

    root.appendChild(h("a", "post-back", "← All blogs")).href = "blogs.html";
    root.appendChild(h("h1", "post-title", post.title));
    root.appendChild(h("p", "post-meta", post.author));

    if (!post.hasBody) {
      var note = h("p", "post-external", "This post is hosted on the original CDSE site. ");
      var link = h("a", "btn btn-secondary", "Read the full post");
      link.href = post.externalUrl;
      link.target = "_blank";
      link.rel = "noopener";
      root.appendChild(note);
      root.appendChild(link);
      return;
    }

    var audioHost = h("div", "post-audio");
    root.appendChild(audioHost);
    var words = post.body.trim().split(/\s+/).length;
    var minutes = Math.max(1, Math.round(words / 200));
    root.appendChild(h("p", "post-readtime", minutes + " min read"));

    if (post.audioUrl) {
      window.CDSEAudio.mountFile(audioHost, {
        src: post.audioUrl, title: post.title, author: post.author, duration: post.audioDuration,
      });
    } else if (window.CDSEAudio.speechSupported()) {
      window.CDSEAudio.mountSpeech(audioHost, { text: post.body, title: post.title });
    }

    root.appendChild(renderBody(post.body));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
