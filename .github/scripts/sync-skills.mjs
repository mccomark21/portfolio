#!/usr/bin/env node
/**
 * sync-skills.mjs
 *
 * Reads all MDX post files in content/posts/, extracts techStack frontmatter
 * arrays, and merges them into content/skills.json grouped by category.
 *
 * Category mapping lives in TECH_CATEGORIES below — extend it as needed.
 * Technologies that don't match any category go to "Other".
 *
 * Usage:
 *   node .github/scripts/sync-skills.mjs
 */

import fs from "fs";
import path from "path";

const POSTS_DIR = path.resolve("content/posts");
const SKILLS_FILE = path.resolve("content/skills.json");

// ---------------------------------------------------------------------------
// Technology → category mapping (lowercase keys)
// ---------------------------------------------------------------------------
const TECH_CATEGORIES = {
  // Languages
  typescript: "Languages",
  javascript: "Languages",
  python: "Languages",
  rust: "Languages",
  go: "Languages",
  java: "Languages",
  "c#": "Languages",
  "c++": "Languages",
  ruby: "Languages",
  swift: "Languages",
  kotlin: "Languages",
  php: "Languages",
  bash: "Languages",
  shell: "Languages",
  // Runtimes / platforms
  "node.js": "Runtimes & Platforms",
  nodejs: "Runtimes & Platforms",
  deno: "Runtimes & Platforms",
  bun: "Runtimes & Platforms",
  // Frameworks
  "next.js": "Frameworks",
  nextjs: "Frameworks",
  react: "Frameworks",
  vue: "Frameworks",
  angular: "Frameworks",
  svelte: "Frameworks",
  express: "Frameworks",
  fastapi: "Frameworks",
  django: "Frameworks",
  rails: "Frameworks",
  // AI & ML
  ai: "AI & Tooling",
  "machine learning": "AI & Tooling",
  "github copilot": "AI & Tooling",
  openai: "AI & Tooling",
  anthropic: "AI & Tooling",
  llm: "AI & Tooling",
  // Dev tooling
  cli: "AI & Tooling",
  // Databases
  postgresql: "Databases",
  mysql: "Databases",
  sqlite: "Databases",
  mongodb: "Databases",
  redis: "Databases",
  // Cloud & DevOps
  docker: "Cloud & DevOps",
  kubernetes: "Cloud & DevOps",
  aws: "Cloud & DevOps",
  gcp: "Cloud & DevOps",
  azure: "Cloud & DevOps",
  "github actions": "Cloud & DevOps",
  terraform: "Cloud & DevOps",
  // CSS / Styling
  tailwindcss: "Styling",
  "tailwind css": "Styling",
  tailwind: "Styling",
  css: "Styling",
  scss: "Styling",
};

function categorize(tech) {
  return TECH_CATEGORIES[tech.toLowerCase()] ?? "Other";
}

// ---------------------------------------------------------------------------
// Parse frontmatter from raw MDX string (lightweight, no gray-matter dep)
// ---------------------------------------------------------------------------
function extractTechStack(raw, file) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return [];

  // Support both YAML array forms:
  //   techStack: ["A", "B"]
  //   techStack:\n  - A\n  - B
  const inlineMatch = fm[1].match(/^techStack:\s*\[([^\]]*)\]/m);
  if (inlineMatch) {
    return inlineMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  const blockMatch = fm[1].match(/^techStack:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  console.warn(`  ⚠ No techStack found in ${file}`);
  return [];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("No content/posts directory found — nothing to sync.");
    process.exit(0);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  console.log(`Processing ${files.length} post(s)...`);

  // slug → [techs]
  const postTechs = {};
  for (const file of files) {
    const slug = file.replace(/\.mdx?$/, "");
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const techs = extractTechStack(raw, file);
    if (techs.length) {
      postTechs[slug] = techs;
      console.log(`  ${file}: ${techs.join(", ")}`);
    }
  }

  // Load existing manifest (preserve manually added data)
  let existing = { generatedAt: "", categories: [] };
  if (fs.existsSync(SKILLS_FILE)) {
    existing = JSON.parse(fs.readFileSync(SKILLS_FILE, "utf-8"));
  }

  // Build category → skill name → Set<project slugs>
  const catMap = {};

  // Seed from existing manifest
  for (const cat of existing.categories) {
    catMap[cat.category] = catMap[cat.category] ?? {};
    for (const skill of cat.skills) {
      catMap[cat.category][skill.name] = new Set(skill.projects ?? []);
    }
  }

  // Merge from posts
  for (const [slug, techs] of Object.entries(postTechs)) {
    for (const tech of techs) {
      const cat = categorize(tech);
      catMap[cat] = catMap[cat] ?? {};
      catMap[cat][tech] = catMap[cat][tech] ?? new Set();
      catMap[cat][tech].add(slug);
    }
  }

  // Serialize in stable sorted order
  const categories = Object.keys(catMap)
    .sort()
    .map((category) => ({
      category,
      skills: Object.keys(catMap[category])
        .sort()
        .map((name) => ({
          name,
          projects: [...catMap[category][name]].sort(),
        })),
    }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    categories,
  };

  fs.writeFileSync(SKILLS_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(`\n✅ Skills manifest updated: ${categories.length} categories`);

  // Emit outputs for GitHub Actions
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(ghOutput, `category_count=${categories.length}\npost_count=${files.length}\n`);
  }
}

main();
