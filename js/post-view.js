// Renders a single blog post on post.html (?slug=...), with its audio player.
//
// Tuned for long reads:
//   - a contents list when the post has 3+ headings (jump links with anchors)
//   - a reading-progress bar (decorative, hidden from assistive technology)
//   - real <title>/description/OG tags for the post rather than the shell's
//   - the post is fetched once and cached by js/posts.js (see prefetch there)
// Post text is only ever inserted with textContent, so it can never inject HTML.
(function () {
  "use strict";

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function setStatus(text) {
    var el = document.getElementById("post-status");
    if (!el) return;
    el.textContent = text || "";
    el.hidden = !text;
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

  // Updates a meta tag, creating it if the page shell doesn't already have one
  // (og:image:alt and twitter:image are added only when a post has a cover).
  function setMeta(selector, value) {
    var m = document.head.querySelector(selector);
    if (!m) {
      var byName = selector.match(/^meta\[name="(.+)"\]$/);
      var byProp = selector.match(/^meta\[property="(.+)"\]$/);
      if (!byName && !byProp) return;
      m = document.createElement("meta");
      if (byName) m.setAttribute("name", byName[1]);
      else m.setAttribute("property", byProp[1]);
      document.head.appendChild(m);
    }
    m.setAttribute("content", value);
  }

  function descriptionFor(post) {
    if (post.summary) return post.summary;
    var flat = String(post.body || "").replace(/^##\s*/gm, "").replace(/\s+/g, " ").trim();
    if (!flat) return "A CDSE blog post on disability rights, accessibility, and inclusive policy.";
    if (flat.length <= 155) return flat;
    return flat.slice(0, 152).replace(/[\s,;:.!?]+\S*$/, "") + "…";
  }

  // The shell in post.html carries generic tags for crawlers that don't run JS;
  // this corrects them for the tab, history and clients that do.
  function applyMeta(post) {
    var desc = descriptionFor(post);
    document.title = post.title + " — CDSE, NLU Jodhpur";
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', post.title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[name="twitter:title"]', post.title);
    setMeta('meta[name="twitter:description"]', desc);
    if (post.imageUrl) {
      setMeta('meta[property="og:image"]', post.imageUrl);
      setMeta('meta[name="twitter:image"]', post.imageUrl);
      setMeta('meta[property="og:image:alt"]', post.imageAlt || post.title);
    }
    try {
      var url = new URL(window.location.href);
      url.search = "?slug=" + encodeURIComponent(post.slug);
      setMeta('meta[property="og:url"]', url.toString());
      var canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url.toString();
    } catch (e) { /* URL unavailable — skip canonical */ }
  }

  function slugifyHeading(text) {
    var s = String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    // Cut on a word boundary so anchors don't end mid-word.
    if (s.length > 60) s = s.slice(0, 60).replace(/-[^-]*$/, "");
    return s;
  }

  function renderBody(body) {
    var wrap = h("div", "post-body");
    var headings = [];
    var seen = {};
    body.split(/\n\s*\n/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      if (block.indexOf("## ") === 0) {
        // A heading block should be "## Title" alone, but tolerate an editor
        // writing the next paragraph straight after it on the next line.
        var nl = block.indexOf("\n");
        var label = (nl === -1 ? block.slice(3) : block.slice(3, nl)).trim();
        if (label) {
          var id = slugifyHeading(label) || "section";
          if (seen[id]) { seen[id] += 1; id = id + "-" + seen[id]; } else { seen[id] = 1; }
          var heading = h("h2", null, label);
          heading.id = id;
          wrap.appendChild(heading);
          headings.push({ id: id, label: label });
        }
        var rest = nl === -1 ? "" : block.slice(nl + 1).trim();
        if (rest) wrap.appendChild(h("p", null, rest));
      } else {
        wrap.appendChild(h("p", null, block));
      }
    });
    return { el: wrap, headings: headings };
  }

  // Only worth showing when the post actually has structure to navigate.
  function renderToc(headings) {
    var nav = h("nav", "post-toc");
    nav.setAttribute("aria-labelledby", "post-toc-title");
    var title = h("h2", "post-toc-title", "Contents");
    title.id = "post-toc-title";
    nav.appendChild(title);
    var list = document.createElement("ol");
    headings.forEach(function (hd) {
      var li = document.createElement("li");
      var a = h("a", null, hd.label);
      a.href = "#" + hd.id;
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);
    return nav;
  }

  function mountProgress() {
    if (document.querySelector(".read-progress")) return;
    var bar = h("div", "read-progress");
    bar.setAttribute("aria-hidden", "true");
    var fill = h("span", "read-progress-fill");
    bar.appendChild(fill);
    document.body.appendChild(bar);

    var queued = false;
    function update() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = "scaleX(" + pct.toFixed(4) + ")";
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  function readMinutes(body) {
    var words = body.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  async function init() {
    var root = document.getElementById("post-root");
    if (!root || !window.CDSEPosts) return;

    var slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      setStatus("");
      return message(root, "No post selected.", "/blogs", "Browse all blogs");
    }

    var post;
    try {
      post = await window.CDSEPosts.getPost(slug);
    } catch (e) {
      setStatus("");
      return message(root, "We couldn't load that post just now.", "/blogs", "Browse all blogs");
    }

    setStatus("");
    if (!post) return message(root, "We couldn't find that post.", "/blogs", "Browse all blogs");

    applyMeta(post);
    root.innerHTML = "";

    var back = h("a", "post-back", "← All blogs");
    back.href = "/blogs";
    root.appendChild(back);

    root.appendChild(h("h1", "post-title", post.title));
    root.appendChild(h("p", "post-meta", post.author));

    if (post.imageUrl) {
      var cover = h("img", "post-hero-image");
      cover.src = post.imageUrl;
      cover.alt = post.imageAlt || post.title;
      cover.decoding = "async";
      cover.setAttribute("fetchpriority", "high");
      root.appendChild(cover);
    }

    if (!post.hasBody) {
      root.appendChild(h("p", "post-external", "This post is hosted on the original CDSE site. "));
      var link = h("a", "btn btn-secondary", "Read the full post");
      link.href = post.externalUrl;
      link.target = "_blank";
      link.rel = "noopener";
      root.appendChild(link);
      return;
    }

    var audioHost = h("div", "post-audio");
    root.appendChild(audioHost);
    root.appendChild(h("p", "post-readtime", readMinutes(post.body) + " min read"));

    if (post.audioUrl) {
      window.CDSEAudio.mountFile(audioHost, {
        src: post.audioUrl, title: post.title, author: post.author, duration: post.audioDuration,
      });
    } else if (window.CDSEAudio.speechSupported()) {
      window.CDSEAudio.mountSpeech(audioHost, { text: post.body, title: post.title });
    }

    var rendered = renderBody(post.body);
    if (rendered.headings.length >= 3) root.appendChild(renderToc(rendered.headings));
    root.appendChild(rendered.el);

    mountProgress();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
