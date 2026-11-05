# CDSE — Centre for Disability Studies and Empowerment (NLU Jodhpur)

Static, accessibility-first website for CDSE. No build step — plain HTML/CSS/JS.

Theme matches the real `nlujcdse.in` brand (see `reference/Untitled-1.html`,
the reference page this was rebuilt from): black header, cream `#f7f4ef`
background, **Cardo** serif for headings and the italic hero line, **Inter**
for body text, real CDSE logo/hero imagery, and a black full-width pull-quote
band. The header goes translucent with a blur once you scroll, and the
mobile/overflow menu uses a plain three-bar icon.

## Status at a glance

This README is the current statement of record for the project.
`docs/CDSE-project-status.pdf` is a point-in-time report from October 2026,
kept for history — where the two disagree, this file wins.

| Area | State |
|---|---|
| Public pages | Built: home, About, Projects, Blogs, single post, Submit a blog, Get involved, Report an issue, Contact, Accessibility statement, and a 404 page. |
| Blog data | **Configured, schema missing.** `js/config.js` points at the Supabase project and the publishable key is valid, but `public.posts` does not exist yet, so `js/posts.js` serves the built-in 16-post archive as its fallback. Run step 1 of `docs/supabase-r2-setup.md`. |
| Editor (`admin.html`) | Built; the sign-in form loads and the client initialises, but no editor account works until the migration runs and the `editors` row exists. |
| Audio | Player built and used on post pages. **Audio is uploaded, not generated** — you make the MP3 with any TTS tool and upload it in the editor. The Azure text-to-speech path was removed. |
| Forms | **Four Google Forms are still placeholders.** Until `FORM_ID_*` is replaced, the embeds show a Google error page — do this before any public launch. |
| Images | Still hot-linked from `nlujcdse.in`. See "Known gaps". |
| Accessibility audit | Not done. `tools/check.mjs` checks markup, link and heading integrity only. |

## Pages

- `index.html` — Home: hero with three buttons, a "From the Blog" teaser (latest 3), pull-quote
- `about.html` — Who we are → what we do → stats → full-screen image → leadership → milestones → quote
- `projects.html` — All 6 listed projects, including the Accessibility Lab, the golf-cart service and the April 2025 audit
- `blogs.html` — Three-tier archive: one hero post → "Latest" (next 3, as cards) → "Archives" (the rest, compact text grid)
- `post.html` — A single blog post (`?slug=...`) with its cover image and audio player. The `<h1>` is rendered by `js/post-view.js`, so the file itself has none.
- `admin.html` — Editor page (sign in, write/publish posts, upload cover images and audio to R2); needs Supabase
- `submit-blog.html` — Submission guidelines + email/Google Form ways to submit
- `get-involved.html` — Membership / volunteer application form
- `report-issue.html` — Campus accessibility issue-report form
- `contact.html` — Contact / feedback form
- `accessibility.html` — Accessibility statement: what is in place, known limitations, how to report a barrier
- `404.html` — Not-found page

## URLs

Every page is served **without `.html`**:

```
/                 → index.html
/projects         → projects.html
/blogs            → blogs.html
/post?slug=my-post → post.html?slug=my-post
```

Links in the HTML are written as root-absolute clean paths (`/projects`), and
`js/posts.js` builds post links the same way. `_redirects` sends anything that
still asks for `/projects.html` to the clean address.

**Host requirement:** the server must resolve an extensionless path to the
matching `.html` file. Cloudflare Pages and Netlify both do this out of the box
and read `_redirects`. GitHub Pages does **not** — on GitHub Pages the only
option is one directory per page (`projects/index.html`), which shows
`/projects/` with a trailing slash. Vercel needs a `vercel.json` rewrite.

Locally, `.html` files are not directly usable — open a terminal and run:

```
node tools/serve.mjs          # http://localhost:8123
```

That server applies the same routing as production, so `/projects` works and
`/projects.html` redirects. `node tools/check.mjs` verifies every clean path
resolves to a real file and fails if a link keeps `.html`.

## Architecture

- **Blog**: `js/posts.js` exposes `CDSEPosts.getPosts()`, returning the 16-post
  archive from `reference/bhb-blog-archive.html` (title + author byline for
  each — the archive page publishes no per-post dates, categories or excerpts,
  so none are fabricated; each card links out to the original). When Supabase
  is configured it reads `posts` instead, and falls back to this list if the
  request fails. `js/blog-render.js` splits it into the three tiers on
  `blogs.html` — `posts[0]` hero, `posts[1..3]` latest, `posts[4..]` archives.
- **Reading page** (`post.html`): `js/posts.js` selects only the columns the
  page needs and caches the post in `sessionStorage` for 5 minutes; listing
  pages prefetch on hover/focus so clicking through is usually instant.
  `js/post-view.js` renders the cover image, the article, a contents list when
  the post has 3+ `##` headings, a reading-progress bar, and correct
  `<title>`/description/OG tags (including `og:image`) for the post. Text is
  inserted with `textContent` only, never parsed as HTML.
