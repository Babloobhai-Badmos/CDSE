# CDSE — Centre for Disability Studies and Empowerment (NLU Jodhpur)

Static, accessibility-first website for CDSE. No build step — plain HTML/CSS/JS.

## Pages

- `index.html` — Home
- `about.html` — About CDSE, mission, leadership, milestones
- `projects.html` — Rajiv K. Luthra – NLUJ Accessibility Lab, golf-cart mobility service, campus accessibility audits
- `blog.html` — Call for Blogs + submission form
- `get-involved.html` — Membership / volunteer application form
- `report-issue.html` — Campus accessibility issue-report survey
- `contact.html` — Contact / feedback form

## Accessibility

Built to WCAG 2.1 AA in spirit:
- Skip-to-content link, semantic landmarks (`header`/`nav`/`main`/`footer`), `aria-current` on active nav links
- Keyboard-focusable controls with a visible focus ring
- On-page toolbar for text size (A−/A/A+) and a high-contrast theme, both persisted via `localStorage`
- Labelled form fields, grouped radio/checkbox sets in `fieldset`/`legend`, hints wired via `aria-describedby`
- Colour palette checked for 4.5:1+ contrast on body text

Please re-verify with a screen reader (NVDA/VoiceOver) and an automated tool (axe, Lighthouse) before launch.

## Forms — you need a backend before these work

The site has no server. The four forms (`contact-form`, `membership-form`, `survey-form`, `blog-form`) are wired for **Netlify Forms** (`data-netlify="true"` + hidden `form-name` field) with a JS `fetch` submit handler in `js/main.js` that shows a success/error message.

- **If you deploy to Netlify**: forms work out of the box — submissions appear in the Netlify dashboard. No extra setup needed beyond deploying.
- **If you deploy elsewhere** (GitHub Pages, Vercel, your own host): Netlify Forms won't run. Swap the `action` attribute on each `<form>` for a real endpoint — e.g. [Formspree](https://formspree.io), [Google Forms](https://forms.google.com) (via a hidden iframe), or your own backend — and update `js/main.js` if the response contract differs.

## Content source note

The task asked to port over all content from the live site at nlujcdse.in. This session's network policy blocked direct access to that domain (`EGRESS_BLOCKED`), so content here was reconstructed from web-search snippets and news coverage (SCC Online, LiveLaw, LinkedIn posts, NLUJ's own news page) rather than a direct scrape. **Before launch, cross-check every page against the live site** for: exact team member list, precise addresses/contact details, additional projects/events not surfaced by search, past blog posts, and any photos/logos (none were available to reuse here — replace the placeholder text/icon branding with real assets).
