import { getAllPosts, getPostBySlug } from "@/lib/content/loaders";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MdxComponents";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts(true)
    .filter((p) => p.frontmatter.published)
    .map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  if (!post.frontmatter.published) notFound();

  return (
    <article className="max-w-2xl mx-auto">
      {post.frontmatter.needsReview && (
        <div className="mb-6 rounded-lg bg-[var(--color-bg-teal)] border border-[var(--color-card-border)] px-4 py-3 text-[var(--color-text-dark)] text-sm">
          ⚠ This post has been flagged for review — content may be outdated.
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-2">{post.frontmatter.title}</h1>
        <p className="text-[var(--color-text-dark)]/65 text-sm">{post.frontmatter.date}</p>
        <p className="text-[var(--color-text-dark)]/85 mt-2">{post.frontmatter.summary}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {post.frontmatter.techStack.map((t) => (
            <span
              key={t}
              className="text-xs bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-2 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>

        {post.frontmatter.repoUrl && (
          <a
            href={post.frontmatter.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm text-[var(--color-nav)] hover:underline"
          >
            View on GitHub ↗
          </a>
        )}
      </header>

      <div className="prose-zinc">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>
    </article>
  );
}
