"use client";

import { lazy, startTransition, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp, Search, Settings } from "lucide-react";
import { TwWordmark } from "@/components/tw-mark";
import snapshot from "@/data/economy.json";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent, score } from "@/lib/economy";
import { loadDesk, saveDesk, saveDeskNow, applyDjia, stampLiveExport, isSubDay, exportedThisPeriod, lunchOn, deskBellId, deskSavePending, setSchooltoolDone } from "@/lib/store";
import { hydrateVault } from "@/lib/vault";
import { applyCloudPack, cloudPackCount, cloudSyncPlan, localIsNewer, pullCloud, pushCloud } from "@/lib/desk-cloud";
import { CloudChip } from "@/components/cloud-board";
import { LockBar, PinPad } from "@/components/pin-pad";
import { DescribeBar } from "@/components/describe-bar";
import { storedDescribe } from "@/lib/describe";
import { TipsProvider } from "@/lib/tips";
import { Dashboard } from "@/components/dashboard";
import { featureOn } from "@/lib/features";
import { paintDemo, SAVE_FAIL_EVENT, storedDemo, takeRealDesk, type DemoId } from "@/lib/demo";
import { isUnlocked, lockCrew, ensureDefaultPin } from "@/lib/pin";
import { daySlot, isSchoolDay, todayIso } from "@/lib/calendar";
import { loadDjia, type DjiaQuote } from "@/lib/djia";
import { downloadText, periodPulses, publicHandle, publishLive, splitExport } from "@/lib/live";
import { paintCleanup, periodNow, SCHOOLTOOL_URL } from "@/lib/bells";
import { CleanupStage } from "@/components/cleanup-wall";
import { NowDock } from "@/components/now-dock";
import { NextJobChip } from "@/components/next-job";
import { installLayoutWatch, surfaceOf, useLayout } from "@/lib/layout";
import { PhoneDock } from "@/components/phone-dock";
import { applyTheme, applyVibe, paintContrast, storedContrast, storedTheme, storedVibe } from "@/lib/theme";
import { bootLang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-hook";
import { LangChip } from "@/components/lang-chip";
import { VersionChip } from "@/components/version-chip";
import { ErrorGate } from "@/components/error-gate";
import { AdminHub } from "@/components/admin-hub";
import type { LearnStart } from "@/components/learning-center";
import { SettingsBody, type AdminPane } from "@/components/settings";
import { gearTabFor } from "@/components/admin-drawer";
import { modeOf } from "@/components/mode-nav";
import { AppNav } from "@/components/app-nav";
import { sectionOf, type AppSection, type NavTab } from "@/lib/app-nav";
import { ADMIN_GROUPS, defaultPane, paneInGroup } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import { HOUSE_BERTY, HOUSE_MRK, houseHits } from "@/lib/house";
import type { NextJob } from "@/lib/workflow";
import { markSchooltoolOpened, saveCloudHint } from "@/lib/workflow";

const RosterWall = lazy(() => import("@/components/roster-wall").then((m) => ({ default: m.RosterWall })));
const ScoreDesk = lazy(() => import("@/components/score").then((m) => ({ default: m.ScoreDesk })));
const CrewLead = lazy(() => import("@/components/crew-lead").then((m) => ({ default: m.CrewLead })));
const SkillsBoard = lazy(() => import("@/components/learning-center").then((m) => ({ default: m.LearningCenter })));
const WalletBoard = lazy(() => import("@/components/wallet").then((m) => ({ default: m.WalletBoard })));
const LuckyBoard = lazy(() => import("@/components/lucky-board").then((m) => ({ default: m.LuckyBoard })));
const Dossier = lazy(() => import("@/components/dossier").then((m) => ({ default: m.Dossier })));
const HelpPanel = lazy(() => import("@/components/help").then((m) => ({ default: m.HelpPanel })));
const StoreBoard = lazy(() => import("@/components/store-board").then((m) => ({ default: m.StoreBoard })));
const PrintsBoard = lazy(() => import("@/components/prints-board").then((m) => ({ default: m.PrintsBoard })));
const WorkerPortal = lazy(() => import("@/components/portal").then((m) => ({ default: m.WorkerPortal })));
const StudyHallBoard = lazy(() => import("@/components/study-hall-board").then((m) => ({ default: m.StudyHallBoard })));
const StudyHallDash = lazy(() => import("@/components/study-hall-dash").then((m) => ({ default: m.StudyHallDash })));
const ClubBoard = lazy(() => import("@/components/club-board").then((m) => ({ default: m.ClubBoard })));
const WeekBoard = lazy(() => import("@/components/week-board").then((m) => ({ default: m.WeekBoard })));
const YearBoard = lazy(() => import("@/components/year-board").then((m) => ({ default: m.YearBoard })));
const DataBoard = lazy(() => import("@/components/data-board").then((m) => ({ default: m.DataBoard })));
const TeachBoard = lazy(() => import("@/components/teach-board").then((m) => ({ default: m.TeachBoard })));
const LessonBoard = lazy(() => import("@/components/lesson-board").then((m) => ({ default: m.LessonBoard })));
const PollBoard = lazy(() => import("@/components/polls").then((m) => ({ default: m.PollBoard })));
const DeckBoard = lazy(() => import("@/components/deck-board").then((m) => ({ default: m.DeckBoard })));

const RANK_KEY = "techworks-rank-board";

type View = "crew" | "score" | "overview" | "week" | "year" | "data" | "wallet" | "lucky" | "skills" | "store" | "prints" | "portal" | "grades" | "studyhall" | "hallwall" | "club" | "clubwall" | "projects" | "admin" | "teach" | "polls" | "deck" | "roster";
type DeskPanel = "score" | "schedule" | "config";

export function Board() {
  const seed = snapshot as unknown as EconomyFile;
  const { t } = useLang();
  const [embed, setEmbed] = useState(false);
  const [portalMode, setPortalMode] = useState(false);
  const [file, setFile] = useState<EconomyFile>(seed);
  const [demoId, setDemoId] = useState<DemoId>("off");
  const graphFile = useMemo(() => {
    if (!featureOn(file, "debug") || demoId === "off") return file;
    return paintDemo(file, demoId);
  }, [file, demoId]);
  const wallFile = useDeferredValue(graphFile);
  const overlayOn = featureOn(file, "debug") && demoId !== "off";
  const list = useMemo(() => score(wallFile), [wallFile]);
  const bells = useMemo(() => bellFor(wallFile), [wallFile]);
  const [view, setView] = useState<View>("overview");
  const [learnStart, setLearnStart] = useState<LearnStart>("projects");
  const [teachStart, setTeachStart] = useState<"now" | "plans">("now");
  const [deskPanel] = useState<DeskPanel>("score");
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [quote, setQuote] = useState<DjiaQuote | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [crewOn, setCrewOn] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [jumpPeriod, setJumpPeriod] = useState<number | null>(null);
  const [jumpCrew, setJumpCrew] = useState<string | null>(null);
  const [jumpDate, setJumpDate] = useState<string | null>(null);
  const [deskPad, setDeskPad] = useState<"effort" | "skill">("effort");
  const [adminPane, setAdminPane] = useState<AdminPane>("today");
  const [gearOpen, setGearOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [describeOn, setDescribeOn] = useState(false);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<{ msg: string; tone?: "ok" | "warn" | "loss" } | null>(null);
  const [rankBoard, setRankBoard] = useState<"skill" | "perk">("skill");
  const skipSave = useRef(true);
  const today = todayIso();
  const dueN = useMemo(() => {
    const p = periodPulses(file, today);
    return Object.values(p).reduce((n, x) => n + x.due + x.overdue, 0);
  }, [file, today]);
  const slot = daySlot(today);
  const qFind = query.trim().toLowerCase();
  const houseMatch = qFind ? houseHits(qFind) : [];
  const hits = qFind
    ? wallFile.students
        .filter((s) => isLiveStudent(s, wallFile.meta.quarterName) && (view === "studyhall" || view === "data" || s.period !== 6))
        .filter((s) => {
          return s.first.toLowerCase().includes(qFind) || publicHandle(s.id).toLowerCase().includes(qFind) || s.id.toLowerCase().includes(qFind);
        })
        .slice(0, 8)
    : [];

  function openHouse(id: string) {
    setQuery("");
    setOpenId(id);
  }

  function askPin(next?: View) {
    setPendingView(next ?? view);
    setPinOpen(true);
  }

  const verChip = <VersionChip peek onBerty={() => setOpenId(HOUSE_BERTY)} onMrk={() => setOpenId(HOUSE_MRK)} />;

  function go(next: View) {
    if (embed) {
      setView("overview");
      return;
    }
    const teacher = ["admin", "score", "grades", "projects", "store", "studyhall", "crew", "lucky", "roster"].includes(next);
    if (teacher && !unlocked && !(next === "crew" && crewOn)) {
      askPin(next);
      return;
    }
    if (next === "skills" && !unlocked) {
      setLearnStart("words");
      startTransition(() => setView("skills"));
      return;
    }
    if (crewOn && next !== "crew") {
      return;
    }
    startTransition(() => {
      if (next === "grades" || next === "projects") {
        setLearnStart(next === "grades" ? "grades" : "projects");
        setView("skills");
        return;
      }
      if (next === "skills") {
        setView("skills");
        return;
      }
      if (next === "week" || next === "year" || next === "data") {
        setView(next);
        return;
      }
      if (next === "wallet" && !featureOn(file, "stocks")) {
        flashMsg("Stocks is off · Admin");
        return;
      }
      if (next === "lucky" && !featureOn(file, "lucky")) {
        flashMsg("Lucky Bench is off · Admin");
        return;
      }
      if (next === "store" && !featureOn(file, "store")) {
        flashMsg("Store is off · Admin");
        return;
      }
      if (next === "prints" && !featureOn(file, "prints")) {
        flashMsg("Prints is off · Admin");
        return;
      }
      if (next === "portal" && !featureOn(file, "portal")) {
        flashMsg("Portal is off · Admin");
        return;
      }
      if (next === "polls" && !featureOn(file, "polls")) {
        flashMsg("Polls is off · Admin");
        return;
      }
      if (next === "teach" && !featureOn(file, "teach")) {
        flashMsg("Teach is off · Admin");
        return;
      }
      setView(next);
    });
  }

  function goDesk(_panel?: DeskPanel) {
    if (crewOn) return;
    if (!unlocked) {
      askPin("score");
      return;
    }
    startTransition(() => setView("score"));
  }

  function runJob(job: NextJob) {
    if (job.go === "schooltool") {
      window.open(SCHOOLTOOL_URL, "_blank", "noreferrer");
      markSchooltoolOpened(todayIso());
      return;
    }
    if (job.go === "schooltool-in") {
      setFile((cur) => setSchooltoolDone(cur, todayIso(), 1, true));
      flashMsg("SchoolTool in", "ok");
      return;
    }
    if (job.go === "export") {
      saveNow(job.period);
      return;
    }
    if (job.go === "score" || job.go === "verify") {
      if (job.period) setJumpPeriod(job.period);
      if (job.crew) setJumpCrew(job.crew);
      if (job.date) setJumpDate(job.date);
      goDesk("score");
      return;
    }
    if (job.go === "hall") {
      go(unlocked ? "studyhall" : "hallwall");
      return;
    }
    if (job.go === "teach") {
      go("teach");
      return;
    }
    if (job.go === "admin") {
      setAdminPane("today");
      go("admin");
      return;
    }
    go("overview");
  }

  function flashMsg(msg: string, tone?: "ok" | "warn" | "loss") {
    setFlash({ msg, tone });
    window.setTimeout(() => setFlash(null), 2400);
  }

  function commitDesk(next: EconomyFile) {
    setFile(takeRealDesk(file, next, overlayOn));
  }

  function rankUp(alias: string, band: string) {
    flashMsg(`${alias} → ${band}`, "ok");
  }

  function saveNow(period?: number) {
    saveDeskNow(file);
    if (file.students.length > 0) void pushCloud(file);
    setFile((cur) => stampLiveExport(cur, todayIso(), period ?? liveP ?? undefined));
    window.setTimeout(() => flashMsg(saveCloudHint(), "ok"), 80);
  }

  async function exportLive() {
    saveDeskNow(file);
    const { encoded } = splitExport(file);
    downloadText("techworks-LIVE.enc.txt", encoded, "text/plain");
    const posted = await publishLive(encoded);
    setFile((cur) => stampLiveExport(cur, todayIso(), liveP ?? undefined));
    flashMsg(posted ? "Live published · names not in that file" : "Live file saved here · names not in that file");
  }

  function exportNames() {
    const { names } = splitExport(file);
    downloadText("techworks-NAMES.private.json", JSON.stringify(names, null, 2));
    flashMsg("Names vault downloaded · keep private");
  }

  function toggleRank(board: "skill" | "perk") {
    setRankBoard(board);
    if (typeof window !== "undefined") window.localStorage.setItem(RANK_KEY, board);
  }

  useEffect(() => {
    const sync = () => setDemoId(storedDemo());
    window.addEventListener("techworks-demo", sync);
    return () => window.removeEventListener("techworks-demo", sync);
  }, []);

  useEffect(() => {
    installLayoutWatch();
    ensureDefaultPin();
    try {
      const q = new URLSearchParams(window.location.search);
      setEmbed(q.get("embed") === "1");
      setPortalMode(q.get("portal") === "1");
      setDemoId(storedDemo());
      setDescribeOn(storedDescribe());
      setRankBoard(window.localStorage.getItem(RANK_KEY) === "perk" ? "perk" : "skill");
    } catch {
      /* */
    }
    try {
      const desk = loadDesk(seed);
      setFile(desk);
      void hydrateVault(desk)
        .then(async (next) => {
          setFile(next);
          const pack = await pullCloud();
          if (!pack) return;
          const cloudN = cloudPackCount(pack);
          const localN = next.students.length;
          const sameStamp = Boolean(pack.saved && pack.saved === (next.meta.savedAt ?? ""));
          const plan = cloudSyncPlan(localN, cloudN, localIsNewer(next, pack.saved), sameStamp);
          if (plan === "keep") return;
          if (plan === "push") {
            void pushCloud(next);
            return;
          }
          const cloudFile = await applyCloudPack(pack);
          if (!cloudFile) return;
          if (localN > 0 && cloudFile.students.length === 0) {
            void pushCloud(next);
            flashMsg("Cloud desk was empty · kept this PC's roster", "warn");
            return;
          }
          setFile(cloudFile);
          if (localN === 0 && cloudFile.students.length > 0) {
            flashMsg(`Loaded ${cloudFile.students.length} workers from the cloud`, "ok");
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error("[TechWorks] loadDesk", err);
      setFile(seed);
      flashMsg("Saved data failed · using seed roster");
    }
    try {
      setUnlocked(isUnlocked());
      lockCrew();
      setCrewOn(false);
      applyTheme(storedTheme());
      applyVibe(storedVibe());
      paintContrast(storedContrast());
      bootLang();
    } catch (err) {
      console.error("[TechWorks] boot", err);
    }
  }, [seed]);

  useEffect(() => {
    const run = () => {
      void import("@/components/score");
      void import("@/components/learning-center");
      void import("@/components/admin-hub");
    };
    const ric = (window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) {
      const id = ric(run, { timeout: 4000 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 2200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onFail = (e: Event) => {
      const detail = e instanceof CustomEvent ? String(e.detail || "") : "";
      flashMsg(detail || "This PC could not save. Download a full backup now.", "loss");
    };
    window.addEventListener(SAVE_FAIL_EVENT, onFail);
    return () => window.removeEventListener(SAVE_FAIL_EVENT, onFail);
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveDesk(file);
  }, [file]);

  useEffect(() => {
    const flush = () => {
      if (deskSavePending()) saveDeskNow(file);
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!deskSavePending()) return;
      saveDeskNow(file);
      e.preventDefault();
      e.returnValue = "";
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [file]);

  useEffect(() => {
    paintCleanup(file.meta.config?.cleanupMins, file.meta.config?.cleanupSound);
  }, [file.meta.config?.cleanupMins, file.meta.config?.cleanupSound]);

  useEffect(() => {
    if (!featureOn(file, "stocks")) return;
    let stop = false;
    const wait = window.setTimeout(() => {
      void loadDjia()
        .then((q) => {
          if (stop || !q) return;
          setQuote(q);
          setFile((cur) => applyDjia(cur, q));
        })
        .catch(() => {});
    }, 1800);
    return () => {
      stop = true;
      window.clearTimeout(wait);
    };
  }, [file.meta.config?.modules?.stocks]);

  useEffect(() => {
    if (embed) setView("overview");
    if (portalMode) setView("portal");
  }, [embed, portalMode]);

  useEffect(() => {
    if (!unlocked) {
      const ok = ["overview", "week", "year", "portal", "prints", "teach", "polls", "deck", "skills"];
      if (crewOn) ok.push("crew");
      if (!ok.includes(view)) setView("overview");
    }
  }, [unlocked, view]);

  const liveP = periodNow(deskBellId(file));
  const mode = modeOf(view);
  const layout = useLayout();
  const surface = surfaceOf(layout, { unlocked, embed, portal: portalMode });
  const workstation = surface === "workstation";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.edit = unlocked ? "on" : "off";
    document.documentElement.dataset.surface = surface;
    document.documentElement.dataset.crew = crewOn ? "on" : "off";
    return () => {
      document.documentElement.dataset.edit = "off";
      document.documentElement.dataset.crew = "off";
    };
  }, [unlocked, surface, crewOn]);

  const section = sectionOf(view);

  function goSection(next: AppSection) {
    if (crewOn) return;
    if (next === "dash") go("overview");
    else if (next === "learn") {
      setLearnStart(unlocked ? "projects" : "words");
      go("skills");
    } else if (next === "crew") {
      if (unlocked) {
        setDeskPad("effort");
        goDesk("score");
        return;
      }
      askPin("crew");
    } else if (next === "roster") {
      if (unlocked) go("roster");
      else askPin("roster");
    } else if (unlocked) {
      setAdminPane("today");
      go("admin");
    } else {
      askPin("admin");
    }
  }

  const v2Tabs: NavTab[] =
    section === "dash"
      ? [
          { id: "wall", label: t("Wall"), on: view === "overview", onClick: () => go("overview") },
          { id: "teach", label: t("Teach"), on: view === "teach", onClick: () => go("teach"), hidden: !featureOn(file, "teach") },
          { id: "deck", label: t("Deck"), on: view === "deck", onClick: () => go("deck") },
          { id: "week", label: t("Week"), on: view === "week", onClick: () => go("week") },
          { id: "year", label: t("YTD"), on: view === "year", onClick: () => go("year") },
          { id: "polls", label: t("Polls"), on: view === "polls", onClick: () => go("polls"), hidden: !featureOn(file, "polls") },
          { id: "data", label: t("Data"), on: view === "data", onClick: () => go("data") },
          { id: "clubwall", label: t("Club"), on: view === "clubwall", onClick: () => go("clubwall"), hidden: !featureOn(file, "club") },
          { id: "hallwall", label: t("Hall"), on: view === "hallwall", onClick: () => go("hallwall"), hidden: !featureOn(file, "studyhall") },
        ]
      : section === "learn"
        ? [
            { id: "projects", label: t("Projects"), on: learnStart === "projects", onClick: () => { setLearnStart("projects"); go("skills"); }, hidden: !unlocked },
            { id: "skills", label: t("Skills"), on: learnStart === "skills", onClick: () => { setLearnStart("skills"); go("skills"); }, hidden: !unlocked },
            { id: "book", label: t("Book"), on: learnStart === "grades" || learnStart === "book", onClick: () => { setLearnStart("grades"); go("skills"); }, hidden: !unlocked },
            { id: "words", label: t("Words"), on: learnStart === "words", onClick: () => { setLearnStart("words"); go("skills"); } },
          ]
        : section === "crew"
          ? []
          : section === "roster"
            ? []
            : [
              ...ADMIN_GROUPS.map((g) => ({
                id: g.id,
                label: t(g.label),
                on: view === "admin" && paneInGroup(adminPane, g.id),
                onClick: () => {
                  if (!paneInGroup(adminPane, g.id)) setAdminPane(defaultPane(g.id));
                  go("admin");
                },
              })),
              { id: "club", label: t("Club"), on: view === "club", onClick: () => go("club"), hidden: !featureOn(file, "club") },
              { id: "hall", label: t("Hall"), on: view === "studyhall", onClick: () => go("studyhall"), hidden: !featureOn(file, "studyhall") },
              { id: "prints", label: t("Prints"), on: view === "prints", onClick: () => go("prints"), hidden: !featureOn(file, "prints") },
              { id: "stocks", label: t("Stocks"), on: view === "wallet", onClick: () => go("wallet"), hidden: !featureOn(file, "stocks") },
              { id: "lucky", label: t("Lucky"), on: view === "lucky", onClick: () => go("lucky"), hidden: !featureOn(file, "lucky") },
              { id: "store", label: t("Store"), on: view === "store", onClick: () => go("store"), hidden: !featureOn(file, "store") },
            ];

  const appStrip = !crewOn ? (
    <AppNav
      section={section}
      onSection={goSection}
      tabs={section === "admin" && view === "admin" ? [] : v2Tabs}
      unlocked={unlocked}
      hideSections
    />
  ) : null;

  return (
    <TipsProvider on={describeOn}>
    <div className={cn(
      "board-root flex h-svh min-h-svh min-w-0 flex-col overflow-x-hidden overflow-y-hidden px-2 py-2 sm:px-3 sm:py-3 bg-bg",
      view === "score" || view === "crew" || view === "skills" || view === "grades" || view === "projects" ? "board-score" : "",
      crewOn ? "p-0" : "",
    )} data-surface={surface} data-crew={crewOn ? "on" : "off"}>
      {embed || portalMode ? (
        <div className="mb-1 flex items-center gap-2">
          <TwWordmark />
          {verChip}
        </div>
      ) : crewOn && view === "crew" ? null : (
        <>
        <header className="desk-chrome tw-gadget tw-hud mb-1 min-w-0">
            <div className="flex min-w-0 flex-col gap-1">
            <div className="nav-cluster flex min-w-0 items-center gap-1">
              <button type="button" onClick={() => go("overview")} title="FERPA wall · aliases only" className="shrink-0">
                <TwWordmark />
              </button>
              <div className="tw-hud-row relative z-20 ml-auto">
                {unlocked ? (
                  <div className="relative hidden md:block">
                    <Search className="pointer-events-none absolute left-2 top-2.5 size-3.5 text-subtle" />
                    <input
                      data-find
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find"
                      className="h-9 w-24 rounded-md bg-elevated pl-7 pr-2 text-sm outline-none"
                    />
                    {qFind && (houseMatch.length || hits.length) ? (
                      <ul className="absolute right-0 top-10 z-40 w-56 overflow-hidden rounded-xl bg-surface ring-1 ring-border">
                        {houseMatch.map((h) => (
                          <li key={h.id}>
                            <button type="button" onClick={() => openHouse(h.id)} className="tw-tap flex min-h-10 w-full items-center px-3 text-left text-sm font-semibold">
                              {h.alias}
                              <span className="ml-auto text-[10px] uppercase tracking-wide text-muted">{h.role}</span>
                            </button>
                          </li>
                        ))}
                        {hits.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setQuery("");
                                setOpenId(s.id);
                              }}
                              className="tw-tap flex min-h-10 w-full items-center px-3 text-left text-sm"
                            >
                              {s.first}
                              <span className="ml-auto font-mono text-[10px] text-muted">P{s.period}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                {demoId !== "off" && featureOn(file, "debug") ? (
                  <span className="rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-bg">
                    Fake data · not saved
                  </span>
                ) : null}
                {unlocked ? <NextJobChip file={file} onGo={runJob} /> : null}
                <NowDock
                  schedule={deskBellId(file)}
                  lunch={lunchOn(file, todayIso())}
                  onClick={() => runJob({ id: "now", label: "Now", hint: "", tone: "ok", go: "overview" })}
                />
                <LockBar
                  unlocked={unlocked || crewOn}
                  onAsk={() => askPin()}
                  onLock={() => {
                    setUnlocked(false);
                    setCrewOn(false);
                    setGearOpen(false);
                    const stay = ["overview", "week", "year", "prints", "teach", "polls", "deck", "skills"];
                    if (!stay.includes(view)) setView("overview");
                  }}
                />
                <button
                  type="button"
                  title="Settings"
                  aria-label="Settings"
                  onClick={() => {
                    if (!unlocked) {
                      askPin();
                      setGearOpen(true);
                      return;
                    }
                    setGearOpen((v) => !v);
                  }}
                  className={cn(
                    "tw-hud-btn tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-fg hover:bg-elevated",
                    gearOpen ? "bg-gold text-bg" : "",
                  )}
                >
                  <Settings className="size-5" />
                </button>
                <button type="button" title={t("How this class works")} aria-label={t("Help")} onClick={() => setHelpOpen(true)} className="tw-hud-btn tw-tap relative z-30 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-fg hover:bg-elevated">
                  <CircleHelp className="size-5" />
                </button>
                <LangChip />
                <CloudChip
                  onOpen={() => {
                    setAdminPane("cloud");
                    go("admin");
                  }}
                />
                {verChip}
                {unlocked && dueN && mode !== "board" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPane("today");
                      go("admin");
                    }}
                    className="tw-tap min-h-10 rounded-full bg-loss px-3 text-xs font-semibold uppercase tracking-wide text-accent-fg"
                  >
                    {dueN} due
                  </button>
                ) : null}
              </div>
            </div>
            {appStrip}
            </div>
        </header>
        </>
      )}
      {flash ? (
        <p
          className={cn(
            "mb-2 rounded-md px-3 py-2 text-sm font-semibold",
            flash.tone === "loss" ? "bg-loss text-accent-fg" : flash.tone === "ok" ? "bg-gold text-bg" : flash.tone === "warn" ? "bg-cleanup text-accent-fg" : "bg-elevated",
          )}
        >
          {flash.msg}
        </p>
      ) : null}
      {workstation ? (
        <DescribeBar
          view={view}
          panel={deskPanel}
          on={describeOn}
          onToggle={setDescribeOn}
          onHelp={() => setHelpOpen(true)}
        />
      ) : null}
      {workstation && unlocked && mode !== "board" && slot.fridayPay && file.meta.config?.lastLiveExport !== todayIso() ? (
        <button
          type="button"
          onClick={() => void exportLive()}
          className="mb-2 min-h-11 rounded-md bg-accent px-3 text-left text-sm font-semibold text-accent-fg"
        >
          Friday · export live (no names) before you leave. Names vault is a separate private file.
        </button>
      ) : unlocked && mode !== "board" && liveP && isSchoolDay(today) && !isSubDay(file, today) && !exportedThisPeriod(file, today, liveP) ? (
        <button
          type="button"
          onClick={() => void exportLive()}
          className="mb-2 min-h-11 rounded-md ring-1 ring-loss px-3 text-left text-sm font-semibold"
        >
          Export P{liveP} live · at least once this period. Names stay in the vault.
        </button>
      ) : null}
      <div className="board-main flex min-h-0 flex-1 flex-col overflow-hidden">
      <CleanupStage file={wallFile} unlocked={unlocked} onChange={commitDesk} off={view !== "overview"}>
      <Suspense fallback={<p className="px-3 py-8 text-center text-sm text-gold">{t("Loading wall…")}</p>}>
      {view === "roster" && unlocked ? (
        <RosterWall
          file={wallFile}
          list={list}
          unlocked={unlocked}
          onOpenId={(id) => setOpenId(id)}
          onRecords={() => {
            setAdminPane("roster");
            go("admin");
          }}
        />
      ) : view === "admin" && unlocked ? (
        <AdminHub
          file={wallFile}
          onChange={commitDesk}
          start={adminPane}
          onPane={setAdminPane}
          onScore={() => goDesk("score")}
          onScoreCrew={(p, key, date) => {
            setJumpPeriod(p);
            setJumpCrew(key ?? null);
            setJumpDate(date ?? null);
            goDesk("score");
          }}
          onGrades={() => {
            setLearnStart("grades");
            go("skills");
          }}
          onProjects={() => {
            setLearnStart("projects");
            go("skills");
          }}
          onSkills={() => {
            setLearnStart("skills");
            go("skills");
          }}
          onStocks={() => go("wallet")}
          onLucky={() => go("lucky")}
          onStore={() => go("store")}
          onPrints={() => go("prints")}
          onWall={() => go("overview")}
          onStudyHall={() => go("studyhall")}
          onClub={() => go("club")}
          onData={() => go("data")}
          onTeach={() => go("teach")}
          onPolls={() => go("polls")}
          onOpenId={(id) => setOpenId(id)}
          unlocked={unlocked}
          onNeedPin={() => askPin()}
          onExport={() => void exportLive()}
          onSave={saveNow}
          onHelp={() => setHelpOpen(true)}
          onExportNames={exportNames}
          onTips={setDescribeOn}
        />
      ) : view === "score" && unlocked ? (
        <ScoreDesk
          file={wallFile}
          onChange={commitDesk}
          unlocked={unlocked}
          onNeedPin={() => askPin()}
          onOpenId={(id) => setOpenId(id)}
          jumpPeriod={jumpPeriod}
          jumpCrew={jumpCrew}
          jumpDate={jumpDate}
          onOpenSettings={() => setGearOpen(true)}
          mode="teacher"
          panel="score"
          startPad={deskPad}
          onRankUp={rankUp}
        />
      ) : view === "crew" && crewOn ? (
        <CrewLead
          file={wallFile}
          onChange={commitDesk}
          onNeedPin={() => askPin()}
          onSignOut={() => {
            setCrewOn(false);
            lockCrew();
            setView("overview");
          }}
        />
      ) : view === "portal" || portalMode ? (
        <WorkerPortal file={wallFile} />
      ) : view === "skills" || view === "projects" || view === "grades" ? (
        <SkillsBoard
          file={wallFile}
          onChange={commitDesk}
          unlocked={unlocked}
          onNeedPin={() => askPin()}
          onOpenId={(id) => {
            if (!unlocked) {
              setPendingId(id);
              askPin();
              return;
            }
            setOpenId(id);
          }}
          start={learnStart}
          jumpPeriod={jumpPeriod}
          jumpCrew={jumpCrew}
          jumpDate={jumpDate}
          onOpenSettings={() => setGearOpen(true)}
          onRankUp={rankUp}
        />
      ) : view === "wallet" ? (
        <WalletBoard file={wallFile} quote={quote} unlocked={unlocked} onNeedPin={() => askPin()} onChange={commitDesk} />
      ) : view === "lucky" ? (
        <LuckyBoard file={wallFile} unlocked={unlocked} onNeedPin={() => askPin()} onChange={commitDesk} onFlash={(m) => flashMsg(m, m.includes("−") || m.includes("needs") ? "loss" : "ok")} />
      ) : view === "store" ? (
        <StoreBoard file={wallFile} unlocked={unlocked} onNeedPin={() => askPin()} onChange={commitDesk} onFlash={(m) => flashMsg(m, m.includes("can't") ? "loss" : "ok")} />
      ) : view === "prints" ? (
        <PrintsBoard file={file} unlocked={unlocked} onNeedPin={() => askPin()} onChange={commitDesk} onFlash={(m) => flashMsg(m, m.includes("can't") ? "loss" : "ok")} />
      ) : view === "hallwall" ? (
        <StudyHallDash
          file={wallFile}
          unlocked={unlocked}
          onPeriod={(p) => {
            if (p === 6) return;
            go("overview");
          }}
          onOpenId={(id) => setOpenId(id)}
          onChange={commitDesk}
        />
      ) : view === "studyhall" ? (
        <StudyHallBoard
          file={wallFile}
          unlocked={unlocked}
          onNeedPin={() => askPin()}
          onChange={commitDesk}
          onOpenId={(id) => setOpenId(id)}
          onWall={() => go("hallwall")}
        />
      ) : view === "clubwall" ? (
        <ClubBoard unlocked={unlocked} onNeedPin={() => askPin()} wall onWall={() => go("club")} desk={file} onDesk={commitDesk} />
      ) : view === "club" ? (
        <ClubBoard unlocked={unlocked} onNeedPin={() => askPin()} onWall={() => go("clubwall")} desk={file} onDesk={commitDesk} />
      ) : view === "teach" ? (
        teachStart === "plans" ? (
          <LessonBoard
            file={wallFile}
            unlocked={unlocked}
            onChange={commitDesk}
            onNeedPin={() => askPin()}
            onNow={() => {
              setTeachStart("now");
              go("teach");
            }}
          />
        ) : (
        <TeachBoard file={wallFile} unlocked={unlocked} onChange={commitDesk} onNeedPin={() => askPin()} onPolls={() => go("polls")} onBerty={() => setOpenId(HOUSE_BERTY)} />
        )
      ) : view === "polls" ? (
        <PollBoard file={file} unlocked={unlocked} onChange={commitDesk} onNeedPin={() => askPin()} />
      ) : view === "deck" ? (
        <DeckBoard unlocked={unlocked} onNeedPin={() => askPin()} />
      ) : view === "week" ? (
        <WeekBoard file={wallFile} list={list} bells={bells} cycle={file.meta.config?.currentCycle ?? 1} onPeriod={(p) => { setJumpPeriod(p); goDesk("score"); }} />
      ) : view === "year" ? (
        <YearBoard file={wallFile} onChange={commitDesk} />
      ) : view === "data" ? (
        <DataBoard file={wallFile} onOpenProfile={(id) => setOpenId(id)} />
      ) : (
        <ErrorGate label="wall">
        <Dashboard
          list={list}
          bells={bells}
          file={wallFile}
          unlocked={unlocked}
          arrange={unlocked}
          rankBoard={rankBoard}
          onRankBoard={toggleRank}
          onPeriod={(p) => {
            if (p === 6) {
              go(unlocked ? "studyhall" : "hallwall");
              return;
            }
            setJumpPeriod(p);
            goDesk("score");
          }}
          onOpenId={(id) => setOpenId(id)}
          onChange={commitDesk}
          onClub={() => go("club")}
          onHelp={() => setHelpOpen(true)}
          onPrints={featureOn(file, "prints") ? () => go("prints") : undefined}
          onOpenMod={(id) => {
            if (id === "teach") go("teach");
            else if (id === "polls") go("polls");
            else if (id === "prints") go("prints");
            else if (id === "lucky") go("lucky");
            else if (id === "store") go("store");
            else if (id === "stocks") go("wallet");
            else if (id === "club") go("club");
            else if (id === "studyhall") go(unlocked ? "studyhall" : "hallwall");
            else if (id === "grades" || id === "nytech" || id === "projects") {
              setLearnStart(id === "projects" ? "projects" : "book");
              go("skills");
            } else if (id === "crews") {
              setAdminPane("crews");
              go("admin");
            } else if (id === "achievements") {
              /* profile via search */
            } else if (id === "picker" || id === "timer") {
              /* tools live on dash */
            } else if (id === "help" || id === "tips") setHelpOpen(true);
          }}
        />
        </ErrorGate>
      )}
      {helpOpen && !crewOn ? <HelpPanel onClose={() => setHelpOpen(false)} wallOnly={!unlocked} /> : null}
      {openId ? (
        <Dossier
          file={wallFile}
          id={openId}
          unlocked={unlocked}
          onChange={commitDesk}
          onClose={() => setOpenId(null)}
          onNeedPin={() => askPin()}
        />
      ) : null}
      </Suspense>
      </CleanupStage>
      </div>
      {embed || portalMode || (crewOn && view === "crew") ? null : (
        <PhoneDock
          view={view === "skills" && learnStart === "projects" ? "projects" : view}
          pad={deskPad}
          navV2
          onBoard={() => go("overview")}
          onCrew={() => goSection("crew")}
          onTeach={() => {
            setTeachStart("now");
            go("teach");
          }}
          onOther={() => goSection("admin")}
          onRoster={() => goSection("roster")}
          onSkills={() => {
            setLearnStart(unlocked ? "projects" : "words");
            go("skills");
          }}
          onProjects={() => {
            setLearnStart("projects");
            go("skills");
          }}
          onDesk={() => {
            setDeskPad("effort");
            goDesk("score");
          }}
        />
      )}
      </div>
      {unlocked && gearOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-bg/70" onClick={() => setGearOpen(false)}>
          <aside
            className="flex h-full w-full max-w-md flex-col overflow-hidden bg-surface ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-2 px-3 py-2">
              <p className="text-sm font-bold uppercase tracking-wide">Edit this screen</p>
              <button type="button" onClick={() => setGearOpen(false)} className="tw-tap min-h-10 rounded-md bg-elevated px-3 text-sm font-semibold">
                Done
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              <SettingsBody
                file={file}
                tab={gearTabFor(view)}
                onChange={commitDesk}
                onExportNames={exportNames}
                onExport={() => void exportLive()}
                onSave={saveNow}
                onTips={setDescribeOn}
              />
            </div>
          </aside>
        </div>
      ) : null}
      {pinOpen ? (
        <PinPad
          want={pendingView === "crew" ? "crew" : "teacher"}
          onClose={() => {
            setPinOpen(false);
            setPendingView(null);
            setPendingId(null);
          }}
          onUnlock={(kind) => {
            if (kind === "crew") {
              setCrewOn(true);
              setUnlocked(false);
              setHelpOpen(false);
              setView("crew");
              setPendingView(null);
              return;
            }
            setUnlocked(true);
            setCrewOn(false);
            const next = pendingView;
            if (next === "score" || next === "crew") setView("score");
            else if (next === "grades" || next === "projects" || next === "skills") {
              setLearnStart(next === "grades" ? "grades" : next === "projects" ? "projects" : "skills");
              setView("skills");
            } else if (next && next !== view) setView(next);
            if (pendingId) {
              setOpenId(pendingId);
              setPendingId(null);
            }
            setPendingView(null);
          }}
        />
      ) : null}
    </TipsProvider>
  );
}
