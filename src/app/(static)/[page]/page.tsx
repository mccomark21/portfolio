import { getStaticPage } from "@/lib/content/loaders";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MdxComponents";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content", "pages");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => ({ page: f.replace(/\.mdx?$/, "") }));
}

export default async function StaticPage({ params }: Props) {
  const { page } = await params;
  const data = getStaticPage(page);
  if (!data) notFound();
  const { frontmatter, content } = data;
  return (
    <div className="max-w-2xl rounded-2xl bg-[var(--color-bg-accent)] p-6">
      <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-8">{frontmatter.title}</h1>
      <MDXRemote source={content} components={mdxComponents} />
    </div>
  );
}
