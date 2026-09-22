// CDSE Blog — post data source.
//
// This currently returns a small static array of real, sourced Centre
// updates (each links out to its original coverage, since we don't yet
// have the actual blog post bodies from nlujcdse.in).
//
// SUPABASE SWAP-IN: once a Supabase project is connected, replace the
// body of getPosts() with a fetch against the REST API, e.g.:
//
//   async function getPosts() {
//     const res = await fetch(
//       `${SUPABASE_URL}/rest/v1/posts?select=*&status=eq.published&order=published_at.desc`,
//       { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
//     );
//     return res.json();
//   }
//
// Expected "posts" table columns: id, title, excerpt, tag, image_url,
// author, published_at, read_time_minutes, external_url (nullable),
// body (nullable, for posts hosted on-site), status ('draft'|'published').

(function (window) {
  "use strict";

  var STATIC_POSTS = [
    {
      id: "accessibility-lab-inaugurated",
      title: "Rajiv K. Luthra – NLUJ Accessibility Lab Inaugurated",
      excerpt:
        "Students with special abilities inaugurated the first dedicated accessibility facility at NLU Jodhpur, housing screen readers, magnifiers, accessible digital repositories, and adaptive workstations.",
      tag: "Accessibility Lab",
      image_url: "https://nlujcdse.in/wp-content/uploads/2025/12/IMG_5113-scaled.jpg",
      author: "CDSE, NLU Jodhpur",
      published_at: "2026-05-22",
      read_time_minutes: 4,
      external_url:
        "https://www.livelaw.in/amp/lawschool/news/national-law-university-jodhpur-accessibility-lab-inaugurated-disability-rights-535028",
      external_source: "LiveLaw",
    },
    {
      id: "luthra-foundation-mou",
      title: "NLU Jodhpur and Rajiv K. Luthra Foundation Sign MoU",
      excerpt:
        "A Memorandum of Understanding to establish the Rajiv K. Luthra – NLUJ Accessibility Lab, including annual internships at Luthra & Luthra Law Offices for two students with disabilities from NLUJ.",
      tag: "Partnerships",
      image_url: null,
      author: "CDSE, NLU Jodhpur",
      published_at: "2025-12-08",
      read_time_minutes: 3,
      external_url:
        "https://www.scconline.com/blog/post/2025/12/08/rajiv-k-luthra-nluj-accessibility-lab-mou-announcement-2026/",
      external_source: "SCC Online",
    },
    {
      id: "golf-cart-mobility-service",
      title: "CDSE Launches Golf-Cart Mobility Service on Campus",
      excerpt:
        "A new mobility service allowing students who require assisted movement to request a golf cart through the main gate — dignified, flexible assistance around campus.",
      tag: "Campus Life",
      image_url: null,
      author: "CDSE, NLU Jodhpur",
      published_at: "2025-10-01",
      read_time_minutes: 2,
      external_url: null,
      external_source: null,
    },
    {
      id: "call-for-blogs",
      title: "Call for Blogs: Disability Rights, Accessibility, and Inclusive Policy",
      excerpt:
        "CDSE invites blog submissions on a rolling basis — 1000–1500 words plus a ~100-word abstract, up to two co-authors, sources hyperlinked in text.",
      tag: "Call for Blogs",
      image_url: null,
      author: "CDSE Editorial Board",
      published_at: "2026-06-16",
      read_time_minutes: 2,
      external_url:
        "https://www.scconline.com/blog/post/2026/06/16/cdse-nlu-jodhpur-call-for-blog-submissions-disability-rights-law/",
      external_source: "SCC Online",
    },
  ];

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  }

  async function getPosts() {
    // TODO: swap for a Supabase fetch once the project is connected (see comment above).
    return STATIC_POSTS.slice().sort(function (a, b) {
      return new Date(b.published_at) - new Date(a.published_at);
    });
  }

  window.CDSEPosts = { getPosts: getPosts, formatDate: formatDate };
})(window);
