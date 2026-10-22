// Builds every image on the profile. Black and white only, drawn pixel by pixel.
//
//   node scripts/build.mjs
//
// All animation is CSS inside the SVGs, so it runs on GitHub (no JavaScript). Each file also honours
// prefers-reduced-motion and then shows a still, fully readable frame.

import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { text, textW, sprite, svg, frame, pc, bitmapPath, SPRITES, ADV, FONT, sansGrid } from './pixel.mjs';
import { playPage } from './play.mjs';
import { tokenize, pour, maskFrom } from './shape.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });
const write = (name, s) => writeFileSync(path.join(OUT, name), s);
const STILL = '@media (prefers-reduced-motion: reduce){*{animation:none!important}';

// ---------------------------------------------------------------------------------------------- typing

/**
 * Undertale-style dialogue: pages of lines typed one character at a time (a stepped mask per line),
 * each page held, then replaced by the next.
 */
function typer(id, pages, { x, y, s, lineH, cps = 26, hold = 1.4, start = 0 }) {
  let t = start;
  const plan = pages.map((lines) => {
    const p0 = t;
    let lt = t + 0.15;
    const parts = lines.map((ln) => {
      const r = { ln, t0: lt, t1: lt + ln.length / cps };
      lt = r.t1 + 0.18;
      return r;
    });
    t = lt + hold;
    return { p0, p1: t, parts };
  });
  return {
    end: t,
    render(cycle) {
      let css = '', defs = '', body = '';
      plan.forEach(({ p0, p1, parts }, p) => {
        css += `@keyframes ${id}p${p}{0%,${pc(p0, cycle)}{opacity:0}${pc(p0 + 0.001, cycle)},${pc(p1, cycle)}{opacity:1}${pc(p1 + 0.001, cycle)},100%{opacity:0}}`;
        css += `.${id}p${p}{opacity:0;animation:${id}p${p} ${cycle}s linear infinite}`;
        body += `<g class="${id}p${p}">`;
        parts.forEach(({ ln, t0, t1 }, i) => {
          const W = textW(ln, s) + s, ly = y + i * lineH, key = `${id}m${p}_${i}`;
          css += `@keyframes ${key}{0%,${pc(t0, cycle)}{transform:translateX(0)}${pc(t1, cycle)},100%{transform:translateX(${W}px)}}`;
          css += `.${key}{animation:${key} ${cycle}s steps(${ln.length},end) infinite}`;
          defs += `<mask id="${key}" maskUnits="userSpaceOnUse" x="${x - 4}" y="${ly - 4}" width="${W + 8}" height="${8 * s + 8}"><rect class="${key}" x="${x - W}" y="${ly - 4}" width="${W}" height="${8 * s + 8}"/></mask>`;
          body += text(ln, x, ly, s, `class="tm" mask="url(#${key})"`);
        });
        body += '</g>';
      });
      css += `${STILL}.${id}p0{opacity:1!important}.tm{mask:none!important}}`;
      return { css, defs, body };
    },
  };
}

// ---------------------------------------------------------------------------------------------- sans

/**
 * Sans, drawn as a 28x33 pixel grid (fan art, not a game sprite). Head and body are separate so the head can bob;
 * the pupils are separate so they can blink, and the left eye can light up when the battle starts.
 */

function sans(x, y, s) {
  const g = sansGrid();
  const head = g.slice(0, 16), body = g.slice(16);
  return `
    <g class="sans">
      <g class="sbody">${`<path d="${bitmapPath(body, x, y + 16 * s, s)}"/>`}</g>
      <g class="shead">
        <path d="${bitmapPath(head, x, y, s)}"/>
        <g class="pupils"><rect x="${x + 9 * s}" y="${y + 7 * s}" width="${s}" height="${s}"/><rect class="pr" x="${x + 18 * s}" y="${y + 7 * s}" width="${s}" height="${s}"/></g>
        <g class="glow"><rect x="${x + 17 * s}" y="${y + 6 * s}" width="${3 * s}" height="${3 * s}"/><rect class="flick" x="${x + 16 * s}" y="${y + 5 * s}" width="${5 * s}" height="${5 * s}" opacity=".45"/></g>
      </g>
    </g>`;
}

// ---------------------------------------------------------------------------------------------- hero

