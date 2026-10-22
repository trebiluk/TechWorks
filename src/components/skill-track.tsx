import { useEffect, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { aliasWho } from "@/lib/inventory";
import { useLang } from "@/lib/i18n-hook";
import {
  classSummary,
  classIdOf,
  csvOf,
  emptyBook,
  loadBook,
  markOf,
  saveBook,
  setLevel,
  TRACK_PROOFS,
  TRACK_SKILLS,
  type SkillBook,
  type TrackProof,
  type TrackSkill,
} from "@/lib/skill-track";
import { cn } from "@/lib/utils";

const EN: Record<string, string> = {
  help: "Tap a student, pick a level 1–4 and how you saw it. Tap a skill to see who is below 3.",
  glance: "{name} · {n} at 3+ of {total}",
  below: "Below 3",
  bar: "Level",
  export: "Export CSV",
  download: "Download",
  close: "Close",
  empty: "No aliases in this class.",
  level: "Level",
  saw: "How you saw it",
  "skill:measure": "Measure",
  "skill:plan": "Plan",
  "skill:build": "Build",
  "skill:test": "Test",
  "skill:fix": "Fix",
  "skill:safety": "Safety",
  "skill:team": "Team",
  "skill:explain": "Explain",
  "proof:build": "Build",
  "proof:demo": "Demo",
  "proof:oral": "Oral",
  "proof:photo": "Photo",
};

const COPY: Record<string, Record<string, string>> = {
  simple: {
    help: "Tap a name. Pick 1, 2, 3, or 4. Say how you saw it. Tap a skill to see who is under 3.",
    glance: "{name} · {n} of {total} are 3 or 4",
    below: "Under 3",
    bar: "Level",
    export: "Save a list",
    download: "Save file",
    close: "Close",
    empty: "No names in this class.",
    level: "Level",
    saw: "How you saw it",
    "proof:build": "Made it",
    "proof:demo": "Showed it",
    "proof:oral": "Said it",
    "proof:photo": "Photo",
  },
  uk: {
    help: "Торкніться учня, оберіть рівень 1–4 і як ви це бачили. Торкніться вміння, щоб побачити, хто нижче 3.",
    glance: "{name} · {n} на 3+ з {total}",
    below: "Нижче 3",
    bar: "Рівень",
    export: "Експорт CSV",
    download: "Завантажити",
    close: "Закрити",
    empty: "Немає псевдонімів у цьому класі.",
    level: "Рівень",
    saw: "Як ви це бачили",
    "skill:measure": "Міряй",
    "skill:plan": "Плануй",
    "skill:build": "Будуй",
    "skill:test": "Перевір",
    "skill:fix": "Виправ",
    "skill:safety": "Безпека",
    "skill:team": "Команда",
    "skill:explain": "Поясни",
    "proof:build": "Виріб",
    "proof:demo": "Показ",
    "proof:oral": "Усно",
    "proof:photo": "Фото",
  },
  ru: {
    help: "Нажмите ученика, выберите уровень 1–4 и как вы это видели. Нажмите умение, чтобы увидеть, кто ниже 3.",
    glance: "{name} · {n} на 3+ из {total}",
    below: "Ниже 3",
    bar: "Уровень",
    export: "Экспорт CSV",
    download: "Скачать",
    close: "Закрыть",
    empty: "Нет псевдонимов в этом классе.",
    level: "Уровень",
    saw: "Как вы это видели",
    "skill:measure": "Меряй",
    "skill:plan": "Планируй",
    "skill:build": "Строй",
    "skill:test": "Проверь",
    "skill:fix": "Исправь",
    "skill:safety": "Безопасность",
    "skill:team": "Команда",
    "skill:explain": "Объясни",
    "proof:build": "Изделие",
    "proof:demo": "Показ",
    "proof:oral": "Устно",
    "proof:photo": "Фото",
  },
  es: {
    help: "Toca a un alumno, elige un nivel 1–4 y cómo lo viste. Toca una destreza para ver quién está bajo 3.",
    glance: "{name} · {n} en 3+ de {total}",
    below: "Bajo 3",
    bar: "Nivel",
    export: "Exportar CSV",
    download: "Descargar",
    close: "Cerrar",
    empty: "No hay alias en esta clase.",
    level: "Nivel",
    saw: "Cómo lo viste",
    "skill:measure": "Medir",
    "skill:plan": "Planear",
    "skill:build": "Construir",
    "skill:test": "Probar",
    "skill:fix": "Arreglar",
    "skill:safety": "Seguridad",
    "skill:team": "Equipo",
    "skill:explain": "Explicar",
    "proof:build": "Pieza",
    "proof:demo": "Demo",
    "proof:oral": "Oral",
    "proof:photo": "Foto",
  },
  ar: {
    help: "المس طالباً، اختر مستوى 1–4 وكيف رأيته. المس مهارة لترى من هو دون 3.",
    glance: "{name} · {n} عند 3+ من {total}",
    below: "دون 3",
    bar: "مستوى",
    export: "تصدير CSV",
    download: "تنزيل",
    close: "إغلاق",
    empty: "لا أسماء في هذا الصف.",
    level: "مستوى",
    saw: "كيف رأيته",
    "skill:measure": "قس",
    "skill:plan": "خطّط",
    "skill:build": "ابنِ",
    "skill:test": "اختبر",
    "skill:fix": "أصلح",
    "skill:safety": "سلامة",
    "skill:team": "فريق",
    "skill:explain": "اشرح",
    "proof:build": "قطعة",
    "proof:demo": "عرض",
    "proof:oral": "شفهي",
    "proof:photo": "صورة",
  },
  "fa-AF": {
    help: "یک شاگرد را بزن، سطح ۱ تا ۴ و طریقهٔ دیدنت را انتخاب کن. یک مهارت را بزن تا ببینی کی زیر ۳ است.",
    glance: "{name} · {n} در ۳+ از {total}",
    below: "زیر ۳",
    bar: "سطح",
    export: "خروجی CSV",
    download: "دانلود",
    close: "بستن",
    empty: "در این صنف نامی نیست.",
    level: "سطح",
    saw: "چطور دیدی",
    "skill:measure": "اندازه",
    "skill:plan": "پلان",
    "skill:build": "ساخت",
    "skill:test": "آزمون",
    "skill:fix": "ترمیم",
    "skill:safety": "ایمنی",
    "skill:team": "تیم",
    "skill:explain": "شرح",
    "proof:build": "کار ساخته",
    "proof:demo": "نمایش",
    "proof:oral": "شفاهی",
    "proof:photo": "عکس",
  },
  rw: {
    help: "Kanda umunyeshuri, hitamo urwego 1–4 n'uko wabibonye. Kanda ubumenyi urebe uri munsi ya 3.",
    glance: "{name} · {n} kuri 3+ muri {total}",
    below: "Munsi ya 3",
    bar: "Urwego",
    export: "Ohereza CSV",
    download: "Kuramo",
    close: "Funga",
    empty: "Nta mazina muri iri shuri.",
    level: "Urwego",
    saw: "Uko wabibonye",
    "skill:measure": "Gupima",
    "skill:plan": "Gutegura",
    "skill:build": "Kubaka",
    "skill:test": "Igerageza",
    "skill:fix": "Gukosora",
    "skill:safety": "Umutekano",
    "skill:team": "Itsinda",
    "skill:explain": "Gusobanura",
    "proof:build": "Ibyakozwe",
    "proof:demo": "Kwerekana",
    "proof:oral": "Amagambo",
    "proof:photo": "Ifoto",
  },
  ti: {
    help: "ተማሃራይ ጠውቕ፡ ደረጃ 1–4 ከመይ ከም ርኢኻ ምረጽ። ክእለት ጠውቕ እቶም ትሕቲ 3 ንምርኣይ።",
    glance: "{name} · {n} ኣብ 3+ ካብ {total}",
    below: "ትሕቲ 3",
    bar: "ደረጃ",
    export: "CSV ኣውጽእ",
    download: "ኣውርድ",
    close: "ዕጸው",
    empty: "ኣብዚ ክፍሊ ሽም የለን።",
    level: "ደረጃ",
    saw: "ከመይ ርኢኻዮ",
    "skill:measure": "ኣለክዕ",
    "skill:plan": "ውጥን",
    "skill:build": "ሃንጽ",
    "skill:test": "ፈትን",
    "skill:fix": "ኣዐሪ",
    "skill:safety": "ደሕንነት",
    "skill:team": "ጉጅለ",
    "skill:explain": "ግለጽ",
    "proof:build": "ስራሕ",
    "proof:demo": "ምርኢት",
    "proof:oral": "ቃል",
    "proof:photo": "ስእሊ",
  },
};

function readKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota */
  }
}