- **Cover images**: one optional image per post (`image_url` + `image_alt`).
  Uploaded to R2 from the editor, shown at the top of the post and on its
  listing card; the hero post on `blogs.html` uses it in place of the
  placeholder panel. Alt text falls back to the post title so an image is never
  published undescribed.
- **Audio**: not generated by the site. You produce the MP3 externally and
  upload it through `admin.html`; `js/audio-player.js` renders the player
  (play/pause, ±15/30s, speed, seek, resume position, lock-screen controls,
  download). Posts without an MP3 fall back to the browser's read-aloud.
  Uploads go through the `upload-file` Edge Function so R2 keys stay server-side.
- **Forms**: contact/feedback, membership/volunteer, and accessibility issue
  report are each a Google Form embedded as an `<iframe>`. Blog submission
  leads with CDSE's real, currently-working process — a `.doc`/`.docx` emailed
  to `cdse.blog@nlujodhpur.ac.in` with a specific subject line and formatting —
  with a Google Form offered underneath. **All four forms are placeholders
  until their IDs are filled in; see `docs/google-forms-setup.md`.**
- **Automation**: `docs/apps-script-template.gs` is a ready-to-paste Apps
  Script that, once attached to a form's response Sheet, emails an
  acknowledgement to the submitter, notifies the right inbox (with
  urgency-based subject lines for accessibility reports), and can mirror
  responses into Supabase via `pushToSupabase_()` once credentials are in
  Script Properties.
- **Supabase + R2**: `supabase/` has the schema, seed data, and the
  `upload-file` Edge Function. Audio, images and PDFs go to Cloudflare R2.
  **Setup steps: `docs/supabase-r2-setup.md`.**

## Tools

Neither script has dependencies.

```bash
node tools/check.mjs      # markup, heading, link and duplicate-id checks
node tools/gen-seed.mjs   # regenerate supabase/seed.sql from js/posts.js
```

`supabase/seed.sql` is a **generated file** — change `js/posts.js` and re-run
the generator, rather than editing both. `.github/workflows/check.yml` runs
both on every push and fails if the seed has drifted.

## Accessibility

Built to WCAG 2.1 AA in spirit, working towards 2.2 AA:

- Skip-to-content link, semantic landmarks (`header`/`nav`/`main`/`footer`), `aria-current` on active nav links, exactly one `<h1>` per page
- Keyboard-focusable controls with a two-tone focus indicator that stays visible on both light and dark backgrounds
- On-page toolbar for text size (A−/A/A+) and a high-contrast theme on every page, persisted via `localStorage`
- Links inside body copy are underlined, not distinguished by colour alone
- Audio player with native controls, no autoplay, and a device read-aloud fallback for posts without an MP3
- Labelled form fields (for the parts we control — Google's own form UI handles labelling inside the embed)
- Colour palette checked for 4.5:1+ contrast on body text
- `accessibility.html` states this publicly, including what still falls short

**Still to do:** an independent audit (axe/Lighthouse) and a screen-reader
pass (NVDA/VoiceOver). `tools/check.mjs` is not a substitute for either.

## Known gaps before launch

1. **Create the four Google Forms** and replace the `FORM_ID_*` placeholders (`docs/google-forms-setup.md`).
2. **Copy the images** off `nlujcdse.in` into this site (or R2); today every photo and the logo depends on the old site staying up.
3. **Run the SQL** — `js/config.js` now points at the project, but the blog tables may not exist yet. Run, in order: `20260101000000_blog.sql`, `20260102000000_post_images.sql`, `20260103000000_grants.sql`, then `seed.sql`; then add an editor row. The grants file is required — without it every read fails with `42501 permission denied for table posts` and the site silently shows its fallback posts instead of the database.
4. **Deploy `upload-file` and do one real upload** (audio + an image) to confirm the bucket is wired up and the returned URL plays.
5. **Add `sitemap.xml`** once the production domain is fixed — it needs an absolute URL, which is not known yet. (`post.html` now sets a `canonical` link from the live URL at runtime; that only helps clients that run JS.)
6. **Verify content facts** that came from search snippets rather than the snapshots: milestone dates, the stats strip, leadership beyond Dr. Rashmi Mathur.
7. **Screen-reader and automated audit** before publishing.

## Content source note

The task asked to port over all content from the live site at nlujcdse.in.
This session's network policy blocks direct access to that domain
(`EGRESS_BLOCKED`), so the site is built from reference HTML snapshots the
user provided instead of a live scrape:

- `reference/Untitled-1.html` — the real home page (theme, hero, quote, logo, footer, nav labels)
- `reference/hhb-about-page.html` — the real About the Centre page
- `reference/ohp-our-projects.html` — the real Our Projects page (all 6 projects)
- `reference/bhb-blog-archive.html` — the real Blog archive (16 posts) and Submission Guidelines

Anything not covered by those four snapshots is reconstructed from web-search
snippets and news coverage rather than a direct scrape. **Before launch,
cross-check every page against the live site** for anything published after
these snapshots.
