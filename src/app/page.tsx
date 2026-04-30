import { getAllProjects } from "@/lib/content/loaders";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  const projects = getAllProjects();
  const featured = projects.filter((p) => p.frontmatter.featured);
  const rest = projects.filter((p) => !p.frontmatter.featured);

  return (
    <div>
      <section className="mb-14">
        <h1 className="text-4xl font-bold text-[var(--color-text-dark)] mb-3">Hi, I&apos;m Mark 👋</h1>
        <p className="text-[var(--color-text-dark)]/85 text-lg max-w-2xl">
          Software engineer focused on developer tooling and AI-assisted workflows. Here are some
          things I&apos;ve built.
        </p>
      </section>

      {featured.length > 0 && (
        <section className="mb-12 rounded-2xl bg-[var(--color-bg-accent)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-dark)] mb-4">Featured</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((p) => (
              <ProjectCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text-dark)] mb-4">All Projects</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((p) => (
              <ProjectCard key={p.slug} slug={p.slug} frontmatter={p.frontmatter} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

