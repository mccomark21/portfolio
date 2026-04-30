import { getStaticPage } from "@/lib/content/loaders";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MdxComponents";

export default function EducationPage() {
  const { frontmatter, content } = getStaticPage("education");
  return (
    <div className="max-w-2xl rounded-2xl bg-[var(--color-bg-accent)] p-6">
      <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-8">{frontmatter.title}</h1>
      <MDXRemote source={content} components={mdxComponents} />
    </div>
  );
}
