#!/usr/bin/env node
// Dependency-free consistency checks for the CDSE site.
//
//   node tools/check.mjs
//
// Run this (or let .github/workflows/check.yml run it) before publishing. It
// catches the boring-but-costly mistakes: a second <h1>, a link to a page that
// does not exist, an image with no alt text, a duplicated id, a leftover
// Google Form placeholder.
//
// Exits 1 if there are errors, 0 otherwise. Warnings do not fail the build.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .sort();

// post.html renders its <h1> from js/post-view.js (the page is a shell), so it
// has no <h1> in its own markup. Everything else must have exactly one.
const H1_EXEMPT = new Set(["post.html"]);

let errors = 0;
let warnings = 0;
const fail = (m) => { errors++; console.log(`  ERROR  ${m}`); };
const warn = (m) => { warnings++; console.log(`  WARN   ${m}`); };

for (const page of pages) {
  const html = readFileSync(join(root, page), "utf8");
  const at = (m) => `${page}: ${m}`;

  // --- document basics -----------------------------------------------------
  if (!/^<!DOCTYPE html>/i.test(html)) fail(at("missing <!DOCTYPE html>"));
  if (!/<html[^>]+lang="/i.test(html)) fail(at("<html> has no lang attribute"));

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!title || !title[1].trim()) fail(at("missing or empty <title>"));

  const desc = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
  if (!desc || !desc[1].trim()) fail(at("missing meta description"));
  if (desc && desc[1].length > 180) warn(at(`meta description is ${desc[1].length} chars (aim for <= 160)`));

  if (!/<meta\s+property="og:title"/i.test(html)) fail(at("missing og:title"));

  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([\s\S]*?)"/i);
  if (ogDesc && desc && ogDesc[1] !== desc[1]) {
    warn(at("og:description does not match the meta description"));
  }
  if (!/<meta\s+name="twitter:card"/i.test(html)) fail(at("missing twitter:card"));

  // --- structure -----------------------------------------------------------
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (!H1_EXEMPT.has(page) && h1s !== 1) fail(at(`${h1s} <h1> elements (expected exactly 1)`));

  if (!/class="skip-link"/i.test(html)) fail(at("missing skip link"));
  if (!/<main[^>]+id="main-content"/i.test(html)) fail(at("missing <main id=\"main-content\">"));
  if (!/<nav[^>]+aria-label=/i.test(html)) fail(at("missing labelled <nav>"));

  // --- images --------------------------------------------------------------
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  for (const img of imgs) {
    if (!/\balt\s*=/i.test(img)) fail(at(`<img> without alt: ${img.slice(0, 90)}`));
  }

  // --- duplicate ids -------------------------------------------------------
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const d of new Set(dupes)) fail(at(`duplicate id="${d}"`));

  // --- local links and asset paths resolve ---------------------------------
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (!ref) continue;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) continue; // absolute, mailto:, #anchor
    const path = ref.split("#")[0].split("?")[0];
    if (!path) continue;

    // Site links are written as clean URLs: "/projects" is served from
    // projects.html and "/" from index.html by the host.
    if (path.startsWith("/")) {
      const rel = path === "/" ? "index.html" : path.replace(/^\/+/, "");
      const ok =
        existsSync(join(root, rel)) ||
        existsSync(join(root, rel + ".html")) ||
        existsSync(join(root, rel, "index.html"));
      if (!ok) fail(at(`broken local reference: ${ref}`));
      continue;
    }

    // A page link that still carries .html defeats the whole point.
    if (/\.html$/i.test(path)) {
      fail(at(`link keeps .html: ${ref} — write "/${path.replace(/\.html$/i, "")}" instead`));
      continue;
    }

    if (!existsSync(join(root, path))) fail(at(`broken local reference: ${ref}`));
  }

  // --- known placeholders --------------------------------------------------
  const placeholders = (html.match(/FORM_ID_[A-Z_]+/g) || []);
  if (placeholders.length) {
    warn(at(`${[...new Set(placeholders)].join(", ")} still placeholder — forms will not load`));
  }
}

// Assets referenced from CSS as well (relative to the stylesheet).
const css = readFileSync(join(root, "css", "style.css"), "utf8");
for (const m of css.matchAll(/url\(['"]?(?!data:|https?:)([^'")]+)['"]?\)/g)) {
  if (!existsSync(join(root, "css", m[1]))) fail(`css/style.css: missing asset ${m[1]}`);
}

console.log(
  `\n${pages.length} pages checked — ${errors} error(s), ${warnings} warning(s).`,
);
process.exit(errors ? 1 : 0);
