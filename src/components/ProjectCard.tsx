import Link from "next/link";
import PlaceholderBadge from "./PlaceholderBadge";
import type { ProjectFrontmatter } from "@/lib/content/schemas";

interface Props {
  slug: string;
  frontmatter: ProjectFrontmatter;
}

const STATUS_LABEL: Record<ProjectFrontmatter["status"], string> = {
  shipped: "Shipped",
  exploration: "Exploration",
};

export default function ProjectCard({ slug, frontmatter }: Props) {
  const { links, metrics, placeholder, repo, status, summary, techStack, title } =
    frontmatter;

  return (
    <div className="group flex flex-col rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-primary)] p-6 hover:bg-[var(--color-bg-accent)] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg font-semibold text-[var(--color-text-dark)]">
          <Link href={`/projects/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {placeholder && <PlaceholderBadge />}
          <span className="text-xs text-[var(--color-nav)] bg-[var(--color-bg-teal)] px-2 py-0.5 rounded-full border border-[var(--color-card-border)]">
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      <p className="text-[var(--color-text-dark)]/85 text-sm flex-1 mb-4">{summary}</p>

      {metrics.length > 0 && (
        <dl className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <dd className="text-sm font-semibold text-[var(--color-text-dark)]">{m.value}</dd>
              <dt className="text-xs text-[var(--color-text-dark)]/65">{m.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {/* techStack drives the visible tags. `tags` drives the archive filter in #9. */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {techStack.map((t) => (
            <span
              key={t}
              className="text-xs bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-2 py-0.5 rounded-full border border-[var(--color-card-border)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={`/projects/${slug}`} className="text-[var(--color-nav)] hover:underline">
          Read more →
        </Link>
        {links.writeup && (
          <Link
            href={`/blog/${links.writeup}`}
            className="text-[var(--color-nav)] hover:underline"
          >
            Write-up →
          </Link>
        )}
        {links.demo && (
          <a
            href={links.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-nav)] hover:underline"
          >
            Demo ↗
          </a>
        )}
        {repo && (
          <a
            href={`https://github.com/${repo}`}
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
