import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase environment check:", {
  hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL),
  hasAnonKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
});

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

