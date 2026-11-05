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
    $("f-image").value = p && p.image_url ? p.image_url : "";
    $("f-image-alt").value = p && p.image_alt ? p.image_alt : "";
    $("f-audio").value = p && p.audio_url ? p.audio_url : "";
    if (p && p.audio_duration_seconds) $("f-audio").dataset.duration = String(p.audio_duration_seconds);
    else delete $("f-audio").dataset.duration;
    $("f-pub").checked = p ? p.published : false;
    if (!p) delete $("f-slug").dataset.touched;
    $("delete-post").hidden = !p;
    audioStatus(p);
    Array.prototype.forEach.call($("post-list").querySelectorAll("button"), function (b, i) {
      if (p && posts[i] && posts[i].id === p.id) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }

  function audioStatus(p) {
    var t = "";
    if (p && p.audio_status === "ready" && p.audio_url) {
      t = "Audio linked" + (p.audio_duration_seconds ? " (" + Math.round(p.audio_duration_seconds / 60) + " min)." : ".");
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
  // A URL typed or pasted by hand has no measured duration; don't reuse a stale one.
  $("f-audio").addEventListener("input", function () { delete $("f-audio").dataset.duration; });

  $("post-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var body = $("f-body").value.trim();
    var ext = $("f-ext").value.trim();
    if (!body && !ext) { say("Add the post text, or a link to the original."); return; }
    var wasPublished = current ? current.published : false;
    var audioUrl = $("f-audio").value.trim() || null;
    var row = {
      title: $("f-title").value.trim(),
      slug: $("f-slug").value.trim(),
      author: $("f-author").value.trim(),
      body: body || null,
      external_url: ext || null,
      image_url: $("f-image").value.trim() || null,
      image_alt: $("f-image-alt").value.trim() || null,
      audio_url: audioUrl,
      published: $("f-pub").checked,
    };
    if (row.published && !wasPublished) row.published_at = new Date().toISOString();
    // Any audio URL counts as ready to play — uploaded, generated or pasted.
    if (audioUrl) {
      row.audio_status = "ready";
      row.audio_error = null;
      var dur = parseInt($("f-audio").dataset.duration || "", 10);
      if (!isNaN(dur) && dur > 0) row.audio_duration_seconds = dur;
    } else {
      row.audio_status = "none";
      row.audio_duration_seconds = null;
    }
    // If the text changed but the same audio is being kept, ask first: a human
    // recording or an uploaded file shouldn't vanish without a warning.
    if (current && (current.body || "") !== (body || "") &&
        current.audio_url && row.audio_url === current.audio_url) {
      var keep = window.confirm(
        "This post's text has changed since its audio was made, so the recording may no longer match.\n\n" +
        "Keep the existing audio anyway?\n\nOK = keep it    Cancel = remove the audio link"
      );
      if (!keep) {
        row.audio_url = null;
        row.audio_status = "none";
        row.audio_duration_seconds = null;
      }
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

  // Reads an audio file's real length in the browser, so uploaded audio shows a
  // correct duration without the server needing ffprobe.
  function readAudioDuration(file) {
    return new Promise(function (resolve) {
      var url, probe;
      try {
        url = URL.createObjectURL(file);
        probe = new Audio();
        probe.preload = "metadata";
        probe.onloadedmetadata = function () {
          var d = probe.duration;
          URL.revokeObjectURL(url);
          resolve(isFinite(d) && d > 0 ? Math.round(d) : 0);
        };
        probe.onerror = function () { URL.revokeObjectURL(url); resolve(0); };
        probe.src = url;
      } catch (e) { resolve(0); }
    });
  }

  async function uploadFileToR2(file, kind) {
    var s = await client.auth.getSession();
    var token = s.data.session && s.data.session.access_token;
    if (!token) throw new Error("Signed out — sign in again.");
    var form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    var slugVal = $("f-slug").value.trim();
    if (slugVal) form.append("slug", slugVal);
    var res = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/functions/v1/upload-file", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, apikey: cfg.supabaseAnonKey },
      body: form,
    });
    var j = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(j.error || ("Upload failed: " + res.status));
    return j;
  }

  $("delete-post").addEventListener("click", async function () {
    if (!current || !window.confirm("Delete “" + current.title + "”? This cannot be undone.")) return;
    var r = await client.from("posts").delete().eq("id", current.id);
    if (r.error) { say("Couldn't delete: " + r.error.message); return; }
    say("Deleted.");
    current = null;
    await loadPosts();
    fillForm(null);
  });

  $("upload-audio").addEventListener("click", async function () {
    var input = $("f-audio-file");
    if (!input.files || !input.files.length) { say("Choose an audio file first."); return; }
    var btn = $("upload-audio");
    btn.disabled = true;
    $("audio-status").textContent = "Uploading audio to R2…";
    try {
      var out = await uploadFileToR2(input.files[0], "audio");
      var secs = await readAudioDuration(input.files[0]);
      $("f-audio").value = out.publicUrl;
      if (secs) $("f-audio").dataset.duration = String(secs); else delete $("f-audio").dataset.duration;
      var len = secs ? " · " + Math.round(secs / 60) + " min" : "";
      $("audio-status").textContent = "Audio uploaded (" + out.key + len + "). Press Save post to store the link in Supabase.";
      say("Audio uploaded — press Save post.");
    } catch (e) {
      $("audio-status").textContent = "Audio upload failed: " + e.message;
    }
    btn.disabled = false;
  });

  $("upload-image").addEventListener("click", async function () {
    var input = $("f-image-file");
    var box = $("image-upload-result");
    if (!input.files || !input.files.length) { say("Choose an image first."); return; }
    var btn = $("upload-image");
    btn.disabled = true;
    box.textContent = "Uploading image to R2…";
    try {
      var out = await uploadFileToR2(input.files[0], "image");
      $("f-image").value = out.publicUrl;
      // A short, useful default so the image is never published without alt text.
      if (!$("f-image-alt").value.trim()) {
        $("f-image-alt").value = $("f-title").value.trim() || "Cover image";
      }
      box.textContent = "Image uploaded (" + out.key + "). Press Save post to store it.";
      say("Cover image uploaded — press Save post.");
    } catch (e) {
      box.textContent = "Image upload failed: " + e.message;
    }
    btn.disabled = false;
  });

  $("upload-media").addEventListener("click", async function () {
    var input = $("f-media-file");
    var box = $("upload-result");
    if (!input.files || !input.files.length) { say("Choose a file first."); return; }
    var f = input.files[0];
    var kind = f.type.indexOf("image/") === 0 ? "image" : "file";
    var btn = $("upload-media");
    btn.disabled = true;
    box.textContent = "Uploading to R2…";
    try {
      var out2 = await uploadFileToR2(f, kind);
      box.innerHTML = "";
      var a = document.createElement("a");
      a.href = out2.publicUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = out2.publicUrl;
      box.appendChild(document.createTextNode("Uploaded (" + out2.key + "): "));
      box.appendChild(a);
      say("File uploaded — link ready. Press Save post if this belongs to the current post (e.g. paste into Audio URL).");
    } catch (e2) {
      box.textContent = "Upload failed: " + e2.message;
    }
    btn.disabled = false;
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
