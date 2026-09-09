import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { todayIso } from "@/lib/calendar";

export type PollKind = "yesno" | "abcd" | "scale" | "emoji" | "custom";

export type PollOption = { id: string; label: string };

export type Poll = {
  id: string;
  prompt: string;
  kind: PollKind;
  options: PollOption[];
  /** 0 = every Tech period today. */
  period: number;
  date: string;
  open: boolean;
  votes: Record<string, string>;
  closedAt?: string;
};

export type PollBankItem = { id: string; prompt: string; kind: PollKind; options?: string[] };

export const POLL_TEMPLATES: PollBankItem[] = [
  { id: "ready", prompt: "Ready to work?", kind: "yesno" },
  { id: "demo", prompt: "Need the demo again?", kind: "yesno" },
  { id: "safety", prompt: "I can say the safety rule.", kind: "yesno" },
  { id: "clean", prompt: "Stations ready?", kind: "yesno" },
  { id: "exit", prompt: "How sure are you right now?", kind: "scale" },
  { id: "mood", prompt: "How's the crew?", kind: "emoji" },
  { id: "pick", prompt: "Which is the right move?", kind: "abcd" },
];

const KIND_OPTS: Record<Exclude<PollKind, "custom">, PollOption[]> = {
  yesno: [
    { id: "yes", label: "YES" },
    { id: "no", label: "NOT YET" },
  ],
  abcd: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
    { id: "d", label: "D" },
  ],
  scale: [
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
  ],
  emoji: [
    { id: "great", label: "😀" },
    { id: "ok", label: "🙂" },
    { id: "meh", label: "😐" },
    { id: "stuck", label: "😕" },
  ],
};

function bag(file: EconomyFile) {
  return file.meta.polls ?? { live: null, archive: [], bank: [] };
}

export function livePoll(file: EconomyFile): Poll | null {
  const p = bag(file).live;
  return p?.open ? p : null;
}

export function pollForPeriod(file: EconomyFile, period: number): Poll | null {
  const p = livePoll(file);
  if (!p) return null;
  if (p.period === 0 || p.period === period) return p;
  return null;
}

export function optionsOf(kind: PollKind, custom?: string[]): PollOption[] {
  if (kind === "custom") {
    return (custom ?? []).filter(Boolean).slice(0, 6).map((label, i) => ({
      id: `c${i}`,
      label: label.trim().slice(0, 24).toUpperCase(),
    }));
  }
  return KIND_OPTS[kind];
}

function put(file: EconomyFile, patch: Partial<NonNullable<EconomyFile["meta"]["polls"]>>): EconomyFile {
  const next = cloneFile(file);
  const cur = bag(next);
  next.meta.polls = {
    live: patch.live !== undefined ? patch.live : cur.live ?? null,
    archive: patch.archive ?? cur.archive ?? [],
    bank: patch.bank ?? cur.bank ?? [],
  };
  return next;
}

export function launchPoll(
  file: EconomyFile,
  input: { prompt: string; kind: PollKind; period: number; options?: string[]; date?: string },
): EconomyFile {
  const options = optionsOf(input.kind, input.options);
  if (!options.length) return file;
  const poll: Poll = {
    id: `p${Date.now().toString(36)}`,
    prompt: input.prompt.trim().slice(0, 80) || "Vote",
    kind: input.kind,
    options,
    period: input.period,
    date: input.date ?? todayIso(),
    open: true,
    votes: {},
  };
  const cur = bag(file);
  const archive = cur.live && Object.keys(cur.live.votes).length ? [closeCopy(cur.live), ...(cur.archive ?? [])].slice(0, 40) : (cur.archive ?? []).slice(0, 40);
  return put(file, { live: poll, archive });
}

function closeCopy(p: Poll): Poll {
  return { ...p, open: false, closedAt: new Date().toISOString(), votes: { ...p.votes } };
}

export function closePoll(file: EconomyFile): EconomyFile {
  const live = bag(file).live;
  if (!live) return file;
  const archive = [closeCopy(live), ...(bag(file).archive ?? [])].slice(0, 40);
  return put(file, { live: null, archive });
}

export function cancelPoll(file: EconomyFile): EconomyFile {
  const live = bag(file).live;
  if (!live) return file;
  if (Object.keys(live.votes).length) return closePoll(file);
  return put(file, { live: null });
}

export function votePoll(file: EconomyFile, studentId: string, optionId: string): EconomyFile {
  const live = livePoll(file);
  if (!live) return file;
  if (!live.options.some((o) => o.id === optionId)) return file;
  const s = file.students.find((row) => row.id === studentId);
  if (!s) return file;
  if (live.period !== 0 && s.period !== live.period) return file;
  const next = cloneFile(file);
  const p = next.meta.polls?.live;
  if (!p) return file;
  p.votes = { ...p.votes, [studentId]: optionId };
  return next;
}

export function pollHead(file: EconomyFile, period: number): { in: number; of: number } {
  const p = pollForPeriod(file, period);
  if (!p) return { in: 0, of: 0 };
  const of = rosterFor(file, p).length;
  const inn = rosterFor(file, p).filter((s) => p.votes[s.id]).length;
  return { in: inn, of };
}

export function rosterFor(file: EconomyFile, p: Poll): RawStudent[] {
  const q = file.meta.quarterName;
  return file.students.filter((s) => isLiveStudent(s, q) && (p.period === 0 || s.period === p.period) && s.period !== 6);
}

export function tallyOf(p: Poll, file?: EconomyFile): { id: string; label: string; n: number; pct: number }[] {
  const ids = file ? rosterFor(file, p).map((s) => s.id) : Object.keys(p.votes);
  const set = new Set(ids);
  const total = Math.max(1, file ? set.size : Object.keys(p.votes).length || 1);
  return p.options.map((o) => {
    const n = Object.entries(p.votes).filter(([id, v]) => v === o.id && (!file || set.has(id))).length;
    return { id: o.id, label: o.label, n, pct: Math.round((n / total) * 100) };
  });
}

export function saveBankItem(file: EconomyFile, item: PollBankItem): EconomyFile {
  const bank = [...(bag(file).bank ?? []).filter((b) => b.id !== item.id), { ...item, prompt: item.prompt.trim().slice(0, 80) }].slice(-24);
  return put(file, { bank });
}

export function removeBankItem(file: EconomyFile, id: string): EconomyFile {
  return put(file, { bank: (bag(file).bank ?? []).filter((b) => b.id !== id) });
}

export function pollArchive(file: EconomyFile): Poll[] {
  return bag(file).archive ?? [];
}

export function pollBank(file: EconomyFile): PollBankItem[] {
  return bag(file).bank ?? [];
}

export function compactPolls(file: EconomyFile): NonNullable<EconomyFile["meta"]["polls"]> | undefined {
  const cur = file.meta.polls;
  if (!cur) return undefined;
  return {
    live: cur.live ?? null,
    archive: (cur.archive ?? []).slice(0, 40),
    bank: (cur.bank ?? []).slice(0, 24),
  };
}
