/* Koderized KZ 1.16.1 — Speak beside the line. Not red until GO. One board. No IEP stored. */

function preferTouchUi() {
  const coarse = window.matchMedia("(pointer: coarse)").matches
    || window.matchMedia("(any-pointer: coarse)").matches
    || window.matchMedia("(hover: none)").matches;
  const touch = (navigator.maxTouchPoints || 0) > 0;
  const phone = window.matchMedia("(max-width: 640px)").matches;
  document.body.classList.toggle("touch-ui", !!(coarse || touch || phone));
}
preferTouchUi();
try {
  window.matchMedia("(pointer: coarse)").addEventListener("change", preferTouchUi);
  window.matchMedia("(any-pointer: coarse)").addEventListener("change", preferTouchUi);
  window.matchMedia("(hover: none)").addEventListener("change", preferTouchUi);
  window.matchMedia("(max-width: 640px)").addEventListener("change", preferTouchUi);
} catch (_) {}

const DOORS = [
  {
    id: "zero",
    n: 1,
    title: "Door 1 · One command",
    idea: "A command is one thing the bot does.",
    ask: "The list is empty. What does the bot do?",
    choices: [
      { p: "sit", t: "1 · It sits. Nothing happens." },
      { p: "roll", t: "2 · It rolls by itself." },
      { p: "vanish", t: "3 · It vanishes." }
    ],
    probeAsk: "What is a command?",
    probes: [
      { v: "do", t: "1 · One thing the bot does" },
      { v: "guess", t: "2 · A lucky guess" },
      { v: "wall", t: "3 · The saw wall" }
    ],
    example: [],
    starter: [],
    palette: ["move"],
    world: { cols: 10, rows: 6, wallX: 99, goalX: 2, startX: 1, startY: 3 },
    tests: function (r, program) {
      const moves = (program || []).filter(function (b) { return b.t === "move"; }).length;
      return [
        { ok: r.path.length >= 2, label: "The bot moved" },
        { ok: r.x === 2, label: "One step onto the crate" },
        { ok: moves === 1 && program.length === 1, label: "Exactly one move" }
      ];
    }
  },
  {
    id: "line",
    n: 2,
    title: "Door 2 · A line of steps",
    idea: "Commands run in order, top to bottom.",
    ask: "Watch three moves. Where does the bot stop?",
    choices: [
      { p: "short", t: "1 · Short of the crate" },
      { p: "crate", t: "2 · On the crate" },
      { p: "past", t: "3 · Past the crate" }
    ],
    probeAsk: "Why was it short?",
    probes: [
      { v: "few", t: "1 · Not enough moves" },
      { v: "order", t: "2 · The order was backwards" },
      { v: "wall", t: "3 · A hidden wall" }
    ],
    example: [{ t: "move" }, { t: "move" }, { t: "move" }],
    starter: [{ t: "move" }, { t: "move" }, { t: "move" }],
    palette: ["move"],
    world: { cols: 10, rows: 6, wallX: 99, goalX: 5, startX: 1, startY: 3 },
    tests: function (r, program) {
      const moves = (program || []).filter(function (b) { return b.t === "move"; }).length;
      return [
        { ok: r.x === 5, label: "Stops on the crate" },
        { ok: moves >= 4, label: "Added at least one more move" },
        { ok: (program || []).every(function (b) { return b.t === "move"; }), label: "Only moves — a line" }
      ];
    }
  },
  {
    id: "loop",
    n: 3,
    title: "Door 3 · Repeat",
    idea: "Repeat does the inside many times. Poke the gold number.",
    ask: "A long line of moves, or one repeat. Which is the loop?",
    choices: [
      { p: "repeat", t: "1 · Repeat · move · end" },
      { p: "line", t: "2 · Move, move, move, move…" },
      { p: "stop", t: "3 · If wall: stop" }
    ],
    probeAsk: "What does the gold number mean?",
    probes: [
      { v: "count", t: "1 · How many times to do the inside" },
      { v: "score", t: "2 · Your grade" },
      { v: "speed", t: "3 · How fast it rolls" }
    ],
    example: [{ t: "move" }, { t: "move" }, { t: "move" }, { t: "move" }],
    starter: [{ t: "repeat", n: 2 }, { t: "move" }, { t: "end" }],
    palette: ["move", "repeat", "end"],
    world: { cols: 10, rows: 6, wallX: 99, goalX: 5, startX: 1, startY: 3 },
    tests: function (r, program) {
      const rep = (program || []).find(function (b) { return b.t === "repeat"; });
      return [
        { ok: r.x === 5, label: "Stops on the crate" },
        { ok: !!rep, label: "Used a repeat" },
        { ok: !!rep && Number(rep.n) === 4, label: "Poked repeat to 4" }
      ];
    }
  },
  {
    id: "wall",
    n: 4,
    title: "Door 4 · Don't wreck the bot",
    idea: "The bot cannot see the wall unless you ask.",
    ask: "What happens at the wall?",
    choices: [
      { p: "stop", t: "1 · It slams the brakes" },
      { p: "through", t: "2 · It ghosts through" },
      { p: "forever", t: "3 · It never stops" }
    ],
    probeAsk: "Where is STOP?",
    probes: [
      { v: "inside", t: "1 · In the loop" },
      { v: "outside", t: "2 · After the loop" }
    ],
    example: [{ t: "repeat", n: 12 }, { t: "move" }, { t: "if-wall-stop" }, { t: "end" }],
    starter: [{ t: "repeat", n: 12 }, { t: "move" }, { t: "if-wall-stop" }, { t: "end" }],
    palette: ["move", "repeat", "end", "stop"],
    world: { cols: 10, rows: 6, wallX: 8, goalX: null, startX: 1, startY: 3 },
    tests: function (r, program) {
      const r2 = run(program, 40, this.world);
      const t1 = r.hitWall && r.stopped;
      return [
        { ok: t1, label: "Stops at wall" },
        { ok: (r2.stopped || r2.hitWall) && t1, label: "Doesn’t run forever" },
        { ok: (program || []).some(function (b) { return b.t === "if-wall-stop"; }), label: "Asks if wall" }
      ];
    }
  },
  {
    id: "score",
    n: 5,
    title: "Door 5 · Stop and score",
    idea: "A sensor can stop and count.",
    ask: "It already stops. What is still missing?",
    choices: [
      { p: "score", t: "1 · Score when it sees the wall" },
      { p: "faster", t: "2 · More speed" },
      { p: "name", t: "3 · The bot’s legal name" }
    ],
    probeAsk: "When should score run?",
    probes: [
      { v: "wall", t: "1 · If wall: score" },
      { v: "always", t: "2 · Every move" }
    ],
    example: [{ t: "repeat", n: 12 }, { t: "move" }, { t: "if-wall-stop" }, { t: "end" }],
    starter: [{ t: "repeat", n: 12 }, { t: "move" }, { t: "if-wall-stop" }, { t: "end" }],
    palette: ["move", "repeat", "end", "stop", "score"],
    world: { cols: 10, rows: 6, wallX: 8, goalX: null, startX: 1, startY: 3 },
    tests: function (r, program) {
      return [
        { ok: r.hitWall && r.stopped, label: "Stops at wall" },
        { ok: r.score >= 1, label: "Score goes up" },
        { ok: (program || []).some(function (b) { return b.t === "if-wall-score"; }), label: "If wall: score is in the list" }
      ];
    }
  }
];

