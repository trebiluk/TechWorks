"use client";

import { lazy, startTransition, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TwWordmark } from "@/components/tw-mark";
import snapshot from "@/data/economy.json";
import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent, score } from "@/lib/economy";
import { loadDesk, saveDesk, saveDeskNow, applyDjia, abOn, stampLiveExport, isSubDay, exportedThisPeriod, lunchOn } from "@/lib/store";
import { hydrateVault } from "@/lib/vault";
import { LockBar, PinPad } from "@/components/pin-pad";
import { DescribeBar } from "@/components/describe-bar";
import { commitDescribe, storedDescribe } from "@/lib/describe";
import { TipsProvider } from "@/lib/tips";
import { Dashboard } from "@/components/dashboard";
import { featureOn } from "@/lib/features";
import { paintDemo, storedDemo, type DemoId } from "@/lib/demo";
import { isUnlocked, crewUnlocked, ensureDefaultPin } from "@/lib/pin";
import { cycleDayLabel, daySlot, isSchoolDay, todayIso } from "@/lib/calendar";
import { loadDjia, type DjiaQuote } from "@/lib/djia";
import { downloadText, periodPulses, publicHandle, publishLive, splitExport } from "@/lib/live";
import { paintCleanup, periodNow } from "@/lib/bells";
import { CleanupStage } from "@/components/cleanup-wall";
import { NowDock } from "@/components/now-dock";
import { installLayoutWatch, surfaceOf, useLayout } from "@/lib/layout";
import { PhoneDock } from "@/components/phone-dock";
import { LayoutToggle } from "@/components/layout-toggle";
import { applyTheme, applyVibe, paintContrast, storedContrast, storedTheme, storedVibe } from "@/lib/theme";
import { bootLang } from "@/lib/i18n";
import { VersionChip } from "@/components/version-chip";
import { ErrorGate } from "@/components/error-gate";
import { AdminHub } from "@/components/admin-hub";
import type { LearnStart } from "@/components/learning-center";
import type { AdminPane } from "@/components/settings";
import { ModeBar, modeOf, type Mode, type ModeSub } from "@/components/mode-nav";
import { cn } from "@/lib/utils";

const ScoreDesk = lazy(() => import("@/components/score").then((m) => ({ default: m.ScoreDesk })));
const SkillsBoard = lazy(() => import("@/components/learning-center").then((m) => ({ default: m.LearningCenter })));
const WalletBoard = lazy(() => import("@/components/wallet").then((m) => ({ default: m.WalletBoard })));
const Dossier = lazy(() => import("@/components/dossier").then((m) => ({ default: m.Dossier })));
const HelpPanel = lazy(() => import("@/components/help").then((m) => ({ default: m.HelpPanel })));
const StoreBoard = lazy(() => import("@/components/store-board").then((m) => ({ default: m.StoreBoard })));
const WorkerPortal = lazy(() => import("@/components/portal").then((m) => ({ default: m.WorkerPortal })));
const StudyHallBoard = lazy(() => import("@/components/study-hall-board").then((m) => ({ default: m.StudyHallBoard })));
const StudyHallDash = lazy(() => import("@/components/study-hall-dash").then((m) => ({ default: m.StudyHallDash })));
const ClubBoard = lazy(() => import("@/components/club-board").then((m) => ({ default: m.ClubBoard })));
const WeekBoard = lazy(() => import("@/components/week-board").then((m) => ({ default: m.WeekBoard })));
const YearBoard = lazy(() => import("@/components/year-board").then((m) => ({ default: m.YearBoard })));
const DataBoard = lazy(() => import("@/components/data-board").then((m) => ({ default: m.DataBoard })));

const RANK_KEY = "techworks-rank-board";

type View = "crew" | "score" | "overview" | "week" | "year" | "data" | "wallet" | "skills" | "store" | "portal" | "grades" | "studyhall" | "hallwall" | "club" | "clubwall" | "projects" | "admin";
type DeskPanel = "score" | "schedule" | "config";

