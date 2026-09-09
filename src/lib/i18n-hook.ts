import { useEffect, useState } from "react";
import { articleCopy, glossCopy, onLang, storedLang, t, type LangId } from "@/lib/i18n";

export function useLang(): {
  lang: LangId;
  t: (phrase: string) => string;
  article: (id: string, title: string, body: string) => { title: string; body: string };
  gloss: (id: string, def: string, use: string) => { def: string; use: string };
} {
  const [lang, setLang] = useState<LangId>(() => storedLang());
  useEffect(() => onLang(() => setLang(storedLang())), []);
  return {
    lang,
    t: (phrase: string) => t(phrase, lang),
    article: (id, title, body) => articleCopy(id, title, body, lang),
    gloss: (id, def, use) => glossCopy(id, def, use, lang),
  };
}
