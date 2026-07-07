import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, ShieldCheck, Loader2, CloudOff } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD, NAV } from "@/constants/testIds";

const planLabel = { free: "freeLN", academic: "soloLN", enterprise: "groupLN" };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  // Enrich the session user with backend profile data (plan/seats/status). A
  // failed call must never strand the page on a spinner — we fall back to the
  // free tier and surface a friendly notice instead.
  useEffect(() => {
    if (!user) return;
    api
      .get("/me")
      .then(({ data }) => {
        setBackendDown(false);
        setProfile(data?.user || null);
      })
      .catch(() => setBackendDown(true));
  }, [user]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  const plan = profile?.plan || user.plan || "free";
  const seats = profile?.seats ?? user.seats ?? 1;
  const subscriptionStatus =
    profile?.subscription_status || user.subscription_status || (backendDown ? "offline" : "free tier");

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid={DASHBOARD.root}>
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow">§ dashboard · {user.email}</div>
            <h1
              data-testid={DASHBOARD.welcome}
              className="mt-3 font-serif text-4xl leading-tight tracking-tight text-foreground"
            >
              Welcome, <span className="italic">{user.name.split(" ")[0]}</span>.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              data-testid={DASHBOARD.planBadge}
              className="rounded-[2px] border border-border bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground"
            >
              plan · {planLabel[plan] || plan}
            </span>
            <span
              data-testid={DASHBOARD.seatsInfo}
              className="rounded-[2px] border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              seats · {seats}
            </span>
          </div>
        </div>

        <div className="rounded-[2px] border border-border">
          {/* Plan card */}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <ShieldCheck className="h-5 w-5 text-foreground" strokeWidth={1.4} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                status · {subscriptionStatus}
              </span>
            </div>
            <h2 className="mt-6 font-serif text-2xl">Subscription</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {plan === "free"
                ? "You're on freeLN. Upgrade to sci-arch+ for a cloud notebook, shared access, and a Part 11-aligned audit trail."
                : `You're on the ${planLabel[plan]} plan with ${seats} seat${seats > 1 ? "s" : ""} prepaid.`}
            </p>
            {backendDown && (
              <p className="mt-4 flex max-w-md items-start gap-2 rounded-[2px] border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                <CloudOff className="mt-0.5 h-3.5 w-3.5 flex-none" strokeWidth={1.5} />
                <span>
                  sci-arch+ backend isn&apos;t available yet — you&apos;re on the list. Live
                  subscription details will appear here once it&apos;s online.
                </span>
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                data-testid={plan === "free" ? DASHBOARD.upgradeBtn : DASHBOARD.managePlanBtn}
                className={cn(buttonVariants({ variant: "primary", size: "md" }))}
              >
                {plan === "free" ? "Upgrade plan" : "Manage plan"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quickstart */}
        <div className="mt-10 rounded-[2px] border border-border p-6 sm:p-8">
          <div className="eyebrow">§ quickstart</div>
          <h3 className="mt-2 font-serif text-2xl text-foreground">Where to next</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">01</span>
              <p className="mt-1 text-sm text-foreground/80">Create your first experiment, sign &amp; lock when done.</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">02</span>
              <p className="mt-1 text-sm text-foreground/80">Invite lab members and prepay seats when you&apos;re ready.</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">03</span>
              <p className="mt-1 text-sm text-foreground/80">
                Review your{" "}
                <Link to="/compliance" className="text-foreground underline underline-offset-4">
                  validation report &amp; SOPs
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      {/* Helper to make it easier for e2e tests to find sign-out */}
      <span className="sr-only" data-testid={NAV.signOutBtn + "-anchor"} aria-hidden />
    </div>
  );
}
