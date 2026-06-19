CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  state TEXT,
  plan TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_identifiers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('email','phone','address')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brokers (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  opt_out_method TEXT NOT NULL CHECK(opt_out_method IN ('form','email','call','drop')),
  opt_out_url TEXT,
  opt_out_email TEXT,
  process_notes TEXT,
  avg_response_days INTEGER,
  reappears_days INTEGER,
  source_url TEXT,
  last_verified TEXT
);

CREATE TABLE IF NOT EXISTS removal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_id INTEGER NOT NULL REFERENCES brokers(id),
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK(status IN ('not_started','request_sent','pending','verified_removed','reappeared')),
  sent_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(user_id, broker_id)
);

CREATE TABLE IF NOT EXISTS breach_checks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_checked TEXT NOT NULL,
  breach_count INTEGER NOT NULL,
  breach_names TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
