const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const store = require("../data/store");

const router = express.Router();

router.get("/signup", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("signup", { error: null });
});

router.post("/signup", async (req, res, next) => {
  try {
    const { full_name, email, password, state } = req.body;

    if (!full_name || !email || !password) {
      return res.render("signup", { error: "Full name, email, and password are required." });
    }
    if (!validator.isEmail(email)) {
      return res.render("signup", { error: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.render("signup", { error: "Password must be at least 8 characters." });
    }

    const existing = await store.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing) {
      return res.render("signup", { error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await store.run(
      "INSERT INTO users (email, password_hash, full_name, state) VALUES (?, ?, ?, ?) RETURNING id",
      [email.toLowerCase(), passwordHash, full_name.trim(), state || null]
    );

    await store.run("INSERT INTO profile_identifiers (user_id, type, value) VALUES (?, 'email', ?)", [
      result.lastInsertRowid,
      email.toLowerCase(),
    ]);

    req.session.userId = result.lastInsertRowid;
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/dashboard");
  res.render("login", { error: null });
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await store.get("SELECT * FROM users WHERE email = ?", [(email || "").toLowerCase()]);

    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.render("login", { error: "Incorrect email or password." });
    }

    req.session.userId = user.id;
    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

module.exports = router;
