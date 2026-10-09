/**
 * Render rules for the resume. Pure functions, so they test without a build.
 */
import type { ResumePeriod, ResumeRole } from "./schemas";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Reverse-chronological by `start`. The file order does not matter.
 * At the same start, an open role comes first, then the later end.
 * YYYY-MM strings sort correctly as text.
 */
export function sortRoles(roles: ResumeRole[]): ResumeRole[] {
  return [...roles].sort((a, b) => {
    if (a.period.start !== b.period.start) {
      return a.period.start < b.period.start ? 1 : -1;
    }
    const aEnd = a.period.end ?? "9999-12";
    const bEnd = b.period.end ?? "9999-12";
    if (aEnd === bEnd) return 0;
    return aEnd < bEnd ? 1 : -1;
  });
}

/** "2024-03" to "Mar 2024". The schema has already checked the format. */
export function formatYearMonth(value: string): string {
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** "Mar 2022 – Present" when the period is open. */
export function formatPeriod(period: ResumePeriod): string {
  const end = period.end === null ? "Present" : formatYearMonth(period.end);
  return `${formatYearMonth(period.start)} – ${end}`;
}
