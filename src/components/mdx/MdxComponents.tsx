import Link from "next/link";
import Image from "next/image";
import CodeBlock from "./CodeBlock";
import type { MDXComponents } from "mdx/types";

// ---------------------------------------------------------------------------
// Element adapters — one named function per element for locality.
// Change an element's styling here; the assembly map below is untouched.
// ---------------------------------------------------------------------------

function ProseInlineCode({ children }: { children?: string }) {
  return (
    <code className="bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}

function ProseCode({
  children,
  className,
}: {
  children?: string;
  className?: string;
}) {
  if (!className) return <ProseInlineCode>{children}</ProseInlineCode>;
  return <CodeBlock className={className}>{children}</CodeBlock>;
}

function ProseLink({ href = "#", children }: { href?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="text-[var(--color-nav)] hover:underline">
      {children}
    </Link>
  );
}

function ProseImage({ src = "", alt = "" }: { src?: string; alt?: string }) {
  return (
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
  );
}

function ProseH1({ children }: { children?: React.ReactNode }) {
  return <h1 className="text-3xl font-bold mt-10 mb-4 text-[var(--color-text-dark)]">{children}</h1>;
}

function ProseH2({ children }: { children?: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold mt-8 mb-3 text-[var(--color-text-dark)]">{children}</h2>;
}

function ProseH3({ children }: { children?: React.ReactNode }) {
  return <h3 className="text-xl font-semibold mt-6 mb-2 text-[var(--color-text-dark)]">{children}</h3>;
}

function ProseParagraph({ children }: { children?: React.ReactNode }) {
  return <p className="my-4 leading-relaxed text-[var(--color-text-dark)]">{children}</p>;
}

function ProseUl({ children }: { children?: React.ReactNode }) {
  return (
    <ul className="list-disc list-inside my-4 space-y-1 text-[var(--color-text-dark)]">
      {children}
    </ul>
  );
}

function ProseOl({ children }: { children?: React.ReactNode }) {
  return (
    <ol className="list-decimal list-inside my-4 space-y-1 text-[var(--color-text-dark)]">
      {children}
    </ol>
  );
}

function ProseBlockquote({ children }: { children?: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-[var(--color-nav)] pl-4 my-4 italic text-[var(--color-text-dark)]/80">
      {children}
    </blockquote>
  );
}

// ---------------------------------------------------------------------------
// Assembly map — the external seam passed to MDXRemote. Do not add styling
// here; add a named adapter above and reference it in this map.
// ---------------------------------------------------------------------------

export const mdxComponents: MDXComponents = {
  code: (props) => <ProseCode {...(props as { children?: string; className?: string })} />,
  pre: ({ children }) => <>{children}</>,
  a: ProseLink,
  img: ProseImage,
  h1: ProseH1,
  h2: ProseH2,
  h3: ProseH3,
  p: ProseParagraph,
  ul: ProseUl,
  ol: ProseOl,
  blockquote: ProseBlockquote,
};
