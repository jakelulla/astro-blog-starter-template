-- Page view counts, one row per post slug.
CREATE TABLE IF NOT EXISTS views (
	slug TEXT PRIMARY KEY,
	count INTEGER NOT NULL DEFAULT 0
);

-- One like per visitor per post. visitor is a salted SHA-256 of the client IP,
-- so raw IPs are never stored.
CREATE TABLE IF NOT EXISTS likes (
	slug TEXT NOT NULL,
	visitor TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY (slug, visitor)
);
