import { getAllPosts, getAllProjects } from "./loaders";
import { getSkillsManifest } from "./loaders";
import type { SkillsManifest } from "./schemas";

/**
 * Return the skills manifest enriched with project/post references for each skill.
 * The "projects" array on each skill is populated from blog posts and project cards
 * that include that skill name in their techStack arrays.
 */
export function getEnrichedSkills(): SkillsManifest {
  const manifest = getSkillsManifest();

  // Build lookup: skill name (lowercase) → slugs
  const postRefs: Record<string, string[]> = {};
  const projectRefs: Record<string, string[]> = {};

  for (const { slug, frontmatter } of getAllPosts(true)) {
    for (const tech of frontmatter.techStack) {
      const key = tech.toLowerCase();
      postRefs[key] = [...(postRefs[key] ?? []), slug];
    }
  }
  for (const { slug, frontmatter } of getAllProjects()) {
    for (const tech of frontmatter.techStack) {
      const key = tech.toLowerCase();
      projectRefs[key] = [...(projectRefs[key] ?? []), slug];
    }
  }

  return {
    ...manifest,
    categories: manifest.categories.map((cat) => ({
      ...cat,
      skills: cat.skills.map((skill) => {
        const key = skill.name.toLowerCase();
        const refs = [
          ...(postRefs[key] ?? []),
          ...(projectRefs[key] ?? []),
        ];
        return { ...skill, projects: [...new Set([...skill.projects, ...refs])] };
      }),
    })),
  };
}
