import { createContext, useContext, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const SLOP = 8;

type SortCtx = {
  enabled: boolean;
  grab: string | null;
  over: string | null;
  arm: (id: string, e: PointerEvent<HTMLButtonElement>) => void;
  move: (e: PointerEvent<HTMLButtonElement>) => void;
  end: (e: PointerEvent<HTMLButtonElement>) => void;
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

export function SortableList({
  enabled,
  onMove,
  className,
  children,
}: {
  enabled: boolean;
  onMove: (grab: string, onto: string) => void;
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; pointer: number; x: number; y: number; armed: boolean } | null>(null);
  const overRef = useRef<string | null>(null);
  const [grab, setGrab] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function arm(id: string, e: PointerEvent<HTMLButtonElement>) {
    if (!enabled || e.button !== 0) return;
    e.stopPropagation();
    drag.current = { id, pointer: e.pointerId, x: e.clientX, y: e.clientY, armed: false };
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
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

  function end(e: PointerEvent<HTMLButtonElement>) {
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
        data-wall-edit={enabled ? "on" : undefined}
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
}: {
  id: string;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  const ctx = useContext(Ctx);
  const enabled = Boolean(ctx?.enabled);
  const grabbing = ctx?.grab === id;
  const hovering = Boolean(ctx?.over === id && ctx.grab && ctx.grab !== id);
  return (
    <div
      data-sort-id={id}
      className={cn(
        "tw-sort-item",
        grabbing && "tw-sort-grab",
        hovering && "tw-sort-over",
        className,
      )}
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
      {children}
    </div>
  );
}
