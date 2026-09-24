/**
 * Marks fixture content while it renders.
 *
 * A placeholder only reaches a screen in development, or in a build with
 * INCLUDE_PLACEHOLDERS=1. The badge makes that obvious to anyone looking at
 * the page, so fixture copy is never read as real.
 */
export default function PlaceholderBadge() {
  return (
    <span
      title="Fixture content. A production build leaves this out."
      className="shrink-0 text-xs font-medium text-[var(--color-text-dark)] bg-[var(--color-placeholder)] px-2 py-0.5 rounded-full border border-dashed border-[var(--color-placeholder-border)]"
    >
      Placeholder
    </span>
  );
}
