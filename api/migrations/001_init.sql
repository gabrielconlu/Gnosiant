CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en-US',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  privacy_preferences JSONB NOT NULL DEFAULT '{"analytics": false, "marketing": false}'::jsonb,
  accepted_terms_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_preferences JSONB NOT NULL DEFAULT '{"analytics": false, "marketing": false}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE users SET accepted_terms_at = created_at WHERE accepted_terms_at IS NULL;
ALTER TABLE users ALTER COLUMN accepted_terms_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN accepted_terms_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  income NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (income >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, user_id),
  UNIQUE (user_id, month),
  CHECK (EXTRACT(DAY FROM month) = 1)
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id BIGSERIAL PRIMARY KEY,
  budget_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 80),
  planned_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, budget_id),
  UNIQUE (budget_id, name),
  FOREIGN KEY (budget_id, user_id) REFERENCES budgets(id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  budget_id BIGINT NOT NULL,
  category_id BIGINT,
  description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) BETWEEN 1 AND 160),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (budget_id, user_id) REFERENCES budgets(id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id, budget_id) REFERENCES budget_categories(id, budget_id)
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS transactions_budget_idx ON transactions (budget_id);

CREATE TABLE IF NOT EXISTS savings_goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 100),
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_saved NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_saved >= 0),
  target_date DATE,
  monthly_contribution NUMERIC(12, 2) CHECK (monthly_contribution IS NULL OR monthly_contribution >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS monthly_contribution NUMERIC(12, 2);
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE savings_goals ALTER COLUMN target_amount TYPE NUMERIC(12, 2) USING target_amount::NUMERIC(12, 2);
ALTER TABLE savings_goals ALTER COLUMN current_saved TYPE NUMERIC(12, 2) USING current_saved::NUMERIC(12, 2);
ALTER TABLE savings_goals ALTER COLUMN monthly_contribution TYPE NUMERIC(12, 2) USING monthly_contribution::NUMERIC(12, 2);
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_target_amount_check;
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_current_saved_check;
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_monthly_contribution_check;
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_target_amount_check CHECK (target_amount > 0);
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_current_saved_check CHECK (current_saved >= 0);
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_monthly_contribution_check CHECK (monthly_contribution IS NULL OR monthly_contribution >= 0);
CREATE INDEX IF NOT EXISTS savings_goals_user_idx ON savings_goals (user_id, created_at);

CREATE TABLE IF NOT EXISTS scenarios (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 100),
  description TEXT NOT NULL DEFAULT '',
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(assumptions) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS scenarios_user_idx ON scenarios (user_id, created_at);
