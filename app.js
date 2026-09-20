const KEY = "over-coffee-v8";
const $ = (id) => document.getElementById(id);
const R = 18;
const SCENES = ["lamp", "japan", "country", "shore", "garden"];
const TOOLS = {
  pencil: { color: "rgba(60,42,30,0.72)", width: 1.8, jitter: 0.35 },
  pen: { color: "rgba(28,36,70,0.88)", width: 2.4, jitter: 0 },
  crayon: { color: "rgba(176,62,48,0.78)", width: 7.5, jitter: 0.9 },
  marker: { color: "rgba(40,92,74,0.55)", width: 11, jitter: 0 }
};
const WASH = {
  lamp: { sky: ["#4a3224", "#23160f"], table: "#4a2e1c", cup: "#efe4d0", ink: "#2a1a12" },
  japan: { sky: ["#2a3654", "#1a2236"], table: "#3d3228", cup: "#f0e6d4", ink: "#1a1c22" },
  country: { sky: ["#e2a06a", "#8a4e32"], table: "#5a3820", cup: "#f3e2c4", ink: "#3a2214" },
  shore: { sky: ["#8eb8c8", "#4a7380"], table: "#c4ae86", cup: "#f6efe4", ink: "#2c3a40" },
  garden: { sky: ["#6d5a72", "#3a303c"], table: "#3d2c28", cup: "#eee4d4", ink: "#2a2226" }
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      sound: raw.sound === true,
      tool: TOOLS[raw.tool] ? raw.tool : "pencil",
      scene: SCENES.includes(raw.scene) ? raw.scene : "lamp"
    };
  } catch {
    return { sound: false, tool: "pencil", scene: "lamp" };
  }
}
function save() { localStorage.setItem(KEY, JSON.stringify(store)); }
let store = load();

const canvas = $("scene");
const ctx = canvas.getContext("2d");
let W = 360, H = 640, dpr = 1, tick = 0;
const state = {
  phase: "write", strokes: [], drawing: false, ball: null, nest: null,
  dragging: false, splash: 0, steam: [], lastTap: 0
};

function resize() {
  const app = $("app");
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = app.clientWidth || 360;
  H = app.clientHeight || window.innerHeight || 640;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = "100%"; canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
requestAnimationFrame(resize);
window.addEventListener("resize", resize);
window.addEventListener("load", resize);

const mug = () => ({ x: W * 0.5, y: H * 0.32, r: Math.min(W * 0.24, 108) });
function paperBox() {
  const w = Math.min(W * 0.72, 280);
  const h = w * 0.58;
  return { x: (W - w) / 2, y: H * 0.54, w, h };
}
function nest() { return { x: W * 0.5, y: H * 0.78 }; }
function cup() { const m = mug(); return { x: m.x, y: m.y - m.r * 0.22 }; }
function hasInk() { return state.strokes.some((s) => s.pts.length > 2); }
function showWrap(on) { $("wrap").classList.toggle("hide", !on); }
function showKit(on) { $("kit").classList.toggle("away", !on); }
function theme() { return WASH[store.scene] || WASH.lamp; }

state.steam = Array.from({ length: 8 }, (_, i) => ({
  p: Math.random(), x: (Math.random() - 0.5) * 28,
  s: 0.002 + Math.random() * 0.0014, wiggle: i
}));

function nse(i) { return Math.sin(i * 12.9898) * 43758.5453 % 1; }
function wob(i, amp) { return (nse(i) - 0.5) * amp; }
function ink() {
  ctx.strokeStyle = theme().ink;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
}
function blob(cx, cy, rx, ry, seed, steps) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + wob(seed + i, 0.12);
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function scribbleLine(x1, y1, x2, y2, seed) {
  ctx.beginPath();
  ctx.moveTo(x1 + wob(seed, 2), y1 + wob(seed + 1, 2));
  const mx = (x1 + x2) / 2 + wob(seed + 2, 8);
  const my = (y1 + y2) / 2 + wob(seed + 3, 8);
  ctx.quadraticCurveTo(mx, my, x2 + wob(seed + 4, 2), y2 + wob(seed + 5, 2));
  ctx.stroke();
}
function tree(cx, cy, s, seed) {
  ctx.fillStyle = "#3d4a32";
  ink(); ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.quadraticCurveTo(cx + wob(seed, 6), cy, cx, cy - s);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + i * 0.35;
    blob(cx + Math.cos(a) * s * 0.35 + wob(seed + i, 6), cy - s * 0.45 + Math.sin(a) * s * 0.2, s * 0.28, s * 0.22, seed + i * 3, 8);
    ctx.fill(); ctx.stroke();
  }
}
function pine(cx, cy, s, seed) {
  ink(); ctx.lineWidth = 1.5; ctx.strokeStyle = theme().ink;
  ctx.fillStyle = "#2f3d2c";
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.55 + wob(seed, 4), cy + s * 0.2);
  ctx.lineTo(cx - s * 0.55 + wob(seed + 1, 4), cy + s * 0.2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.4, cy + s * 0.05);
  ctx.lineTo(cx - s * 0.4, cy + s * 0.05);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

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

