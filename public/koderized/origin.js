/* Classroom origin pin.
   Live cart is tw.kulibert.net/koderized/ (alias: /coderized/).
   koderized.kulibert.net / coderized.kulibert.net stay aliases when TLS is live.
   Never bounce the TechWorks desk itself. */
(function () {
  var ORIGIN = "https://tw.kulibert.net/koderized/";
  try {
    if (location.protocol === "file:") return;
    var host = location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host === "tw.kulibert.net") return;
    if (host === "koderized.kulibert.net") return;
    if (host === "coderized.kulibert.net") return;
    if (host === "koderized.vercel.app") return;
    if (host === "coderized.vercel.app") return;
    if (/\.vercel\.app$/.test(host)) return;
    var alias = /pages\.dev$/.test(host) || /\.github\.io$/.test(host);
    if (!alias) return;
    fetch(ORIGIN + "manifest.json", { cache: "no-store", mode: "cors" })
      .then(function (r) { if (r && r.ok) location.replace(ORIGIN); })
      .catch(function () {});
  } catch (e) {}
})();
