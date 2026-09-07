import { useState } from "react";
import { VERSION_LABEL } from "@/lib/version";
import { CHANGELOG_MD, changelogFileName } from "@/data/changelog";
import { downloadText } from "@/lib/live";

export function ChangelogCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-md bg-elevated p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
      >
        Changelog · {VERSION_LABEL}
        <span className="text-subtle">{open ? "hide" : "export"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <textarea readOnly value={CHANGELOG_MD} className="min-h-40 w-full rounded-md bg-surface p-2 font-mono text-xs text-fg outline-none" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(CHANGELOG_MD);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  window.prompt("Copy changelog", CHANGELOG_MD);
                }
              }}
              className="min-h-11 flex-1 rounded-md bg-surface text-sm font-semibold"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => downloadText(changelogFileName(), CHANGELOG_MD, "text/markdown")}
              className="min-h-11 flex-1 rounded-md bg-fg text-sm font-semibold text-bg"
            >
              Download .md
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
