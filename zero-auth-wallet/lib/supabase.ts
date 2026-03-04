import Constants from 'expo-constants';

type SupabaseConfig = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

export function getSupabaseConfig(): SupabaseConfig {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const supabaseUrl = extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || null;
  const supabaseAnonKey = extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null;

  return { supabaseUrl, supabaseAnonKey };
}
