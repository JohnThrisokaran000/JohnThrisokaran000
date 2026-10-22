// Generates every SVG in assets/ from the data below, in the portfolio's look:
// black, cyan #00d9ff glow, Segoe UI, the tilted rolling-cube loader.
// Each themed asset comes in a dark and a light variant; README.md picks one with <picture>.
//
//   node scripts/build.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(OUT, { recursive: true });

const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const THEMES = {
  dark: { bg: '#000000', card: '#0b0b0b', line: '#1c1c1c', ink: '#ffffff', soft: '#bbbbbb', mute: '#888888', accent: '#00d9ff', accent2: '#00a8cc', tagBg: 'rgba(0,217,255,0.10)', tagLine: 'rgba(0,217,255,0.35)', glow: 0.55 },
  light: { bg: '#ffffff', card: '#f5fbfd', line: '#d5e8ee', ink: '#08161b', soft: '#3d4f55', mute: '#66787e', accent: '#007ea0', accent2: '#00a8cc', tagBg: 'rgba(0,126,160,0.08)', tagLine: 'rgba(0,126,160,0.30)', glow: 0 },
};

// ------------------------------------------------------------------ content (from the portfolio + public repos)

const PHRASES = ['Full Stack Developer', 'UI/UX Designer', 'Problem Solver', 'Code Enthusiast'];

const SKILLS = [
  { title: 'Frontend', items: 'React · Vue · HTML/CSS · JavaScript · TypeScript' },
  { title: 'Backend', items: 'Node.js · Python · Django · Spring Boot · FastAPI' },
  { title: 'Data', items: 'MongoDB · PostgreSQL · Redis · SQLite · Firebase' },
  { title: 'Mobile', items: 'Flutter · Dart · Kotlin' },
  { title: 'Systems', items: 'Rust · Zig · C++ · CUDA' },
  { title: 'Tools', items: 'Git · Docker · AWS · VS Code' },
];

const JOURNEY = [
  { year: '~2015', name: 'Thakur Intl. School', what: 'ICSE · 1st–4th' },
  { year: '2016–22', name: 'Don Bosco High School', what: 'SSC · 5th–10th' },
  { year: '2023–24', name: 'Narayana Jr. College', what: 'HSC Science' },
  { year: '2025–now', name: 'Fr. CRCE, Bandra', what: 'B.Tech Computer Engg.' },
];

const PROJECTS = [
  { id: 'pptx-to-video', name: 'pptx-to-video', desc: 'Turns a PowerPoint into an animated MP4: 14 styles, camera zoom, up to 4K. Ships with Quoro AI, a fully local deck assistant.', tags: ['JavaScript', 'Node.js', 'ffmpeg', 'SQLite'] },
  { id: 'hk', name: 'hk', desc: 'A from-scratch local LLM runtime in Zig: zero-copy mmap loading, CPU / CUDA / Vulkan engines, OpenAI-compatible server.', tags: ['Zig', 'CUDA', 'Vulkan'] },
  { id: 'patchwork', name: 'PatchWork', desc: 'Hotfix live websites without rebuilding them: a patch DSL, re-anchoring, real-browser checks and automatic rollback.', tags: ['Rust', 'Python', 'GDG CRCE'] },
  { id: 'sentinel', name: 'Sentinel', desc: 'Confidential, AI-assisted wellbeing platform for armed-forces personnel: check-ins, voice journaling, risk monitoring.', tags: ['Next.js', 'FastAPI', 'PostgreSQL'] },
  { id: 'ciphervault', name: 'CipherVault', desc: 'Encrypt and decrypt text and images right in the browser, served by a small Flask app.', tags: ['Python', 'Flask', 'Crypto'] },
  { id: 'volunteer', name: 'Volunteer Check-in', desc: 'NGO volunteer-hours tracker: admin approval, geotagged check-ins, map review and emailed receipts.', tags: ['Node.js', 'JavaScript', 'Maps'] },
];

const HEADINGS = { about: 'About Me', stack: 'Skills', projects: 'Projects', journey: 'Education Timeline', building: "Also Building", off: 'Free Time' };

