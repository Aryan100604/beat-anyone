import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey
  && !supabaseUrl.includes('your-project-id')
  && !supabaseAnonKey.includes('your-anon-key')) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('[Beat Anyone] Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.');
}

export async function saveLead(name: string, phone: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your credentials to .env and restart.');
  }
  const { error } = await supabase.from('leads').insert({ name: name.trim(), phone: phone.trim() });
  if (error) throw error;
}
