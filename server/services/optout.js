// Generates and sends actual opt-out / deletion-request emails to brokers
// that accept email-based removal. For form-based and DROP-based brokers,
// this only generates the text — the user (or a future headless-browser
// worker) still needs to submit through the broker's own form/portal.
//
// This is intentionally NOT pretending to automate every broker end-to-end.
// Most data brokers don't expose an API for this; the realistic automation
// surface today is: templated legal request text + tracked status, with
// true form-filling automation as a separate, broker-by-broker project.

const nodemailer = require("nodemailer");

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

/**
 * Build CCPA/GDPR-citing deletion request text for a given broker + user.
 */
function buildRequestText({ brokerName, fullName, addresses, emails, phones }) {
  const identifiers = [
    ...emails.map((e) => `Email: ${e}`),
    ...phones.map((p) => `Phone: ${p}`),
    ...addresses.map((a) => `Address: ${a}`),
  ].join("\n");

  return `Subject: Data Deletion Request — ${fullName}

To Whom It May Concern at ${brokerName},

I am submitting a formal request under the California Consumer Privacy Act
(Cal. Civ. Code § 1798.105) and, where applicable, the EU General Data
Protection Regulation (Article 17), for the deletion of all personal
information you hold, have collected, or have sold/shared about me.

Identifying information to match against your records:
Full name: ${fullName}
${identifiers}

Please confirm in writing once this deletion has been completed, and
confirm that you will not re-collect or re-list this information from
public or third-party sources going forward where legally required.

I expect a response within the timeframe required by applicable law
(generally 30–45 days).

Regards,
${fullName}`;
}

/**
 * Send the opt-out email directly to a broker, if SMTP is configured and
 * the broker supports email-based opt-out. Returns { sent: boolean, reason? }.
 */
async function sendOptOutEmail({ broker, userProfile }) {
  if (broker.opt_out_method !== "email" || !broker.opt_out_email) {
    return { sent: false, reason: "Broker does not support direct email opt-out." };
  }

  const transport = buildTransport();
  if (!transport) {
    return {
      sent: false,
      reason: "SMTP not configured — set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to send real emails.",
    };
  }

  const text = buildRequestText({
    brokerName: broker.name,
    fullName: userProfile.fullName,
    addresses: userProfile.addresses || [],
    emails: userProfile.emails || [],
    phones: userProfile.phones || [],
  });

  await transport.sendMail({
    from: process.env.FROM_EMAIL,
    to: broker.opt_out_email,
    cc: userProfile.emails?.[0],
    subject: `Data Deletion Request — ${userProfile.fullName}`,
    text,
  });

  return { sent: true };
}

module.exports = { buildRequestText, sendOptOutEmail };
