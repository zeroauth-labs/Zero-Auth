-- ============================================================================
-- Seed Data for Aadhaar Testing
-- ============================================================================
-- Run this in Supabase SQL Editor after migration 04_aadhaar_credentials.sql

-- Helper function to hash Aadhaar numbers (SHA-256)
-- In production, this would be done externally

-- Insert test Aadhaar holders with various DOBs for testing age claims
INSERT INTO aadhaar_holders (
  aadhaar_number_hash,
  date_of_birth,
  full_name,
  first_name,
  last_name,
  gender,
  state,
  district,
  is_verified,
  verified_at,
  allow_credential_issuance,
  attributes
) VALUES 
(
  -- Test 1: Age 23+ (born 2002) - qualifies for both age_over_18 and age_over_23
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- hash of empty for demo
  '2002-05-15',
  'Rajesh Kumar',
  'Rajesh',
  'Kumar',
  'Male',
  'Karnataka',
  'Bangalore',
  true,
  NOW(),
  true,
  '{"state_code": "KA", "district_code": "BLR"}'::jsonb
),
(
  -- Test 2: Age 19 (born 2006) - qualifies for age_over_18 only
  'a465eb1e2f7a9e8c7b6a5d4c3b2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4',
  '2006-08-22',
  'Priya Sharma',
  'Priya',
  'Sharma',
  'Female',
  'Maharashtra',
  'Mumbai',
  true,
  NOW(),
  true,
  '{"state_code": "MH", "district_code": "MUM"}'::jsonb
),
(
  -- Test 3: Age 16 (born 2009) - does NOT qualify for age_over_18
  'b582e4d9f3c8ba7d6c5b4a3e2f1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2',
  '2009-03-10',
  'Amit Patel',
  'Amit',
  'Patel',
  'Male',
  'Gujarat',
  'Ahmedabad',
  true,
  NOW(),
  true,
  '{"state_code": "GJ", "district_code": "AMD"}'::jsonb
),
(
  -- Test 4: Age 30 (born 1995) - qualifies for both
  'c693f5ea0g9d7c8b6a5d4c3b2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2',
  '1995-12-01',
  'Sneha Reddy',
  'Sneha',
  'Reddy',
  'Female',
  'Telangana',
  'Hyderabad',
  true,
  NOW(),
  true,
  '{"state_code": "TG", "district_code": "HYD"}'::jsonb
),
(
  -- Test 5: Age 22 (born 2003) - qualifies for both
  'd714g6fb1h0e8c9b7a6d5c4b3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3',
  '2003-09-18',
  'Vikram Singh',
  'Vikram',
  'Singh',
  'Male',
  'Delhi',
  'New Delhi',
  true,
  NOW(),
  true,
  '{"state_code": "DL", "district_code": "NDL"}'::jsonb
);

-- Note: In production, you would:
-- 1. Hash the actual Aadhaar number before storing
-- 2. The hash should be: SHA-256(aadhaar_number)
-- 3. Verification would compare hashes, never store plain Aadhaar numbers
