#!/usr/bin/env node
// Regenerates supabase/seed.sql from js/posts.js, so the 16 archive posts are
// written down once (in the site's fallback list) and never drift from the
// database seed.
//
//   node tools/gen-seed.mjs
//
// js/posts.js is a browser IIFE, so it is run here with a stand-in `window`
// and its own public API (CDSEPosts.getPosts) is used — no parsing of the
// file's text, so edits to the array are picked up automatically.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const postsJs = readFileSync(join(root, "js", "posts.js"), "utf8");

const fakeWindow = {};
new Function("window", postsJs)(fakeWindow);

const posts = await fakeWindow.CDSEPosts.getPosts();
if (!posts.length) {
  console.error("No posts found in js/posts.js — refusing to write an empty seed.");
  process.exit(1);
}

const q = (s) => "'" + String(s == null ? "" : s).replace(/'/g, "''") + "'";

const rows = posts.map((p, i) => {
  const url = p.externalUrl || p.url || "";
  if (!url) throw new Error(`Post "${p.slug}" has no external URL — the seed only covers archive links.`);
  return `  (${q(p.slug)}, ${q(p.title)}, ${q(p.author)}, ${q(url)}, true, ${i})`;
});

const sql = `-- Seeds the ${posts.length} archive posts that still live on nlujcdse.in. Safe to re-run.
-- They link out until you paste their full text into the \`body\` column.
--
-- GENERATED FILE — do not edit by hand. It is built from js/posts.js by
-- tools/gen-seed.mjs; run \`node tools/gen-seed.mjs\` after changing that list.

insert into public.posts (slug, title, author, external_url, published, sort_order) values
${rows.join(",\n")}
on conflict (slug) do nothing;
`;

// Written with CRLF to match the line endings used by the rest of the repo.
writeFileSync(join(root, "supabase", "seed.sql"), sql.replace(/\n/g, "\r\n"), "utf8");
console.log(`Wrote supabase/seed.sql (${posts.length} posts).`);
