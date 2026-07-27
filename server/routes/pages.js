const express = require("express");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");
const { sendContactMessage } = require("../services/contact");

const router = express.Router();

const contactLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 8 });

router.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

router.get("/", async (req, res, next) => {
  try {
    const row = await store.get("SELECT COUNT(*) as c FROM brokers");
    res.render("home", { brokerCount: Number(row.c) });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard");
});

router.get("/pricing", (req, res) => {
  res.render("pricing-partial", { standalone: true });
});

router.get("/synthos", (req, res) => {
  res.render("synthos");
});

router.get("/synthos/components", (req, res) => {
  res.render("synthos-components");
});

const synthosPages = {
  roadmap: {
    kicker: "The path to Unified Intelligence",
    title: "Roadmap",
    tagline:
      "Three layers converging into one — the Execution Layer, the Agent Mesh, and the Intelligence Fabric.",
  },
  advisory: {
    kicker: "Advisory",
    title: "Advisory",
    tagline: "The people who'll help you build the agentic enterprise. Coming soon.",
  },
  partners: {
    kicker: "Partners",
    title: "Partners",
    tagline: "Building the agentic stack together, across technology, delivery, and design.",
  },
  contact: {
    kicker: "Contact",
    title: "Contact",
    tagline: "Talk to the team building SynthOS.",
  },
};

router.get("/synthos/:page", (req, res, next) => {
  const data = synthosPages[req.params.page];
  if (!data) return next();
  res.render("synthos-page", { page: { slug: req.params.page, ...data } });
});

router.post("/synthos/contact", contactLimiter, async (req, res) => {
  const page = { slug: "contact", ...synthosPages.contact };
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim();
  const company = (req.body.company || "").trim();
  const message = (req.body.message || "").trim();

  // Honeypot: real users leave this hidden field empty. Silently "succeed".
  if ((req.body.website || "").trim()) {
    return res.render("synthos-page", { page, form: { success: true, delivered: true } });
  }

  const errors = {};
  if (!name) errors.name = "Please tell us your name.";
  if (!email || !validator.isEmail(email)) errors.email = "Enter a valid email address.";
  if (message.length < 10) errors.message = "A little more detail helps (10+ characters).";

  if (Object.keys(errors).length) {
    return res.status(400).render("synthos-page", {
      page,
      form: { errors, values: { name, email, company, message } },
    });
  }

  let delivered = false;
  let note = null;
  try {
    const result = await sendContactMessage({ name, email, company, message });
    delivered = result.sent;
    if (!result.sent) note = result.reason;
  } catch (err) {
    console.error("Contact send failed:", err);
    note = "Something went wrong sending your message. Please email us directly.";
  }

  res.render("synthos-page", { page, form: { success: true, delivered, note } });
});

module.exports = router;
