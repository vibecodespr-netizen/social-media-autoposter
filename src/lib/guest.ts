import { supabase } from "@/integrations/supabase/client";

const NOT_ENABLED = /anonymous.*(disabled|not enabled)|anonymous sign-?ins? (are|is) disabled/i;

// Sign in without an account using Supabase anonymous auth. Anonymous users get
// a real auth.uid(), so row-level security and all workspace data work normally.
export async function signInAsGuest(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInAnonymously();
  if (!error) return { error: null };
  if (NOT_ENABLED.test(error.message)) {
    return {
      error:
        'Guest mode is not enabled for this project yet. Enable "Allow anonymous sign-ins" in Supabase Auth settings, or create an account.',
    };
  }
  return { error: error.message };
}
