// Generates every SVG in assets/ from data/facts.json (hand-maintained) and data/github.json (fetched).
// GitHub renders README SVGs inside <img>: no scripts, no external fetches, but CSS keyframes, SMIL
// and @font-face data URIs all work. Everything below is self-contained.
//
// Two pieces: the ink banner (the profile's header image) and a "Still running" card drawn in the
// github-readme-stats house style so it sits beside the standard cards. Everything else is native markdown
// or a default card from the standard profile tools.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const facts = JSON.parse(readFileSync('data/facts.json', 'utf8'));
const gh = JSON.parse(readFileSync('data/github.json', 'utf8'));
const FONT = readFileSync('scripts/geist-fontface.css', 'utf8');
const NOW = new Date(gh.fetched + 'T12:00:00Z');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function lift(d) { return (hex) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.min(255, v + d); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); }; }

// ---------- themes (Ink & Ivory, from BRAND-SPEC.md) ----------
const INK = {
  stops: ['#0E1218', '#1A2029', '#161C25', '#0C1015'],
  washes: `<rect width="100%" height="100%" fill="url(#warm)"/><rect width="100%" height="100%" fill="url(#cool)"/><rect width="100%" height="100%" fill="url(#ground)"/>`,
  grain: .9, border: '#E9DBC4', borderA: .12, hair: '#E9DBC4', hairA: .16, lead: '#D9C49E', leadA: .7, rule: '#E9DBC4', ruleA: .09, edge: '#E3D1AC', edgeA: .28,
  text: '#F6F3ED', dim: '#C4C0B6', accent: '#E3D1AC', accent2: '#E8D6B2', micro: '#C3BCA9', proof: '#CBC5B3', sep: '#7E7A6E', wm: '#F1ECE2', faint: '#8F8A7E',
};
// GitHub dark chrome is #0d1117: lift the floor six points and strengthen the hairline so the card keeps an edge
const INK_ON_DARK = { ...INK, stops: INK.stops.map(lift(6)), borderA: .22 };
const PAPER = {
  stops: ['#FCFAF6', '#F7F4ED', '#F4F0E7', '#EFEADF'],
  washes: `<rect width="100%" height="100%" fill="url(#paperwarm)"/>`,
  grain: .5, border: '#0E1218', borderA: .14, hair: '#0E1218', hairA: .14, lead: '#9A7F4A', leadA: .9, rule: '#0E1218', ruleA: .08, edge: '#9A7F4A', edgeA: .35,
  text: '#0E1218', dim: '#4E4A42', accent: '#8E7440', accent2: '#7C6436', micro: '#6B665B', proof: '#3E3A33', sep: '#A9A392', wm: '#0E1218', faint: '#7A7568',
};

// ---------- date helpers ----------
function ym(s) { const [y, m] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)); }
function elapsed(sinceYM) {
  const a = ym(sinceYM);
  const months = (NOW.getUTCFullYear() - a.getUTCFullYear()) * 12 + (NOW.getUTCMonth() - a.getUTCMonth());
  return { y: Math.floor(months / 12), m: months % 12 };
}
function daysSince(sinceYM) { return Math.floor((NOW - ym(sinceYM)) / 86400000); }

