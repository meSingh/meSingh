// Generates every SVG in assets/ from data/facts.json (hand-maintained) and data/github.json (fetched).
// GitHub renders README SVGs inside <img>: no scripts, no external fetches, but CSS keyframes and @font-face
// data URIs work. Everything below is self-contained.
//
// Profile v6 (3 Nov 2026). No banner. Transparent pieces placed between the paragraphs, in the language of the
// LinkedIn slides (the orange dot dither, Geist, mono caps):
//   strip      a dither rule, dense orange at the left dissolving to nothing
//   status     a row of chips: the roles, the two numbers, the live TWINii day count last
//   social     brand buttons for msingh.com, LinkedIn and X, each wrapped in its link in the README
//   offers     How I can help as three calm columns: on your team, one-time, how it starts
//   button     the call to action as a real button
//   years      sixteen years as sixteen blocks, the last six in orange
//   heatmap    the last year of contributions as GitHub's own calendar grid, in orange
//   activity   the same year as thin bars (kept as the alternative)
//   capabilities four columns, the vocabulary of the work
// Each piece has a light and a dark variant (text colours follow GitHub's Primer themes).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const facts = JSON.parse(readFileSync('data/facts.json', 'utf8'));
const gh = JSON.parse(readFileSync('data/github.json', 'utf8'));
const FONT = readFileSync('scripts/geist-fontface.css', 'utf8');
const FAVICON = readFileSync('scripts/favicon.svg', 'utf8').replace(/<svg[^>]*>|<\/svg>/g, ''); // the site's own icon, 32 x 32
const NOW = new Date(gh.fetched + 'T12:00:00Z');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LIGHT = { fg: '#1f2328', muted: '#59636e', faint: 'rgba(31,35,40,.38)', border: '#d1d9e0', chip: '#f6f8fa', card: '#ffffff', acc: '#d9600a', ember: '#b8520a', bar: '#1f2328', cell: '#eaeef2' };
const DARK = { fg: '#f0f6fc', muted: '#9198a1', faint: 'rgba(240,246,252,.35)', border: '#3d444d', chip: '#151b23', card: '#0d1117', acc: '#ff7a1a', ember: '#8a3d0c', bar: '#f0f6fc', cell: '#1f2731' };

function ym(s) { const [y, m] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)); }
const daysSince = (s) => Math.floor((NOW - ym(s)) / 86400000);

