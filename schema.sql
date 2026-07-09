-- Better Auth tabellen
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Gebruikersprofiel (gordel etc.)
CREATE TABLE IF NOT EXISTS profile (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  belt TEXT NOT NULL DEFAULT 'white',
  stripes INTEGER NOT NULL DEFAULT 0,
  gym TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Trainingen / seminars / competities
CREATE TABLE IF NOT EXISTS entry (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('training','seminar','competitie')),
  date TEXT NOT NULL,
  duration_min INTEGER,
  location TEXT,
  went_well TEXT,
  struggled_with TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Tags per entry
CREATE TABLE IF NOT EXISTS entry_tag (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Leerdoelen & focusgebieden
CREATE TABLE IF NOT EXISTS goal (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'techniek',
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','bezig','klaar')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entry_user ON entry(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_goal_user  ON goal(user_id, status);

-- Behaalde badges / achievements
CREATE TABLE IF NOT EXISTS achievement (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_user ON achievement(user_id);

-- Technieken database (gedeeld)
CREATE TABLE IF NOT EXISTS technique (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  youtube_url TEXT,
  added_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  merged_into TEXT REFERENCES technique(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS technique_favorite (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  technique_id TEXT NOT NULL REFERENCES technique(id) ON DELETE CASCADE,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, technique_id)
);

-- Wachtwoord reset verzoeken (geen email — admin handelt af)
CREATE TABLE IF NOT EXISTS password_reset_request (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  requested_at INTEGER NOT NULL DEFAULT (unixepoch()),
  handled INTEGER NOT NULL DEFAULT 0,
  handled_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_technique_name     ON technique(name);
CREATE INDEX IF NOT EXISTS idx_technique_category ON technique(category);
CREATE INDEX IF NOT EXISTS idx_fav_user           ON technique_favorite(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_handled      ON password_reset_request(handled, requested_at DESC);
