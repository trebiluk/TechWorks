/* KZ 1.12.0 — Chromebook speech. Tap only. Same words as the line. No flag stored. */
(function () {
  var pending = false;
  var lastText = "";
  var kick = null;
  var waitVoice = null;
  var onDone = null;
  var alive = null;

  function supported() {
    return typeof window.speechSynthesis !== "undefined";
  }

  function speaking() {
    return pending;
  }

  function current() {
    return lastText;
  }

  function clearKick() {
    if (kick) {
      clearInterval(kick);
      kick = null;
    }
  }

  function finish() {
    clearKick();
    pending = false;
    lastText = "";
    alive = null;
    var fn = onDone;
    onDone = null;
    if (fn) fn();
  }

  function stop() {
    if (waitVoice) {
      try { window.speechSynthesis.removeEventListener("voiceschanged", waitVoice); } catch (e) {}
      waitVoice = null;
    }
    try { if (supported()) window.speechSynthesis.cancel(); } catch (e) {}
    finish();
  }

  function pickVoice(code) {
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
    var want = code === "es" ? "es" : "en";
    var local = null;
    var any = null;
    var i, v;
    for (i = 0; i < voices.length; i++) {
      v = voices[i];
      if ((v.lang || "").toLowerCase().indexOf(want) === 0) {
        if (v.localService && !local) local = v;
        if (!any) any = v;
      }
    }
    return local || any;
  }

  function start(text, code) {
    if (!pending) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = code === "es" ? "es-US" : "en-US";
    u.rate = 0.92;
    u.pitch = 1;
    var voice = pickVoice(code);
    if (voice) { try { u.voice = voice; } catch (e) {} }
    u.onend = function () { if (alive === u) finish(); };
    u.onerror = function () { if (alive === u) finish(); };
    alive = u;
    try { window.speechSynthesis.resume(); } catch (e) {}
    window.speechSynthesis.speak(u);
    clearKick();
    kick = setInterval(function () {
      if (!pending) { clearKick(); return; }
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) return;
      try { window.speechSynthesis.resume(); } catch (e) {}
    }, 10000);
  }

  function speak(text, code, done) {
    if (!supported()) { if (done) done(); return false; }
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (!text) { if (done) done(); return false; }
    stop();
    onDone = done || null;
    pending = true;
    lastText = text;
    var go = function () { setTimeout(function () { start(text, code); }, 60); };
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
    if (!voices.length) {
      var fired = false;
      waitVoice = function () {
        if (fired) return;
        fired = true;
        try { window.speechSynthesis.removeEventListener("voiceschanged", waitVoice); } catch (e) {}
        waitVoice = null;
        go();
      };
      window.speechSynthesis.addEventListener("voiceschanged", waitVoice);
      try { window.speechSynthesis.getVoices(); } catch (e) {}
      setTimeout(function () {
        if (!waitVoice) return;
        waitVoice();
      }, 400);
    } else {
      go();
    }
    return true;
  }

  window.KZSpeak = { speak: speak, stop: stop, speaking: speaking, current: current, supported: supported };
})();
