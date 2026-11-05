# Google Forms + Apps Script setup

The site embeds four Google Forms as `<iframe>`s. None of them are live yet:
each page still has a `FORM_ID_*` placeholder in the embed `src` and in the
"open in a new tab" fallback link. Until those are replaced the iframe shows a
Google error page inside an otherwise finished design, so create the forms
before publishing. Do this once you (or CDSE's admin) have access to a Google
account that should own these forms.

## 1. Create the four forms

For each form: **forms.google.com → Blank form**, add the fields listed
below, then **Send → embed `<>` icon** to get the embed URL, which looks like:

```
https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxxxxxxxxxxxxxxxxxxxxxx/viewform
```

The `1FAIpQLSxxxx...` part is the **form ID**. Copy it into the matching
placeholder in the HTML (`FORM_ID_CONTACT`, `FORM_ID_MEMBERSHIP`,
`FORM_ID_ACCESSIBILITY_REPORT`, `FORM_ID_BLOG_SUBMISSION`) in both the
`src` of the `<iframe class="gform-embed">` and the fallback "open in new
tab" link right below it. Each appears once, in:

| Form | Page |
|---|---|
| Contact / Feedback | `contact.html` |
| Membership / Volunteer | `get-involved.html` |
| Accessibility Issue Report | `report-issue.html` |
| Blog Submission | `submit-blog.html` |

### Contact / Feedback (`contact.html`)
- Full name (short answer, required)
- Email (short answer, required, "Response validation: email")
- Topic (multiple choice: General enquiry / Feedback on CDSE's work / Feedback on this website / Media or press / Partnership or collaboration)
- Message (paragraph, required)

### Membership / Volunteer (`get-involved.html`)
- Full name (short answer, required)
- Email (short answer, required, validated)
- Phone number (short answer, optional)
- Year of study / role (short answer, required)
- Interest (multiple choice: Full membership / Event-based volunteering / Either)
- Areas of interest (short answer, optional — e.g. research, policy, accessibility audits, legal literacy, events, design)
- Why do you want to join CDSE? (paragraph, optional)

### Accessibility Issue Report (`report-issue.html`)
- Name (short answer, optional — allow anonymous reports)
- Email (short answer, optional)
- Type of issue (multiple choice: Ramp/incline, Railing, Surface, Signage, Restroom/washroom, Digital resource, Golf-cart mobility service, Other)
- Location on campus (short answer, required)
- Description (paragraph, required)
- Urgency (multiple choice: Low / Medium / High)

### Blog Submission (`submit-blog.html`)

This one is an *alternative* to CDSE's real, currently-working process:
emailing a `.doc`/`.docx` manuscript to **cdse.blog@nlujodhpur.ac.in** with
subject line `CDSE Blog Submission – [Title of the Blog]` (see the
Submission Guidelines on `submit-blog.html`, sourced verbatim from
`reference/bhb-blog-archive.html`). The submit-blog.html page leads with that
email flow (a pre-filled `mailto:` button) and offers this form underneath
as a convenience. Fields:

- Blog title (short answer, required)
- Author name(s) (short answer, required — note "up to two, comma-separated")
- Email (short answer, required, validated)
- Abstract (~100 words) (paragraph, required)
- Manuscript file (**file upload** question, required — .doc/.docx, named
  `CDSE_blogsubmission_Title of the blog` per the real formatting rules:
  Times New Roman 12pt, 1.5 line spacing, justified, bold+underlined headings)
- Declaration checkbox (required): "I confirm this submission is original, not under review elsewhere, complies with the <10% similarity requirement, and contains no AI-generated content."

Route responses (or forward the acknowledgement) to
**cdse.blog@nlujodhpur.ac.in**, not the general `cdse@nlujodhpur.ac.in`
inbox used by the other three forms.

## 2. Turn on response notifications (baseline, no code)

In each form: **Responses tab → ⋮ menu → Get email notifications for new responses**.
This alone covers "someone should know a submission came in" without any
Apps Script.

## 3. Apps Script automation (optional, for more than a plain email)

Use this when you want acknowledgement emails to the *submitter*, routing
by urgency/topic, or — once Supabase is connected — mirroring form
responses into a Supabase table.

1. Open the form's linked Sheet (**Responses → the green Sheets icon**), or
   create one via **Responses → ⋮ → Select response destination**.
2. In the Sheet: **Extensions → Apps Script**.
3. Paste in the contents of `docs/apps-script-template.gs` from this repo,
   adjusting the `CONFIG` block at the top for the form you're wiring up
   (recipient email, which column is which, urgency routing, etc.).
4. Run `createTrigger` once from the Apps Script editor (▶ button) to
   install the `onFormSubmit` trigger — Apps Script will ask you to
   authorize it (it's your own script acting on your own Sheet).
5. Submit a test response to the live form and confirm the acknowledgement
   / notification emails arrive.

## 4. Later: mirroring into Supabase

Once a Supabase project is connected (project URL + service role key), the
`pushToSupabase_` function stub in `apps-script-template.gs` can be filled
in to `POST` each new form response to a Supabase table via its REST API
(`/rest/v1/<table>`), so membership applications and accessibility reports
end up queryable alongside the blog's `posts` table. Keep the **service
role key** in Apps Script's `Project Settings → Script properties`, never
hard-coded in the script body.
