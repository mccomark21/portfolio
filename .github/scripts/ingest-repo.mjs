#!/usr/bin/env node
/**
 * ingest-repo.mjs
 *
 * Fetches GitHub repo metadata (README, topics, languages, recent commits)
 * via Octokit, calls the LLM to generate a draft MDX blog post, validates
 * the output schema, writes it to content/posts/<slug>.mdx with
 * published:false, and emits PR-summary metadata to stdout.
 *
 * Usage:
 *   node .github/scripts/ingest-repo.mjs --repo https://github.com/owner/repo
 *
 * Required env:
 *   GH_TOKEN           GitHub token with repo read scope
 *   OPENAI_API_KEY  OR  ANTHROPIC_API_KEY
 *   LLM_PROVIDER       (optional) "openai" | "anthropic"
 */

import { generate } from "./llm-client.mjs";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const repoFlag = args.indexOf("--repo");
if (repoFlag === -1 || !args[repoFlag + 1]) {
  console.error("Usage: ingest-repo.mjs --repo https://github.com/owner/repo");
  process.exit(1);
}

const repoUrl = args[repoFlag + 1].trim().replace(/\/$/, "");
const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
if (!match) {
  console.error(`Invalid GitHub URL: ${repoUrl}`);
  process.exit(1);
}
const [, owner, repo] = match;

const OUTPUT_DIR = path.resolve("content/posts");

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------
let octokit;

async function fetchReadme() {
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    return Buffer.from(res.data.content, "base64").toString("utf-8");
  } catch (e) {
    if (e.status === 404) return "";
    throw e;
  }
}

async function fetchRepoMeta() {
  const [repoRes, langsRes] = await Promise.all([
    octokit.rest.repos.get({ owner, repo }),
    octokit.rest.repos.listLanguages({ owner, repo }),
  ]);
  return {
    description: repoRes.data.description ?? "",
    topics: repoRes.data.topics ?? [],
    languages: Object.keys(langsRes.data),
    stars: repoRes.data.stargazers_count,
    htmlUrl: repoRes.data.html_url,
    defaultBranch: repoRes.data.default_branch,
  };
}

async function fetchRecentCommits(n = 8) {
  const res = await octokit.rest.repos.listCommits({ owner, repo, per_page: n });
  return res.data.map((c) => ({
    message: c.commit.message.split("\n")[0],
    date: c.commit.author?.date ?? "",
  }));
}

// ---------------------------------------------------------------------------
// Build LLM prompt
// ---------------------------------------------------------------------------
function buildPrompt({ readme, meta, commits }) {
  const commitList = commits.map((c) => `- ${c.message} (${c.date.slice(0, 10)})`).join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return `You are writing a portfolio blog post about an open-source GitHub repository.

Repository: ${meta.htmlUrl}
Description: ${meta.description}
Topics: ${meta.topics.join(", ") || "none"}
Languages detected: ${meta.languages.join(", ") || "none"}
Stars: ${meta.stars}

Recent commits:
${commitList || "No commits available"}

README (first 3000 chars):
${readme.slice(0, 3000)}

Generate a complete MDX file with the following YAML frontmatter block first, then the body:

---
title: "<descriptive title for the project blog post>"
date: "${today}"
summary: "<2-3 sentence summary>"
repoUrl: "${meta.htmlUrl}"
techStack: [<comma-separated quoted technology names>]
published: false
needsReview: true
---

Then write 5-7 paragraphs with these H2 sections:
## Overview
## Motivation
## Approach
## Tech Stack
## Outcomes
## Conclusion

Rules:
- Use valid MDX (no JSX import statements in the body).
- Include at least one fenced code block relevant to the tech stack.
- Do not wrap the entire output in a markdown code fence.
- Output ONLY the raw MDX file content, nothing else.`;
}

// ---------------------------------------------------------------------------
// Validate and extract frontmatter from generated content
// ---------------------------------------------------------------------------
function extractFrontmatter(raw) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error("Generated content has no valid YAML frontmatter block.");

  const title = fm[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
  const techStackRaw = fm[1].match(/^techStack:\s*\[([^\]]*)\]/m)?.[1] ?? "";
  const techStack = techStackRaw
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  if (!title) throw new Error("Generated frontmatter is missing 'title' field.");
  return { title, techStack };
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveLlmConfig() {
  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase().trim();
  const hasOpenAiKey = Boolean((process.env.OPENAI_API_KEY ?? "").trim());
  const hasAnthropicKey = Boolean((process.env.ANTHROPIC_API_KEY ?? "").trim());

  const canGenerate =
    (provider === "openai" && hasOpenAiKey) ||
    (provider === "anthropic" && hasAnthropicKey) ||
    (!provider && (hasOpenAiKey || hasAnthropicKey));

  return { provider, canGenerate };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nIngesting ${repoUrl}...`);

  const { provider, canGenerate } = resolveLlmConfig();
  if (!canGenerate) {
    const selected = provider || "auto";
    const reason =
      "Skipping ingest: no valid LLM configuration found. Set LLM_PROVIDER to 'openai' or 'anthropic' and provide the matching API key secret.";

    console.warn(reason);

    const ghOutput = process.env.GITHUB_OUTPUT;
    if (ghOutput) {
      fs.appendFileSync(ghOutput, `skipped=true\nskip_reason=${reason}\nllm_provider=${selected}\n`);
    }

    return;
  }

  const { Octokit } = await import("octokit");
  octokit = new Octokit({ auth: process.env.GH_TOKEN });

  const [readme, meta, commits] = await Promise.all([
    fetchReadme(),
    fetchRepoMeta(),
    fetchRecentCommits(),
  ]);

  console.log(`Fetched metadata: ${meta.languages.join(", ")} | ${meta.stars} stars`);

  const prompt = buildPrompt({ readme, meta, commits });
  console.log("Calling LLM...");
  const generated = await generate(prompt);

  const { title, techStack } = extractFrontmatter(generated);

  const slug = toSlug(repo);
  const outPath = path.join(OUTPUT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Preserve existing file with timestamp suffix to avoid silent overwrites
  if (fs.existsSync(outPath)) {
    const backup = outPath.replace(".mdx", `-backup-${Date.now()}.mdx`);
    fs.renameSync(outPath, backup);
    console.warn(`Existing post backed up to ${path.basename(backup)}`);
  }

  fs.writeFileSync(outPath, generated, "utf-8");
  console.log(`\nWrote post: ${outPath}`);

  // Emit summary for the PR body (picked up by workflow via GITHUB_OUTPUT)
  const summary = [
    `**Generated post:** \`content/posts/${slug}.mdx\``,
    `**Title:** ${title}`,
    `**Tech stack:** ${techStack.join(", ")}`,
    "**Status:** `published: false` and `needsReview: true` - requires manual review before going live",
  ].join("\n");

  // Write to GITHUB_OUTPUT if running in Actions
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(
      ghOutput,
      `post_slug=${slug}\npost_title=${title.replace(/\n/g, " ")}\npost_path=content/posts/${slug}.mdx\n`
    );
  }

  console.log("\n--- PR Summary ---");
  console.log(summary);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
