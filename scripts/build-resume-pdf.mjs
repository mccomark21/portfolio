/**
 * Print the built /resume page to out/mark-mccomiskey-resume.pdf.
 *
 * The PDF comes from the rendered page, so one edit to content/resume.json
 * changes both. The print stylesheet in src/app/resume/resume.css sets how the
 * PDF looks.
 *
 * Run this after `next build`. The export copies public/ during the build, so
 * a PDF written to public/ afterwards never reaches out/. This script writes
 * into out/ directly. out/ is gitignored, so no PDF is committed.
 *
 * Needs Chromium: npx playwright install chromium
 *
 * Run: node scripts/build-resume-pdf.mjs, after npm run build.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const OUT_ROOT = path.join(process.cwd(), "out");
const PDF_PATH = path.join(OUT_ROOT, "mark-mccomiskey-resume.pdf");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * Serve out/ the way a static host does. `/resume/` resolves to
 * `/resume/index.html`, from trailingSlash in next.config.ts.
 */
function serveOut() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = path.join(OUT_ROOT, urlPath);

    // Do not serve a file outside out/.
    if (!filePath.startsWith(OUT_ROOT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404).end();
      return;
    }

    const type = CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  if (!fs.existsSync(path.join(OUT_ROOT, "resume", "index.html"))) {
    console.error("No out/resume/index.html. Run npm run build first.");
    return 1;
  }

  const server = await serveOut();
  const { port } = server.address();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const response = await page.goto(`http://127.0.0.1:${port}/resume/`, {
      waitUntil: "networkidle",
    });
    if (!response?.ok()) {
      console.error(`The resume page did not load. Status ${response?.status()}.`);
      return 1;
    }

    // The page uses web fonts. Wait for them, or the PDF falls back to a
    // system font.
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: PDF_PATH,
      format: "Letter",
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
      printBackground: true,
    });
  } finally {
    await browser.close();
    server.close();
  }

  const size = fs.statSync(PDF_PATH).size;
  console.log(`Wrote ${path.relative(process.cwd(), PDF_PATH)} (${size} bytes).`);
  return 0;
}

process.exit(await main());
