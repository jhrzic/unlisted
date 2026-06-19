function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.redirect("/login");
  }
  next();
}

function attachUser(store) {
  return async (req, res, next) => {
    try {
      if (req.session && req.session.userId) {
        const user = await store.get(
          "SELECT id, email, full_name, state, plan FROM users WHERE id = ?",
          [req.session.userId]
        );
        req.user = user || null;
      } else {
        req.user = null;
      }
      res.locals.user = req.user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireAuth, attachUser };