// ------------------------------------------------------------------ helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const write = (name, svg) => writeFileSync(path.join(OUT, name), `${svg.trim()}\n`);
/** Rough Segoe UI advance width, good enough to wrap and size boxes. */
const textW = (s, size) => [...s].reduce((w, c) => w + (c === ' ' ? 0.28 : /[il.,'·|]/.test(c) ? 0.27 : /[mwMW]/.test(c) ? 0.85 : /[A-Z]/.test(c) ? 0.64 : 0.53), 0) * size;
function wrap(s, size, max) {
  const lines = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (textW(next, size) > max && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
const reduced = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';

// ------------------------------------------------------------------ banner (always dark: it is the hero)

function banner() {
  const W = 1200, H = 340;
  const t = THEMES.dark;
  const cycle = PHRASES.length * 3.2;
  const typeSize = 30;
  const phrases = PHRASES.map((p, i) => {
    const w = textW(p, typeSize) + 6;
    const start = (i * 3.2) / cycle * 100, end = ((i + 1) * 3.2) / cycle * 100;
    const pct = (s) => (start + (s / cycle) * 100).toFixed(2);
    // typed over 1.1s, held, deleted over .5s; a mask slides open over the text in steps, the caret rides on its edge
    return `
    <style>
      @keyframes on${i}{0%,${start.toFixed(2)}%{opacity:0}${(start + 0.01).toFixed(2)}%,${end.toFixed(2)}%{opacity:1}${(end + 0.01).toFixed(2)}%,100%{opacity:0}}
      @keyframes ty${i}{0%,${start.toFixed(2)}%{transform:translateX(0)}${pct(1.1)}%,${pct(2.6)}%{transform:translateX(${w.toFixed(0)}px)}${pct(3.1)}%,100%{transform:translateX(0)}}
      .p${i}{opacity:0;animation:on${i} ${cycle}s linear infinite}
      .c${i}{animation:ty${i} ${cycle}s steps(${p.length}) infinite}
    </style>
    <mask id="m${i}" maskUnits="userSpaceOnUse" x="-10" y="-40" width="${(w + 60).toFixed(0)}" height="60"><rect class="c${i} reveal" x="${(-w).toFixed(0)}" y="-40" width="${w.toFixed(0)}" height="60" fill="#fff"/></mask>
    <g class="p${i}">
      <text x="0" y="0" class="type" mask="url(#m${i})">${esc(p)}</text>
      <rect class="c${i} caret" x="0" y="-29" width="3" height="36" fill="${t.accent}"/>
    </g>`;
  }).join('');

  const S = 56; // cube size
  const cubes = Array.from({ length: 9 }, (_, i) => `<rect class="cube roll" x="${i * S}" y="0" width="${S - 4}" height="${S - 4}" rx="12"/>`).join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="John Thrisokaran, Full Stack Developer">
  <title>John Thrisokaran, Full Stack Developer</title>
  <defs>
    <radialGradient id="halo" cx="0.18" cy="0.5" r="0.55"><stop offset="0" stop-color="#00d9ff" stop-opacity=".16"/><stop offset="1" stop-color="#00d9ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="name" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#00d9ff"/><stop offset="1" stop-color="#00a8cc"/></linearGradient>
    <linearGradient id="rule" x1="0" x2="1"><stop offset="0" stop-color="#00d9ff"/><stop offset="1" stop-color="#00d9ff" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeR" gradientUnits="userSpaceOnUse" x1="660" x2="900"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
    <mask id="stageMask"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#fadeR)"/></mask>
    <linearGradient id="refl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="reflMask"><rect x="-400" y="0" width="1400" height="200" fill="url(#refl)"/></mask>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="stage"><rect x="640" y="0" width="${W - 640}" height="${H}"/></clipPath>
  </defs>
  <style>
    text{font-family:${FONT}}
    .type{font-size:${typeSize}px;font-weight:600;fill:#ffffff}
    .caret{animation:blink .7s steps(1) infinite}
    @keyframes blink{50%{opacity:0}}
    .cube{fill:#03e9f4}
    .belt{animation:belt 1.5s ease-in-out infinite}
    @keyframes belt{to{transform:translateX(-${S}px)}}
    .roll{transform-box:fill-box;transform-origin:100% 100%;animation:roll 1.5s ease-in-out infinite}
    @keyframes roll{0%{transform:rotate(0)}60%,70%,80%,100%{transform:rotate(90deg)}65%{transform:rotate(85deg)}75%{transform:rotate(87.5deg)}}
    @media (prefers-reduced-motion: reduce){*{animation:none!important}.p0{opacity:1!important}.type{mask:none!important}.caret{display:none}}
  </style>
  <rect width="${W}" height="${H}" fill="#000"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>

  <g clip-path="url(#stage)" mask="url(#stageMask)">
    <g transform="translate(860 230) rotate(-35)">
      <g filter="url(#glow)"><g class="belt">${cubes}</g></g>
      <g transform="translate(0 ${2 * S - 6}) scale(1 -1)" mask="url(#reflMask)" opacity=".9"><g class="belt">${cubes}</g></g>
    </g>
  </g>

  <g transform="translate(64 0)">
    <text x="0" y="96" font-size="20" font-weight="600" letter-spacing="4" fill="#00d9ff">HI, I'M</text>
    <text x="-3" y="166" font-size="64" font-weight="800" fill="url(#name)">John Thrisokaran</text>
    <text x="0" y="222" class="type" fill="#ffffff">I'm a</text>
    <g transform="translate(84 222)">${phrases}</g>
    <rect x="0" y="252" width="140" height="3" fill="url(#rule)"/>
    <text x="0" y="290" font-size="18" fill="#888888">B.Tech Computer Engineering · Fr. CRCE, Mumbai</text>
  </g>
</svg>`;
}

// ------------------------------------------------------------------ section heading

function heading(label, t) {
  const W = 880, H = 64;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs><linearGradient id="u" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient></defs>
  <text x="${W / 2}" y="34" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="700" fill="${t.ink}">${esc(label)}</text>
  <rect x="${W / 2 - 50}" y="50" width="100" height="3" fill="url(#u)"/>
</svg>`;
}

// ------------------------------------------------------------------ skill tiles (portfolio .skill-item: left cyan bar)

function skills(t) {
  const cols = 3, gw = 24, gh = 18, tw = 280, th = 92;
  const W = cols * tw + (cols - 1) * gw, rows = Math.ceil(SKILLS.length / cols), H = rows * th + (rows - 1) * gh;
  const tiles = SKILLS.map((s, i) => {
    const x = (i % cols) * (tw + gw), y = Math.floor(i / cols) * (th + gh);
    const lines = wrap(s.items, 14.5, tw - 40);
    return `<g transform="translate(${x} ${y})">
      <rect width="${tw}" height="${th}" rx="6" fill="${t.card}" stroke="${t.line}"/>
      <rect width="3" height="${th}" fill="${t.accent}"/>
      <text x="22" y="34" font-size="17" font-weight="700" fill="${t.accent}">${esc(s.title)}</text>
      ${lines.map((l, k) => `<text x="22" y="${60 + k * 20}" font-size="14.5" fill="${t.mute}">${esc(l)}</text>`).join('')}
    </g>`;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Skills: ${esc(SKILLS.map((s) => `${s.title}: ${s.items}`).join('; '))}">
  <title>Skills</title>
  <style>text{font-family:${FONT}}</style>
  ${tiles}
</svg>`;
}

// ------------------------------------------------------------------ education timeline (horizontal, glowing years)

function journey(t) {
  const W = 880, H = 190, pad = 100, step = (W - 2 * pad) / (JOURNEY.length - 1), y = 96;
  const nodes = JOURNEY.map((j, i) => {
    const x = pad + i * step, last = i === JOURNEY.length - 1;
    return `<g class="n" style="animation-delay:${(i * 0.35).toFixed(2)}s">
      <text x="${x}" y="${y - 30}" text-anchor="middle" font-size="26" font-weight="900" letter-spacing="-1" fill="${t.accent}"${t.glow ? ' filter="url(#tg)"' : ''}>${esc(j.year)}</text>
      <circle cx="${x}" cy="${y}" r="${last ? 9 : 7}" fill="${last ? t.accent : t.bg}" stroke="${t.accent}" stroke-width="3"/>
      ${last ? `<circle class="pulse" cx="${x}" cy="${y}" r="9" fill="none" stroke="${t.accent}" stroke-width="2"/>` : ''}
      <text x="${x}" y="${y + 40}" text-anchor="middle" font-size="16" font-weight="700" fill="${t.ink}">${esc(j.name)}</text>
      <text x="${x}" y="${y + 62}" text-anchor="middle" font-size="14" fill="${t.mute}">${esc(j.what)}</text>
    </g>`;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Education: ${esc(JOURNEY.map((j) => `${j.year} ${j.name}, ${j.what}`).join('; '))}">
  <title>Education timeline</title>
  <defs>
    <linearGradient id="tl" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".12" stop-color="${t.accent}"/><stop offset=".88" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
    <filter id="tg" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <style>
    text{font-family:${FONT}}
    .line{stroke-dasharray:${W};stroke-dashoffset:${W};animation:draw 1.6s cubic-bezier(.22,.8,.3,1) forwards}
    @keyframes draw{to{stroke-dashoffset:0}}
    .n{opacity:0;animation:up .7s cubic-bezier(.22,.8,.3,1) forwards}
    @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2s ease-out 1.6s infinite}
    @keyframes pulse{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(2.6)}}
    ${reduced.replace('}}', '}.line{stroke-dashoffset:0}.n{opacity:1}}')}
  </style>
  <line class="line" x1="10" y1="${y}" x2="${W - 10}" y2="${y}" stroke="url(#tl)" stroke-width="3"/>
  ${nodes}
</svg>`;
}

// ------------------------------------------------------------------ project card (portfolio .project-card)

function card(p, t) {
  const W = 430, H = 196;
  const lines = wrap(p.desc, 15, W - 48).slice(0, 3);
  let tx = 24;
  const tags = p.tags.map((tag) => {
    const w = textW(tag, 12.5) + 20;
    const g = `<g transform="translate(${tx.toFixed(1)} ${H - 42})"><rect width="${w.toFixed(1)}" height="24" rx="4" fill="${t.tagBg}" stroke="${t.tagLine}"/><text x="10" y="16.5" font-size="12.5" fill="${t.accent}">${esc(tag)}</text></g>`;
    tx += w + 8;
    return g;
  }).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)}: ${esc(p.desc)}">
  <title>${esc(p.name)}</title>
  <defs><linearGradient id="top" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient></defs>
  <style>text{font-family:${FONT}}</style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.line}"/>
  <rect x="24" y="0" width="120" height="3" fill="url(#top)"/>
  <text x="24" y="44" font-size="21" font-weight="700" fill="${t.accent}">${esc(p.name)}</text>
  <text x="${W - 24}" y="44" text-anchor="end" font-size="18" fill="${t.mute}">↗</text>
  ${lines.map((l, k) => `<text x="24" y="${78 + k * 22}" font-size="15" fill="${t.soft}">${esc(l)}</text>`).join('')}
  ${tags}
</svg>`;
}

// ------------------------------------------------------------------ thin glowing divider

function divider(t) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="880" height="12" viewBox="0 0 880 12" role="presentation">
  <defs><linearGradient id="d" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient></defs>
  <rect x="0" y="5" width="880" height="2" fill="url(#d)"/>
</svg>`;
}

// ------------------------------------------------------------------ write

write('banner.svg', banner());
for (const [name, t] of Object.entries(THEMES)) {
  for (const [id, label] of Object.entries(HEADINGS)) write(`h-${id}-${name}.svg`, heading(label, t));
  write(`skills-${name}.svg`, skills(t));
  write(`journey-${name}.svg`, journey(t));
  write(`divider-${name}.svg`, divider(t));
  for (const p of PROJECTS) write(`card-${p.id}-${name}.svg`, card(p, t));
}
console.log('assets written to', OUT);
