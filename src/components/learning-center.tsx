import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, periodTitle, shopBells } from "@/lib/economy";
import { ALL_TRACK, PORTRAIT, SKILL_TRACK, SOFT_TRACK, skillScore } from "@/lib/skills";
import { STEM_LABEL, stemLettersOf, stemsOf } from "@/lib/stems";
import { MST_SKILLS } from "@/lib/mst";
import { abOn, onAbRoster } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { SkillsBoard } from "@/components/skills-board";
import { ProjectsBoard } from "@/components/projects-board";
import { GlossaryDesk } from "@/components/glossary";
import { Chip } from "@/components/ui";
import { BookOpen, GraduationCap, Landmark, Hammer, Heart, FolderKanban } from "lucide-react";
import { Word } from "@/lib/tips";
import { LEARN_CARDS, learnCardOn, loadLearnLook, saveLearnLook, toggleLearnCard, type LearnLook } from "@/lib/learn-look";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

const GradeBoard = lazy(() => import("@/components/grade-board").then((m) => ({ default: m.GradeBoard })));

export type LearnPane = "book" | "skills" | "projects" | "guide" | "words";
export type LearnStart = LearnPane | "eval" | "score" | "grades" | "soft" | "bench" | "data";

function splitStart(start: LearnStart): { pane: LearnPane; family: "shop" | "soft" } {
  if (start === "projects") return { pane: "projects", family: "shop" };
  if (start === "skills" || start === "soft") return { pane: "skills", family: start === "soft" ? "soft" : "shop" };
  if (start === "guide" || start === "bench" || start === "data") return { pane: "guide", family: "shop" };
  if (start === "words") return { pane: "words", family: "shop" };
  return { pane: "book", family: "shop" };
}

export function LearningCenter({
  file,
  onChange,
  unlocked,
  onNeedPin,
  onOpenId,
  start = "grades",
  jumpPeriod: _jumpPeriod,
  jumpCrew: _jumpCrew,
  jumpDate: _jumpDate,
  onOpenSettings: _onOpenSettings,
  onRankUp,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  unlocked: boolean;
  onNeedPin: () => void;
  onOpenId: (id: string) => void;
  start?: LearnStart;
  jumpPeriod?: number | null;
  jumpCrew?: string | null;
  jumpDate?: string | null;
  onOpenSettings?: () => void;
  onRankUp?: (alias: string, band: string) => void;
}) {
  const { t } = useLang();
  const first = splitStart(start);
  const [pane, setPane] = useState<LearnPane>(first.pane);
  const [family, setFamily] = useState<"shop" | "soft">(first.family);
  const [look, setLook] = useState<LearnLook>(() => loadLearnLook());
  useEffect(() => {
    const next = splitStart(start);
    setPane(next.pane);
    setFamily(next.family);
  }, [start]);
  useEffect(() => {
    if (!unlocked && (pane === "book" || pane === "projects" || pane === "skills")) setPane("words");
  }, [unlocked, pane]);
  function flipCard(id: (typeof LEARN_CARDS)[number]["id"]) {
    const next = toggleLearnCard(look, id);
    setLook(next);
    saveLearnLook(next);
    if (!learnCardOn(next, pane) && next.wallOn[0]) setPane(next.wallOn[0] as LearnPane);
  }
  const nav = [
    { id: "book", label: t("Book"), Icon: GraduationCap, on: pane === "book", go: () => setPane("book"), lock: true },
    { id: "projects", label: t("Projects"), Icon: FolderKanban, on: pane === "projects", go: () => setPane("projects"), lock: true },
    { id: "skills", label: t("Skills"), Icon: Hammer, on: pane === "skills", go: () => setPane("skills"), lock: true },
    { id: "words", label: t("Words"), Icon: BookOpen, on: pane === "words", go: () => setPane("words") },
    { id: "guide", label: t("Guide"), Icon: Landmark, on: pane === "guide", go: () => setPane("guide") },
  ].filter((tab) => learnCardOn(look, tab.id as LearnPane) && (unlocked || !tab.lock));
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-1 hidden shrink-0 sm:mb-2 md:block">
        <p className="hidden px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle sm:block">{t("Learn · grades and skills, not daily pay")}</p>
        {unlocked ? (
          <div className="mb-1 flex flex-wrap gap-1">
            {LEARN_CARDS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => flipCard(c.id)}
                className={cn("tw-tap min-h-8 rounded-full px-3 text-[11px] font-semibold", learnCardOn(look, c.id) ? "bg-fg text-bg" : "bg-elevated text-muted line-through")}
              >
                {t(c.label)}
              </button>
            ))}
          </div>
        ) : null}
        <nav className="flex flex-wrap gap-1" aria-label="Learning">
          {nav.map((tab) => (
            <button
              key={tab.id}
              type="button"
              title={tab.label}
              onClick={tab.go}
              className={cn(
                "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-semibold sm:px-3",
                tab.on ? "bg-accent text-accent-fg" : "bg-surface text-muted hover:bg-elevated hover:text-fg",
              )}
            >
              <tab.Icon className="size-4" strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline"><Word>{tab.label}</Word></span>
            </button>
          ))}
        </nav>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {pane === "book" ? (
          <Suspense fallback={<p className="px-3 py-8 text-center text-sm text-gold">Loading gradebook…</p>}>
            <GradeBoard file={file} onChange={onChange} unlocked={unlocked} onNeedPin={onNeedPin} onOpenId={onOpenId} />
          </Suspense>
        ) : null}
        {pane === "guide" ? <GuideDesk file={file} /> : null}
        {pane === "words" ? <GlossaryDesk /> : null}
        {pane === "skills" ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="mb-2 hidden gap-1 md:flex">
              <Chip on={family === "shop"} onClick={() => setFamily("shop")}>
                <Hammer className="mr-1 size-3.5" />
                <Word>Workshop</Word>
              </Chip>
              <Chip on={family === "soft"} onClick={() => setFamily("soft")}>
                <Heart className="mr-1 size-3.5" />
                <Word>Soft</Word>
              </Chip>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <SkillsBoard file={file} onChange={onChange} unlocked={unlocked} onNeedPin={onNeedPin} onOpenId={onOpenId} family={family} onRankUp={onRankUp} />
            </div>
          </div>
        ) : null}
        {pane === "projects" ? (
          <div className="h-full overflow-auto">
            <ProjectsBoard file={file} unlocked={unlocked} onNeedPin={onNeedPin} onChange={onChange} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GuideDesk({ file }: { file: EconomyFile }) {
  const [tab, setTab] = useState<"bench" | "means">("bench");
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex gap-1">
        <Chip on={tab === "bench"} onClick={() => setTab("bench")}>Benchmarks</Chip>
        <Chip on={tab === "means"} onClick={() => setTab("means")}>Class means</Chip>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "bench" ? <BenchPane /> : <DataPane file={file} />}
      </div>
    </div>
  );
}

