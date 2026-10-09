import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPeriod, sortRoles } from "./resume.ts";
import type { ResumeRole } from "./schemas.ts";

function role(employer: string, start: string, end: string | null): ResumeRole {
  return { employer, title: "T", period: { start, end }, bullets: [], placeholder: false };
}

test("roles sort reverse-chronologically by start, not by file order", () => {
  const roles = [role("old", "2018-05", "2018-08"), role("new", "2022-03", null), role("mid", "2019-06", "2022-02")];

  assert.deepEqual(sortRoles(roles).map((r) => r.employer), ["new", "mid", "old"]);
});

test("at the same start, the open role comes first", () => {
  const roles = [role("closed", "2020-01", "2021-01"), role("open", "2020-01", null)];

  assert.deepEqual(sortRoles(roles).map((r) => r.employer), ["open", "closed"]);
});

test("an open role ends in Present", () => {
  assert.equal(formatPeriod({ start: "2022-03", end: null }), "Mar 2022 – Present");
  assert.equal(formatPeriod({ start: "2019-06", end: "2022-02" }), "Jun 2019 – Feb 2022");
});
