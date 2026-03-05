import Constants from 'expo-constants';

type SupabaseConfig = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

// Default to university/student DB
const DEFAULT_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || null;
const DEFAULT_SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null;

// Aadhaar-specific Supabase (from .env or use default)
const AADHAAR_SUPABASE_URL = process.env.EXPO_PUBLIC_AADHAAR_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const AADHAAR_SUPABASE_KEY = process.env.EXPO_PUBLIC_AADHAAR_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export function getSupabaseConfig(): SupabaseConfig {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const supabaseUrl = extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || null;
  const supabaseAnonKey = extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null;

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Get Supabase config based on credential type
 * University/Student → uses default Supabase
 * Aadhaar → uses Aadhaar-specific Supabase (or default if not configured)
 */
export function getSupabaseConfigForCredential(credentialType: string): SupabaseConfig {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  
  if (credentialType === 'Aadhaar') {
    return {
      supabaseUrl: extra?.AADHAAR_SUPABASE_URL || AADHAAR_SUPABASE_URL,
      supabaseAnonKey: extra?.AADHAAR_SUPABASE_ANON_KEY || AADHAAR_SUPABASE_KEY,
    };
  }
  
  // Default to student/university Supabase
  return {
    supabaseUrl: extra?.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    supabaseAnonKey: extra?.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY,
  };
}
