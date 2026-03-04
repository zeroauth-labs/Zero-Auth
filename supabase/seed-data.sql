-- ============================================================================
-- Seed Data for Testing
-- ============================================================================
-- Run this in Supabase SQL Editor to create test students

-- Insert test students
INSERT INTO students (
  id_number,
  date_of_birth,
  full_name,
  first_name,
  last_name,
  email,
  phone,
  program,
  department,
  enrollment_year,
  graduation_year,
  enrollment_status,
  is_verified,
  verified_at,
  allow_credential_issuance,
  attributes
) VALUES 
(
  'STU2024001',
  '2002-03-15',
  'Alice Johnson',
  'Alice',
  'Johnson',
  'alice.johnson@university.edu',
  '+1234567890',
  'Computer Science',
  'Engineering',
  2024,
  2028,
  'active',
  true,
  NOW(),
  true,
  '{"major": "CS", "minor": "Mathematics"}'::jsonb
),
(
  'STU2024002',
  '2001-07-22',
  'Bob Smith',
  'Bob',
  'Smith',
  'bob.smith@university.edu',
  '+1234567891',
  'Electrical Engineering',
  'Engineering',
  2024,
  2028,
  'active',
  true,
  NOW(),
  true,
  '{"major": "EE", "concentration": "Power Systems"}'::jsonb
),
(
  'STU2024003',
  '2000-11-08',
  'Carol Williams',
  'Carol',
  'Williams',
  'carol.williams@university.edu',
  '+1234567892',
  'Business Administration',
  'Business',
  2023,
  2027,
  'active',
  true,
  NOW(),
  true,
  '{"major": "MBA", "concentration": "Finance"}'::jsonb
),
(
  'STU2023050',
  '1999-05-30',
  'David Brown',
  'David',
  'Brown',
  'david.brown@university.edu',
  '+1234567893',
  'Mechanical Engineering',
  'Engineering',
  2023,
  2027,
  'graduated',
  true,
  NOW(),
  true,
  '{"major": "ME", "thesis": "Robotics"}'::jsonb
),
(
  'STU2022010',
  '2001-01-17',
  'Emma Davis',
  'Emma',
  'Davis',
  'emma.davis@university.edu',
  '+1234567894',
  'Computer Science',
  'Engineering',
  2022,
  2026,
  'active',
  true,
  NOW(),
  false,  -- This student has opted out
  '{"major": "CS", "minor": "Data Science"}'::jsonb
),
(
  'STU2021055',
  '2000-09-12',
  'Frank Miller',
  'Frank',
  'Miller',
  'frank.miller@university.edu',
  '+1234567895',
  'Physics',
  'Science',
  2021,
  2025,
  'suspended',
  true,
  NOW(),
  true,
  '{"major": "Physics", "concentration": "Theoretical"}'::jsonb
);

-- Create a test admin user (NOTE: In production, use proper password hashing!)
-- Password: admin123 (hash is just for testing - use bcrypt in production!)
INSERT INTO admin_users (
  email,
  full_name,
  role,
  password_hash,
  is_active
) VALUES 
(
  'admin@university.edu',
  'System Administrator',
  'admin',
  '$2a$10$test_hash_for_admin123',  -- In production: use bcrypt
  true
),
(
  'staff@university.edu',
  'University Staff',
  'staff',
  '$2a$10$test_hash_for_staff123',
  true
);

-- Update issuer config
UPDATE issuer_config 
SET issuer_name = 'State University', 
    contact_email = 'registrar@stateuniversity.edu',
    website_url = 'https://stateuniversity.edu'
WHERE issuer_id = 'default';
