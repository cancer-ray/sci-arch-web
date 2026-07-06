import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SettingsMenu } from "@/components/SettingsMenu";
import { LogoMark, Wordmark } from "@/components/Logo";
import { FolderDrop } from "@/components/FolderDrop";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { NAV } from "@/constants/testIds";

export function Nav() {
  const { user, logout } = useAuth();
  const { setWorkspace } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const handleFolder = (ws) => {
    setWorkspace(ws);
    toast.success(`Loaded ${ws.markdown.length} markdown file${ws.markdown.length === 1 ? "" : "s"}`);
    navigate("/workspace");
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  const linkCls = (path) =>
    `text-sm tracking-tight transition-colors ${
      location.pathname === path
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  // In-page anchor links. When already on the landing route, take over the
  // click entirely (preventDefault) and scroll to the target ourselves —
  // React Router's hash-only navigation both fails to re-fire the scroll effect
  // and races the ScrollManager. Off the landing route we let the Link navigate
  // to "/#id" and ScrollManager handles it on arrival.
  const anchorScroll = (e, id) => {
    if (location.pathname !== "/") return;
    e.preventDefault();
    if (id === "top") window.scrollTo(0, 0);
    else document.getElementById(id)?.scrollIntoView({ block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            data-testid={NAV.logo}
            className="flex items-center gap-2 text-foreground"
          >
            <LogoMark size={22} />
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/#top"
              data-testid={NAV.landingLink}
              onClick={(e) => anchorScroll(e, "top")}
              className={linkCls("/")}
            >
              Overview
            </Link>
            <Link
              to="/workspace"
              data-testid={NAV.workspaceLink}
              className={linkCls("/workspace")}
            >
              Workspace
            </Link>
            <Link
              to="/#features"
              data-testid={NAV.featuresLink}
              onClick={(e) => anchorScroll(e, "features")}
              className={linkCls("/features")}
            >
              Features
            </Link>
            <Link to="/pricing" data-testid={NAV.pricingLink} className={linkCls("/pricing")}>
              Pricing
            </Link>
            <Link to="/about" data-testid={NAV.aboutLink} className={linkCls("/about")}>
              About
            </Link>
            <Link
              to="/#faq"
              data-testid={NAV.faqLink}
              onClick={(e) => anchorScroll(e, "faq")}
              className={linkCls("/faq")}
            >
              FAQ
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <SettingsMenu />
          <FolderDrop variant="compact" onLoaded={handleFolder} testid={NAV.openFolderBtn} />
          {user ? (
            <>
              <Link
                to="/dashboard"
                data-testid={NAV.dashboardBtn}
                className="btn-lift inline-flex h-8 items-center gap-2 border border-border px-3 text-xs tracking-tight text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Dashboard
              </Link>
              <button
                data-testid={NAV.signOutBtn}
                onClick={handleSignOut}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              data-testid={NAV.signInBtn}
              onClick={() => setWaitlistOpen(true)}
              title="Sign-in is for sci-arch+, launching soon"
              className="btn-lift h-8 border border-border px-3 text-xs text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              sci-arch+: get early access
            </button>
          )}
        </div>
      </div>
      <ContactSalesDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} variant="waitlist" defaultSeats={1} />
    </header>
  );
}
