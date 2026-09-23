/**
 * Validate every content file against the schemas the site renders with.
 *
 * The schemas are imported from src/lib/content/schemas.ts, not restated here.
 * One source of truth means the build and this check cannot drift. Node strips
 * the TypeScript types on import, which needs Node 22.6 or later.
 *
 * Per-file rules come from the schemas. Rules that need the whole set — a
 * duplicate `featured` rank, a `links.writeup` that resolves — run afterwards.
 *
 * Run: npm run validate:content
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";
import {
  PostFrontmatterSchema,
  ProjectFrontmatterSchema,
  ReposManifestSchema,
  SkillsManifestSchema,
  StaticPageFrontmatterSchema,
} from "../src/lib/content/schemas.ts";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** Every failure found. The script reports all of them, not just the first. */
const failures = [];

function fail(file, field, message) {
  failures.push({ file, field, message });
}

/** Turn a Zod error into one failure per issue, so every bad field is named. */
function reportZodError(file, error) {
  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    fail(file, field, issue.message);
  }
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath).replaceAll("\\", "/");
}

function readMdxDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();
}

function toSlug(filename) {
  return filename.replace(/\.mdx?$/, "");
}

/**
 * Parse every MDX file in a directory against one schema.
 * Returns the files that parsed, so cross-file rules can use them.
 */
function validateMdxDir(dirName, schema) {
  const dir = path.join(CONTENT_ROOT, dirName);
  const parsed = [];

  for (const file of readMdxDir(dir)) {
    const filePath = path.join(dir, file);
    const { data } = matter(fs.readFileSync(filePath, "utf-8"));
    const result = schema.safeParse(data);

    if (result.success) {
      parsed.push({ file: relative(filePath), slug: toSlug(file), frontmatter: result.data });
    } else {
      reportZodError(relative(filePath), result.error);
    }
  }

  return parsed;
}

function validateJsonFile(fileName, schema) {
  const filePath = path.join(CONTENT_ROOT, fileName);

  if (!fs.existsSync(filePath)) {
    fail(relative(filePath), "(file)", "The file does not exist.");
    return;
  }

  let json;
  try {
    json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    fail(relative(filePath), "(file)", `The file is not valid JSON. ${error.message}`);
    return;
  }

  const result = schema.safeParse(json);
  if (!result.success) reportZodError(relative(filePath), result.error);
}

// ---------------------------------------------------------------------------
// Cross-file project rules
// ---------------------------------------------------------------------------

/**
 * A `featured` rank pins one project to one slot on the home page.
 * Two projects at the same rank make the order of that page arbitrary.
 */
function validateFeaturedRanks(projects) {
  const byRank = new Map();

  for (const project of projects) {
    const rank = project.frontmatter.featured;
    if (rank === undefined) continue;
    byRank.set(rank, [...(byRank.get(rank) ?? []), project.file]);
  }

  for (const [rank, files] of [...byRank].sort((a, b) => a[0] - b[0])) {
    if (files.length < 2) continue;
    fail(files.join(" and "), "featured", `${files.length} projects claim rank ${rank}.`);
  }
}

/** `links.writeup` is a slug in content/posts, not a URL. It must resolve. */
function validateWriteupLinks(projects, postSlugs) {
  for (const project of projects) {
    const writeup = project.frontmatter.links.writeup;
    if (writeup === undefined) continue;
    if (postSlugs.has(writeup)) continue;
    fail(
      project.file,
      "links.writeup",
      `No post named "${writeup}" exists in content/posts.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const posts = validateMdxDir("posts", PostFrontmatterSchema);
const projects = validateMdxDir("projects", ProjectFrontmatterSchema);
validateMdxDir("pages", StaticPageFrontmatterSchema);
validateJsonFile("skills.json", SkillsManifestSchema);
validateJsonFile("repos.json", ReposManifestSchema);

validateFeaturedRanks(projects);
validateWriteupLinks(projects, new Set(posts.map((p) => p.slug)));

const checked = posts.length + projects.length;

if (failures.length === 0) {
  console.log(`Content is valid. ${checked} posts and projects checked.`);
  process.exit(0);
}

console.error(`Content validation failed. ${failures.length} problems found.\n`);
for (const { file, field, message } of failures) {
  console.error(`  ${file}`);
  console.error(`    ${field}: ${message}`);
}
console.error("");
process.exit(1);
