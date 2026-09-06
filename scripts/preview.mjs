// Writes preview/light.html and preview/dark.html: README.md rendered the way GitHub renders it (close enough
// to judge), with the SVGs embedded via <img> exactly as GitHub does. Open over HTTP and watch the cards animate.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const mode = process.argv[2] === 'dark' ? 'dark' : 'light';
const t = mode === 'dark'
  ? { bg: '#0d1117', fg: '#f0f6fc', muted: '#9198a1', border: '#3d444d', link: '#4493f8', code: '#151b23', quote: '#9198a1' }
  : { bg: '#ffffff', fg: '#1f2328', muted: '#59636e', border: '#d1d9e0', link: '#0969da', code: '#f6f8fa', quote: '#59636e' };

// tiny markdown subset: ###, -, >, paragraphs, **bold**, `code`, [text](url); raw HTML blocks pass through.
// <picture> is collapsed to the variant for this mode, paths rewritten to ../assets/.
function inline(s) {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}
function render(md) {
  md = md.replace(/<picture>\s*<source media="\(prefers-color-scheme: dark\)" srcset="([^"]+)">\s*<img ([^>]*?)src="([^"]+)"([^>]*)>\s*<\/picture>/g,
    (m, darkSrc, pre, lightSrc, post) => `<img ${pre}src="../${mode === 'dark' ? darkSrc : lightSrc}"${post}>`);
  const lines = md.split('\n'); let out = '', i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*</.test(l)) { let block = ''; while (i < lines.length && lines[i].trim() !== '') block += lines[i++] + '\n'; out += block; continue; }
    if (l.startsWith('### ')) { out += `<h3>${inline(l.slice(4))}</h3>\n`; i++; continue; }
    if (l.startsWith('- ')) { out += '<ul>'; while (i < lines.length && lines[i].startsWith('- ')) out += `<li>${inline(lines[i++].slice(2))}</li>`; out += '</ul>\n'; continue; }
    if (l.startsWith('> ')) { out += `<blockquote>${inline(l.slice(2))}</blockquote>\n`; i++; continue; }
    if (l.trim() === '') { i++; continue; }
    let p = ''; while (i < lines.length && lines[i].trim() !== '' && !/^(### |- |> |\s*<)/.test(lines[i])) p += lines[i++] + ' ';
    out += `<p>${inline(p.trim())}</p>\n`;
  }
  return out;
}

const body = render(readFileSync('README.md', 'utf8'));
const html = `<!doctype html><meta charset="utf-8"><title>preview ${mode}</title>
<style>
body{margin:0;background:${t.bg};color:${t.fg};font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif}
.wrap{display:flex;gap:24px;padding:32px;max-width:1280px;box-sizing:border-box}
.side{width:296px;flex-shrink:0}.side img{width:296px;height:296px;border-radius:50%;border:1px solid ${t.border}}
.card{flex:1;min-width:0;border:1px solid ${t.border};border-radius:6px;padding:16px}
.card img{max-width:100%;display:block}
a{color:${t.link};text-decoration:none}p{margin:0 0 16px}ul{margin:0 0 16px;padding-left:32px}li{margin:4px 0}
h3{font-size:20px;font-weight:600;margin:24px 0 16px;line-height:1.25}
blockquote{margin:0 0 16px;padding:0 16px;border-left:4px solid ${t.border};color:${t.quote}}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:85%;background:${t.code};padding:3px 5px;border-radius:6px}
table{border-collapse:collapse;width:100%}td{padding:0 6px 12px 0;border:0}sub{font-size:12px;color:${t.muted}}
</style>
<div class="wrap"><div class="side"><img src="avatar.png"><div style="font-size:24px;font-weight:600;margin-top:16px">Mandeep Singh</div><div style="font-size:20px;color:${t.muted}">meSingh</div>
<div style="margin-top:12px">Chief Architect at TWINii. Fractional CTO and production advisor for seed to Series B AI teams. The layer after the demo.</div></div>
<div class="card">${body}</div></div>`;
mkdirSync('preview', { recursive: true });
writeFileSync(`preview/${mode}.html`, html);
console.log(`preview/${mode}.html`);
