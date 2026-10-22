// Writes play/index.html: a playable black-and-white dino runner, served by GitHub Pages.
// It draws with the same bitmaps as the profile images, passed in from build.mjs.

export function playPage({ font, dino, legsA, legsB, cactus, cloud, heart, profileUrl }) {
  const data = JSON.stringify({ font, dino, legsA, legsB, cactus, cloud, heart });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dino Run</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 8' shape-rendering='crispEdges'><rect width='9' height='8'/><path fill='%23fff' d='${heart.map((row, r) => [...row].map((ch, c) => (ch === 'X' ? `M${c} ${r}h1v1h-1z` : '')).join('')).join('')}'/></svg>`).replace(/%2523/g, '%23')}">
<meta name="description" content="A black and white dino runner on John Thrisokaran's GitHub profile.">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #000; color: #fff; }
  body { display: grid; place-items: center; padding: 16px; font: 14px ui-monospace, Menlo, Consolas, monospace; }
  main { width: min(100%, 920px); }
  .frame { border: 6px solid #fff; padding: 12px; touch-action: manipulation; cursor: pointer; }
  canvas { display: block; width: 100%; height: auto; image-rendering: pixelated; image-rendering: crisp-edges; outline: none; }
  p { margin: 14px 0 0; text-align: center; letter-spacing: .04em; }
  a { color: #fff; }
  kbd { border: 2px solid #fff; padding: 0 6px; }
</style>
</head>
<body>
<main>
  <div class="frame"><canvas id="c" width="880" height="260" tabindex="0" aria-label="Dino runner game. Press space, the up arrow, click or tap to jump."></canvas></div>
  <p><kbd>SPACE</kbd> / <kbd>UP</kbd> / click / tap to jump. Hold for a higher jump. <a href="${profileUrl}">Back to the profile</a></p>
</main>
<script>
(() => {
  const D = ${data};
  const cv = document.getElementById('c');
  const g = cv.getContext('2d');
  const W = 880, H = 260, GROUND = 214, S = 4;

  // crisp pixels on high-DPI screens
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cv.width = W * dpr; cv.height = H * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;

  const bitmap = (rows, x, y, s) => {
    rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === 'X' || row[c] === '1') g.fillRect(Math.round(x + c * s), Math.round(y + r * s), s, s); });
  };
  const text = (str, x, y, s) => [...str.toUpperCase()].forEach((ch, i) => { const gl = D.font[ch]; if (gl) bitmap(gl, x + i * 6 * s, y, s); });
  const textW = (str, s) => str.length * 6 * s - s;
  const size = (rows, s) => ({ w: Math.max(...rows.map((r) => r.length)) * s, h: rows.length * s });

  const BIRD = [
    ['....X.........', '...XX.........', '..XXX.........', 'XXXXXXXXXXXX..', '..XXXXXXXXXXXX', '.....XXXXX....'],
    ['..............', '..............', '..............', 'XXXXXXXXXXXX..', '..XXXXXXXXXXXX', '.....XXXXX....', '.....XXX......', '.....XX.......', '.....X........'],
  ];
  const BIG = D.cactus.map((r) => r + '');
  const dinoH = (D.dino.length + D.legsA.length) * S, dinoW = size(D.dino, S).w;

  let hi = 0;
  try { hi = Number(localStorage.getItem('dino-hi')) || 0; } catch {}

  let state, dino, obstacles, clouds, pebbles, speed, score, t, nextGap, overAt, holding = false;
  function reset() {
    state = 'ready';
    dino = { y: 0, vy: 0 };
    obstacles = []; speed = 380; score = 0; t = 0; nextGap = 520;
    clouds = [{ x: 260, y: 40 }, { x: 640, y: 76 }];
    pebbles = Array.from({ length: 40 }, (_, i) => ({ x: i * 26 + Math.random() * 20, y: GROUND + 6 + Math.floor(Math.random() * 3) * 5, w: 2 + Math.floor(Math.random() * 3) * 3 }));
  }
  reset();

  const onGround = () => dino.y <= 0;
  function press() {
    if (state === 'over') { if (performance.now() - overAt > 400) { reset(); state = 'run'; } return; }
    if (state === 'ready') state = 'run';
    if (onGround()) dino.vy = 860;
    holding = true;
  }
  const release = () => { holding = false; };
  addEventListener('keydown', (e) => { if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); if (!e.repeat) press(); } });
  addEventListener('keyup', (e) => { if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) release(); });
  cv.parentElement.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.focus(); press(); });
  addEventListener('pointerup', release);

  function spawn() {
    const r = Math.random();
    if (score > 250 && r < 0.25) {
      const high = Math.random() < 0.5;
      const sz = size(BIRD[0], 3);
      obstacles.push({ kind: 'bird', x: W + 20, y: high ? GROUND - dinoH - 46 : GROUND - sz.h - 18, w: sz.w, h: sz.h });
    } else {
      const n = r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
      const s = r < 0.4 ? 3 : 4;
      const sz = size(BIG, s);
      obstacles.push({ kind: 'cactus', n, s, x: W + 20, y: GROUND - sz.h, w: sz.w * n + (n - 1) * 4, h: sz.h });
    }
    nextGap = speed * (0.75 + Math.random() * 0.9) + 120;
  }

  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function update(dt) {
    t += dt;
    if (state !== 'run') return;
    speed = Math.min(980, speed + 7 * dt);
    score += speed * dt * 0.025;
    // jump: holding the key keeps gravity low for a higher arc
    const gravity = holding && dino.vy > 0 ? 2300 : 4200;
    dino.vy -= gravity * dt;
    dino.y = Math.max(0, dino.y + dino.vy * dt);
    if (dino.y === 0 && dino.vy < 0) dino.vy = 0;

    const dx = speed * dt;
    for (const o of obstacles) o.x -= dx;
    obstacles = obstacles.filter((o) => o.x + o.w > -20);
    const last = obstacles[obstacles.length - 1];
    if (!last || W - (last.x + last.w) > nextGap) spawn();
    for (const c of clouds) { c.x -= dx * 0.2; if (c.x < -80) { c.x = W + Math.random() * 200; c.y = 30 + Math.random() * 60; } }
    for (const p of pebbles) { p.x -= dx; if (p.x < -10) p.x += 40 * 26; }

    // a forgiving hitbox: the body, not the tail or the snout tip
    const box = { x: 60 + 14, y: GROUND - dinoH - dino.y + 8, w: dinoW - 30, h: dinoH - 14 };
    for (const o of obstacles) {
      const ob = { x: o.x + 6, y: o.y + 6, w: o.w - 12, h: o.h - 6 };
      if (hit(box, ob)) {
        state = 'over'; overAt = performance.now();
        if (score > hi) { hi = Math.floor(score); try { localStorage.setItem('dino-hi', String(hi)); } catch {} }
      }
    }
  }

  const pad = (n) => String(Math.floor(n)).padStart(5, '0');
  function draw() {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (const c of clouds) bitmap(D.cloud, c.x, c.y, 3);
    g.fillRect(0, GROUND, W, 2);
    for (const p of pebbles) g.fillRect(p.x, p.y, p.w, 2);
    for (const o of obstacles) {
      if (o.kind === 'bird') bitmap(BIRD[Math.floor(t * 6) % 2], o.x, o.y, 3);
      else for (let i = 0; i < o.n; i++) bitmap(BIG, o.x + i * (size(BIG, o.s).w + 4), o.y, o.s);
    }
    const dy = GROUND - dinoH - dino.y;
    bitmap(D.dino, 60, dy, S);
    const legs = state !== 'run' || !onGround() ? D.legsA : Math.floor(t * 10) % 2 ? D.legsA : D.legsB;
    bitmap(legs, 60, dy + D.dino.length * S, S);

    const sc = \`HI \${pad(hi)}  \${pad(score)}\`;
    text(sc, W - textW(sc, 3) - 16, 16, 3);

    if (state === 'ready') {
      const a = 'PRESS SPACE OR TAP TO START';
      if (Math.floor(t * 2) % 2 === 0) text(a, (W - textW(a, 3)) / 2, 90, 3);
    }
    if (state === 'over') {
      const a = 'GAME OVER', b = '* STAY DETERMINED. PRESS SPACE.';
      g.fillStyle = '#000'; g.fillRect((W - textW(b, 2)) / 2 - 16, 54, textW(b, 2) + 32, 132); g.fillStyle = '#fff';
      text(a, (W - textW(a, 5)) / 2, 66, 5);
      bitmap(D.heart, (W - 9 * 4) / 2, 120, 4);
      text(b, (W - textW(b, 2)) / 2, 168, 2);
    }
  }

  let prev = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  cv.focus();
})();
</script>
</body>
</html>
`;
}
