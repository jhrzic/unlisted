const express = require("express");
const validator = require("validator");
const store = require("../data/store");
const { checkBreaches, HibpError } = require("../services/hibp");
const { sendOptOutEmail, buildRequestText } = require("../services/optout");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/breach-check", requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  try {
    const result = await checkBreaches(email);

    await store.run(
      `INSERT INTO breach_checks (user_id, email_checked, breach_count, breach_names)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        email.toLowerCase(),
        result.breaches.length,
        JSON.stringify(result.breaches.map((b) => b.name)),
      ]
    );

    res.json(result);
  } catch (err) {
    const status = err instanceof HibpError ? err.status : 500;
    res.status(status).json({ error: err.message });
  }
});

router.get("/breach-check/history", requireAuth, async (req, res) => {
  const rows = await store.all(
    `SELECT email_checked, breach_count, breach_names, checked_at
     FROM breach_checks WHERE user_id = ? ORDER BY checked_at DESC LIMIT 20`,
    [req.user.id]
  );
  res.json(rows.map((r) => ({ ...r, breach_names: JSON.parse(r.breach_names || "[]") })));
});

router.get("/brokers", async (req, res) => {
  const brokers = await store.all("SELECT * FROM brokers ORDER BY name ASC");
  res.json(brokers);
});

router.get("/profile/identifiers", requireAuth, async (req, res) => {
  const rows = await store.all(
    "SELECT id, type, value FROM profile_identifiers WHERE user_id = ? ORDER BY type",
    [req.user.id]
  );
  res.json(rows);
});

router.post("/profile/identifiers", requireAuth, async (req, res) => {
  const { type, value } = req.body;
  if (!["email", "phone", "address"].includes(type) || !value || !value.trim()) {
    return res.status(400).json({ error: "A valid type and value are required." });
  }
  const result = await store.run(
    "INSERT INTO profile_identifiers (user_id, type, value) VALUES (?, ?, ?) RETURNING id",
    [req.user.id, type, value.trim()]
  );
  res.json({ id: result.lastInsertRowid, type, value: value.trim() });
});

router.delete("/profile/identifiers/:id", requireAuth, async (req, res) => {
  await store.run("DELETE FROM profile_identifiers WHERE id = ? AND user_id = ?", [
    req.params.id,
    req.user.id,
  ]);
  res.json({ deleted: true });
});

router.get("/cases", requireAuth, async (req, res) => {
  const rows = await store.all(
    `SELECT b.id as broker_id, b.slug, b.name, b.category, b.opt_out_method, b.opt_out_url,
            b.opt_out_email, b.process_notes, b.avg_response_days, b.reappears_days,
            rr.id as request_id, rr.status, rr.sent_at, rr.last_checked_at, rr.notes
     FROM brokers b
     LEFT JOIN removal_requests rr ON rr.broker_id = b.id AND rr.user_id = ?
     ORDER BY b.name ASC`,
    [req.user.id]
  );
  res.json(rows);
});

router.post("/cases/:brokerId/status", requireAuth, async (req, res) => {
  const { status, notes } = req.body;
  const allowed = ["not_started", "request_sent", "pending", "verified_removed", "reappeared"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const broker = await store.get("SELECT * FROM brokers WHERE id = ?", [req.params.brokerId]);
  if (!broker) return res.status(404).json({ error: "Broker not found." });

  const sentAt = status === "request_sent" ? new Date().toISOString() : null;
  const now = new Date().toISOString();

  await store.run(
    `INSERT INTO removal_requests (user_id, broker_id, status, sent_at, last_checked_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, broker_id) DO UPDATE SET
       status = excluded.status,
       sent_at = COALESCE(excluded.sent_at, removal_requests.sent_at),
       last_checked_at = excluded.last_checked_at,
       notes = excluded.notes`,
    [req.user.id, broker.id, status, sentAt, now, notes || null]
  );

  res.json({ ok: true });
});

router.get("/cases/:brokerId/request-text", requireAuth, async (req, res) => {
  const broker = await store.get("SELECT * FROM brokers WHERE id = ?", [req.params.brokerId]);
  if (!broker) return res.status(404).json({ error: "Broker not found." });

  const identifiers = await store.all(
    "SELECT type, value FROM profile_identifiers WHERE user_id = ?",
    [req.user.id]
  );

  const text = buildRequestText({
    brokerName: broker.name,
    fullName: req.user.full_name,
    emails: identifiers.filter((i) => i.type === "email").map((i) => i.value),
    phones: identifiers.filter((i) => i.type === "phone").map((i) => i.value),
    addresses: identifiers.filter((i) => i.type === "address").map((i) => i.value),
  });

  res.json({ text });
});

router.post("/cases/:brokerId/send-email", requireAuth, async (req, res) => {
  const broker = await store.get("SELECT * FROM brokers WHERE id = ?", [req.params.brokerId]);
  if (!broker) return res.status(404).json({ error: "Broker not found." });

  const identifiers = await store.all(
    "SELECT type, value FROM profile_identifiers WHERE user_id = ?",
    [req.user.id]
  );

  const result = await sendOptOutEmail({
    broker,
    userProfile: {
      fullName: req.user.full_name,
      emails: identifiers.filter((i) => i.type === "email").map((i) => i.value),
      phones: identifiers.filter((i) => i.type === "phone").map((i) => i.value),
      addresses: identifiers.filter((i) => i.type === "address").map((i) => i.value),
    },
  });

  if (result.sent) {
    const now = new Date().toISOString();
    await store.run(
      `INSERT INTO removal_requests (user_id, broker_id, status, sent_at, last_checked_at)
       VALUES (?, ?, 'request_sent', ?, ?)
       ON CONFLICT (user_id, broker_id) DO UPDATE SET
         status = 'request_sent', sent_at = excluded.sent_at, last_checked_at = excluded.last_checked_at`,
      [req.user.id, broker.id, now, now]
    );
  }

  res.json(result);
});

module.exports = router;
