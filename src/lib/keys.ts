/** Fields where Space and letter keys must type, not fire wall hotkeys. */
export const TYPING_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']";

type NodeLike = {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => unknown;
  parentElement?: NodeLike | null;
};

function attr(el: NodeLike, name: string): string | null {
  try {
    return el.getAttribute?.(name) ?? null;
  } catch {
    return null;
  }
}

/** True when this node itself is a typing field. */
export function isTypingNode(el: unknown): boolean {
  if (!el || typeof el !== "object") return false;
  const node = el as NodeLike;
  const tag = String(node.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (node.isContentEditable) return true;
  const ce = attr(node, "contenteditable");
  if (ce === "" || ce === "true") return true;
  if (attr(node, "role") === "textbox") return true;
  return false;
}

/**
 * Space / letter hotkeys must no-op and must not preventDefault
 * when the event is in a typing field (or a descendant of one).
 */
export function isTypingTarget(e: { target?: EventTarget | null } | null | undefined): boolean {
  const raw = e?.target ?? (typeof document !== "undefined" ? document.activeElement : null);
  if (!raw || typeof raw !== "object") return false;
  const start = raw as NodeLike;
  if (isTypingNode(start)) return true;
  if (typeof start.closest === "function") {
    const hit = start.closest(TYPING_SELECTOR);
    if (hit) return true;
  }
  let walk: NodeLike | null | undefined = start.parentElement;
  while (walk) {
    if (isTypingNode(walk)) return true;
    walk = walk.parentElement;
  }
  return false;
}
