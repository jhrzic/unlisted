const express = require("express");
const store = require("../data/store");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

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
    kicker: "The path to full convergence",
    title: "Roadmap",
    tagline:
      "The path to full convergence — where SynthOS is headed, shipping intelligence as infrastructure one layer at a time.",
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

module.exports = router;
