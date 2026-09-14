/** Projector hang: Drive / Docs / Slides / Sheets / YouTube / Canva / a link. Store the share URL; compute the embed at paint. */

export type HangKind = "drive" | "doc" | "slides" | "sheet" | "youtube" | "canva" | "link";

export type HangItem = {
  id: string;
  url: string;
  kind: HangKind;
  title?: string;
};

const FILE_RE = /\/file\/d\/([a-zA-Z0-9_-]+)/;
const DOC_RE = /\/document\/d\/([a-zA-Z0-9_-]+)/;
const SLIDE_RE = /\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const SHEET_RE = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const OPEN_RE = /[?&]id=([a-zA-Z0-9_-]+)/;
const YT_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/;
const CANVA_RE = /canva\.com\/design\/([a-zA-Z0-9_-]+)/;

export function hangKindLabel(kind: HangKind): string {
  if (kind === "drive") return "Drive";
  if (kind === "doc") return "Doc";
  if (kind === "slides") return "Slides";
  if (kind === "sheet") return "Sheet";
  if (kind === "youtube") return "YouTube";
  if (kind === "canva") return "Canva";
  return "Link";
}

export function hangSrc(item: HangItem): string | null {
  const url = item.url.trim();
  if (item.kind === "drive") {
    const id = url.match(FILE_RE)?.[1] || url.match(OPEN_RE)?.[1];
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  if (item.kind === "doc") {
    const id = url.match(DOC_RE)?.[1];
    return id ? `https://docs.google.com/document/d/${id}/preview` : null;
  }
  if (item.kind === "slides") {
    const id = url.match(SLIDE_RE)?.[1];
    return id ? `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=60000` : null;
  }
  if (item.kind === "sheet") {
    const id = url.match(SHEET_RE)?.[1];
    return id ? `https://docs.google.com/spreadsheets/d/${id}/preview` : null;
  }
  if (item.kind === "youtube") {
    const id = url.match(YT_RE)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (item.kind === "canva") {
    const id = url.match(CANVA_RE)?.[1];
    return id ? `https://www.canva.com/design/${id}/view?embed` : null;
  }
  return null;
}

function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function parseHang(raw: string): HangItem | null {
  const text = raw.trim();
  if (!text) return null;
  let href = text;
  if (!/^https?:\/\//i.test(href)) {
    if (/^[\w.-]+\.[a-z]{2,}/i.test(href)) href = `https://${href}`;
    else return null;
  }
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const hrefs = url.toString();
  const host = hostOf(hrefs);
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = hrefs.match(YT_RE)?.[1];
    if (!id) return null;
    return { id: `yt-${id}`, url: hrefs, kind: "youtube", title: "YouTube" };
  }
  if (host.endsWith("canva.com")) {
    const id = hrefs.match(CANVA_RE)?.[1];
    if (!id) return { id: `link-${hash(hrefs)}`, url: hrefs, kind: "link", title: "Canva" };
    return { id: `canva-${id}`, url: hrefs, kind: "canva", title: "Canva" };
  }
  if (host === "docs.google.com") {
    const slides = hrefs.match(SLIDE_RE)?.[1];
    if (slides) return { id: `slides-${slides}`, url: hrefs, kind: "slides", title: "Slides" };
    const doc = hrefs.match(DOC_RE)?.[1];
    if (doc) return { id: `doc-${doc}`, url: hrefs, kind: "doc", title: "Doc" };
    const sheet = hrefs.match(SHEET_RE)?.[1];
    if (sheet) return { id: `sheet-${sheet}`, url: hrefs, kind: "sheet", title: "Sheet" };
  }
  if (host === "drive.google.com") {
    const file = hrefs.match(FILE_RE)?.[1] || hrefs.match(OPEN_RE)?.[1];
    if (file) return { id: `drive-${file}`, url: hrefs, kind: "drive", title: "Drive" };
    return { id: `link-${hash(hrefs)}`, url: hrefs, kind: "link", title: "Drive folder" };
  }
  return { id: `link-${hash(hrefs)}`, url: hrefs, kind: "link", title: host || "Link" };
}

function hash(s: string): string {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
  return n.toString(36);
}
