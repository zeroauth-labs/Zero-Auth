/**
 * Get Student Credential Edge Function
 * 
 * Retrieves a specific credential by its UUID.
 * This is used by the wallet to fetch previously issued credentials.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get credential_uuid from query params
    const url = new URL(req.url);
    const credentialUuid = url.searchParams.get('credential_uuid');

    if (!credentialUuid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_INPUT',
          message: 'credential_uuid is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get issuer config
    const { data: issuerConfig } = await supabase
      .from('issuer_config')
      .select('issuer_name')
      .eq('issuer_id', 'default')
      .single();

    const issuerName = issuerConfig?.issuer_name || 'University Name';

    // Fetch credential
    const { data: credential, error } = await supabase
      .from('issued_credentials')
      .select(`
        *,
        student:students!inner(
          id_number,
          full_name,
          email,
          enrollment_status
        )
      `)
      .eq('credential_uuid', credentialUuid)
      .single();

    if (error || !credential) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
          message: 'Credential not found'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if revoked or expired
    const now = new Date();
    const isExpired = credential.expires_at && new Date(credential.expires_at) < now;

    return new Response(
      JSON.stringify({
        success: true,
        credential: {
          type: credential.credential_type,
          id: credential.credential_uuid,
          issuedAt: credential.issued_at,
          expiresAt: credential.expires_at,
          issuer: issuerName,
          attributes: credential.credential_data,
          isRevoked: credential.revoked,
          isExpired: isExpired,
          student: {
            idNumber: credential.student?.id_number,
            fullName: credential.student?.full_name,
            enrollmentStatus: credential.student?.enrollment_status
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
