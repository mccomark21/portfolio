import ProjectCard from "./ProjectCard";
import type { ProjectMeta } from "@/lib/content/loaders";

interface Props {
  projects: ProjectMeta[];
}

/**
 * A grid of project cards. It has no state, so it renders on the server for
 * the no-JavaScript fallback and inside the client archive alike.
 */
export default function ProjectGrid({ projects }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => (
        <ProjectCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
      ))}
    </div>
  );
}
