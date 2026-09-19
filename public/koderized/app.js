/* Koderized KZ 1.8.0 — five doors from zero: command, line, repeat, wall, score. */
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
  s.lastChange = "Door " + d.n;
}
function ensure(st, alias, id) {
  if (!st.students[id]) {
    st.students[id] = {
      id, alias, door: st.door || "zero",
      program: [], lastGreen: [],
      predict: "", predicted: false, probe: null, tests: [false, false, false],
      layer: "Core", status: "gray", restores: 0, tradeoff: "", lastChange: "Joined", phase: "predict"
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

function goLanding() { hide("screen-student"); hide("screen-teacher"); show("screen-landing"); }
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
  if (b.t === "move") return "move forward";
  if (b.t === "repeat") return "repeat " + (b.n || 1);
  if (b.t === "end") return "end repeat";
  if (b.t === "if-wall-stop") return "if wall: stop";
  if (b.t === "if-wall-score") return "if wall: score +1";
  return b.t;
}
function bump(s) {
  const ev = evaluate(s.program, s);
  s.tests = ev.tests.map(t => t.ok);
  const pass = ev.tests.filter(t => t.ok).length;
  s.status = pass >= 2 ? "green" : (!s.predicted ? "gray" : pass === 0 ? "red" : "amber");
  if (pass >= 2) s.lastGreen = copy(s.program);
}
function chips(phase) {
  ["predict", "run", "investigate", "modify", "make"].forEach(p => {
    $("ph-" + p).className = "chip" + (p === phase ? " on" : "");
  });
}
function renderChoices(d, s) {
  const box = $("choices");
  box.innerHTML = "";
  d.choices.forEach(c => {
    const b = document.createElement("button");
    b.className = "choice" + (s.predict === c.p ? " picked" : "");
    b.type = "button";
    b.setAttribute("data-p", c.p);
    b.textContent = c.t;
    b.disabled = s.predicted;
    box.appendChild(b);
  });
  const pb = $("probe-choices") || $("probe-wrap").querySelector(".choices");
  if (pb) {
    pb.innerHTML = "";
    d.probes.forEach(c => {
      const b = document.createElement("button");
      b.className = "choice probe" + (s.probe === c.v ? " picked" : "");
      b.type = "button";
      b.setAttribute("data-v", c.v);
      b.textContent = c.t;
      pb.appendChild(b);
    });
  }
  setTxt("probe-ask", d.probeAsk);
}
function renderBlocks(el, program, editable) {
  el.innerHTML = "";
  program.forEach((b, i) => {
    const d = document.createElement("div");
    d.className = "block" + (b.t === "repeat" || b.t === "end" ? " control" : b.t.indexOf("if") === 0 ? " sense" : "");
    if (b.t === "repeat") {
      const lab = document.createElement("span");
      lab.textContent = "repeat";
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
    empty.textContent = "Empty list. Add a command.";
    el.appendChild(empty);
  }
}
function renderStudent() {
  const st = load(session.code);
  const s = ensure(st, session.alias, session.id);
  const d = syncExample(s);
  $("freeze-banner").classList.toggle("hidden", !st.frozen);
  const spotting = st.spotlight && st.spotlight !== session.id;
  $("spot-banner").classList.toggle("hidden", !spotting);
  if (spotting && st.students[st.spotlight]) $("spot-banner").textContent = "Watch " + st.students[st.spotlight].alias;
  chips(s.phase);
  setTxt("quest-title", d.title);
  setTxt("ask", d.ask);
  setTxt("door-n", "Door " + d.n + " / 5");
  setTxt("door-idea", d.idea);
  renderChoices(d, s);
  $("btn-predict").disabled = s.predicted || st.frozen || !s.predict;
  $("btn-run-example").disabled = !s.predicted || st.frozen;
  $("choices").classList.toggle("hidden", s.predicted || s.phase !== "predict");
  $("probe-wrap").classList.toggle("hidden", s.phase !== "investigate");
  $("modify-wrap").classList.toggle("hidden", !(s.phase === "modify" || s.phase === "make"));
  const ready = s.tests && s.tests[0] && s.tests[1];
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
  const prog = s.phase === "predict" ? EXAMPLE : who.program;
  renderBlocks($("block-list"), prog, !spotting && !st.frozen && (s.phase === "modify" || s.phase === "make"));
  $("palette").classList.toggle("hidden", spotting || st.frozen || !(s.phase === "modify" || s.phase === "make"));
  const ev = evaluate(prog, who);
  draw($("world"), ev.result);
  $("tests").innerHTML = "";
  ev.tests.forEach(t => {
    const div = document.createElement("div");
    div.className = "test " + (s.phase === "predict" ? "" : t.ok ? "pass" : "fail");
    div.textContent = (s.phase === "predict" ? "Locked · " : t.ok ? "Yes · " : "No · ") + t.label;
    $("tests").appendChild(div);
  });
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
  if (s.tests[0] && s.tests[1]) s.phase = "make";
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
  bump(s);
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
     ["Catch-up", "navy", () => { s.layer = "Catch-up"; s.status = "blue"; save(st); renderTeacher(); }]].forEach(([txt, cls, fn]) => {
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
goLanding();
