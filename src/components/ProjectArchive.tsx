"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProjectGrid from "./ProjectGrid";
import {
  EMPTY_FILTERS,
  filterProjects,
  isFiltered,
  parseFilters,
  toQueryString,
  type ArchiveFilters,
  type ArchiveOptions,
} from "@/lib/content/archive";
import type { ProjectMeta } from "@/lib/content/loaders";
import type { ProjectStatus, ProjectTag } from "@/lib/content/schemas";

interface Props {
  projects: ProjectMeta[];
  options: ArchiveOptions;
}

const TAG_LABEL: Record<ProjectTag, string> = {
  "data-analysis": "Data analysis",
  application: "Application",
  model: "Model",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  exploration: "Exploration",
};

const FIELD_CLASS =
  "w-full min-w-0 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-nav)]";

const LABEL_CLASS = "block text-xs font-medium text-[var(--color-text-dark)]/75 mb-1";

const OUTLINE_BUTTON_CLASS =
  "rounded-lg border border-[var(--color-nav)] px-3 py-1.5 text-sm text-[var(--color-nav)] hover:bg-[var(--color-bg-teal)] transition-colors";

/**
 * Search and filters over the archive. The filter state lives in the URL
 * query string, so a reload or a shared link shows the same list.
 *
 * useSearchParams makes this component render in the browser only. The page
 * wraps it in a Suspense boundary whose fallback is the full list, so the
 * static HTML holds every project when JavaScript does not run.
 */
export default function ProjectArchive({ projects, options }: Props) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ArchiveFilters>(() =>
    parseFilters(searchParams, options),
  );
  const id = useId();

  function update(patch: Partial<ArchiveFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    const query = toQueryString(next);
    // replaceState, not pushState: each keystroke must not add a history entry.
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  const visible = filterProjects(projects, filters);
  const filtered = isFiltered(filters);

  return (
    <div>
      <form
        role="search"
        aria-label="Filter projects"
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] mb-4"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-q`} className={LABEL_CLASS}>
            Search
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Title or summary"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={`${id}-tag`} className={LABEL_CLASS}>
            Type
          </label>
          <select
            id={`${id}-tag`}
            value={filters.tag ?? ""}
            onChange={(e) => update({ tag: (e.target.value || null) as ProjectTag | null })}
            className={FIELD_CLASS}
          >
            <option value="">All types</option>
            {options.tags.map((t) => (
              <option key={t} value={t}>
                {TAG_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${id}-status`} className={LABEL_CLASS}>
            Status
          </label>
          <select
            id={`${id}-status`}
            value={filters.status ?? ""}
            onChange={(e) =>
              update({ status: (e.target.value || null) as ProjectStatus | null })
            }
            className={FIELD_CLASS}
          >
            <option value="">All statuses</option>
            {options.statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          {/* Reads techStack until the Phase 2 GitHub sync supplies repo languages. */}
          <label htmlFor={`${id}-lang`} className={LABEL_CLASS}>
            Language or tool
          </label>
          <select
            id={`${id}-lang`}
            value={filters.language ?? ""}
            onChange={(e) => update({ language: e.target.value || null })}
            className={FIELD_CLASS}
          >
            <option value="">All languages and tools</option>
            {options.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p aria-live="polite" className="text-sm text-[var(--color-text-dark)]/75">
          {filtered
            ? `Showing ${visible.length} of ${projects.length} projects`
            : `${projects.length} projects`}
        </p>
        {filtered && (
          <button type="button" onClick={() => update(EMPTY_FILTERS)} className={OUTLINE_BUTTON_CLASS}>
            Clear filters
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <ProjectGrid projects={visible} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--color-bg-accent)] p-8 text-center">
          <p className="font-semibold text-[var(--color-text-dark)] mb-1">
            No projects match these filters.
          </p>
          <p className="text-sm text-[var(--color-text-dark)]/75 mb-4">
            Remove a filter or change the search text.
          </p>
          <button type="button" onClick={() => update(EMPTY_FILTERS)} className={OUTLINE_BUTTON_CLASS}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
