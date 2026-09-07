import { useEffect, useState } from "react";
import { onLang, storedLang, t, type LangId } from "@/lib/i18n";

export function useLang(): { lang: LangId; t: typeof t } {
  const [lang, setLang] = useState<LangId>(() => storedLang());
  useEffect(() => onLang(() => setLang(storedLang())), []);
  return { lang, t };
}
