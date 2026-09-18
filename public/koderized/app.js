const QUEST_TITLE = "Don't hit the wall";
const EXAMPLE = [{ t: "repeat", n: 12 }, { t: "move" }, { t: "if-wall-stop" }, { t: "end" }];
const DEMO = ["Jordan","Malik","Ava","Priya","Luis","Noor","Eli","Samira","Hana","Ivy"];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");
function setTxt(id, v) { const el = $(id); if (el) el.textContent = v; }
const REPEAT_STEPS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20];
function nextRepeat(n) {
  const i = REPEAT_STEPS.indexOf(Number(n));
  return REPEAT_STEPS[(i < 0 ? 0 : i + 1) % REPEAT_STEPS.length];
}
function shopHeat(st) {
  const list = Object.values((st && st.students) || {});
  if (!list.length) return 0;
  const pts = list.reduce((n, s) => n + (s.tests || []).filter(Boolean).length, 0);
  return Math.round((pts / (list.length * 3)) * 100);
}
const mem = {};
function key(c) { return "qlcb_" + (c || "").toUpperCase(); }
function get(k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
function set(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
function load(code) {
  const raw = get(key(code));
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  return { code: (code || "QUEST4").toUpperCase(), frozen: false, spotlight: null, students: {}, logs: [] };
}
function save(st) {
  set(key(st.code), JSON.stringify(st));
  try { bc.postMessage({ code: st.code }); } catch (e) {}
}
let bc;
try { bc = new BroadcastChannel("qlcb"); } catch (e) { bc = { postMessage() {}, addEventListener() {} }; }
const session = { role: null, code: "QUEST4", alias: "", id: null };
function uid() { return "s" + Math.random().toString(36).slice(2, 8); }
function log(st, alias, kind, text) {
  st.logs.unshift({ t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), alias, kind, text });
  st.logs = st.logs.slice(0, 80);
}
function ensure(st, alias, id) {
  if (!st.students[id]) {
    st.students[id] = {
      id, alias, program: JSON.parse(JSON.stringify(EXAMPLE)), lastGreen: JSON.parse(JSON.stringify(EXAMPLE)),
      predict: "", predicted: false, probe: null, tests: [false, false, false],
      layer: "Core", status: "gray", restores: 0, tradeoff: "", lastChange: "Joined", phase: "predict"
    };
  }
  return st.students[id];
}
function run(program, maxSteps) {
  const cols = 10, rows = 6, wallX = 8;
  let x = 1, y = 3, dir = 1, score = 0, stopped = false, steps = 0;
  const path = [{ x, y }];
  const cap = maxSteps || 80;
  function wallAhead() { return x + (dir === 1 ? 1 : dir === 3 ? -1 : 0) >= wallX; }
  function move() {
    if (stopped) return;
    const nx = x + (dir === 1 ? 1 : dir === 3 ? -1 : 0);
    const ny = y + (dir === 2 ? 1 : dir === 0 ? -1 : 0);
    if (nx >= wallX || nx < 0 || ny < 0 || ny >= rows) return;
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
  exec(program, 0);
  return { x, y, score, stopped, path, hitWall: x === wallX - 1, wallX, cols, rows };
}
function evaluate(program) {
  const r = run(program);
  const t1 = r.hitWall && r.stopped;
  const r2 = run(program, 40);
  const t2 = r2.stopped || r2.hitWall;
  return {
    result: r,
    tests: [
      { ok: t1, label: "Stops at wall" },
      { ok: t2 && t1, label: "Doesn’t run forever" },
      { ok: run(program).score >= 1, label: "Score goes up" }
    ]
  };
}
function draw(canvas, sim) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = "#0b1c33"; ctx.fillRect(0, 0, W, H);
  const cw = W / sim.cols, ch = H / sim.rows;
  for (let y = 0; y < sim.rows; y++) for (let x = 0; x < sim.cols; x++) {
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.strokeRect(x * cw, y * ch, cw, ch);
  }
  ctx.fillStyle = "#7c2d12"; ctx.fillRect(sim.wallX * cw, 0, cw * 2, H);
  ctx.fillStyle = "#f59e0b"; ctx.font = "12px sans-serif"; ctx.fillText("WALL", sim.wallX * cw + 8, 16);
  sim.path.forEach((p, i) => {
    ctx.fillStyle = "rgba(20,150,127," + (0.15 + i / sim.path.length * 0.4) + ")";
    ctx.fillRect(p.x * cw + 8, p.y * ch + 8, cw - 16, ch - 16);
  });
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(sim.x * cw + cw / 2, sim.y * ch + ch / 2, Math.min(cw, ch) * 0.28, 0, Math.PI * 2);
  ctx.fill();
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
  if (!Object.keys(st.students).length) {
    DEMO.forEach((name, i) => {
      const s = ensure(st, name, "d" + i);
      s.predicted = true;
      if (i < 3) { s.status = "red"; s.phase = "modify"; s.lastChange = "Poked the number"; }
      else if (i < 6) { s.status = "amber"; s.tests = [true, false, false]; s.phase = "modify"; }
      else { s.status = "green"; s.tests = [true, true, false]; s.phase = "make"; }
    });
    log(st, "Room", "START", "Period open.");
  }
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
  const ev = evaluate(s.program);
  s.tests = ev.tests.map(t => t.ok);
  const pass = ev.tests.filter(t => t.ok).length;
  s.status = pass >= 2 ? "green" : (!s.predicted ? "gray" : pass === 0 ? "red" : "amber");
  if (pass >= 2) s.lastGreen = JSON.parse(JSON.stringify(s.program));
}
function chips(phase) {
  ["predict", "run", "investigate", "modify", "make"].forEach(p => {
    $("ph-" + p).className = "chip" + (p === phase ? " on" : "");
  });
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
      } else {
        poke.disabled = true;
      }
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
}
function renderStudent() {
  const st = load(session.code);
  const s = ensure(st, session.alias, session.id);
  $("freeze-banner").classList.toggle("hidden", !st.frozen);
  const spotting = st.spotlight && st.spotlight !== session.id;
  $("spot-banner").classList.toggle("hidden", !spotting);
  if (spotting && st.students[st.spotlight]) $("spot-banner").textContent = "Watch " + st.students[st.spotlight].alias;
  chips(s.phase);
  $("btn-predict").disabled = s.predicted || st.frozen || !s.predict;
  $("btn-run-example").disabled = !s.predicted || st.frozen;
  $("choices").classList.toggle("hidden", s.predicted || s.phase !== "predict");
  $("probe-wrap").classList.toggle("hidden", s.phase !== "investigate");
  $("modify-wrap").classList.toggle("hidden", !(s.phase === "modify" || s.phase === "make"));
  $("trade-wrap").classList.toggle("hidden", !(s.tests && s.tests[0] && s.tests[1]));
  $("tradeoff").value = s.tradeoff || "";
  document.querySelectorAll(".choice[data-p]").forEach(b => {
    b.classList.toggle("picked", b.getAttribute("data-p") === s.predict);
    b.disabled = s.predicted || st.frozen;
  });
  document.querySelectorAll(".probe").forEach(b => b.classList.toggle("picked", b.getAttribute("data-v") === s.probe));
  const prog = spotting && st.students[st.spotlight] ? st.students[st.spotlight].program : (s.phase === "predict" ? EXAMPLE : s.program);
  renderBlocks($("block-list"), prog, !spotting && !st.frozen && (s.phase === "modify" || s.phase === "make"));
  $("palette").classList.toggle("hidden", spotting || st.frozen || !(s.phase === "modify" || s.phase === "make"));
  const ev = evaluate(prog);
  draw($("world"), ev.result);
  $("tests").innerHTML = "";
  ev.tests.forEach(t => {
    const d = document.createElement("div");
    d.className = "test " + (s.phase === "predict" ? "" : t.ok ? "pass" : "fail");
    d.textContent = (s.phase === "predict" ? "Locked · " : t.ok ? "Yes · " : "No · ") + t.label;
    $("tests").appendChild(d);
  });
}
document.querySelectorAll(".choice[data-p]").forEach(b => {
  b.onclick = () => {
    const st = load(session.code);
    const s = st.students[session.id];
    if (!s || s.predicted) return;
    s.predict = b.getAttribute("data-p");
    save(st); renderStudent();
  };
});
document.querySelectorAll(".probe").forEach(b => {
  b.onclick = () => {
    const st = load(session.code);
    const s = st.students[session.id];
    if (!s) return;
    s.probe = b.getAttribute("data-v");
    save(st); renderStudent();
  };
});
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
  s.phase = "modify";
  s.program = JSON.parse(JSON.stringify(EXAMPLE));
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
  s.program = JSON.parse(JSON.stringify(s.lastGreen || EXAMPLE));
  s.restores += 1;
  s.lastChange = "Undo";
  log(st, s.alias, "RESTORE", "Last green");
  bump(s); save(st); renderStudent();
};
$("btn-tradeoff").onclick = () => {
  const st = load(session.code);
  const s = st.students[session.id];
  s.tradeoff = $("tradeoff").value.trim();
  if (!s.tradeoff) return;
  s.phase = "make";
  log(st, s.alias, "TRADEOFF", s.tradeoff);
  save(st); renderStudent();
};
function renderTeacher() {
  const st = load(session.code);
  setTxt("t-code", st.code);
  setTxt("t-quest", QUEST_TITLE);
  if ($("btn-freeze")) $("btn-freeze").textContent = st.frozen ? "Unfreeze" : "Freeze";
  const list = Object.values(st.students);
  setTxt("k-present", list.length);
  setTxt("k-predict", list.filter(s => s.predicted).length + "/" + list.length);
  const stuck = list.filter(s => s.status === "red");
  setTxt("k-stuck", stuck.length);
  setTxt("k-coach", list.filter(s => s.status === "green").length);
  setTxt("k-catch", list.filter(s => s.layer === "Catch-up").length);
  setTxt("k-trade", list.filter(s => s.tradeoff).length);
  setTxt("k-heat", shopHeat(st));
  $("stuck-body").innerHTML = "";
  (stuck.length ? stuck : [{ alias: "—", lastChange: "Nobody red", tests: [true] }]).forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + s.alias + "</td><td>" + (s.tests && s.tests[0] ? "Other" : "Doesn’t stop") + "</td><td>" + (s.lastChange || "") + "</td>";
    $("stuck-body").appendChild(tr);
  });
  $("roster-body").innerHTML = "";
  list.sort((a, b) => a.alias.localeCompare(b.alias)).forEach(s => {
    const tr = document.createElement("tr");
    const pass = (s.tests || []).filter(Boolean).length;
    tr.innerHTML = "<td>" + s.alias + "</td><td><span class='status st-" + s.status + "'>" + s.status + "</span></td><td>" + (s.predicted ? "Y" : "N") + "</td><td>" + pass + "/3</td><td>" + (s.lastChange || "") + "</td><td></td>";
    const td = tr.lastChild;
    [["Spotlight", "ghost", () => { st.spotlight = s.id; log(st, "Teacher", "SPOT", s.alias); save(st); renderTeacher(); }],
     ["Undo", "gold", () => { s.program = JSON.parse(JSON.stringify(s.lastGreen || EXAMPLE)); s.lastChange = "Teacher undo"; bump(s); log(st, s.alias, "RESTORE", "Teacher"); save(st); renderTeacher(); }],
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
  const rows = [["Name", "Guess", "Tests", "Tradeoff", "Layer"]];
  Object.values(st.students).forEach(s => rows.push([s.alias, s.predicted ? "Y" : "N", (s.tests || []).filter(Boolean).length + "/3", s.tradeoff || "", s.layer]));
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
    if (e.key === "1") document.querySelector('[data-p="stop"]').click();
    if (e.key === "2") document.querySelector('[data-p="through"]').click();
    if (e.key === "3") document.querySelector('[data-p="forever"]').click();
    if (e.key === "Enter") { e.preventDefault(); $("btn-predict").click(); }
  } else if (s.phase === "run" && e.code === "Space") { e.preventDefault(); $("btn-run-example").click(); }
  else if (s.phase === "investigate") {
    if (e.key === "1") document.querySelector('[data-v="inside"]').click();
    if (e.key === "2") document.querySelector('[data-v="outside"]').click();
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
