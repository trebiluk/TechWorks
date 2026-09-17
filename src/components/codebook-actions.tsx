import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { codebookCsv, codebookFileName, codebookOf, printCodebook } from "@/lib/codebook";
import { downloadText } from "@/lib/live";

/** PIN already guards Roster / Backups. Paper + CSV are the only who’s-who map. */
export function CodebookActions({ file }: { file: EconomyFile }) {
  const [note, setNote] = useState("");
  const n = codebookOf(file).length;

  function warn(): boolean {
    return window.confirm(
      `This codebook has ${n} legal names (Last, First) next to Shop ID and alias.\n\nPrint to the teacher printer. Keep the paper or USB in your drawer. Do not leave it on the shop tray or the wall.`,
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        disabled={!n}
        onClick={() => {
          if (!n || !warn()) return;
          const ok = printCodebook(file);
          setNote(ok ? "Print dialog · codebook is private" : "Popup blocked · downloaded CSV instead");
          if (!ok) downloadText(codebookFileName(), codebookCsv(codebookOf(file)), "text/csv");
        }}
        className="tw-tap min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-bg disabled:opacity-40"
      >
        Print codebook
      </button>
      <button
        type="button"
        disabled={!n}
        onClick={() => {
          if (!n || !warn()) return;
          downloadText(codebookFileName(), codebookCsv(codebookOf(file)), "text/csv");
          setNote("Codebook CSV downloaded · drawer / USB only");
        }}
        className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
      >
        Download codebook
      </button>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </div>
  );
}
