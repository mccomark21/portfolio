import Link from "next/link";
import { getFeaturedProjects } from "@/lib/content/loaders";
import ProjectCard from "@/components/ProjectCard";
import LookingForTeaser from "@/components/LookingForTeaser";

/**
 * The home page. The hero is the only above-the-fold contract: name, one line
 * on the work, the resume link, the teaser, and the first featured cards must
 * all show at 375px. Build and review it at that width first.
 *
 * getFeaturedProjects() throws on a duplicate `featured` rank, so a collision
 * fails the build instead of reordering this page.
 */
export default function Home() {
  const featured = getFeaturedProjects();

  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-dark)] mb-2">
            Mark McComiskey
          </h1>
          <p className="text-[var(--color-text-dark)]/85 text-base sm:text-lg max-w-2xl">
            Software engineer focused on developer tooling and AI-assisted workflows.
          </p>
        </div>
        <Link
          href="/resume"
          className="btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Resume →
        </Link>
        <LookingForTeaser />
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <h2
            id="featured-heading"
            className="text-xl font-semibold text-[var(--color-text-dark)] mb-4"
          >
            Featured work
          </h2>
          <ol className="grid sm:grid-cols-2 gap-4">
            {featured.map((p) => (
              <li key={p.slug} className="grid">
                <ProjectCard slug={p.slug} frontmatter={p.frontmatter} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
