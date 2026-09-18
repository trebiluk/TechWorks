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
      `Print the class list (${n} aliases + Shop ID). Real names are not in this app. Do not add last names on a shared printer.`,
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
          setNote(ok ? "Print dialog · aliases only" : "Popup blocked · downloaded CSV instead");
          if (!ok) downloadText(codebookFileName(), codebookCsv(codebookOf(file)), "text/csv");
        }}
        className="tw-tap min-h-11 rounded-md bg-fg px-3 text-sm font-semibold text-bg disabled:opacity-40"
      >
        Print class list
      </button>
      <button
        type="button"
        disabled={!n}
        onClick={() => {
          if (!n || !warn()) return;
          downloadText(codebookFileName(), codebookCsv(codebookOf(file)), "text/csv");
          setNote("Class list CSV · aliases + Shop ID");
        }}
        className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
      >
        Download class list
      </button>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </div>
  );
}
