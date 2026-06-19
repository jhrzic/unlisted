if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch {
    // dotenv is only needed for local development
  }
}
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieSession = require("cookie-session");
const rateLimit = require("express-rate-limit");
const path = require("path");

const store = require("./data/store");
const { attachUser } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const pageRoutes = require("./routes/pages");

function createApp() {
  const app = express();

  app.set("view engine", "ejs");
  app.set(
    "views",
    process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join(process.cwd(), "views")
      : path.join(__dirname, "..", "views")
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
        },
      },
    })
  );
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use(
    cookieSession({
      name: "unlisted_session",
      secret: process.env.SESSION_SECRET || "dev-secret-change-me",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );

  app.use(attachUser(store));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
  const breachLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
  app.use(["/login", "/signup"], authLimiter);
  app.use("/api/breach-check", breachLimiter);

  app.use("/", pageRoutes);
  app.use("/", authRoutes);
  app.use("/api", apiRoutes);

  app.use((req, res) => {
    res.status(404).render("404");
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Something broke. Check server logs.");
  });

  return app;
}

module.exports = { createApp };
