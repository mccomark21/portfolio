import Link from "next/link";
import Image from "next/image";
import CodeBlock from "./CodeBlock";
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  // Code blocks delegate to the Shiki server component
  code: (props) => {
    const { children, className, ...rest } = props as {
      children?: string;
      className?: string;
    };
    // Inline code (no className) renders as plain <code>
    if (!className) {
      return (
        <code className="bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ href = "#", children }) => (
    <Link href={href} className="text-[var(--color-nav)] hover:underline">
      {children}
    </Link>
  ),
  img: ({ src = "", alt = "" }) => (
    <span className="block my-4">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        className="rounded-lg w-full h-auto"
        unoptimized
      />
    </span>
  ),
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mt-10 mb-4 text-[var(--color-text-dark)]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold mt-8 mb-3 text-[var(--color-text-dark)]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold mt-6 mb-2 text-[var(--color-text-dark)]">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-relaxed text-[var(--color-text-dark)]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside my-4 space-y-1 text-[var(--color-text-dark)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside my-4 space-y-1 text-[var(--color-text-dark)]">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[var(--color-nav)] pl-4 my-4 italic text-[var(--color-text-dark)]/80">
      {children}
    </blockquote>
  ),
};
