// Real data broker opt-out information, compiled from publicly documented
// opt-out procedures. Sources noted per entry. Response times and reappearance
// windows are commonly reported ranges, not guarantees — brokers change
// process and timing without notice, so this list needs periodic re-verification
// (see last_verified).

const store = require("./store");

const brokers = [
  {
    slug: "spokeo",
    name: "Spokeo",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.spokeo.com/optout",
    opt_out_email: null,
    process_notes:
      "Find your listing, copy its profile URL, submit it on the opt-out page, then confirm via the emailed link.",
    avg_response_days: 3,
    reappears_days: 100,
    source_url: "https://www.securityhero.io/how-to-opt-out-of-data-brokers/",
    last_verified: "2026-06-01",
  },
  {
    slug: "whitepages",
    name: "Whitepages",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.whitepages.com/suppression_requests",
    opt_out_email: null,
    process_notes:
      "Find your listing, copy the profile URL, submit it, then verify via an automated phone call with a 4-digit code.",
    avg_response_days: 2,
    reappears_days: 110,
    source_url: "https://www.securityhero.io/how-to-opt-out-of-data-brokers/",
    last_verified: "2026-06-01",
  },
  {
    slug: "beenverified",
    name: "BeenVerified",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.beenverified.com/f/optout/search",
    opt_out_email: null,
    process_notes:
      "Search your name, select your profile, enter your email, confirm via the emailed link. One opt-out per email address — use a different email for additional family members. Also covers PeopleLooker and PeopleSmart, which share the same database.",
    avg_response_days: 2,
    reappears_days: 100,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "peoplelooker",
    name: "PeopleLooker",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.peoplelooker.com/f/optout/search",
    opt_out_email: null,
    process_notes:
      "Owned by the same parent company as BeenVerified and PeopleSmart but requires a separate opt-out submission.",
    avg_response_days: 2,
    reappears_days: 100,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "mylife",
    name: "MyLife",
    category: "People search",
    opt_out_method: "email",
    opt_out_url: null,
    opt_out_email: "privacy@mylife.com",
    process_notes:
      "Widely reported as one of the most difficult opt-outs. Email with your profile URL and an explicit deletion request; the company may attempt to redirect you to a phone call instead — you are not required to call.",
    avg_response_days: 14,
    reappears_days: 90,
    source_url: "https://stateofsurveillance.org/guides/basic/data-broker-opt-out/",
    last_verified: "2026-06-01",
  },
  {
    slug: "acxiom",
    name: "Acxiom",
    category: "Marketing data broker",
    opt_out_method: "form",
    opt_out_url: "https://isapps.acxiom.com/optout/optout.aspx",
    opt_out_email: "Datenschutz@acxiom.com",
    process_notes:
      "Submit the consumer opt-out form, confirm via emailed verification link. No-email fallback: call (877) 774-2094 and follow the prompts.",
    avg_response_days: 14,
    reappears_days: 180,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "radaris",
    name: "Radaris",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://radaris.com/page/how-to-remove",
    opt_out_email: null,
    process_notes:
      "Locate your profile, submit removal via their opt-out flow. Known to discloses relatives, social profiles, and court records, so check thoroughly.",
    avg_response_days: 5,
    reappears_days: 120,
    source_url: "https://onerep.com/blog/how-to-remove-yourself-from-top-data-brokers",
    last_verified: "2026-06-01",
  },
  {
    slug: "truepeoplesearch",
    name: "TruePeopleSearch",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.truepeoplesearch.com/removal",
    opt_out_email: null,
    process_notes:
      "Find your record, copy the URL, submit through the removal page. No email confirmation required in most cases.",
    avg_response_days: 2,
    reappears_days: 90,
    source_url: "https://www.offlist.me/directory",
    last_verified: "2026-06-01",
  },
  {
    slug: "fastpeoplesearch",
    name: "FastPeopleSearch",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.fastpeoplesearch.com/removal",
    opt_out_email: null,
    process_notes: "Submit your profile URL through the removal form; no account needed.",
    avg_response_days: 3,
    reappears_days: 90,
    source_url: "https://www.offlist.me/directory",
    last_verified: "2026-06-01",
  },
  {
    slug: "intelius",
    name: "Intelius",
    category: "People search / background checks",
    opt_out_method: "form",
    opt_out_url: "https://www.intelius.com/optout",
    opt_out_email: null,
    process_notes:
      "Search for your listing, submit the opt-out request with the matching profile URL.",
    avg_response_days: 7,
    reappears_days: 120,
    source_url: "https://stateofsurveillance.org/guides/advanced/data-broker-opt-out-guide/",
    last_verified: "2026-06-01",
  },
  {
    slug: "peoplefinders",
    name: "PeopleFinders",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.peoplefinders.com/manage",
    opt_out_email: null,
    process_notes: "Locate your record and submit a removal request through the manage-listing page.",
    avg_response_days: 5,
    reappears_days: 110,
    source_url: "https://stateofsurveillance.org/guides/advanced/data-broker-opt-out-guide/",
    last_verified: "2026-06-01",
  },
  {
    slug: "nuwber",
    name: "Nuwber",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://nuwber.com/removal/link",
    opt_out_email: null,
    process_notes: "Search your name, copy the profile link, submit it on the removal page.",
    avg_response_days: 3,
    reappears_days: 100,
    source_url: "https://www.offlist.me/directory",
    last_verified: "2026-06-01",
  },
  {
    slug: "clustrmaps",
    name: "ClustrMaps",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://clustrmaps.com/bl/opt-out",
    opt_out_email: null,
    process_notes: "Find your listed address, submit the opt-out form referencing the exact URL.",
    avg_response_days: 5,
    reappears_days: 120,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "checkpeople",
    name: "CheckPeople",
    category: "People search / background checks",
    opt_out_method: "form",
    opt_out_url: "https://www.checkpeople.com/optout",
    opt_out_email: null,
    process_notes:
      "Request your data copy under 'Right to Know' first using name and email, then submit the opt-out with full legal name and birthdate.",
    avg_response_days: 7,
    reappears_days: 100,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "peekyou",
    name: "PeekYou",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.peekyou.com/about/contact/optout/",
    opt_out_email: null,
    process_notes: "Submit your profile URL through the contact opt-out form.",
    avg_response_days: 7,
    reappears_days: 120,
    source_url: "https://stateofsurveillance.org/guides/basic/data-broker-opt-out/",
    last_verified: "2026-06-01",
  },
  {
    slug: "usphonebook",
    name: "USPhonebook",
    category: "People search",
    opt_out_method: "form",
    opt_out_url: "https://www.usphonebook.com/opt-out",
    opt_out_email: null,
    process_notes: "Search your listing, copy the URL, submit via the opt-out form.",
    avg_response_days: 3,
    reappears_days: 100,
    source_url: "https://www.offlist.me/directory",
    last_verified: "2026-06-01",
  },
  {
    slug: "spyfly",
    name: "SpyFly",
    category: "People search / background checks",
    opt_out_method: "email",
    opt_out_url: null,
    opt_out_email: "support@spyfly.com",
    process_notes: "Email with full name, address, and profile URL, requesting removal.",
    avg_response_days: 10,
    reappears_days: 110,
    source_url: "https://stateofsurveillance.org/guides/advanced/data-broker-opt-out-guide/",
    last_verified: "2026-06-01",
  },
  {
    slug: "lexisnexis",
    name: "LexisNexis Risk Solutions",
    category: "Risk & background data broker",
    opt_out_method: "form",
    opt_out_url: "https://optout.lexisnexis.com/",
    opt_out_email: null,
    process_notes:
      "Submit the consumer opt-out request; identity verification typically required since this feeds background-check and insurance products.",
    avg_response_days: 30,
    reappears_days: 180,
    source_url: "https://stateofsurveillance.org/guides/advanced/data-broker-opt-out-guide/",
    last_verified: "2026-06-01",
  },
  {
    slug: "epsilon",
    name: "Epsilon",
    category: "Marketing data broker",
    opt_out_method: "email",
    opt_out_url: "https://www.epsilon.com/us/consumer-information/consumer-information-form",
    opt_out_email: null,
    process_notes: "Submit the consumer information / opt-out form on Epsilon's privacy page.",
    avg_response_days: 21,
    reappears_days: 180,
    source_url: "https://onerep.com/blog/how-to-remove-yourself-from-top-data-brokers",
    last_verified: "2026-06-01",
  },
  {
    slug: "ancestry",
    name: "Ancestry",
    category: "Public records aggregator",
    opt_out_method: "email",
    opt_out_url: "https://www.ancestry.com/cs/data-privacy-faq",
    opt_out_email: null,
    process_notes:
      "Find your record (a free account is enough to view limited info), then submit removal via the data privacy request form.",
    avg_response_days: 14,
    reappears_days: 365,
    source_url: "https://github.com/yaelwrites/Big-Ass-Data-Broker-Opt-Out-List",
    last_verified: "2026-06-01",
  },
  {
    slug: "ca-drop",
    name: "California DROP (state platform)",
    category: "Government deletion mechanism",
    opt_out_method: "drop",
    opt_out_url: "https://drop.cppa.ca.gov/",
    opt_out_email: null,
    process_notes:
      "California residents only. One request through this state-run platform reaches every data broker registered with the CPPA — about 540+ brokers as of early 2026. Free. Brokers are required to check DROP every 45 days and process matching deletions.",
    avg_response_days: 45,
    reappears_days: null,
    source_url: "https://www.bytebacklaw.com/2026/02/californias-deletion-request-and-opt-out-platform-drop-is-live/",
    last_verified: "2026-06-01",
  },
];

async function seed() {
  const sql = `
    INSERT INTO brokers
      (slug, name, category, opt_out_method, opt_out_url, opt_out_email, process_notes, avg_response_days, reappears_days, source_url, last_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (slug) DO UPDATE SET
      name = excluded.name, category = excluded.category, opt_out_method = excluded.opt_out_method,
      opt_out_url = excluded.opt_out_url, opt_out_email = excluded.opt_out_email,
      process_notes = excluded.process_notes, avg_response_days = excluded.avg_response_days,
      reappears_days = excluded.reappears_days, source_url = excluded.source_url,
      last_verified = excluded.last_verified
  `;

  await store.transaction(async (tx) => {
    for (const row of brokers) {
      await tx.run(sql, [
        row.slug,
        row.name,
        row.category,
        row.opt_out_method,
        row.opt_out_url,
        row.opt_out_email,
        row.process_notes,
        row.avg_response_days,
        row.reappears_days,
        row.source_url,
        row.last_verified,
      ]);
    }
  });

  console.log(`Seeded ${brokers.length} brokers.`);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed, brokers };
