// lib/ensureSession.ts
import { supabase } from '@/lib/supabaseClient';

export async function ensureSession() {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
  const { data: me } = await supabase.auth.getUser();
  return me.user?.id || null;
}