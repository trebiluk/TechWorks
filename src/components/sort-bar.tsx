import { SORT_KEYS, type SortKey } from "@/lib/rank";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

export function SortBar({
  value,
  onChange,
  keys,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
  keys?: SortKey[];
  compact?: boolean;
}) {
  const { t } = useLang();
  const show = SORT_KEYS.filter((k) => !keys || keys.includes(k.id));
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="text-subtle">{t("Sort")}</span>
      {show.map((k, i) => (
        <span key={k.id} className="inline-flex items-baseline gap-x-2">
          {i > 0 ? <span className="text-subtle">·</span> : null}
          <button
            type="button"
            onClick={() => onChange(k.id)}
            className={cn("underline-offset-4", value === k.id ? "font-semibold text-gold underline" : "text-muted hover:text-fg")}
          >
            {t(k.label)}
          </button>
        </span>
      ))}
    </p>
  );
}
