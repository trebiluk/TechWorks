import { commitDescribe, describeCard } from "@/lib/describe";
import { cn } from "@/lib/utils";

export function DescribeBar({
  view,
  panel,
  on,
  onToggle,
  onHelp,
}: {
  view: string;
  panel?: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  onHelp: () => void;
}) {
  if (!on) return null;
  const card = describeCard(view, panel);
  return (
    <aside className="mb-2 rounded-lg bg-elevated px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold">{card.title}. </span>
            <span className="text-muted">{card.purpose}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {card.links.map((l) =>
              l.href === "#help" ? (
                <button key={l.label} type="button" onClick={onHelp} className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline">
                  {l.label}
                </button>
              ) : (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                >
                  {l.label}
                </a>
              ),
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            commitDescribe(false);
            onToggle(false);
          }}
          className={cn("min-h-11 shrink-0 rounded-md px-3 text-sm text-muted")}
        >
          Hide
        </button>
      </div>
    </aside>
  );
}
