/* Confetti + synthesized sounds (no external assets) */

/* ---------- Audio ---------- */
let _actx = null;
function audioCtx() {
  if (!_actx) {
    try { _actx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
  }
  if (_actx.state === "suspended") _actx.resume();
  return _actx;
}

function tone(freq, start, dur, type, gain) {
  const ctx = audioCtx(); if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || "sine";
  o.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain == null ? 0.18 : gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/* Summoning alarm — bright, repeatable (looped by the board until kids check in) */
function playAlarm() {
  [988, 1319, 988, 1319].forEach((f, i) => tone(f, i * 0.16, 0.2, "triangle", 0.2));
  tone(659, 0.66, 0.3, "sine", 0.12);
}

/* Gentle but unmistakable wake-up chime (plays when timer hits 0) */
function playChime() {
  const seq = [880, 1175, 1568, 1175, 880, 1568];
  seq.forEach((f, i) => tone(f, i * 0.18, 0.5, "sine", 0.2));
  // soft bell shimmer
  [1568, 2093].forEach((f, i) => tone(f, 1.1 + i * 0.12, 0.9, "triangle", 0.08));
}

/* Happy win jingle */
function playWin() {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => tone(f, i * 0.1, 0.4, "triangle", 0.22));
  tone(1047, 0.5, 0.6, "sine", 0.18);
  tone(1568, 0.5, 0.7, "sine", 0.12);
}

/* Soft tick when a task is checked */
function playPop() {
  tone(660, 0, 0.12, "sine", 0.16);
  tone(990, 0.03, 0.12, "sine", 0.1);
}

/* ---------- Confetti ---------- */
function fireConfetti(opts) {
  opts = opts || {};
  const colors = opts.colors || ["#ff6b6b", "#ffd93d", "#6bcB77", "#4d96ff", "#ff9ff3", "#ffa94d"];
  const originX = opts.x != null ? opts.x : window.innerWidth / 2;
  const originY = opts.y != null ? opts.y : window.innerHeight / 2;
  const count = opts.count || 140;

  let canvas = document.getElementById("__confetti");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "__confetti";
    canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9000;";
    document.body.appendChild(canvas);
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const parts = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random();
    const speed = 6 + Math.random() * 12;
    parts.push({
      x: originX, y: originY,
      vx: Math.cos(angle) * speed * (0.6 + Math.random()),
      vy: Math.sin(angle) * speed * (0.6 + Math.random()) - 6,
      size: 6 + Math.random() * 8,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      shape: Math.random() > 0.5 ? "rect" : "circ",
      life: 1,
    });
  }

  let raf;
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.35;            // gravity
      p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.008;
      if (p.life > 0 && p.y < window.innerHeight + 40) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
    if (alive) raf = requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); cancelAnimationFrame(raf); }
  }
  frame();
}

Object.assign(window, { audioCtx, playChime, playAlarm, playWin, playPop, fireConfetti });
