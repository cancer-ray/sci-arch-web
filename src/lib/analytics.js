// Thin, safe wrapper over Vercel Analytics custom events. Never throws (a
// blocked/absent analytics runtime must never break a user action). Events only
// report on the deployed Vercel site; locally they no-op.
import { track } from "@vercel/analytics";

export function ev(name, props) {
  try {
    track(name, props || undefined);
  } catch {
    /* analytics unavailable — ignore */
  }
}
