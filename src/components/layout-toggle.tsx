import { Monitor, Smartphone } from "lucide-react";
import { commitLayout, useLayout, type LayoutId } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function LayoutToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const layout = useLayout();
  return (
    <div className={cn("flex rounded-lg bg-elevated p-0.5", className)} role="group" aria-label="Web or mobile">
      {(["web", "mobile"] as LayoutId[]).map((id) => {
        const Icon = id === "web" ? Monitor : Smartphone;
        const on = layout === id;
        return (
          <button
            key={id}
            type="button"
            title={id === "web" ? "Web · projector" : "Mobile · phone"}
            aria-pressed={on}
            onClick={() => commitLayout(id)}
            className={cn(
              "tw-tap inline-flex items-center justify-center rounded-md font-semibold",
              compact ? "size-9" : "min-h-11 min-w-11 gap-1.5 px-3 text-sm",
              on ? "bg-fg text-bg" : "text-muted",
            )}
          >
            <Icon className="size-4" />
            {compact ? <span className="sr-only">{id}</span> : <span className="hidden sm:inline">{id === "web" ? "Web" : "Mobile"}</span>}
          </button>
        );
      })}
    </div>
  );
}
