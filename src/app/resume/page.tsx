import type { Metadata } from "next";
import PlaceholderBadge from "@/components/PlaceholderBadge";
import { getResume } from "@/lib/content/loaders";
import { formatPeriod, sortRoles } from "@/lib/content/resume";
import "./resume.css";

export const metadata: Metadata = {
  title: "Resume",
};

/**
 * scripts/build-resume-pdf.mjs prints this page to this file after
 * `next build`, in the deploy workflow only. A development server has no PDF,
 * so the link renders only in a production build.
 */
const PDF_HREF = "/mark-mccomiskey-resume.pdf";
const SHOW_DOWNLOAD = process.env.NODE_ENV === "production";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-[var(--color-nav)] border-b border-[var(--color-card-border)] pb-1 mb-4">
      {children}
    </h2>
  );
}

export default function ResumePage() {
  const { name, headline, contact, lookingFor, roles, education, skills } = getResume();

  return (
    <div className="resume-page max-w-3xl mx-auto">
      <header className="mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-[var(--color-text-dark)]">{name}</h1>
            {headline && <p className="mt-1 text-[var(--color-text-dark)]/80">{headline}</p>}
          </div>
          {SHOW_DOWNLOAD && (
            <a
              href={PDF_HREF}
              download
              className="screen-only btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Download PDF ↓
            </a>
          )}
        </div>

        {contact && (
          <>
            {/* The page shows an email link and profile links only. */}
            <div className="screen-only mt-4">
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {contact.placeholder && (
                  <li>
                    <PlaceholderBadge />
                  </li>
                )}
                <li>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
                {contact.profiles.map((profile) => (
                  <li key={profile.url}>
                    <a href={profile.url} target="_blank" rel="noopener noreferrer">
                      {profile.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* The full contact block. The print stylesheet shows it in the PDF only. */}
            <address className="print-only mt-3 not-italic text-sm">
              {[contact.email, contact.phone, contact.location, ...contact.profiles.map((p) => p.url)]
                .filter(Boolean)
                .join("  ·  ")}
            </address>
          </>
        )}
      </header>

      {lookingFor && (
        <section className="mb-10" aria-labelledby="looking-for">
          <SectionHeading>
            <span id="looking-for" className="mr-3">
              What I&apos;m looking for
            </span>
            {lookingFor.placeholder && <PlaceholderBadge />}
          </SectionHeading>
          <p className="text-[var(--color-text-dark)]/90">{lookingFor.summary}</p>
          {lookingFor.targetRoles.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Target roles: </span>
              {lookingFor.targetRoles.join(", ")}
            </p>
          )}
        </section>
      )}

      {roles.length > 0 && (
        <section className="mb-10">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-6">
            {sortRoles(roles).map((role) => (
              <article key={`${role.employer}-${role.period.start}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-lg font-semibold">
                    {role.title}
                    <span className="font-normal text-[var(--color-text-dark)]/80"> · {role.employer}</span>
                  </h3>
                  <p className="text-sm text-[var(--color-text-dark)]/70 whitespace-nowrap">
                    {formatPeriod(role.period)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {role.location && (
                    <p className="text-sm text-[var(--color-text-dark)]/70">{role.location}</p>
                  )}
                  {role.placeholder && <PlaceholderBadge />}
                </div>
                {role.bullets.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--color-text-dark)]/90">
                    {role.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-10">
          <SectionHeading>Education</SectionHeading>
          <div className="space-y-4">
            {education.map((entry) => (
              <article key={`${entry.institution}-${entry.credential}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-lg font-semibold">
                    {entry.credential}
                    <span className="font-normal text-[var(--color-text-dark)]/80"> · {entry.institution}</span>
                  </h3>
                  {entry.period && (
                    <p className="text-sm text-[var(--color-text-dark)]/70 whitespace-nowrap">
                      {formatPeriod(entry.period)}
                    </p>
                  )}
                </div>
                {entry.placeholder && (
                  <div className="mt-0.5">
                    <PlaceholderBadge />
                  </div>
                )}
                {entry.details.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--color-text-dark)]/90">
                    {entry.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-10">
          <SectionHeading>Skills</SectionHeading>
          <dl className="space-y-2">
            {skills.map((group) => (
              <div key={group.category} className="sm:flex sm:gap-3">
                <dt className="font-medium sm:w-40 sm:shrink-0">
                  {group.category}
                  {group.placeholder && (
                    <span className="ml-2 align-middle">
                      <PlaceholderBadge />
                    </span>
                  )}
                </dt>
                <dd className="text-[var(--color-text-dark)]/90">{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
