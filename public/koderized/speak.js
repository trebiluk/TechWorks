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

  var LANG_OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };

  function langOk(code) {
    return LANG_OK[code] ? code : "en";
  }

  function noVoiceLine() {
    try {
      if (window.KulibertI18n && KulibertI18n.t) {
        var v = KulibertI18n.t("noVoice");
        if (v) return v;
      }
    } catch (e) {}
    return "No voice yet. Read the words.";
  }

  function pickVoice(code) {
    var want = langOk(code);
    if (window.KulibertPrefs && typeof KulibertPrefs.voiceFor === "function") {
      try { return KulibertPrefs.voiceFor(want); } catch (e) { return null; }
    }
    var voices = [];
    try { voices = window.speechSynthesis.getVoices() || []; } catch (e2) { voices = []; }
    var tag = want === "es" ? "es" : want === "uk" ? "uk" : want === "ru" ? "ru" : want === "ar" ? "ar" : want === "fa-AF" ? "fa" : want === "en" || want === "simple" ? "en" : "";
    if (!tag) return null;
    var i, v;
    for (i = 0; i < voices.length; i++) {
      v = voices[i];
      if ((v.lang || "").toLowerCase().replace(/_/g, "-").indexOf(tag) === 0) return v;
    }
    return null;
  }

  function start(text, code) {
    if (!pending) return;
    var u = new SpeechSynthesisUtterance(text);
    var voice = pickVoice(code);
    if (!voice) return;
    u.lang = voice.lang || "en-US";
    u.onend = function () { if (alive === u) finish(); };
    u.onerror = function () { if (alive === u) finish(); };
    u.rate = code === "simple" ? 0.85 : 0.95;
    u.pitch = 1;
    try { u.voice = voice; } catch (e) {}
    alive = u;
    try { window.speechSynthesis.resume(); } catch (e2) {}
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

  var ACCESS_KEY = "kz-access-v1";

  function readAccess() {
    try {
      var raw = JSON.parse(localStorage.getItem(ACCESS_KEY) || "null");
      if (!raw || typeof raw !== "object") {
        raw = {
          lang: localStorage.getItem("kz-lang") === "es" ? "es" : "en",
          speak: false,
          big: localStorage.getItem("kz-big") === "1",
          fewer: false
        };
      }
      var lang = langOk(raw.lang);
      return { lang: lang, speak: !!raw.speak, big: !!raw.big, fewer: !!raw.fewer };
    } catch (e) {
      return { lang: "en", speak: false, big: false, fewer: false };
    }
  }

  function writeAccess(next) {
    var lang = langOk(next.lang);
    var clean = { lang: lang, speak: !!next.speak, big: !!next.big, fewer: !!next.fewer };
    try { localStorage.setItem(ACCESS_KEY, JSON.stringify(clean)); } catch (e) {}
    document.documentElement.dataset.big = clean.big ? "1" : "0";
    document.documentElement.dataset.lang = clean.lang;
    try { window.dispatchEvent(new Event("kz-access")); } catch (e) {}
    return clean;
  }

  function paintCaption(text) {
    var el = document.getElementById("kz-caption");
    if (!el) return;
    el.textContent = String(text || "").replace(/\s+/g, " ").trim();
  }

  function say(text, code) {
    var words = String(text || "").replace(/\s+/g, " ").trim();
    var use = langOk(code || readAccess().lang);
    if (!pickVoice(use)) {
      paintCaption(words ? words + " " + noVoiceLine() : noVoiceLine());
      return false;
    }
    paintCaption(words);
    return speak(words, use);
  }
  function stopSay() { stop(); }

  window.say = say;
  window.stopSay = stopSay;
  window.readAccess = readAccess;
  window.writeAccess = writeAccess;
  window.KZSpeak = { speak: speak, stop: stop, say: say, stopSay: stopSay, speaking: speaking, current: current, supported: supported, readAccess: readAccess, writeAccess: writeAccess };
})();
