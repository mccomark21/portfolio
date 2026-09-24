/**
 * Fail the build when fixture content reaches the static export.
 *
 * The loaders drop placeholders from a production build. This check confirms
 * that they did, by looking at what `next build` actually wrote. A filter that
 * silently stops working is the failure this catches, so the check reads the
 * emitted files rather than trusting the same code that wrote them.
 *
 * INCLUDE_PLACEHOLDERS=1 means the placeholders were wanted, so the check
 * passes and says what it let through.
 *
 * Run: npm run check:placeholders, after npm run build.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
import { ProjectFrontmatterSchema } from "../src/lib/content/schemas.ts";

const OUT_ROOT = path.join(process.cwd(), "out");
const PROJECTS_ROOT = path.join(process.cwd(), "content", "projects");

/** "1 project", "2 projects". Used in the messages below. */
function count(n, noun) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/**
 * The placeholder slugs that still have a page in the export.
 * `pageExists` is a parameter so the rule can be tested without a build.
 */
export function findLeakedPages(slugs, pageExists) {
  return slugs.filter((slug) => pageExists(slug));
}

/**
 * The slugs of every project flagged as a placeholder.
 *
 * The content is read here rather than through the loaders, which resolve
 * imports the way the bundler does. Reading it again also keeps the check
 * independent of the filter it is checking.
 */
function placeholderSlugs() {
  if (!fs.existsSync(PROJECTS_ROOT)) return [];

  return fs
    .readdirSync(PROJECTS_ROOT)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .sort()
    .filter((file) => {
      const { data } = matter(fs.readFileSync(path.join(PROJECTS_ROOT, file), "utf-8"));
      return ProjectFrontmatterSchema.parse(data).placeholder;
    })
    .map((file) => file.replace(/\.mdx?$/, ""));
}

/** A project page is `out/projects/<slug>/index.html`, from trailingSlash. */
function projectPageExists(slug) {
  return fs.existsSync(path.join(OUT_ROOT, "projects", slug, "index.html"));
}

function main() {
  const slugs = placeholderSlugs();

  if (process.env.INCLUDE_PLACEHOLDERS === "1") {
    console.log(
      `INCLUDE_PLACEHOLDERS=1. ${count(slugs.length, "placeholder project")} may be in the export.`,
    );
    return 0;
  }

  if (!fs.existsSync(OUT_ROOT)) {
    console.error("No out/ directory. Run npm run build first.");
    return 1;
  }

  const leaked = findLeakedPages(slugs, projectPageExists);

  if (leaked.length === 0) {
    console.log(
      `No placeholder reached the export. ${count(slugs.length, "placeholder project")} checked.`,
    );
    return 0;
  }

  console.error(`Placeholder content reached the export. ${count(leaked.length, "page")} found.
`);
  for (const slug of leaked) {
    console.error(`  out/projects/${slug}/index.html`);
    console.error(`    content/projects/${slug}.mdx has placeholder: true.`);
  }
  console.error("\nSet INCLUDE_PLACEHOLDERS=1 to build a preview that keeps them.\n");
  return 1;
}

// Only run when invoked directly, so the test can import the rule above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
