import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.error("Supabase configuration check:", {
    mode: import.meta.env.MODE,
    hasUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(
      supabasePublishableKey
    ),
  });

  throw new Error(
    "Missing Supabase environment variables. Expected VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);

