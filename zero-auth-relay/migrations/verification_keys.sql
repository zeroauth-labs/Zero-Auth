-- Verification Keys Table
-- Stores ZK verification keys for each credential type

CREATE TABLE IF NOT EXISTS verification_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_type TEXT NOT NULL UNIQUE,
  key_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by credential_type
CREATE INDEX IF NOT EXISTS idx_verification_keys_credential_type ON verification_keys(credential_type);

-- Enable RLS (optional - adjust based on your security requirements)
ALTER TABLE verification_keys ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read (for relay to fetch keys)
CREATE POLICY "Allow anon read verification keys" ON verification_keys
  FOR SELECT TO anon USING (true);

-- Allow service role to manage keys
CREATE POLICY "Allow service role manage verification keys" ON verification_keys
  FOR ALL USING (auth.role() = 'service_role');
