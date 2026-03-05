/**
 * Aadhaar Verification & Credential Issuance Edge Function
 * 
 * Verifies an Aadhaar holder's identity using Aadhaar number (hashed) and date of birth,
 * then issues a credential with derived age attributes.
 * 
 * Attributes derived:
 * - birth_year: Year extracted from DOB
 * - age_over_18: 1 if age >= 18, 0 otherwise
 * - age_over_23: 1 if age >= 23, 0 otherwise
 * - indian_citizen: 1 (assumed true after verification)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  aadhaar_number: string;
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

// Hash Aadhaar number using SHA-256
async function hashAadhaar(aadhaar: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(aadhaar);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate Aadhaar number format (12 digits)
function isValidAadhaarNumber(aadhaar: string): boolean {
  // Aadhaar is 12 digits
  return /^\d{12}$/.test(aadhaar);
}

// Validate date format
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// Calculate age and derive attributes
function calculateAgeAttributes(dateOfBirth: string): {
  birth_year: number;
  age_over_18: number;
  age_over_23: number;
  indian_citizen: number;
} {
  const dob = new Date(dateOfBirth);
  const currentYear = new Date().getFullYear();
  const birthYear = dob.getFullYear();
  const age = currentYear - birthYear;
  
  return {
    birth_year: birthYear,
    age_over_18: age >= 18 ? 1 : 0,
    age_over_23: age >= 23 ? 1 : 0,
    indian_citizen: 1 // Assumed true after verification
  };
}

// Hash for logging (truncated hash)
function hashForLog(aadhaarHash: string): string {
  return aadhaarHash.substring(0, 8);
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
      .eq('issuer_id', 'aadhaar')
      .single();

    const issuerName = issuerConfig?.issuer_name || 'UIDAI (Aadhaar)';
    const validityDays = issuerConfig?.credential_validity_days || (365 * 5);

    // Parse request body
    const body: RequestBody = await req.json();
    const { 
      aadhaar_number, 
      date_of_birth, 
      credential_type = 'Aadhaar', 
      claims = ['birth_year', 'age_over_18', 'age_over_23', 'indian_citizen'],
      idempotency_key 
    } = body;

    // Validate input
    if (!aadhaar_number || !date_of_birth) {
      await logVerification(supabase, 'unknown', 'aadhaar_verification', false, 'INVALID_INPUT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'aadhaar_number and date_of_birth are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Aadhaar number format
    if (!isValidAadhaarNumber(aadhaar_number)) {
      await logVerification(supabase, 'unknown', 'aadhaar_verification', false, 'INVALID_AADHAAR_FORMAT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid Aadhaar number. Must be 12 digits.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format
    if (!isValidDate(date_of_birth)) {
      await logVerification(supabase, 'unknown', 'aadhaar_verification', false, 'INVALID_DOB_FORMAT', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'Invalid date format. Use YYYY-MM-DD'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the Aadhaar number
    const aadhaarHash = await hashAadhaar(aadhaar_number);

    // Check idempotency key
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('aadhaar_credentials')
        .select('id, credential_uuid, credential_type, issued_at, expires_at, revoked')
        .eq('request_idempotency_key', idempotency_key)
        .single();

      if (existing) {
        // Return existing credential
        const { data: aadhaar } = await supabase
          .from('aadhaar_holders')
          .select('*')
          .eq('id', (await supabase.from('aadhaar_credentials').select('aadhaar_id').eq('request_idempotency_key', idempotency_key).single())?.data?.aadhaar_id)
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
              attributes: aadhaar ? calculateAgeAttributes(aadhaar.date_of_birth.toISOString().split('T')[0]) : {},
              isRevoked: existing.revoked
            },
            message: existing.revoked ? 'Credential was revoked' : 'Credential already issued'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Query Aadhaar holder
    const { data: aadhaar, error: aadhaarError } = await supabase
      .from('aadhaar_holders')
      .select('*')
      .eq('aadhaar_number_hash', aadhaarHash)
      .eq('date_of_birth', date_of_birth)
      .single();

    if (aadhaarError || !aadhaar) {
      await logVerification(supabase, hashForLog(aadhaarHash), 'aadhaar_verification', false, 'NOT_FOUND', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'No Aadhaar holder found with this Aadhaar number and date of birth'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if Aadhaar holder allows credential issuance
    if (!aadhaar.allow_credential_issuance) {
      await logVerification(supabase, hashForLog(aadhaarHash), 'aadhaar_verification', false, 'NOT_ALLOWED', req);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_ALLOWED',
          message: 'Aadhaar holder has opted out of credential issuance'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate age attributes from DOB
    const ageAttributes = calculateAgeAttributes(date_of_birth);

    // Build credential data based on requested claims
    const credentialData: Record<string, unknown> = {};
    const aadhaarColumns = ['full_name', 'first_name', 'last_name', 'gender', 'state', 'district'];
    
    for (const claim of claims) {
      if (claim in ageAttributes) {
        credentialData[claim] = ageAttributes[claim as keyof keyof typeof ageAttributes];
      } else if (aadhaarColumns.includes(claim) && aadhaar[claim as keyof typeof aadhaar] !== undefined) {
        credentialData[claim] = aadhaar[claim as keyof typeof aadhaar];
      } else if (aadhaar.attributes && typeof aadhaar.attributes === 'object' && claim in aadhaar.attributes) {
        credentialData[claim] = aadhaar.attributes[claim];
      }
    }

    // Always include derived attributes
    credentialData.birth_year = ageAttributes.birth_year;
    credentialData.age_over_18 = ageAttributes.age_over_18;
    credentialData.age_over_23 = ageAttributes.age_over_23;
    credentialData.indian_citizen = ageAttributes.indian_citizen;

    // Calculate expiry
    const issuedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Issue credential record
    const { data: credential, error: credError } = await supabase
      .from('aadhaar_credentials')
      .insert({
        aadhaar_id: aadhaar.id,
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
    await logVerification(supabase, hashForLog(aadhaarHash), 'aadhaar_verification', true, null, req);

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
        message: 'Aadhaar verified and credential issued successfully'
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
  aadhaarHash: string,
  verificationType: string,
  success: boolean,
  failureReason: string | null,
  req: Request
) {
  try {
    await supabase
      .from('aadhaar_verification_logs')
      .insert({
        aadhaar_hash: aadhaarHash,
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

// Import createClient
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
