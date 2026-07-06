import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * Google OAuth return. Supabase (detectSessionInUrl) parses the code from the URL
 * and establishes the session automatically; we just wait for it and route on.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const go = (session) => {
      if (done) return;
      done = true;
      navigate(session ? "/dashboard" : "/", { replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go(session);
    });
    const t = setTimeout(() => go(null), 8000); // fallback if no session arrives
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        finalizing sign-in…
      </div>
    </div>
  );
}
