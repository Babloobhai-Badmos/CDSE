// CDSE Blog — post data source.
//
// With js/config.js filled in, posts come from the Supabase `posts` table
// (see supabase/migrations). If it isn't configured, or the request fails,
// the static archive below is used, so the site always has content: the real
// 16-post archive from nlujcdse.in/blogs-2/ (title + author + link out to the
// original; no dates/excerpts are published there, so none are invented).
//
// Every post is normalised to:
//   { slug, title, author, summary, hasBody, url, isExternal,
//     audioUrl, audioDuration, body? }
// where `url` is the on-site post page (post.html?slug=...) when we hold the
// full text, otherwise the external link.

(function (window) {
  "use strict";

  var STATIC_POSTS = [
    {
      slug: "4-percent-disability-reservation",
      title: "The 4% That Isn't: How India's Disability Reservation Law Loses Its Own Seats",
      author: "Ronit Agarwal and Tanu Tyagi, 2nd-year students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-4-that-isnt-how-indias-disability-reservation-law-loses-its-own-seats/",
    },
    {
      slug: "right-to-choose",
      title: "The Right to Choose: Why Disability Rights Are About More Than Protection",
      author: "Shambhavi Prakash, 1st-year B.A. LL.B. (Hons.) student at National Law University, Delhi",
      external_url: "https://nlujcdse.in/the-right-to-choose-why-disability-rights-are-about-more-than-protection/",
    },
    {
      slug: "digital-accessibility-civil-right",
      title: "Digital Accessibility as a Civil Right: The Legal and Psychological Impacts of Dark Patterns on Disabled Consumers",
      author: "Aaditya Prasad A and Anaan Noor, 4th-year B.A. LL.B. (Hons.) students at NUALS, Kochi",
      external_url: "https://nlujcdse.in/digital-accessibility-as-a-civil-right-the-legal-and-psychological-impacts-of-dark-patterns-on-disabled-consumers/",
    },
    {
      slug: "invisible-influence-media",
      title: "The Invisible Influence of Media on Disability Rights",
      author: "Suhani Goel, 1st-year B.A. Mass Communication student at Symbiosis, Pune, and Samay Tulsyan, 4th-year B.B.A. LL.B. (Trade Hons.) student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-invisible-influence-of-media-on-disability-rights/",
    },
    {
      slug: "algorithmic-exclusion-ai",
      title: "Algorithmic Exclusion and Disability: Can Indian Law Respond to AI-Driven Discrimination?",
      author: "Nandhana V and Aditya Garg, 4th-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/algorithmic-exclusion-and-disability-can-indian-law-respond-to-ai-driven-discrimination/",
    },
    {
      slug: "corporate-discrimination-liability",
      title: "Corporate Discrimination Liability: How Section 3 of the RPwD Act Might Transform Indian Employment Law",
      author: "Gauraansh Arora and Joy Kukkar, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/corporate-discrimination-liability-the-way-section-3-of-the-rpwd-act-might-transform-indian-employment-law/",
    },
    {
      slug: "architecture-of-dignity",
      title: "The Architecture of Dignity: Social Realities and the Fight for Disability Rights",
      author: "Sunaina, law graduate from Panjab University, Chandigarh",
      external_url: "https://nlujcdse.in/the-architecture-of-dignity-social-realities-and-the-fight-for-disability-rights/",
    },
    {
      slug: "rethinking-electoral-exclusion",
      title: "Rethinking Electoral Exclusion: Intellectual Disability and the Right to Vote",
      author: "Namandeep Kaur, 4th-year B.A. LL.B. (Hons.) student at Rajiv Gandhi National University of Law, Punjab",
      external_url: "https://nlujcdse.in/rethinking-electoral-exclusion-intellectual-disability-and-the-right-to-vote/",
    },
    {
      slug: "when-kyc-excludes",
      title: "When KYC Excludes: Disability Rights and Digital Finance",
      author: "Devansh Awasthi, B.A. LL.B. (Hons.), III Year student at Dr. Ram Manohar Lohiya National Law University",
      external_url: "https://nlujcdse.in/when-kyc-excludes-disability-rights-and-digital-finance/",
    },
    {
      slug: "medical-benchmarks-functional-capability",
      title: "From Medical Benchmarks to Functional Capability: Redefining Reasonable Accommodation After Prabhu Kumar v. State of Himachal Pradesh",
      author: "Mihika Joshi, 2nd-year student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/from-medical-benchmarks-to-functional-capability-redefining-reasonable-accommodation-after-prabhu-kumar-v-state-of-himachal-pradesh/",
    },
    {
      slug: "ramps-without-rights",
      title: "Ramps Without Rights: The Limits of Accommodation in Government Employment",
      author: "Ahan Garg and Vitthala Agarwal, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/ramps-without-rights-the-limits-of-accommodation-in-government-employment/",
    },
    {
      slug: "disability-behind-bars",
      title: "Disability Behind Bars: Rethinking Prison Administration With the RPwD Act",
      author: "Ayush Dewangan, LLM student at Hidayatullah National Law University (HNLU), Raipur, and Leesa Ueike, Practising Advocate at the District Courts and High Court of Chhattisgarh",
      external_url: "https://nlujcdse.in/disability-behind-bars-rethinking-prison-administration-with-the-rpwd-act/",
    },
    {
      slug: "equal-access-justice-deaf-mute",
      title: "Equal Access to Justice for Deaf and Mute People: Still a Long Way to Go?",
      author: "Uma Pareek, 4th-year student at Dharmashastra National Law University, Jabalpur",
      external_url: "https://nlujcdse.in/equal-access-to-justice-for-deaf-and-mute-people-still-a-long-way-to-go/",
    },
    {
      slug: "access-denied-mental-health",
      title: "Access Denied: Why Mental Health Services Are Still a Luxury for Persons With Disabilities in India",
      author: "Sunidhi Khabya, 3rd-year law student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/access-denied-why-mental-health-services-are-still-a-luxury-for-persons-with-disabilities-in-india/",
    },
    {
      slug: "enabling-statute-mental-health",
      title: "The Enabling Statute in India Concerning Mental Health and Persons With Disabilities",
      author: "Noor Bansal and Tanishka Agarwal, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-enabling-statute-in-india-concerning-mental-health-and-persons-with-disabilities/",
    },
    {
      slug: "poverty-disability-incarceration-pipeline",
      title: "The Poverty-Disability-Incarceration Pipeline: How India's Criminal Justice System Criminalizes the Economic Exclusion of Persons With Disabilities",
      author: "Pranay Rajesh Sonkusare, B.Sc. LL.B. (Hons.), 2nd-year student at West Bengal National University of Juridical Sciences, Kolkata",
      external_url: "https://nlujcdse.in/the-poverty-disability-incarceration-pipeline-how-indias-criminal-justice-system-criminalizes-the-economic-exclusion-of-persons-with-disabilities/",
    },
  ];

  var LIST_FIELDS =
    "slug,title,author,summary,external_url,has_body,audio_url,audio_duration_seconds,sort_order,published_at";

  function config() {
    var c = window.CDSE_CONFIG || {};
    return c.supabaseUrl && c.supabaseAnonKey ? c : null;
  }

  function normalise(row) {
    var hasBody = row.has_body === true || (typeof row.body === "string" && row.body.trim() !== "");
    return {
      slug: row.slug,
      title: row.title,
      author: row.author,
      summary: row.summary || "",
      hasBody: hasBody,
      isExternal: !hasBody,
      url: hasBody ? "post.html?slug=" + encodeURIComponent(row.slug) : row.external_url,
      externalUrl: row.external_url || "",
      audioUrl: row.audio_url || "",
      audioDuration: row.audio_duration_seconds || 0,
      body: typeof row.body === "string" ? row.body : "",
    };
  }

  async function rest(path) {
    var c = config();
    var res = await fetch(c.supabaseUrl.replace(/\/$/, "") + "/rest/v1/" + path, {
      headers: { apikey: c.supabaseAnonKey, Authorization: "Bearer " + c.supabaseAnonKey },
    });
    if (!res.ok) throw new Error("Supabase request failed: " + res.status);
    return res.json();
  }

  function staticPosts() {
    return STATIC_POSTS.map(normalise);
  }

  async function getPosts() {
    if (config()) {
      try {
        var rows = await rest(
          "posts?select=" + LIST_FIELDS +
          "&published=eq.true&order=published_at.desc.nullslast,sort_order.asc"
        );
        return rows.map(normalise);
      } catch (e) {
        if (window.console) console.warn("Using built-in post list:", e.message);
      }
    }
    return staticPosts();
  }

  // Returns the full post (with body) or null.
  async function getPost(slug) {
    if (config()) {
      try {
        var rows = await rest("posts?select=*&published=eq.true&slug=eq." + encodeURIComponent(slug) + "&limit=1");
        return rows.length ? normalise(rows[0]) : null;
      } catch (e) {
        if (window.console) console.warn("Using built-in post list:", e.message);
      }
    }
    return staticPosts().find(function (p) { return p.slug === slug; }) || null;
  }

  window.CDSEPosts = { getPosts: getPosts, getPost: getPost };
})(window);