function hero() {
  const W = 960, H = 440;
  const name = 'JOHN THRISOKARAN';
  const nameS = 6;
  const box = { x: 40, y: 176, w: 880, h: 190, t: 6 };
  const dialogue = typer('d', [
    ['* JOHN THRISOKARAN BLOCKS THE WAY!'],
    ['* BUILDS WEB APPS, MOBILE APPS,', '  AND THE TOOLS UNDERNEATH THEM.'],
    ['* INTERNED AT MIRACLE SOLUTIONS.', '* STUDIES AT FR. CRCE, BANDRA.'],
    ["* YOU FEEL LIKE YOU'RE GONNA", '  HAVE A GOOD TIME.'],
  ], { x: box.x + 36, y: box.y + 40, s: 4, lineH: 52, cps: 32 });
  const BATTLE = 5.2;
  const cycle = dialogue.end + BATTLE;
  const d = dialogue.render(cycle);

  // battle: bones sweep the box, the soul hops over them
  const inX0 = box.x + box.t, inX1 = box.x + box.w - box.t, floor = box.y + box.h - box.t;
  const T = 1.7; // one bone crossing
  const heartS = 4, hw = 9 * heartS, hh = 8 * heartS, hx = 330;
  const boneH = 64, boneW = 8;
  const pass = (inX1 - (hx + hw / 2)) / (inX1 + 20 - inX0); // fraction of T when a bone is under the soul
  const jump = (c) => {
    const a = ((c - 0.13 + 1) % 1) * 100, b = (c * 100), e = ((c + 0.13) % 1) * 100;
    return [a, b, e];
  };
  const [a1, b1, e1] = jump(pass), [a2, b2, e2] = jump((pass + 0.5) % 1);
  const kf = [[0, 0], [a1, 0], [b1, -78], [e1, 0], [a2, 0], [b2, -78], [e2, 0], [100, 0]].sort((p, q) => p[0] - q[0]);
  const heartKf = kf.map(([o, v]) => `${o.toFixed(2)}%{transform:translateY(${v}px)}`).join('');
  const bone = (k) => `<g class="bone" style="animation-delay:${(-k * T / 2).toFixed(2)}s">
      <rect x="${inX1 + 4}" y="${floor - boneH}" width="${boneW}" height="${boneH}"/>
      <rect x="${inX1}" y="${floor - boneH - 6}" width="${boneW + 8}" height="8"/>
      <rect x="${inX1}" y="${floor - 6}" width="${boneW + 8}" height="6"/>
    </g>`;
  const battleCss = `
    @keyframes bt{0%,${pc(dialogue.end, cycle)}{opacity:0}${pc(dialogue.end + 0.001, cycle)},${pc(cycle - 0.05, cycle)}{opacity:1}100%{opacity:0}}
    .battle{opacity:0;animation:bt ${cycle}s linear infinite}
    @keyframes bone{from{transform:translateX(0)}to{transform:translateX(${-(inX1 - inX0 + 24)}px)}}
    .bone{animation:bone ${T}s linear infinite}
    @keyframes soul{${heartKf}}
    .soul{animation:soul ${T}s cubic-bezier(.3,0,.7,1) infinite}
    @keyframes kr{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.9)}}
    .kr{transform-box:fill-box;transform-origin:0 0;animation:kr ${T}s steps(4) infinite}
    @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
    @keyframes name{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:none}}
    .nm{animation:name .6s steps(4) both}
    @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
    .shead{animation:bob 1.4s steps(2) infinite}
    @keyframes shrug{0%,100%{transform:translateY(0)}50%{transform:translateY(2px)}}
    .sbody{animation:shrug 1.4s steps(2) infinite}
    @keyframes wink{0%,92%{opacity:1}93%,97%{opacity:0}98%,100%{opacity:1}}
    .pr{animation:wink 3.7s steps(1) infinite}
    @keyframes eyes{0%,${pc(dialogue.end, cycle)}{opacity:1}${pc(dialogue.end + 0.001, cycle)},${pc(cycle - 0.05, cycle)}{opacity:0}100%{opacity:1}}
    .pupils{animation:eyes ${cycle}s linear infinite}
    .glow{opacity:0;animation:bt ${cycle}s linear infinite}
    @keyframes flick{0%,100%{opacity:.45}50%{opacity:0}}
    .flick{animation:flick .25s steps(1) infinite}
  `;

  // stats row under the box
  const sy = box.y + box.h + 30;
  const stats = `
    ${text('JOHN', box.x, sy, 4)}
    ${text('LV 6', box.x + 150, sy, 4)}
    ${text('HP', box.x + 300, sy + 4, 3)}
    <rect x="${box.x + 344}" y="${sy}" width="120" height="28" class="k"/>
    <rect x="${box.x + 344}" y="${sy}" width="120" height="28" class="kr"/>
    ${text('KR', box.x + 480, sy + 4, 3)}
    ${text('92 / 92', box.x + 540, sy, 4)}
  `;
  const tag = 'FULL STACK DEVELOPER  /  MUMBAI';
  const body = `
    <defs>${d.defs}<clipPath id="arena"><rect x="${inX0}" y="${box.y + box.t}" width="${inX1 - inX0}" height="${box.h - 2 * box.t}"/></clipPath></defs>
    ${sans(box.x, 4, 5)}
    <g class="nm">${text(name, 214, 50, nameS)}</g>
    ${text(tag, 216, 114, 2)}
    ${frame(box.x, box.y, box.w, box.h, box.t)}
    ${d.body}
    <g class="battle" clip-path="url(#arena)">
      ${bone(0)}${bone(1)}
      <g class="soul">${sprite('heart', hx, floor - hh - 4, heartS)}</g>
    </g>
    ${stats}
  `;
  write('hero.svg', svg(W, H, "John Thrisokaran. Full stack developer from Mumbai. Builds web apps, mobile apps, and the tools underneath them. Interned at Miracle Solutions, studies at Fr. CRCE, Bandra.", body, d.css + battleCss + `${STILL}.battle{opacity:0!important}}`));
}

// ---------------------------------------------------------------------------------------------- menu buttons

const MENU = [
  { id: 'fight', label: 'FIGHT', icon: 'sword', hint: 'Projects' },
  { id: 'act', label: 'ACT', icon: 'talk', hint: 'Skills' },
  { id: 'item', label: 'ITEM', icon: 'bag', hint: 'Experience' },
  { id: 'mercy', label: 'MERCY', icon: 'spare', hint: 'Contact' },
];

function buttons() {
  const W = 220, H = 72, cycle = 6;
  MENU.forEach((m, i) => {
    const s = 4, lw = textW(m.label, s);
    const ix = 22, iy = (H - 32) / 2;
    const lx = ix + 32 + (W - ix - 32 - lw) / 2 - 6, ly = (H - 28) / 2;
    const on = pc(i * 1.5, cycle), off = pc((i + 1) * 1.5, cycle);
    const css = `
      @keyframes sel{0%,${on}{opacity:0}${pc(i * 1.5 + 0.001, cycle)},${off}{opacity:1}${pc((i + 1) * 1.5 + 0.001, cycle)},100%{opacity:0}}
      .sel{opacity:0;animation:sel ${cycle}s linear infinite}
      ${STILL}}`;
    const body = `
      ${frame(0, 0, W, H, 4)}
      ${sprite(m.icon, ix, iy, 4)}
      ${text(m.label, lx, ly, s)}
      <g class="sel">
        <rect x="4" y="4" width="${W - 8}" height="${H - 8}"/>
        <rect x="${ix - 4}" y="${iy - 4}" width="44" height="40"/>
        ${sprite('heart', ix, iy + 2, 4, 'class="k"')}
        ${text(m.label, lx, ly, s, 'class="k"')}
      </g>`;
    write(`btn-${m.id}.svg`, svg(W, H, `${m.label}: ${m.hint}`, body, css));
  });
}

