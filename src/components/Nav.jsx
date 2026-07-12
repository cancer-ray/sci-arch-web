import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SettingsMenu } from "@/components/SettingsMenu";
import { Button } from "@/components/ui/button";
import { LogoMark, Wordmark } from "@/components/Logo";
import { FolderDrop } from "@/components/FolderDrop";
import { ev } from "@/lib/analytics";
import { NAV } from "@/constants/testIds";

export function Nav() {
  const { user, logout } = useAuth();
  const { setWorkspace } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFolder = (ws) => {
    setWorkspace(ws);
    toast.success(`Loaded ${ws.markdown.length} markdown file${ws.markdown.length === 1 ? "" : "s"}`);
    ev("start_freeln", { via: "folder" });
    navigate("/workspace");
  };

  const openNotebook = (via) => {
    ev("start_freeln", { via: via || "cta" });
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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          <div className="hidden sm:block">
            <FolderDrop variant="compact" onLoaded={handleFolder} testid={NAV.openFolderBtn} />
          </div>
          {user ? (
            <>
              <Link
                to="/dashboard"
                data-testid={NAV.dashboardBtn}
                className="hidden h-8 items-center gap-2 rounded-[2px] border border-border px-3 text-xs tracking-tight text-foreground transition-colors hover:bg-secondary sm:inline-flex"
              >
                Dashboard
              </Link>
              <button
                data-testid={NAV.signOutBtn}
                onClick={handleSignOut}
                className="hidden h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors sm:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              data-testid={NAV.signInBtn}
              onClick={() => navigate("/pricing")}
              title="freeLN is free — support the work if it helps"
              className="hidden sm:inline-flex"
            >
              Support
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => openNotebook("nav")}
            className="hidden sm:inline-flex"
          >
            Open notebook
          </Button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-border text-foreground transition-colors hover:bg-secondary md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6 lg:px-8">
            {[
              { to: "/#top", label: "Overview", id: "top" },
              { to: "/#features", label: "Features", id: "features" },
              { to: "/pricing", label: "Pricing" },
              { to: "/about", label: "About" },
              { to: "/#faq", label: "FAQ", id: "faq" },
            ].map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={(e) => {
                  if (l.id) anchorScroll(e, l.id);
                  setMenuOpen(false);
                }}
                className="border-b border-border/60 py-2.5 text-sm text-foreground/80 last:border-b-0 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-2 py-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setMenuOpen(false);
                  openNotebook("nav-mobile");
                }}
              >
                Open notebook
              </Button>
              <FolderDrop variant="compact" onLoaded={handleFolder} testid={NAV.openFolderBtn} />
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-8 items-center rounded-[2px] border border-border px-3 text-xs text-foreground transition-colors hover:bg-secondary"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/pricing");
                    setMenuOpen(false);
                  }}
                >
                  Support
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
