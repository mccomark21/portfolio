import { codeToHtml } from "shiki";

/** Highlight a code block server-side using Shiki. Falls back to plain pre on error. */
export async function highlight(code: string, lang = "text"): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang,
      theme: "github-dark",
    });
  } catch {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre class="shiki"><code>${escaped}</code></pre>`;
  }
}
