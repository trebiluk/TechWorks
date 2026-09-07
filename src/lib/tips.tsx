import { createContext, useContext, type ReactNode } from "react";

const TipsCtx = createContext(false);

export function TipsProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <TipsCtx.Provider value={on}>{children}</TipsCtx.Provider>;
}

export function useTips() {
  return useContext(TipsCtx);
}

/** Visible only when Screen guide / Tips is on. Always in title + sr-only. */
export function Word({
  children,
  className,
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "h2";
}) {
  const tips = useTips();
  if (!tips) {
    return (
      <span className="sr-only">
        {children}
      </span>
    );
  }
  return <Tag className={className}>{children}</Tag>;
}
