import html from "../../../public/koderized/teacher/index.html?raw";

/** Cloudflare drops /koderized/teacher/ to /koderized/teacher, which has no static route. */
export default defineEventHandler(() => {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache, must-revalidate",
    },
  });
});
