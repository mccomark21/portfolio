// Tests for the CloudFront Function on viewer request. The function file is
// plain cloudfront-js-2.0 code with no module exports, so this file runs it
// in a VM context the same way CloudFront does: the file defines `handler`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("./viewer-request.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);
// Objects made in the VM context have that context's Object prototype, and
// deepEqual compares prototypes. A JSON copy makes them plain objects here.
const handler = (event) => JSON.parse(JSON.stringify(context.handler(event)));

// The event shape CloudFront passes to a viewer request function.
function viewerEvent(uri, { host = "markmccomiskey.com", querystring = {} } = {}) {
  return {
    request: {
      method: "GET",
      uri,
      querystring,
      headers: { host: { value: host } },
      cookies: {},
    },
  };
}

test("a folder path gets index.html", () => {
  assert.equal(handler(viewerEvent("/projects/")).uri, "/projects/index.html");
});

test("the root gets index.html", () => {
  assert.equal(handler(viewerEvent("/")).uri, "/index.html");
});

test("a file passes through unchanged", () => {
  assert.equal(handler(viewerEvent("/_next/static/chunks/main.js")).uri, "/_next/static/chunks/main.js");
  assert.equal(handler(viewerEvent("/mark-mccomiskey-resume.pdf")).uri, "/mark-mccomiskey-resume.pdf");
});

test("a page path without a trailing slash redirects to the slash form", () => {
  assert.deepEqual(handler(viewerEvent("/projects")), {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: "/projects/" } },
  });
});

test("the slash redirect keeps the query string", () => {
  const response = handler(
    viewerEvent("/projects", {
      querystring: {
        tag: { value: "model" },
        status: { value: "shipped" },
      },
    }),
  );
  assert.equal(response.headers.location.value, "/projects/?tag=model&status=shipped");
});

test("the slash redirect keeps every value of a repeated query key", () => {
  const response = handler(
    viewerEvent("/projects", {
      querystring: {
        tag: { value: "model", multiValue: [{ value: "model" }, { value: "application" }] },
      },
    }),
  );
  assert.equal(response.headers.location.value, "/projects/?tag=model&tag=application");
});

test("www redirects to the apex with the same path and query", () => {
  assert.deepEqual(
    handler(
      viewerEvent("/projects/", {
        host: "www.markmccomiskey.com",
        querystring: { tag: { value: "model" } },
      }),
    ),
    {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: { location: { value: "https://markmccomiskey.com/projects/?tag=model" } },
    },
  );
});

test("www redirects a page path without a slash in one hop", () => {
  const response = handler(viewerEvent("/about", { host: "www.markmccomiskey.com" }));
  assert.equal(response.headers.location.value, "https://markmccomiskey.com/about/");
});

test("www redirects a file without adding a slash", () => {
  const response = handler(viewerEvent("/favicon.ico", { host: "www.markmccomiskey.com" }));
  assert.equal(response.headers.location.value, "https://markmccomiskey.com/favicon.ico");
});

test("the slash redirect keeps a parameter that has no value", () => {
  const response = handler(viewerEvent("/projects", { querystring: { flag: { value: "" } } }));
  assert.equal(response.headers.location.value, "/projects/?flag");
});
