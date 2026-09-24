import { test } from "node:test";
import assert from "node:assert/strict";
import { findLeakedPages } from "./check-placeholders.mjs";

test("a placeholder page in the export is reported", () => {
  const emitted = new Set(["fixture-one", "real-project"]);

  const leaked = findLeakedPages(["fixture-one", "fixture-two"], (slug) => emitted.has(slug));

  assert.deepEqual(leaked, ["fixture-one"]);
});

test("an export with no placeholder page passes", () => {
  const emitted = new Set(["real-project"]);

  const leaked = findLeakedPages(["fixture-one", "fixture-two"], (slug) => emitted.has(slug));

  assert.deepEqual(leaked, []);
});

test("content with no placeholders has nothing to leak", () => {
  assert.deepEqual(findLeakedPages([], () => true), []);
});
