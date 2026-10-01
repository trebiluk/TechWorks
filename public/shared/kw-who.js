/** One call for every Kulibert app. Posts a v2 mark to TechWorks. No names. */
(function () {
  var DOOR = "https://tw.kulibert.net/api/marks";
  function record(rec) {
    var row = rec && typeof rec === "object" ? rec : {};
    var body = JSON.stringify({ v: 2, marks: [Object.assign({ v: 2 }, row)] });
    return fetch(DOOR, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body,
    }).then(function (res) {
      return res.json();
    });
  }
  var api = { record: record };
  if (typeof window !== "undefined") window.KulibertWho = api;
  if (typeof globalThis !== "undefined") globalThis.KulibertWho = api;
})();
