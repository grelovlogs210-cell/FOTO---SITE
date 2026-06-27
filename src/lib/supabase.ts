import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSecretKey =
  typeof supabaseAnonKey === "string" &&
  (supabaseAnonKey.startsWith("sb_secret_") || supabaseAnonKey.includes("service_role"));

if (isSecretKey) {
  console.error(
    "Invalid Supabase browser configuration: use VITE_SUPABASE_ANON_KEY with the public anon key, not a secret key.",
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey && !isSecretKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;
