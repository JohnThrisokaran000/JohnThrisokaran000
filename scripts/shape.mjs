// IOCCC-style shaping: pours the tokens of a C program into a picture.
// Code goes only where the mask is filled; holes become whitespace. Tokens are never split, except string
// literals, which C lets us cut into adjacent literals ("ab" "cd" == "abcd"). Leftover gaps inside a filled
// run are padded with comments (/**/), which C treats as whitespace.

const TOKEN = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_]\w*|>>=|<<=|\+\+|--|->|&&|\|\||[<>=!+\-*/%&|^]=|<<|>>|[{}()[\];,?:.<>=!+\-*/%&|^~]/g;

export function tokenize(src) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
  const out = [];
  let m, last = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    if (code.slice(last, m.index).trim()) throw new Error(`cannot tokenize near "${code.slice(last, m.index + 10)}"`);
    out.push(m[0]);
    last = TOKEN.lastIndex;
  }
  if (code.slice(last).trim()) throw new Error('trailing junk');
  return out;
}

/** True when two tokens written back to back would still read as the same two tokens. */
function canTouch(a, b) {
  if (!a) return true;
  if ((a.endsWith('/') && (b.startsWith('*') || b.startsWith('/'))) || (a.endsWith('*') && b.startsWith('/'))) return false;
  const t = (a + b).match(TOKEN);
  return t && t.length === 2 && t[0] === a && t[1] === b;
}

/** Splits a string literal's body into escape-aware units. */
const units = (lit) => lit.slice(1, -1).match(/\\(?:x[0-9a-fA-F]+|[0-7]{1,3}|.)|./g) ?? [];

/**
 * @param tokens  from tokenize()
 * @param mask    array of strings, '#' = put code here
 * @returns { text, left } the shaped source and how many tokens did not fit
 */
export function pour(tokens, mask) {
  const queue = [...tokens];
  const lines = [];
  for (const row of mask) {
    const line = Array(row.length).fill(' ');
    const runs = [];
    for (let c = 0; c < row.length;) {
      if (row[c] !== '#') { c++; continue; }
      let e = c;
      while (e < row.length && row[e] === '#') e++;
      runs.push([c, e]);
      c = e;
    }
    for (const [start, end] of runs) {
      let pos = start, prev = null;
      const put = (s) => { [...s].forEach((ch, i) => { line[pos + i] = ch; }); pos += s.length; };
      while (pos < end && queue.length) {
        let tok = queue[0];
        if (!canTouch(prev, tok)) {
          // need a separator: a comment if it fits with the token, else a single space
          if (end - pos >= 4 + tok.length) { put('/**/'); prev = null; continue; }
          pos += 1; prev = null; continue;
        }
        const room = end - pos;
        if (tok.length <= room) { put(tok); prev = tok; queue.shift(); continue; }
        if (tok[0] === '"' && room >= 3) {
          const u = units(tok);
          let take = 0, len = 2;
          while (take < u.length && len + u[take].length <= room) len += u[take++].length;
          if (take > 0 && take < u.length) {
            put(`"${u.slice(0, take).join('')}"`);
            queue[0] = `"${u.slice(take).join('')}"`;
            prev = null; // the next piece starts a new literal; literals may touch
            continue;
          }
        }
        break;
      }
      // pad the rest of the run so the silhouette stays solid
      const rest = end - pos;
      if (rest >= 4) put(`/*${'*'.repeat(rest - 4)}*/`);
      else if (rest > 0 && queue.length === 0 && rest >= 2) put(rest === 2 ? '  ' : '   ');
    }
    lines.push(line.join('').replace(/\s+$/, ''));
  }
  return { text: lines.join('\n'), left: queue.length };
}

/** Scales a pixel grid (X = on) to a character mask: each pixel becomes sx columns by sy rows (sy may be fractional). */
export function maskFrom(grid, sx, sy) {
  const rows = Math.round(grid.length * sy), cols = grid[0].length * sx;
  return Array.from({ length: rows }, (_, r) => {
    const gr = grid[Math.min(grid.length - 1, Math.floor(r / sy))];
    return Array.from({ length: cols }, (_, c) => (gr[Math.floor(c / sx)] === 'X' ? '#' : ' ')).join('');
  });
}
