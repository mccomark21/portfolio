export default function ResumePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-text-dark)]">Resume</h1>
        <a
          href="/resume.pdf"
          download
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Download PDF ↓
        </a>
      </div>

      {/* Inline PDF embed */}
      <div className="rounded-xl border border-[var(--color-card-border)] overflow-hidden bg-[var(--color-bg-accent)]">
        <iframe
          src="/resume.pdf"
          className="w-full h-[80vh]"
          title="Resume"
        />
      </div>

      <p className="mt-4 text-[var(--color-text-dark)]/70 text-sm">
        Replace <code className="text-[var(--color-nav)] bg-[var(--color-bg-teal)] px-1 rounded">public/resume.pdf</code> in the repository to
        update this page.
      </p>
    </div>
  );
}
