import { z } from "zod";

// ---------------------------------------------------------------------------
// Post frontmatter – required by every blog post and all AI-generated content
// ---------------------------------------------------------------------------
export const PostFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  summary: z.string(),
  repoUrl: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  needsReview: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Project card frontmatter – each card on the Home/Portfolio page
// ---------------------------------------------------------------------------
export const ProjectFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  repoUrl: z.string().optional(),
  blogSlug: z.string().optional(), // slug of the related blog post
  techStack: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Static page frontmatter – About, Education, Interests (optional title)
// ---------------------------------------------------------------------------
export const StaticPageFrontmatterSchema = z.object({
  title: z.string(),
});

export type StaticPageFrontmatter = z.infer<typeof StaticPageFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Skills manifest – content/skills.json
// ---------------------------------------------------------------------------
export const SkillItemSchema = z.object({
  name: z.string(),
  projects: z.array(z.string()).default([]),
});

export const SkillCategorySchema = z.object({
  category: z.string(),
  skills: z.array(SkillItemSchema),
});

export const SkillsManifestSchema = z.object({
  generatedAt: z.string().optional(),
  categories: z.array(SkillCategorySchema),
});

export type SkillItem = z.infer<typeof SkillItemSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type SkillsManifest = z.infer<typeof SkillsManifestSchema>;

// ---------------------------------------------------------------------------
// Watched repos – content/repos.json
// ---------------------------------------------------------------------------
export const WatchedRepoSchema = z.object({
  url: z.string().url(),
  lastIngested: z.string().optional(),
});

export const ReposManifestSchema = z.array(WatchedRepoSchema);

export type WatchedRepo = z.infer<typeof WatchedRepoSchema>;
