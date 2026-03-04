/**
 * Validate Credential Edge Function
 * 
 * Verifies if a credential is valid (not expired, not revoked).
 * This is used by verifiers (e.g., businesses checking student discounts)
 * to validate credentials presented to them.
 * 
 * PUBLIC API - No authentication required
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  credential_uuid: string;
  expected_type?: string;  // Optional: verify it's a specific type
  expected_id_number?: string;  // Optional: verify it belongs to a specific student
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if public verification is allowed
    const { data: config } = await supabase
      .from('issuer_config')
      .select('allow_public_verification, issuer_name')
      .eq('issuer_id', 'default')
      .single();

    if (!config?.allow_public_verification) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VERIFICATION_DISABLED',
          message: 'Public credential verification is disabled'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { credential_uuid, expected_type, expected_id_number } = body;

    if (!credential_uuid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'credential_uuid is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch credential with student info
    const { data: credential, error } = await supabase
      .from('issued_credentials')
      .select(`
        *,
        student:students(
          id_number,
          full_name,
          enrollment_status
        )
      `)
      .eq('credential_uuid', credential_uuid)
      .single();

    if (error || !credential) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'NOT_FOUND',
          message: 'Credential not found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    const now = new Date();
    let isExpired = false;
    if (credential.expires_at && new Date(credential.expires_at) < now) {
      isExpired = true;
    }

    // Check revocation status
    if (credential.revoked) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'REVOKED',
          message: 'Credential has been revoked',
          revokedAt: credential.revoked_at,
          revokedReason: credential.revoked_reason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (isExpired) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'EXPIRED',
          message: 'Credential has expired',
          expiredAt: credential.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expected type
    if (expected_type && credential.credential_type !== expected_type) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'TYPE_MISMATCH',
          message: `Expected credential type "${expected_type}", got "${credential.credential_type}"`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expected ID number
    if (expected_id_number && credential.student?.id_number !== expected_id_number.toUpperCase()) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'ID_MISMATCH',
          message: 'Credential does not belong to the specified student'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valid credential!
    return new Response(
      JSON.stringify({
        valid: true,
        credential: {
          type: credential.credential_type,
          id: credential.credential_uuid,
          issuedAt: credential.issued_at,
          expiresAt: credential.expires_at,
          issuer: config.issuer_name,
          student: {
            name: credential.student?.full_name,
            idNumber: credential.student?.id_number,
            enrollmentStatus: credential.student?.enrollment_status
          },
          attributes: credential.credential_data
        },
        message: 'Credential is valid'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
