// Accessible audio players for blog posts.
//   CDSEAudio.mountFile(el, { src, title, author })  - plays a pre-generated MP3
//   CDSEAudio.mountSpeech(el, { text, title })       - browser read-aloud fallback
// Native <button>/<input>/<select> controls are used throughout so they work
// with screen readers and keyboards; nothing autoplays.
(function (window) {
  "use strict";

  var SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function spoken(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + " minutes " + s + " seconds";
  }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function speedSelect(id, onChange) {
    var wrap = el("div", { class: "ap-speed" });
    wrap.appendChild(el("label", { for: id }, "Speed"));
    var sel = el("select", { id: id });
    SPEEDS.forEach(function (v) {
      var o = el("option", { value: String(v) }, v + "x");
      if (v === 1) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { onChange(parseFloat(sel.value)); });
    wrap.appendChild(sel);
    return wrap;
  }

  function mountFile(container, opts) {
    var uid = "ap" + Math.random().toString(36).slice(2, 8);
    var key = "cdse-audio-pos:" + opts.src;
    var audio = el("audio", { preload: "none", src: opts.src });
    var root = el("div", { class: "audio-player", role: "group", "aria-label": "Audio version of this post" });
    root.appendChild(el("p", { class: "ap-title" }, "Listen to this post"));

    var controls = el("div", { class: "ap-controls" });
    var back = el("button", { type: "button", class: "ap-btn", "aria-label": "Back 15 seconds" }, "−15s");
    var play = el("button", { type: "button", class: "ap-btn ap-play", "aria-label": "Play" }, "Play");
    var fwd = el("button", { type: "button", class: "ap-btn", "aria-label": "Forward 30 seconds" }, "+30s");
    controls.appendChild(back); controls.appendChild(play); controls.appendChild(fwd);
    controls.appendChild(speedSelect(uid + "-speed", function (v) { audio.playbackRate = v; }));
    root.appendChild(controls);

    var seekRow = el("div", { class: "ap-seek" });
    var cur = el("span", { class: "ap-time", "aria-hidden": "true" }, "0:00");
    var seek = el("input", { type: "range", min: "0", max: "100", step: "1", value: "0", "aria-label": "Seek" });
    var dur = el("span", { class: "ap-time", "aria-hidden": "true" }, opts.duration ? fmt(opts.duration) : "–:––");
    seekRow.appendChild(cur); seekRow.appendChild(seek); seekRow.appendChild(dur);
    root.appendChild(seekRow);

    var status = el("p", { class: "ap-status", role: "status", "aria-live": "polite" });
    root.appendChild(status);
    var dl = el("a", { class: "ap-download", href: opts.src, download: "" }, "Download audio (MP3)");
    root.appendChild(dl);
    root.appendChild(audio);
    container.appendChild(root);

    function setPlayLabel(playing) {
      play.textContent = playing ? "Pause" : "Play";
      play.setAttribute("aria-label", playing ? "Pause" : "Play");
    }
    function savePos() {
      try { localStorage.setItem(key, String(Math.floor(audio.currentTime))); } catch (e) {}
    }
    function updateSeek() {
      if (audio.duration && isFinite(audio.duration)) {
        seek.max = String(Math.floor(audio.duration));
        dur.textContent = fmt(audio.duration);
      }
      seek.value = String(Math.floor(audio.currentTime));
      seek.setAttribute("aria-valuetext", spoken(audio.currentTime));
      cur.textContent = fmt(audio.currentTime);
    }

    play.addEventListener("click", function () {
      if (audio.paused) {
        status.textContent = "";
        audio.play().catch(function () {
          status.textContent = "Sorry, the audio could not be played. You can download it instead.";
        });
      } else {
        audio.pause();
      }
    });
    back.addEventListener("click", function () { audio.currentTime = Math.max(0, audio.currentTime - 15); updateSeek(); });
    fwd.addEventListener("click", function () {
      audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 30); updateSeek();
    });
    seek.addEventListener("input", function () { audio.currentTime = parseFloat(seek.value); cur.textContent = fmt(audio.currentTime); });
    audio.addEventListener("play", function () { setPlayLabel(true); });
    audio.addEventListener("pause", function () { setPlayLabel(false); savePos(); });
    audio.addEventListener("ended", function () {
      setPlayLabel(false);
      try { localStorage.removeItem(key); } catch (e) {}
      status.textContent = "Finished.";
    });
    audio.addEventListener("loadedmetadata", function () {
      updateSeek();
      var saved = 0;
      try { saved = parseInt(localStorage.getItem(key), 10) || 0; } catch (e) {}
      if (saved > 5 && saved < audio.duration - 5) {
        audio.currentTime = saved;
        status.textContent = "Resumed from " + spoken(saved) + ".";
      }
    });
    audio.addEventListener("timeupdate", function () {
      updateSeek();
      if (Math.floor(audio.currentTime) % 5 === 0) savePos();
    });
    audio.addEventListener("waiting", function () { status.textContent = "Loading audio…"; });
    audio.addEventListener("playing", function () { status.textContent = ""; });
    audio.addEventListener("error", function () {
      setPlayLabel(false);
      status.textContent = "Sorry, this audio could not be loaded. Try the download link, or read the text below.";
    });

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: opts.title || "CDSE blog", artist: opts.author || "CDSE", album: "CDSE Blog",
        });
        navigator.mediaSession.setActionHandler("play", function () { audio.play(); });
        navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); });
        navigator.mediaSession.setActionHandler("seekbackward", function () { audio.currentTime = Math.max(0, audio.currentTime - 15); });
        navigator.mediaSession.setActionHandler("seekforward", function () { audio.currentTime += 30; });
      } catch (e) {}
    }
    return root;
  }

  function speechSupported() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  // Browser read-aloud. Text is spoken paragraph by paragraph because some
  // browsers silently stop on very long utterances.
  function mountSpeech(container, opts) {
    if (!speechSupported()) return null;
    var uid = "ap" + Math.random().toString(36).slice(2, 8);
    var synth = window.speechSynthesis;
    var paras = (opts.title ? [opts.title + "."] : []).concat(
      String(opts.text || "").split(/\n\s*\n/).map(function (p) { return p.replace(/^##\s*/, "").trim(); })
    ).filter(Boolean);
    var idx = 0, rate = 1, playing = false;

    var root = el("div", { class: "audio-player", role: "group", "aria-label": "Read this post aloud" });
    root.appendChild(el("p", { class: "ap-title" }, "Listen to this post"));
    root.appendChild(el("p", { class: "ap-note" }, "Read aloud by your device's voice. Quality depends on your browser."));
    var controls = el("div", { class: "ap-controls" });
    var play = el("button", { type: "button", class: "ap-btn ap-play", "aria-label": "Play" }, "Play");
    var stop = el("button", { type: "button", class: "ap-btn", "aria-label": "Stop and go back to the start" }, "Stop");
    controls.appendChild(play); controls.appendChild(stop);
    controls.appendChild(speedSelect(uid + "-speed", function (v) {
      rate = v;
      if (playing) { synth.cancel(); speakFrom(idx); }
    }));
    root.appendChild(controls);
    var status = el("p", { class: "ap-status", role: "status", "aria-live": "polite" });
    root.appendChild(status);
    container.appendChild(root);

    function setPlayLabel() {
      play.textContent = playing ? "Pause" : "Play";
      play.setAttribute("aria-label", playing ? "Pause" : "Play");
    }
    function pickVoice(u) {
      var voices = synth.getVoices();
      var v = voices.filter(function (x) { return /^en[-_]IN/i.test(x.lang); })[0] ||
              voices.filter(function (x) { return /^en/i.test(x.lang); })[0];
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "en-IN"; }
    }
    function speakFrom(i) {
      idx = i;
      if (idx >= paras.length) {
        playing = false; idx = 0; setPlayLabel(); status.textContent = "Finished."; return;
      }
      var u = new window.SpeechSynthesisUtterance(paras[idx]);
      u.rate = rate; pickVoice(u);
      u.onend = function () { if (playing) speakFrom(idx + 1); };
      u.onerror = function (e) {
        if (e.error === "canceled" || e.error === "interrupted") return;
        playing = false; setPlayLabel(); status.textContent = "Sorry, read-aloud isn't working on this device.";
      };
      synth.speak(u);
    }
    play.addEventListener("click", function () {
      status.textContent = "";
      if (playing) { playing = false; synth.cancel(); setPlayLabel(); status.textContent = "Paused."; return; }
      playing = true; setPlayLabel(); synth.cancel(); speakFrom(idx);
    });
    stop.addEventListener("click", function () {
      playing = false; idx = 0; synth.cancel(); setPlayLabel(); status.textContent = "Stopped.";
    });
    window.addEventListener("pagehide", function () { synth.cancel(); });
    return root;
  }

  window.CDSEAudio = { mountFile: mountFile, mountSpeech: mountSpeech, speechSupported: speechSupported };
})(window);
