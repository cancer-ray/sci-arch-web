import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONTACT } from "@/constants/testIds";

const COPY = {
  enterprise: {
    eyebrow: "§ enterprise inquiry",
    title: "Talk to sales",
    description:
      "Prepay for a term, volume discounts, custom SSO / audit configurations. We’ll reply within one business day.",
  },
  waitlist: {
    eyebrow: "§ sci-arch+, coming soon",
    title: "Get early access",
    description:
      "soloLN is launching next week; groupLN launches in August. Leave your email and I’ll reach out personally the moment it’s ready, plus early-access pricing.",
  },
};

export function ContactSalesDialog({ open, onOpenChange, defaultSeats = 10, variant = "enterprise" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [seats, setSeats] = useState(defaultSeats);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const copy = COPY[variant] || COPY.enterprise;
  const isWaitlist = variant === "waitlist";

  useEffect(() => {
    if (open) {
      setDone(false);
      setSeats(defaultSeats);
    }
  }, [open, defaultSeats]);

  // No backend is deployed yet, so this opens the visitor's own mail client
  // with the form pre-filled instead of POSTing to /contact/sales. Swap
  // back to the API call once the backend is live (see git history for the
  // previous version).
  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = isWaitlist ? "sci-arch+ early access" : "Enterprise inquiry";
    const lines = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Organization: ${org || "n/a"}`,
      `Seats: ${seats}`,
      message ? `Notes: ${message}` : null,
    ].filter(Boolean);
    window.location.href = `mailto:ryan@sci-arch.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      lines.join("\n")
    )}`;
    setDone(true);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={CONTACT.dialog} className="rounded-none border border-border sm:max-w-md">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {copy.eyebrow}
          </div>
          <DialogTitle className="font-serif text-2xl font-medium">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div
            data-testid={CONTACT.success}
            className="border border-border p-6 text-sm text-foreground/80"
          >
            <p className="font-serif text-lg text-foreground">Your email app should have opened.</p>
            <p className="mt-2 text-muted-foreground">
              Send it and Ryan will get back to you at <span className="font-mono">{email}</span> shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Name</label>
              <input
                data-testid={CONTACT.name}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9 w-full border border-border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Work email</label>
              <input
                data-testid={CONTACT.email}
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-9 w-full border border-border bg-transparent px-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Organization{isWaitlist ? " (optional)" : ""}
                </label>
                <input
                  data-testid={CONTACT.org}
                  required={!isWaitlist}
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="mt-1 h-9 w-full border border-border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Seats</label>
                <input
                  data-testid={CONTACT.seats}
                  type="number"
                  min={1}
                  max={5000}
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value || "0", 10))}
                  className="mt-1 h-9 w-full border border-border bg-transparent px-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</label>
              <textarea
                data-testid={CONTACT.message}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full resize-none border border-border bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <DialogFooter>
              <button
                data-testid={CONTACT.submit}
                type="submit"
                disabled={submitting}
                className="btn-lift h-9 w-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Sending…" : isWaitlist ? "Join the list" : "Send inquiry"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
