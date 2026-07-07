import { useEffect } from "react";
import { ev } from "@/lib/analytics";

/**
 * Per-route document title + meta description, and an optional funnel event.
 * SPA-friendly (no dep): sets the tab title and the existing <meta name=description>
 * on mount/route change. Static Open Graph in public/index.html still covers
 * social scrapers; this covers the browser + JS-capable crawlers.
 */
export function Seo({ title, description, event }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", description);
    }
    if (event) ev(event);
  }, [title, description, event]);
  return null;
}
