// Have I Been Pwned v3 API client.
// Docs: https://haveibeenpwned.com/API/v3
// Requires a paid API key in the `hibp-api-key` header. No CORS support,
// so this must run server-side only — never expose HIBP_API_KEY to the client.

const fetch = require("node-fetch");

const HIBP_BASE = "https://haveibeenpwned.com/api/v3";

class HibpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Check whether an email address appears in known breaches.
 * Returns { breached: boolean, breaches: [{name, domain, breachDate, dataClasses}] }
 */
async function checkBreaches(email) {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    throw new HibpError(
      "HIBP_API_KEY is not configured. Get a key at https://haveibeenpwned.com/API/Key and set it in .env",
      503
    );
  }

  const url = `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

  const res = await fetch(url, {
    headers: {
      "hibp-api-key": apiKey,
      "user-agent": "Unlisted-DataBrokerRemoval/1.0",
    },
  });

  // HIBP returns 404 when there are no breaches — that's a success case, not an error.
  if (res.status === 404) {
    return { breached: false, breaches: [] };
  }

  if (res.status === 429) {
    throw new HibpError("Rate limited by HaveIBeenPwned. Try again shortly.", 429);
  }

  if (res.status === 401) {
    throw new HibpError("HIBP API key is invalid or missing.", 401);
  }

  if (!res.ok) {
    throw new HibpError(`HIBP request failed with status ${res.status}`, res.status);
  }

  const data = await res.json();
  return {
    breached: true,
    breaches: data.map((b) => ({
      name: b.Name,
      domain: b.Domain,
      breachDate: b.BreachDate,
      dataClasses: b.DataClasses,
      description: b.Description,
    })),
  };
}

module.exports = { checkBreaches, HibpError };
