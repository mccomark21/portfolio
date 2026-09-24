import { test } from "node:test";
import assert from "node:assert/strict";
import { includePlaceholders, isVisible } from "./visibility.ts";

const PLACEHOLDER = { placeholder: true };
const REAL = { placeholder: false };

test("a production build excludes placeholders", () => {
  const env = { NODE_ENV: "production" };

  assert.equal(includePlaceholders(env), false);
  assert.equal(isVisible(PLACEHOLDER, env), false);
  assert.equal(isVisible(REAL, env), true);
});

test("INCLUDE_PLACEHOLDERS=1 includes them in a production build", () => {
  const env = { NODE_ENV: "production", INCLUDE_PLACEHOLDERS: "1" };

  assert.equal(includePlaceholders(env), true);
  assert.equal(isVisible(PLACEHOLDER, env), true);
});

test("development always includes them", () => {
  const env = { NODE_ENV: "development" };

  assert.equal(includePlaceholders(env), true);
  assert.equal(isVisible(PLACEHOLDER, env), true);
});

test("only the value 1 opts in, so a stray value cannot leak a fixture", () => {
  for (const value of ["0", "true", "yes", ""]) {
    const env = { NODE_ENV: "production", INCLUDE_PLACEHOLDERS: value };
    assert.equal(includePlaceholders(env), false, `INCLUDE_PLACEHOLDERS=${value}`);
  }
});
