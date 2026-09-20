const KEY = "over-coffee-v5";
const $ = (id) => document.getElementById(id);
const R = 18;
const G = 0.42;
const DRAG = 0.992;
const FLOOR = 0.86;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("over-coffee-v4") || "{}");
    return {
      miss: raw.miss === "easy" ? "easy" : "pickup",
      sound: raw.sound === true
    };
  } catch {
    return { miss: "pickup", sound: false };
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
  squeezing: false,
  ball: null,
  drag: null,
  origin: null,
  hist: [],
  splash: 0,
  dim: 0,
  steam: [],
  lastTap: 0
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
function opening() {
  const m = mug();
  return { x: m.x, y: m.y - m.r * 0.28, rx: m.r * 0.52, ry: m.r * 0.18 };
}
function hasInk() { return state.strokes.some((s) => s.length > 2); }
function showWrap(on) { $("wrap").classList.toggle("hide", !on); }

state.steam = Array.from({ length: 16 }, (_, i) => ({
  p: Math.random(), x: (Math.random() - 0.5) * 36,
  s: 0.0016 + Math.random() * 0.0018, wiggle: i
}));

let audioCtx;
function tone(freq, dur, type, gain) {
  if (!store.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
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
function crunch() { if (!store.sound) return; tone(180, 0.08, "triangle", 0.03); }
function clink() { if (!store.sound) return; tone(620, 0.1, "sine", 0.03); }

function drawRoom() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2b1a12"); g.addColorStop(0.45, "#1a100c"); g.addColorStop(1, "#0e0806");
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
  ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
  ctx.strokeStyle = `rgba(43,28,20,${alpha})`;
  ctx.lineWidth = 4.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  state.strokes.forEach((s) => {
    if (s.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(box.x + s[0].u * box.w, box.y + s[0].v * box.h);
    for (let i = 1; i < s.length; i++) ctx.lineTo(box.x + s[i].u * box.w, box.y + s[i].v * box.h);
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
  ctx.moveTo(b.x + 6, b.y); ctx.lineTo(b.x + b.w, b.y + 4);
  ctx.lineTo(b.x + b.w - 8, b.y + b.h); ctx.lineTo(b.x, b.y + b.h - 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(43,28,20,0.06)";
  for (let i = 1; i < 5; i++) ctx.fillRect(b.x + 16, b.y + 18 + i * 22, b.w - 36, 1);
  drawInk(b, 0.78);
  ctx.restore();
}
function drawCrumpling() {
  const t = state.crumple;
  const b = paperBox();
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const w = b.w * (1 - t * 0.78), h = b.h * (1 - t * 0.78);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.7);
  ctx.fillStyle = "#efe6d4";
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 6 * t);
  ctx.quadraticCurveTo(0, -h / 2 - 10 * t, w / 2, -h / 2 + 4 * t);
  ctx.lineTo(w / 2 - 8 * t, h / 2);
  ctx.quadraticCurveTo(0, h / 2 + 12 * t, -w / 2 + 6 * t, h / 2 - 4 * t);
  ctx.closePath(); ctx.fill();
  if (t < 0.7) drawInk({ x: cx - w / 2, y: cy - h / 2, w, h }, 0.55 * (1 - t));
  ctx.restore();
}
function drawBall(b) {
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin || 0);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath(); ctx.ellipse(2, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, R);
  g.addColorStop(0, "#f7f1e6"); g.addColorStop(0.65, "#e2d3ba"); g.addColorStop(1, "#b89a74");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(90,70,50,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, -2, 10, -8);
  ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 8, 9, 2); ctx.stroke();
  ctx.restore();
}
function drawAim() {
  if (!state.drag || !state.ball || !state.origin) return;
  const o = state.origin, b = state.ball;
  ctx.save();
  ctx.strokeStyle = "rgba(243,230,208,0.28)";
  ctx.setLineDash([5, 6]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(b.x, b.y);
  ctx.lineTo(o.x + (o.x - b.x), o.y + (o.y - b.y));
  ctx.stroke();
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
  return Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < R + 22;
}
function pt(e) {
  const r = canvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return { x: s.clientX - r.left, y: s.clientY - r.top };
}
function inOpening(x, y) {
  const o = opening();
  const dx = (x - o.x) / o.rx, dy = (y - o.y) / o.ry;
  return dx * dx + dy * dy <= 1;
}

function startWrap() {
  if (state.phase !== "write") return;
  state.phase = "crumple";
  state.crumple = 0;
  state.squeezing = true;
  showWrap(false);
  crunch();
}
function readyBall() {
  const b = paperBox();
  state.ball = { x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0, spin: 0, rest: 0 };
  state.phase = "hold";
  state.squeezing = false;
}
function land() {
  if (state.phase === "rest") return;
  state.phase = "rest";
  state.splash = 1;
  state.ball = null;
  clink();
  state.dim = 0.01;
  setTimeout(resetTable, 1800);
}
function resetTable() {
  state.phase = "write";
  state.strokes = [];
  state.ball = null;
  state.dim = 0;
  showWrap(false);
}

function bounceFloor(b) {
  const yFloor = H * FLOOR;
  if (b.y + R < yFloor) return false;
  b.y = yFloor - R;
  b.vy *= -0.38;
  b.vx *= 0.72;
  b.spin *= 0.7;
  if (Math.abs(b.vy) < 1.4 && Math.abs(b.vx) < 1.1) {
    b.vx = 0; b.vy = 0;
    return true;
  }
  return false;
}
function bounceMug(b) {
  const m = mug();
  const dx = b.x - m.x, dy = b.y - m.y;
  const dist = Math.hypot(dx, dy);
  const body = m.r * 0.78;
  if (dist > body + R || dist < 1) return;
  if (inOpening(b.x, b.y) && b.vy > 0.4) return;
  const nx = dx / dist, ny = dy / dist;
  const dot = b.vx * nx + b.vy * ny;
  if (dot >= 0) return;
  b.vx -= 1.6 * dot * nx;
  b.vy -= 1.6 * dot * ny;
  b.x = m.x + nx * (body + R + 1);
  b.y = m.y + ny * (body + R + 1);
  b.spin += -b.vx * 0.04;
}
function stepFlight() {
  const b = state.ball; if (!b) return;
  b.vy += G;
  b.vx *= DRAG; b.vy *= DRAG;
  b.x += b.vx; b.y += b.vy;
  b.spin += b.vx * 0.03;
  if (inOpening(b.x, b.y) && b.vy > 0.6) { land(); return; }
  bounceMug(b);
  const settled = bounceFloor(b);
  if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.5; }
  if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * 0.5; }
  if (settled) {
    if (store.miss === "easy") state.phase = "home";
    else state.phase = "hold";
  }
}
function stepHome() {
  const b = state.ball; if (!b) return;
  const o = opening();
  b.vx += (o.x - b.x) * 0.012;
  b.vy += (o.y - b.y) * 0.012 - 0.08;
  b.vx *= 0.9; b.vy *= 0.9;
  b.x += b.vx; b.y += b.vy;
  b.spin += 0.08;
  if (inOpening(b.x, b.y)) land();
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pt(e);
  canvas.setPointerCapture(e.pointerId);
  if (state.phase === "write" && onPaper(p)) {
    const now = performance.now();
    if (now - state.lastTap < 340 && hasInk()) { startWrap(); state.lastTap = 0; return; }
    state.lastTap = now;
    state.drawing = true;
    state.strokes.push([toUV(p)]);
    return;
  }
  if (state.phase === "crumple") {
    state.squeezing = true;
    return;
  }
  if ((state.phase === "hold" || state.phase === "flight") && hitBall(p)) {
    state.phase = "throw";
    state.drag = true;
    state.origin = { x: state.ball.x, y: state.ball.y };
    state.hist = [{ ...p, t: performance.now() }];
    state.ball.vx = 0; state.ball.vy = 0;
  }
});
canvas.addEventListener("pointermove", (e) => {
  const p = pt(e);
  if (state.drawing && state.phase === "write") {
    state.strokes[state.strokes.length - 1].push(toUV(p));
    if (hasInk()) showWrap(true);
    return;
  }
  if (state.phase === "crumple" && state.squeezing) {
    const b = paperBox();
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const max = Math.hypot(b.w, b.h) * 0.45;
    const d = Math.min(max, Math.hypot(p.x - cx, p.y - cy));
    state.crumple = Math.max(state.crumple, 1 - d / max);
    return;
  }
  if (state.drag && state.ball) {
    state.ball.x = p.x; state.ball.y = p.y;
    state.hist.push({ ...p, t: performance.now() });
    if (state.hist.length > 8) state.hist.shift();
  }
});
function release() {
  if (state.phase === "crumple") {
    state.squeezing = false;
    if (state.crumple > 0.86) readyBall();
    return;
  }
  state.drawing = false;
  if (state.phase === "write" && hasInk()) showWrap(true);
  if (!state.drag || !state.ball) { state.drag = false; return; }
  state.drag = false;
  const o = state.origin || state.ball;
  const pullX = o.x - state.ball.x;
  const pullY = o.y - state.ball.y;
  const pull = Math.hypot(pullX, pullY);
  let vx = 0, vy = 0;
  if (pull > 18) {
    vx = pullX * 0.14;
    vy = pullY * 0.14;
  } else if (state.hist.length >= 2) {
    const a = state.hist[0], b = state.hist[state.hist.length - 1];
    const dt = Math.max(16, b.t - a.t);
    vx = (b.x - a.x) / dt * 16;
    vy = (b.y - a.y) / dt * 16;
  }
  vx = Math.max(-20, Math.min(20, vx));
  vy = Math.max(-22, Math.min(14, vy));
  if (Math.hypot(vx, vy) < 2.4) { state.phase = "hold"; return; }
  state.ball.vx = vx;
  state.ball.vy = vy;
  state.ball.spin = -vx * 0.05;
  state.origin = null;
  state.phase = "flight";
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

function paintSettings() {
  $("modePickup").classList.toggle("on", store.miss === "pickup");
  $("modeEasy").classList.toggle("on", store.miss === "easy");
  $("soundOff").classList.toggle("on", !store.sound);
  $("soundOn").classList.toggle("on", store.sound);
}
$("wrap").addEventListener("click", startWrap);
$("mark").addEventListener("click", () => { paintSettings(); $("settings").classList.toggle("open"); });
$("modePickup").addEventListener("click", () => { store.miss = "pickup"; save(); paintSettings(); });
$("modeEasy").addEventListener("click", () => { store.miss = "easy"; save(); paintSettings(); });
$("soundOff").addEventListener("click", () => { store.sound = false; save(); paintSettings(); });
$("soundOn").addEventListener("click", () => { store.sound = true; save(); paintSettings(); });
$("saveSet").addEventListener("click", () => $("settings").classList.remove("open"));

function loop() {
  drawRoom(); drawMug();
  if (state.phase === "write") drawPaperFlat();
  else if (state.phase === "crumple") {
    if (!state.squeezing) state.crumple = Math.min(1, state.crumple + 0.012);
    drawCrumpling();
    if (state.crumple >= 1) readyBall();
  }
  if (state.ball && state.phase !== "rest") {
    if (state.phase === "flight") stepFlight();
    if (state.phase === "home") stepHome();
    if (state.ball) {
      drawBall(state.ball);
      drawAim();
    }
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
