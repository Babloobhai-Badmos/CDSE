# CDSE — Centre for Disability Studies and Empowerment (NLU Jodhpur)

Static, accessibility-first website for CDSE. No build step — plain HTML/CSS/JS.

Theme matches the real `nlujcdse.in` brand (see `reference/Untitled-1.html`,
the reference page this was rebuilt from): black header, cream `#f7f4ef`
background, **Cardo** serif for headings and the italic hero line, **Inter**
for body text, real CDSE logo/hero imagery, and a black full-width pull-quote
band. The header goes translucent with a blur once you scroll, and the
mobile/overflow menu uses a plain three-bar icon.

## Pages

- `index.html` — Home (hero → pull-quote → footer only, per the reference)
- `about.html` — Who we are → what we do → full-screen sticky-scroll image → milestones → quote (bottom, before footer)
- `projects.html` — All 6 listed projects: Accessibility Lab (as a scroll-reveal), golf-cart service, the April 2025 infrastructure audit, UN Millennium Fellowship (Saathi Rights and Reach), and the September 2025 staff sensitization session
- `blogs.html` — Three-tier archive: one hero post (big image, big fonts) → "Latest" (next 3, as cards) → "Archives" (the rest, compact text grid — asterisk mark, underlined small-caps title, byline)
- `post.html` — A single blog post (`?slug=...`) with its audio player; archive posts without on-site text just link out
- `admin.html` — Editor page (sign in, write/publish posts, generate audio); needs Supabase, see `docs/supabase-r2-setup.md`
- `submit-blog.html` — Submission guidelines + email/Google Form ways to submit a blog
- `get-involved.html` — Membership / volunteer application form
- `report-issue.html` — Campus accessibility issue-report form
- `contact.html` — Contact / feedback form

## Architecture

- **Blog**: `js/posts.js` exposes `CDSEPosts.getPosts()`, currently returning
  the real 16-post archive from `reference/bhb-blog-archive.html` (title +
  author byline for each — the archive page doesn't publish per-post dates,
  categories, or excerpts, so none are fabricated; each card links out to
  the full post on nlujcdse.in). `js/blog-render.js` splits it into the
  three tiers on `blogs.html` — `posts[0]` as the hero, `posts[1..3]` as
  "Latest", `posts[4..]` as "Archives" — and is written for a one-function
  swap to Supabase later (see the comment block at the top of `js/posts.js`).
- **Forms**: contact/feedback, membership/volunteer, and accessibility issue
  report are each a Google Form embedded as an `<iframe>`. Blog submission
  (`submit-blog.html`) leads with CDSE's real, currently-working process — a
  `.doc`/`.docx` emailed to `cdse.blog@nlujodhpur.ac.in` with a specific
  subject line and formatting (Times New Roman 12pt, 1.5 spacing, justified)
  — with a Google Form offered underneath as a convenience alternative.
  None of the forms are wired to real Google Forms yet — each page has a
  `FORM_ID_*` placeholder and a `.setup-note` explaining what to create.
  **See `docs/google-forms-setup.md`** for the exact field list per form
  and how to get each embed URL.
- **Automation**: `docs/apps-script-template.gs` is a ready-to-paste Google
  Apps Script that, once attached to a form's response Sheet, emails an
  acknowledgement to the submitter, notifies the right inbox (with
  urgency-based subject-line flagging for accessibility reports), and has a
  stubbed-out `pushToSupabase_()` for mirroring responses into Supabase once
  that's connected.
- **Supabase + R2 (built, awaiting accounts)**: `supabase/` has the database schema, seed data and the `generate-audio` Edge Function; `js/posts.js` reads from Supabase once `js/config.js` is filled in and otherwise uses the built-in list. Audio files go to Cloudflare R2. **Setup steps: `docs/supabase-r2-setup.md`.**
- **Supabase (earlier note)**: was **not provisioned** — you're providing a
  separate account/project for this. When ready, share the project URL and
  anon key and I'll wire up: a `posts` table for the blog (swapping
  `js/posts.js`'s static array for a `fetch` against the REST API), and
  tables for members/reports/submissions that the Apps Script automation
  can mirror into.

## Accessibility

Built to WCAG 2.1 AA in spirit:
- Skip-to-content link, semantic landmarks (`header`/`nav`/`main`/`footer`), `aria-current` on active nav links
- Keyboard-focusable controls with a visible focus ring
- On-page toolbar for text size (A−/A/A+) and a high-contrast theme on interior pages, persisted via `localStorage` (removed from the home page per request, to match the reference exactly)
- Labelled form fields (for the parts we control — Google's own form UI handles labelling inside the embed)
- Colour palette checked for 4.5:1+ contrast on body text

Please re-verify with a screen reader (NVDA/VoiceOver) and an automated tool (axe, Lighthouse) before launch.

## Content source note

The task asked to port over all content from the live site at nlujcdse.in.
This session's network policy blocks direct access to that domain
(`EGRESS_BLOCKED`), so the site is built from reference HTML snapshots the
user provided instead of a live scrape:

- `reference/Untitled-1.html` — the real home page (theme, hero, quote, logo, footer, nav labels)
- `reference/hhb-about-page.html` — the real About the Centre page
- `reference/ohp-our-projects.html` — the real Our Projects page (all 6 projects)
- `reference/bhb-blog-archive.html` — the real Blog archive (16 posts) and Submission Guidelines

Anything not covered by those four snapshots (e.g. the exact team roster
beyond Dr. Rashmi Mathur, or events after these snapshots were taken) is
still reconstructed from web-search snippets and news coverage (SCC Online,
LiveLaw, NLUJ's own news page) rather than a direct scrape. **Before launch,
cross-check every page against the live site** for anything published after
these snapshots.
