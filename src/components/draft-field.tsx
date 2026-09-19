"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Local draft. Commit on blur, idle, page hide, or unmount so PlanIt hours survive reload. */
export function DraftField({
  value,
  onCommit,
  editing = true,
  multiline,
  className,
  style,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: string;
  onCommit: (v: string) => void;
  editing?: boolean;
  multiline?: boolean;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(value);
  const textRef = useRef(text);
  textRef.current = text;
  const startRef = useRef(value);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const idleRef = useRef(0);

  function flushNow() {
    const next = textRef.current;
    if (next === startRef.current) return;
    startRef.current = next;
    commitRef.current(next);
  }

  useEffect(() => {
    if (textRef.current === startRef.current) {
      setText(value);
      startRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    function onHide() {
      flushNow();
    }
    window.addEventListener("pagehide", onHide, true);
    window.addEventListener("beforeunload", onHide, true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide, true);
      window.removeEventListener("beforeunload", onHide, true);
      document.removeEventListener("visibilitychange", onHide);
      if (idleRef.current) window.clearTimeout(idleRef.current);
      flushNow();
    };
  }, []);

  function bump(next: string) {
    setText(next);
    textRef.current = next;
    if (idleRef.current) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      idleRef.current = 0;
      flushNow();
    }, 280);
  }

  if (!editing) {
    if (!value) return null;
    const Tag = multiline ? "p" : "span";
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  const box = cn(className, "outline-none placeholder:text-white/30");
  if (multiline) {
    return (
      <textarea
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={2}
        className={cn(box, "resize-none")}
        style={style}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => bump(e.target.value)}
        onBlur={flushNow}
      />
    );
  }
  return (
    <input
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={box}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
      }}
      onChange={(e) => bump(e.target.value)}
      onBlur={flushNow}
    />
  );
}
