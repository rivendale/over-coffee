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
const GLAZE = {
  lamp: ["#f8f0e4", "#b89a76"],
  japan: ["#efe8dc", "#c4b39a"],
  country: ["#f3e2c4", "#b07a48"],
  shore: ["#f6f1ea", "#c9b7a2"],
  garden: ["#f0e6d8", "#a8896e"]
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("over-coffee-v7") || "{}");
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

state.steam = Array.from({ length: 14 }, (_, i) => ({
  p: Math.random(), x: (Math.random() - 0.5) * 36,
  s: 0.0018 + Math.random() * 0.0016, wiggle: i
}));
const motes = Array.from({ length: 18 }, () => ({
  x: Math.random(), y: Math.random(), s: 0.0004 + Math.random() * 0.0007, a: Math.random()
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

function sky(stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function table(color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.97, W * 0.82, H * 0.24, 0, 0, Math.PI * 2); ctx.fill();
}
function drawLamp() {
  sky([[0, "#3a2418"], [0.4, "#1c110c"], [1, "#0c0705"]]);
  const lamp = ctx.createRadialGradient(W * 0.5, H * 0.18, 8, W * 0.5, H * 0.3, H * 0.6);
  lamp.addColorStop(0, "rgba(232,161,90,0.38)");
  lamp.addColorStop(1, "rgba(232,161,90,0)");
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
  table("#3a2418");
}
function drawJapan() {
  sky([[0, "#1b2744"], [0.45, "#243352"], [1, "#1a2233"]]);
  ctx.fillStyle = "rgba(247,236,210,0.88)";
  ctx.beginPath(); ctx.arc(W * 0.72, H * 0.16, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2a3a2c";
  ctx.beginPath(); ctx.moveTo(-20, H * 0.42); ctx.quadraticCurveTo(W * 0.3, H * 0.28, W * 0.7, H * 0.4); ctx.lineTo(W + 20, H * 0.46); ctx.lineTo(W + 20, H * 0.55); ctx.lineTo(-20, H * 0.55); ctx.fill();
  ctx.strokeStyle = "rgba(20,28,24,0.7)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.18); ctx.quadraticCurveTo(W * 0.22, H * 0.08, W * 0.18, H * 0.32); ctx.stroke();
  table("#4a3b2c");
}
function drawCountry() {
  sky([[0, "#f0b27a"], [0.28, "#e08a62"], [0.55, "#8b5a3c"], [1, "#3a2418"]]);
  ctx.fillStyle = "rgba(255,236,190,0.7)";
  ctx.beginPath(); ctx.arc(W * 0.78, H * 0.2, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6b8f4e";
  ctx.beginPath(); ctx.moveTo(-10, H * 0.46); ctx.quadraticCurveTo(W * 0.35, H * 0.36, W + 10, H * 0.48); ctx.lineTo(W + 10, H * 0.58); ctx.lineTo(-10, H * 0.58); ctx.fill();
  table("#5a3a24");
}
function drawShore() {
  sky([[0, "#7eb3c9"], [0.22, "#f2c9a0"], [0.4, "#6a9bb0"], [1, "#2d4a55"]]);
  ctx.fillStyle = "rgba(255,214,150,0.85)";
  ctx.beginPath(); ctx.arc(W * 0.78, H * 0.24, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4f8fa0";
  ctx.beginPath();
  ctx.moveTo(0, H * 0.38);
  for (let x = 0; x <= W; x += 18) ctx.quadraticCurveTo(x + 9, H * 0.38 + Math.sin(tick * 0.01 + x * 0.04) * 4, x + 18, H * 0.38);
  ctx.lineTo(W, H * 0.52); ctx.lineTo(0, H * 0.52); ctx.fill();
  table("#c9b089");
}
function drawGarden() {
  sky([[0, "#5b4a6a"], [0.35, "#8a6b7a"], [0.7, "#3d3344"], [1, "#241c22"]]);
  ctx.fillStyle = "#3a4a38";
  ctx.beginPath(); ctx.ellipse(W * 0.18, H * 0.46, 50, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * 0.86, H * 0.44, 60, 34, 0, 0, Math.PI * 2); ctx.fill();
  motes.forEach((m) => {
    m.y -= m.s; if (m.y < 0.12) m.y = 0.55;
    ctx.fillStyle = `rgba(255,220,150,${0.15 + m.a * 0.35})`;
    ctx.beginPath(); ctx.arc(m.x * W, m.y * H, 1.6, 0, Math.PI * 2); ctx.fill();
  });
  table("#3d2c28");
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
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  state.steam.forEach((s) => {
    s.p += s.s; if (s.p > 1) s.p = 0;
    const yy = y - s.p * 90;
    const xx = x + s.x + Math.sin(s.p * 7 + s.wiggle) * 12;
    ctx.strokeStyle = `rgba(243,214,170,${(1 - s.p) * 0.28})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xx, yy + 16); ctx.quadraticCurveTo(xx + 8, yy + 8, xx, yy); ctx.stroke();
  });
  ctx.restore();
}
function drawMug() {
  const m = mug();
  const rw = m.r, rh = m.r * 0.9;
  const glaze = GLAZE[store.scene] || GLAZE.lamp;
  ctx.save(); ctx.translate(m.x, m.y);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(4, rh * 0.78, rw * 0.9, rh * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  const body = ctx.createLinearGradient(-rw, -rh, rw, rh);
  body.addColorStop(0, glaze[0]); body.addColorStop(1, glaze[1]);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-rw, -rh * 0.08);
  ctx.bezierCurveTo(-rw, -rh * 0.56, -rw * 0.62, -rh * 0.56, 0, -rh * 0.56);
  ctx.bezierCurveTo(rw * 0.62, -rh * 0.56, rw, -rh * 0.56, rw, -rh * 0.08);
  ctx.lineTo(rw * 0.78, rh * 0.56);
  ctx.quadraticCurveTo(0, rh * 0.78, -rw * 0.78, rh * 0.56);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = glaze[0]; ctx.lineWidth = 11; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(rw * 0.78, rh * 0.06, rw * 0.26, -0.55, 1.05); ctx.stroke();
  ctx.fillStyle = "#24150f";
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.28, rw * 0.78, rh * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2c1810";
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.24, rw * 0.7, rh * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(212,176,132,0.3)";
  ctx.beginPath(); ctx.ellipse(-rw * 0.16, -rh * 0.3, rw * 0.26, rh * 0.06, -0.4, 0, Math.PI * 2); ctx.fill();
  if (state.splash > 0) {
    ctx.fillStyle = `rgba(90,56,36,${state.splash * 0.55})`;
    ctx.beginPath(); ctx.ellipse(0, -rh * 0.2, 28 + (1 - state.splash) * 18, 9, 0, 0, Math.PI * 2); ctx.fill();
    state.splash -= 0.06;
  }
  ctx.restore();
  drawSteam(m.x, m.y - rh * 0.58);
}
function xy(box, p) { return { x: box.x + p.u * box.w, y: box.y + p.v * box.h }; }
function drawInk(box) {
  ctx.save();
  ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
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
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h + 8, b.w * 0.4, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f3ead8";
  ctx.beginPath();
  ctx.moveTo(b.x + 6, b.y); ctx.lineTo(b.x + b.w, b.y + 4);
  ctx.lineTo(b.x + b.w - 8, b.y + b.h); ctx.lineTo(b.x, b.y + b.h - 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(43,28,20,0.07)";
  for (let i = 1; i < 5; i++) ctx.fillRect(b.x + 16, b.y + 16 + i * 20, b.w - 36, 1);
  drawInk(b);
}
function drawBall(b) {
  ctx.save(); ctx.translate(b.x, b.y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(2, 16, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, R);
  g.addColorStop(0, "#f7f1e6"); g.addColorStop(1, "#b89a74");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawBand() {
  if (!state.dragging || !state.ball || !state.nest) return;
  const n = state.nest, b = state.ball, c = cup();
  ctx.save();
  ctx.strokeStyle = "rgba(232,161,90,0.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(n.x - 16, n.y); ctx.lineTo(b.x, b.y); ctx.lineTo(n.x + 16, n.y); ctx.stroke();
  ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(243,230,208,0.35)";
  ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(n.x, (b.y + c.y) / 2, c.x, c.y); ctx.stroke();
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
function hitBall(p) { return state.ball && Math.hypot(p.x - state.ball.x, p.y - state.ball.y) < R + 28; }
function pt(e) {
  const r = canvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return { x: s.clientX - r.left, y: s.clientY - r.top };
}

function wrapNow() {
  if (state.phase !== "write") return;
  const n = nest();
  state.nest = n;
  state.ball = { x: n.x, y: n.y, t: 0 };
  state.phase = "hold";
  showWrap(false);
  showKit(false);
}
function fire() {
  const b = state.ball, n = state.nest;
  if (!b || !n) return;
  const pull = Math.hypot(n.x - b.x, n.y - b.y);
  if (pull < 16) { b.x = n.x; b.y = n.y; state.phase = "hold"; return; }
  const c = cup();
  b.from = { x: b.x, y: b.y };
  b.to = { x: c.x, y: c.y };
  b.mid = { x: (b.x + c.x) / 2, y: Math.min(b.y, c.y) - 50 - pull * 0.18 };
  b.t = 0; state.phase = "flight"; state.dragging = false;
}
function land() {
  state.phase = "rest"; state.splash = 1; state.ball = null;
  if (store.sound) tone(620, 0.08, "sine", 0.03);
  setTimeout(() => {
    state.phase = "write"; state.strokes = []; showWrap(false); showKit(true);
  }, 450);
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
