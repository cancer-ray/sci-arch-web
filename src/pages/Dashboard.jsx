import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, ShieldCheck, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD, NAV } from "@/constants/testIds";

const planLabel = { free: "freeLN", academic: "soloLN", enterprise: "groupLN" };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid={DASHBOARD.root}>
      <Nav />

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              § dashboard · {user.email}
            </div>
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
              className="border border-border bg-secondary/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground"
            >
              plan · {planLabel[user.plan] || user.plan}
            </span>
            <span
              data-testid={DASHBOARD.seatsInfo}
              className="border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              seats · {user.seats}
            </span>
          </div>
        </div>

        <div className="border border-border">
          {/* Plan card */}
          <div className="p-8">
            <div className="flex items-start justify-between">
              <ShieldCheck className="h-5 w-5 text-foreground" strokeWidth={1.4} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                status · {user.subscription_status}
              </span>
            </div>
            <h2 className="mt-6 font-serif text-2xl">Subscription</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {user.plan === "free"
                ? "You're on freeLN. Upgrade to sci-arch+ for a cloud notebook, shared access, and a Part 11-aligned audit trail."
                : `You're on the ${planLabel[user.plan]} plan with ${user.seats} seat${user.seats > 1 ? "s" : ""} prepaid.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                data-testid={user.plan === "free" ? DASHBOARD.upgradeBtn : DASHBOARD.managePlanBtn}
                className="inline-flex h-9 items-center gap-2 bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
              >
                {user.plan === "free" ? "Upgrade plan" : "Manage plan"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quickstart */}
        <div className="mt-10 border border-border p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            § quickstart
          </div>
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
