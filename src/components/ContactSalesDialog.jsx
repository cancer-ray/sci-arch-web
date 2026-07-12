import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { captureLead } from "@/lib/supabase";
import { ev } from "@/lib/analytics";
import { CONTACT } from "@/constants/testIds";

const COPY = {
  enterprise: {
    eyebrow: "§ team & custom",
    title: "Support a whole team",
    description:
      "If you're backing freeLN for a lab, or need something custom built, tell me a bit about it and I’ll reply personally, usually within a day.",
  },
  waitlist: {
    eyebrow: "§ keep in touch",
    title: "Get notified",
    description:
      "Leave your email and I’ll let you know when there’s something new worth sharing. No list churn, just the occasional note from me.",
  },
};

const CONTACT_EMAIL = "ryan@sci-arch.ca";

export function ContactSalesDialog({ open, onOpenChange, defaultSeats = 10, variant = "enterprise" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [seats, setSeats] = useState(defaultSeats);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [captured, setCaptured] = useState(false); // true when the lead was saved server-side
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = COPY[variant] || COPY.enterprise;
  const isWaitlist = variant === "waitlist";

  useEffect(() => {
    if (open) {
      setDone(false);
      setCaptured(false);
      setSubmitting(false);
      setCopied(false);
      setSeats(defaultSeats);
    }
  }, [open, defaultSeats]);

  const subject = isWaitlist ? "sci-arch — keep me posted" : "sci-arch — team / custom support";
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${org || "n/a"}`,
    `Seats: ${seats}`,
    message ? `Notes: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  // Try to capture the lead server-side (Supabase `leads` table). If that isn't
  // configured yet or fails, fall back to the copy-to-clipboard / mailto flow so
  // a lead is never silently lost. Fires a funnel event either way.
  const submit = async (e) => {
    e.preventDefault();
    setCopied(false);
    setSubmitting(true);
    const kind = isWaitlist ? "waitlist" : "enterprise";
    ev("waitlist_submit", { tier: variant, kind });
    let ok = false;
    try {
      const res = await captureLead({ email, name, organization: org, seats, message, tier: variant, kind });
      ok = Boolean(res?.ok);
    } catch {
      ok = false;
    }
    setCaptured(ok);
    setSubmitting(false);
    setDone(true);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — mailto still works.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid={CONTACT.dialog} className="rounded-[2px] border border-border sm:max-w-md">
        <DialogHeader>
          <div className="eyebrow">{copy.eyebrow}</div>
          <DialogTitle className="font-serif text-2xl font-medium">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        {done && captured ? (
          <div
            data-testid={CONTACT.success}
            className="rounded-[2px] border border-border p-5 text-sm text-foreground/80 sm:p-6"
          >
            <p className="font-serif text-lg text-foreground">Got it, thanks.</p>
            <p className="mt-2 text-muted-foreground">
              Thanks{name ? `, ${name.split(" ")[0]}` : ""} — I'll be in touch at{" "}
              <span className="font-mono text-foreground">{email}</span>{" "}
              {isWaitlist ? "when there's something new worth sharing" : "about your team, usually within a day"}.
            </p>
          </div>
        ) : done ? (
          <div
            data-testid={CONTACT.success}
            className="rounded-[2px] border border-border p-5 text-sm text-foreground/80 sm:p-6"
          >
            <p className="font-serif text-lg text-foreground">Your message is ready.</p>
            <p className="mt-2 text-muted-foreground">
              Email it to <span className="font-mono text-foreground">{CONTACT_EMAIL}</span> and
              I'll get back to you at <span className="font-mono">{email}</span>.
            </p>
            <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap border border-border bg-secondary/30 p-3 font-mono text-xs leading-relaxed text-foreground/85">
              {body}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={copyMessage}>
                {copied ? "Copied!" : "Copy message"}
              </Button>
              <a href={mailtoHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Open email app
              </a>
              <Button size="sm" variant="ghost" onClick={() => setDone(false)}>
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Name
              </label>
              <Input
                data-testid={CONTACT.name}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Work email
              </label>
              <Input
                data-testid={CONTACT.email}
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Organization{isWaitlist ? " (optional)" : ""}
                </label>
                <Input
                  data-testid={CONTACT.org}
                  required={!isWaitlist}
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Seats
                </label>
                <Input
                  data-testid={CONTACT.seats}
                  type="number"
                  min={1}
                  max={5000}
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value || "0", 10))}
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Notes (optional)
              </label>
              <Textarea
                data-testid={CONTACT.message}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 resize-none"
              />
            </div>
            <DialogFooter>
              <Button data-testid={CONTACT.submit} type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : isWaitlist ? "Keep me posted" : "Send it my way"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
