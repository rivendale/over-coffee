const KEY = "over-coffee-v2";
const $ = (id) => document.getElementById(id);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("over-coffee-v1") || "{}");
    return {
      wakeHour: raw.wakeHour ?? 6,
      wakeMinute: raw.wakeMinute ?? 30,
      thoughts: Array.isArray(raw.thoughts) ? raw.thoughts : []
    };
  } catch {
    return { wakeHour: 6, wakeMinute: 30, thoughts: [] };
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
let store = load();

const canvas = $("scene");
const ctx = canvas.getContext("2d");
let W = 0, H = 0, dpr = 1;
const state = {
  phase: "write",
  thought: "",
  crumple: 0,
  ball: null,
  drag: null,
  splash: 0,
  dim: 0,
  steam: [],
  scraps: []
};

function resize() {
  const app = $("app");
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = app.clientWidth; H = app.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener("resize", resize);

const mug = () => ({ x: W * 0.5, y: H * 0.42, r: Math.min(W * 0.28, 128) });
const home = () => ({ x: W * 0.5, y: H * 0.72 });

state.steam = Array.from({ length: 16 }, (_, i) => ({
  p: Math.random(), x: (Math.random() - 0.5) * 36,
  s: 0.0016 + Math.random() * 0.0018, wiggle: i
}));

let audioCtx;
function tone(freq, dur, type, gain) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t + dur);
  } catch {}
}
function crunch() {
  tone(180, 0.08, "triangle", 0.03);
  setTimeout(() => tone(140, 0.09, "square", 0.02), 40);
  setTimeout(() => tone(90, 0.12, "triangle", 0.025), 90);
  if (navigator.vibrate) navigator.vibrate(10);
}
function clink() {
  tone(620, 0.12, "sine", 0.04);
  setTimeout(() => tone(880, 0.08, "sine", 0.02), 40);
  if (navigator.vibrate) navigator.vibrate(16);
}

function whisper(text, ms = 2200) {
  const el = $("whisper");
  el.textContent = text;
  el.classList.add("on");
  clearTimeout(whisper._t);
  whisper._t = setTimeout(() => el.classList.remove("on"), ms);
}

function drawRoom() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2b1a12");
  g.addColorStop(0.45, "#1a100c");
  g.addColorStop(1, "#0e0806");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lamp = ctx.createRadialGradient(W * 0.5, H * 0.28, 8, W * 0.5, H * 0.34, H * 0.62);
  lamp.addColorStop(0, "rgba(232,161,90,0.28)");
  lamp.addColorStop(0.4, "rgba(232,161,90,0.07)");
  lamp.addColorStop(1, "rgba(232,161,90,0)");
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3d2619";
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.92, W * 0.7, H * 0.2, 0, 0, Math.PI * 2); ctx.fill();
}

