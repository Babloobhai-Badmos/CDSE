# CDSE — Centre for Disability Studies and Empowerment (NLU Jodhpur)

Static, accessibility-first website for CDSE. No build step — plain HTML/CSS/JS.

Theme matches the real `nlujcdse.in` brand (see `reference/Untitled-1.html`,
the reference page this was rebuilt from): black header, cream `#f7f4ef`
background, **Cardo** serif for headings and the italic hero line, **Inter**
for body text, real CDSE logo/hero imagery, and a black full-width pull-quote
band.

## Pages

- `index.html` — Home
- `about.html` — About the Centre, mission, leadership, milestones
- `projects.html` — Rajiv K. Luthra – NLUJ Accessibility Lab, golf-cart mobility service, campus accessibility audits
- `blog.html` — Medium-style blog listing (featured post + card grid, tag filters) + Call for Blogs + submission form
- `get-involved.html` — Membership / volunteer application form
- `report-issue.html` — Campus accessibility issue-report form
- `contact.html` — Contact / feedback form

## Architecture

- **Blog**: `js/posts.js` exposes `CDSEPosts.getPosts()`, currently returning
  a small static array of real, sourced Centre updates. `js/blog-render.js`
  renders it Medium-style (large featured post + responsive card grid + tag
  filter pills) into `blog.html`. This is written to be a one-function swap
  to Supabase later — see the comment block at the top of `js/posts.js`.
- **Forms**: contact/feedback, membership/volunteer, accessibility issue
  report, and blog submission are each a Google Form embedded as an
  `<iframe>`, styled to sit inside the page's card layout, with a
  "open in a new tab" fallback link. None are wired to real forms yet —
  each page has a `FORM_ID_*` placeholder and a `.setup-note` explaining
  what to create. **See `docs/google-forms-setup.md`** for the exact field
  list per form and how to get each embed URL.
- **Automation**: `docs/apps-script-template.gs` is a ready-to-paste Google
  Apps Script that, once attached to a form's response Sheet, emails an
  acknowledgement to the submitter, notifies `cdse@nlujodhpur.ac.in` (with
  urgency-based subject-line flagging for accessibility reports), and has a
  stubbed-out `pushToSupabase_()` for mirroring responses into Supabase once
  that's connected.
- **Supabase**: intentionally **not provisioned yet** — you're providing a
  separate account/project for this. When ready, share the project URL and
  anon key and I'll wire up: a `posts` table for the blog (swapping
  `js/posts.js`'s static array for a `fetch` against the REST API), and
  tables for members/reports/submissions that the Apps Script automation
  can mirror into.

## Accessibility

Built to WCAG 2.1 AA in spirit:
- Skip-to-content link, semantic landmarks (`header`/`nav`/`main`/`footer`), `aria-current` on active nav links
- Keyboard-focusable controls with a visible focus ring
- On-page toolbar for text size (A−/A/A+) and a high-contrast theme, both persisted via `localStorage`
- Labelled form fields (for the parts we control — Google's own form UI handles labelling inside the embed)
- Colour palette checked for 4.5:1+ contrast on body text

Please re-verify with a screen reader (NVDA/VoiceOver) and an automated tool (axe, Lighthouse) before launch.

## Content source note

The task asked to port over all content from the live site at nlujcdse.in.
This session's network policy blocked direct access to that domain
(`EGRESS_BLOCKED`), so most page copy was reconstructed from web-search
snippets and news coverage (SCC Online, LiveLaw, LinkedIn posts, NLUJ's own
news page). The homepage hero, quote, logo, favicon, nav labels, footer, and
color/font theme now come directly from `reference/Untitled-1.html`, a real
snapshot of the site's home page the user provided. **Before launch,
cross-check every page against the live site** for: exact team member list,
precise addresses, additional projects/events not surfaced by search, and
past blog posts.
