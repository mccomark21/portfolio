// Tests for .github/workflows/deploy.yml. The workflow holds the only path to
// the live site, so these tests hold it to issue #13 and to the rules in
// infra/bootstrap/README.md that the deploy role trust policy depends on.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const workflow = parse(readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8"));
const jobs = Object.values(workflow.jobs);
const job = jobs[0];
const steps = job.steps;
const runOf = (step) => step.run ?? "";
const indexOfStep = (predicate) => steps.findIndex(predicate);

test("the workflow has one deploy job", () => {
  assert.equal(jobs.length, 1);
});

test("the workflow runs on a push to main and on manual dispatch", () => {
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.ok("workflow_dispatch" in workflow.on);
});

test("the workflow can request an OIDC token and cannot write to the repository", () => {
  assert.deepEqual(workflow.permissions, { "id-token": "write", contents: "read" });
});

// A GitHub environment changes the token sub to repo:...:environment:<name>,
// and the portfolio-deploy trust policy then rejects it.
test("the deploy job has no GitHub environment", () => {
  assert.equal(job.environment, undefined);
});

test("the job assumes portfolio-deploy through OIDC, with no stored key", () => {
  const step = steps.find((s) => s.uses?.startsWith("aws-actions/configure-aws-credentials@"));
  assert.ok(step, "a configure-aws-credentials step must exist");
  assert.equal(step.with["role-to-assume"], "arn:aws:iam::692112934115:role/portfolio-deploy");
  assert.equal(step.with["aws-region"], "us-east-1");
  assert.equal(step.with["aws-access-key-id"], undefined);
  assert.equal(step.with["aws-secret-access-key"], undefined);
});

test("the workflow no longer publishes to GitHub Pages", () => {
  assert.equal(steps.some((s) => s.uses?.startsWith("peaceiris/actions-gh-pages")), false);
});

test("the workflow never sets INCLUDE_PLACEHOLDERS", () => {
  assert.equal(JSON.stringify(workflow).includes("INCLUDE_PLACEHOLDERS="), false);
  for (const scope of [workflow.env, job.env, ...steps.map((s) => s.env)]) {
    assert.equal(scope?.INCLUDE_PLACEHOLDERS, undefined);
  }
});

test("install, build, placeholder check and resume PDF all run before any upload", () => {
  const install = indexOfStep((s) => runOf(s).includes("npm ci"));
  const build = indexOfStep((s) => runOf(s).includes("npm run build"));
  const check = indexOfStep((s) => runOf(s).includes("npm run check:placeholders"));
  const pdf = indexOfStep((s) => runOf(s).includes("build-resume-pdf.mjs"));
  const firstUpload = indexOfStep((s) => runOf(s).includes("aws s3 sync"));

  for (const [name, index] of Object.entries({ install, build, check, pdf, firstUpload })) {
    assert.notEqual(index, -1, `the ${name} step must exist`);
  }
  assert.ok(install < build && build < check && check < pdf && pdf < firstUpload);
});

test("the site bucket receives out/ and loses files that out/ no longer has", () => {
  const syncs = steps.filter((s) => runOf(s).includes("aws s3 sync"));
  assert.ok(syncs.every((s) => runOf(s).includes("s3://portfolio-site-692112934115")));
  assert.ok(syncs.some((s) => runOf(s).includes("--delete")));
});

test("a CloudFront invalidation of /* runs after every upload", () => {
  const lastUpload = steps.findLastIndex((s) => runOf(s).includes("aws s3 sync"));
  const invalidation = indexOfStep((s) => runOf(s).includes("aws cloudfront create-invalidation"));
  assert.ok(invalidation > lastUpload);
  assert.match(runOf(steps[invalidation]), /--distribution-id E3SQVTT7TTHMBH/);
  assert.match(runOf(steps[invalidation]), /--paths ["']?\/\*["']?/);
});

// A step that fails stops the job, so a failed build never reaches the upload.
test("no step before the upload may fail without stopping the job", () => {
  const firstUpload = indexOfStep((s) => runOf(s).includes("aws s3 sync"));
  assert.ok(steps.slice(0, firstUpload + 1).every((s) => !s["continue-on-error"]));
  assert.ok(steps.every((s) => s.if === undefined));
});