function drawSteam(x, y) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  state.steam.forEach((s) => {
    s.p += s.s; if (s.p > 1) s.p = 0;
    const yy = y - s.p * 110;
    const xx = x + s.x + Math.sin(s.p * 7 + s.wiggle) * 12;
    ctx.strokeStyle = `rgba(243,214,170,${(1 - s.p) * 0.28})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(xx, yy + 18); ctx.quadraticCurveTo(xx + 10, yy + 8, xx, yy); ctx.stroke();
  });
  ctx.restore();
}

function drawMug() {
  const m = mug();
  const rw = m.r, rh = m.r * 0.9;
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath(); ctx.ellipse(8, rh * 0.78, rw * 0.95, rh * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#efe6d6"; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(rw * 0.86, 10, rw * 0.28, -0.75, 0.95); ctx.stroke();
  ctx.strokeStyle = "#c9b496"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(rw * 0.86, 10, rw * 0.28, -0.75, 0.95); ctx.stroke();
  const body = ctx.createLinearGradient(-rw, -rh, rw, rh);
  body.addColorStop(0, "#f8f0e4"); body.addColorStop(0.55, "#e4d2b8"); body.addColorStop(1, "#b89a76");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-rw, -rh * 0.1);
  ctx.bezierCurveTo(-rw, -rh * 0.58, -rw * 0.62, -rh * 0.58, 0, -rh * 0.58);
  ctx.bezierCurveTo(rw * 0.62, -rh * 0.58, rw, -rh * 0.58, rw, -rh * 0.1);
  ctx.lineTo(rw * 0.8, rh * 0.58);
  ctx.quadraticCurveTo(0, rh * 0.82, -rw * 0.8, rh * 0.58);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#24150f";
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.3, rw * 0.8, rh * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  const coffee = ctx.createRadialGradient(-12, -rh * 0.36, 6, 0, -rh * 0.26, rw * 0.72);
  coffee.addColorStop(0, "#6a4228"); coffee.addColorStop(0.5, "#2c1810"); coffee.addColorStop(1, "#140c08");
  ctx.fillStyle = coffee;
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.26, rw * 0.72, rh * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(212,176,132,0.32)";
  ctx.beginPath(); ctx.ellipse(-rw * 0.2, -rh * 0.34, rw * 0.3, rh * 0.08, -0.4, 0, Math.PI * 2); ctx.fill();
  if (state.splash > 0) {
    ctx.fillStyle = `rgba(90,56,36,${state.splash * 0.5})`;
    ctx.beginPath(); ctx.ellipse(0, -rh * 0.22, 34 + (1 - state.splash) * 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    state.splash -= 0.018;
  }
  ctx.restore();
  drawSteam(m.x, m.y - rh * 0.62);
}

function drawScrap(x, y, t, text) {
  ctx.save(); ctx.translate(x, y);
  const w = 86 - t * 52, h = 38 - t * 16;
  ctx.rotate(t * 0.4);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath(); ctx.ellipse(2, 18, 16 + t * 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (t < 0.85) {
    ctx.fillStyle = "#efe6d4";
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2 + 4);
    ctx.quadraticCurveTo(0, -h / 2 - 6 * t, w / 2, -h / 2 + 2);
    ctx.lineTo(w / 2 - 4 * t, h / 2);
    ctx.quadraticCurveTo(0, h / 2 + 8 * t, -w / 2 + 3 * t, h / 2 - 2);
    ctx.closePath(); ctx.fill();
    if (text && t < 0.45) {
      ctx.fillStyle = `rgba(43,28,20,${0.55 - t})`;
      ctx.font = "italic 11px Fraunces, Georgia, serif";
      ctx.textAlign = "center";
      const clip = text.length > 16 ? text.slice(0, 15) + "…" : text;
      ctx.fillText(clip, 0, 3);
    }
  } else {
    const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, 22);
    g.addColorStop(0, "#f7f1e6"); g.addColorStop(0.65, "#e2d3ba"); g.addColorStop(1, "#b89a74");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(90,70,50,0.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, -2, 10, -8);
    ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 8, 9, 2); ctx.stroke();
  }
  ctx.restore();
}

function startCrumple(text) {
  state.thought = text;
  state.phase = "crumple";
  state.crumple = 0;
  const h = home();
  state.ball = { x: h.x, y: h.y, vx: 0, vy: 0 };
  $("line").classList.add("hide");
  crunch();
}

function tossIntoMug() {
  if (!state.ball) return;
  const m = mug();
  state.phase = "flight";
  state.ball.vx = (m.x - state.ball.x) * 0.045;
  state.ball.vy = -13;
  state.ball.life = 0;
}

function land() {
  if (state.phase === "rest") return;
  state.phase = "rest";
  state.splash = 1;
  clink();
  store.thoughts.unshift({
    id: String(Date.now()),
    text: state.thought,
    createdAt: new Date().toISOString()
  });
  if (store.thoughts.length > 40) store.thoughts.length = 40;
  save();
  whisper("coffee has it");
  state.dim = 0.01;
  state.ball = null;
  setTimeout(() => {
    $("thought").value = "";
    $("line").classList.remove("hide");
    state.phase = "write";
    state.dim = 0;
  }, 2600);
}

function stepFlight() {
  const b = state.ball; if (!b) return;
  b.vy += 0.38; b.x += b.vx; b.y += b.vy; b.life = (b.life || 0) + 1;
  const m = mug();
  const dx = m.x - b.x, dy = (m.y - 18) - b.y;
  const dist = Math.hypot(dx, dy);
  if (dist < m.r * 0.95) { b.vx += dx * 0.02; b.vy += dy * 0.02; }
  if (dist < 34 || b.life > 160) land();
}

function pt(e) {
  const r = canvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return { x: s.clientX - r.left, y: s.clientY - r.top };
}
function hitMug(p) {
  const m = mug();
  return Math.hypot(p.x - m.x, p.y - m.y) < m.r * 1.05;
}
function hitBall(p) {
  if (!state.ball) return false;
  return Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < 56;
}

let holdTimer = 0;
canvas.addEventListener("pointerdown", (e) => {
  const p = pt(e);
  if (state.phase === "hold" || state.phase === "flight") {
    if (hitBall(p) || hitMug(p)) {
      canvas.setPointerCapture(e.pointerId);
      state.drag = { x: p.x, y: p.y, px: p.x, py: p.y, t: Date.now() };
      state.ball.x = p.x; state.ball.y = p.y;
    } else tossIntoMug();
    return;
  }
  if (hitMug(p)) {
    holdTimer = setTimeout(() => {
      $("wake").value = `${String(store.wakeHour).padStart(2,"0")}:${String(store.wakeMinute).padStart(2,"0")}`;
      $("settings").classList.add("open");
    }, 650);
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!state.drag) return;
  const p = pt(e);
  state.drag.px = state.drag.x; state.drag.py = state.drag.y;
  state.drag.x = p.x; state.drag.y = p.y;
  state.ball.x = p.x; state.ball.y = p.y;
});
function release() {
  clearTimeout(holdTimer);
  if (!state.drag || !state.ball) { state.drag = null; return; }
  const dt = Date.now() - state.drag.t;
  const vx = (state.drag.x - state.drag.px) * 1.7;
  const vy = (state.drag.y - state.drag.py) * 1.7;
  state.drag = null;
  if (dt < 180 || Math.hypot(vx, vy) < 4) { tossIntoMug(); return; }
  state.phase = "flight";
  state.ball.vx = Math.max(-16, Math.min(16, vx));
  state.ball.vy = Math.max(-22, Math.min(4, vy - 5));
  state.ball.life = 0;
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

$("thought").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); maybeCrumple(); }
});
$("thought").addEventListener("blur", () => { if ($("thought").value.trim()) maybeCrumple(); });
function maybeCrumple() {
  const text = $("thought").value.trim();
  if (!text || state.phase !== "write") return;
  startCrumple(text);
}

$("mark").addEventListener("click", () => {
  $("wake").value = `${String(store.wakeHour).padStart(2,"0")}:${String(store.wakeMinute).padStart(2,"0")}`;
  $("settings").classList.toggle("open");
});
$("saveSet").addEventListener("click", () => {
  const [hh, mm] = ($("wake").value || "06:30").split(":").map(Number);
  store.wakeHour = hh; store.wakeMinute = mm; save();
  $("settings").classList.remove("open");
});

function loop() {
  drawRoom(); drawMug();
  if (state.phase === "crumple") {
    state.crumple += 0.045;
    drawScrap(state.ball.x, state.ball.y, Math.min(1, state.crumple), state.thought);
    if (state.crumple >= 1) {
      state.phase = "hold";
      whisper("tap the mug", 1600);
    }
  } else if (state.ball && state.phase !== "rest") {
    if (state.phase === "flight") stepFlight();
    if (state.ball) drawScrap(state.ball.x, state.ball.y, 1, state.thought);
  }
  if (state.dim > 0) {
    ctx.fillStyle = `rgba(10,6,4,${Math.min(0.35, state.dim)})`;
    ctx.fillRect(0, 0, W, H);
    state.dim += 0.008;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
