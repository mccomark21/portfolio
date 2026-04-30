#!/usr/bin/env node
/**
 * refresh-content.mjs
 *
 * Polls all repos in content/repos.json for new releases or significant
 * commits since the last run, then flags matching posts with
 * needsReview:true in their frontmatter.
 *
 * State (last-checked timestamp per repo) is persisted to
 * .github/state/content-refresh.json and committed back to the repo.
 *
 * Usage:
 *   node .github/scripts/refresh-content.mjs
 *
 * Required env:
 *   GH_TOKEN   GitHub token with repo read scope
 */

import { Octokit } from "octokit";
import fs from "fs";
import path from "path";

const REPOS_FILE = path.resolve("content/repos.json");
const POSTS_DIR = path.resolve("content/posts");
const STATE_FILE = path.resolve(".github/state/content-refresh.json");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Repo change detection
// ---------------------------------------------------------------------------

function parseOwnerRepo(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: m[1], repo: m[2] };
}

async function getLatestReleaseTime(owner, repo) {
  try {
    const res = await octokit.rest.repos.getLatestRelease({ owner, repo });
    return new Date(res.data.published_at ?? 0).getTime();
  } catch {
    return 0;
  }
}

async function getLatestCommitTime(owner, repo) {
  try {
    const res = await octokit.rest.repos.listCommits({ owner, repo, per_page: 1 });
    if (!res.data.length) return 0;
    return new Date(res.data[0].commit.author?.date ?? 0).getTime();
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Frontmatter patch helpers
// ---------------------------------------------------------------------------

function patchNeedsReview(raw) {
  if (/^needsReview:\s*(true|false)/m.test(raw)) {
    return raw.replace(/^needsReview:\s*(true|false)/m, "needsReview: true");
  }
  // Insert before closing ---
  return raw.replace(/\n---\n/, "\nneedsReview: true\n---\n");
}

function patchLastChecked(raw, iso) {
  const val = `lastChecked: "${iso}"`;
  if (/^lastChecked:/m.test(raw)) {
    return raw.replace(/^lastChecked:.*$/m, val);
  }
  return raw.replace(/\n---\n/, `\n${val}\n---\n`);
}

function findPostFile(repoName) {
  if (!fs.existsSync(POSTS_DIR)) return null;
  const slug = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const candidates = [
    path.join(POSTS_DIR, `${slug}.mdx`),
    path.join(POSTS_DIR, `${slug}.md`),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(REPOS_FILE)) {
    console.log("No content/repos.json found — nothing to refresh.");
    process.exit(0);
  }

  const repos = JSON.parse(fs.readFileSync(REPOS_FILE, "utf-8"));
  const state = loadState();
  const now = new Date().toISOString();
  let flagged = 0;

  for (const entry of repos) {
    const { url } = entry;
    let owner, repo;
    try {
      ({ owner, repo } = parseOwnerRepo(url));
    } catch (e) {
      console.warn(`  Skipping invalid URL: ${url}`);
      continue;
    }

    const lastChecked = state[url] ? new Date(state[url]).getTime() : 0;
    console.log(`\nChecking ${owner}/${repo} (last checked: ${state[url] ?? "never"})`);

    const [releaseTime, commitTime] = await Promise.all([
      getLatestReleaseTime(owner, repo),
      getLatestCommitTime(owner, repo),
    ]);

    const latestActivity = Math.max(releaseTime, commitTime);
    const hasUpdate = latestActivity > lastChecked;

    if (!hasUpdate) {
      console.log("  No new activity.");
      state[url] = now;
      continue;
    }

    console.log(`  New activity detected (${new Date(latestActivity).toISOString()})`);

    const postFile = findPostFile(repo);
    if (!postFile) {
      console.log(`  No matching post file for '${repo}' — skipping frontmatter update.`);
    } else {
      let raw = fs.readFileSync(postFile, "utf-8");
      raw = patchNeedsReview(raw);
      raw = patchLastChecked(raw, now);
      fs.writeFileSync(postFile, raw, "utf-8");
      console.log(`  Flagged ${path.basename(postFile)} with needsReview: true`);
      flagged++;
    }

    state[url] = now;
  }

  saveState(state);
  console.log(`\nDone. Flagged ${flagged} post(s) for review.`);

  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(ghOutput, `flagged_count=${flagged}\nhas_changes=${flagged > 0}\n`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
