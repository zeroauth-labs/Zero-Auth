/**
 * Student Verification & Credential Issuance Edge Function
 * 
 * Verifies a student's identity using ID number and date of birth,
 * then issues a credential if valid.
 * 
 * FIXES APPLIED:
 * - Fixed claims logic: check student columns first, then attributes
 * - Added proper ID number format validation
 * - Added DOB format validation
 * - Added idempotency support (prevent duplicate credentials)
 * - Fixed issuer name from config
 * - Added proper logging to verification_logs
 * - Added user_agent logging
 * - Added rate limiting
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  id_number: string;
  date_of_birth: string;
  credential_type?: string;
  claims?: string[];
  idempotency_key?: string;
}

// Rate limiting configuration
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation functions
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidIdNumber(id: string): boolean {
  // Adjust pattern based on your university's ID format
  // Common formats: 6-20 alphanumeric characters
  return /^[A-Z0-9]{6,20}$/i.test(id);
}

function hashIdNumber(idNum: string): string {
  // Simple hash for logging - in production use crypto.subtle
  let hash = 0;
  for (let i = 0; i < idNum.length; i++) {
    const char = idNum.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.'
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get issuer config
    const { data: issuerConfig, error: configError } = await supabase
      .from('issuer_config')
      .select('*')
      .eq('issuer_id', 'default')
      .single();

    const issuerName = issuerConfig?.issuer_name || 'University Name';
    const validityDays = issuerConfig?.credential_validity_days || 365;

    // Parse request body
    const body: RequestBody = await req.json();
    const { 
      id_number, 
      date_of_birth, 
      credential_type = 'Student ID', 
      claims = ['full_name', 'id_number', 'enrollment_status'],
      idempotency_key 
    } = body;

    // Validate input
    if (!id_number || !date_of_birth) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'INVALID_INPUT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'id_number and date_of_birth are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ID number format
    if (!isValidIdNumber(id_number)) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'INVALID_ID_FORMAT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid ID number format'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    if (!isValidDate(date_of_birth)) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'INVALID_DOB_FORMAT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid date format. Use YYYY-MM-DD'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check idempotency key
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('issued_credentials')
        .select('id, credential_uuid, credential_type, issued_at, expires_at, revoked')
        .eq('request_idempotency_key', idempotency_key)
        .single();

      if (existing) {
        // Return existing credential
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', (await supabase.from('issued_credentials').select('student_id').eq('request_idempotency_key', idempotency_key).single())?.data?.student_id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            credential: {
              type: existing.credential_type,
              id: existing.credential_uuid,
              issuedAt: existing.issued_at,
              expiresAt: existing.expires_at,
              issuer: issuerName,
              attributes: student ? {
                full_name: student.full_name,
                id_number: student.id_number,
                enrollment_status: student.enrollment_status
              } : {},
              isRevoked: existing.revoked
            },
            message: existing.revoked ? 'Credential was revoked' : 'Credential already issued'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Query student - FIXED: Check student columns first, then attributes
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id_number', id_number.toUpperCase())
      .eq('date_of_birth', date_of_birth)
      .single();

    if (studentError || !student) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'NOT_FOUND', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'No student found with this ID number and date of birth'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if student allows credential issuance
    if (!student.allow_credential_issuance) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'NOT_ALLOWED', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_ALLOWED',
          message: 'Student has opted out of credential issuance'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check enrollment status
    if (student.enrollment_status && !['active', 'graduated'].includes(student.enrollment_status)) {
      await logVerification(supabase, id_number, 'credential_issuance', false, 'INACTIVE_ENROLLMENT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INACTIVE_ENROLLMENT',
          message: `Cannot issue credential: student enrollment status is ${student.enrollment_status}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build credential data based on requested claims
    // FIXED: Check student columns first, then attributes
    const credentialData: Record<string, unknown> = {};
    const studentColumns = ['full_name', 'first_name', 'last_name', 'id_number', 'email', 'program', 'department', 'enrollment_year', 'graduation_year', 'enrollment_status'];
    
    for (const claim of claims) {
      if (studentColumns.includes(claim) && student[claim as keyof typeof student] !== undefined) {
        credentialData[claim] = student[claim as keyof typeof student];
      } else if (student.attributes && typeof student.attributes === 'object' && claim in student.attributes) {
        credentialData[claim] = student.attributes[claim];
      }
    }

    // Always include id_number
    credentialData.id_number = student.id_number;

    // Calculate expiry
    const issuedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Issue credential record
    const { data: credential, error: credError } = await supabase
      .from('issued_credentials')
      .insert({
        student_id: student.id,
        credential_type,
        credential_data: credentialData,
        expires_at: expiresAt.toISOString(),
        request_ip: clientIp,
        request_user_agent: req.headers.get('user-agent') || 'unknown',
        request_idempotency_key: idempotency_key || crypto.randomUUID()
      })
      .select()
      .single();

    if (credError) {
      console.error('Credential issuance error:', credError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Failed to issue credential'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful verification
    await logVerification(supabase, id_number, 'credential_issuance', true, null, req);

    // Return credential
    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          type: credential_type,
          id: credential.credential_uuid,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          issuer: issuerName,
          attributes: credentialData
        },
        message: 'Credential verified and issued successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to log verifications
async function logVerification(
  supabase: any,
  idNumber: string,
  verificationType: string,
  success: boolean,
  failureReason: string | null,
  req: Request
) {
  try {
    await supabase
      .from('verification_logs')
      .insert({
        id_number_hash: hashIdNumber(idNumber),
        verification_type: verificationType,
        success,
        failure_reason: failureReason,
        request_ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        request_user_agent: req.headers.get('user-agent') || 'unknown'
      });
  } catch (e) {
    console.error('Failed to log verification:', e);
  }
}

// Import createClient (this is how Supabase Edge Functions work)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
