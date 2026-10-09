import { test } from "node:test";
import assert from "node:assert/strict";
import { findLeakedPages, hasPlaceholderBadge } from "./check-placeholders.mjs";

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

test("a page with a placeholder badge is reported", () => {
  assert.equal(hasPlaceholderBadge('<span data-placeholder-badge="">Placeholder</span>'), true);
});

test("a page with no placeholder badge passes", () => {
  assert.equal(hasPlaceholderBadge("<h1>Mark McComiskey</h1>"), false);
});