// ---------------------------------------------------------------------------------------------- section headings

function heading(id, label, sub) {
  const W = 880, H = 70;
  const body = `
    ${sprite('heart', 0, 22, 3)}
    ${text(label, 44, 16, 5)}
    ${text(sub, 44 + textW(label, 5) + 24, 30, 2)}
    <rect x="0" y="${H - 6}" width="${W}" height="2"/>`;
  write(`h-${id}.svg`, svg(W, H, `${label}: ${sub}`, body, '@keyframes hb{0%,100%{transform:none}50%{transform:translateY(-3px)}}path:first-of-type{animation:hb 1.2s steps(2) infinite}'));
}

// ---------------------------------------------------------------------------------------------- project cards

/** Little animated scenes, 204x128, one per project. Each returns { css, body } in local coordinates. */
const SCENES = {
  pptx() {
    const strip = Array.from({ length: 11 }, (_, i) => `
      <rect x="${i * 24 + 2}" y="3" width="4" height="4" class="k"/><rect x="${i * 24 + 14}" y="3" width="4" height="4" class="k"/>
      <rect x="${i * 24 + 3}" y="10" width="18" height="10" class="k"/>
      <rect x="${i * 24 + 2}" y="23" width="4" height="4" class="k"/><rect x="${i * 24 + 14}" y="23" width="4" height="4" class="k"/>`).join('');
    const bars = [[24, 20, 60, 6], [28, 36, 66, 4], [28, 46, 52, 4], [28, 56, 60, 4]];
    return {
      css: `
        @keyframes grow{0%,8%{transform:scaleX(0)}20%,88%{transform:scaleX(1)}100%{transform:scaleX(0)}}
        .bar{transform-box:fill-box;transform-origin:0 0;animation:grow 4s steps(6) infinite}
        @keyframes film{to{transform:translateX(-24px)}}
        .film{animation:film .6s steps(4) infinite}
        @keyframes play{0%,45%{opacity:0}50%,95%{opacity:1}100%{opacity:0}}
        .play{animation:play 4s steps(1) infinite}`,
      body: `
        ${frame(14, 10, 104, 64, 2)}
        ${bars.map(([x, y, w, h], i) => `<rect class="bar" style="animation-delay:${(i * 0.25).toFixed(2)}s" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}
        ${text('>', 128, 36, 2)}
        ${frame(146, 18, 46, 46, 2)}
        <g class="play">${sprite('play', 160, 30, 4)}</g>
        <g transform="translate(0 92)"><rect width="204" height="30"/><g class="film">${strip}</g></g>`,
    };
  },
  hk() {
    // tokens stream in one by one, stay until the screen clears, then the loop starts over
    const rows = [[18, 30, 12, 24, 36], [24, 12, 30, 18], [36, 18, 24, 12, 30], [12, 24, 18]];
    const cycle = 4.5, clear = 4.0;
    let n = 0, body = '', css = '';
    rows.forEach((r, ri) => {
      let x = 12;
      r.forEach((w) => {
        const t = 0.5 + n * 0.17;
        css += `@keyframes t${n}{0%,${pc(t, cycle)}{opacity:0}${pc(t + 0.001, cycle)},${pc(clear, cycle)}{opacity:1}${pc(clear + 0.001, cycle)},100%{opacity:0}}.t${n}{opacity:0;animation:t${n} ${cycle}s linear infinite}`;
        body += `<rect class="t${n}" x="${x}" y="${44 + ri * 18}" width="${w}" height="8"/>`;
        x += w + 6;
        n++;
      });
    });
    css += `@keyframes cur{0%,49%{opacity:1}50%,100%{opacity:0}}.cur{animation:cur .8s steps(1) infinite}`;
    css += `${STILL}${Array.from({ length: n }, (_, i) => `.t${i}`).join(',')}{opacity:1!important}}`;
    return {
      css,
      body: `${frame(0, 0, 204, 128, 2)}${text('> RUN MODEL', 12, 14, 2)}${body}<rect class="cur" x="160" y="98" width="10" height="12"/>`,
    };
  },
  patch() {
    return {
      css: `
        @keyframes slide{0%,25%{transform:translateX(120px)}45%,90%{transform:translateX(0)}100%{transform:translateX(120px)}}
        .patch{animation:slide 4s steps(6) infinite}
        @keyframes ok{0%,50%{opacity:0}55%,90%{opacity:1}100%{opacity:0}}
        .ok{animation:ok 4s steps(1) infinite}
        @keyframes broken{0%,40%{opacity:1}45%,100%{opacity:0}}
        .broken{animation:broken 4s steps(1) infinite}`,
      body: `
        ${frame(0, 0, 204, 128, 2)}
        <rect x="0" y="0" width="204" height="16"/>
        <rect x="8" y="5" width="6" height="6" class="k"/><rect x="18" y="5" width="6" height="6" class="k"/><rect x="28" y="5" width="6" height="6" class="k"/>
        <rect x="12" y="26" width="180" height="10"/>
        <rect x="12" y="44" width="84" height="44"/>
        ${frame(108, 44, 84, 44, 2)}
        <g class="broken">${sprite('spare', 134, 50, 4)}</g>
        <g class="patch"><rect x="108" y="44" width="84" height="44"/><rect x="116" y="52" width="68" height="4" class="k"/><rect x="116" y="62" width="50" height="4" class="k"/><rect x="116" y="72" width="60" height="4" class="k"/></g>
        <rect x="12" y="98" width="130" height="6"/><rect x="12" y="110" width="90" height="6"/>
        <g class="ok">${sprite('check', 164, 98, 3)}</g>`,
    };
  },
  sentinel() {
    const pts = [[0, 70], [40, 70], [52, 70], [60, 40], [70, 104], [80, 22], [90, 86], [98, 70], [130, 70], [140, 62], [150, 70], [204, 70]];
    const d = `M${pts.map((p) => p.join(' ')).join(' L')}`;
    return {
      css: `
        .ln{fill:none!important;stroke:#fff;stroke-width:4;stroke-linejoin:miter;stroke-dasharray:420;stroke-dashoffset:420;animation:draw 2.4s steps(24) infinite}
        @keyframes draw{to{stroke-dashoffset:0}}
        @keyframes beat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(1)}}
        .beat{transform-box:fill-box;transform-origin:center;animation:beat 1.2s steps(3) infinite}`,
      body: `${frame(0, 0, 204, 128, 2)}<g class="beat">${sprite('heart', 12, 12, 3)}</g>${text('CHECK-IN', 54, 14, 2)}<g transform="translate(0 0)"><path class="ln" d="${d}"/></g>`,
    };
  },
  cipher() {
    const words = ['HELLO', 'H@L#O', '#@%&?', '?&%$#', '#@%&?', 'H@L#O'];
    const n = words.length;
    return {
      css: words.map((_, i) => `@keyframes w${i}{0%,${(i / n * 100).toFixed(2)}%{opacity:0}${(i / n * 100 + 0.01).toFixed(2)}%,${((i + 1) / n * 100).toFixed(2)}%{opacity:1}${((i + 1) / n * 100 + 0.01).toFixed(2)}%,100%{opacity:0}}.w${i}{opacity:0;animation:w${i} 3.6s linear infinite}`).join('')
        + `${STILL}.w0{opacity:1!important}}`,
      body: `${frame(0, 0, 204, 128, 2)}${sprite('lock', 16, 22, 5)}${words.map((w, i) => text(w, 76, 34, 4, `class="w${i}"`)).join('')}<rect x="76" y="80" width="112" height="2"/>${text('KEY', 76, 92, 2)}<rect x="122" y="92" width="66" height="14"/>`,
    };
  },
  volunteer() {
    let grid = '';
    for (let x = 24; x < 204; x += 36) grid += `<rect x="${x}" y="2" width="2" height="124"/>`;
    for (let y = 24; y < 128; y += 32) grid += `<rect x="2" y="${y}" width="200" height="2"/>`;
    return {
      css: `
        @keyframes drop{0%{transform:translateY(-70px)}35%,100%{transform:translateY(0)}}
        .pin{animation:drop 3s steps(7) infinite}
        @keyframes ring{0%,35%{transform:scale(0);opacity:1}70%{transform:scale(1);opacity:1}71%,100%{opacity:0}}
        .ring{transform-box:fill-box;transform-origin:center;animation:ring 3s steps(5) infinite}`,
      body: `${frame(0, 0, 204, 128, 2)}<g opacity=".35">${grid}</g><rect x="2" y="86" width="200" height="8"/><g class="ring">${frame(78, 70, 48, 32, 3)}</g><g class="pin">${sprite('pin', 88, 38, 4)}</g>`,
    };
  },
};

const PROJECTS = [
  { id: 'pptx-to-video', scene: 'pptx', name: 'PPTX-TO-VIDEO', line: 'TURNS A POWERPOINT INTO AN ANIMATED MP4. PLUS A LOCAL DECK AI.', stack: 'NODE  PUPPETEER  FFMPEG  SQLITE' },
  { id: 'hk', scene: 'hk', name: 'HK', line: 'A LOCAL LLM RUNTIME WRITTEN FROM SCRATCH IN ZIG.', stack: 'ZIG  CUDA  VULKAN' },
  { id: 'patchwork', scene: 'patch', name: 'PATCHWORK', line: 'HOTFIXES LIVE WEBSITES WITHOUT A REBUILD, AND ROLLS BACK ON ERRORS.', stack: 'RUST  PYTHON' },
  { id: 'sentinel', scene: 'sentinel', name: 'SENTINEL', line: 'A CONFIDENTIAL WELLBEING PLATFORM FOR ARMED FORCES PERSONNEL.', stack: 'NEXT.JS  FASTAPI  POSTGRES' },
  { id: 'ciphervault', scene: 'cipher', name: 'CIPHERVAULT', line: 'ENCRYPTS TEXT AND IMAGES RIGHT IN THE BROWSER.', stack: 'PYTHON  FLASK' },
  { id: 'volunteer', scene: 'volunteer', name: 'VOLUNTEER CHECK-IN', line: 'TRACKS NGO VOLUNTEER HOURS WITH GEOTAGGED PROOF.', stack: 'NODE  MAPS  EMAIL' },
];

function wrapChars(str, max) {
  const out = [];
  let cur = '';
  for (const w of str.split(' ')) {
    if ((cur ? cur.length + 1 : 0) + w.length > max && cur) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

function cards() {
  const W = 880, H = 176;
  for (const p of PROJECTS) {
    const sc = SCENES[p.scene]();
    const lines = wrapChars(p.line, 44).slice(0, 2);
    const body = `
      ${frame(0, 0, W, H, 4)}
      ${text(p.name, 28, 28, 4)}
      ${lines.map((l, i) => text(l, 28, 78 + i * 22, 2)).join('')}
      <rect x="28" y="${H - 50}" width="${textW('STACK', 2) + 12}" height="26"/>
      ${text('STACK', 34, H - 44, 2, 'class="k"')}
      ${text(p.stack, 28 + textW('STACK', 2) + 26, H - 44, 2)}
      <g transform="translate(${W - 232} 24)">${sc.body}</g>`;
    write(`card-${p.id}.svg`, svg(W, H, `${p.name}: ${p.line.toLowerCase()}`, body, sc.css + `${STILL}}`));
  }
}

// ---------------------------------------------------------------------------------------------- skills (tetris)

const SKILLS = [
  ['FRONTEND', 'REACT  NEXT.JS  VUE  TYPESCRIPT'],
  ['BACKEND', 'NODE  FASTAPI  FLASK  DJANGO  SPRING'],
  ['DATA', 'POSTGRES  MONGODB  REDIS  SQLITE'],
  ['MOBILE', 'FLUTTER  KOTLIN  FIREBASE'],
  ['SYSTEMS', 'C  C++  RUST  ZIG  CUDA'],
  ['TOOLS', 'GIT  DOCKER  AWS  FFMPEG'],
];

function tetris() {
  const W = 880, H = 300, c = 13, gx = 28, gy = 28, cols = 10, rows = 16;
  const cell = (cx, cy, cls = '') => `<g${cls ? ` class="${cls}"` : ''}><rect x="${gx + cx * c}" y="${gy + cy * c}" width="${c - 1}" height="${c - 1}"/><rect x="${gx + cx * c + 3}" y="${gy + cy * c + 3}" width="${c - 7}" height="${c - 7}" class="k"/></g>`;
  let base = '', upper = '';
  for (let x = 0; x < 8; x++) { base += cell(x, rows - 1); base += cell(x, rows - 2); }
  for (const x of [0, 1, 2, 3, 5]) upper += cell(x, rows - 3);
  for (const x of [0, 1, 5, 6]) upper += cell(x, rows - 4);
  const piece = [cell(8, 0), cell(9, 0), cell(8, 1), cell(9, 1)].join('');
  const cycle = 6.5;
  const css = `
    @keyframes fall{0%,4%{transform:translateY(0)}40%,100%{transform:translateY(${(rows - 2) * c}px)}}
    .piece{animation:fall ${cycle}s steps(${rows - 2}) infinite}
    @keyframes clear{0%,40%{opacity:1}43%{opacity:0}46%{opacity:1}49%{opacity:0}52%{opacity:1}55%,100%{opacity:0}}
    .full{animation:clear ${cycle}s steps(1) infinite}
    @keyframes settle{0%,56%{transform:translateY(0)}60%,100%{transform:translateY(${2 * c}px)}}
    .upper{animation:settle ${cycle}s steps(2) infinite}
    @keyframes fade{0%{opacity:0}4%,92%{opacity:1}97%,100%{opacity:0}}
    .well{animation:fade ${cycle}s steps(4) infinite}
    @keyframes count{0%,54%{opacity:1}55%,100%{opacity:0}}
    @keyframes count2{0%,54%{opacity:0}55%,100%{opacity:1}}
    .l0{animation:count ${cycle}s steps(1) infinite}.l2{opacity:0;animation:count2 ${cycle}s steps(1) infinite}
    ${STILL}.l2{opacity:1!important}.l0{opacity:0!important}}`;
  const tx = 230;
  const list = SKILLS.map(([k, v], i) => `${text(k, tx, 34 + i * 40, 3)}${text(v, tx + 200, 38 + i * 40, 2)}`).join('');
  const body = `
    ${frame(gx - 6, gy - 6, cols * c + 11, rows * c + 11, 4)}
    <g class="well"><g class="upper">${upper}</g><g class="full">${base}<g class="piece">${piece}</g></g></g>
    ${text('LINES', gx, gy + rows * c + 18, 2)}
    <g class="l0">${text('00', gx + 96, gy + rows * c + 18, 2)}</g><g class="l2">${text('02', gx + 96, gy + rows * c + 18, 2)}</g>
    ${list}`;
  write('skills.svg', svg(W, H, `Skills. ${SKILLS.map(([k, v]) => `${k}: ${v}`).join('. ')}`, body, css));
}

// ---------------------------------------------------------------------------------------------- experience (item menu + xp bar)

function items() {
  const W = 880, H = 270;
  const entries = [
    ['INTERN, MIRACLE SOLUTIONS', '3 MONTH INTERNSHIP'],
    ['FR. CONCEICAO RODRIGUES', 'COLLEGE OF ENGINEERING, BANDRA'],
    ['NOW BUILDING', 'PPTX-TO-VIDEO AND QUORO AI'],
  ];
  const cycle = 6;
  const css = `
    @keyframes cur{0%,33.32%{transform:translateY(0)}33.33%,66.65%{transform:translateY(62px)}66.66%,100%{transform:translateY(124px)}}
    .cur{animation:cur ${cycle}s steps(1) infinite}
    @keyframes xp{0%{transform:scaleX(0)}70%,100%{transform:scaleX(1)}}
    .xp{transform-box:fill-box;transform-origin:0 0;animation:xp ${cycle}s steps(30) infinite}
    @keyframes lv{0%,69%{opacity:0}70%,100%{opacity:1}}
    .lv{animation:lv ${cycle}s steps(1) infinite}
    ${STILL}}`;
  let list = '';
  entries.forEach(([a, b], i) => {
    list += text(`* ${a}`, 76, 34 + i * 62, 3);
    list += text(b, 112, 62 + i * 62, 2);
  });
  let segs = '';
  const bx = 40, by = H - 22, bw = 800, n = 20, sw = bw / n;
  for (let i = 0; i < n; i++) segs += `<rect x="${bx + i * sw}" y="${by}" width="${sw - 4}" height="12"/>`;
  const body = `
    ${frame(20, 12, W - 40, 198, 4)}
    <g class="cur">${sprite('heart', 40, 34, 3)}</g>
    ${list}
    <g opacity=".3">${segs}</g>
    <g class="xp"><g>${segs}</g></g>
    <g class="lv">${text('3', W / 2 - 5, by - 22, 2)}</g>`;
  write('experience.svg', svg(W, H, 'Experience. Intern at Miracle Solutions for 3 months. Fr. Conceicao Rodrigues College of Engineering, Bandra. Now building pptx-to-video and Quoro AI.', body, css));
}

// ---------------------------------------------------------------------------------------------- contact (? blocks)

const CONTACT = [
  { id: 'linkedin', label: 'LINKEDIN' },
  { id: 'x', label: 'X' },
  { id: 'email', label: 'EMAIL' },
  { id: 'github', label: 'REPOS' },
];

function blocks() {
  const W = 180, H = 190, bs = 76, bx = (W - bs) / 2, by = 72, cycle = 4;
  const q = ['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '......', '..XX..'];
  CONTACT.forEach((cn, i) => {
    const delay = (i * 0.6).toFixed(2);
    const css = `
      @keyframes bump{0%{transform:translateY(0)}4%{transform:translateY(-14px)}8%,100%{transform:translateY(0)}}
      .blk{animation:bump ${cycle}s steps(2) infinite;animation-delay:${delay}s}
      @keyframes coin{0%{opacity:0;transform:translateY(0)}3%{opacity:1}14%{opacity:1;transform:translateY(-52px)}18%,100%{opacity:0;transform:translateY(-52px)}}
      .coin{opacity:0;animation:coin ${cycle}s steps(5) infinite;animation-delay:${delay}s}
      ${STILL}}`;
    const lw = textW(cn.label, 3);
    const body = `
      <g class="coin">${sprite('coin', W / 2 - 14, by - 32, 4)}</g>
      <g class="blk">
        <rect x="${bx}" y="${by}" width="${bs}" height="${bs}"/>
        <rect x="${bx + 4}" y="${by + 4}" width="${bs - 8}" height="${bs - 8}" class="k"/>
        ${[[8, 8], [bs - 14, 8], [8, bs - 14], [bs - 14, bs - 14]].map(([x, y]) => `<rect x="${bx + x}" y="${by + y}" width="6" height="6"/>`).join('')}
        <path d="${q.map(() => '').join('')}${(() => { let d = ''; q.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') d += `M${bx + 20 + c * 6} ${by + 17 + r * 6}h6v6h-6z`; })); return d; })()}"/>
      </g>
      ${text(cn.label, (W - lw) / 2, H - 30, 3)}`;
    write(`contact-${cn.id}.svg`, svg(W, H, cn.label, body, css));
  });
}

// ---------------------------------------------------------------------------------------------- save point

function save() {
  const W = 880, H = 150;
  const t = typer('s', [['* THE SHEER AMOUNT OF CODE HERE', '  FILLS YOU WITH DETERMINATION.'], ['* FILE SAVED.']], { x: 96, y: 30, s: 3, lineH: 40, hold: 2 });
  const cycle = t.end;
  const r = t.render(cycle);
  const css = r.css + `
    @keyframes tw{0%,100%{transform:scale(1)}50%{transform:scale(.7)}}
    .star{transform-box:fill-box;transform-origin:center;animation:tw .8s steps(2) infinite}`;
  const body = `<defs>${r.defs}</defs><g class="star">${sprite('star', 30, 40, 5)}</g>${r.body}`;
  write('save.svg', svg(W, H, 'The sheer amount of code here fills you with determination. File saved.', body, css));
}

// ---------------------------------------------------------------------------------------------- dino runner

const DINO = [
  '..........XXXXXXXX',
  '.........XX.XXXXXX',
  '.........XXXXXXXXX',
  '.........XXXXXXXXX',
  '.........XXXXX....',
  '.........XXXXXXXX.',
  'X.......XXXXX.....',
  'X......XXXXXX.....',
  'XX....XXXXXXXXX...',
  'XXX..XXXXXXX.X....',
  'XXXXXXXXXXXX......',
  'XXXXXXXXXXXX......',
  '.XXXXXXXXXX.......',
  '..XXXXXXXXX.......',
  '...XXXXXXX........',
];
const LEGS_A = ['....XXX.XX........', '....XX...X........', '....X....X........', '....XX...XX.......'];
const LEGS_B = ['....XX.XXX........', '....XX...XX.......', '....XX............', '..........XX......'];
const CACTUS = ['....XX....', '....XX..X.', 'X...XX..X.', 'X...XX..X.', 'X...XXXXX.', 'X...XX....', 'XXXXXX....', '....XX....', '....XX....', '....XX....'];
const CLOUD = ['....XXXX....', '..XX....XX..', '.X........XXX', 'X............X', 'XXXXXXXXXXXXXX'];
SPRITES._cloud = CLOUD;

function dino() {
  const W = 880, H = 230, s = 4, ground = 186;
  const dx = 70, dh = (DINO.length + 4) * s, dy = ground - dh;
  const T = 2.4, x0 = W, dist = W + 60;
  const pass = (x0 + 20 - (dx + 36)) / dist;
  const kf = [];
  for (const c of [pass, (pass + 0.5) % 1]) kf.push([c - 0.1, 0], [c, -84], [c + 0.1, 0]);
  const jumpKf = [[0, 0], ...kf, [1, 0]].sort((a, b) => a[0] - b[0]).map(([o, v]) => `${(o * 100).toFixed(2)}%{transform:translateY(${v}px)}`).join('');
  const speed = dist / T, tile = 220;
  let pebbles = '';
  for (let k = 0; k < 6; k++) {
    for (const [px, py, pw] of [[12, 8, 8], [60, 14, 4], [104, 6, 12], [150, 12, 4], [190, 8, 6]]) pebbles += `<rect x="${k * tile + px}" y="${ground + py}" width="${pw}" height="2"/>`;
  }
  // score: an odometer, each digit a strip of 0-9 clipped to one cell
  const ds = 3, cellH = 8 * ds, sx = W - 6 * ADV * ds - 20, sy = 20;
  const strip = (i, period) => {
    const col = Array.from({ length: 11 }, (_, n) => text(String(n % 10), sx + i * ADV * ds, sy + n * cellH, ds)).join('');
    return period ? `<g class="odo" style="animation-duration:${period}s">${col}</g>` : text('0', sx + i * ADV * ds, sy, ds);
  };
  const css = `
    @keyframes cact{from{transform:translateX(0)}to{transform:translateX(${-dist}px)}}
    .cact{animation:cact ${T}s linear infinite}
    @keyframes jump{${jumpKf}}
    .dino{animation:jump ${T}s cubic-bezier(.3,0,.7,1) infinite}
    @keyframes la{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes lb{0%,49%{opacity:0}50%,100%{opacity:1}}
    .la{animation:la .24s steps(1) infinite}.lb{opacity:0;animation:lb .24s steps(1) infinite}
    @keyframes grd{to{transform:translateX(${-tile}px)}}
    .grd{animation:grd ${(tile / speed).toFixed(3)}s linear infinite}
    @keyframes cloud{from{transform:translateX(0)}to{transform:translateX(${-(W + 80)}px)}}
    .cloud{animation:cloud 14s linear infinite}
    @keyframes odo{to{transform:translateY(${-10 * cellH}px)}}
    .odo{animation-name:odo;animation-timing-function:steps(10);animation-iteration-count:infinite}
    @keyframes cta{0%,59%{opacity:1}60%,100%{opacity:0}}
    .cta{animation:cta 1.2s steps(1) infinite}
    ${STILL}.lb{opacity:0!important}}`;
  const body = `
    <defs><clipPath id="score"><rect x="${sx}" y="${sy}" width="${5 * ADV * ds}" height="${7 * ds}"/></clipPath></defs>
    <g class="cta">${text('> CLICK TO PLAY', 20, sy, ds)}</g>
    ${text('HI 00820', sx - 9 * ADV * ds, sy, ds)}
    <g clip-path="url(#score)">${strip(0)}${strip(1)}${strip(2, 100)}${strip(3, 10)}${strip(4, 1)}</g>
    <g class="cloud">${sprite("_cloud", W, 66, 4)}</g><g class="cloud" style="animation-delay:-7s">${sprite("_cloud", W, 104, 3)}</g>
    <rect x="0" y="${ground}" width="${W}" height="2"/>
    <g class="grd">${pebbles}</g>
    ${[0, 1].map((k) => `<g class="cact" style="animation-delay:${(-k * T / 2).toFixed(2)}s"><path d="${bitmapPath(CACTUS, x0, ground - CACTUS.length * s, s)}"/></g>`).join('')}
    <g class="dino">
      <path d="${bitmapPath(DINO, dx, dy, s)}"/>
      <path class="la" d="${bitmapPath(LEGS_A, dx, dy + DINO.length * s, s)}"/>
      <path class="lb" d="${bitmapPath(LEGS_B, dx, dy + DINO.length * s, s)}"/>
    </g>`;
  write('dino.svg', svg(W, H, 'A pixel dinosaur running and jumping over cacti, with a ticking score.', body, css));
}

// ---------------------------------------------------------------------------------------------- scrolling track (README text)

/** A dino run drawn in plain ASCII. GitHub puts wide code blocks in a horizontal scroller, so scrolling is running. */
function track() {
  const width = 340, height = 14, ground = 11;
  const g = Array.from({ length: height }, () => Array(width).fill(' '));
  const put = (x, y, s) => [...s].forEach((ch, i) => { if (x + i >= 0 && x + i < width && y >= 0 && y < height) g[y][x + i] = ch; });
  const art = (x, yTop, lines) => lines.forEach((l, i) => put(x, yTop + i, l));

  const DINO_ART = [
    '          .-----.',
    '          | o   |',
    '          |  .--\'',
    ' \\        |  |--.',
    '  \\.------\'  |',
    '   \\_       _/',
    '     |_|  |_|',
  ];
  const CACTUS_ART = ['   _', ' _| | _', '| | || |', '|_  ,_/', '  | |', '  | |'];
  const BIRD_ART = [' __', '<__\\___', '    \\/'];
  const CLOUD_ART = ['  .--.', '.(    ).', '(_______)'];

  for (let x = 0; x < width; x++) put(x, ground, '_');
  for (let x = 0; x < width; x += 7) put(x + ((x * 7) % 5), ground + 1, (x / 7) % 3 === 0 ? '.' : (x / 7) % 3 === 1 ? '-' : ',');
  for (const [x, y] of [[30, 0], [96, 1], [150, 0], [212, 1], [290, 0]]) art(x, y, CLOUD_ART);

  art(2, ground - DINO_ART.length, DINO_ART);
  put(2, 1, 'HI 00820  00000');
  put(24, 6, 'SCROLL  >>>');

  const stops = [
    [52, 'CIPHERVAULT'], [96, 'VOLUNTEER CHECK-IN'], [146, 'SENTINEL'],
    [196, 'PATCHWORK'], [244, 'HK'], [290, 'PPTX-TO-VIDEO'],
  ];
  for (const [x, label] of stops) {
    art(x, ground - CACTUS_ART.length, CACTUS_ART);
    const sign = `[ ${label} ]`;
    put(x + 4 - Math.floor(sign.length / 2), ground - CACTUS_ART.length - 2, sign);
  }
  for (const [x, y] of [[74, 3], [170, 2], [268, 3]]) art(x, y, BIRD_ART);

  const end = width - 18;
  art(end, 2, ['GAME OVER?', '', ' NO. SHIPPED.']);
  art(end + 3, 7, ['  *', ' *** ', '*****', ' | |']);
  return g.map((r) => r.join('').replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

// ---------------------------------------------------------------------------------------------- ioccc (C source shaped like Sans)

/** Finds a C compiler: $CC, then gcc, clang, cc, then `zig cc`. Returns [cmd, ...prefixArgs] or null. */
function findCC() {
  const tries = [];
  if (process.env.CC) tries.push(process.env.CC.split(' '));
  tries.push(['gcc'], ['clang'], ['cc'], ['zig', 'cc']);
  const zigHome = path.join(os.homedir(), 'tools', 'zig');
  if (existsSync(zigHome)) for (const d of readdirSync(zigHome)) tries.push([path.join(zigHome, d, 'zig.exe'), 'cc'], [path.join(zigHome, d, 'zig'), 'cc']);
  for (const t of tries) {
    try { execFileSync(t[0], [...t.slice(1), '--version'], { stdio: 'ignore' }); return t; } catch { /* try next */ }
  }
  return null;
}

/** The head of the Sans grid with his pupils filled in: the outline the code is poured into. */
function sansMask() {
  const head = sansGrid().slice(0, 16).map((r) => r.slice(4, 24));
  const r7 = head[7].split('');
  r7[5] = 'X'; r7[14] = 'X';
  head[7] = r7.join('');
  return maskFrom(head, 2.6, 1.3);
}

const run = (exe, args) => execFileSync(exe, args, { encoding: 'utf8', maxBuffer: 1 << 24 }).replace(/\r/g, '');

/**
 * IOCCC-style art: pours ascii/sans.src.c into Sans's skull as ascii/sans.c, then compiles both and refuses to
 * continue unless the shaped program prints exactly what the readable one prints.
 */
function iocccBuild() {
  const dir = path.join(ROOT, 'ascii');
  const { text: shaped, left } = pour(tokenize(readFileSync(path.join(dir, 'sans.src.c'), 'utf8')), sansMask());
  if (left) throw new Error(`sans.c: ${left} tokens did not fit in the mask`);
  writeFileSync(path.join(dir, 'sans.c'), `${shaped}\n`);
  const saved = path.join(dir, 'sans.frames.txt');
  const cc = findCC();
  if (cc) {
    const ext = process.platform === 'win32' ? '.exe' : '';
    const bin = (n) => path.join(os.tmpdir(), `${n}-${process.pid}${ext}`);
    for (const [src, out] of [['sans.src.c', bin('sans-src')], ['sans.c', bin('sans')]]) {
      execFileSync(cc[0], [...cc.slice(1), '-O2', '-std=c99', '-w', '-o', out, path.join(dir, src)], { stdio: 'inherit' });
    }
    const a = run(bin('sans-src'), ['frames']), b = run(bin('sans'), ['frames']);
    rmSync(bin('sans-src'), { force: true }); rmSync(bin('sans'), { force: true });
    if (a !== b) throw new Error('sans.c and sans.src.c print different output');
    writeFileSync(saved, b);
    console.log(`sans.c compiled with ${cc.join(' ')}; output identical to sans.src.c`);
  } else console.log('no C compiler found; using ascii/sans.frames.txt');
  const frames = readFileSync(saved, 'utf8').split('\f\n').map((f) => f.replace(/\n$/, '').split('\n'));
  return { shaped, frames };
}

function ioccc() {
  const { shaped, frames } = iocccBuild();
  const W = 880, H = 450, n = frames.length, dur = 6;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = (rows, ox, oy, cw, lh) => rows.map((r, j) => {
    const a = r.search(/\S/);
    if (a < 0) return '';
    const t = r.trimEnd().slice(a);
    return `<text x="${(ox + a * cw).toFixed(1)}" y="${oy + (j + 1) * lh}" textLength="${(t.length * cw).toFixed(1)}">${esc(t)}</text>`;
  }).join('');
  // left: the source itself; right: what it prints
  const src = shaped.split('\n');
  const scw = 6.9, slh = 14, sox = 30, soy = 66 + (360 - src.length * slh) / 2;
  const ocw = 6.4, olh = 10.6, oox = 440, ooy = 64;
  const groups = frames.map((rows, i) => `<g class="f" style="animation-delay:${(i * dur / n - dur).toFixed(3)}s">${lines(rows, oox, ooy, ocw, olh)}</g>`).join('\n');
  const css = `
    text{fill:#fff;font:11px ui-monospace,Menlo,Consolas,'Courier New',monospace;white-space:pre}
    .src text{font-size:12px}
    @keyframes fr{0%{opacity:1}${(100 / n).toFixed(3)}%,100%{opacity:0}}
    .f{opacity:0;animation:fr ${dur}s steps(1,end) infinite}
    ${STILL}.f:first-of-type{opacity:1!important}}`;
  const body = `
    ${text('SANS.C', 20, 14, 3)}
    ${text('$ ./SANS', 430, 14, 3)}
    ${frame(16, 44, 396, 396, 4)}
    ${frame(426, 44, 438, 396, 4)}
    <g class="src" xml:space="preserve">${lines(src, sox, soy, scw, slh)}</g>
    <g xml:space="preserve">${groups}</g>`;
  write('ioccc.svg', svg(W, H, 'sans.c: a C program whose source is shaped like Sans, and the Mandelbrot zoom it prints.', body, css));

  const readme = path.join(ROOT, 'README.md');
  const md = readFileSync(readme, 'utf8');
  const RE = /(<!-- ioccc:start -->)[\s\S]*?(<!-- ioccc:end -->)/;
  if (RE.test(md)) {
    writeFileSync(readme, md.replace(RE, (_, a, b) => `${a}\n\`\`\`c\n${shaped}\n\`\`\`\n\n\`cc -O2 -o sans sans.c && ./sans\` to watch it in a terminal. It is a real program: the build compiles it next to [the readable version](ascii/sans.src.c) and checks that both print the same frames.\n${b}`));
  } else console.warn('README has no ioccc markers');
}



