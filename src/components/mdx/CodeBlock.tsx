import { highlight } from "@/lib/highlight";

interface Props {
  children?: string;
  className?: string;
}

/** Server component: renders syntax-highlighted code via Shiki. */
export default async function CodeBlock({ children = "", className }: Props) {
  const lang = className?.replace(/^language-/, "") ?? "text";
  const html = await highlight(children.trimEnd(), lang);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
