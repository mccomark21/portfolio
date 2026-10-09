import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_CAP,
  assertUniqueRanks,
  findDuplicateRanks,
  selectFeatured,
} from "./featured.ts";

function project(slug: string, featured?: number) {
  return { slug, frontmatter: { featured } };
}

const slugs = (projects: { slug: string }[]) => projects.map((p) => p.slug);

test("featured projects come back in ascending rank order", () => {
  const result = selectFeatured([
    project("third", 3),
    project("archive-only"),
    project("first", 1),
    project("second", 2),
  ]);

  assert.deepEqual(slugs(result), ["first", "second", "third"]);
});

test("a project with no rank is left out", () => {
  const result = selectFeatured([project("archive-only"), project("pinned", 4)]);

  assert.deepEqual(slugs(result), ["pinned"]);
});

test("at most FEATURED_CAP projects come back", () => {
  const many = Array.from({ length: FEATURED_CAP + 3 }, (_, i) => project(`p${i + 1}`, i + 1));

  assert.equal(FEATURED_CAP, 5);
  assert.deepEqual(slugs(selectFeatured(many)), ["p1", "p2", "p3", "p4", "p5"]);
});

test("zero featured projects is a valid, empty result", () => {
  assert.deepEqual(selectFeatured([]), []);
  assert.deepEqual(selectFeatured([project("a"), project("b")]), []);
});

test("a duplicate rank stops the build and names both slugs", () => {
  const projects = [project("alpha", 2), project("beta", 1), project("gamma", 2)];

  assert.throws(
    () => selectFeatured(projects),
    (error: Error) => {
      assert.match(error.message, /rank 2/);
      assert.match(error.message, /"alpha"/);
      assert.match(error.message, /"gamma"/);
      assert.doesNotMatch(error.message, /"beta"/);
      return true;
    },
  );
});

test("every collision is reported, in rank order", () => {
  const collisions = findDuplicateRanks([
    project("d", 4),
    project("a", 1),
    project("e", 4),
    project("b", 1),
    project("c", 1),
    project("f", 5),
  ]);

  assert.deepEqual(collisions, [
    { rank: 1, slugs: ["a", "b", "c"] },
    { rank: 4, slugs: ["d", "e"] },
  ]);
});

test("unique ranks pass the check", () => {
  assert.doesNotThrow(() => assertUniqueRanks([project("a", 1), project("b", 2), project("c")]));
});
