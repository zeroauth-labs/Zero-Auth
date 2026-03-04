/**
 * Revoke Credential Edge Function (Admin)
 * 
 * Allows administrators to revoke a credential.
 * Requires admin authentication via JWT.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  credential_uuid: string;
  reason?: string;
}

// Helper to verify admin
async function verifyAdmin(supabase: any, authHeader: string): Promise<{ isAdmin: boolean; adminId?: string; error?: string }> {
  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get email
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user?.email) {
      return { isAdmin: false, error: 'Invalid token' };
    }

    // Check if user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return { isAdmin: false, error: 'Not authorized' };
    }

    return { isAdmin: true, adminId: admin.id };
  } catch (e) {
    return { isAdmin: false, error: 'Auth check failed' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authorization required'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminCheck = await verifyAdmin(supabase, authHeader);
    if (!adminCheck.isAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'FORBIDDEN',
          message: adminCheck.error || 'Admin access required'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { credential_uuid, reason } = body;

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

    // Check if credential exists
    const { data: credential, error: fetchError } = await supabase
      .from('issued_credentials')
      .select('id, revoked, credential_uuid')
      .eq('credential_uuid', credential_uuid)
      .single();

    if (fetchError || !credential) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'NOT_FOUND',
          message: 'Credential not found'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already revoked
    if (credential.revoked) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ALREADY_REVOKED',
          message: 'Credential is already revoked'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Revoke the credential
    const { error: revokeError } = await supabase
      .from('issued_credentials')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason || 'Revoked by administrator',
        revoked_by: adminCheck.adminId
      })
      .eq('id', credential.id);

    if (revokeError) {
      console.error('Revoke error:', revokeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SERVER_ERROR',
          message: 'Failed to revoke credential'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Credential revoked successfully',
        credentialUuid: credential_uuid
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