// ---------------------------------------------------------------------------------------------- run

hero();
buttons();
heading('fight', 'FIGHT', 'PROJECTS I HAVE BUILT');
heading('act', 'ACT', 'WHAT I WORK WITH');
heading('item', 'ITEM', 'WHERE I HAVE WORKED');
heading('run', 'RUN', 'CLICK TO PLAY, SCROLL TO RUN');
heading('ioccc', 'IOCCC', 'C SOURCE SHAPED LIKE SANS');
heading('mercy', 'MERCY', 'GET IN TOUCH');
cards();
tetris();
items();
dino();
ioccc();

// the playable game, served by GitHub Pages
mkdirSync(path.join(ROOT, 'play'), { recursive: true });
writeFileSync(path.join(ROOT, 'play', 'index.html'), playPage({
  font: FONT, dino: DINO, legsA: LEGS_A, legsB: LEGS_B, cactus: CACTUS, cloud: CLOUD, heart: SPRITES.heart,
  profileUrl: 'https://github.com/JohnThrisokaran000',
}));
writeFileSync(path.join(ROOT, '.nojekyll'), '');

// the side-scrolling track lives in the README between markers
{
  const readme = path.join(ROOT, 'README.md');
  const md = readFileSync(readme, 'utf8');
  const RE = /(<!-- track:start -->)[\s\S]*?(<!-- track:end -->)/;
  if (RE.test(md)) writeFileSync(readme, md.replace(RE, (_, a, b) => `${a}\n\`\`\`text\n${track()}\n\`\`\`\n${b}`));
  else console.warn('README has no track markers');
}
blocks();
save();
console.log('built', OUT);
