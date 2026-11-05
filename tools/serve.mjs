#!/usr/bin/env node
// Tiny static server for local preview.
//
//   node tools/serve.mjs            → http://localhost:8123
//   node tools/serve.mjs 4000       → http://localhost:4000
//
// The site uses clean URLs (/projects, not /projects.html), which a plain
// "open the file" preview cannot reproduce. This server resolves them the same
// way Cloudflare Pages and Netlify do, so what you see locally matches
// production:
//
//   /              → index.html
//   /projects      → projects.html
//   /post?slug=x   → post.html?slug=x
//   /projects.html → 301 to /projects
//   anything else  → 404.html with status 404
//
// No dependencies, no build step. Ctrl+C to stop.

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const port = Number(process.argv[2] || process.env.PORT || 8123);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

function file(path) {
  const full = normalize(join(root, path));
  // Never serve anything outside the site directory.
  if (full !== root && !full.startsWith(root + sep)) return null;
  if (!existsSync(full)) return null;
  try {
    return statSync(full).isFile() ? full : null;
  } catch {
    return null;
  }
}

// Maps a URL path to a file, the way a static host's clean-URL routing does.
function resolve(pathname) {
  if (pathname === "/") return file("index.html");
  const rel = pathname.replace(/^\//, "").replace(/\/$/, "");

  if (pathname.endsWith("/")) return file(rel + "/index.html");

  const asFile = file(rel);
  if (asFile && extname(rel)) return asFile;      // /css/style.css, /robots.txt
  if (asFile) return asFile;                       // exact match without extension

  const withHtml = file(rel + ".html");            // /projects → projects.html
  if (withHtml) return withHtml;

  return file(rel + "/index.html");                // /docs/ → docs/index.html
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain" });
    return res.end("Bad request");
  }

  // Old .html links keep working; bounce them to the canonical clean URL.
  if (pathname !== "/404.html" && pathname.endsWith(".html")) {
    const clean = pathname.replace(/\.html$/, "").replace(/^\/index$/, "/");
    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    res.writeHead(301, { Location: clean + query });
    return res.end();
  }

  const full = resolve(pathname);
  const type = full ? TYPES[extname(full).toLowerCase()] || "application/octet-stream" : null;

  if (full) {
    const body = readFileSync(full); // site is tiny; no streaming needed
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": "no-store", // always see your edits on refresh
    });
    return res.end(req.method === "HEAD" ? undefined : body);
  }

  const notFound = file("404.html");
  const body = notFound ? readFileSync(notFound) : Buffer.from("404 Not Found");
  res.writeHead(404, {
    "Content-Type": notFound ? TYPES[".html"] : "text/plain",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

server.listen(port, () => {
  console.log(`CDSE site: http://localhost:${port}`);
  console.log(`  /            → index.html`);
  console.log(`  /projects    → projects.html`);
  console.log(`  /post?slug=… → post.html?slug=…`);
  console.log("Ctrl+C to stop.");
});
