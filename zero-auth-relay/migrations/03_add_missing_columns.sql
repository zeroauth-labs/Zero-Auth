-- Add ALL missing columns to sessions table
-- Run this on your Supabase database

-- Add all missing columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS nonce TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS claims JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS proof JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS proof_hash TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credential_type TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS required_claims JSONB;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS verifier_name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS use_case TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Refresh schema cache (important!)
NOTIFY pgrst, 'reload schema';
