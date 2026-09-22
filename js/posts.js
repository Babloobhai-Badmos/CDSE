// CDSE Blog — post data source.
//
// This is the real blog archive from nlujcdse.in/blogs-2/ (title + author
// byline for each post; the site doesn't publish per-post dates, categories,
// excerpts, or images on its archive listing, so we don't fabricate those —
// each entry links out to the full post on the original site).
//
// SUPABASE SWAP-IN: once a Supabase project is connected, replace the body
// of getPosts() with a fetch against the REST API, e.g.:
//
//   async function getPosts() {
//     const res = await fetch(
//       `${SUPABASE_URL}/rest/v1/posts?select=*&status=eq.published&order=published_at.desc`,
//       { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
//     );
//     return res.json();
//   }
//
// Suggested "posts" table columns once real dates/excerpts/images exist:
// id, title, excerpt, image_url, author, published_at, read_time_minutes,
// body (nullable, for posts hosted on-site), status ('draft'|'published').

(function (window) {
  "use strict";

  var STATIC_POSTS = [
    {
      id: "4-percent-disability-reservation",
      title: "The 4% That Isn't: How India's Disability Reservation Law Loses Its Own Seats",
      author: "Ronit Agarwal and Tanu Tyagi, 2nd-year students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-4-that-isnt-how-indias-disability-reservation-law-loses-its-own-seats/",
    },
    {
      id: "right-to-choose",
      title: "The Right to Choose: Why Disability Rights Are About More Than Protection",
      author: "Shambhavi Prakash, 1st-year B.A. LL.B. (Hons.) student at National Law University, Delhi",
      external_url: "https://nlujcdse.in/the-right-to-choose-why-disability-rights-are-about-more-than-protection/",
    },
    {
      id: "digital-accessibility-civil-right",
      title: "Digital Accessibility as a Civil Right: The Legal and Psychological Impacts of Dark Patterns on Disabled Consumers",
      author: "Aaditya Prasad A and Anaan Noor, 4th-year B.A. LL.B. (Hons.) students at NUALS, Kochi",
      external_url: "https://nlujcdse.in/digital-accessibility-as-a-civil-right-the-legal-and-psychological-impacts-of-dark-patterns-on-disabled-consumers/",
    },
    {
      id: "invisible-influence-media",
      title: "The Invisible Influence of Media on Disability Rights",
      author: "Suhani Goel, 1st-year B.A. Mass Communication student at Symbiosis, Pune, and Samay Tulsyan, 4th-year B.B.A. LL.B. (Trade Hons.) student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-invisible-influence-of-media-on-disability-rights/",
    },
    {
      id: "algorithmic-exclusion-ai",
      title: "Algorithmic Exclusion and Disability: Can Indian Law Respond to AI-Driven Discrimination?",
      author: "Nandhana V and Aditya Garg, 4th-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/algorithmic-exclusion-and-disability-can-indian-law-respond-to-ai-driven-discrimination/",
    },
    {
      id: "corporate-discrimination-liability",
      title: "Corporate Discrimination Liability: How Section 3 of the RPwD Act Might Transform Indian Employment Law",
      author: "Gauraansh Arora and Joy Kukkar, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/corporate-discrimination-liability-the-way-section-3-of-the-rpwd-act-might-transform-indian-employment-law/",
    },
    {
      id: "architecture-of-dignity",
      title: "The Architecture of Dignity: Social Realities and the Fight for Disability Rights",
      author: "Sunaina, law graduate from Panjab University, Chandigarh",
      external_url: "https://nlujcdse.in/the-architecture-of-dignity-social-realities-and-the-fight-for-disability-rights/",
    },
    {
      id: "rethinking-electoral-exclusion",
      title: "Rethinking Electoral Exclusion: Intellectual Disability and the Right to Vote",
      author: "Namandeep Kaur, 4th-year B.A. LL.B. (Hons.) student at Rajiv Gandhi National University of Law, Punjab",
      external_url: "https://nlujcdse.in/rethinking-electoral-exclusion-intellectual-disability-and-the-right-to-vote/",
    },
    {
      id: "when-kyc-excludes",
      title: "When KYC Excludes: Disability Rights and Digital Finance",
      author: "Devansh Awasthi, B.A. LL.B. (Hons.), III Year student at Dr. Ram Manohar Lohiya National Law University",
      external_url: "https://nlujcdse.in/when-kyc-excludes-disability-rights-and-digital-finance/",
    },
    {
      id: "medical-benchmarks-functional-capability",
      title: "From Medical Benchmarks to Functional Capability: Redefining Reasonable Accommodation After Prabhu Kumar v. State of Himachal Pradesh",
      author: "Mihika Joshi, 2nd-year student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/from-medical-benchmarks-to-functional-capability-redefining-reasonable-accommodation-after-prabhu-kumar-v-state-of-himachal-pradesh/",
    },
    {
      id: "ramps-without-rights",
      title: "Ramps Without Rights: The Limits of Accommodation in Government Employment",
      author: "Ahan Garg and Vitthala Agarwal, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/ramps-without-rights-the-limits-of-accommodation-in-government-employment/",
    },
    {
      id: "disability-behind-bars",
      title: "Disability Behind Bars: Rethinking Prison Administration With the RPwD Act",
      author: "Ayush Dewangan, LLM student at Hidayatullah National Law University (HNLU), Raipur, and Leesa Ueike, Practising Advocate at the District Courts and High Court of Chhattisgarh",
      external_url: "https://nlujcdse.in/disability-behind-bars-rethinking-prison-administration-with-the-rpwd-act/",
    },
    {
      id: "equal-access-justice-deaf-mute",
      title: "Equal Access to Justice for Deaf and Mute People: Still a Long Way to Go?",
      author: "Uma Pareek, 4th-year student at Dharmashastra National Law University, Jabalpur",
      external_url: "https://nlujcdse.in/equal-access-to-justice-for-deaf-and-mute-people-still-a-long-way-to-go/",
    },
    {
      id: "access-denied-mental-health",
      title: "Access Denied: Why Mental Health Services Are Still a Luxury for Persons With Disabilities in India",
      author: "Sunidhi Khabya, 3rd-year law student at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/access-denied-why-mental-health-services-are-still-a-luxury-for-persons-with-disabilities-in-india/",
    },
    {
      id: "enabling-statute-mental-health",
      title: "The Enabling Statute in India Concerning Mental Health and Persons With Disabilities",
      author: "Noor Bansal and Tanishka Agarwal, 2nd-year law students at National Law University, Jodhpur",
      external_url: "https://nlujcdse.in/the-enabling-statute-in-india-concerning-mental-health-and-persons-with-disabilities/",
    },
    {
      id: "poverty-disability-incarceration-pipeline",
      title: "The Poverty-Disability-Incarceration Pipeline: How India's Criminal Justice System Criminalizes the Economic Exclusion of Persons With Disabilities",
      author: "Pranay Rajesh Sonkusare, B.Sc. LL.B. (Hons.), 2nd-year student at West Bengal National University of Juridical Sciences, Kolkata",
      external_url: "https://nlujcdse.in/the-poverty-disability-incarceration-pipeline-how-indias-criminal-justice-system-criminalizes-the-economic-exclusion-of-persons-with-disabilities/",
    },
  ];

  async function getPosts() {
    // TODO: swap for a Supabase fetch once the project is connected (see comment above).
    // Archive order preserved as published on nlujcdse.in/blogs-2/ (most recent first).
    return STATIC_POSTS.slice();
  }

  window.CDSEPosts = { getPosts: getPosts };
})(window);
