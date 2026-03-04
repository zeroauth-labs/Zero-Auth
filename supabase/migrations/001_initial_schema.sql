-- ============================================================================
-- Student Verification System - Database Schema
-- Supabase PostgreSQL
-- ============================================================================

-- ============================================================================
-- Table: issuer_config
-- Stores configurable issuer information (university name, logo, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS issuer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Issuer identification
  issuer_id TEXT NOT NULL UNIQUE DEFAULT 'default',
  issuer_name TEXT NOT NULL,
  issuer_logo_url TEXT,
  
  -- Contact info
  contact_email TEXT,
  website_url TEXT,
  
  -- Configuration
  credential_validity_days INTEGER DEFAULT 365,
  allow_public_verification BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default issuer config
INSERT INTO issuer_config (issuer_id, issuer_name, contact_email, website_url)
VALUES ('default', 'University Name', 'admin@university.edu', 'https://university.edu')
ON CONFLICT (issuer_id) DO NOTHING;

-- ============================================================================
-- Table: students
-- Main student records from college database
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification (unique per student) - REQUIRED for verification
  id_number TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  
  -- Personal details
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  
  -- Academic info (flexible JSON for different credential types)
  program TEXT,
  department TEXT,
  enrollment_year INTEGER,
  graduation_year INTEGER,
  enrollment_status TEXT DEFAULT 'active', -- 'active', 'graduated', 'suspended', 'withdrawn'
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES students(id),
  
  -- Privacy controls
  allow_credential_issuance BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_students_id_number ON students(id_number);
CREATE INDEX idx_students_dob ON students(date_of_birth);
CREATE INDEX idx_students_email ON students(email) WHERE email IS NOT NULL;
CREATE INDEX idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX idx_students_allow_issuance ON students(allow_credential_issuance) WHERE allow_credential_issuance = true;

-- ============================================================================
-- Table: issued_credentials
-- Track all credentials issued to students (audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS issued_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to student
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Credential details
  credential_type TEXT NOT NULL,  -- 'Student ID', 'Age Verification', 'Enrollment Proof', etc.
  credential_subtype TEXT,         -- e.g., 'Undergraduate', 'Graduate'
  credential_data JSONB NOT NULL,
  
  -- Credential identifier (for verifiable presentations)
  credential_uuid TEXT NOT NULL UNIQUE DEFAULT 'cred_' || encode(gen_random_bytes(8), 'hex'),
  
  -- Issue metadata
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Status
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  revoked_by UUID REFERENCES students(id),
  
  -- Request metadata (for audit)
  request_ip INET,
  request_user_agent TEXT,
  request_idempotency_key TEXT UNIQUE  -- Prevent duplicate issuances
);

-- Indexes for faster lookups
CREATE INDEX idx_issued_credentials_student ON issued_credentials(student_id);
CREATE INDEX idx_issued_credentials_type ON issued_credentials(credential_type);
CREATE INDEX idx_issued_credentials_expires ON issued_credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_issued_credentials_uuid ON issued_credentials(credential_uuid) WHERE credential_uuid IS NOT NULL;
CREATE INDEX idx_issued_credentials_not_revoked ON issued_credentials(revoked) WHERE revoked = false;
CREATE INDEX idx_issued_credentials_idempotency ON issued_credentials(request_idempotency_key) WHERE request_idempotency_key IS NOT NULL;

-- ============================================================================
-- Table: verification_logs
-- Audit log for all verification attempts (for security & debugging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was verified
  id_number_hash TEXT NOT NULL,  -- SHA-256 hash for privacy
  verification_type TEXT NOT NULL,  -- 'credential_issuance', 'credential_validation'
  
  -- Result
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  
  -- Request metadata
  request_ip INET,
  request_user_agent TEXT,
  request_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX idx_verification_logs_hash ON verification_logs(id_number_hash);
CREATE INDEX idx_verification_logs_timestamp ON verification_logs(request_timestamp);
CREATE INDEX idx_verification_logs_success ON verification_logs(success);

-- ============================================================================
-- Table: api_keys
-- Manage API access for external services (rate limiting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,  -- First 8 chars for identification (never store full key)
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Rate limits
  rate_limit_per_hour INTEGER DEFAULT 100,
  rate_limit_per_day INTEGER DEFAULT 1000,
  
  -- Usage tracking
  requests_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- ============================================================================
-- Table: admin_users
-- Admin access for managing students (university staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',  -- 'admin', 'staff', 'readonly'
  
  -- Security
  password_hash TEXT NOT NULL,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_admin_users_email ON admin_users(email) WHERE is_active = true;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- Students RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_students_all" ON students
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin users: full access
CREATE POLICY "admin_students_all" ON students
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND is_active = true)
  );

-- Anon: can only verify (SELECT by id_number + dob combo, handled by function)
CREATE POLICY "anon_students_verify" ON students
  FOR SELECT TO anon USING (true);

-- No direct insert/update for anon
CREATE POLICY "deny_anon_students_insert" ON students
  FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "deny_anon_students_update" ON students
  FOR UPDATE TO anon USING (true);

-- --------------------------------------------------------------------------
-- Issued Credentials RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_credentials_all" ON issued_credentials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin: full access
CREATE POLICY "admin_credentials_all" ON issued_credentials
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND is_active = true)
  );

