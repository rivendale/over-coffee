const KEY = "over-coffee-v3";
const $ = (id) => document.getElementById(id);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { miss: raw.miss === "easy" ? "easy" : "pickup" };
  } catch {
    return { miss: "pickup" };
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
let store = load();

const canvas = $("scene");
const ctx = canvas.getContext("2d");
let W = 360, H = 640, dpr = 1;
const state = {
  phase: "write",
  strokes: [],
  drawing: false,
  crumple: 0,
  ball: null,
  drag: null,
  hist: [],
  splash: 0,
  dim: 0,
  steam: []
};

function resize() {
  const app = $("app");
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = app.clientWidth || 360;
  H = app.clientHeight || window.innerHeight || 640;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
requestAnimationFrame(resize);
window.addEventListener("resize", resize);
window.addEventListener("load", resize);

const mug = () => ({ x: W * 0.5, y: H * 0.36, r: Math.min(W * 0.26, 118) });
function paperBox() {
  const w = Math.min(W * 0.7, 268);
  const h = w * 0.7;
  return { x: (W - w) / 2, y: H * 0.58, w, h };
}

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
  setTimeout(() => tone(140, 0.1, "square", 0.018), 50);
  if (navigator.vibrate) navigator.vibrate(10);
}
function clink() {
  tone(620, 0.12, "sine", 0.04);
  setTimeout(() => tone(880, 0.08, "sine", 0.02), 40);
  if (navigator.vibrate) navigator.vibrate(16);
}
function whisper(text, ms = 1800) {
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
  const lamp = ctx.createRadialGradient(W * 0.5, H * 0.24, 8, W * 0.5, H * 0.3, H * 0.58);
  lamp.addColorStop(0, "rgba(232,161,90,0.28)");
  lamp.addColorStop(0.45, "rgba(232,161,90,0.07)");
  lamp.addColorStop(1, "rgba(232,161,90,0)");
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3d2619";
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.96, W * 0.78, H * 0.22, 0, 0, Math.PI * 2); ctx.fill();
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

function drawInk(box, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.strokeStyle = `rgba(43,28,20,${alpha})`;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  state.strokes.forEach((s) => {
    if (s.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(box.x + s[0].u * box.w, box.y + s[0].v * box.h);
    for (let i = 1; i < s.length; i++) {
      ctx.lineTo(box.x + s[i].u * box.w, box.y + s[i].v * box.h);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function drawPaperFlat() {
  const b = paperBox();
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h + 8, b.w * 0.42, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#efe6d4";
  ctx.beginPath();
  ctx.moveTo(b.x + 6, b.y);
  ctx.lineTo(b.x + b.w, b.y + 4);
  ctx.lineTo(b.x + b.w - 8, b.y + b.h);
  ctx.lineTo(b.x, b.y + b.h - 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(43,28,20,0.06)";
  for (let i = 1; i < 5; i++) {
    ctx.fillRect(b.x + 16, b.y + 18 + i * 22, b.w - 36, 1);
  }
  drawInk(b, 0.72);
  ctx.restore();
}

function drawCrumpling() {
  const t = state.crumple;
  const b = paperBox();
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const w = b.w * (1 - t * 0.78), h = b.h * (1 - t * 0.78);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.7);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.ellipse(4, h * 0.4, w * 0.3, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#efe6d4";
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 6 * t);
  ctx.quadraticCurveTo(0, -h / 2 - 10 * t, w / 2, -h / 2 + 4 * t);
  ctx.lineTo(w / 2 - 8 * t, h / 2);
  ctx.quadraticCurveTo(0, h / 2 + 12 * t, -w / 2 + 6 * t, h / 2 - 4 * t);
  ctx.closePath(); ctx.fill();
  if (t < 0.7) {
    drawInk({ x: cx - w / 2, y: cy - h / 2, w, h }, 0.55 * (1 - t));
  }
  ctx.restore();
}

function drawBall(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(3, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, 22);
  g.addColorStop(0, "#f7f1e6"); g.addColorStop(0.65, "#e2d3ba"); g.addColorStop(1, "#b89a74");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(90,70,50,0.35)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, -2, 10, -8);
  ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 8, 9, 2); ctx.stroke();
  ctx.restore();
}

function onPaper(p) {
  const b = paperBox();
  return p.x >= b.x - 8 && p.x <= b.x + b.w + 8 && p.y >= b.y - 8 && p.y <= b.y + b.h + 8;
}
function toUV(p) {
  const b = paperBox();
  return { u: (p.x - b.x) / b.w, v: (p.y - b.y) / b.h };
}
function hitBall(p) {
  if (!state.ball) return false;
  return Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < 48;
}
function mugRim() {
  const m = mug();
  return { x: m.x, y: m.y - 18, r: m.r * 0.42 };
}
function pt(e) {
  const r = canvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return { x: s.clientX - r.left, y: s.clientY - r.top };
}

function startWrap() {
  if (state.phase !== "write") return;
  state.phase = "crumple";
  state.crumple = 0;
  $("wrap").classList.add("hide");
  crunch();
}

function readyBall() {
  const b = paperBox();
  state.ball = { x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0 };
  state.phase = "hold";
  whisper("fling it", 1400);
}

function land() {
  if (state.phase === "rest") return;
  state.phase = "rest";
  state.splash = 1;
  state.ball = null;
  clink();
  whisper("coffee has it");
  state.dim = 0.01;
  setTimeout(resetTable, 2400);
}

function resetTable() {
  state.phase = "write";
  state.strokes = [];
  state.ball = null;
  state.dim = 0;
  $("wrap").classList.remove("hide");
}

function missOut() {
  if (store.miss === "easy") {
  state.phase = "home";
    return;
  }
  const b = paperBox();
  state.ball.vx *= 0.2;
  state.ball.vy = 0;
  state.ball.x = Math.max(30, Math.min(W - 30, state.ball.x));
  state.ball.y = Math.min(H * 0.82, Math.max(b.y, state.ball.y));
  state.phase = "hold";
  whisper("pick it up", 1200);
}

function stepFlight() {
  const b = state.ball; if (!b) return;
  b.vy += 0.36;
  b.x += b.vx;
  b.y += b.vy;
  b.vx *= 0.995;
  const rim = mugRim();
  const dist = Math.hypot(rim.x - b.x, rim.y - b.y);
  if (dist < rim.r + 8 && b.vy > -1) {
    land();
    return;
  }
  if (b.y > H * 0.9 || b.x < -30 || b.x > W + 30) missOut();
}

function stepHome() {
  const b = state.ball; if (!b) return;
  const rim = mugRim();
  b.vx += (rim.x - b.x) * 0.04;
  b.vy += (rim.y - b.y) * 0.04 - 0.15;
  b.vx *= 0.86; b.vy *= 0.86;
  b.x += b.vx; b.y += b.vy;
  if (Math.hypot(rim.x - b.x, rim.y - b.y) < 16) land();
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pt(e);
  canvas.setPointerCapture(e.pointerId);
  if (state.phase === "write" && onPaper(p)) {
    state.drawing = true;
    state.strokes.push([toUV(p)]);
    return;
  }
  if ((state.phase === "hold" || state.phase === "flight") && hitBall(p)) {
    state.phase = "throw";
    state.drag = true;
    state.hist = [{ ...p, t: performance.now() }];
    state.ball.x = p.x; state.ball.y = p.y; state.ball.vx = 0; state.ball.vy = 0;
  }
});
canvas.addEventListener("pointermove", (e) => {
  const p = pt(e);
  if (state.drawing && state.phase === "write") {
    state.strokes[state.strokes.length - 1].push(toUV(p));
    return;
  }
  if (state.drag && state.ball) {
    state.ball.x = p.x; state.ball.y = p.y;
    state.hist.push({ ...p, t: performance.now() });
    if (state.hist.length > 7) state.hist.shift();
  }
});
function release() {
  state.drawing = false;
  if (!state.drag || !state.ball) { state.drag = false; return; }
  state.drag = false;
  const hist = state.hist;
  let vx = 0, vy = 0;
  if (hist.length >= 2) {
    const a = hist[0], b = hist[hist.length - 1];
    const dt = Math.max(16, b.t - a.t);
    vx = (b.x - a.x) / dt * 14;
    vy = (b.y - a.y) / dt * 14;
  }
  vx = Math.max(-22, Math.min(22, vx));
  vy = Math.max(-24, Math.min(12, vy));
  if (Math.hypot(vx, vy) < 3.2) {
    state.phase = "hold";
    return;
  }
  state.ball.vx = vx;
  state.ball.vy = vy;
  state.phase = "flight";
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

$("wrap").addEventListener("click", startWrap);
$("mark").addEventListener("click", () => {
  $("modePickup").classList.toggle("on", store.miss === "pickup");
  $("modeEasy").classList.toggle("on", store.miss === "easy");
  $("settings").classList.toggle("open");
});
$("modePickup").addEventListener("click", () => {
  store.miss = "pickup"; save();
  $("modePickup").classList.add("on"); $("modeEasy").classList.remove("on");
});
$("modeEasy").addEventListener("click", () => {
  store.miss = "easy"; save();
  $("modeEasy").classList.add("on"); $("modePickup").classList.remove("on");
});
$("saveSet").addEventListener("click", () => $("settings").classList.remove("open"));

function loop() {
  drawRoom(); drawMug();
  if (state.phase === "write") drawPaperFlat();
  else if (state.phase === "crumple") {
    state.crumple += 0.05;
    if (state.crumple >= 1) readyBall();
    else drawCrumpling();
  }
  if (state.ball && state.phase !== "rest") {
    if (state.phase === "flight") stepFlight();
    if (state.phase === "home") stepHome();
    if (state.ball) drawBall(state.ball.x, state.ball.y);
  }
  if (state.dim > 0) {
    ctx.fillStyle = `rgba(10,6,4,${Math.min(0.32, state.dim)})`;
    ctx.fillRect(0, 0, W, H);
    state.dim += 0.01;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
