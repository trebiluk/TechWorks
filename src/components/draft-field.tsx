"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Local draft. Commit on blur or when this field unmounts (period / date / slide change). */
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

  useEffect(() => {
    if (textRef.current === startRef.current) {
      setText(value);
      startRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    return () => {
      const next = textRef.current;
      if (next !== startRef.current) commitRef.current(next);
    };
  }, []);

  function flush() {
    if (text !== startRef.current) {
      startRef.current = text;
      onCommit(text);
    }
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
        onChange={(e) => setText(e.target.value)}
        onBlur={flush}
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
      onChange={(e) => setText(e.target.value)}
      onBlur={flush}
    />
  );
}