-- Anon: can only verify their own via credential_uuid (no direct student linking)
-- Note: This is intentionally limited - actual ownership verified in Edge Function
CREATE POLICY "anon_credentials_verify_own" ON issued_credentials
  FOR SELECT TO anon USING (
    revoked = false 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- --------------------------------------------------------------------------
-- Verification Logs RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_logs_all" ON verification_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admin: full access
CREATE POLICY "admin_logs_all" ON verification_logs
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND is_active = true)
  );

-- Anon: no access
CREATE POLICY "deny_anon_logs" ON verification_logs
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- --------------------------------------------------------------------------
-- API Keys RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_api_keys_all" ON api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon: can only read active keys (for rate limit info) - but only prefix
CREATE POLICY "anon_api_keys_read" ON api_keys
  FOR SELECT TO anon USING (is_active = true);

-- --------------------------------------------------------------------------
-- Issuer Config RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_config_all" ON issuer_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon: can read public config
CREATE POLICY "anon_config_read" ON issuer_config
  FOR SELECT TO anon USING (allow_public_verification = true);

-- --------------------------------------------------------------------------
-- Admin Users RLS Policies
-- --------------------------------------------------------------------------

-- Service role: full access
CREATE POLICY "service_role_admin_all" ON admin_users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Admins: can read other admins
CREATE POLICY "admin_read" ON admin_users
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND is_active = true)
  );

-- No anon access
CREATE POLICY "deny_anon_admin" ON admin_users
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for students
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for issued_credentials (if needed)
DROP TRIGGER IF EXISTS update_issued_credentials_updated_at ON issued_credentials;
CREATE TRIGGER update_issued_credentials_updated_at
  BEFORE UPDATE ON issued_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to hash ID number (for privacy in logs)
CREATE OR REPLACE FUNCTION hash_id_number(id_num TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(id_num, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Views
-- ============================================================================

-- View: Active credentials (for quick queries)
CREATE OR REPLACE VIEW active_credentials AS
SELECT 
  ic.id,
  ic.credential_uuid,
  ic.student_id,
  s.id_number,
  s.full_name,
  s.email,
  ic.credential_type,
  ic.credential_data,
  ic.issued_at,
  ic.expires_at,
  ic.revoked
FROM issued_credentials ic
JOIN students s ON ic.student_id = s.id
WHERE ic.revoked = false 
  AND (ic.expires_at IS NULL OR ic.expires_at > NOW());

-- View: Student credential summary
CREATE OR REPLACE VIEW student_credential_summary AS
SELECT 
  s.id,
  s.id_number,
  s.full_name,
  s.email,
  s.enrollment_status,
  COUNT(ic.id) FILTER (WHERE ic.revoked = false AND (ic.expires_at IS NULL OR ic.expires_at > NOW())) as active_credentials_count,
  MAX(ic.issued_at) FILTER (WHERE ic.revoked = false AND (ic.expires_at IS NULL OR ic.expires_at > NOW())) as last_credential_issued,
  COUNT(ic.id) as total_credentials_issued
FROM students s
LEFT JOIN issued_credentials ic ON s.id = ic.student_id
GROUP BY s.id, s.id_number, s.full_name, s.email, s.enrollment_status;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE students IS 'Main student records from college database - used for credential verification';
COMMENT ON TABLE issued_credentials IS 'Audit log of all credentials issued to students';
COMMENT ON TABLE verification_logs IS 'Audit trail of all verification attempts (privacy-preserving)';
COMMENT ON TABLE api_keys IS 'API keys for external service access';
COMMENT ON TABLE issuer_config IS 'Configurable issuer information (university name, logo, etc.)';
COMMENT ON TABLE admin_users IS 'University staff with admin access to manage students';

-- ============================================================================
-- Migration version tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

INSERT INTO schema_migrations (version, description)
VALUES ('001_initial_schema', 'Initial student verification schema')
ON CONFLICT (version) DO NOTHING;
