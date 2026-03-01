-- Migration: Add use_case to sessions table

ALTER TABLE sessions
ADD COLUMN use_case TEXT NOT NULL DEFAULT 'VERIFICATION';

-- Note: In a production Supabase instance, you would run this via the SQL Editor or Supabase CLI.
