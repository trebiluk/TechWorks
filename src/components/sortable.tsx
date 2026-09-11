import { createContext, useContext, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const SLOP = 8;

type Ptr = PointerEvent<HTMLElement>;

type SortCtx = {
  enabled: boolean;
  grab: string | null;
  over: string | null;
  arm: (id: string, e: Ptr) => void;
  move: (e: Ptr) => void;
  end: (e: Ptr) => void;
};

const Ctx = createContext<SortCtx | null>(null);

function hitId(x: number, y: number, root: HTMLElement, grab: string): string | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const item = el.closest("[data-sort-id]");
    if (!item || !root.contains(item)) continue;
    const id = item.getAttribute("data-sort-id");
    if (id && id !== grab) return id;
  }
  return null;
}

function isGrip(el: EventTarget | null): boolean {
  return el instanceof Element && Boolean(el.closest(".tw-sort-grip"));
}

function isControl(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  if (isGrip(el)) return false;
  return Boolean(el.closest("button, a, input, select, textarea, label, [role='button']"));
}

export function SortableList({
  enabled,
  onMove,
  className,
  children,
  freeze = true,
}: {
  enabled: boolean;
  onMove: (grab: string, onto: string) => void;
  className?: string;
  children: ReactNode;
  /** Wall plates freeze inner buttons so a drag does not tap them. Plan book keeps the chips live. */
  freeze?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; pointer: number; x: number; y: number; armed: boolean } | null>(null);
  const overRef = useRef<string | null>(null);
  const [grab, setGrab] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function arm(id: string, e: Ptr) {
    if (!enabled || e.button !== 0) return;
    e.stopPropagation();
    drag.current = { id, pointer: e.pointerId, x: e.clientX, y: e.clientY, armed: false };
  }

  function move(e: Ptr) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.armed) {
      if (dx * dx + dy * dy < SLOP * SLOP) return;
      d.armed = true;
      setGrab(d.id);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* */
      }
    }
    e.preventDefault();
    const onto = root.current ? hitId(e.clientX, e.clientY, root.current, d.id) : null;
    overRef.current = onto;
    setOver(onto);
  }

  function end(e: Ptr) {
    const d = drag.current;
    drag.current = null;
    const onto = overRef.current;
    overRef.current = null;
    if (!d || d.pointer !== e.pointerId) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
    setGrab(null);
    setOver(null);
    if (d.armed && onto && onto !== d.id) onMove(d.id, onto);
  }

  return (
    <Ctx.Provider value={{ enabled, grab, over, arm, move, end }}>
      <div
        ref={root}
        className={className}
        data-wall-edit={enabled && freeze ? "on" : undefined}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function SortableItem({
  id,
  className,
  label,
  children,
  onHide,
}: {
  id: string;
  className?: string;
  label?: string;
  children: ReactNode;
  onHide?: () => void;
}) {
  const ctx = useContext(Ctx);
  const enabled = Boolean(ctx?.enabled);
  const grabbing = ctx?.grab === id;
  const hovering = Boolean(ctx?.over === id && ctx.grab && ctx.grab !== id);

  function plateDown(e: PointerEvent<HTMLDivElement>) {
    if (!ctx?.enabled) return;
    if (isGrip(e.target) || isControl(e.target)) return;
    ctx.arm(id, e);
  }

  return (
    <div
      data-sort-id={id}
      className={cn(
        "tw-sort-item",
        grabbing && "tw-sort-grab",
        hovering && "tw-sort-over",
        className,
      )}
      onPointerDown={enabled ? plateDown : undefined}
      onPointerMove={enabled ? (e) => ctx?.move(e) : undefined}
      onPointerUp={enabled ? (e) => ctx?.end(e) : undefined}
      onPointerCancel={enabled ? (e) => ctx?.end(e) : undefined}
    >
      {enabled ? (
        <button
          type="button"
          className="tw-sort-grip"
          aria-label={label ? `Move ${label}` : "Move plate"}
          onPointerDown={(e) => ctx?.arm(id, e)}
          onPointerMove={(e) => ctx?.move(e)}
          onPointerUp={(e) => ctx?.end(e)}
          onPointerCancel={(e) => ctx?.end(e)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      {enabled && onHide ? (
        <button
          type="button"
          className="tw-plate-hide"
          aria-label={label ? `Hide ${label}` : "Hide plate"}
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
        >
          <EyeOff className="size-4" />
        </button>
      ) : null}
      {children}
    </div>
  );
}
