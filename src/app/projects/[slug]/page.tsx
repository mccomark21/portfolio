import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/components/mdx/MdxComponents";
import PlaceholderBadge from "@/components/PlaceholderBadge";
import { getAllProjects, getProjectBySlug } from "@/lib/content/loaders";
import type { ProjectFrontmatter } from "@/lib/content/schemas";

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<ProjectFrontmatter["status"], string> = {
  shipped: "Shipped",
  exploration: "Exploration",
};

/** "2026-01" to "present" when end is null. Both parts stay verbatim. */
function formatPeriod(period: NonNullable<ProjectFrontmatter["period"]>): string {
  return `${period.start} — ${period.end ?? "present"}`;
}

export async function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { frontmatter, content } = project;
  const { links, metrics, period, placeholder, repo, role, status, summary, tags, techStack, title } =
    frontmatter;

  return (
    <article className="max-w-2xl mx-auto">
      {/* Layer 1 — the skim. Everything a reader needs in one screen. */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {placeholder && <PlaceholderBadge />}
          <span className="text-xs text-[var(--color-nav)] bg-[var(--color-bg-teal)] px-2 py-0.5 rounded-full border border-[var(--color-card-border)]">
            {STATUS_LABEL[status]}
          </span>
          {period && (
            <span className="text-xs text-[var(--color-text-dark)]/65">
              {formatPeriod(period)}
            </span>
          )}
          {role && <span className="text-xs text-[var(--color-text-dark)]/65">{role}</span>}
        </div>

        <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-3">{title}</h1>

        <p className="text-[var(--color-text-dark)]/85 text-lg">{summary}</p>

        {metrics.length > 0 && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 rounded-2xl bg-[var(--color-bg-accent)] p-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <dd className="text-xl font-semibold text-[var(--color-text-dark)]">{m.value}</dd>
                <dt className="text-xs text-[var(--color-text-dark)]/65 mt-0.5">{m.label}</dt>
              </div>
            ))}
          </dl>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {techStack.map((t) => (
              <span
                key={t}
                className="text-xs text-[var(--color-text-dark)]/65 border border-[var(--color-card-border)] px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm mt-6">
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
          {links.writeup && (
            <Link
              href={`/blog/${links.writeup}`}
              className="text-[var(--color-nav)] hover:underline"
            >
              Write-up →
            </Link>
          )}
        </div>
      </header>

      {/* Layer 2 — the narrative, for a reader who wants depth. */}
      <div className="prose-zinc border-t border-[var(--color-card-border)] pt-10">
        <MDXRemote source={content} components={mdxComponents} />
      </div>
    </article>
  );
}
