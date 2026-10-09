import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_FILTERS,
  archiveOptions,
  filterProjects,
  isFiltered,
  matchesSearch,
  parseFilters,
  toQueryString,
  type ArchiveFilters,
  type ArchiveProject,
} from "./archive.ts";
import type { ProjectStatus, ProjectTag } from "./schemas.ts";

const TAG_ORDER: ProjectTag[] = ["data-analysis", "application", "model"];
const STATUS_ORDER: ProjectStatus[] = ["shipped", "exploration"];

function project(
  slug: string,
  fields: Partial<ArchiveProject["frontmatter"]> = {},
): ArchiveProject {
  return {
    slug,
    frontmatter: {
      title: slug,
      summary: "",
      status: "shipped",
      tags: [],
      techStack: [],
      ...fields,
    },
  };
}

const RIDERSHIP = project("ridership", {
  title: "Transit Ridership Forecast",
  summary: "Forecasts weekly bus ridership.",
  status: "shipped",
  tags: ["model", "data-analysis"],
  techStack: ["Python", "LightGBM"],
});
const SCHEDULER = project("scheduler", {
  title: "Clinic Appointment Scheduler",
  summary: "Books patients into open slots.",
  status: "shipped",
  tags: ["application"],
  techStack: ["TypeScript", "React"],
});
const PARSER = project("parser", {
  title: "Receipt Line-Item Parser",
  summary: "Reads grocery receipts into rows.",
  status: "exploration",
  tags: ["model"],
  techStack: ["Python", "PyTorch"],
});
const ALL = [RIDERSHIP, SCHEDULER, PARSER];

function filters(overrides: Partial<ArchiveFilters>): ArchiveFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

function slugs(projects: ArchiveProject[]): string[] {
  return projects.map((p) => p.slug);
}

test("empty filters keep every project", () => {
  assert.deepEqual(slugs(filterProjects(ALL, EMPTY_FILTERS)), ["ridership", "scheduler", "parser"]);
  assert.equal(isFiltered(EMPTY_FILTERS), false);
});

test("search matches title and summary, without regard to case", () => {
  assert.equal(matchesSearch(RIDERSHIP, "TRANSIT"), true);
  assert.equal(matchesSearch(RIDERSHIP, "weekly bus"), true);
  assert.equal(matchesSearch(RIDERSHIP, "receipts"), false);
});

test("search needs every word, in any order", () => {
  assert.equal(matchesSearch(PARSER, "receipts grocery"), true);
  assert.equal(matchesSearch(PARSER, "receipts bus"), false);
});

test("search ignores fields other than title and summary", () => {
  // "Python" is in techStack only.
  assert.equal(matchesSearch(RIDERSHIP, "python"), false);
});

test("a blank search matches everything and does not count as a filter", () => {
  assert.equal(matchesSearch(PARSER, "   "), true);
  assert.equal(isFiltered(filters({ q: "  " })), false);
});

test("the tag filter keeps projects that carry the tag", () => {
  assert.deepEqual(slugs(filterProjects(ALL, filters({ tag: "model" }))), ["ridership", "parser"]);
  assert.deepEqual(slugs(filterProjects(ALL, filters({ tag: "application" }))), ["scheduler"]);
});

test("the status filter separates shipped from exploration", () => {
  assert.deepEqual(slugs(filterProjects(ALL, filters({ status: "shipped" }))), [
    "ridership",
    "scheduler",
  ]);
  assert.deepEqual(slugs(filterProjects(ALL, filters({ status: "exploration" }))), ["parser"]);
});

test("the language filter reads techStack, without regard to case", () => {
  assert.deepEqual(slugs(filterProjects(ALL, filters({ language: "python" }))), [
    "ridership",
    "parser",
  ]);
});

test("filters combine with AND", () => {
  const modelOnly = filters({ tag: "model" });
  const modelShipped = filters({ tag: "model", status: "shipped" });
  const modelShippedSearch = filters({ tag: "model", status: "shipped", q: "receipt" });

  assert.equal(filterProjects(ALL, modelOnly).length, 2);
  assert.deepEqual(slugs(filterProjects(ALL, modelShipped)), ["ridership"]);
  assert.deepEqual(filterProjects(ALL, modelShippedSearch), []);
  assert.deepEqual(
    slugs(filterProjects(ALL, filters({ language: "Python", status: "exploration" }))),
    ["parser"],
  );
});

test("options list only the values that a project carries", () => {
  const options = archiveOptions([SCHEDULER], TAG_ORDER, STATUS_ORDER);
  assert.deepEqual(options.tags, ["application"]);
  assert.deepEqual(options.statuses, ["shipped"]);
});

test("options keep the schema order for tags and statuses", () => {
  const options = archiveOptions([PARSER, SCHEDULER, RIDERSHIP], TAG_ORDER, STATUS_ORDER);
  assert.deepEqual(options.tags, ["data-analysis", "application", "model"]);
  assert.deepEqual(options.statuses, ["shipped", "exploration"]);
});

test("language options are unique and sorted without regard to case", () => {
  const lower = project("lower", { techStack: ["python", "duckdb"] });
  const options = archiveOptions([...ALL, lower], TAG_ORDER, STATUS_ORDER);
  assert.deepEqual(options.languages, [
    "duckdb",
    "LightGBM",
    "Python",
    "PyTorch",
    "React",
    "TypeScript",
  ]);
});

test("a query string survives a round trip", () => {
  const options = archiveOptions(ALL, TAG_ORDER, STATUS_ORDER);
  const state = filters({ q: "bus ridership", tag: "model", status: "shipped", language: "Python" });

  const query = toQueryString(state);
  assert.equal(query, "q=bus+ridership&tag=model&status=shipped&lang=Python");
  assert.deepEqual(parseFilters(new URLSearchParams(query), options), state);
});

test("empty filters give an empty query string", () => {
  assert.equal(toQueryString(EMPTY_FILTERS), "");
  assert.equal(toQueryString(filters({ q: "   " })), "");
});

test("parsing ignores values that are not offered", () => {
  const options = archiveOptions(ALL, TAG_ORDER, STATUS_ORDER);
  const params = new URLSearchParams("tag=games&status=retired&lang=COBOL&q=bus");

  assert.deepEqual(parseFilters(params, options), filters({ q: "bus" }));
});

test("parsing matches a language without regard to case and keeps its display spelling", () => {
  const options = archiveOptions(ALL, TAG_ORDER, STATUS_ORDER);
  assert.equal(parseFilters(new URLSearchParams("lang=python"), options).language, "Python");
});
