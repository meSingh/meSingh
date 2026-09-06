// Fetches live GitHub numbers for the profile into data/github.json.
// In Actions: GITHUB_TOKEN is set. Locally: falls back to `gh api graphql`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LOGIN = 'meSingh';
const query = `{
  user(login:"${LOGIN}"){
    createdAt
    followers{ totalCount }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
      totalCount
      nodes{ name stargazerCount forkCount pushedAt isArchived primaryLanguage{ name } }
    }
    contributionsCollection{
      totalCommitContributions
      restrictedContributionsCount
      totalRepositoriesWithContributedCommits
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

let data;
if (process.env.GITHUB_TOKEN) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'meSingh-profile' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
  data = (await res.json()).data;
} else {
  const out = execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8' });
  data = JSON.parse(out).data;
}

const u = data.user;
const repos = Object.fromEntries(u.repositories.nodes.map(r => [r.name, {
  stars: r.stargazerCount, forks: r.forkCount, language: r.primaryLanguage?.name ?? null, pushed: r.pushedAt.slice(0, 10), archived: r.isArchived,
}]));
const cal = u.contributionsCollection.contributionCalendar;
const out = {
  fetched: new Date().toISOString().slice(0, 10),
  createdAt: u.createdAt.slice(0, 10),
  followers: u.followers.totalCount,
  publicRepos: u.repositories.totalCount,
  stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
  forks: u.repositories.nodes.reduce((a, r) => a + r.forkCount, 0),
  contributions: cal.totalContributions,
  privateContributions: u.contributionsCollection.restrictedContributionsCount,
  commits: u.contributionsCollection.totalCommitContributions,
  reposContributed: u.contributionsCollection.totalRepositoriesWithContributedCommits,
  weeks: cal.weeks.map(w => w.contributionDays.map(d => d.contributionCount)),
  firstDay: cal.weeks[0].contributionDays[0].date,
  repos,
};
mkdirSync('data', { recursive: true });
writeFileSync('data/github.json', JSON.stringify(out, null, 2) + '\n');
console.log(`data/github.json: ${out.contributions} contributions, ${out.stars} stars, ${out.followers} followers`);
