/* User origin pin. Alias hosts bounce here only when the origin answers.
   Never touch TechWorks or tw.kulibert.net deployments from this project. */
(function () {
  var ORIGIN = "https://coderized.kulibert.net";
  try {
    if (location.protocol === "file:") return;
    var host = location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host === "coderized.kulibert.net") return;
    if (host === "coderized.vercel.app") return;
    if (/\.vercel\.app$/.test(host)) return;
    var alias = /pages\.dev$/.test(host) || /\.github\.io$/.test(host);
    if (!alias) return;
    fetch(ORIGIN + "/manifest.json", { cache: "no-store", mode: "cors" })
      .then(function (r) { if (r && r.ok) location.replace(ORIGIN + "/"); })
      .catch(function () {});
  } catch (e) {}
})();
