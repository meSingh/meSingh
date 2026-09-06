// Rewrites the marked blocks in README.md from data/facts.json and data/github.json.
// Native markdown, updated daily by the workflow, so the live numbers need no custom card.
import { readFileSync, writeFileSync } from 'node:fs';

const facts = JSON.parse(readFileSync('data/facts.json', 'utf8'));
const gh = JSON.parse(readFileSync('data/github.json', 'utf8'));
const NOW = new Date(gh.fetched + 'T12:00:00Z');
const ym = (s) => { const [y, m] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)); };
const elapsed = (s) => { const a = ym(s); const m = (NOW.getUTCFullYear() - a.getUTCFullYear()) * 12 + (NOW.getUTCMonth() - a.getUTCMonth()); return `${Math.floor(m / 12)} years ${m % 12} months`; };
const days = (s) => Math.floor((NOW - ym(s)) / 86400000).toLocaleString('en-US');
const month = (s) => ym(s).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const role = facts.now.find(n => n.count);
const blocks = {
  'still-running': [
    `- **${role.v}** · day ${days(role.since)} · since ${month(role.since)}`,
    ...facts.still_running.map(s => `- **${s.what}** · ${s.detail} · **${elapsed(s.since)}** in production`),
    `- **${gh.contributions.toLocaleString('en-US')} contributions** in the last year${gh.scope === 'public' && gh.privateContributions > 0 ? `, ${Math.round(gh.privateContributions / gh.contributions * 100)}% of them in private repositories` : ''}`,
    ``,
    `<sub>Counters update daily. Last run ${gh.fetched}.</sub>`,
  ].join('\n'),
};

let md = readFileSync('README.md', 'utf8');
for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(md)) throw new Error(`README.md has no <!-- ${name}:start --> block`);
  md = md.replace(re, `$1\n\n${body}\n\n$2`);
}
writeFileSync('README.md', md);
console.log('README.md blocks updated');