// ---------- frame ----------
function frame(T, { w, h, body, extraCss = '', title }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <style>
${FONT}
    text{font-family:Geist,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .wm{font-size:22px;font-weight:600;letter-spacing:.22em;fill:${T.wm}}
    .k{font-size:12px;font-weight:500;letter-spacing:.16em;fill:${T.sep}}
    .v{font-size:17px;font-weight:500;fill:${T.proof}}
    .rise{opacity:0;animation:rise .8s cubic-bezier(.2,.7,.2,1) forwards}
    @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .draw{stroke-dasharray:1 1;animation:draw 1.4s cubic-bezier(.4,0,.2,1) forwards}
    @keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
${extraCss}
    @media (prefers-reduced-motion: reduce){.rise,.pop,.draw{opacity:1;animation:none;stroke-dashoffset:0}.sweep,.bar{animation:none}}
  </style>
  <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${T.stops[0]}"/><stop offset=".42" stop-color="${T.stops[1]}"/><stop offset=".74" stop-color="${T.stops[2]}"/><stop offset="1" stop-color="${T.stops[3]}"/>
  </linearGradient>
  <radialGradient id="warm" cx="84%" cy="-4%" r="90%"><stop offset="0" stop-color="#E4D2B2" stop-opacity=".13"/><stop offset=".45" stop-color="#E4D2B2" stop-opacity=".03"/><stop offset=".7" stop-color="#E4D2B2" stop-opacity="0"/></radialGradient>
  <radialGradient id="cool" cx="4%" cy="2%" r="70%"><stop offset="0" stop-color="#7E94B4" stop-opacity=".085"/><stop offset="1" stop-color="#7E94B4" stop-opacity="0"/></radialGradient>
  <radialGradient id="ground" cx="12%" cy="118%" r="60%"><stop offset="0" stop-color="#E4D2B2" stop-opacity=".09"/><stop offset="1" stop-color="#E4D2B2" stop-opacity="0"/></radialGradient>
  <radialGradient id="paperwarm" cx="90%" cy="0%" r="80%"><stop offset="0" stop-color="#E3D1AC" stop-opacity=".45"/><stop offset=".6" stop-color="#E3D1AC" stop-opacity="0"/></radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter>
  <clipPath id="card"><rect width="${w}" height="${h}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${w}" height="${h}" fill="url(#field)"/>
  ${T.washes}
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="${T.grain}"/>
${body}
  <rect x="0" y="${h - 1}" width="${w}" height="1" fill="${T.edge}" opacity="${T.edgeA}"/>
</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="13.5" fill="none" stroke="${T.border}" stroke-opacity="${T.borderA}"/>
</svg>
`;
}

const hairline = (T, x1, x2, y, delay = 0) => `
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${T.hair}" stroke-opacity="${T.hairA}" pathLength="1" class="draw" style="animation-delay:${delay}s"/>
  <line x1="${x1}" y1="${y}" x2="${x1 + 152}" y2="${y}" stroke="${T.lead}" stroke-opacity="${T.leadA}" pathLength="1" class="draw" style="animation-delay:${delay}s"/>`;
const rule = (T, x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${T.rule}" stroke-opacity="${T.ruleA}"/>`;

// ---------- 1. hero (always ink) ----------
function hero(T) {
  const [l1, l2a, l2b] = facts.statement;
  const proof = facts.proof_row.map(esc).join(`<tspan fill="${T.sep}">  ·  </tspan>`);
  const y0 = 386;
  let d = `M72 ${y0}`;
  for (let x = 72; x < 1208; x += 96) d += ` H${x + 52} l7 -16 l7 30 l7 -14 H${x + 96}`;
  const body = `
  <text x="72" y="62" class="wm rise" style="animation-delay:.05s">MANDEEP SINGH<tspan fill="${T.accent}">.</tspan></text>
  <text x="1208" y="62" text-anchor="end" font-size="18" font-weight="500" fill="${T.micro}" class="rise" style="animation-delay:.2s">${esc(facts.role_line)}</text>
  ${hairline(T, 72, 1208, 96, .25)}
  <text x="72" y="192" font-size="60" font-weight="600" letter-spacing="-1.3" fill="${T.text}" class="rise" style="animation-delay:.5s">${esc(l1)}</text>
  <text x="72" y="262" font-size="60" font-weight="600" letter-spacing="-1.3" class="rise" style="animation-delay:.8s"><tspan fill="${T.dim}" font-weight="500">${esc(l2a)}</tspan> <tspan fill="${T.accent}">${esc(l2b)}</tspan></text>
  <text x="72" y="342" font-size="19" font-weight="500" fill="${T.proof}" class="rise" style="animation-delay:1.2s">${proof}</text>
  <text x="1208" y="342" text-anchor="end" font-size="21" font-weight="600" fill="${T.accent2}" class="rise" style="animation-delay:1.3s">${esc(facts.site)}</text>
  <path d="${d}" fill="none" stroke="${T.hair}" stroke-opacity=".10" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="${T.accent}" stroke-opacity=".75" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" pathLength="1000" stroke-dasharray="90 910" class="sweep"/>`;
  return frame(T, { w: 1280, h: 400, body, title: `${facts.name}. ${facts.statement.join(' ')}`,
    extraCss: `.sweep{animation:sweep 7s linear infinite;animation-delay:1.6s;stroke-dashoffset:1000}@keyframes sweep{from{stroke-dashoffset:1000}to{stroke-dashoffset:-1000}}` });
}



// ---------- 2. "Still running" card, in github-readme-stats' own look (default / github_dark) ----------
const GRS_DEFAULT = { title: '#2f80ed', icon: '#4c71f2', text: '#434d58', bg: '#fffefe', border: '#e4e2e2' };
const GRS_DARK = { title: '#58a6ff', icon: '#1f6feb', text: '#c9d1d9', bg: '#0d1117', border: '#30363d' };
const GRS_FONT = `'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif`;
const OCT = {
  people: 'M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z',
  clock: 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z',
  commit: 'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
  pulse: 'M6 2c.306 0 .582.187.696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742l1.812-4.529A.751.751 0 0 1 6 2Z',
};
function stillRunning(G) {
  const role = facts.now.find(n => n.count);
  const dur = (since) => { const e = elapsed(since); return `${e.y} yrs ${e.m} mos`; };
  const month = (s) => ym(s).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const rows = [
    ['people', role.v, `day ${daysSince(role.since).toLocaleString('en-US')} · since ${month(role.since)}`],
    ...facts.still_running.map(r => ['clock', r.what, `${dur(r.since)} in production`]),
    ['commit', 'Contributions, last year', gh.contributions.toLocaleString('en-US')],
  ];
  const w = 495, h = 55 + rows.length * 25 + 20;
  let body = `<style>
  .header { font: 600 18px ${GRS_FONT}; fill: ${G.title} }
  .stat { font: 600 14px ${GRS_FONT}; fill: ${G.text} }
  .gray { font: 400 11px ${GRS_FONT}; fill: ${G.text}; opacity: .7 }
  .icon { fill: ${G.icon} }
</style>
<rect x="0.5" y="0.5" rx="4.5" width="${w - 1}" height="${h - 1}" stroke="${G.border}" fill="${G.bg}"/>
<g transform="translate(25, 35)"><svg class="icon" x="0" y="-14" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="${OCT.pulse}"/></svg><text x="25" y="0" class="header">Still running</text><text x="${w - 25}" y="0" text-anchor="end" class="gray">updated ${esc(gh.fetched)}</text></g>
<g transform="translate(0, 55)">`;
  rows.forEach(([ic, label, value], i) => {
    body += `\n  <g transform="translate(25, ${i * 25})"><svg class="icon" viewBox="0 0 16 16" width="16" height="16" x="0" y="-1"><path fill-rule="evenodd" d="${OCT[ic]}"/></svg><text class="stat" x="25" y="12.5">${esc(label)}</text><text class="stat" x="${w - 25}" y="12.5" text-anchor="end">${esc(value)}</text></g>`;
  });
  body += '\n</g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img" aria-labelledby="titleId">
<title id="titleId">Still running: ${esc(rows.map(r => `${r[1]} ${r[2]}`).join('; '))}</title>
${body}
</svg>
`;
}

// ---------- write ----------
mkdirSync('assets', { recursive: true });
const out = {
  'hero': hero(INK), 'hero-dark': hero(INK_ON_DARK),
  'still-running': stillRunning(GRS_DEFAULT), 'still-running-dark': stillRunning(GRS_DARK),
};
for (const [name, svg] of Object.entries(out)) writeFileSync(`assets/${name}.svg`, svg);
console.log(`wrote ${Object.keys(out).length} SVGs to assets/`);
