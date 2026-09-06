// Fetches live GitHub numbers for the profile into data/github.json.
// Token: PROFILE_TOKEN (a personal token with repo + read:user, unlocks private counts) if set,
// else GITHUB_TOKEN (Actions default, public data plus the private contribution total),
// else `gh api` locally.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LOGIN = 'meSingh';
const PIN_REPOS = ['polinrider-cleaner', 'git.wtf'];
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;

async function graphql(query) {
  if (token) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'meSingh-profile' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
    return (await res.json()).data;
  }
  return JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8' })).data;
}
async function rest(path) {
  if (token) {
    const res = await fetch(`https://api.github.com${path}`, { headers: { Authorization: `bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'meSingh-profile' } });
    if (!res.ok) return null;
    return res.json();
  }
  try { return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' })); } catch { return null; }
}

const pins = PIN_REPOS.map((r, i) => `p${i}: repository(owner:"${LOGIN}", name:"${r}"){ name description stargazerCount forkCount pushedAt isArchived primaryLanguage{ name color } }`).join('\n');
const data = await graphql(`{
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
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
  ${pins}
}`);

const u = data.user;
const cal = u.contributionsCollection.contributionCalendar;
const out = {
  fetched: new Date().toISOString().slice(0, 10),
  scope: process.env.PROFILE_TOKEN ? 'private' : 'public',
  createdAt: u.createdAt.slice(0, 10),
  followers: u.followers.totalCount,
  publicRepos: u.repositories.totalCount,
  stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
  forks: u.repositories.nodes.reduce((a, r) => a + r.forkCount, 0),
  contributions: cal.totalContributions,
  privateContributions: u.contributionsCollection.restrictedContributionsCount,
  commitsLastYear: u.contributionsCollection.totalCommitContributions,
  prsLastYear: u.contributionsCollection.totalPullRequestContributions,
  reviewsLastYear: u.contributionsCollection.totalPullRequestReviewContributions,
  reposContributed: u.contributionsCollection.totalRepositoriesWithContributedCommits,
  weeks: cal.weeks.map(w => w.contributionDays.map(d => d.contributionCount)),
  firstDay: cal.weeks[0].contributionDays[0].date,
  pins: PIN_REPOS.map((_, i) => data[`p${i}`]).filter(Boolean).map(r => ({
    name: r.name, description: r.description ?? '', stars: r.stargazerCount, forks: r.forkCount,
    language: r.primaryLanguage?.name ?? null, languageColor: r.primaryLanguage?.color ?? '#8F8A7E', archived: r.isArchived, pushed: r.pushedAt.slice(0, 10),
  })),
};

// All-time totals through the search API. With a public-only token these count public repos only,
// so they are recorded with the scope and the card labels them accordingly.
const commits = await rest(`/search/commits?q=author:${LOGIN}&per_page=1`);
const prs = await rest(`/search/issues?q=author:${LOGIN}+type:pr&per_page=1`);
out.allTimeCommits = commits?.total_count ?? null;
out.allTimePRs = prs?.total_count ?? null;

mkdirSync('data', { recursive: true });
writeFileSync('data/github.json', JSON.stringify(out, null, 2) + '\n');
console.log(`data/github.json (${out.scope}): ${out.contributions} contributions, ${out.stars} stars, ${out.allTimeCommits} commits all-time`);
