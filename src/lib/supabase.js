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

// True only when real Supabase env is configured (not the placeholder fallback).
export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Capture a lead/waitlist signup into the public `leads` table (anon INSERT,
 * RLS write-only). Returns { ok }. Safe: resolves { ok:false } if Supabase
 * isn't configured or the insert fails, so callers fall back to mailto/clipboard
 * and no lead-flow ever throws. Activates once REACT_APP_SUPABASE_ANON_KEY is set
 * and the leads migration (backend/migrations/0003_leads.sql) is applied.
 */
export async function captureLead(payload) {
  if (!supabaseConfigured) return { ok: false, reason: "not-configured" };
  try {
    const { error } = await supabase.from("leads").insert([
      {
        email: payload.email || null,
        name: payload.name || null,
        organization: payload.organization || null,
        seats: payload.seats ?? null,
        message: payload.message || null,
        tier: payload.tier || null,
        kind: payload.kind || "waitlist",
        source: payload.source || (typeof window !== "undefined" ? window.location.pathname : null),
      },
    ]);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}
