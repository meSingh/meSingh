// Generates every SVG in assets/ from data/facts.json (hand-maintained) and data/github.json (fetched).
// GitHub renders README SVGs inside <img>: no scripts, no external fetches, but CSS keyframes, SMIL
// and @font-face data URIs all work. Everything below is self-contained.
//
// Two images: the ink banner (the profile's header image) and the Still running box, drawn with GitHub's own
// Primer colours and geometry so it reads as part of the page. Everything else is native markdown or a
// default card from the standard tools.
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



// ---------- 2. "Still running": a Primer-style box, like GitHub's own status-checks list ----------
// Colours and geometry from GitHub's Primer design system (Box, Box-header, Box-row, octicons), so it reads
// as part of GitHub rather than as a third-party card.
const PRIMER_LIGHT = { bg: '#ffffff', header: '#f6f8fa', border: '#d0d7de', text: '#1f2328', muted: '#57606a', green: '#1a7f37', blue: '#0969da', accentBg: '#dafbe1' };
const PRIMER_DARK  = { bg: '#0d1117', header: '#161b22', border: '#30363d', text: '#e6edf3', muted: '#8b949e', green: '#3fb950', blue: '#58a6ff', accentBg: '#12261e' };
const PRIMER_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`;
const OCT = {
  checkFill: 'M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z',
  dotFill: 'M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  pulse: 'M6 2c.306 0 .582.187.696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742l1.812-4.529A.751.751 0 0 1 6 2Z',
  rocket: 'M14.064 0h.186C15.216 0 16 .784 16 1.75v.186a8.752 8.752 0 0 1-2.564 6.186l-.458.459c-.314.314-.641.616-.979.904v3.207c0 .608-.315 1.172-.833 1.49l-2.774 1.707a.749.749 0 0 1-1.11-.418l-.954-3.102a1.214 1.214 0 0 1-.145-.125L3.754 9.816a1.218 1.218 0 0 1-.124-.145L.528 8.717a.749.749 0 0 1-.418-1.11l1.71-2.774A1.748 1.748 0 0 1 3.31 4h3.204c.288-.338.59-.665.904-.979l.459-.458A8.749 8.749 0 0 1 14.064 0ZM8.938 3.623h-.002l-.458.458c-.76.76-1.437 1.598-2.02 2.5l-1.5 2.317 2.143 2.143 2.317-1.5c.902-.583 1.74-1.26 2.499-2.02l.459-.458a7.25 7.25 0 0 0 2.123-5.127V1.75a.25.25 0 0 0-.25-.25h-.186a7.249 7.249 0 0 0-5.125 2.123ZM3.56 14.56c-.732.732-2.334 1.045-3.005 1.148a.234.234 0 0 1-.201-.064.234.234 0 0 1-.064-.201c.103-.671.416-2.273 1.15-3.003a1.502 1.502 0 1 1 2.12 2.12Zm6.94-3.935c-.088.06-.177.118-.266.175l-2.35 1.521.548 1.783 1.949-1.2a.25.25 0 0 0 .119-.213ZM3.678 8.116 5.2 5.766c.058-.09.117-.178.176-.266H3.309a.25.25 0 0 0-.213.119l-1.2 1.95ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
};
function stillRunning(P) {
  const role = facts.now.find(n => n.count);
  const month = (s) => ym(s).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const dur = (since) => { const e = elapsed(since); return `${e.y} yr${e.y === 1 ? '' : 's'} ${e.m} mo${e.m === 1 ? '' : 's'}`; };
  const rows = [
    ...facts.still_running.map(r => ({ icon: 'checkFill', color: P.green, name: r.what, note: r.detail, right: `Active · ${dur(r.since)}`, since: `since ${month(r.since)}` })),
    { icon: 'rocket', color: P.blue, name: role.v, note: 'current engagement', right: `Day ${daysSince(role.since).toLocaleString('en-US')}`, since: `since ${month(role.since)}` },
  ];
  const w = 896, headerH = 44, rowH = 52, footerH = 40;
  const h = headerH + rows.length * rowH + footerH;
  let body = `<style>
  text { font-family: ${PRIMER_FONT}; }
  .h { font-size: 14px; font-weight: 600; fill: ${P.text} }
  .hm { font-size: 12px; fill: ${P.muted} }
  .name { font-size: 14px; font-weight: 600; fill: ${P.text} }
  .note { font-size: 12px; fill: ${P.muted} }
  .right { font-size: 13px; font-weight: 600; fill: ${P.text} }
  .since { font-size: 12px; fill: ${P.muted} }
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="${P.bg}" stroke="${P.border}"/>
<path d="M0.5 6.5a6 6 0 0 1 6-6h${w - 13}a6 6 0 0 1 6 6v${headerH - 6.5}h-${w - 1}z" fill="${P.header}"/>
<line x1="0.5" y1="${headerH}" x2="${w - .5}" y2="${headerH}" stroke="${P.border}"/>
<g transform="translate(16, ${headerH / 2 - 8})"><path fill="${P.muted}" d="${OCT.pulse}"/></g>
<text x="40" y="${headerH / 2 + 5}" class="h">Still running</text>
<text x="${w - 16}" y="${headerH / 2 + 5}" text-anchor="end" class="hm">${rows.length} systems · updated ${esc(gh.fetched)}</text>`;
  rows.forEach((r, i) => {
    const y = headerH + i * rowH;
    body += `
<g transform="translate(0, ${y})">
  ${i ? `<line x1="0.5" y1="0" x2="${w - .5}" y2="0" stroke="${P.border}"/>` : ''}
  <g transform="translate(16, ${rowH / 2 - 8})"><path fill="${r.color}" d="${OCT[r.icon]}"/></g>
  <text x="44" y="${rowH / 2 - 2}" class="name">${esc(r.name)}</text>
  <text x="44" y="${rowH / 2 + 15}" class="note">${esc(r.note)}</text>
  <text x="${w - 16}" y="${rowH / 2 - 2}" text-anchor="end" class="right" fill="${r.color}">${esc(r.right)}</text>
  <text x="${w - 16}" y="${rowH / 2 + 15}" text-anchor="end" class="since">${esc(r.since)}</text>
</g>`;
  });
  const fy = headerH + rows.length * rowH;
  body += `
<line x1="0.5" y1="${fy}" x2="${w - .5}" y2="${fy}" stroke="${P.border}"/>
<text x="16" y="${fy + footerH / 2 + 4}" class="note"><tspan class="right" fill="${P.text}">${gh.contributions.toLocaleString('en-US')}</tspan> contributions in the last year${gh.scope === 'public' && gh.privateContributions > 0 ? ` · ${Math.round(gh.privateContributions / gh.contributions * 100)}% in private repositories` : ''}</text>
<text x="${w - 16}" y="${fy + footerH / 2 + 4}" text-anchor="end" class="note">The integrations core built at Shiprocket in 2016 is still the hub today.</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="titleId">
<title id="titleId">Still running: ${esc(rows.map(r => `${r.name}, ${r.right}`).join('; '))}</title>
${body}
</svg>
`;
}

// ---------- write ----------
mkdirSync('assets', { recursive: true });
const out = {
  'hero': hero(INK), 'hero-dark': hero(INK_ON_DARK),
  'still-running-box': stillRunning(PRIMER_LIGHT), 'still-running-box-dark': stillRunning(PRIMER_DARK),
};
for (const [name, svg] of Object.entries(out)) writeFileSync(`assets/${name}.svg`, svg);

console.log(`wrote ${Object.keys(out).length} SVGs to assets/`);
