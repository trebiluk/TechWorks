/* Kulibert shop alias. Same Chromebook. No real names. Other apps can load /shared/kw-who.js.
   A verified record uses the TechWorks 5-character code. Old v1 records stay unverified. */
(function (root) {
  var WHO = "kw-who-v1";
  var BAG = "kw-bag-v1";
  var OUT = "kw-outbox-v1";
  var ALIAS_FLAG = "kw-hub-aliases";
  var SESSION = "kw-session-v1";
  var DAY = 10 * 60 * 60 * 1000;
  function clean(raw) {
    return String(raw || "").replace(/[^\p{L}\p{N} \-']/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
  }
  function cleanCode(raw) {
    return String(raw || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
  }
  function codeOf(alias) {
    var s = alias.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
    if (!s) return "";
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var n = (h >>> 0) % (chars.length * chars.length);
    return s.toUpperCase() + "-" + chars[Math.floor(n / chars.length)] + chars[n % chars.length];
  }
  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(WHO) || "null");
      var alias = clean(raw && raw.alias);
      if (!alias) return null;
      var tw = cleanCode(raw && raw.code);
      if (raw && raw.v === 2 && raw.verified === true && tw.length === 5) {
        return { alias: alias, code: tw, verified: true, at: Number(raw.at) || 0 };
      }
      var legacy = raw && raw.code ? String(raw.code) : codeOf(alias);
      return legacy ? { alias: alias, code: legacy, verified: false } : null;
    } catch (e) {
      return null;
    }
  }
  function aliasesOn() {
    try { return localStorage.getItem(ALIAS_FLAG) !== "0"; } catch (e) { return true; }
  }
  function active() {
    var who = read();
    if (!who || !who.verified) return false;
    try { if (sessionStorage.getItem(SESSION) === "1") return true; } catch (e) {}
    return !!(who.at && (Date.now() - who.at) < DAY);
  }
  function forget() {
    try { localStorage.removeItem(WHO); } catch (e) {}
  }
  function loadBag() {
    var bag = { v: 1, kids: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(BAG) || "null");
      if (parsed && parsed.v === 1 && parsed.kids) bag = parsed;
    } catch (e) {}
    return bag;
  }
  function saveBag(bag) {
    try { localStorage.setItem(BAG, JSON.stringify(bag)); } catch (e) {}
  }
  function pending() {
    try {
      var rows = JSON.parse(localStorage.getItem(OUT) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }
  function writePending(rows) {
    try { localStorage.setItem(OUT, JSON.stringify(rows.slice(-40))); } catch (e) {}
  }
  function enqueue(alias, code, id, text) {
    var rows = pending().filter(function (row) {
      return !(row && row.code === code && row.app === id);
    });
    rows.push({ alias: alias, code: code, app: id, line: text, saved: new Date().toISOString() });
    writePending(rows);
  }
  function clipLine(raw) {
    return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 32);
  }
  function lineText(id, row) {
    if (!row) return "";
    if (row.line) return String(row.line);
    if (id === "berty-run" && row.stamps != null) return String(row.stamps) + " stamps";
    return "";
  }
  function rekeyBag(alias, code) {
    var bag = loadBag();
    var merged = bag.kids[code] || { alias: alias, apps: {} };
    merged.alias = alias;
    var moved = false;
    var queueIds = {};
    Object.keys(bag.kids).forEach(function (key) {
      if (key === code) return;
      var kid = bag.kids[key];
      if (!kid || clean(kid.alias).toLowerCase() !== alias.toLowerCase()) return;
      var apps = kid.apps || {};
      Object.keys(apps).forEach(function (id) {
        var prev = merged.apps[id] || {};
        var next = apps[id] || {};
        var prevAt = prev.saved || "";
        var nextAt = next.saved || "";
        merged.apps[id] = nextAt >= prevAt ? Object.assign({}, prev, next) : Object.assign({}, next, prev);
        var text = clipLine(lineText(id, merged.apps[id]));
        if (text) queueIds[id] = text;
      });
      delete bag.kids[key];
      moved = true;
    });
    if (!moved && !bag.kids[code]) return;
    bag.kids[code] = merged;
    saveBag(bag);
    if (!moved || !aliasesOn() || !active()) return;
    Object.keys(queueIds).forEach(function (id) {
      enqueue(alias, code, id, queueIds[id]);
    });
  }
  function write(aliasRaw, twCode) {
    var alias = clean(aliasRaw);
    if (!alias) return null;
    var tw = cleanCode(twCode);
    if (tw.length === 5) {
      var rec = { v: 2, alias: alias, code: tw, verified: true, at: Date.now() };
      try { localStorage.setItem(WHO, JSON.stringify(rec)); } catch (e) {}
      rekeyBag(alias, tw);
      return { alias: alias, code: tw, verified: true, at: rec.at };
    }
    var existing = read();
    if (existing && existing.verified && clean(existing.alias).toLowerCase() === alias.toLowerCase()) return existing;
    var code = codeOf(alias);
    if (!code) return null;
    try { localStorage.setItem(WHO, JSON.stringify({ v: 1, alias: alias, code: code })); } catch (e2) {}
    return { alias: alias, code: code, verified: false };
  }
  function saveApp(appId, data) {
    var who = read();
    if (!who || !appId) return null;
    var bag = loadBag();
    var kid = bag.kids[who.code] || { alias: who.alias, apps: {} };
    kid.alias = who.alias;
    var prev = kid.apps[appId] || {};
    kid.apps[appId] = Object.assign({}, prev, data || {}, { saved: new Date().toISOString() });
    bag.kids[who.code] = kid;
    saveBag(bag);
    return who;
  }
  function lines() {
    var who = read();
    if (!who) return {};
    var kid = loadBag().kids[who.code];
    var apps = kid && kid.apps ? kid.apps : {};
    var out = {};
    Object.keys(apps).forEach(function (id) {
      var text = lineText(id, apps[id]);
      if (text) out[id] = text;
    });
    return out;
  }
  var REC = "kw-records-v1";
  function readRecords() {
    try {
      var rows = JSON.parse(localStorage.getItem(REC) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (e) { return []; }
  }
  function record(rec) {
    rec = rec || {};
    if (!active() || !aliasesOn()) return null;
    var who = read();
    if (!who || !who.verified) return null;
    var score = rec.score;
    var hasScore = typeof score === "number" && isFinite(score);
    var row = {
      v: 2,
      app: String(rec.app || "").slice(0, 24),
      version: String(rec.version || "").slice(0, 32),
      code: who.code,
      alias: who.alias,
      event: String(rec.event || "play").slice(0, 24),
      level: String(rec.level == null ? "" : rec.level).slice(0, 40),
      score: hasScore ? score : null,
      max: typeof rec.max === "number" && isFinite(rec.max) ? rec.max : null,
      stars: typeof rec.stars === "number" && isFinite(rec.stars) ? rec.stars : null,
      xp: typeof rec.xp === "number" && isFinite(rec.xp) ? rec.xp : 0,
      skill: String(rec.skill || "").slice(0, 24),
      ms: typeof rec.ms === "number" && isFinite(rec.ms) ? rec.ms : null,
      ts: Date.now()
    };
    if (!row.app) return null;
    if (row.event === "line" && !hasScore) {
      try { localStorage.setItem(REC, JSON.stringify(readRecords().concat([row]).slice(-300))); } catch (eLine) {}
      return row;
    }
    if (!hasScore) return null;
    try { localStorage.setItem(REC, JSON.stringify(readRecords().concat([row]).slice(-300))); } catch (eSave) {}
    var rows = pending().filter(function (item) {
      return !(item && item.v === 2 && item.code === who.code && item.app === row.app && item.level === row.level && item.ts === row.ts);
    });
    rows.push({
      v: 2, alias: who.alias, code: who.code, app: row.app, version: row.version,
      event: row.event, level: row.level, score: row.score, max: row.max, stars: row.stars,
      xp: row.xp, skill: row.skill, ms: row.ms, ts: row.ts,
      line: clipLine(row.event + " " + row.level + " " + row.score),
      saved: new Date(row.ts).toISOString()
    });
    writePending(rows);
    try { root.dispatchEvent(new CustomEvent("kw-record", { detail: row })); } catch (eEv) {}
    try {
      if (root.parent && root.parent !== root) root.parent.postMessage({ type: "kw-record", app: row.app, row: row }, "*");
    } catch (ePost) {}
    flush();
    return row;
  }
  function mark(appId, line) {
    var text = clipLine(line);
    var id = String(appId || "").slice(0, 24);
    if (!text || !id) return null;
    var who = saveApp(id, { line: text });
    if (who && who.verified && active() && aliasesOn()) enqueue(who.alias, who.code, id, text);
    record({ app: id, event: "score", level: text, score: 1, max: 1, stars: 1, xp: 1 });
    try { root.dispatchEvent(new Event("kw-mark")); } catch (e) {}
    return who;
  }
  function flush() {
    if (!active() || !aliasesOn()) return Promise.resolve(false);
    var rows = pending();
    if (!rows.length) return Promise.resolve(true);
    return fetch("https://tw.kulibert.net/api/marks", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ marks: rows })
    }).then(function (res) {
      if (res && res.ok) ack(rows);
      return !!(res && res.ok);
    }).catch(function () { return false; });
  }
  function ack(sent) {
    var done = {};
    (sent || []).forEach(function (row) {
      if (row && row.code && row.app) done[row.code + "\n" + row.app] = row.line;
    });
    writePending(pending().filter(function (row) {
      var key = row && row.code + "\n" + row.app;
      return !done[key] || done[key] !== row.line;
    }));
  }
  function prefsCode() {
    var who = read();
    var code = cleanCode(who && who.code);
    return code.length === 5 ? code : "";
  }
  function getPrefs(app) {
    var code = prefsCode();
    var url = "https://tw.kulibert.net/api/prefs?app=" + encodeURIComponent(app || "") + (code ? "&code=" + encodeURIComponent(code) : "");
    return fetch(url, { credentials: "include" }).then(function (res) { return res.json(); });
  }
  function setPrefs(app, obj) {
    return fetch("https://tw.kulibert.net/api/prefs", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: prefsCode(), app: app, prefs: obj || {} })
    }).then(function (res) { return res.json(); });
  }
  root.KulibertWho = { read: read, write: write, saveApp: saveApp, clean: clean, codeOf: codeOf, lines: lines, mark: mark, record: record, records: readRecords, pending: pending, ack: ack, flush: flush, forget: forget, active: active, prefs: { get: getPrefs, set: setPrefs } };
  function hubHome() {
    var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
    if (path === "/index.html") path = "/";
    return path === "/" || path === "/staff" || path === "/staff/index.html";
  }
  if (typeof document !== "undefined" && root.top === root && !hubHome() && !document.getElementById("tw-session-boot") && !document.querySelector("script[src*='kulibert-bar.js']")) {
    var boot = document.createElement("script");
    boot.id = "tw-session-boot";
    boot.src = "/shared/kulibert-bar.js?v=2026-10-01-connected";
    (document.head || document.documentElement).appendChild(boot);
  }
})(typeof window !== "undefined" ? window : globalThis);
