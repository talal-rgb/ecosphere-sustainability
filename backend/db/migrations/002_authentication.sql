-- Generated from Better Auth 1.6.26 schema metadata, then hardened with
-- Terrnix-specific identity and lookup constraints.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  platform_user_id uuid NOT NULL UNIQUE,
  CHECK (email = lower(email)),
  CHECK (char_length(email) BETWEEN 3 AND 254),
  CHECK (char_length(name) BETWEEN 1 AND 200)
);

CREATE TABLE auth.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  user_id uuid NOT NULL REFERENCES auth.auth_users(id) ON DELETE CASCADE
);

CREATE TABLE auth.auth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.auth_users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL,
  UNIQUE (provider_id, account_id)
);

CREATE TABLE auth.auth_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  count integer NOT NULL CHECK (count >= 0),
  last_request bigint NOT NULL CHECK (last_request >= 0)
);

CREATE INDEX auth_sessions_user_id_idx ON auth.auth_sessions(user_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth.auth_sessions(expires_at);
CREATE INDEX auth_accounts_user_id_idx ON auth.auth_accounts(user_id);
CREATE INDEX auth_verifications_identifier_idx ON auth.auth_verifications(identifier);
CREATE INDEX auth_verifications_expires_at_idx ON auth.auth_verifications(expires_at);

COMMENT ON TABLE auth.auth_accounts IS 'OAuth token values are encrypted by Better Auth before persistence.';
COMMENT ON COLUMN auth.auth_users.platform_user_id IS 'Stable link to platform.app_users.id; server-managed and never accepted from client input.';