/* CUT D — quest packs */
async function loadQuestPacks() {
  try {
    const res = await fetch("quests.json?v=1.16.1", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const packs = (data && data.quests) || [];
    const byId = Object.fromEntries(DOORS.map(d => [d.id, d]));
    packs.forEach(q => {
      if (byId[q.id]) {
        const d = byId[q.id];
        ["title","idea","ask","choices","probeAsk","probes","example","starter","palette","world"].forEach(k => {
          if (q[k] != null) d[k] = q[k];
        });
      } else {
        // remix door — light generic tests
        DOORS.push({
          id: q.id,
          n: q.n,
          title: q.title,
          idea: q.idea,
          ask: q.ask,
          choices: q.choices,
          probeAsk: q.probeAsk,
          probes: q.probes,
          example: q.example || [],
          starter: q.starter || [],
          palette: q.palette || ["move"],
          world: q.world,
          tests: function (r, program) {
            const hints = q.testHints || ["Moved", "Toward the crate", "Short clear program"];
            return [
              { ok: (r.path || []).length >= 2, label: hints[0] },
              { ok: q.world && r.x >= Math.min(q.world.goalX, q.world.wallX - 1), label: hints[1] },
              { ok: (program || []).length > 0 && (program || []).length < 20, label: hints[2] }
            ];
          }
        });
      }
    });
    DOORS.sort((a, b) => a.n - b.n);
    if (DOORS[0] && DOORS[0].example) { try { EXAMPLE = DOORS[0].example.slice(); } catch (e) {} }
  } catch (e) { /* offline: baked DOORS stay */ }
}


let QUEST_TITLE = DOORS[0].title;
let EXAMPLE = DOORS[1].example.slice();

const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");
function setTxt(id, v) { const el = $(id); if (el) el.textContent = v; }
const REPEAT_STEPS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20];
function nextRepeat(n) {
  const i = REPEAT_STEPS.indexOf(Number(n));
  return REPEAT_STEPS[(i < 0 ? 0 : i + 1) % REPEAT_STEPS.length];
}
function doorOf(id) {
  return DOORS.find(d => d.id === id) || DOORS[0];
}
function copy(x) { return JSON.parse(JSON.stringify(x)); }
function lang() { return localStorage.getItem("kz-lang") === "es" ? "es" : "en"; }
function L() { return (window.I18N && (I18N[lang()] || I18N.en)) || { doors: {} }; }
function setLang(code) {
  localStorage.setItem("kz-lang", code === "es" ? "es" : "en");
  applyChrome();
  if (session.role === "student") renderStudent();
  if (session.role === "teacher") renderTeacher();
}
function applyChrome() {
  const pack = L();
  document.documentElement.lang = pack.lang || lang();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (pack[k]) el.textContent = pack[k];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const k = el.getAttribute("data-i18n-ph");
    if (pack[k]) el.placeholder = pack[k];
  });
  document.body.classList.toggle("big-type", localStorage.getItem("kz-big") === "1");
  if ($("btn-lang-en")) $("btn-lang-en").setAttribute("aria-pressed", lang() === "en" ? "true" : "false");
  if ($("btn-lang-es")) $("btn-lang-es").setAttribute("aria-pressed", lang() === "es" ? "true" : "false");
  if ($("btn-big")) $("btn-big").setAttribute("aria-pressed", localStorage.getItem("kz-big") === "1" ? "true" : "false");
  syncSpeakBtn();
}
function doorL(d) {
  const pack = (L().doors && L().doors[d.id]) || {};
  return {
    title: pack.title || d.title,
    idea: pack.idea || d.idea,
    ask: pack.ask || d.ask,
    choices: pack.choices || d.choices,
    probeAsk: pack.probeAsk || d.probeAsk,
    probes: pack.probes || d.probes,
    tests: pack.tests || null,
    help: pack.help || {}
  };
}
function startWalk(s) {
  const d = doorOf(s.door);
  s.mode = "walk";
  s.help = "aide";
  s.predicted = true;
  s.probe = (d.probes[0] && d.probes[0].v) || "do";
  s.phase = "modify";
  s.program = copy(d.starter);
  s.lastChange = "Walk with me";
}
function walkHint(s) {
  const d = doorOf(s.door);
  const loc = doorL(d);
  const p = s.program || [];
  const ready = !!(s.ran && s.tests && s.tests[0] && s.tests[1]);
  const pack = L();
  const tapMove = pack.move || "move";
  const tapGo = pack.go || "GO";
  const tapNext = pack.nextDoor || "Next door";
  const tapRep = pack.repeat || "repeat";
  const tapStop = pack.stop || "stop";
  const tapScore = pack.score || "score";
  const tapDone = pack.done || "Done";
  if (d.id === "zero") {
    if (!p.some(b => b.t === "move")) return { say: loc.help.modify && loc.help.modify.say, tap: tapMove, id: "pal-move" };
    if (!ready) return { say: loc.help.modify && loc.help.modify.say, tap: tapGo, id: "btn-run-mine" };
    return { say: pack.winPeriod, tap: tapNext, id: "btn-next-door" };
  }
  if (d.id === "line") {
    const moves = p.filter(b => b.t === "move").length;
    if (moves < 4) return { say: loc.help.modify && loc.help.modify.say, tap: tapMove, id: "pal-move" };
    if (!ready) return { say: loc.help.modify && loc.help.modify.say, tap: tapGo, id: "btn-run-mine" };
    return { say: pack.winPeriod, tap: tapNext, id: "btn-next-door" };
  }
  if (d.id === "loop") {
    const rep = p.find(b => b.t === "repeat");
    if (!rep) return { say: loc.help.modify && loc.help.modify.say, tap: tapRep, id: "pal-repeat" };
    if (Number(rep.n) !== 4) return { say: loc.help.modify && loc.help.modify.say, tap: "4", id: null, poke: true };
    if (!ready) return { say: loc.help.modify && loc.help.modify.say, tap: tapGo, id: "btn-run-mine" };
    return { say: pack.winPeriod, tap: tapNext, id: "btn-next-door" };
  }
  if (d.id === "wall") {
    if (!p.some(b => b.t === "if-wall-stop")) return { say: loc.help.modify && loc.help.modify.say, tap: tapStop, id: "pal-stop" };
    if (!ready) return { say: loc.help.modify && loc.help.modify.say, tap: tapGo, id: "btn-run-mine" };
    return { say: pack.winPeriod, tap: tapNext, id: "btn-next-door" };
  }
  if (!p.some(b => b.t === "if-wall-score")) return { say: loc.help.modify && loc.help.modify.say, tap: tapScore, id: "pal-score" };
  if (!ready) return { say: loc.help.modify && loc.help.modify.say, tap: tapGo, id: "btn-run-mine" };
  return { say: pack.winPeriod, tap: tapDone, id: null };
}
function glow(id, poke) {
  document.querySelectorAll(".glow").forEach(el => el.classList.remove("glow"));
  if (poke) {
    const g = document.querySelector("#block-list .poke");
    if (g) g.classList.add("glow");
    return;
  }
  if (id && $(id)) $(id).classList.add("glow");
}
function clueIcon(label, i) {
  const lab = String(label || "").toLowerCase();
  if (/crate|caja/.test(lab)) return "crate";
  if (/exactly one|one move|un mover/.test(lab)) return "one";
  if (/moved|movi[oó]/.test(lab)) return "move";
  if (/repeat|repetir/.test(lab)) return "repeat";
  if (/score|suma/.test(lab)) return "score";
  if (/stop|para/.test(lab)) return "stop";
  if (/wall|pared/.test(lab)) return "wall";
  return ["move", "crate", "one"][i] || "bot";
}
function pictoSvg(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "picto-svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "pics.svg#p-" + name);
  use.setAttribute("href", "pics.svg#p-" + name);
  svg.appendChild(use);
  return svg;
}
const PIC = {
  move: "move", repeat: "repeat", end: "end", "if-wall-stop": "stop", "if-wall-score": "score",
  sit: "sit", roll: "roll", vanish: "vanish", short: "short", crate: "crate", past: "past",
  through: "vanish", forever: "repeat", stop: "stop", score: "score", faster: "roll", name: "bot",
  do: "move", guess: "watch", wall: "wall", inside: "loop", outside: "door", few: "short",
  order: "line", count: "repeat", speed: "roll", one: "one", line: "line"
};
function renderGuide(s, d, loc, hint) {
  const icon = $("guide-icon");
  let name = "bot";
  if (hint.poke) name = "repeat";
  else if (hint.id === "pal-move") name = "move";
  else if (hint.id === "pal-repeat") name = "repeat";
  else if (hint.id === "pal-stop") name = "stop";
  else if (hint.id === "pal-score") name = "score";
  else if (hint.id === "btn-run-mine") name = "go";
  else if (hint.id === "btn-next-door") name = "door";
  else if (hint.id === "btn-run-example") name = "watch";
  else if (s.phase === "predict") name = "watch";
  else if (s.tests && s.tests[0] && s.tests[1]) name = "good";
  if (icon) {
    const u = icon.querySelector("use");
    if (u) { u.setAttribute("href", "pics.svg#p-" + name); u.setAttributeNS("http://www.w3.org/1999/xlink", "href", "pics.svg#p-" + name); }
  }
  setTxt("guide-line", hint.tap || loc.idea);
  setTxt("guide-sub", hint.say || loc.idea);
}
function shopHeat(st) {
  const list = Object.values((st && st.students) || {});
  if (!list.length) return 0;
  const pts = list.reduce((n, s) => n + (s.tests || []).filter(Boolean).length, 0);
  return Math.round((pts / (list.length * 3)) * 100);
}
const mem = {};
function key(c) { return "kz18_" + (c || "").toUpperCase(); }
function get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
function set(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
function load(code) {
  const raw = get(key(code));
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  return { code: (code || "QUEST4").toUpperCase(), frozen: false, spotlight: null, door: "zero", climb: true, students: {}, logs: [] };
}
function save(st) {
  set(key(st.code), JSON.stringify(st));
  try { bc.postMessage({ code: st.code }); } catch (e) {}
}
let bc;
try { bc = new BroadcastChannel("kz18"); } catch (e) { bc = { postMessage() {}, addEventListener() {} }; }
const session = { role: null, code: "QUEST4", alias: "", id: null };
function uid() { return "s" + Math.random().toString(36).slice(2, 8); }
function log(st, alias, kind, text) {
  st.logs.unshift({ t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), alias, kind, text });
  st.logs = st.logs.slice(0, 80);
}
function openDoor(s, id) {
  const d = doorOf(id);
  s.door = d.id;
  s.program = copy(d.starter);
  s.lastGreen = copy(d.starter);
  s.predict = "";
  s.predicted = false;
  s.probe = null;
  s.tests = [false, false, false];
  s.phase = "predict";
  s.tradeoff = "";
  s.status = "gray";
  s.ran = false;
  s.lastChange = "Door " + d.n;
}
function ensure(st, alias, id) {
  if (!st.students[id]) {
    st.students[id] = {
      id, alias, door: st.door || "zero",
      program: [], lastGreen: [],
      predict: "", predicted: false, probe: null, tests: [false, false, false],
      layer: "Core", status: "gray", restores: 0, tradeoff: "", lastChange: "Joined", phase: "predict",
      mode: "full", help: "off"
    };
    openDoor(st.students[id], st.door || "zero");
    st.students[id].alias = alias;
  }
  return st.students[id];
}
function syncExample(s) {
  const d = doorOf(s && s.door);
  EXAMPLE = copy(d.example);
  QUEST_TITLE = d.title;
  return d;
}
function run(program, maxSteps, world) {
  world = world || { cols: 10, rows: 6, wallX: 99, goalX: 5, startX: 1, startY: 3 };
  const cols = world.cols, rows = world.rows, wallX = world.wallX;
  let x = world.startX, y = world.startY, dir = 1, score = 0, stopped = false, steps = 0;
  const path = [{ x, y }];
  const cap = maxSteps || 80;
  function wallAhead() { return wallX < cols && x + (dir === 1 ? 1 : dir === 3 ? -1 : 0) >= wallX; }
  function move() {
    if (stopped) return;
    const nx = x + (dir === 1 ? 1 : dir === 3 ? -1 : 0);
    const ny = y + (dir === 2 ? 1 : dir === 0 ? -1 : 0);
    if ((wallX < cols && nx >= wallX) || nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    x = nx; y = ny; path.push({ x, y });
  }
  function exec(list, depth) {
    if (depth > 8) return;
    for (let i = 0; i < list.length; i++) {
      if (steps++ > cap) return;
      const b = list[i];
      if (b.t === "move") move();
      else if (b.t === "stop") stopped = true;
      else if (b.t === "if-wall-stop") { if (wallAhead()) stopped = true; }
      else if (b.t === "if-wall-score") { if (wallAhead()) score += 1; }
      else if (b.t === "repeat") {
        const inner = [];
        let j = i + 1, nest = 1;
        for (; j < list.length; j++) {
          if (list[j].t === "repeat") nest++;
          if (list[j].t === "end") nest--;
          if (nest === 0) break;
          inner.push(list[j]);
        }
        const n = Math.max(1, Math.min(20, b.n || 1));
        for (let r = 0; r < n; r++) exec(inner, depth + 1);
        i = j;
      }
    }
  }
  exec(program || [], 0);
  return {
    x, y, score, stopped, path,
    hitWall: wallX < cols && x === wallX - 1,
    wallX, cols, rows,
    goalX: world.goalX, goalY: world.startY
  };
}
function evaluate(program, s) {
  const st = load(session.code);
  const who = s || (session.id && st.students[session.id]) || { door: st.door || "zero" };
  const d = doorOf(who.door);
  const r = run(program, 80, d.world);
  return { result: r, tests: d.tests(r, program || []) };
}
function draw(canvas, sim) {
  if (window.draw) { window.draw(canvas, sim); return; }
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = "#0b1c33"; ctx.fillRect(0, 0, W, H);
}

function goLanding() {
  if (window.KZSpeak) KZSpeak.stop();
  hide("screen-student"); hide("screen-teacher"); show("screen-landing"); applyChrome();
}
function goStudent() { hide("screen-landing"); hide("screen-teacher"); show("screen-student"); renderStudent(); }
function goTeacher() { hide("screen-landing"); hide("screen-student"); show("screen-teacher"); renderTeacher(); }
$("btn-student").onclick = () => {
  session.role = "student";
  session.code = ($("join-code").value || "QUEST4").toUpperCase();
  session.alias = ($("join-alias").value || "Player").trim();
  session.id = session.id || uid();
  const st = load(session.code);
  ensure(st, session.alias, session.id).alias = session.alias;
  save(st);
  $("top-meta").textContent = session.alias + " · " + session.code;
  goStudent();
};
$("btn-teacher").onclick = () => {
  session.role = "teacher";
  session.code = ($("join-code").value || "QUEST4").toUpperCase();
  const st = load(session.code);
  if (!st.door) st.door = "zero";
  log(st, "Room", "START", "Period open. Door 1.");
  save(st);
  $("top-meta").textContent = "Teacher · " + session.code;
  goTeacher();
};
$("btn-home").onclick = goLanding;
function label(b) {
  const pack = L();
  if (b.t === "move") return pack.move || "move forward";
  if (b.t === "repeat") return (pack.repeat || "repeat") + " " + (b.n || 1);
  if (b.t === "end") return pack.end || "end repeat";
  if (b.t === "if-wall-stop") return pack.stop || "if wall: stop";
  if (b.t === "if-wall-score") return pack.score || "if wall: score +1";
  return b.t;
}
function bump(s, fromGo) {
  const ev = evaluate(s.program, s);
  s.tests = ev.tests.map(t => t.ok);
  const pass = ev.tests.filter(t => t.ok).length;
  if (typeof s.ran !== "boolean") s.ran = s.status === "green" || s.status === "red" || s.status === "amber";
  if (fromGo) s.ran = true;
  // Grade only after GO. An edit is not a red kid, and Undo must not keep the answer.
  if (!s.ran) {
    if (s.status !== "blue") s.status = "gray";
    return;
  }
  s.status = pass >= 2 ? "green" : pass === 0 ? "red" : "amber";
  if (pass >= 2) s.lastGreen = copy(s.program);
}
function plain(el) {
  return ((el && el.textContent) || "").replace(/\s+/g, " ").trim();
}
function guideSpeech() {
  const bits = [];
  function add(el) {
    const t = plain(el);
    if (t && bits.indexOf(t) === -1) bits.push(t);
  }
  add($("door-idea"));
  const guide = $("guide");
  if (guide && !guide.classList.contains("hidden")) {
    add($("guide-line"));
    add($("guide-sub"));
  }
  return bits.join(". ");
}
function syncSpeakBtn() {
  const b = $("btn-speak");
  if (!b) return;
  const on = !!(window.KZSpeak && KZSpeak.speaking());
  const pack = L();
  b.classList.toggle("on", on);
  b.setAttribute("aria-pressed", on ? "true" : "false");
  const lab = $("speak-label");
  if (lab) lab.textContent = on ? (pack.stopSpeak || "Stop") : (pack.speak || "Speak");
  const said = on ? guideSpeech() : "";
  ["door-idea", "guide-line", "guide-sub"].forEach(id => {
    const el = $(id);
    if (!el) return;
    const t = plain(el);
    el.classList.toggle("speaking", !!(on && t && said.indexOf(t) !== -1));
  });
}
function chips(phase) {
  ["predict", "run", "investigate", "modify", "make"].forEach(p => {
    $("ph-" + p).className = "chip" + (p === phase ? " on" : "");
  });
}
function renderChoices(d, s) {
  const loc = doorL(d);
  const box = $("choices");
  box.innerHTML = "";
  loc.choices.forEach(c => {
    const b = document.createElement("button");
    b.className = "choice" + (s.predict === c.p ? " picked" : "");
    b.type = "button";
    b.setAttribute("data-p", c.p);
    b.appendChild(pictoSvg(PIC[c.p] || "bot"));
    const span = document.createElement("span");
    span.textContent = c.t;
    b.appendChild(span);
    b.disabled = s.predicted;
    box.appendChild(b);
  });
  const pb = $("probe-choices") || $("probe-wrap").querySelector(".choices");
  if (pb) {
    pb.innerHTML = "";
    loc.probes.forEach(c => {
      const b = document.createElement("button");
      b.className = "choice probe" + (s.probe === c.v ? " picked" : "");
      b.type = "button";
      b.setAttribute("data-v", c.v);
      b.appendChild(pictoSvg(PIC[c.v] || "bot"));
      const span = document.createElement("span");
      span.textContent = c.t;
      b.appendChild(span);
      pb.appendChild(b);
    });
  }
  setTxt("probe-ask", loc.probeAsk);
}
function renderBlocks(el, program, editable) {
  el.innerHTML = "";
  program.forEach((b, i) => {
    const d = document.createElement("div");
    d.className = "block" + (b.t === "repeat" || b.t === "end" ? " control" : b.t.indexOf("if") === 0 ? " sense" : "");
    d.appendChild(pictoSvg(PIC[b.t] || "move"));
    if (b.t === "repeat") {
      const lab = document.createElement("span");
      lab.textContent = L().repeat || "repeat";
      d.appendChild(lab);
      const poke = document.createElement("button");
      poke.type = "button";
      poke.className = "poke";
      poke.textContent = String(b.n || 1);
      poke.title = "Poke the number";
      if (editable) {
        poke.onclick = () => {
          const st = load(session.code);
          const s = st.students[session.id];
          if (!s || st.frozen) return;
          s.program[i].n = nextRepeat(s.program[i].n);
          s.lastChange = "Poked repeat to " + s.program[i].n;
          log(st, s.alias, "MODIFY", s.lastChange);
          bump(s); save(st); renderStudent();
        };
      } else poke.disabled = true;
      d.appendChild(poke);
    } else {
      const lab = document.createElement("span");
      lab.textContent = label(b);
      d.appendChild(lab);
    }
    if (editable) {
      const rm = document.createElement("button");
      rm.className = "btn ghost";
      rm.textContent = "×";
      rm.onclick = () => {
        const st = load(session.code);
        const s = st.students[session.id];
        s.program.splice(i, 1);
        s.lastChange = "Removed " + label(b);
        log(st, s.alias, "MODIFY", s.lastChange);
        bump(s); save(st); renderStudent();
      };
      d.appendChild(rm);
    }
    el.appendChild(d);
  });
  if (!program.length) {
    const empty = document.createElement("div");
    empty.className = "block empty";
    empty.textContent = L().emptyList || "Empty list. Add a command.";
    el.appendChild(empty);
  }
}
function renderStudent() {
  const st = load(session.code);
  const s = ensure(st, session.alias, session.id);
  const d = syncExample(s);
  const loc = doorL(d);
  applyChrome();
  $("freeze-banner").classList.toggle("hidden", !st.frozen);
  const spotting = st.spotlight && st.spotlight !== session.id;
  $("spot-banner").classList.toggle("hidden", !spotting);
  if (spotting && st.students[st.spotlight]) $("spot-banner").textContent = "Watch " + st.students[st.spotlight].alias;
  chips(s.phase);
  setTxt("quest-title", loc.title);
  setTxt("ask", loc.ask);
  setTxt("door-n", "Door " + d.n + " / 5");
  setTxt("door-idea", loc.idea);
  renderChoices(d, s);
  const walk = s.mode === "walk";
  if ($("guide")) {
    const hideGuide = !walk && s.phase === "predict" && s.help !== "aide";
    $("guide").classList.toggle("hidden", hideGuide);
  }
  if ($("phase-chips")) $("phase-chips").classList.toggle("hidden", walk);
  if ($("btn-aide")) $("btn-aide").setAttribute("aria-pressed", s.help === "aide" ? "true" : "false");
  if ($("btn-walk")) $("btn-walk").setAttribute("aria-pressed", walk ? "true" : "false");
  const showAide = s.help === "aide" || walk;
  if ($("aide-card")) $("aide-card").classList.toggle("hidden", !showAide);
  const phaseHelp = loc.help[s.phase] || loc.help.modify || { say: "", tap: "" };
  let hint;
  if (walk || s.phase === "modify" || s.phase === "make") hint = walkHint(s);
  else hint = { say: phaseHelp.say, tap: phaseHelp.tap, id: s.phase === "run" ? "btn-run-example" : null };
  setTxt("aide-say", hint.say || "");
  setTxt("aide-tap", hint.tap || "");
  $("btn-predict").disabled = s.predicted || st.frozen || !s.predict;
  $("btn-run-example").disabled = !s.predicted || st.frozen;
  $("choices").classList.toggle("hidden", walk || s.predicted || s.phase !== "predict");
  if ($("ask")) $("ask").classList.toggle("hidden", walk);
  $("probe-wrap").classList.toggle("hidden", walk || s.phase !== "investigate");
  if ($("btn-predict")) $("btn-predict").parentElement.classList.toggle("hidden", walk);
  $("modify-wrap").classList.toggle("hidden", !(s.phase === "modify" || s.phase === "make"));
  const ready = !!(s.ran && s.tests && s.tests[0] && s.tests[1]);
  $("trade-wrap").classList.toggle("hidden", !ready || !(s.phase === "modify" || s.phase === "make"));
  const last = d.n === 5;
  if ($("cost-fields")) $("cost-fields").classList.toggle("hidden", d.n < 4);
  if ($("btn-next-door")) {
    $("btn-next-door").classList.toggle("hidden", !ready || last);
    $("btn-next-door").disabled = st.frozen || spotting;
  }
  if ($("tradeoff")) $("tradeoff").value = s.tradeoff || "";
  const pal = d.palette;
  [["pal-move", "move"], ["pal-repeat", "repeat"], ["pal-end", "end"], ["pal-stop", "stop"], ["pal-score", "score"]].forEach(([id, name]) => {
    if ($(id)) $(id).classList.toggle("hidden", pal.indexOf(name) < 0);
  });
  const who = spotting && st.students[st.spotlight] ? st.students[st.spotlight] : s;
  const prog = (!walk && s.phase === "predict") ? EXAMPLE : who.program;
  renderBlocks($("block-list"), prog, !spotting && !st.frozen && (s.phase === "modify" || s.phase === "make"));
  $("palette").classList.toggle("hidden", spotting || st.frozen || !(s.phase === "modify" || s.phase === "make"));
  const ev = evaluate(prog, who);
  draw($("world"), ev.result);
  $("tests").innerHTML = "";
  $("tests").className = "clue-chips";
  ev.tests.forEach((t, i) => {
    const lab = (loc.tests && loc.tests[i]) || t.label;
    const revealed = !!who.ran;
    const chip = document.createElement("div");
    chip.className = "clue-chip " + (revealed ? (t.ok ? "pass" : "fail") : "pending");
    chip.setAttribute("aria-label", revealed ? ((t.ok ? "Yes. " : "No. ") + lab) : lab);
    chip.appendChild(pictoSvg(clueIcon(lab, i)));
    const span = document.createElement("span");
    span.textContent = lab;
    chip.appendChild(span);
    $("tests").appendChild(chip);
  });
  glow(hint.id, hint.poke);
  renderGuide(s, d, loc, hint);
  if (window.KZSpeak && KZSpeak.speaking() && KZSpeak.current() !== guideSpeech()) KZSpeak.stop();
  syncSpeakBtn();
}
$("choices").onclick = e => {
  const b = e.target.closest(".choice");
  if (!b || !b.getAttribute("data-p")) return;
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s || s.predicted) return;
  s.predict = b.getAttribute("data-p");
  save(st); renderStudent();
};
$("probe-wrap").onclick = e => {
  const b = e.target.closest(".probe");
  if (!b) return;
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s) return;
  s.probe = b.getAttribute("data-v");
  save(st); renderStudent();
};
$("btn-predict").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s.predict) return;
  s.predicted = true; s.phase = "run";
  log(st, s.alias, "PREDICT", s.predict);
  save(st); renderStudent();
};
$("btn-run-example").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  s.phase = "investigate";
  log(st, s.alias, "RUN", "Watched example");
  save(st); renderStudent();
};
$("btn-probe").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s.probe) return;
  const d = doorOf(s.door);
  s.phase = "modify";
  s.program = copy(d.starter);
  log(st, s.alias, "PROBE", s.probe);
  save(st); renderStudent();
};
function addBlock(t, n) {
  const st = load(session.code);
  if (st.frozen || st.spotlight) return;
  const s = st.students[session.id];
  const b = { t }; if (n) b.n = n;
  s.program.push(b);
  s.lastChange = "Added " + label(b);
  log(st, s.alias, "MODIFY", s.lastChange);
  bump(s);
  if (s.ran && s.tests[0] && s.tests[1]) s.phase = "make";
  save(st); renderStudent();
}
$("pal-move").onclick = () => addBlock("move");
$("pal-repeat").onclick = () => addBlock("repeat", 8);
$("pal-end").onclick = () => addBlock("end");
$("pal-stop").onclick = () => addBlock("if-wall-stop");
$("pal-score").onclick = () => addBlock("if-wall-score");
$("btn-run-mine").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  bump(s, true);
  if (s.tests[0] && s.tests[1]) s.phase = "make";
  log(st, s.alias, "RUN", "Tests " + s.tests.filter(Boolean).length + "/3");
  save(st); renderStudent();
};
$("btn-restore").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  const d = doorOf(s.door);
  s.program = copy(s.lastGreen && s.lastGreen.length ? s.lastGreen : d.starter);
  s.restores += 1;
  s.lastChange = "Undo";
  log(st, s.alias, "RESTORE", "Last green");
  bump(s); save(st); renderStudent();
};
if ($("btn-tradeoff")) $("btn-tradeoff").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  s.tradeoff = $("tradeoff").value.trim();
  if (!s.tradeoff) return;
  s.phase = "make";
  log(st, s.alias, "TRADEOFF", s.tradeoff);
  save(st); renderStudent();
};
if ($("btn-next-door")) $("btn-next-door").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  const i = DOORS.findIndex(d => d.id === s.door);
  if (i < 0 || i >= DOORS.length - 1) return;
  if (!(s.tests && s.tests[0] && s.tests[1])) return;
  openDoor(s, DOORS[i + 1].id);
  log(st, s.alias, "DOOR", DOORS[i + 1].title);
  save(st); renderStudent();
};
function sendClass(st, id) {
  st.door = id;
  Object.values(st.students).forEach(s => openDoor(s, id));
  log(st, "Teacher", "DOOR", doorOf(id).title);
}
function renderTeacher() {
  const st = load(session.code);
  const d = doorOf(st.door || "zero");
  setTxt("t-code", st.code);
  setTxt("t-quest", d.title);
  if ($("btn-freeze")) $("btn-freeze").textContent = st.frozen ? "Unfreeze" : "Freeze";
  const picks = $("door-picks");
  if (picks && !picks.dataset.bound) {
    picks.dataset.bound = "1";
    picks.innerHTML = "";
    DOORS.forEach(door => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn navy door-btn";
      b.textContent = "Door " + door.n;
      b.title = door.title;
      b.onclick = () => {
        const cur = load(session.code);
        sendClass(cur, door.id);
        save(cur); renderTeacher();
      };
      picks.appendChild(b);
    });
  }
  if (picks) {
    Array.from(picks.children).forEach((b, i) => {
      b.classList.toggle("go", DOORS[i] && DOORS[i].id === (st.door || "zero"));
    });
  }
  const list = Object.values(st.students);
  setTxt("k-present", list.length);
  setTxt("k-predict", list.filter(s => s.predicted).length + "/" + list.length);
  const stuck = list.filter(s => s.status === "red");
  setTxt("k-stuck", stuck.length);
  setTxt("k-coach", list.filter(s => s.status === "green").length);
  setTxt("k-catch", list.filter(s => s.layer === "Catch-up").length);
  setTxt("k-trade", list.filter(s => s.door === "score" && s.tests && s.tests[0] && s.tests[1]).length);
  setTxt("k-heat", shopHeat(st));
  $("stuck-body").innerHTML = "";
  (stuck.length ? stuck : [{ alias: "—", lastChange: "Nobody red", tests: [true], door: st.door }]).forEach(s => {
    const tr = document.createElement("tr");
    const fail = s.tests && s.tests[0] ? "Other" : "Tests not green";
    tr.innerHTML = "<td>" + s.alias + "</td><td>" + fail + "</td><td>" + (s.lastChange || "") + "</td>";
    $("stuck-body").appendChild(tr);
  });
  $("roster-body").innerHTML = "";
  list.sort((a, b) => a.alias.localeCompare(b.alias)).forEach(s => {
    const tr = document.createElement("tr");
    const pass = (s.tests || []).filter(Boolean).length;
    const dn = doorOf(s.door).n;
    tr.innerHTML = "<td>" + s.alias + "</td><td><span class='status st-" + s.status + "'>" + s.status + "</span></td><td>D" + dn + "</td><td>" + pass + "/3</td><td>" + (s.lastChange || "") + "</td><td></td>";
    const td = tr.lastChild;
    [["Spotlight", "ghost", () => { st.spotlight = s.id; log(st, "Teacher", "SPOT", s.alias); save(st); renderTeacher(); }],
     ["Undo", "gold", () => { const dd = doorOf(s.door); s.program = copy(s.lastGreen && s.lastGreen.length ? s.lastGreen : dd.starter); s.lastChange = "Teacher undo"; bump(s); log(st, s.alias, "RESTORE", "Teacher"); save(st); renderTeacher(); }],
     ["Walk with me", "gold", () => { openDoor(s, "zero"); startWalk(s); s.layer = "Catch-up"; s.status = "blue"; log(st, s.alias, "WALK", "Door 1"); save(st); renderTeacher(); }]].forEach(([txt, cls, fn]) => {
      const b = document.createElement("button");
      b.className = "btn " + cls;
      b.textContent = txt;
      b.onclick = fn;
      td.appendChild(b);
    });
    $("roster-body").appendChild(tr);
  });
  $("change-log").innerHTML = st.logs.slice(0, 20).map(l => "<div><b>" + l.t + "</b> · " + l.kind + " · " + l.alias + " — " + l.text + "</div>").join("");
}
$("btn-freeze").onclick = () => {
  const st = load(session.code);
  st.frozen = !st.frozen;
  log(st, "Teacher", "FREEZE", st.frozen ? "Frozen" : "Open");
  save(st); renderTeacher();
};
$("btn-clear-spot").onclick = () => { const st = load(session.code); st.spotlight = null; save(st); renderTeacher(); };
$("btn-export").onclick = () => {
  const st = load(session.code);
  const rows = [["Alias", "Door", "Guess", "Tests", "Last"]];
  Object.values(st.students).forEach(s => rows.push([s.alias, doorOf(s.door).title, s.predicted ? "Y" : "N", (s.tests || []).filter(Boolean).length + "/3", s.lastChange || ""]));
  const csv = rows.map(r => r.map(x => "\"" + String(x).replace(/"/g, "\"\"") + "\"").join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = st.code + "_period.csv";
  a.click();
};
document.addEventListener("keydown", e => {
  if (!session.role) {
    if (e.key === "Enter") { e.preventDefault(); $("btn-student").click(); }
    return;
  }
  if (session.role !== "student") return;
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s || st.frozen) return;
  if (s.phase === "predict" && !s.predicted) {
    const ch = document.querySelectorAll("#choices .choice");
    if (e.key === "1" && ch[0]) ch[0].click();
    if (e.key === "2" && ch[1]) ch[1].click();
    if (e.key === "3" && ch[2]) ch[2].click();
    if (e.key === "Enter") { e.preventDefault(); $("btn-predict").click(); }
  } else if (s.phase === "run" && e.code === "Space") { e.preventDefault(); $("btn-run-example").click(); }
  else if (s.phase === "investigate") {
    const ch = document.querySelectorAll(".probe");
    if (e.key === "1" && ch[0]) ch[0].click();
    if (e.key === "2" && ch[1]) ch[1].click();
    if (e.key === "Enter") { e.preventDefault(); $("btn-probe").click(); }
  } else if ((s.phase === "modify" || s.phase === "make") && e.code === "Space" && document.activeElement.id !== "tradeoff") {
    e.preventDefault(); $("btn-run-mine").click();
  }
});
bc.addEventListener("message", ev => {
  if (!ev.data || ev.data.code !== session.code) return;
  if (session.role === "teacher") renderTeacher();
  if (session.role === "student") renderStudent();
});
window.addEventListener("storage", () => {
  if (session.role === "teacher") renderTeacher();
  if (session.role === "student") renderStudent();
});
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
if ($("btn-lang-en")) $("btn-lang-en").onclick = () => setLang("en");
if ($("btn-lang-es")) $("btn-lang-es").onclick = () => setLang("es");
if ($("btn-big")) $("btn-big").onclick = () => {
  localStorage.setItem("kz-big", localStorage.getItem("kz-big") === "1" ? "0" : "1");
  applyChrome();
};
if ($("btn-speak")) $("btn-speak").onclick = () => {
  if (!window.KZSpeak || !KZSpeak.supported()) return;
  if (KZSpeak.speaking()) { KZSpeak.stop(); syncSpeakBtn(); return; }
  KZSpeak.speak(guideSpeech(), lang(), syncSpeakBtn);
  syncSpeakBtn();
};
if ($("btn-aide")) $("btn-aide").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s) return;
  s.help = s.help === "aide" ? "off" : "aide";
  save(st); renderStudent();
};
if ($("btn-walk")) $("btn-walk").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  if (!s) return;
  if (s.mode === "walk") { s.mode = "full"; s.help = "off"; s.lastChange = "Full path"; }
  else startWalk(s);
  log(st, s.alias, "WALK", s.mode);
  save(st); renderStudent();
};
applyChrome();
loadQuestPacks().then(function () { goLanding(); }).catch(function () { goLanding(); });
