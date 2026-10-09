import { Suspense } from "react";
import ProjectArchive from "@/components/ProjectArchive";
import ProjectCard from "@/components/ProjectCard";
import ProjectGrid from "@/components/ProjectGrid";
import { archiveOptions } from "@/lib/content/archive";
import { getAllProjects, getFeaturedProjects } from "@/lib/content/loaders";
import { ProjectStatusSchema, ProjectTagSchema } from "@/lib/content/schemas";

/**
 * /projects: the featured set, then every project with search and filters.
 *
 * The site is a static export, so this server component reads the content
 * once at build time and hands plain data to the client archive.
 */
export default function ProjectsPage() {
  // getAllProjects already drops placeholders that must not render.
  const projects = getAllProjects();
  // The same ranked set as the home page. A duplicate rank stops the build.
  const featured = getFeaturedProjects();
  const options = archiveOptions(projects, ProjectTagSchema.options, ProjectStatusSchema.options);

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-3">Projects</h1>
        <p className="text-[var(--color-text-dark)]/85 text-lg max-w-2xl">
          The strongest work first, then everything else. Filter by status to separate shipped
          work from exploration.
        </p>
      </header>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mb-12 rounded-2xl bg-[var(--color-bg-accent)] p-4 sm:p-6">
          <h2 id="featured-heading" className="text-xl font-semibold text-[var(--color-text-dark)] mb-4">
            Featured
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((p) => (
              <ProjectCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="archive-heading">
        <h2 id="archive-heading" className="text-xl font-semibold text-[var(--color-text-dark)] mb-4">
          All projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-[var(--color-text-dark)]/80">No projects yet. Check back soon.</p>
        ) : (
          // Without JavaScript the fallback stays: every project, no controls.
          <Suspense fallback={<ProjectGrid projects={projects} />}>
            <ProjectArchive projects={projects} options={options} />
          </Suspense>
        )}
      </section>
    </div>
  );
}
