/* Live cart: tw.kulibert.net/koderized/ (alias /coderized/). Do not bounce the desk. */
(function () {
  try {
    if (location.protocol === "file:") return;
    var host = location.hostname || "";
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host === "tw.kulibert.net") return;
    if (host === "koderized.kulibert.net" || host === "coderized.kulibert.net") return;
    if (/\.vercel\.app$/.test(host)) return;
  } catch (e) {}
})();
