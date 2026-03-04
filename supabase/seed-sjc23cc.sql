-- ============================================================================
-- Your Custom Student Data - SJC23CC001 to SJC23CC072
-- ============================================================================
-- Run this in Supabase SQL Editor to add your students

-- First, let's clear any existing test data (optional - remove if you want to keep both)
-- DELETE FROM students WHERE id_number LIKE 'SJC23CC%';

-- Insert 72 students with IDs SJC23CC001 to SJC23CC072
-- All set to active enrollment, verified, and allowed to receive credentials

INSERT INTO students (
  id_number,
  date_of_birth,
  full_name,
  first_name,
  last_name,
  email,
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
-- SJC23CC001 - SJC23CC010
('SJC23CC001', '2004-01-15', 'Student One', 'Student', 'One', 'sjc23cc001@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC002', '2004-02-20', 'Student Two', 'Student', 'Two', 'sjc23cc002@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC003', '2004-03-10', 'Student Three', 'Student', 'Three', 'sjc23cc003@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC004', '2004-04-05', 'Student Four', 'Student', 'Four', 'sjc23cc004@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC005', '2004-05-25', 'Student Five', 'Student', 'Five', 'sjc23cc005@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC006', '2004-06-12', 'Student Six', 'Student', 'Six', 'sjc23cc006@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC007', '2004-07-08', 'Student Seven', 'Student', 'Seven', 'sjc23cc007@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC008', '2004-08-22', 'Student Eight', 'Student', 'Eight', 'sjc23cc008@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC009', '2004-09-14', 'Student Nine', 'Student', 'Nine', 'sjc23cc009@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC010', '2004-10-30', 'Student Ten', 'Student', 'Ten', 'sjc23cc010@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),

-- SJC23CC011 - SJC23CC020
('SJC23CC011', '2004-11-18', 'Student Eleven', 'Student', 'Eleven', 'sjc23cc011@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC012', '2004-12-05', 'Student Twelve', 'Student', 'Twelve', 'sjc23cc012@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC013', '2005-01-08', 'Student Thirteen', 'Student', 'Thirteen', 'sjc23cc013@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC014', '2005-02-14', 'Student Fourteen', 'Student', 'Fourteen', 'sjc23cc014@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC015', '2005-03-21', 'Student Fifteen', 'Student', 'Fifteen', 'sjc23cc015@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC016', '2005-04-03', 'Student Sixteen', 'Student', 'Sixteen', 'sjc23cc016@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC017', '2005-05-17', 'Student Seventeen', 'Student', 'Seventeen', 'sjc23cc017@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC018', '2005-06-25', 'Student Eighteen', 'Student', 'Eighteen', 'sjc23cc018@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC019', '2005-07-11', 'Student Nineteen', 'Student', 'Nineteen', 'sjc23cc019@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),
('SJC23CC020', '2005-08-19', 'Student Twenty', 'Student', 'Twenty', 'sjc23cc020@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "A"}'::jsonb),

-- SJC23CC021 - SJC23CC030
('SJC23CC021', '2005-09-02', 'Student Twenty-One', 'Student', 'Twenty-One', 'sjc23cc021@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC022', '2005-10-16', 'Student Twenty-Two', 'Student', 'Twenty-Two', 'sjc23cc022@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC023', '2005-11-24', 'Student Twenty-Three', 'Student', 'Twenty-Three', 'sjc23cc023@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC024', '2005-12-07', 'Student Twenty-Four', 'Student', 'Twenty-Four', 'sjc23cc024@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC025', '2004-01-10', 'Student Twenty-Five', 'Student', 'Twenty-Five', 'sjc23cc025@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC026', '2004-02-18', 'Student Twenty-Six', 'Student', 'Twenty-Six', 'sjc23cc026@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC027', '2004-03-25', 'Student Twenty-Seven', 'Student', 'Twenty-Seven', 'sjc23cc027@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC028', '2004-04-12', 'Student Twenty-Eight', 'Student', 'Twenty-Eight', 'sjc23cc028@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC029', '2004-05-20', 'Student Twenty-Nine', 'Student', 'Twenty-Nine', 'sjc23cc029@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC030', '2004-06-08', 'Student Thirty', 'Student', 'Thirty', 'sjc23cc030@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),

-- SJC23CC031 - SJC23CC040
('SJC23CC031', '2004-07-15', 'Student Thirty-One', 'Student', 'Thirty-One', 'sjc23cc031@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC032', '2004-08-23', 'Student Thirty-Two', 'Student', 'Thirty-Two', 'sjc23cc032@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC033', '2004-09-05', 'Student Thirty-Three', 'Student', 'Thirty-Three', 'sjc23cc033@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC034', '2004-10-12', 'Student Thirty-Four', 'Student', 'Thirty-Four', 'sjc23cc034@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC035', '2004-11-20', 'Student Thirty-Five', 'Student', 'Thirty-Five', 'sjc23cc035@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC036', '2004-12-03', 'Student Thirty-Six', 'Student', 'Thirty-Six', 'sjc23cc036@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC037', '2005-01-14', 'Student Thirty-Seven', 'Student', 'Thirty-Seven', 'sjc23cc037@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC038', '2005-02-22', 'Student Thirty-Eight', 'Student', 'Thirty-Eight', 'sjc23cc038@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC039', '2005-03-05', 'Student Thirty-Nine', 'Student', 'Thirty-Nine', 'sjc23cc039@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),
('SJC23CC040', '2005-04-18', 'Student Forty', 'Student', 'Forty', 'sjc23cc040@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "B"}'::jsonb),

-- SJC23CC041 - SJC23CC050
('SJC23CC041', '2005-05-26', 'Student Forty-One', 'Student', 'Forty-One', 'sjc23cc041@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC042', '2005-06-09', 'Student Forty-Two', 'Student', 'Forty-Two', 'sjc23cc042@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC043', '2005-07-17', 'Student Forty-Three', 'Student', 'Forty-Three', 'sjc23cc043@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC044', '2005-08-25', 'Student Forty-Four', 'Student', 'Forty-Four', 'sjc23cc044@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC045', '2005-09-08', 'Student Forty-Five', 'Student', 'Forty-Five', 'sjc23cc045@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC046', '2005-10-21', 'Student Forty-Six', 'Student', 'Forty-Six', 'sjc23cc046@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC047', '2005-11-04', 'Student Forty-Seven', 'Student', 'Forty-Seven', 'sjc23cc047@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC048', '2005-12-12', 'Student Forty-Eight', 'Student', 'Forty-Eight', 'sjc23cc048@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC049', '2004-01-22', 'Student Forty-Nine', 'Student', 'Forty-Nine', 'sjc23cc049@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC050', '2004-02-05', 'Student Fifty', 'Student', 'Fifty', 'sjc23cc050@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),

-- SJC23CC051 - SJC23CC060
('SJC23CC051', '2004-03-15', 'Student Fifty-One', 'Student', 'Fifty-One', 'sjc23cc051@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC052', '2004-04-25', 'Student Fifty-Two', 'Student', 'Fifty-Two', 'sjc23cc052@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC053', '2004-05-07', 'Student Fifty-Three', 'Student', 'Fifty-Three', 'sjc23cc053@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC054', '2004-06-19', 'Student Fifty-Four', 'Student', 'Fifty-Four', 'sjc23cc054@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC055', '2004-07-27', 'Student Fifty-Five', 'Student', 'Fifty-Five', 'sjc23cc055@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC056', '2004-08-10', 'Student Fifty-Six', 'Student', 'Fifty-Six', 'sjc23cc056@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC057', '2004-09-18', 'Student Fifty-Seven', 'Student', 'Fifty-Seven', 'sjc23cc057@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC058', '2004-10-26', 'Student Fifty-Eight', 'Student', 'Fifty-Eight', 'sjc23cc058@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC059', '2004-11-09', 'Student Fifty-Nine', 'Student', 'Fifty-Nine', 'sjc23cc059@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC060', '2004-12-21', 'Student Sixty', 'Student', 'Sixty', 'sjc23cc060@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),

-- SJC23CC061 - SJC23CC072
('SJC23CC061', '2005-01-05', 'Student Sixty-One', 'Student', 'Sixty-One', 'sjc23cc061@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC062', '2005-02-13', 'Student Sixty-Two', 'Student', 'Sixty-Two', 'sjc23cc062@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC063', '2005-03-24', 'Student Sixty-Three', 'Student', 'Sixty-Three', 'sjc23cc063@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC064', '2005-04-06', 'Student Sixty-Four', 'Student', 'Sixty-Four', 'sjc23cc064@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC065', '2005-05-14', 'Student Sixty-Five', 'Student', 'Sixty-Five', 'sjc23cc065@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC066', '2005-06-22', 'Student Sixty-Six', 'Student', 'Sixty-Six', 'sjc23cc066@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC067', '2005-07-03', 'Student Sixty-Seven', 'Student', 'Sixty-Seven', 'sjc23cc067@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC068', '2005-08-16', 'Student Sixty-Eight', 'Student', 'Sixty-Eight', 'sjc23cc068@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC069', '2005-09-24', 'Student Sixty-Nine', 'Student', 'Sixty-Nine', 'sjc23cc069@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC070', '2005-10-07', 'Student Seventy', 'Student', 'Seventy', 'sjc23cc070@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC071', '2005-11-15', 'Student Seventy-One', 'Student', 'Seventy-One', 'sjc23cc071@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb),
('SJC23CC072', '2005-12-28', 'Student Seventy-Two', 'Student', 'Seventy-Two', 'sjc23cc072@college.edu', 'Computer Science', 'Computing', 2023, 2027, 'active', true, NOW(), true, '{"batch": "2023", "section": "C"}'::jsonb)
ON CONFLICT (id_number) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as total_students FROM students WHERE id_number LIKE 'SJC23CC%';

-- Show sample
SELECT id_number, full_name, email, enrollment_status 
FROM students 
WHERE id_number LIKE 'SJC23CC%' 
ORDER BY id_number
LIMIT 10;
