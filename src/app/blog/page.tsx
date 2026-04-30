import { getAllPosts } from "@/lib/content/loaders";
import Link from "next/link";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-8">Blog</h1>
      {posts.length === 0 && (
        <p className="text-[var(--color-text-dark)]/80">No posts published yet — check back soon.</p>
      )}
      <div className="space-y-8">
        {posts.map(({ slug, frontmatter }) => (
          <article key={slug} className="border-b border-[var(--color-card-border)] pb-8">
            <Link href={`/blog/${slug}`}>
              <h2 className="text-xl font-semibold text-[var(--color-text-dark)] hover:text-[var(--color-nav)] transition-colors">
                {frontmatter.title}
              </h2>
            </Link>
            <p className="text-[var(--color-text-dark)]/65 text-sm mt-1">{frontmatter.date}</p>
            <p className="text-[var(--color-text-dark)]/85 mt-2">{frontmatter.summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {frontmatter.techStack.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
