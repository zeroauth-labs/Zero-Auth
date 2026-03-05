-- ============================================================================
-- Aadhaar Credential Tables
-- ============================================================================
-- Table for Aadhaar holders (mock data for now - in production would integrate with UIDAI)

-- Table: aadhaar_holders
CREATE TABLE IF NOT EXISTS aadhaar_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aadhaar_number_hash TEXT NOT NULL, -- SHA-256 hash of Aadhaar number (for privacy)
  date_of_birth DATE NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  address TEXT,
  state TEXT,
  district TEXT,
  phone TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  allow_credential_issuance BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by Aadhaar hash + DOB
CREATE INDEX idx_aadhaar_lookup ON aadhaar_holders(aadhaar_number_hash, date_of_birth);
CREATE INDEX idx_aadhaar_name ON aadhaar_holders(full_name);
CREATE INDEX idx_aadhaar_dob ON aadhaar_holders(date_of_birth);

-- Enable RLS
ALTER TABLE aadhaar_holders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon to verify (read-only lookup)
CREATE POLICY "anon_aadhaar_verify" ON aadhaar_holders
  FOR SELECT USING (true);

-- Policy: Service role full access
CREATE POLICY "service_role_aadhaar_all" ON aadhaar_holders
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Admin full access
CREATE POLICY "admin_aadhaar_all" ON aadhaar_holders
  FOR ALL USING (auth.role() = 'authenticated');

-- Table: aadhaar_credentials (issued credentials)
CREATE TABLE IF NOT EXISTS aadhaar_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_uuid UUID DEFAULT gen_random_uuid(),
  aadhaar_id UUID REFERENCES aadhaar_holders(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL DEFAULT 'Aadhaar',
  credential_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  request_ip TEXT,
  request_user_agent TEXT,
  request_idempotency_key TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_aadhaar_credentials_holder ON aadhaar_credentials(aadhaar_id);
CREATE INDEX idx_aadhaar_credentials_uuid ON aadhaar_credentials(credential_uuid);
CREATE INDEX idx_aadhaar_credentials_type ON aadhaar_credentials(credential_type);
CREATE INDEX idx_aadhaar_credentials_not_revoked ON aadhaar_credentials(revoked) WHERE revoked = false;
CREATE INDEX idx_aadhaar_credentials_idempotency ON aadhaar_credentials(request_idempotency_key) WHERE request_idempotency_key IS NOT NULL;

-- Enable RLS
ALTER TABLE aadhaar_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Service role full access
CREATE POLICY "service_role_aadhaar_cred_all" ON aadhaar_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Admin full access
CREATE POLICY "admin_aadhaar_cred_all" ON aadhaar_credentials
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy: Allow anon to verify credentials (for verification flow)
CREATE POLICY "anon_aadhaar_cred_verify" ON aadhaar_credentials
  FOR SELECT USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_aadhaar_holders_updated_at ON aadhaar_holders;
CREATE TRIGGER update_aadhaar_holders_updated_at
  BEFORE UPDATE ON aadhaar_holders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aadhaar_credentials_updated_at ON aadhaar_credentials;
CREATE TRIGGER update_aadhaar_credentials_updated_at
  BEFORE UPDATE ON aadhaar_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table: aadhaar_verification_logs (audit)
CREATE TABLE IF NOT EXISTS aadhaar_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aadhaar_hash TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  request_ip TEXT,
  request_user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aadhaar_logs_hash ON aadhaar_verification_logs(aadhaar_hash);
CREATE INDEX idx_aadhaar_logs_created ON aadhaar_verification_logs(created_at);

-- Enable RLS
ALTER TABLE aadhaar_verification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role only
CREATE POLICY "service_role_aadhaar_logs_all" ON aadhaar_verification_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE aadhaar_holders IS 'Aadhaar holder records - stores hashed Aadhaar numbers for privacy';
COMMENT ON TABLE aadhaar_credentials IS 'Credentials issued to Aadhaar holders';
COMMENT ON TABLE aadhaar_verification_logs IS 'Audit log for Aadhaar verification attempts';

-- ============================================================================
-- Add Aadhaar to issuer_config
-- ============================================================================
INSERT INTO issuer_config (issuer_id, issuer_name, contact_email, website_url, credential_validity_days)
VALUES ('aadhaar', 'UIDAI (Aadhaar)', 'support@uidai.gov.in', 'https://uidai.gov.in', 365 * 5)
ON CONFLICT (issuer_id) DO NOTHING;
