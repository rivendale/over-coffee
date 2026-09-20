const KEY = "over-coffee-v1";
const $ = (id) => document.getElementById(id);
const state = {
  mode: "later", phase: "compose", laterCount: 0,
  thought: "", sip: "", ball: null, dragging: false,
  drag: { x: 0, y: 0, px: 0, py: 0 }, steam: []
};
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      wakeHour: raw.wakeHour ?? 6,
      wakeMinute: raw.wakeMinute ?? 30,
      haptics: raw.haptics !== false,
      thoughts: Array.isArray(raw.thoughts) ? raw.thoughts : []
    };
  } catch {
    return { wakeHour: 6, wakeMinute: 30, haptics: true, thoughts: [] };
  }
}
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
let store = load();
function isMorningNow(date = new Date()) {
  const mins = date.getHours() * 60 + date.getMinutes();
  const wake = store.wakeHour * 60 + store.wakeMinute;
  return mins >= wake && mins < wake + 14 * 60;
}
function nextOpen(from = new Date()) {
  const d = new Date(from);
  d.setHours(store.wakeHour, store.wakeMinute, 0, 0);
  if (d <= from) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
function buzz(ms = 12) {
  if (store.haptics && navigator.vibrate) navigator.vibrate(ms);
}
const canvas = $("scene");
const ctx = canvas.getContext("2d");
const ghost = $("ghost");
let W = 0, H = 0, dpr = 1, splash = 0;
const scene = { mug: { x: 0.5, y: 0.34 }, home: { x: 0.5, y: 0.72 } };
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
const mugCenter = () => ({ x: W * scene.mug.x, y: H * scene.mug.y });
const homePos = () => ({ x: W * scene.home.x, y: H * scene.home.y });
state.steam = Array.from({ length: 14 }, (_, i) => ({
  p: Math.random(), x: (Math.random() - 0.5) * 28,
  s: 0.0018 + Math.random() * 0.0016, delay: i * 0.05
}));
function drawWood() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#2a1811"); g.addColorStop(0.42, "#1c110c"); g.addColorStop(1, "#120b08");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lamp = ctx.createRadialGradient(W * 0.5, H * 0.22, 10, W * 0.5, H * 0.28, H * 0.55);
  lamp.addColorStop(0, "rgba(232,161,90,0.20)");
  lamp.addColorStop(0.45, "rgba(232,161,90,0.05)");
  lamp.addColorStop(1, "rgba(232,161,90,0)");
  ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#3a2418";
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.86, W * 0.62, H * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(W / 2, H * 0.88, W * 0.5, H * 0.08, 0, 0, Math.PI * 2); ctx.fill();
}
function roundCup(cx, cy, rw, rh) {
  ctx.beginPath();
  ctx.moveTo(cx - rw, cy - rh * 0.15);
  ctx.bezierCurveTo(cx - rw, cy - rh * 0.55, cx - rw * 0.7, cy - rh * 0.55, cx, cy - rh * 0.55);
  ctx.bezierCurveTo(cx + rw * 0.7, cy - rh * 0.55, cx + rw, cy - rh * 0.55, cx + rw, cy - rh * 0.15);
  ctx.lineTo(cx + rw * 0.78, cy + rh * 0.55);
  ctx.quadraticCurveTo(cx, cy + rh * 0.78, cx - rw * 0.78, cy + rh * 0.55);
  ctx.closePath();
}
function drawSteam(x, y) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  state.steam.forEach((s) => {
    s.p += s.s; if (s.p > 1) s.p = 0;
    const yy = y - s.p * 90;
    const xx = x + s.x + Math.sin(s.p * 8 + s.delay) * 10;
    ctx.strokeStyle = `rgba(232,161,90,${(1 - s.p) * 0.22})`;
    ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(xx, yy + 16); ctx.quadraticCurveTo(xx + 8, yy + 8, xx, yy); ctx.stroke();
  });
  ctx.restore();
}
function drawMug() {
  const { x, y } = mugCenter();
  const rw = Math.min(W * 0.22, 96), rh = rw * 0.86;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(6, rh * 0.72, rw * 0.9, rh * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#efe6d6"; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.arc(rw * 0.82, 8, 22, -0.7, 0.9); ctx.stroke();
  ctx.strokeStyle = "#d7c7b0"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(rw * 0.82, 8, 22, -0.7, 0.9); ctx.stroke();
  const body = ctx.createLinearGradient(-rw, -rh, rw, rh);
  body.addColorStop(0, "#f7efe3"); body.addColorStop(0.5, "#eadcc8"); body.addColorStop(1, "#cbb79a");
  ctx.fillStyle = body; roundCup(0, 10, rw, rh); ctx.fill();
  ctx.fillStyle = "#2a1810";
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.28, rw * 0.78, rh * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  const coffee = ctx.createRadialGradient(-10, -rh * 0.34, 4, 0, -rh * 0.26, rw * 0.7);
  coffee.addColorStop(0, "#5a3824"); coffee.addColorStop(0.55, "#2c1810"); coffee.addColorStop(1, "#1a0e0a");
  ctx.fillStyle = coffee;
  ctx.beginPath(); ctx.ellipse(0, -rh * 0.26, rw * 0.7, rh * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(196,160,122,0.28)";
  ctx.beginPath(); ctx.ellipse(-rw * 0.18, -rh * 0.32, rw * 0.28, rh * 0.08, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawSteam(x, y - rh * 0.55);
}
function drawPaperBall(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(3, 16, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 22);
  g.addColorStop(0, "#f7f1e6"); g.addColorStop(0.6, "#e6d8c2"); g.addColorStop(1, "#c4b394");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(90,70,50,0.35)"; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(-8, -6); ctx.quadraticCurveTo(2, -2, 10, -8);
  ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 8, 9, 2);
  ctx.moveTo(-2, -12); ctx.quadraticCurveTo(-4, 0, 3, 12);
  ctx.stroke(); ctx.restore();
}
function drawSplash() {
  if (splash <= 0) return;
  const { x, y } = mugCenter();
  ctx.save(); ctx.translate(x, y - 18);
  ctx.fillStyle = `rgba(90,56,36,${splash * 0.45})`;
  ctx.beginPath(); ctx.ellipse(0, 0, 28 + (1 - splash) * 20, 10 + (1 - splash) * 6, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.restore(); splash -= 0.02;
}
function resetBall() {
  const h = homePos();
  state.ball = { x: h.x, y: h.y, vx: 0, vy: 0 };
}
function startHold() {
  state.phase = "hold";
  $("compose").classList.remove("open");
  $("hint").classList.add("show");
  $("hint").textContent = "Flick the scrap toward the mug";
  resetBall();
}
function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return { x: src.clientX - rect.left, y: src.clientY - rect.top };
}
function nearBall(p) {
  if (!state.ball) return false;
  const dx = p.x - state.ball.x, dy = p.y - state.ball.y;
  return dx * dx + dy * dy < 70 * 70;
}
canvas.addEventListener("pointerdown", (e) => {
  if (state.phase !== "hold" && state.phase !== "throw") return;
  const p = pointFromEvent(e);
  if (!nearBall(p) && state.phase === "hold" && p.y < H * 0.55) return;
  canvas.setPointerCapture(e.pointerId);
  state.dragging = true; state.phase = "throw";
  state.drag = { x: p.x, y: p.y, px: p.x, py: p.y };
  state.ball.x = p.x; state.ball.y = p.y;
  ghost.style.display = "block"; ghost.style.left = p.x + "px"; ghost.style.top = p.y + "px";
});
canvas.addEventListener("pointermove", (e) => {
  if (!state.dragging) return;
  const p = pointFromEvent(e);
  state.drag.px = state.drag.x; state.drag.py = state.drag.y;
  state.drag.x = p.x; state.drag.y = p.y;
  state.ball.x = p.x; state.ball.y = p.y;
  ghost.style.left = p.x + "px"; ghost.style.top = p.y + "px";
});
function release() {
  if (!state.dragging) return;
  state.dragging = false; ghost.style.display = "none";
  let vx = (state.drag.x - state.drag.px) * 1.8;
  let vy = (state.drag.y - state.drag.py) * 1.8;
  state.ball.vx = Math.max(-18, Math.min(18, vx));
  state.ball.vy = Math.max(-24, Math.min(8, vy - 6));
  if (Math.hypot(state.ball.vx, state.ball.vy) < 6) {
    state.ball.vy = -11;
    state.ball.vx = (mugCenter().x - state.ball.x) * 0.03;
  }
  state.phase = "flight";
  $("hint").classList.remove("show");
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);
function stepFlight() {
  const b = state.ball; if (!b) return;
  b.vy += 0.42; b.x += b.vx; b.y += b.vy; b.vx *= 0.995;
  const m = mugCenter();
  const dx = m.x - b.x, dy = (m.y - 12) - b.y, dist = Math.hypot(dx, dy);
  if (dist < 90 && b.vy > -2) { b.vx += dx * 0.012; b.vy += dy * 0.012; }
  if (dist < 36) { land(); return; }
  if (b.y > H * 0.9 || b.x < -40 || b.x > W + 40) {
    b.x = Math.max(30, Math.min(W - 30, b.x));
    b.vx = (m.x - b.x) * 0.05; b.vy = -10;
  }
  b._life = (b._life || 0) + 1;
  if (b._life > 180) land();
}
function land() {
  state.phase = "landed"; splash = 1; buzz(18);
  store.thoughts.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text: state.thought.trim(), nextSip: state.sip.trim(),
    createdAt: new Date().toISOString(), opensAt: nextOpen(), status: "parked"
  });
  save(store);
  state.laterCount += 1;
  $("again").style.display = state.laterCount >= 2 ? "none" : "block";
  $("landed").classList.add("open");
  const m = mugCenter(); state.ball = { x: m.x, y: m.y - 8, vx: 0, vy: 0 };
}
function loop() {
  drawWood(); drawMug(); drawSplash();
  if (state.ball && !state.dragging && state.phase !== "landed") {
    if (state.phase === "flight") stepFlight();
    if (state.phase === "hold" || state.phase === "throw" || state.phase === "flight") {
      drawPaperBall(state.ball.x, state.ball.y);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
function resetCompose(keepCount = true) {
  state.phase = "compose"; state.thought = ""; state.sip = "";
  $("thought").value = ""; $("sip").value = "";
  $("compose").classList.add("open");
  $("landed").classList.remove("open");
  $("hint").classList.remove("show");
  if (!keepCount) state.laterCount = 0;
}
$("crumple").addEventListener("click", () => {
  const text = $("thought").value.trim();
  if (!text) { $("thought").focus(); return; }
  state.thought = text; state.sip = $("sip").value.trim();
  buzz(8); startHold();
});
$("done").addEventListener("click", () => { $("landed").classList.remove("open"); resetCompose(false); });
$("again").addEventListener("click", () => { $("landed").classList.remove("open"); resetCompose(true); });
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c]));
}
function renderCards() {
  const now = Date.now();
  const ready = store.thoughts.filter((t) => t.status === "parked" && new Date(t.opensAt).getTime() <= now);
  const el = $("cards");
  if (!ready.length) { el.innerHTML = ""; $("listTitle").textContent = "Nothing in the mug"; return; }
  $("listTitle").textContent = "In the mug";
  el.innerHTML = ready.map((t) => `<article class="card" data-id="${t.id}"><p>${escapeHtml(t.text)}</p>${t.nextSip ? `<small>Next sip: ${escapeHtml(t.nextSip)}</small>` : ""}<div class="tiny"><button data-act="handle">Handled</button><button class="keep" data-act="keep">Keep for tomorrow</button></div></article>`).join("");
}
$("cards").addEventListener("click", (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  const id = btn.closest(".card").dataset.id;
  const t = store.thoughts.find((x) => x.id === id); if (!t) return;
  if (btn.dataset.act === "handle") t.status = "handled";
  if (btn.dataset.act === "keep") t.opensAt = nextOpen();
  save(store); renderCards();
});
function openMorning() {
  $("compose").classList.remove("open"); $("landed").classList.remove("open");
  if (!isMorningNow()) { $("locked").classList.add("open"); $("list").classList.remove("open"); return; }
  $("locked").classList.remove("open"); renderCards(); $("list").classList.add("open");
}
function openLater() {
  $("locked").classList.remove("open"); $("list").classList.remove("open"); $("settings").classList.remove("open");
  $("btnLater").classList.add("on"); $("btnMorning").classList.remove("on");
  state.mode = "later"; resetCompose(false);
}
$("btnLater").addEventListener("click", openLater);
$("btnMorning").addEventListener("click", () => {
  $("btnMorning").classList.add("on"); $("btnLater").classList.remove("on");
  state.mode = "morning"; openMorning();
});
$("backLater").addEventListener("click", openLater);
$("closeList").addEventListener("click", openLater);
$("gear").addEventListener("click", () => {
  $("settings").classList.add("open");
  $("wake").value = `${String(store.wakeHour).padStart(2, "0")}:${String(store.wakeMinute).padStart(2, "0")}`;
  $("haptics").checked = store.haptics;
});
$("saveSet").addEventListener("click", () => {
  const [hh, mm] = ($("wake").value || "06:30").split(":").map(Number);
  store.wakeHour = hh; store.wakeMinute = mm; store.haptics = $("haptics").checked;
  save(store); $("settings").classList.remove("open");
});
$("clearAll").addEventListener("click", () => { store.thoughts = []; save(store); $("settings").classList.remove("open"); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