function BenchPane() {
  return (
    <div className="space-y-3 pb-4">
      <p className="text-sm text-muted">1 Beginning · 2 Developing · 3 Proficient · 4 Distinguished. The four sentences are evidence stems — what you can see. Blank is not a zero.</p>
      <section className="rounded-xl bg-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Workshop</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {SKILL_TRACK.map((s) => (
            <li key={s.id} className="rounded-lg bg-elevated px-3 py-2">
              <p className="font-semibold">
                {s.name}
                <span className="ml-2 font-mono text-[11px] font-normal uppercase tracking-wider text-gold">
                  {stemLettersOf(s.id).map((L) => STEM_LABEL[L][0]).join(" · ")}
                </span>
              </p>
              <p className="text-sm text-muted">{s.bench}</p>
              <ol className="mt-2 space-y-0.5 text-xs text-muted">
                {stemsOf(s.id).map((row) => (
                  <li key={row.n}>
                    <span className="font-mono text-fg">{row.n}</span> {row.text}
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-xs text-subtle">{s.mst.join(" · ")} · {PORTRAIT.find((p) => p.id === s.pog)?.label}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl bg-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Teamwork · soft</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {SOFT_TRACK.map((s) => (
            <li key={s.id} className="rounded-lg bg-elevated px-3 py-2">
              <p className="font-semibold">
                {s.name}
                <span className="ml-2 font-mono text-[11px] font-normal uppercase tracking-wider text-gold">
                  {stemLettersOf(s.id).map((L) => STEM_LABEL[L][0]).join(" · ")}
                </span>
              </p>
              <p className="text-sm text-muted">{s.bench}</p>
              <ol className="mt-2 space-y-0.5 text-xs text-muted">
                {stemsOf(s.id).map((row) => (
                  <li key={row.n}>
                    <span className="font-mono text-fg">{row.n}</span> {row.text}
                  </li>
                ))}
              </ol>
              {s.subs.length ? <p className="mt-1 text-xs text-subtle">{s.subs.map((x) => x.name).join(" · ")}</p> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl bg-surface px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">NY Standard 5</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {MST_SKILLS.map((s) => (
            <li key={s.id} className="rounded-lg bg-elevated px-3 py-2">
              <p className="font-semibold">
                <span className="font-mono text-xs text-gold">{s.id}</span> {s.short}
              </p>
              <p className="text-sm text-muted">{s.bench}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function DataPane({ file }: { file: EconomyFile }) {
  const today = todayIso();
  const letter = abOn(file, today);
  const bells = shopBells(file);
  const rows = useMemo(() => {
    return bells.map((b) => {
      const kids = file.students.filter((s) => s.period === b.period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter));
      const cells = ALL_TRACK.map((sk) => {
        const marks = kids.map((s) => skillScore(s, sk.id)).filter((n) => n > 0);
        const mean = marks.length ? marks.reduce((a, n) => a + n, 0) / marks.length : 0;
        return { id: sk.id, name: sk.name, mean, n: marks.length, family: sk.family };
      });
      return { period: b.period, grade: b.grade, n: kids.length, cells };
    });
  }, [file, bells, letter]);
  return (
    <div className="space-y-3 pb-4">
      <p className="text-sm text-muted">Class mean on 1–4. Empty means not seen.</p>
      {rows.map((r) => (
        <section key={r.period} className="rounded-xl bg-surface px-3 py-3">
          <p className="mb-2 text-sm font-semibold">{periodTitle(r.period, bells)} · {r.n} workers</p>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
            {r.cells.map((c) => (
              <div key={c.id} className={cn("rounded-md px-2 py-2", c.family === "soft" ? "bg-elevated" : "bg-bg")} title={`${c.name} · ${c.n} seen`}>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-subtle">{c.name}</p>
                <p className={cn("font-display text-xl font-semibold tabular-nums", c.mean >= 3 ? "text-gold" : c.mean ? "text-fg" : "text-subtle")}>
                  {c.mean ? c.mean.toFixed(1) : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
