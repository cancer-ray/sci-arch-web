import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import LandingPage from "@/pages/Landing";
import Pricing from "@/pages/Pricing";
import Workspace from "@/pages/Workspace";
import Dashboard from "@/pages/Dashboard";
import Compliance from "@/pages/Compliance";
import AuthCallback from "@/pages/AuthCallback";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import Connect from "@/pages/Connect";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

// Centralized scroll behavior for every navigation. React Router does not reset
// scroll on route changes, so Pricing/About/etc. would otherwise keep the prior
// page's offset. On each location change we jump to the hash target if there is
// one (Overview/Features/FAQ anchors), else to the top. Instant, not smooth, so
// the nav "snaps" predictably to the right place.
function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, key]);
  return null;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/compliance" element={<Compliance />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function AppShell() {
  const { lightweight, theme } = useTheme();
  return (
    <MotionConfig reducedMotion={lightweight ? "always" : "user"}>
      <BrowserRouter>
        <ScrollManager />
        <AppRouter />
        <Toaster
          position="bottom-right"
          theme={theme}
          toastOptions={{
            style: {
              borderRadius: 2,
              fontFamily: "IBM Plex Sans, sans-serif",
            },
          }}
        />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <AppShell />
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