function sky() {
  const t = theme();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.sky[0]); g.addColorStop(1, t.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function table() {
  ctx.fillStyle = theme().table;
  blob(W / 2, H * 0.98, W * 0.78, H * 0.22, 40, 18);
  ctx.fill();
  ink(); ctx.lineWidth = 1.4; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
}
function drawLamp() {
  sky();
  ink(); ctx.lineWidth = 1.3; ctx.globalAlpha = 0.25;
  scribbleLine(W * 0.18, H * 0.1, W * 0.18, H * 0.28, 11);
  scribbleLine(W * 0.18, H * 0.1, W * 0.38, H * 0.1, 12);
  scribbleLine(W * 0.38, H * 0.1, W * 0.38, H * 0.28, 13);
  ctx.globalAlpha = 1;
  table();
}
function drawJapan() {
  sky();
  ctx.fillStyle = "#f3ead2";
  blob(W * 0.74, H * 0.16, 30, 30, 7, 14); ctx.fill();
  ink(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#2c3a30";
  ctx.beginPath();
  ctx.moveTo(-10, H * 0.44);
  ctx.quadraticCurveTo(W * 0.28, H * 0.3 + wob(3, 8), W * 0.7, H * 0.42);
  ctx.lineTo(W + 10, H * 0.48); ctx.lineTo(W + 10, H * 0.56); ctx.lineTo(-10, H * 0.56);
  ctx.fill(); ink(); ctx.lineWidth = 1.4; ctx.stroke();
  pine(W * 0.16, H * 0.34, 54, 21);
  table();
}
function drawCountry() {
  sky();
  ctx.fillStyle = "#f6d9a0";
  blob(W * 0.78, H * 0.18, 22, 22, 9, 12); ctx.fill();
  ink(); ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = "#6a8a48";
  ctx.beginPath();
  ctx.moveTo(-12, H * 0.5);
  ctx.quadraticCurveTo(W * 0.4, H * 0.36, W + 12, H * 0.5);
  ctx.lineTo(W + 12, H * 0.58); ctx.lineTo(-12, H * 0.58); ctx.fill();
  ink(); ctx.stroke();
  ctx.fillStyle = "#8a5a34";
  ctx.beginPath();
  ctx.moveTo(W * 0.12, H * 0.44); ctx.lineTo(W * 0.22, H * 0.34); ctx.lineTo(W * 0.34, H * 0.44);
  ctx.lineTo(W * 0.34, H * 0.52); ctx.lineTo(W * 0.12, H * 0.52); ctx.closePath(); ctx.fill(); ctx.stroke();
  table();
}
function drawShore() {
  sky();
  ctx.fillStyle = "#f3c98a";
  blob(W * 0.8, H * 0.2, 18, 18, 4, 12); ctx.fill();
  ink(); ctx.lineWidth = 1.3; ctx.stroke();
  ctx.fillStyle = "#5a8fa0";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.4);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, H * 0.4 + Math.sin(x * 0.08 + tick * 0.012) * 5 + wob(x, 2));
  ctx.lineTo(W, H * 0.54); ctx.lineTo(0, H * 0.54); ctx.fill();
  ink(); ctx.lineWidth = 1.2;
  scribbleLine(0, H * 0.42, W, H * 0.44, 30);
  table();
}
function drawGarden() {
  sky();
  tree(W * 0.16, H * 0.46, 52, 5);
  tree(W * 0.86, H * 0.44, 62, 17);
  ink(); ctx.lineWidth = 1; ctx.globalAlpha = 0.35;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 73) % W);
    const y = H * 0.18 + ((i * 41) % 90);
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  table();
}
function drawRoom() {
  tick += 1;
  const s = store.scene;
  if (s === "japan") drawJapan();
  else if (s === "country") drawCountry();
  else if (s === "shore") drawShore();
  else if (s === "garden") drawGarden();
  else drawLamp();
}
function drawSteam(x, y) {
  ink(); ctx.lineWidth = 1.4; ctx.globalAlpha = 0.45;
  state.steam.forEach((s) => {
    s.p += s.s; if (s.p > 1) s.p = 0;
    const yy = y - s.p * 80;
    const xx = x + s.x + Math.sin(s.p * 6 + s.wiggle) * 10;
    ctx.beginPath();
    ctx.moveTo(xx, yy + 18);
    ctx.quadraticCurveTo(xx + 7, yy + 9, xx - 2, yy);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}
function drawMug() {
  const m = mug();
  const rw = m.r, rh = m.r * 0.88;
  const t = theme();
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.fillStyle = "rgba(20,12,8,0.22)";
  blob(6, rh * 0.72, rw * 0.85, rh * 0.16, 2, 10); ctx.fill();
  ctx.fillStyle = t.cup;
  ctx.beginPath();
  ctx.moveTo(-rw + wob(1, 3), -rh * 0.06);
  ctx.bezierCurveTo(-rw, -rh * 0.52, -rw * 0.5, -rh * 0.54, wob(2, 3), -rh * 0.54);
  ctx.bezierCurveTo(rw * 0.5, -rh * 0.54, rw, -rh * 0.5, rw + wob(3, 3), -rh * 0.06);
  ctx.lineTo(rw * 0.76 + wob(4, 2), rh * 0.54);
  ctx.quadraticCurveTo(0, rh * 0.74, -rw * 0.76 + wob(5, 2), rh * 0.54);
  ctx.closePath(); ctx.fill();
  ink(); ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath();
  ctx.arc(rw * 0.78, rh * 0.04, rw * 0.24, -0.6, 1.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rw * 0.78, rh * 0.04, rw * 0.16, -0.55, 1.05);
  ctx.stroke();
  ctx.fillStyle = "#2a1810";
  blob(0, -rh * 0.26, rw * 0.7, rh * 0.22, 8, 12); ctx.fill();
  ink(); ctx.lineWidth = 1.5; ctx.stroke();
  if (state.splash > 0) {
    ctx.globalAlpha = state.splash;
    ctx.beginPath(); ctx.arc(wob(tick, 6), -rh * 0.2, 8 + (1 - state.splash) * 10, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; state.splash -= 0.06;
  }
  ctx.restore();
  drawSteam(m.x, m.y - rh * 0.58);
}
function xy(box, p) { return { x: box.x + p.u * box.w, y: box.y + p.v * box.h }; }
function drawInk(box) {
  ctx.save();
  ctx.beginPath(); ctx.rect(box.x - 2, box.y - 2, box.w + 4, box.h + 4); ctx.clip();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  state.strokes.forEach((s) => {
    const t = TOOLS[s.tool] || TOOLS.pencil;
    if (s.pts.length < 2) return;
    ctx.strokeStyle = t.color; ctx.lineWidth = t.width;
    ctx.beginPath();
    const a = xy(box, s.pts[0]); ctx.moveTo(a.x, a.y);
    for (let i = 1; i < s.pts.length; i++) {
      const p = xy(box, s.pts[i]); const j = t.jitter || 0;
      ctx.lineTo(p.x + (j ? Math.sin(i * 2.1) * j : 0), p.y + (j ? Math.cos(i * 1.7) * j : 0));
    }
    ctx.stroke();
    if (s.tool === "crayon") { ctx.globalAlpha = 0.25; ctx.lineWidth = t.width + 3; ctx.stroke(); ctx.globalAlpha = 1; }
  });
  ctx.restore();
}
function drawPaper() {
  const b = paperBox();
  ctx.fillStyle = "#f4ead6";
  ctx.beginPath();
  ctx.moveTo(b.x + wob(1, 4), b.y + wob(2, 3));
  ctx.lineTo(b.x + b.w + wob(3, 4), b.y + wob(4, 3));
  ctx.lineTo(b.x + b.w + wob(5, 5), b.y + b.h + wob(6, 3));
  ctx.lineTo(b.x + wob(7, 5), b.y + b.h + wob(8, 3));
  ctx.closePath(); ctx.fill();
  ink(); ctx.lineWidth = 1.7; ctx.stroke();
  ink(); ctx.lineWidth = 1; ctx.globalAlpha = 0.18;
  for (let i = 1; i < 5; i++) scribbleLine(b.x + 16, b.y + 18 + i * 20, b.x + b.w - 18, b.y + 20 + i * 20, 50 + i);
  ctx.globalAlpha = 1;
  drawInk(b);
}
function drawBall(b) {
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = "#efe4d0";
  blob(0, 0, R, R, 19, 10); ctx.fill();
  ink(); ctx.lineWidth = 1.8; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -4); ctx.quadraticCurveTo(0, 2, 8, -5); ctx.stroke();
  ctx.restore();
}
function drawBand() {
  if (!state.dragging || !state.ball || !state.nest) return;
  const n = state.nest, b = state.ball, c = cup();
  ink(); ctx.lineWidth = 1.6; ctx.globalAlpha = 0.55;
  scribbleLine(n.x - 16, n.y, b.x, b.y, 61);
  scribbleLine(b.x, b.y, n.x + 16, n.y, 62);
  ctx.globalAlpha = 0.35;
  scribbleLine(b.x, b.y, c.x, c.y, 63);
  ctx.globalAlpha = 1;
}

function onPaper(p) {
  const b = paperBox();
  return p.x >= b.x - 8 && p.x <= b.x + b.w + 8 && p.y >= b.y - 8 && p.y <= b.y + b.h + 8;
}
function toUV(p) {
  const b = paperBox();
  return { u: (p.x - b.x) / b.w, v: (p.y - b.y) / b.h };
}
function hitBall(p) { return state.ball && Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < R + 28; }
function pt(e) {
  const r = canvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return { x: s.clientX - r.left, y: s.clientY - r.top };
}

function wrapNow() {
  if (state.phase !== "write") return;
  const n = nest();
  state.nest = n; state.ball = { x: n.x, y: n.y, t: 0 };
  state.phase = "hold"; showWrap(false); showKit(false);
}
function fire() {
  const b = state.ball, n = state.nest;
  if (!b || !n) return;
  const pull = Math.hypot(n.x - b.x, n.y - b.y);
  if (pull < 16) { b.x = n.x; b.y = n.y; state.phase = "hold"; return; }
  const c = cup();
  b.from = { x: b.x, y: b.y }; b.to = { x: c.x, y: c.y };
  b.mid = { x: (b.x + c.x) / 2, y: Math.min(b.y, c.y) - 50 - pull * 0.18 };
  b.t = 0; state.phase = "flight"; state.dragging = false;
}
function land() {
  state.phase = "rest"; state.splash = 1; state.ball = null;
  if (store.sound) tone(620, 0.08, "sine", 0.03);
  setTimeout(() => { state.phase = "write"; state.strokes = []; showWrap(false); showKit(true); }, 450);
}
function stepFlight() {
  const b = state.ball; if (!b) return;
  b.t = Math.min(1, b.t + 0.028);
  const u = b.t * b.t * (3 - 2 * b.t);
  const a = b.from, m = b.mid, c = b.to, o = 1 - u;
  b.x = o * o * a.x + 2 * o * u * m.x + u * u * c.x;
  b.y = o * o * a.y + 2 * o * u * m.y + u * u * c.y;
  if (b.t >= 1) land();
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pt(e);
  canvas.setPointerCapture(e.pointerId);
  if (state.phase === "write" && onPaper(p)) {
    const now = performance.now();
    if (now - state.lastTap < 300 && hasInk()) { wrapNow(); return; }
    state.lastTap = now; state.drawing = true;
    state.strokes.push({ tool: store.tool, pts: [toUV(p)] });
    return;
  }
  if ((state.phase === "hold" || state.phase === "flight") && hitBall(p)) {
    state.phase = "hold"; state.dragging = true;
  }
});
canvas.addEventListener("pointermove", (e) => {
  const p = pt(e);
  if (state.drawing && state.phase === "write") {
    state.strokes[state.strokes.length - 1].pts.push(toUV(p));
    if (hasInk()) showWrap(true);
    return;
  }
  if (state.dragging && state.ball && state.nest) {
    const n = state.nest;
    let x = p.x, y = Math.max(n.y - 20, Math.min(H - 30, p.y));
    const dx = x - n.x, dy = y - n.y, d = Math.hypot(dx, dy), max = 130;
    if (d > max) { x = n.x + dx / d * max; y = n.y + dy / d * max; }
    state.ball.x = x; state.ball.y = y;
  }
});
function up() {
  state.drawing = false;
  if (state.phase === "write" && hasInk()) showWrap(true);
  if (state.dragging) fire();
  state.dragging = false;
}
canvas.addEventListener("pointerup", up);
canvas.addEventListener("pointercancel", up);

function paintTools() {
  document.querySelectorAll(".tool").forEach((el) => el.classList.toggle("on", el.dataset.tool === store.tool));
}
function paintScenes() {
  document.querySelectorAll("#scenes button").forEach((el) => el.classList.toggle("on", el.dataset.scene === store.scene));
}
paintTools(); paintScenes();
document.querySelectorAll(".tool").forEach((el) => {
  el.addEventListener("click", () => { store.tool = el.dataset.tool; save(); paintTools(); });
});
document.querySelectorAll("#scenes button").forEach((el) => {
  el.addEventListener("click", () => { store.scene = el.dataset.scene; save(); paintScenes(); });
});
$("wrap").addEventListener("click", wrapNow);
$("mark").addEventListener("click", () => {
  $("soundOff").classList.toggle("on", !store.sound);
  $("soundOn").classList.toggle("on", store.sound);
  $("settings").classList.toggle("open");
});
$("soundOff").addEventListener("click", () => { store.sound = false; save(); $("soundOff").classList.add("on"); $("soundOn").classList.remove("on"); });
$("soundOn").addEventListener("click", () => { store.sound = true; save(); $("soundOn").classList.add("on"); $("soundOff").classList.remove("on"); });
$("saveSet").addEventListener("click", () => $("settings").classList.remove("open"));

function loop() {
  drawRoom(); drawMug();
  if (state.phase === "write") drawPaper();
  if (state.ball) {
    if (state.phase === "flight") stepFlight();
    if (state.ball) { drawBand(); drawBall(state.ball); }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