export function Board() {
  const seed = snapshot as unknown as EconomyFile;
  const [embed, setEmbed] = useState(false);
  const [portalMode, setPortalMode] = useState(false);
  const [file, setFile] = useState<EconomyFile>(seed);
  const [demoId, setDemoId] = useState<DemoId>("off");
  const graphFile = useMemo(() => {
    if (!featureOn(file, "debug") || demoId === "off") return file;
    return paintDemo(file, demoId);
  }, [file, demoId]);
  const wallFile = useDeferredValue(graphFile);
  const list = useMemo(() => score(wallFile), [wallFile]);
  const bells = useMemo(() => bellFor(wallFile), [wallFile]);
  const [view, setView] = useState<View>("overview");
  const [learnStart, setLearnStart] = useState<LearnStart>("grades");
  const [deskPanel, setDeskPanel] = useState<DeskPanel>("score");
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
  const hits = query.trim()
    ? file.students
        .filter((s) => isLiveStudent(s, file.meta.quarterName) && (view === "studyhall" || view === "data" || s.period !== 6))
        .filter((s) => {
          const q = query.trim().toLowerCase();
          return s.first.toLowerCase().includes(q) || publicHandle(s.id).toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
        })
        .slice(0, 8)
    : [];

  function go(next: View) {
    if (embed) {
      setView("overview");
      return;
    }
    const teacher = ["admin", "score", "grades", "projects", "skills", "store", "studyhall"].includes(next);
    if (teacher && !unlocked) {
      setPendingView(next);
      setPinOpen(true);
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
      if (next === "store" && !featureOn(file, "store")) {
        flashMsg("Store is off · Admin");
        return;
      }
      if (next === "portal" && !featureOn(file, "portal")) {
        flashMsg("Portal is off · Admin");
        return;
      }
      setView(next);
    });
  }

  function goDesk(_panel?: DeskPanel) {
    if (!unlocked) {
      setPendingView("score");
      setPinOpen(true);
      return;
    }
    startTransition(() => setView("score"));
  }

  function flashMsg(msg: string, tone?: "ok" | "warn" | "loss") {
    setFlash({ msg, tone });
    window.setTimeout(() => setFlash(null), 2400);
  }

  function rankUp(alias: string, band: string) {
    flashMsg(`${alias} → ${band}`, "ok");
  }

  function saveNow() {
    saveDeskNow(file);
    flashMsg("Saved on this device");
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
        .then((next) => setFile(next))
        .catch(() => {});
    } catch (err) {
      console.error("[TechWorks] loadDesk", err);
      setFile(seed);
      flashMsg("Saved data failed · using seed roster");
    }
    try {
      setUnlocked(isUnlocked());
      setCrewOn(crewUnlocked());
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
      const id = ric(run, { timeout: 1200 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveDesk(file);
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
      const ok = ["overview", "week", "year", "portal"];
      if (crewOn) ok.push("crew");
      if (!ok.includes(view)) setView("overview");
    }
  }, [unlocked, view]);

  const liveP = periodNow(file.meta.config?.schedule);
  const mode = modeOf(view);
  const layout = useLayout();
  const phone = layout === "mobile";
  const surface = surfaceOf(layout, { unlocked, embed, portal: portalMode });
  const projector = surface === "projector";
  const workstation = surface === "workstation";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.edit = unlocked ? "on" : "off";
    document.documentElement.dataset.surface = surface;
    return () => {
      document.documentElement.dataset.edit = "off";
    };
  }, [unlocked, surface]);

  function goMode(next: Mode) {
    if (next === "board") go("overview");
    else if (next === "desk") {
      setDeskPad("effort");
      goDesk("score");
    } else if (next === "learn") {
      setLearnStart("grades");
      go("skills");
    } else if (unlocked) go("admin");
    else {
      setPendingView("admin");
      setPinOpen(true);
    }
  }

  const wallModes: Mode[] = ["board", "desk", "learn", "admin"];

  const subs: ModeSub[] =
    mode === "board"
      ? [
          { id: "overview", label: "Overview", on: view === "overview", onClick: () => go("overview") },
          { id: "week", label: "Week", on: view === "week", onClick: () => go("week") },
          { id: "year", label: "YTD", on: view === "year", onClick: () => go("year") },
        ]
      : mode === "desk"
        ? [
            { id: "effort", label: "Check-in", on: view === "score", onClick: () => { setDeskPad("effort"); goDesk("score"); } },
            { id: "crew", label: "Crew", on: view === "crew", onClick: () => go("crew") },
          ]
        : mode === "learn"
          ? [
              { id: "book", label: "Book", on: learnStart === "grades" || learnStart === "book", onClick: () => { setLearnStart("grades"); go("skills"); } },
              { id: "projects", label: "Projects", on: learnStart === "projects", onClick: () => { setLearnStart("projects"); go("skills"); } },
              { id: "skills", label: "Skills", on: learnStart === "skills", onClick: () => { setLearnStart("skills"); setView("skills"); } },
              { id: "guide", label: "Guide", on: learnStart === "guide" || learnStart === "bench", onClick: () => { setLearnStart("guide"); go("skills"); } },
            ]
          : [
              { id: "today", label: "Today", on: view === "admin" && adminPane === "today", onClick: () => { setAdminPane("today"); go("admin"); } },
              { id: "data", label: "Data", on: view === "data", onClick: () => go("data") },
              { id: "wallet", label: "Stocks", on: view === "wallet", onClick: () => go("wallet"), hidden: !featureOn(file, "stocks") },
              { id: "studyhall", label: "Hall Mgr", on: view === "studyhall" || view === "hallwall", onClick: () => go("studyhall"), hidden: !featureOn(file, "studyhall") },
              { id: "club", label: "Club", on: view === "club" || view === "clubwall", onClick: () => go("club"), hidden: !featureOn(file, "club") },
              { id: "vault", label: "Device", on: view === "admin" && adminPane === "vault", onClick: () => { setAdminPane("vault"); go("admin"); } },
              { id: "more", label: "More", on: view === "admin" && adminPane !== "today" && adminPane !== "vault", onClick: () => { setAdminPane("modules"); go("admin"); } },
            ];

  return (
    <TipsProvider on={describeOn}>
    <div className={cn(
      "board-root flex h-svh min-h-svh min-w-0 flex-col overflow-x-hidden overflow-y-hidden px-2 py-2 sm:px-3 sm:py-3 bg-bg",
      phone && (view === "score" || view === "crew" || view === "skills" || view === "grades" || view === "projects") ? "board-score" : "",
    )} data-surface={surface}>
      {embed || portalMode ? (
        <div className="mb-1 flex items-center gap-2">
          <TwWordmark />
          <VersionChip peek />
        </div>
      ) : (
        <>
        <header className="desk-chrome tw-gadget mb-1 min-w-0 px-2 py-1">
          {phone ? (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={() => go("overview")} title="FERPA wall · aliases only" className="min-w-0 shrink">
                  <TwWordmark />
                </button>
                <LayoutToggle compact />
                <LockBar
                  unlocked={unlocked || crewOn}
                  onAsk={() => setPinOpen(true)}
                  onLock={() => {
                    setUnlocked(false);
                    setCrewOn(false);
                    setView("overview");
                  }}
                />
                <VersionChip peek />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                {featureOn(file, "studyhall") ? (
                  <button
                    type="button"
                    onClick={() => go("studyhall")}
                    className="tw-tap min-h-11 rounded-full bg-elevated px-4 text-base font-semibold"
                  >
                    Hall
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (unlocked) {
                      setAdminPane("today");
                      go("admin");
                    } else {
                      setPendingView("admin");
                      setPinOpen(true);
                    }
                  }}
                  className="tw-tap min-h-11 rounded-full bg-elevated px-4 text-base font-semibold"
                >
                  Admin
                </button>
                {unlocked && dueN ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPane("today");
                      go("admin");
                    }}
                    className="tw-tap ml-auto min-h-10 rounded-full bg-loss px-3 text-xs font-semibold uppercase tracking-wide text-accent-fg"
                  >
                    {dueN} due
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="nav-cluster flex min-w-0 items-center gap-1 sm:flex-nowrap sm:gap-2">
              <button type="button" onClick={() => go("overview")} title="FERPA wall · aliases only" className="shrink-0">
                <TwWordmark />
              </button>
              {workstation ? (
                <ModeBar
                  mode={mode}
                  onMode={goMode}
                  subs={mode === "admin" ? [] : unlocked ? subs : []}
                  allow={wallModes}
                  onWarm={(m) => {
                    if (m === "desk") void import("@/components/score");
                    if (m === "learn") void import("@/components/learning-center");
                  }}
                  className="desk-modes"
                />
              ) : !phone ? (
                <ModeBar
                  mode={mode}
                  onMode={goMode}
                  subs={[]}
                  allow={wallModes}
                  className="desk-modes"
                />
              ) : null}
              <div className="relative z-20 ml-auto flex shrink-0 items-center gap-1">
                {unlocked && workstation ? (
                  <div className="relative hidden md:block">
                    <Search className="pointer-events-none absolute left-2 top-2.5 size-3.5 text-subtle" />
                    <input
                      data-find
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find"
                      className="h-9 w-24 rounded-md bg-elevated pl-7 pr-2 text-sm outline-none"
                    />
                  </div>
                ) : null}
                {workstation ? (
                  <NowDock
                    schedule={file.meta.config?.schedule}
                    lunch={lunchOn(file, todayIso())}
                    onClick={() => go("overview")}
                  />
                ) : null}
                <LayoutToggle compact />
                <LockBar
                  unlocked={unlocked || crewOn}
                  onAsk={() => setPinOpen(true)}
                  onLock={() => {
                    setUnlocked(false);
                    setCrewOn(false);
                    setView("overview");
                  }}
                />
                <VersionChip peek />
                {unlocked && dueN ? (
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
          )}
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
      {workstation && unlocked && slot.fridayPay && file.meta.config?.lastLiveExport !== todayIso() ? (
        <button
          type="button"
          onClick={() => void exportLive()}
          className="mb-2 min-h-11 rounded-md bg-accent px-3 text-left text-sm font-semibold text-accent-fg"
        >
          Friday · export live (no names) before you leave. Names vault is a separate private file.
        </button>
      ) : unlocked && liveP && isSchoolDay(today) && !isSubDay(file, today) && !exportedThisPeriod(file, today, liveP) ? (
        <button
          type="button"
          onClick={() => void exportLive()}
          className="mb-2 min-h-11 rounded-md ring-1 ring-loss px-3 text-left text-sm font-semibold"
        >
          Export P{liveP} live · at least once this period. Names stay in the vault.
        </button>
      ) : null}
      <div className="board-main flex min-h-0 flex-1 flex-col overflow-auto">
      <CleanupStage file={file} unlocked={unlocked} onChange={setFile} off={view === "club" || view === "clubwall"}>
      <Suspense fallback={<p className="px-3 py-8 text-center text-sm text-gold">Loading wall…</p>}>
      {view === "admin" && unlocked ? (
        <AdminHub
          file={file}
          onChange={setFile}
          start={adminPane}
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
          onStore={() => go("store")}
          onStudyHall={() => go("studyhall")}
          onClub={() => go("club")}
          onData={() => go("data")}
          onExport={() => void exportLive()}
          onSave={saveNow}
          onHelp={() => setHelpOpen(true)}
          onExportNames={exportNames}
          onTips={setDescribeOn}
        />
      ) : view === "score" && unlocked ? (
        <ScoreDesk
          file={file}
          onChange={setFile}
          unlocked={unlocked}
          onNeedPin={() => setPinOpen(true)}
          onOpenId={(id) => setOpenId(id)}
          jumpPeriod={jumpPeriod}
          jumpCrew={jumpCrew}
          jumpDate={jumpDate}
          onOpenSettings={() => {
            setAdminPane("today");
            go("admin");
          }}
          mode="teacher"
          panel="score"
          startPad={deskPad}
          onRankUp={rankUp}
        />
      ) : view === "crew" ? (
        <ScoreDesk
          file={file}
          onChange={setFile}
          unlocked={unlocked}
          onNeedPin={() => setPinOpen(true)}
          onOpenId={(id) => {
            if (!unlocked) {
              setPendingId(id);
              setPinOpen(true);
              return;
            }
            setOpenId(id);
          }}
          jumpPeriod={jumpPeriod}
          jumpCrew={jumpCrew}
          jumpDate={jumpDate}
          onOpenSettings={() => {
            setAdminPane("room");
            go("admin");
          }}
          mode="crew"
          panel="score"
          onRankUp={rankUp}
        />
      ) : view === "portal" || portalMode ? (
        <WorkerPortal file={file} />
      ) : view === "skills" || view === "projects" || view === "grades" ? (
        <SkillsBoard
          file={file}
          onChange={setFile}
          unlocked={unlocked}
          onNeedPin={() => setPinOpen(true)}
          onOpenId={(id) => {
            if (!unlocked) {
              setPendingId(id);
              setPinOpen(true);
              return;
            }
            setOpenId(id);
          }}
          start={learnStart}
          jumpPeriod={jumpPeriod}
          jumpCrew={jumpCrew}
          jumpDate={jumpDate}
          onOpenSettings={() => {
            setAdminPane("room");
            go("admin");
          }}
          onRankUp={rankUp}
        />
      ) : view === "wallet" ? (
        <WalletBoard file={file} quote={quote} unlocked={unlocked} onNeedPin={() => setPinOpen(true)} onChange={setFile} />
      ) : view === "store" ? (
        <StoreBoard file={file} unlocked={unlocked} onNeedPin={() => setPinOpen(true)} onChange={setFile} onFlash={(m) => flashMsg(m, m.includes("can't") ? "loss" : "ok")} />
      ) : view === "hallwall" ? (
        <StudyHallDash
          file={file}
          unlocked={unlocked}
          onPeriod={(p) => {
            if (p === 6) return;
            go("overview");
          }}
          onOpenId={(id) => setOpenId(id)}
          onChange={setFile}
        />
      ) : view === "studyhall" ? (
        <StudyHallBoard
          file={file}
          unlocked={unlocked}
          onNeedPin={() => setPinOpen(true)}
          onChange={setFile}
          onOpenId={(id) => setOpenId(id)}
          onWall={() => go("hallwall")}
        />
      ) : view === "clubwall" ? (
        <ClubBoard unlocked={unlocked} onNeedPin={() => setPinOpen(true)} wall onWall={() => go("club")} />
      ) : view === "club" ? (
        <ClubBoard unlocked={unlocked} onNeedPin={() => setPinOpen(true)} onWall={() => go("clubwall")} />
      ) : view === "week" ? (
        <WeekBoard file={wallFile} list={list} bells={bells} cycle={file.meta.config?.currentCycle ?? 1} onPeriod={(p) => { setJumpPeriod(p); goDesk("score"); }} />
      ) : view === "year" ? (
        <YearBoard file={wallFile} onChange={featureOn(file, "debug") ? () => {} : setFile} />
      ) : view === "data" ? (
        <DataBoard file={wallFile} onOpenProfile={(id) => setOpenId(id)} />
      ) : (
        <ErrorGate label="wall">
        <Dashboard
          list={list}
          bells={bells}
          file={file}
          unlocked={unlocked}
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
          onChange={setFile}
          onClub={() => go("club")}
        />
        </ErrorGate>
      )}
      {helpOpen ? <HelpPanel onClose={() => setHelpOpen(false)} /> : null}
      {openId ? (
        <Dossier
          file={file}
          id={openId}
          unlocked={unlocked}
          onChange={setFile}
          onClose={() => setOpenId(null)}
          onNeedPin={() => setPinOpen(true)}
        />
      ) : null}
      </Suspense>
      </CleanupStage>
      </div>
      {embed || portalMode ? null : (
        <PhoneDock
          view={view === "skills" && learnStart === "projects" ? "projects" : view}
          pad={deskPad}
          onBoard={() => go("overview")}
          onCrew={() => go("crew")}
          onSkills={() => {
            setLearnStart("grades");
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
      {pinOpen ? (
        <PinPad
          onClose={() => {
            setPinOpen(false);
            setPendingView(null);
            setPendingId(null);
          }}
          onUnlock={(kind) => {
            if (kind === "crew") {
              setCrewOn(true);
              setUnlocked(false);
              setView("crew");
              setPendingView(null);
              return;
            }
            setUnlocked(true);
            setCrewOn(false);
            const next = pendingView;
            if (next === "score") setView("score");
            else if (next === "grades" || next === "projects" || next === "skills") {
              setLearnStart(next === "grades" ? "grades" : next === "projects" ? "projects" : "skills");
              setView("skills");
            } else if (next) setView(next);
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
