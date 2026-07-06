import { createClient } from "@supabase/supabase-js";

// Public (browser-safe) Supabase client. The URL + anon key are publishable;
// Row-Level Security governs what a signed-in user can read directly, and all
// writes go through the audited Fastify API (which verifies the same JWT).
const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surface a clear message but DON'T crash the marketing site — createClient
  // throws on an empty key, which would white-screen the whole app. The public
  // pages (landing, pricing, folder-drop workspace) work without auth; only
  // sign-in / API calls need real values.
  // eslint-disable-next-line no-console
  console.warn("Supabase env missing: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (auth disabled)");
}

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
