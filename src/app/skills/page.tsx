import { getEnrichedSkills } from "@/lib/content/skills";
import Link from "next/link";

export default function SkillsPage() {
  const manifest = getEnrichedSkills();

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-text-dark)] mb-8">Skills</h1>
      <div className="space-y-10">
        {manifest.categories.map((cat) => (
          <section key={cat.category} className="rounded-2xl bg-[var(--color-bg-accent)] p-5">
            <h2 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">{cat.category}</h2>
            <div className="flex flex-wrap gap-3">
              {cat.skills.map((skill) => (
                <div key={skill.name} className="group relative">
                  <span className="inline-block bg-[var(--color-bg-teal)] text-[var(--color-nav)] px-3 py-1.5 rounded-lg text-sm font-medium cursor-default border border-[var(--color-card-border)]">
                    {skill.name}
                  </span>
                  {skill.projects.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col gap-1 bg-[var(--color-bg-accent)] border border-[var(--color-card-border)] rounded-lg p-2 z-10 min-w-max shadow-xl">
                      <span className="text-xs text-[var(--color-text-dark)]/70 mb-1">Used in:</span>
                      {skill.projects.map((proj) => (
                        <Link
                          key={proj}
                          href={`/blog/${proj}`}
                          className="text-xs text-[var(--color-nav)] hover:underline"
                        >
                          {proj}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-12 text-[var(--color-text-dark)]/70 text-xs">
        Skills are automatically updated from project{" "}
        <code className="text-[var(--color-nav)] bg-[var(--color-bg-teal)] px-1 rounded">techStack</code> fields via CI.
      </p>
    </div>
  );
}
