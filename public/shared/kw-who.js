/* Kulibert shop alias. Same Chromebook. No real names. Other apps can load /berty-run/kw-who.js */
(function (root) {
  var WHO = "kw-who-v1";
  var BAG = "kw-bag-v1";
  function clean(raw) {
    return String(raw || "").replace(/[^\p{L}\p{N} \-']/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
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
      var code = codeOf(alias);
      return alias && code ? { alias: alias, code: code } : null;
    } catch (e) {
      return null;
    }
  }
  function write(aliasRaw) {
    var alias = clean(aliasRaw);
    var code = codeOf(alias);
    if (!alias || !code) return null;
    try {
      localStorage.setItem(WHO, JSON.stringify({ v: 1, alias: alias, code: code }));
    } catch (e) {}
    return { alias: alias, code: code };
  }
  function saveApp(appId, data) {
    var who = read();
    if (!who || !appId) return null;
    var bag = { v: 1, kids: {} };
    try {
      var parsed = JSON.parse(localStorage.getItem(BAG) || "null");
      if (parsed && parsed.v === 1 && parsed.kids) bag = parsed;
    } catch (e) {}
    var kid = bag.kids[who.code] || { alias: who.alias, apps: {} };
    kid.alias = who.alias;
    var prev = kid.apps[appId] || {};
    kid.apps[appId] = Object.assign({}, prev, data || {}, { saved: new Date().toISOString() });
    bag.kids[who.code] = kid;
    try {
      localStorage.setItem(BAG, JSON.stringify(bag));
    } catch (e) {}
    return who;
  }
  function clipLine(raw) {
    return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 32);
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
  function lineText(id, row) {
      if (!row) return "";
      if (row.line) return String(row.line);
      if (id === "berty-run" && row.stamps != null) return String(row.stamps) + " stamps";
      return "";
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
  function pending() {
    try {
      var rows = JSON.parse(localStorage.getItem("kw-outbox-v1") || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }
  function writePending(rows) {
    try { localStorage.setItem("kw-outbox-v1", JSON.stringify(rows.slice(-40))); } catch (e) {}
  }
  function mark(appId, line) {
    var text = clipLine(line);
    var id = String(appId || "").slice(0, 24);
    if (!text || !id) return null;
    var who = saveApp(id, { line: text });
    if (!who) return null;
    var rows = pending().filter(function (row) {
      return !(row && row.code === who.code && row.app === id);
    });
    rows.push({ alias: who.alias, code: who.code, app: id, line: text, saved: new Date().toISOString() });
    writePending(rows);
    postScore(id, text, who.alias);
    return who;
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
  var MARKS = "https://tw.kulibert.net/api/marks";
  var PREFS = "https://tw.kulibert.net/api/prefs";
  function five(raw) {
    var code = String(raw || "").toUpperCase().replace(/[^A-Z2-9]/g, "");
    return code.length === 5 ? code : "";
  }
  function localShop() {
    try {
      var raw = sessionStorage.getItem("tw-shop-session") || sessionStorage.getItem("kw-who");
      var parsed = JSON.parse(raw || "null");
      return five(parsed && (parsed.code || parsed));
    } catch (e) {
      return "";
    }
  }
  function shopThen(fn) {
    var code = localShop();
    if (code) { fn(code); return; }
    fetch("https://tw.kulibert.net/api/who", { credentials: "include" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        var shop = five(body && body.code);
        if (shop) fn(shop, body.alias);
      })
      .catch(function () {});
  }
  function postScore(appId, line, alias) {
    shopThen(function (code, alias2) {
      fetch(MARKS, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          v: 2,
          marks: [{
            v: 2,
            app: String(appId || "").slice(0, 24),
            version: "1",
            code: code,
            alias: String(alias || alias2 || "Kid").slice(0, 16),
            event: "score",
            level: String(line || "").slice(0, 40),
            score: 1,
            max: 1,
            stars: 1,
            xp: 1,
            ts: new Date().toISOString()
          }]
        })
      }).catch(function () {});
    });
  }
  function record(rec) {
    var row = rec && typeof rec === "object" ? rec : {};
    if (!five(row.code)) row.code = localShop();
    return fetch(MARKS, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ v: 2, marks: [Object.assign({ v: 2 }, row)] })
    }).then(function (res) { return res.json(); });
  }
  function getPrefs(app) {
    var code = localShop();
    var url = PREFS + "?app=" + encodeURIComponent(app || "") + (code ? "&code=" + encodeURIComponent(code) : "");
    return fetch(url, { credentials: "include" }).then(function (res) { return res.json(); });
  }
  function setPrefs(app, obj) {
    return fetch(PREFS, {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: localShop(), app: app, prefs: obj || {} })
    }).then(function (res) { return res.json(); });
  }
  root.KulibertWho = { read: read, write: write, saveApp: saveApp, clean: clean, codeOf: codeOf, lines: lines, mark: mark, pending: pending, ack: ack, record: record, prefs: { get: getPrefs, set: setPrefs } };
})(typeof window !== "undefined" ? window : globalThis);
