// Generates every SVG in assets/ from data/facts.json (hand-maintained) and data/github.json (fetched).
// GitHub renders README SVGs inside <img>: no scripts, no external fetches, but CSS keyframes, SMIL
// and @font-face data URIs all work. Everything below is self-contained.
//
// Two themes. The hero is always the ink banner (the one branded object on the page). Every other card
// is ivory paper in light chrome and ink in dark chrome, so it sits naturally beside GitHub's own cards.
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
  cellOff: '#E9DBC4', cellOn: '#E3D1AC', alpha: [.07, .26, .46, .70, .98],
};
// GitHub dark chrome is #0d1117: lift the floor six points and strengthen the hairline so the card keeps an edge
const INK_ON_DARK = { ...INK, stops: INK.stops.map(lift(6)), borderA: .22 };
const PAPER = {
  stops: ['#FCFAF6', '#F7F4ED', '#F4F0E7', '#EFEADF'],
  washes: `<rect width="100%" height="100%" fill="url(#paperwarm)"/>`,
  grain: .5, border: '#0E1218', borderA: .14, hair: '#0E1218', hairA: .14, lead: '#9A7F4A', leadA: .9, rule: '#0E1218', ruleA: .08, edge: '#9A7F4A', edgeA: .35,
  text: '#0E1218', dim: '#4E4A42', accent: '#8E7440', accent2: '#7C6436', micro: '#6B665B', proof: '#3E3A33', sep: '#A9A392', wm: '#0E1218', faint: '#7A7568',
  cellOff: '#0E1218', cellOn: '#8E7440', alpha: [.06, .22, .42, .66, .95],
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

// ---------- 2. ledger: now / still running / live numbers ----------
function ledger(T) {
  const colL = 72, colLR = 584, colM = 656, right = 1208;
  let rows = `<text x="${colL}" y="52" class="k rise" style="animation-delay:.1s">NOW</text>${hairline(T, colL, colLR, 62, .1)}`;
  facts.now.forEach((n, j) => {
    const yy = 98 + j * 60, d = .3 + j * .12;
    const sub = n.count ? `day ${daysSince(n.since).toLocaleString('en-GB')} · since ${ym(n.since).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}` : '';
    rows += `
  <text x="${colL}" y="${yy}" class="k rise" style="animation-delay:${d}s">${esc(n.k.toUpperCase())}</text>
  <text x="${colLR}" y="${yy}" text-anchor="end" class="v rise" style="animation-delay:${d}s">${esc(n.v)}</text>
  ${sub ? `<text x="${colLR}" y="${yy + 22}" text-anchor="end" font-size="13" font-weight="500" fill="${T.faint}" class="rise" style="animation-delay:${d + .05}s">${esc(sub)}</text>` : ''}
  ${rule(T, colL, colLR, yy + 34)}`;
  });
  rows += `<text x="${colM}" y="52" class="k rise" style="animation-delay:.1s">STILL RUNNING</text><text x="${right}" y="52" text-anchor="end" class="k rise" style="animation-delay:.1s">UPTIME</text>${hairline(T, colM, right, 62, .1)}`;
  facts.still_running.forEach((s, j) => {
    const yy = 98 + j * 60, e = elapsed(s.since), d = .35 + j * .12;
    rows += `
  <text x="${colM}" y="${yy}" class="v rise" style="animation-delay:${d}s">${esc(s.what)}</text>
  <text x="${colM}" y="${yy + 22}" font-size="13" font-weight="500" fill="${T.faint}" class="rise" style="animation-delay:${d + .05}s">${esc(s.detail)}</text>
  <text x="${right}" y="${yy}" text-anchor="end" font-size="22" font-weight="600" fill="${T.accent}" letter-spacing="-.3" class="rise" style="animation-delay:${d}s">${e.y}<tspan font-size="13" font-weight="500" fill="${T.micro}" letter-spacing=".08em"> Y </tspan>${e.m}<tspan font-size="13" font-weight="500" fill="${T.micro}" letter-spacing=".08em"> M</tspan></text>
  ${rule(T, colM, right, yy + 34)}`;
  });
  const pct = Math.round(gh.privateContributions / gh.contributions * 100);
  const memberFor = elapsed(gh.createdAt.slice(0, 7)).y;
  const b = (s) => `<tspan fill="${T.accent}" font-weight="600">${s}</tspan>`, dot = `<tspan fill="${T.sep}">  ·  </tspan>`;
  rows += hairline(T, colL, right, 292, .9) + `
  <text x="${colL}" y="324" font-size="14" font-weight="500" fill="${T.proof}" class="rise" style="animation-delay:1.05s">${b(gh.contributions.toLocaleString('en-GB'))} contributions in the last year${dot}${b(pct + '%')} of them private${dot}${b(gh.stars)} stars across ${b(gh.publicRepos)} public repos${dot}on GitHub ${b(memberFor)} years</text>
  <text x="${right}" y="324" text-anchor="end" font-size="12" font-weight="500" letter-spacing=".12em" fill="${T.sep}" class="rise" style="animation-delay:1.1s">REGENERATED ${esc(gh.fetched.toUpperCase())}</text>`;
  return frame(T, { w: 1280, h: 352, body: rows, title: 'Now, still running, and live GitHub numbers' });
}

// ---------- 3. contribution calendar ----------
function calendar(T) {
  const cell = 18, gap = 4, step = cell + gap, left = 57, top = 92;
  const weeks = gh.weeks, max = Math.max(1, ...weeks.flat());
  const level = (n) => n === 0 ? 0 : n < max * .12 ? 1 : n < max * .3 ? 2 : n < max * .6 ? 3 : 4;
  let cells = '';
  weeks.forEach((w, wi) => w.forEach((n, di) => {
    const lv = level(n);
    cells += `<rect x="${left + wi * step}" y="${top + di * step}" width="${cell}" height="${cell}" rx="3" fill="${lv ? T.cellOn : T.cellOff}" fill-opacity="${T.alpha[lv]}" class="pop" style="animation-delay:${(wi + di) * 22 + 300}ms"/>`;
  }));
  const first = new Date(gh.firstDay + 'T00:00:00Z');
  let months = '', lastM = -1;
  weeks.forEach((w, wi) => {
    const d = new Date(first.getTime() + wi * 7 * 86400000);
    if (d.getUTCMonth() !== lastM && wi < weeks.length - 2) { lastM = d.getUTCMonth(); months += `<text x="${left + wi * step}" y="${top - 12}" class="k">${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()}</text>`; }
  });
  const pct = Math.round(gh.privateContributions / gh.contributions * 100);
  const fy = top + 7 * step + 40;
  const body = `
  <text x="72" y="52" class="k rise" style="animation-delay:.1s">LAST 12 MONTHS</text>
  <text x="1208" y="52" text-anchor="end" class="k rise" style="animation-delay:.1s">${gh.contributions.toLocaleString('en-GB')} CONTRIBUTIONS · ${pct}% IN PRIVATE REPOSITORIES</text>
  ${hairline(T, 72, 1208, 62, .1)}
  <g class="rise" style="animation-delay:.2s">${months}</g>
  ${cells}
  <text x="72" y="${fy}" font-size="14" font-weight="500" fill="${T.faint}" class="rise" style="animation-delay:1.9s">Most of the work since 2021 is inside client and employer repositories. The graph is the shape of it, not the size.</text>
  <text x="${1208 - 5 * 16 - 10}" y="${fy}" text-anchor="end" class="k rise" style="animation-delay:1.9s">LESS</text>
  ${[0, 1, 2, 3, 4].map((lv) => `<rect x="${1208 - 5 * 16 + lv * 16}" y="${fy - 11}" width="12" height="12" rx="2" fill="${lv ? T.cellOn : T.cellOff}" fill-opacity="${T.alpha[lv]}"/>`).join('')}
  <text x="${1208 + 8}" y="${fy}" class="k rise" style="animation-delay:1.9s">MORE</text>`;
  return frame(T, { w: 1280, h: fy + 30, body, title: `${gh.contributions} contributions in the last year, ${pct}% private`,
    extraCss: `.pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:pop .45s cubic-bezier(.2,.7,.2,1) forwards}@keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}` });
}

// ---------- 4. repo cards ----------
function repoCard(T, r) {
  const live = gh.repos[r.name] ?? {};
  const meta = [live.stars != null ? `${live.stars} ${live.stars === 1 ? 'star' : 'stars'}` : null, live.language, r.year, live.archived ? 'archived' : null].filter(Boolean).map(esc).join(`<tspan fill="${T.sep}">  ·  </tspan>`);
  const body = `
  <text x="36" y="46" font-size="21" font-weight="600" letter-spacing="-.2" fill="${T.text}" class="rise" style="animation-delay:.1s">${esc(r.name)}</text>
  <text x="590" y="46" text-anchor="end" class="k rise" style="animation-delay:.1s">${meta}</text>
  <text x="36" y="80" font-size="15" font-weight="500" fill="${T.proof}" class="rise" style="animation-delay:.25s">${esc(r.blurb[0])}</text>
  <text x="36" y="102" font-size="15" font-weight="500" fill="${T.proof}" class="rise" style="animation-delay:.3s">${esc(r.blurb[1])}</text>`;
  return frame(T, { w: 626, h: 128, body, title: `${r.name}: ${r.blurb.join(' ')}` });
}

// ---------- write ----------
mkdirSync('assets', { recursive: true });
const out = {
  'hero': hero(INK), 'hero-dark': hero(INK_ON_DARK),
  'ledger': ledger(PAPER), 'ledger-dark': ledger(INK_ON_DARK),
  'calendar': calendar(PAPER), 'calendar-dark': calendar(INK_ON_DARK),
};
for (const r of facts.repos) {
  const slug = 'repo-' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  out[slug] = repoCard(PAPER, r); out[`${slug}-dark`] = repoCard(INK_ON_DARK, r);
}
for (const [name, svg] of Object.entries(out)) writeFileSync(`assets/${name}.svg`, svg);
console.log(`wrote ${Object.keys(out).length} SVGs to assets/`);
