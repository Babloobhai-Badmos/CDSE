// Editor page: sign in with Supabase Auth, manage posts, trigger audio generation.
// Access is enforced by the database (row-level security + the `editors` table),
// not by this page — hiding the UI is only a convenience.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.CDSE_CONFIG || {};
  var msg = $("admin-msg");
  var client = null;
  var posts = [];
  var current = null; // post row being edited, or null for a new post

  function say(text) { msg.textContent = text; msg.hidden = !text; }

  function show(which) {
    $("login-form").hidden = which !== "login";
    $("editor-ui").hidden = which !== "editor";
  }

  async function boot() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      say("Supabase isn't connected yet. Add the project URL and anon key to js/config.js (see docs/supabase-r2-setup.md).");
      return;
    }
    if (!window.supabase) { say("Could not load the Supabase library. Check your connection."); return; }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    var s = await client.auth.getSession();
    if (s.data.session) return enter(s.data.session.user); 
    say(""); show("login");
  }

  async function enter(user) {
    var r = await client.rpc("is_editor");
    if (r.error || r.data !== true) {
      await client.auth.signOut();
      say("This account isn't set up as an editor. Ask an existing editor to add you (see docs/supabase-r2-setup.md).");
      show("login");
      return;
    }
    $("who").textContent = "Signed in as " + user.email;
    say(""); show("editor");
    await loadPosts();
    fillForm(null);
  }

  async function loadPosts() {
    var r = await client.from("posts").select("*").order("published_at", { ascending: false, nullsFirst: false }).order("sort_order");
    if (r.error) { say("Couldn't load posts: " + r.error.message); return; }
    posts = r.data;
    var ul = $("post-list");
    ul.innerHTML = "";
    posts.forEach(function (p) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = p.title;
      var small = document.createElement("small");
      small.textContent = (p.published ? "Published" : "Draft") + (p.has_body ? "" : " · external") +
        (p.audio_status === "ready" ? " · audio" : p.audio_status === "failed" ? " · audio failed" : "");
      b.appendChild(small);
      if (current && current.id === p.id) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () { fillForm(p); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function fillForm(p) {
    current = p;
    $("form-heading").textContent = p ? "Edit post" : "New post";
    $("f-title").value = p ? p.title : "";
    $("f-slug").value = p ? p.slug : "";
    $("f-author").value = p ? p.author : "";
    $("f-body").value = p && p.body ? p.body : "";
    $("f-ext").value = p && p.external_url ? p.external_url : "";
    $("f-audio").value = p && p.audio_url ? p.audio_url : "";
    $("f-pub").checked = p ? p.published : false;
    if (!p) delete $("f-slug").dataset.touched;
    $("delete-post").hidden = !p;
    $("gen-audio").hidden = !p;
    audioStatus(p);
    Array.prototype.forEach.call($("post-list").querySelectorAll("button"), function (b, i) {
      if (p && posts[i] && posts[i].id === p.id) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }

  function audioStatus(p) {
    var t = "";
    if (p) {
      if (p.audio_status === "ready") t = "Audio is ready" + (p.audio_duration_seconds ? " (" + Math.round(p.audio_duration_seconds / 60) + " min)." : ".");
      else if (p.audio_status === "failed") t = "Last audio attempt failed: " + (p.audio_error || "unknown error");
      else if (p.audio_status === "queued") t = "Audio is being generated…";
    }
    $("audio-status").textContent = t;
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }

  $("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    say("Signing in…");
    var r = await client.auth.signInWithPassword({ email: $("login-email").value, password: $("login-password").value });
    if (r.error) { say("Sign-in failed: " + r.error.message); return; }
    enter(r.data.user);
  });

  $("logout").addEventListener("click", async function () {
    await client.auth.signOut();
    say("Signed out."); show("login");
  });

  $("new-post").addEventListener("click", function () { fillForm(null); $("f-title").focus(); });

  $("f-title").addEventListener("input", function () {
    if (!current && !$("f-slug").dataset.touched) $("f-slug").value = slugify($("f-title").value);
  });
  $("f-slug").addEventListener("input", function () { $("f-slug").dataset.touched = "1"; });

  $("post-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var body = $("f-body").value.trim();
    var ext = $("f-ext").value.trim();
    if (!body && !ext) { say("Add the post text, or a link to the original."); return; }
    var wasPublished = current ? current.published : false;
    var row = {
      title: $("f-title").value.trim(),
      slug: $("f-slug").value.trim(),
      author: $("f-author").value.trim(),
      body: body || null,
      external_url: ext || null,
      audio_url: $("f-audio").value.trim() || null,
      published: $("f-pub").checked,
    };
    if (row.published && !wasPublished) row.published_at = new Date().toISOString();
    // New text means the old generated audio no longer matches it.
    if (current && (current.body || "") !== (body || "") && current.audio_status === "ready") {
      row.audio_status = "none";
      if (current.audio_url === row.audio_url) row.audio_url = null;
    }
    say("Saving…");
    var r = current
      ? await client.from("posts").update(row).eq("id", current.id).select().single()
      : await client.from("posts").insert(row).select().single();
    if (r.error) { say("Couldn't save: " + r.error.message); return; }
    say("Saved.");
    current = r.data;
    await loadPosts();
    fillForm(r.data);
  });

  $("gen-audio").addEventListener("click", async function () {
    if (!current) return;
    if (!current.has_body) { say("Only posts with their own text can have audio. Save the text first."); return; }
    $("audio-status").textContent = "Generating audio… this can take up to a minute.";
    $("gen-audio").disabled = true;
    var r = await client.functions.invoke("generate-audio", { body: { post_id: current.id } });
    $("gen-audio").disabled = false;
    if (r.error) {
      var detail = r.error.message;
      try { var j = await r.error.context.json(); if (j && j.error) detail = j.error; } catch (x) {}
      $("audio-status").textContent = "Audio generation failed: " + detail;
      return;
    }
    await loadPosts();
    var fresh = posts.filter(function (p) { return p.id === current.id; })[0];
    fillForm(fresh || current);
    say("Audio generated.");
  });

  $("delete-post").addEventListener("click", async function () {
    if (!current || !window.confirm("Delete “" + current.title + "”? This cannot be undone.")) return;
    var r = await client.from("posts").delete().eq("id", current.id);
    if (r.error) { say("Couldn't delete: " + r.error.message); return; }
    say("Deleted.");
    current = null;
    await loadPosts();
    fillForm(null);
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
