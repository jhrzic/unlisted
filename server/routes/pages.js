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

module.exports = router;
