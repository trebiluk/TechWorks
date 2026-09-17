/* KZ 1.6.0 juice — rolls the bot, shop floor, shout, teaser. */
(function () {
  const $ = id => document.getElementById(id);
  let animFrame = 0;
  const play = { timer: 0 };

  function drawFloor(ctx, W, H, sim) {
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, W, H);
    const cw = W / sim.cols, ch = H / sim.rows;
    for (let y = 0; y < sim.rows; y++) {
      for (let x = 0; x < sim.cols; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#0b1c2e" : "#0e2238";
        ctx.fillRect(x * cw, y * ch, cw, ch);
      }
    }
    ctx.fillStyle = "#3f1d0f";
    ctx.fillRect(sim.wallX * cw, 0, cw * 2, H);
    const stripe = 14;
    for (let i = -H; i < H + W; i += stripe * 2) {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(sim.wallX * cw, i);
      ctx.lineTo(sim.wallX * cw + cw * 2, i + stripe);
      ctx.lineTo(sim.wallX * cw + cw * 2, i + stripe * 2);
      ctx.lineTo(sim.wallX * cw, i + stripe);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(sim.wallX * cw, 0, 6, H);
    ctx.fillStyle = "#fff7ed";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("SAW / WALL", sim.wallX * cw + 10, 18);
    return { cw, ch };
  }

  function drawBot(ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(2, r + 4, r * 0.9, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-r - 2, r - 6, r * 2 + 4, 8);
    ctx.fillStyle = "#64748b";
    for (let i = -r; i < r; i += 6) ctx.fillRect(i, r - 5, 3, 6);
    ctx.fillStyle = "#1b365d";
    ctx.fillRect(-r, -r + 2, r * 2, r * 1.6);
    ctx.fillStyle = "#e0b45a";
    ctx.fillRect(-r + 4, -r + 8, r * 2 - 8, 8);
    const blink = animFrame % 80 < 4;
    ctx.fillStyle = blink ? "#1b365d" : "#86efac";
    ctx.beginPath(); ctx.arc(-6, -2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -2, 4, 0, Math.PI * 2); ctx.fill();
    if (!blink) {
      ctx.fillStyle = "#0b1c33";
      ctx.beginPath(); ctx.arc(-5, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(9, -2, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawSparks(ctx, x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI - Math.PI / 2;
      ctx.strokeStyle = i % 2 ? "#fbbf24" : "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16);
      ctx.stroke();
    }
  }

  window.draw = function (canvas, sim, step) {
    if (!canvas || !sim) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const { cw, ch } = drawFloor(ctx, W, H, sim);
    const path = sim.path || [{ x: sim.x, y: sim.y }];
    const max = step == null ? path.length - 1 : Math.min(step, path.length - 1);
    for (let i = 0; i <= max; i++) {
      const p = path[i];
      ctx.fillStyle = "rgba(20,163,138," + (0.12 + i / Math.max(1, path.length) * 0.45) + ")";
      ctx.fillRect(p.x * cw + 10, p.y * ch + 10, cw - 20, ch - 20);
    }
    const p = path[Math.max(0, max)];
    const cx = p.x * cw + cw / 2;
    const cy = p.y * ch + ch / 2;
    drawBot(ctx, cx, cy, Math.min(cw, ch) * 0.28);
    if (max === path.length - 1 && sim.hitWall) drawSparks(ctx, sim.wallX * cw - 4, cy);
  };

  function shout(text, kind) {
    const el = $("callout");
    if (!el) return;
    el.textContent = text;
    el.className = "callout pop " + (kind || "");
    clearTimeout(shout.t);
    shout.t = setTimeout(() => el.classList.add("hidden"), 900);
  }
  function shake() {
    const frame = document.querySelector(".stage-frame");
    if (!frame) return;
    frame.classList.remove("shake");
    void frame.offsetWidth;
    frame.classList.add("shake");
  }
  function playPath(sim) {
    clearTimeout(play.timer);
    let i = 0;
    function tick() {
      window.draw($("world"), sim, i);
      const last = i >= sim.path.length - 1;
      if (last) {
        if (sim.stopped && sim.hitWall) shout("SAFE", "good");
        else { shout(sim.hitWall ? "BONK" : "RUNAWAY", "bad"); shake(); }
        return;
      }
      i += 1;
      play.timer = setTimeout(tick, 110);
    }
    tick();
  }

  const oldEx = $("btn-run-example") && $("btn-run-example").onclick;
  if ($("btn-run-example")) {
    $("btn-run-example").onclick = function () {
      if (oldEx) oldEx();
      try { playPath(evaluate(EXAMPLE).result); } catch (e) {}
    };
  }
  const oldMine = $("btn-run-mine") && $("btn-run-mine").onclick;
  if ($("btn-run-mine")) {
    $("btn-run-mine").onclick = function () {
      if (oldMine) oldMine();
      try {
        const st = load(session.code);
        const s = st.students[session.id];
        playPath(evaluate(s.program).result);
      } catch (e) {}
    };
  }

  function shopHeat(st) {
    const list = Object.values((st && st.students) || {});
    if (!list.length) return 0;
    const pts = list.reduce((n, s) => n + (s.tests || []).filter(Boolean).length, 0);
    return Math.round((pts / (list.length * 3)) * 100);
  }
  function paintHeat() {
    try {
      const st = load(session.code);
      const h = shopHeat(st);
      if ($("heat-fill")) $("heat-fill").style.width = h + "%";
      if ($("heat-num")) $("heat-num").textContent = h;
      if ($("k-heat")) $("k-heat").textContent = h;
    } catch (e) {}
  }
  setInterval(paintHeat, 800);

  let teaserTimer = 0;
  function startTeaser() {
    const c = $("teaser");
    if (!c) return;
    const sim = run(EXAMPLE);
    let i = 0;
    function tick() {
      animFrame++;
      window.draw(c, sim, i);
      i = (i + 1) % Math.max(1, sim.path.length);
      teaserTimer = setTimeout(tick, 140);
    }
    clearTimeout(teaserTimer);
    tick();
  }
  startTeaser();
})();
