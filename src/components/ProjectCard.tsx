import Link from "next/link";
import type { ProjectFrontmatter } from "@/lib/content/schemas";

interface Props {
  slug: string;
  frontmatter: ProjectFrontmatter;
}

export default function ProjectCard({ slug, frontmatter }: Props) {
  return (
    <div className="group flex flex-col rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-primary)] p-6 hover:bg-[var(--color-bg-accent)] transition-colors">
      <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-2">
        {frontmatter.title}
      </h3>
      <p className="text-[var(--color-text-dark)]/85 text-sm flex-1 mb-4">
        {frontmatter.description}
      </p>

      {/* Tech tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {frontmatter.techStack.map((t) => (
          <span
            key={t}
            className="text-xs bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-2 py-0.5 rounded-full border border-[var(--color-card-border)]"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-4 text-sm">
        {frontmatter.blogSlug && (
          <Link
            href={`/blog/${frontmatter.blogSlug}`}
            className="text-[var(--color-nav)] hover:underline"
          >
            Blog post →
          </Link>
        )}
        {frontmatter.repoUrl && (
          <a
            href={frontmatter.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-nav)] hover:underline"
          >
            GitHub ↗
          </a>
        )}
      </div>
    </div>
  );
}
