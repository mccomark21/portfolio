import Link from "next/link";
import PlaceholderBadge from "./PlaceholderBadge";
import { isVisible } from "@/lib/content/visibility";

/**
 * A short "what I'm looking for" note on the home page, linking to /resume.
 *
 * The copy is fixture text until the structured resume data lands (#20) and
 * Mark writes the real version. It carries the placeholder flag, so the same
 * rule that hides fixture projects hides it from a production build, and the
 * badge marks it wherever it renders. The plan's launch gate (section 7.4)
 * requires real words here before the site goes public.
 */
const TEASER = {
  placeholder: true,
  text: "A software engineering role on a team that builds developer tools or data products. Full-time or contract, remote or hybrid from the US.",
};

export default function LookingForTeaser() {
  if (!isVisible(TEASER)) return null;

  return (
    <section
      aria-labelledby="looking-for-heading"
      className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-bg-accent)] p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2
          id="looking-for-heading"
          className="text-base font-semibold text-[var(--color-text-dark)]"
        >
          What I&apos;m looking for
        </h2>
        {TEASER.placeholder && <PlaceholderBadge />}
      </div>
      <p className="text-sm text-[var(--color-text-dark)]/85 mb-2">{TEASER.text}</p>
      <Link href="/resume" className="text-sm text-[var(--color-nav)] hover:underline">
        More on the resume →
      </Link>
    </section>
  );
}
