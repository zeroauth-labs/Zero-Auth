import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database query timeout (default 10 seconds)
const DB_QUERY_TIMEOUT = parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10);

export interface Session {
  id?: string;
  session_id: string;
  nonce: string;
  verifier_name?: string;
  required_claims?: Record<string, unknown>;
  status: string;
  proof?: Record<string, unknown>;
  created_at?: string;
  expires_at: string;
}

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => {
          // Add timeout to all Supabase requests
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), DB_QUERY_TIMEOUT);
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeout));
        },
      },
    });
  }
  return supabase;
}

export async function createSession(
  sessionId: string,
  nonce: string,
  verifierName?: string,
  requiredClaims?: unknown
): Promise<Session> {
  const client = getSupabaseClient();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Store required_claims as JSON string to avoid Supabase array issues
  const claimsJson = requiredClaims ? JSON.stringify(requiredClaims) : null;

  const session: Session = {
    session_id: sessionId,
    nonce,
    verifier_name: verifierName,
    required_claims: claimsJson as unknown as Record<string, unknown>,
    status: 'PENDING',
    proof: undefined,
    expires_at: expiresAt,
  };

  const { data, error } = await client
    .from('sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    // Check for abort error (timeout)
    if (error.message?.includes('abort') || error.message?.includes('Aborted')) {
      console.error('Database query timed out:', error);
      throw new Error('Database query timed out');
    }
    console.error('Error creating session:', error);
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return data;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      // Check for abort error (timeout)
      if (error.message?.includes('abort') || error.message?.includes('Aborted')) {
        console.error('Database query timed out:', error);
        throw new Error('Database query timed out');
      }
      if (error.code === 'PGRST116') {
        // PGRST116 is the "Postgres error code for no rows returned"
        return null;
      }
      console.error('Error getting session:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    // Check if session has expired
    if (new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data;
  } catch (error: any) {
    if (error.message?.includes('abort') || error.message?.includes('Aborted') || error.message?.includes('timed out')) {
      throw error;
    }
    throw error;
  }
}

export async function updateSession(
  sessionId: string,
  updates: Partial<Session>
): Promise<Session | null> {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      // Check for abort error (timeout)
      if (error.message?.includes('abort') || error.message?.includes('Aborted')) {
        console.error('Database query timed out:', error);
        throw new Error('Database query timed out');
      }
      console.error('Error updating session:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return data;
  } catch (err: any) {
    if (err.message?.includes('abort') || err.message?.includes('Aborted') || err.message?.includes('timed out')) {
      throw err;
    }
    throw err;
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const client = getSupabaseClient();

  const now = new Date().toISOString();

  const { data, error } = await client
    .from('sessions')
    .delete()
    .lt('expires_at', now)
    .select('session_id');

  if (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw new Error(`Failed to cleanup sessions: ${error.message}`);
  }

  const deletedCount = data?.length || 0;
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} expired session(s)`);
  }

  return deletedCount;
}