const W = 1280;
function svg({ w = W, h, body, title, css = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs><style>
${FONT}
text{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.mono{font-family:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style></defs>
${body}
</svg>
`;
}
const lines = (x, y, arr, { size = 14, lh = 22, fill, weight = 400 } = {}) => arr.map((t, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(t)}</text>`).join('');

// ---------- 1. the strip ----------
const B8 = [[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]];
function strip(T, { h = 24, px = 6, x1 = 1000, power = 1.4 } = {}) {
  let dots = '';
  for (let y = 0; y < h; y += px) for (let x = 0; x < x1; x += px) {
    const v = Math.pow(Math.max(0, 1 - x / x1), power), th = (B8[(y / px) & 7][(x / px) & 7] + 0.5) / 64;
    const c = v > th ? T.acc : v * 1.9 > th ? T.ember : null;
    if (c) dots += `<circle cx="${x + px / 2}" cy="${y + px / 2}" r="${(px * 0.36).toFixed(1)}" fill="${c}"/>`;
  }
  return svg({ h, body: dots, title: 'A rule of orange dots fading out to the right.' });
}

// ---------- 2. status: the roles first, the live chip last ----------
function status(T) {
  const role = facts.now.find(n => n.count);
  const chips = [...facts.chips.map((t, i) => ({ text: t, strong: i === 0 })), { live: true, text: `Currently ${role.v}  ·  day ${daysSince(role.since).toLocaleString('en-US')}` }];
  const h = 40, pad = 16, gap = 10, cw = 8.75;
  let x = 0, body = '';
  for (const c of chips) {
    const w = Math.round(pad * 2 + c.text.length * cw + (c.live ? 16 : 0));
    body += `<rect x="${x + .5}" y="4.5" width="${w - 1}" height="${h - 9}" rx="${(h - 9) / 2}" fill="${T.chip}" stroke="${T.border}"/>`;
    if (c.live) body += `<circle cx="${x + pad + 4}" cy="${h / 2}" r="4" fill="${T.acc}"><animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/></circle>`;
    body += `<text x="${x + pad + (c.live ? 16 : 0)}" y="${h / 2 + 4.5}" class="mono" font-size="13" font-weight="500" letter-spacing=".06em" fill="${c.strong || c.live ? T.fg : T.muted}">${esc(c.text)}</text>`;
    x += w + gap;
  }
  return svg({ w: Math.max(x - gap, 1), h, body, title: chips.map(c => c.text).join('; ') });
}

// ---------- 3. social: brand buttons, the way the platforms draw their own ----------
const LOGO = {
  linkedin: `<rect x="2" y="9" width="4" height="13"/><circle cx="4" cy="4.5" r="2.5"/><path d="M9 9h3.8v1.8c.6-1.1 2-2.1 4.1-2.1 4.3 0 5.1 2.8 5.1 6.5V22h-4v-6c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V22H9z"/>`,
  x: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
  site: `<text x="12" y="19.5" text-anchor="middle" font-family="Geist" font-weight="700" font-size="24" letter-spacing="-.04em" fill="currentColor">m<tspan fill="var(--dot, currentColor)">.</tspan></text>`,
};
function social(T, { brand, label, sub, site }) {
  const spec = { site: site || { bg: T.acc, fg: '#ffffff', dot: '#ffffff' }, linkedin: { bg: '#0A66C2', fg: '#ffffff' }, x: { bg: T === DARK ? '#f0f6fc' : '#0f1419', fg: T === DARK ? '#0f1419' : '#ffffff' } }[brand];
  const h = 48, w = Math.round(64 + Math.max(label.length * 9.4, sub.length * 7.2) + 20);
  const body = `<rect x="${spec.border ? .5 : 0}" y="${spec.border ? .5 : 0}" width="${spec.border ? w - 1 : w}" height="${spec.border ? h - 1 : h}" rx="10" fill="${spec.bg}"${spec.border ? ` stroke="${spec.border}"` : ''}/>
<g transform="translate(18 12)" fill="${spec.fg}" color="${spec.fg}" style="--dot:${spec.dot || spec.fg}">${LOGO[brand]}</g>
<text x="56" y="${h / 2 - 2}" font-size="15" font-weight="600" letter-spacing="-.01em" fill="${spec.fg}">${esc(label)}</text>
<text x="56" y="${h / 2 + 15}" class="mono" font-size="11.5" letter-spacing=".02em" fill="${spec.fg}" fill-opacity=".8">${esc(sub)}</text>`;
  return svg({ w, h, body, title: `${label}: ${sub}` });
}

// ---------- 4. offers: How I can help as a route with three stations ----------
// Transparent ground. One orange line runs left to right through three stations: the call is where you
// board, one engagement, then on your team, which is how teams move in practice. Linked to how-i-help.
function offers(T) {
  const o = facts.offers, w = W, h = 250, y = 118;
  const xs = [100, 520, 940];
  let b = `<text x="0" y="24" class="mono" font-size="12" font-weight="500" letter-spacing=".16em" fill="${T.acc}">HOW I CAN HELP</text>
<text x="${w}" y="24" text-anchor="end" font-size="13" font-weight="600" fill="${T.acc}">${esc(o.lead)}  →</text>
<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${T.acc}" stroke-width="3" stroke-linecap="round"/>
<line x1="0" y1="${y}" x2="${xs[0] - 22}" y2="${y}" stroke="${T.border}" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round"/>`;
  for (let x = 40; x < w; x += 40) if (Math.min(...xs.map(s => Math.abs(s - x))) > 30) b += `<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}" stroke="${T.acc}" stroke-opacity=".5"/>`;
  o.stops.forEach((st, i) => {
    const x = xs[i], last = i === o.stops.length - 1;
    b += `<circle cx="${x}" cy="${y}" r="14" fill="${T.card}" stroke="${T.acc}" stroke-width="3"/>${last ? `<circle cx="${x}" cy="${y}" r="6" fill="${T.acc}"/>` : ''}
<text x="${x - 26}" y="${y - 54}" class="mono" font-size="11" letter-spacing=".14em" fill="${T.acc}">${st.n}</text>
<text x="${x - 26}" y="${y - 30}" font-size="20" font-weight="600" letter-spacing="-.015em" fill="${T.fg}">${esc(st.h)}</text>
<text x="${x - 26 + st.h.length * 11 + 14}" y="${y - 30}" class="mono" font-size="11" letter-spacing=".12em" fill="${T.muted}">${esc(st.tag)}</text>
${lines(x - 26, y + 40, st.lines, { size: 13, lh: 19, fill: T.muted })}`;
  });
  return svg({ h, body: b, title: `How I can help: ${o.stops.map(s => s.h).join(', then ')}.` });
}

// ---------- 4b. offers as three tickets with a perforated stub (the alternative) ----------
function tickets(T) {
  const o = facts.offers, w = W, h = 206, gap = 20, tw = (w - gap * 2) / 3, th = 166, top = 30, stub = 80, r = 9;
  let b = `<text x="0" y="16" class="mono" font-size="13" font-weight="500" letter-spacing=".16em" fill="${T.acc}">HOW I CAN HELP</text>
<text x="${w}" y="16" text-anchor="end" font-size="14" font-weight="600" fill="${T.acc}">${esc(o.lead)}  →</text>`;
  o.stops.forEach((st, i) => {
    const x = i * (tw + gap), lead = false; // all three tickets in the same quiet colourway (Mandeep, 3 Nov)
    const bg = lead ? T.acc : T.card, fg = lead ? '#ffffff' : T.fg, mu = lead ? 'rgba(255,255,255,.8)' : T.muted, bd = lead ? T.acc : T.border;
    // the ticket outline with two notches at the perforation
    const nx = x + stub, cy1 = top, cy2 = top + th;
    const d = `M${x + r} ${top} H${nx - r} A${r} ${r} 0 0 0 ${nx + r} ${top} H${x + tw - r} Q${x + tw} ${top} ${x + tw} ${top + r} V${cy2 - r} Q${x + tw} ${cy2} ${x + tw - r} ${cy2} H${nx + r} A${r} ${r} 0 0 0 ${nx - r} ${cy2} H${x + r} Q${x} ${cy2} ${x} ${cy2 - r} V${top + r} Q${x} ${top} ${x + r} ${top} Z`;
    b += `<path d="${d}" fill="${bg}" stroke="${bd}"/>
<line x1="${nx}" y1="${top + r + 4}" x2="${nx}" y2="${cy2 - r - 4}" stroke="${lead ? 'rgba(255,255,255,.6)' : T.border}" stroke-dasharray="3 5"/>
<text x="${x + stub / 2}" y="${top + th / 2 + 15}" text-anchor="middle" font-size="42" font-weight="600" letter-spacing="-.04em" fill="${lead ? '#ffffff' : 'none'}" stroke="${lead ? 'none' : T.acc}" stroke-width="1.1">${st.n}</text>
<text x="${nx + 22}" y="${top + 32}" class="mono" font-size="12" letter-spacing=".14em" fill="${mu}">${esc(st.tag)}</text>
<text x="${nx + 22}" y="${top + 64}" font-size="23" font-weight="600" letter-spacing="-.02em" fill="${fg}">${esc(st.h)}</text>
${lines(nx + 22, top + 94, st.short, { size: 14.5, lh: 21, fill: mu })}`;
  });
  return svg({ h, body: b, title: `How I can help: ${o.stops.map(s => s.h).join(', then ')}.` });
}

// ---------- 5. button: the call to action ----------
const CAL = 'M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z';
function button(T, { label, w = 300, h = 52 }) {
  // Ink on light, white on dark (Mandeep, 3 Nov); a calendar at the left, an orange arrow at the right.
  const dark = T === DARK, fill = dark ? '#f4f2ee' : '#1b1f23', fg = dark ? '#1b1f23' : '#f4f2ee', cy = (h - 3) / 2;
  // Flat: no base rect, no highlight (Mandeep, 3 Nov).
  const b = `<rect x=".5" y=".5" width="${w - 1}" height="${h - 4}" rx="10" fill="${fill}" stroke="${dark ? '#d8d5cd' : fill}"/>
<g transform="translate(22 ${cy - 10}) scale(1.25)"><path d="${CAL}" fill="${fg}"/></g>
<text x="58" y="${cy + 6}" font-size="16" font-weight="600" letter-spacing="-.01em" fill="${fg}">${esc(label)}</text>
<text x="${w - 24}" y="${cy + 6}" text-anchor="middle" font-size="16" font-weight="600" fill="${T.acc}">→</text>`;
  return svg({ w, h, body: b, title: label });
}
function ghost(T, { label, w = 236, h = 52 }) {
  // Border only, no fill; the site's "m." glyph at the left.
  const cy = (h - 3) / 2;
  const b = `<rect x=".5" y=".5" width="${w - 1}" height="${h - 4}" rx="10" fill="none" stroke="${T.border}"/>
<text x="31" y="${cy + 8}" text-anchor="middle" font-family="Geist" font-weight="700" font-size="22" letter-spacing="-.04em" fill="${T.fg}">m<tspan fill="${T.acc}">.</tspan></text>
<text x="58" y="${cy + 6}" font-size="16" font-weight="600" letter-spacing="-.01em" fill="${T.fg}">${esc(label)}</text>
<text x="${w - 24}" y="${cy + 6}" text-anchor="middle" font-size="16" font-weight="600" fill="${T.muted}">→</text>`;
  return svg({ w, h, body: b, title: label });
}

// ---------- 6. terms: the advanced terms as a slow marquee ----------
function terms(T) {
  const line = facts.terms.join('   ·   ');
  const h = 36, adv = 9.3, len = Math.round((line.length + 7) * adv);
  const text = (x) => `<text x="${x}" y="${h / 2 + 5}" class="mono" font-size="14" font-weight="500" letter-spacing=".14em" fill="${T.muted}">${esc(line)}<tspan fill="${T.acc}">   ·   </tspan></text>`;
  const body = `<defs><linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".06" stop-color="#fff"/><stop offset=".94" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="m"><rect width="${W}" height="${h}" fill="url(#fade)"/></mask></defs>
<g mask="url(#m)"><g class="run">${text(0)}${text(len)}${text(len * 2)}</g></g>`;
  return svg({ h, body, title: facts.terms.join(', '), css: `.run{animation:run ${Math.round(len / 28)}s linear infinite}@keyframes run{to{transform:translateX(-${len}px)}}` });
}

// ---------- 7. heatmap: the calendar grid, in orange ----------
function heatmap(T) {
  const weeks = gh.weeks, cols = weeks.length, cell = 20, gap = 4, step = cell + gap, top = 28, left = 0;
  const w = W, scale = (w - left) / (cols * step - gap), max = Math.max(1, ...weeks.flat());
  let b = '';
  const first = new Date(gh.firstDay + 'T00:00:00Z');
  weeks.forEach((wk, i) => wk.forEach((v, j) => {
    const x = left + i * step * scale, y = top + j * step * scale, s = cell * scale;
    const t = v ? Math.sqrt(v / max) : 0;
    b += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="3" fill="${v ? T.acc : T.cell}" fill-opacity="${v ? (0.25 + 0.75 * t).toFixed(2) : 1}"/>`;
  }));
  let lastMonth = -1;
  weeks.forEach((_, i) => { const d = new Date(first.getTime() + i * 7 * 86400000); if (d.getUTCMonth() !== lastMonth) { lastMonth = d.getUTCMonth(); if (i > 0 && i < cols - 2) b += `<text x="${(left + i * step * scale).toFixed(1)}" y="16" class="mono" font-size="11" letter-spacing=".08em" fill="${T.muted}">${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</text>`; } });
  const h = top + 7 * step * scale + 34;
  b += `<text x="0" y="${h - 6}" class="mono" font-size="12" letter-spacing=".1em" fill="${T.muted}"><tspan fill="${T.fg}" font-weight="500">${gh.contributions.toLocaleString('en-US')}</tspan> CONTRIBUTIONS IN THE LAST YEAR</text>
<text x="${w}" y="${h - 6}" text-anchor="end" class="mono" font-size="12" letter-spacing=".1em" fill="${T.muted}">${gh.allTimeCommits.toLocaleString('en-US')} COMMITS ALL TIME · UPDATED ${esc(gh.fetched)}</text>`;
  return svg({ h: Math.round(h), body: b, title: `${gh.contributions} contributions in the last year.` });
}

// ---------- 8. activity: thin bars (the alternative) ----------
function activity(T) {
  const weeks = gh.weeks.map(w => w.reduce((a, b) => a + b, 0));
  const sq = weeks.map(Math.sqrt), max = Math.max(1, ...sq), h = 96, top = 8, base = 60, bw = 14, gap = (W - weeks.length * bw) / (weeks.length - 1);
  let bars = '';
  weeks.forEach((v, i) => {
    const bh = Math.max(2, Math.round((sq[i] / max) * (base - top))), recent = i >= weeks.length - 8;
    bars += `<rect x="${(i * (bw + gap)).toFixed(1)}" y="${base - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${recent ? T.acc : T.bar}" fill-opacity="${recent ? .95 : .2 + .5 * (sq[i] / max)}"/>`;
  });
  const body = `${bars}<rect x="0" y="${base}" width="${W}" height="1" fill="${T.faint}"/>
<text x="0" y="${h - 6}" class="mono" font-size="12" letter-spacing=".1em" fill="${T.muted}"><tspan fill="${T.fg}" font-weight="500">${gh.contributions.toLocaleString('en-US')}</tspan> CONTRIBUTIONS IN THE LAST YEAR</text>
<text x="${W}" y="${h - 6}" text-anchor="end" class="mono" font-size="12" letter-spacing=".1em" fill="${T.muted}">${gh.allTimeCommits.toLocaleString('en-US')} COMMITS ALL TIME · UPDATED ${esc(gh.fetched)}</text>`;
  return svg({ h, body, title: `${gh.contributions} contributions in the last year.` });
}

// ---------- 9. stack: the layers of an AI system as a staircase of rows ----------
// Transparent ground. Four rows step down and to the right, top layer first; one orange line takes the
// stairs with them. Typographic, not a diagram: an index of the layers and what I own in each.
function stack(T) {
  const L = facts.stack.layers, w = W, step = 44, indent = 72, y0 = 72, h = y0 + L.length * step + 10;
  let b = `<text x="0" y="24" class="mono" font-size="12" font-weight="500" letter-spacing=".16em" fill="${T.acc}">THE STACK I ARCHITECT</text>
<text x="${w}" y="24" text-anchor="end" class="mono" font-size="11" letter-spacing=".1em" fill="${T.muted}">WHAT I OWN IN EACH LAYER</text>`;
  // the stair: along each row's rule for one indent, then down to the next row
  let path = `M0 ${y0 + 12}`;
  L.forEach((l, i) => {
    const x = i * indent, y = y0 + i * step;
    path += ` H${x + indent}` + (i < L.length - 1 ? ` V${y + step + 12}` : '');
    b += `<line x1="${x}" y1="${y + 12}" x2="${w}" y2="${y + 12}" stroke="${T.border}"/>
<text x="${x + 14}" y="${y}" class="mono" font-size="11" letter-spacing=".14em" fill="${T.acc}">0${L.length - i}</text>
<text x="${x + 52}" y="${y + 1}" font-size="17" font-weight="600" letter-spacing="-.015em" fill="${T.fg}">${esc(l.h)}</text>
<text x="${x + 52 + l.h.length * 9.6 + 22}" y="${y + 1}" font-size="14" fill="${T.muted}">${esc(l.items.join(' · '))}</text>`;
  });
  b += `<path d="${path}" fill="none" stroke="${T.acc}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  return svg({ h, body: b, title: `The stack I architect: ${L.map(l => `${l.h} (${l.items.join(', ')})`).join('; ')}.` });
}

// ---------- write ----------
mkdirSync('assets', { recursive: true });
const S = facts.social;
const out = {};
for (const [name, T] of [['', LIGHT], ['-dark', DARK]]) {
  out[`strip${name}`] = strip(T);
  out[`status${name}`] = status(T);
  out[`offers${name}`] = offers(T);
  out[`offers-tickets${name}`] = tickets(T);
  out[`button-call${name}`] = button(T, { label: 'Book a 20-minute call' });
  out[`button-help${name}`] = ghost(T, { label: 'How I can help' });
  // website button colour combinations, for Mandeep to pick from (3 Nov)
  const V = { a: { bg: T.acc, fg: '#ffffff', dot: '#ffffff' }, b: { bg: '#1b1f23', fg: '#f4f2ee', dot: T.acc }, c: { bg: T === DARK ? '#f4f2ee' : '#ffffff', fg: '#1b1f23', dot: T.acc, border: T.border }, d: { bg: '#efede8', fg: '#1b1f23', dot: '#d9600a' } };
  for (const [k, v] of Object.entries(V)) out[`social-site-${k}${name}`] = social(T, { brand: 'site', label: S.site.label, sub: S.site.sub, site: v });
  out[`terms${name}`] = terms(T);
  out[`heatmap${name}`] = heatmap(T);
  out[`activity${name}`] = activity(T);
  out[`stack${name}`] = stack(T);
  out[`social-site${name}`] = social(T, { brand: 'site', label: S.site.label, sub: S.site.sub });
  out[`social-linkedin${name}`] = social(T, { brand: 'linkedin', label: S.linkedin.label, sub: S.linkedin.sub });
  out[`social-x${name}`] = social(T, { brand: 'x', label: S.x.label, sub: S.x.sub });
}
for (const [name, s] of Object.entries(out)) writeFileSync(`assets/${name}.svg`, s);
console.log(`wrote ${Object.keys(out).length} SVGs to assets/`);
