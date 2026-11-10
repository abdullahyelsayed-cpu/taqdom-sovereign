-- 0002_seed.sql — Reserved Subdomains & Official Showcase Accounts
INSERT OR IGNORE INTO reserved_names (name) VALUES
  ('www'), ('app'), ('api'), ('admin'), ('studio'), ('auth'),
  ('mail'), ('cdn'), ('static'), ('dashboard'), ('blog'),
  ('help'), ('status'), ('templates'), ('explore'), ('legal');

INSERT OR IGNORE INTO users (id, email, username, password_hash, salt, created_at) VALUES
  ('user-test', 'test@taqdom.me', 'test', 'seeded-pbkdf2', 'seeded-salt', 1762000000000),
  ('user-layla', 'layla@taqdom.me', 'layla', 'seeded-pbkdf2', 'seeded-salt', 1761900000000),
  ('user-youssef', 'youssef@taqdom.me', 'youssef', 'seeded-pbkdf2', 'seeded-salt', 1761800000000),
  ('user-farida', 'farida@taqdom.me', 'farida', 'seeded-pbkdf2', 'seeded-salt', 1761700000000),
  ('user-karim', 'karim@taqdom.me', 'karim', 'seeded-pbkdf2', 'seeded-salt', 1761600000000);
