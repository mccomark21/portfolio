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
// Project frontmatter — content/projects/<slug>.mdx
//
// The filename is the slug. There is no `slug` field: a second copy of the
// slug can disagree with the filename, and `repo` is the merge key into the
// generated repo record.
//
// Two layers render on the project page. `summary` is layer 1, for a reader
// who skims. The MDX body is layer 2, for a reader who wants depth.
// ---------------------------------------------------------------------------
export const ProjectStatusSchema = z.enum(["shipped", "exploration"]);

export const ProjectTagSchema = z.enum([
  "data-analysis",
  "application",
  "model",
]);

export const ProjectMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const ProjectPeriodSchema = z.object({
  start: z.string(),
  // null means the work is still open. The field itself may also be absent.
  end: z.string().nullable().default(null),
});

export const ProjectLinksSchema = z.object({
  demo: z.string().url().optional(),
  // A slug in content/posts, not a URL. validate-content.mjs resolves it.
  writeup: z.string().optional(),
});

export const ProjectFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  status: ProjectStatusSchema,
  // 1-5 is a pinned rank. Absent means the project shows in the archive only.
  featured: z.number().int().min(1).max(5).optional(),
  placeholder: z.boolean().default(false),
  repo: z.string().optional(), // "owner/name"
  role: z.string().optional(),
  period: ProjectPeriodSchema.optional(),
  metrics: z.array(ProjectMetricSchema).default([]),
  links: ProjectLinksSchema.default({}),
  tags: z.array(ProjectTagSchema).default([]),
  // Phase 2 unions this with the languages the GitHub sync derives.
  // See docs/plan/refactor-plan.md section 3.4.
  techStack: z.array(z.string()).default([]),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type ProjectTag = z.infer<typeof ProjectTagSchema>;
export type ProjectMetric = z.infer<typeof ProjectMetricSchema>;
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Resume — content/resume.json
//
// One source of truth. /resume renders this data as HTML, and the deploy
// workflow prints that page to the PDF. Bullets are plain text, not Markdown.
//
// Order in the file does not matter. The page sorts roles by `start` when it
// renders them.
//
// Each section that can hold fixture content carries the `placeholder` flag
// from visibility.ts, so a production build drops it like a fixture project.
// ---------------------------------------------------------------------------
const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use a YYYY-MM date, for example 2024-03.");

// The same shape as ProjectPeriodSchema. null means the role is still open.
export const ResumePeriodSchema = z.object({
  start: YearMonthSchema,
  end: YearMonthSchema.nullable().default(null),
});

export const ResumeProfileSchema = z.object({
  label: z.string(),
  url: z.string().url(),
});

// The page shows `email` as a mailto link and `profiles` as links. `phone` and
// `location` appear only in the PDF, through the print stylesheet. `location`
// is a city and region, never a street address.
export const ResumeContactSchema = z.object({
  email: z.string().email(),
  profiles: z.array(ResumeProfileSchema).default([]),
  phone: z.string().optional(),
  location: z.string().optional(),
  placeholder: z.boolean().default(false),
});

export const ResumeRoleSchema = z.object({
  employer: z.string(),
  title: z.string(),
  location: z.string().optional(),
  period: ResumePeriodSchema,
  bullets: z.array(z.string()).default([]),
  placeholder: z.boolean().default(false),
});

export const ResumeEducationSchema = z.object({
  institution: z.string(),
  credential: z.string(),
  period: ResumePeriodSchema.optional(),
  details: z.array(z.string()).default([]),
  placeholder: z.boolean().default(false),
});

export const ResumeSkillGroupSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
  placeholder: z.boolean().default(false),
});

// "What I'm looking for": the target roles and the kind of work wanted.
export const ResumeLookingForSchema = z.object({
  targetRoles: z.array(z.string()),
  summary: z.string(),
  placeholder: z.boolean().default(false),
});

export const ResumeSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  contact: ResumeContactSchema,
  lookingFor: ResumeLookingForSchema,
  roles: z.array(ResumeRoleSchema).default([]),
  education: z.array(ResumeEducationSchema).default([]),
  skills: z.array(ResumeSkillGroupSchema).default([]),
});

export type ResumePeriod = z.infer<typeof ResumePeriodSchema>;
export type ResumeContact = z.infer<typeof ResumeContactSchema>;
export type ResumeRole = z.infer<typeof ResumeRoleSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeSkillGroup = z.infer<typeof ResumeSkillGroupSchema>;
export type ResumeLookingFor = z.infer<typeof ResumeLookingForSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

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
// Enriched skills — returned by getEnrichedSkills(), not read directly from disk.
// `projects` is computed by cross-referencing techStack across posts and projects;
// it is NOT the raw value from skills.json.
// ---------------------------------------------------------------------------
export interface EnrichedSkillItem {
  name: string;
  projects: string[];
}

export interface EnrichedSkillCategory {
  category: string;
  skills: EnrichedSkillItem[];
}

export interface EnrichedSkillsManifest {
  generatedAt?: string;
  categories: EnrichedSkillCategory[];
}

// ---------------------------------------------------------------------------
// Watched repos – content/repos.json
// ---------------------------------------------------------------------------
export const WatchedRepoSchema = z.object({
  url: z.string().url(),
  lastIngested: z.string().optional(),
});

export const ReposManifestSchema = z.array(WatchedRepoSchema);

export type WatchedRepo = z.infer<typeof WatchedRepoSchema>;
