import { useEffect, useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, periodTitle, score, shopBells } from "@/lib/economy";
import { PORTRAIT, SKILL_MARKS, SKILL_WHY, ALL_TRACK, crossedBand, setSkillScore, skillForGoal, skillScore, skillTrackOf, skillXp, skillsOfFamily, workerLevel, xpIntoLevel, type SkillFamily } from "@/lib/skills";
import { STEM_LABEL, stemLettersOf, stemOf, stemsOf } from "@/lib/stems";
import { abOn, deskBellId, onAbRoster, periodGoal } from "@/lib/store";
import { crewsOf } from "@/lib/crews";
import { agendaFor } from "@/lib/projects";
import { todayIso } from "@/lib/calendar";
import { periodNow } from "@/lib/bells";
import { downloadText } from "@/lib/live";
import {
  MST_SCORES,
  MST_SKILLS,
  addProject,
  currentProject,
  exportMstCsv,
  inScope,
  recordOn,
  setCurrentProject,
  setMstScore,
  type MstSkillId,
} from "@/lib/mst";
import { QuarterChip } from "@/components/quarter-chip";
import { applySort, decorateRank, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { LevelMark } from "@/components/level-mark";
import { RewardBar } from "@/components/reward-bar";
import { featureOn } from "@/lib/features";
import { cn } from "@/lib/utils";

const MARKS = SKILL_MARKS;

function prettySkill(id: string, name: string) {
  return skillTrackOf(id)?.name ?? (name.charAt(0).toUpperCase() + name.slice(1).toLowerCase());
}

function SkillGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-surface px-3 py-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-gold">
        {open ? "Hide skill list" : "What we track · workshop + NY Tech"}
      </button>
      {open ? (
        <div className="mt-2 overflow-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="text-subtle">
                <th className="py-1 font-medium">Skill</th>
                <th className="py-1 font-medium">What you actually watch</th>
                <th className="py-1 font-medium">STEM</th>
                <th className="py-1 font-medium">Portrait</th>
                <th className="py-1 font-medium">NY Standard 5</th>
              </tr>
            </thead>
            <tbody>
              {ALL_TRACK.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-1.5 font-semibold">{s.name}</td>
                  <td className="py-1.5 text-muted">{s.does}</td>
                  <td className="py-1.5 font-mono text-xs text-gold" title={stemLettersOf(s.id).map((L) => STEM_LABEL[L]).join(" · ")}>
                    {stemLettersOf(s.id).join("")}
                  </td>
                  <td className="py-1.5 text-xs text-subtle">{PORTRAIT.find((p) => p.id === s.pog)?.label}</td>
                  <td className="py-1.5 font-mono text-xs text-subtle">{s.mst.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-medium text-subtle">Standard 5 benchmark (NY Tech tab, 1–4)</p>
          <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
            {MST_SKILLS.map((s) => (
              <li key={s.id}>
                <span className="font-mono text-xs text-gold">{s.id}</span>{" "}
                <span className="font-semibold">{s.short}</span>
                <span className="text-muted"> — {s.bench}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-subtle">Marks are 1–4 (Beginning → Distinguished). Watch shows the four evidence stems — not a second MST score. XP, not pay. Portrait of a Graduate is the attribute, not a second grade.</p>
        </div>
      ) : null}
    </div>
  );
}

function SkillKey() {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
      {MARKS.map((m) => (
        <span key={m.n}>
          <span className="font-mono font-semibold text-fg">{m.n}</span>
          <span className="text-subtle"> {m.name}</span>
        </span>
      ))}
      <span className="text-subtle">Blank is not a zero.</span>
    </p>
  );
}

export function SkillsBoard({
  file,
  onChange,
  unlocked,
  onNeedPin,
  onOpenId,
  onRankUp,
  family = "shop",
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  unlocked: boolean;
  onNeedPin: () => void;
  onOpenId: (id: string) => void;
  onRankUp?: (alias: string, band: string) => void;
  family?: SkillFamily;
}) {
  const bells = shopBells(file);
  const today = todayIso();
  const letter = abOn(file, today);
  const skills = skillsOfFamily(file, family);
  const live = periodNow(deskBellId(file));
  const [period, setPeriod] = useState(() =>
    live && bells.some((b) => b.period === live) ? live : (bells[0]?.period ?? 1),
  );
  const [mode, setMode] = useState<"watch" | "map" | "standard">("watch");
  const [more, setMore] = useState(false);
  const agenda = agendaFor(file, period);
  const goal = periodGoal(file, today, period) || agenda.goal;
  const suggest = agenda.skillId || skillForGoal(goal);
  const [skillId, setSkillId] = useState(() => (family === "soft" ? "listen" : suggest));
  const [sort, setSort] = useState<SortKey>("name");
  const [crewKey, setCrewKey] = useState("");

  useEffect(() => {
    const next = family === "soft" ? "listen" : agendaFor(file, period).skillId || skillForGoal(goal);
    setSkillId(next);
    setMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, family]);

  const kids = useMemo(() => {
    const liveKids = score(file).filter(
      (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
    );
    return applySort(decorateRank(file, liveKids), sort);
  }, [file, period, letter, sort]);

  const crews = useMemo(() => crewsOf(file, period, today), [file, period, today]);
  const crew = crews.find((c) => c.key === crewKey);

  useEffect(() => {
    if (!crews.some((c) => c.key === crewKey)) setCrewKey(crews[0]?.key ?? "");
  }, [crews, crewKey]);

  const target = (agenda.activity?.expect ?? 3) as 1 | 2 | 3 | 4;
  function goNextCrew() {
    if (!crews.length) return;
    const i = crews.findIndex((c) => c.key === crew?.key);
    const next = crews[(i + 1) % crews.length];
    if (next) setCrewKey(next.key);
  }

  const parentId = skillId.split(":")[0] ?? skillId;
  const skill = skills.find((s) => s.id === parentId) ?? skills[0];
  const sub = skillTrackOf(parentId)?.subs.find((x) => `${parentId}:${x.id}` === skillId);
  const seen = kids.filter((s) => skillScore(s, skillId) > 0).length;
  const need = kids.filter((s) => skillScore(s, skillId) === 0);

  function tap(id: string, sk: string, n: number) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    const row = file.students.find((s) => s.id === id);
    if (!row) return;
    const cur = skillScore(row, sk);
    const before = skillXp(file, id);
    const next = setSkillScore(file, id, sk, cur === n ? 0 : n, {
      source: mode,
      crewKey: crew?.key,
      projectId: agenda.project?.id || agenda.title,
    });
    const band = crossedBand(file, before, skillXp(next, id));
    onChange(next);
    if (band) onRankUp?.(row.first, band);
    if (mode === "watch" && crew && cur === 0 && n > 0) {
      const left = crew.kids.filter((s) => s.id !== id && skillScore(s, sk) === 0);
      if (!left.length) window.setTimeout(() => goNextCrew(), 220);
    }
  }

  function tapMst(id: string, sid: MstSkillId, n: number) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    const project = currentProject(file);
    onChange(setMstScore(file, { studentId: id, projectId: project.id, skillId: sid, score: n }));
  }

  const modes = [
    { id: "watch" as const, label: "Watch", hint: "One skill. Four stems. Walk the room." },
    { id: "map" as const, label: "Sit-down", hint: "Every skill for this class. PIN." },
    ...(featureOn(file, "nytech")
      ? [{ id: "standard" as const, label: "NY Tech", hint: "State Standard 5 on the project." }]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="rounded-xl bg-surface px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <QuarterChip />
          {bells.map((b) => (
            <button
              key={b.period}
              type="button"
              onClick={() => setPeriod(b.period)}
              className={cn("min-h-12 rounded-lg px-3 text-base font-semibold", period === b.period ? "bg-accent text-accent-fg" : "text-muted hover:bg-elevated")}
            >
              {periodTitle(b.period, bells)}
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.hint}
              onClick={() => {
                if (m.id === "map" && !unlocked) {
                  onNeedPin();
                  return;
                }
                setMode(m.id);
              }}
              className={cn("min-h-12 rounded-lg px-4 text-base font-semibold", mode === m.id ? "bg-gold text-bg" : "text-muted hover:bg-elevated")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="hidden px-1 text-sm text-subtle sm:block">{modes.find((m) => m.id === mode)?.hint} Not money.</p>
      {mode === "map" ? <RewardBar file={file} period={period} /> : null}
      {mode !== "watch" ? <SkillGuide /> : null}

      {mode === "watch" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="rounded-xl bg-surface px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-display text-2xl font-semibold tracking-tight">
                {prettySkill(skill.id, skill.name)}
                {sub ? ` · ${sub.name}` : ""}
              </p>
              <p className="text-sm text-muted">{sub?.does ?? skillTrackOf(skill.id)?.does ?? SKILL_WHY[skill.id]}</p>
              <span className="font-mono text-[11px] uppercase tracking-wider text-gold">
                {stemLettersOf(skillId).join(" · ")}
              </span>
            </div>
            {agenda.project?.prompt ? <p className="mt-1 text-sm text-gold">{agenda.project.prompt}</p> : null}
            <p className="mt-1 text-xs text-subtle">Look for a {target}: {stemOf(skillId, target)}</p>
            <ol className="mt-2 grid gap-1 sm:grid-cols-2">
              {stemsOf(skillId).map((row) => (
                <li key={row.n} className="flex gap-2 text-sm">
                  <span className={cn("font-mono font-semibold", agenda.activity?.expect === row.n ? "text-gold" : "text-fg")}>{row.n}</span>
                  <span className="text-muted">{row.text}</span>
                </li>
              ))}
            </ol>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-subtle">Goal: {goal || "—"}</span>
              <span className="text-subtle">
                {seen}/{kids.length} seen
                {need.length ? ` · look first: ${need.map((s) => s.first).join(", ")}` : " · everyone has a mark"}
              </span>
              <button type="button" onClick={() => setMore((v) => !v)} className="min-h-9 text-sm font-semibold text-gold">
                {more ? "Hide skills" : "Other skill"}
              </button>
            </div>
          </div>
          {more ? (
            <div className="flex flex-wrap gap-1">
              {skills.map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => setSkillId(sk.id)}
                  className={cn(
                    "min-h-11 rounded-md px-3 text-sm font-semibold",
                    sk.id === skill.id ? "bg-fg text-bg" : "bg-surface text-muted",
                  )}
                >
                  {prettySkill(sk.id, sk.name)}
                </button>
              ))}
            </div>
          ) : null}
          {skillTrackOf(skill.id)?.subs?.length ? (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSkillId(skill.id.split(":")[0] ?? skill.id)}
                className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", !skillId.includes(":") ? "bg-gold text-bg" : "bg-elevated text-muted")}
              >
                Whole
              </button>
              {skillTrackOf(skill.id)?.subs.map((sub) => {
                const id = `${skill.id.split(":")[0]}:${sub.id}`;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    title={sub.does}
                    onClick={() => setSkillId(id)}
                    className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", skillId === id ? "bg-gold text-bg" : "bg-elevated text-muted")}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          ) : null}
          <SkillKey />
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {crews.map((c) => {
              const marked = c.kids.filter((s) => skillScore(s, skillId) > 0).length;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCrewKey(c.key)}
                  className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold", crew?.key === c.key ? "bg-gold text-bg" : "bg-surface text-muted")}
                >
                  {c.name}
                  <span className="font-mono text-[11px] opacity-80">{marked}/{c.kids.length}</span>
                </button>
              );
            })}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto sm:grid-cols-2">
            {(crew?.kids ?? []).map((s) => {
              const cur = skillScore(s, skillId);
              return (
                <article key={s.id} className={cn("flex min-h-0 flex-col gap-2 rounded-2xl bg-surface p-3", cur === 0 ? "ring-1 ring-gold/60" : "")}>
                  <button type="button" onClick={() => onOpenId(s.id)} className="truncate text-left font-display text-2xl font-semibold">
                    {s.first}
                  </button>
                  <div className="grid min-h-20 flex-1 grid-cols-4 gap-1.5">
                    {MARKS.map((m) => (
                      <button
                        key={m.n}
                        type="button"
                        title={stemOf(skillId, m.n)}
                        onClick={() => tap(s.id, skillId, m.n)}
                        className={cn(
                          "tw-tap min-h-16 rounded-xl font-display text-3xl font-semibold",
                          cur === m.n ? "bg-accent text-accent-fg" : agenda.activity?.expect === m.n ? "bg-elevated text-gold ring-1 ring-gold/50" : "bg-elevated text-muted",
                        )}
                      >
                        {m.n}
                      </button>
                    ))}
                  </div>
                  {cur ? <p className="text-sm text-muted">{stemOf(skillId, cur)}</p> : <p className="text-sm font-semibold text-gold">Not seen</p>}
                </article>
              );
            })}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              disabled={!crew}
              onClick={() => {
                if (!unlocked) {
                  onNeedPin();
                  return;
                }
                if (!crew) return;
                let next = file;
                for (const s of crew.kids) {
                  if (skillScore(s, skillId) === 0) next = setSkillScore(next, s.id, skillId, target, { source: "watch", crewKey: crew.key, projectId: agenda.project?.id });
                }
                onChange(next);
              }}
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl bg-elevated text-base font-semibold disabled:opacity-40"
              title={stemOf(skillId, target)}
            >
              All {target}s
            </button>
            <button
              type="button"
              disabled={!crew}
              onClick={goNextCrew}
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl bg-accent text-base font-semibold text-accent-fg disabled:opacity-40"
            >
              Next crew
            </button>
          </div>
        </div>
      ) : mode === "standard" && featureOn(file, "nytech") ? (
        <StandardGrid file={file} kids={kids} unlocked={unlocked} onNeedPin={onNeedPin} onChange={onChange} onOpenId={onOpenId} onTap={tapMst} />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <SkillKey />
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm text-muted">Tap a cell: 1 Beginning → 4 Distinguished → blank. Same 1–4 as NY Tech.</p>
            <SortBar value={sort} onChange={setSort} keys={["name", "level", "crew"]} />
          </div>
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="text-subtle">
                <th className="sticky left-0 bg-bg py-2 pr-2 font-medium">Name</th>
                {skills.map((sk) => (
                  <th key={sk.id} className="px-1 py-2 text-center font-medium" title={SKILL_WHY[sk.id]}>
                    {prettySkill(sk.id, sk.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kids.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="sticky left-0 bg-bg py-1 pr-2">
                    <button type="button" onClick={() => onOpenId(s.id)} className="font-medium">
                      {s.first}
                    </button>
                    <LevelMark level={workerLevel(file, s.id)} xp={xpIntoLevel(file, s.id).xp} className="ml-1 text-xs" />
                  </td>
                  {skills.map((sk) => {
                    const cur = skillScore(s, sk.id);
                    const mark = cur ? MARKS[cur - 1] : null;
                    return (
                      <td key={sk.id} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          title={mark ? mark.why : "Not seen yet"}
                          onClick={() => tap(s.id, sk.id, cur === 4 ? 0 : cur + 1)}
                          className={cn(
                            "inline-flex min-h-11 min-w-14 items-center justify-center rounded-md px-1 text-xs font-semibold",
                            cur === 4 ? "bg-gold text-bg" : cur ? "bg-elevated text-fg" : "bg-surface text-subtle",
                          )}
                        >
                          {mark?.short ?? "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StandardGrid({
  file,
  kids,
  unlocked,
  onNeedPin,
  onChange,
  onOpenId,
  onTap,
}: {
  file: EconomyFile;
  kids: ReturnType<typeof score>;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onOpenId: (id: string) => void;
  onTap: (id: string, skill: MstSkillId, n: number) => void;
}) {
  const project = currentProject(file);
  const scope = inScope(project);
  const cols = MST_SKILLS.filter((s) => scope.includes(s.id));
  const [title, setTitle] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <p className="text-sm text-muted">
        New York technology standard on <span className="font-semibold text-fg">{project.title}</span>. 1 beginning → 4 advanced. Still not pay.
      </p>
      <p className="text-sm text-subtle">
        {MST_SCORES.map((s) => (
          <span key={s.value} className="mr-3">
            {s.value} {s.title}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {(file.meta.mst?.projects ?? []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(setCurrentProject(file, p.id))}
            className={cn("min-h-11 rounded-md px-3 text-sm", p.id === project.id ? "bg-fg text-bg" : "bg-surface text-muted")}
          >
            {p.title}
          </button>
        ))}
        {unlocked ? (
          <form
            className="flex min-h-11 gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              onChange(addProject(file, title.trim()));
              setTitle("");
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New project name"
              className="min-h-11 w-40 rounded-md bg-surface px-2 text-sm outline-none"
            />
          </form>
        ) : null}
        <button
          type="button"
          onClick={() => downloadText("techworks-mst.csv", exportMstCsv(file, file.students), "text/csv")}
          className="min-h-11 rounded-md bg-surface px-3 text-sm"
        >
          Export CSV
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="text-subtle">
              <th className="sticky left-0 bg-bg py-2 pr-2 font-medium">Name</th>
              {cols.map((sk) => (
                <th key={sk.id} className="px-1 py-2 text-center font-medium" title={sk.bench}>
                  {sk.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kids.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="sticky left-0 bg-bg py-1 pr-2">
                  <button type="button" onClick={() => onOpenId(s.id)} className="font-medium">
                    {s.first}
                  </button>
                </td>
                {cols.map((sk) => {
                  const rec = recordOn(file, s.id, project.id, sk.id);
                  const n = rec?.score ?? 0;
                  const meta = MST_SCORES.find((x) => x.value === n);
                  return (
                    <td key={sk.id} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        title={meta ? meta.title : "Not scored yet"}
                        onClick={() => {
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          onTap(s.id, sk.id, n >= 4 ? 1 : n + 1);
                        }}
                        className={cn(
                          "inline-flex size-11 items-center justify-center rounded-md text-xs font-semibold",
                          n ? meta?.className : "bg-surface text-subtle",
                        )}
                      >
                        {meta ? meta.title.slice(0, 3) : "—"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
