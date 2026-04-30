import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  PostFrontmatterSchema,
  ProjectFrontmatterSchema,
  StaticPageFrontmatterSchema,
  SkillsManifestSchema,
  ReposManifestSchema,
  type PostFrontmatter,
  type ProjectFrontmatter,
  type StaticPageFrontmatter,
  type SkillsManifest,
  type WatchedRepo,
} from "./schemas";

const CONTENT_ROOT = path.join(process.cwd(), "content");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

function readMdxDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();
}

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

export interface PostMeta {
  slug: string;
  frontmatter: PostFrontmatter;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(includeUnpublished = false): PostMeta[] {
  const dir = path.join(CONTENT_ROOT, "posts");
  return readMdxDir(dir)
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      const frontmatter = PostFrontmatterSchema.parse(data);
      return { slug: toSlug(file), frontmatter };
    })
    .filter((p) => includeUnpublished || p.frontmatter.published)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
}

export function getPostBySlug(slug: string): Post {
  const filePath = path.join(CONTENT_ROOT, "posts", `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: PostFrontmatterSchema.parse(data), content };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export interface ProjectMeta {
  slug: string;
  frontmatter: ProjectFrontmatter;
}

export function getAllProjects(): ProjectMeta[] {
  const dir = path.join(CONTENT_ROOT, "projects");
  return readMdxDir(dir).map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);
    return { slug: toSlug(file), frontmatter: ProjectFrontmatterSchema.parse(data) };
  });
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------

export interface StaticPage {
  frontmatter: StaticPageFrontmatter;
  content: string;
}

export function getStaticPage(name: string): StaticPage {
  const filePath = path.join(CONTENT_ROOT, "pages", `${name}.mdx`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: StaticPageFrontmatterSchema.parse(data), content };
}

// ---------------------------------------------------------------------------
// Skills manifest
// ---------------------------------------------------------------------------

export function getSkillsManifest(): SkillsManifest {
  const filePath = path.join(CONTENT_ROOT, "skills.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return SkillsManifestSchema.parse(JSON.parse(raw));
}

// ---------------------------------------------------------------------------
// Watched repos
// ---------------------------------------------------------------------------

export function getWatchedRepos(): WatchedRepo[] {
  const filePath = path.join(CONTENT_ROOT, "repos.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return ReposManifestSchema.parse(JSON.parse(raw));
}
