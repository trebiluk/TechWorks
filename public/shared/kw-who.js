/** One call for every Kulibert app. Marks and per-app settings. No names. */
(function () {
  var MARKS = "https://tw.kulibert.net/api/marks";
  var PREFS = "https://tw.kulibert.net/api/prefs";

  function shopCode() {
    try {
      var raw = sessionStorage.getItem("tw-shop-session") || sessionStorage.getItem("kw-who");
      if (!raw) return "";
      var parsed = JSON.parse(raw);
      return String(parsed.code || parsed || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
    } catch (e) {
      return "";
    }
  }

  function record(rec) {
    var row = rec && typeof rec === "object" ? rec : {};
    return fetch(MARKS, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ v: 2, marks: [Object.assign({ v: 2 }, row)] }),
    }).then(function (res) {
      return res.json();
    });
  }

  function getPrefs(app) {
    var code = shopCode();
    var url = PREFS + "?app=" + encodeURIComponent(app || "") + (code ? "&code=" + encodeURIComponent(code) : "");
    return fetch(url, { credentials: "include" }).then(function (res) {
      return res.json();
    });
  }

  function setPrefs(app, obj) {
    return fetch(PREFS, {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: shopCode(), app: app, prefs: obj || {} }),
    }).then(function (res) {
      return res.json();
    });
  }

  var api = { record: record, prefs: { get: getPrefs, set: setPrefs } };
  if (typeof window !== "undefined") window.KulibertWho = api;
  if (typeof globalThis !== "undefined") globalThis.KulibertWho = api;
})();
