// Contact-form delivery. Sends inquiries from the SynthOS contact page to
// the team inbox when SMTP is configured. Mirrors the honesty of the rest
// of this app: if email isn't wired up, we say so rather than pretending
// the message was delivered.

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
 * Deliver a contact inquiry. Returns { sent: boolean, reason?: string }.
 * Never throws for configuration problems — only a real transport error
 * would reject, which the caller handles.
 */
async function sendContactMessage({ name, email, company, message }) {
  const transport = buildTransport();
  if (!transport) {
    return {
      sent: false,
      reason:
        "Email delivery isn't configured yet (set SMTP_HOST and CONTACT_TO). Your message wasn't sent.",
    };
  }

  const to = process.env.CONTACT_TO || process.env.FROM_EMAIL;
  if (!to) {
    return {
      sent: false,
      reason: "No destination inbox configured (set CONTACT_TO or FROM_EMAIL). Your message wasn't sent.",
    };
  }

  const text = [
    `New SynthOS inquiry`,
    ``,
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Company: ${company || "—"}`,
    ``,
    `Message:`,
    message,
  ].join("\n");

  await transport.sendMail({
    from: process.env.FROM_EMAIL || to,
    to,
    replyTo: email,
    subject: `New SynthOS inquiry — ${name}`,
    text,
  });

  return { sent: true };
}

module.exports = { sendContactMessage };