function aliasesOf(file: EconomyFile): string[] {
  const names = new Set<string>();
  for (const student of file.students) {
    if (!isLiveStudent(student, file.meta.quarterName)) continue;
    const alias = aliasWho(student).trim();
    if (alias) names.add(alias);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "skill-track.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/** Staff only. Aliases and levels stay in local storage for this class. */
export function SkillTrack({ file }: { file: EconomyFile }) {
  const { lang, t } = useLang();
  const simple = typeof document !== "undefined" && document.documentElement.dataset.lang === "simple";
  const classId = classIdOf(file.meta.title, file.meta.quarterName);
  const aliases = aliasesOf(file);
  const [book, setBook] = useState<SkillBook>(() => emptyBook(classId));
  const [alias, setAlias] = useState("");
  const [focus, setFocus] = useState<TrackSkill | "">("");
  const [csvOpen, setCsvOpen] = useState(false);
  const [pending, setPending] = useState<Partial<Record<TrackSkill, TrackProof>>>({});

  function say(key: string): string {
    if (simple && COPY.simple[key]) return COPY.simple[key];
    return COPY[lang]?.[key] || EN[key] || key;
  }

  useEffect(() => {
    setBook(loadBook(classId, readKey));
    setAlias("");
    setFocus("");
    setCsvOpen(false);
    setPending({});
  }, [classId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (csvOpen) {
        e.preventDefault();
        setCsvOpen(false);
        return;
      }
      if (focus) {
        e.preventDefault();
        setFocus("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [csvOpen, focus]);

  function commit(next: SkillBook) {
    setBook(next);
    saveBook(next, writeKey);
  }

  function pickLevel(skill: TrackSkill, level: 1 | 2 | 3 | 4) {
    if (!alias) return;
    const proof = pending[skill] || markOf(book, alias, skill)?.proof || "build";
    commit(setLevel(book, alias, skill, level, proof));
  }

  function pickProof(skill: TrackSkill, proof: TrackProof) {
    setPending((cur) => ({ ...cur, [skill]: proof }));
    const mark = alias ? markOf(book, alias, skill) : null;
    if (!alias || !mark) return;
    commit(setLevel(book, alias, skill, mark.level, proof));
  }

  const csv = csvOf(book);
  const summary = classSummary(book, aliases);
  const shown = focus ? aliases.filter((name) => (markOf(book, name, focus)?.level ?? 0) < 3) : aliases;
  function glance(skill: TrackSkill, n: number, total: number): string {
    return say("glance").replaceAll("{name}", say(`skill:${skill}`)).replaceAll("{n}", String(n)).replaceAll("{total}", String(total));
  }
  const chip = "tw-tap inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-semibold";

  return (
    <section data-skill-track className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3" aria-label={t("Skills")}>
      <header className="grid gap-1">
        <h1 className="font-display text-2xl font-semibold">{t("Skills")}</h1>
        <p data-skill-help className="max-w-xl text-sm leading-snug text-muted">{say("help")}</p>
      </header>
      {aliases.length ? (
        <div className="flex max-w-full flex-wrap gap-2" data-skill-overview>
          {summary.map((row) => {
            const counts = [row.n1, row.n2, row.n3, row.n4];
            return (
              <button
                key={row.skill}
                type="button"
                data-skill-chip={row.skill}
                aria-pressed={focus === row.skill}
                onClick={() => setFocus((cur) => (cur === row.skill ? "" : row.skill))}
                className={cn(
                  "tw-tap grid min-h-11 max-w-full gap-1 rounded-xl px-3 py-2 text-start text-sm font-semibold",
                  focus === row.skill ? "bg-accent text-accent-fg ring-2 ring-fg" : "bg-elevated text-fg",
                )}
              >
                <span>{glance(row.skill, row.atLeast3, row.total)}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs font-semibold" data-skill-bar={row.skill}>
                  {counts.map((count, i) => (
                    <span key={i} data-skill-seg={i + 1}>
                      {say("bar")} {i + 1} · {count}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {focus ? <p data-skill-filter className="text-sm font-semibold">{say("below")} · {say(`skill:${focus}`)}</p> : null}
      {aliases.length ? (
        <div className="flex max-w-full flex-wrap gap-2">
          {shown.map((name) => (
            <button
              key={name}
              type="button"
              data-skill-alias={name}
              aria-pressed={alias === name}
              onClick={() => {
                setAlias(name);
                setPending({});
              }}
              className={cn(chip, alias === name ? "bg-accent text-accent-fg" : "bg-elevated text-fg")}
            >
              {name}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">{say("empty")}</p>
      )}
      {alias ? (
        <div className="grid gap-3" data-skill-sheet={alias}>
          {TRACK_SKILLS.map((skill) => {
            const mark = markOf(book, alias, skill);
            const proof = pending[skill] || mark?.proof;
            return (
              <div key={skill} data-skill-row={skill} className="grid gap-2 rounded-xl bg-surface p-2">
                <p className="text-sm font-semibold">{say(`skill:${skill}`)}</p>
                <div className="flex flex-wrap gap-2">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      data-skill-level={n}
                      aria-pressed={mark?.level === n}
                      aria-label={`${say("level")} ${n}`}
                      onClick={() => pickLevel(skill, n)}
                      className={cn(chip, mark?.level === n ? "bg-accent text-accent-fg ring-2 ring-fg" : "bg-elevated text-fg")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{say("saw")}</p>
                <div className="flex flex-wrap gap-2">
                  {TRACK_PROOFS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      data-skill-proof={id}
                      aria-pressed={proof === id}
                      onClick={() => pickProof(skill, id)}
                      className={cn(chip, proof === id ? "bg-accent text-accent-fg ring-2 ring-fg" : "bg-elevated text-fg")}
                    >
                      {say(`proof:${id}`)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-skill-export
          onClick={() => setCsvOpen(true)}
          className={cn(chip, "bg-fg text-bg")}
        >
          <span aria-hidden>↓ </span>
          {say("export")}
        </button>
      </div>
      {csvOpen ? (
        <div role="dialog" aria-label={say("export")} data-skill-csv className="grid gap-2 rounded-xl bg-elevated p-3">
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-sm text-fg">{csv}</pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={cn(chip, "bg-accent text-accent-fg")} onClick={() => downloadCsv(csv)}>
              {say("download")}
            </button>
            <button type="button" className={cn(chip, "bg-surface text-fg")} onClick={() => setCsvOpen(false)}>
              {say("close")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
