import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { StripeBuyButton } from "@/components/StripeBuyButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Lock, ExternalLink } from "lucide-react";

const REPO_URL = "https://github.com/cancer-ray/sci-arch-web";

const lineup = [
  {
    badge: <FreeLnBadge size="lg" />,
    body: "Free, local, for anyone writing up their own work. No account, nothing uploaded. This is the whole product, and it stays free.",
  },
  {
    badge: <span className="font-serif text-xl text-foreground">Buy me lunch</span>,
    body: "Name your own price, $15 CAD minimum, monthly. A small thank-you if freeLN saved you time, with no tier gates behind it.",
  },
  {
    badge: <span className="font-serif text-xl text-foreground">Support my dev work</span>,
    body: "$50 CAD per seat each month. A steadier way for a lab or team to back the work and buy me more days to keep shipping.",
  },
];

const CONTACT_EMAIL = "ryan@sci-arch.ca";

export default function About() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);

  const composedBody = `From: ${email}\n\n${message}`;
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Hi from sci-arch.ca"
  )}&body=${encodeURIComponent(composedBody)}`;

  const submit = (e) => {
    e.preventDefault();
    setPrepared(true);
    setCopied(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\n${composedBody}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — mailto still works.
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HEADER */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="eyebrow">§ about</div>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
            About sci-arch.
          </h1>
          <p className="mt-2 max-w-[65ch] text-sm text-muted-foreground">
            Solo-founded, bootstrapped.
          </p>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="border-b border-border bg-secondary/20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-14 sm:flex-row sm:items-center sm:gap-10 sm:px-6 sm:py-16 lg:px-8">
          <img
            src="/images/ryan-about.jpg"
            alt="Ryan Lee"
            className="h-40 w-40 flex-none rounded-full border border-border object-cover sm:h-48 sm:w-48"
            style={{ objectPosition: "50% 20%" }}
          />
          <blockquote className="max-w-[65ch]">
            <p className="font-serif text-2xl leading-snug tracking-tight text-foreground sm:text-3xl">
              "I shipped freeLN to give students a way to stay organized, and graduate faster, by
              putting AI to work in their data. It's free, and it always will be."
            </p>
            <footer className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Ryan Lee · solo developer
            </footer>
          </blockquote>
        </div>
      </section>

      {/* BACKGROUND */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-[65ch]">
            <h2 className="font-serif text-xl text-foreground">Background</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bachelor's at McMaster: four years of biology and psychology. Then seven years in a
              biomedical engineering doctorate, most of it hands-on: real experiments, real
              failures, real notebooks that never held up the way anyone said they would. By day
              I'm CTO at scrybio.ai, a DNA computing company running an agentic DNA design
              pipeline.
            </p>
          </div>
          <div className="max-w-[65ch]">
            <h2 className="font-serif text-xl text-foreground">Why I built the audit layer</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              At scrybio.ai, our AI pipeline started writing a lot of our documentation. I went
              looking for a lab notebook with real write rules for that, tracking who wrote what,
              when, reviewed by whom. Couldn't find one, so I built the record layer myself. A few
              other founders I told had the same problem, so I kept building it out.
            </p>
          </div>
          <div className="max-w-[65ch]">
            <h2 className="font-serif text-xl text-foreground">The gap</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI is genuinely good at science. Used right, it's a copy of you: same reasoning,
              same shorthand, same instincts, just faster. But its changes aren't signed. Nobody
              can say who actually wrote a line, or whether a human ever looked at it. A record
              nobody can vouch for isn't a record.
            </p>
          </div>
          <div className="max-w-[65ch]">
            <h2 className="font-serif text-xl text-foreground">Human first</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Everything works by hand if you never touch AI. AI is optional, bring-your-own, and
              it never signs anything. A human always signs.
            </p>
          </div>
        </div>
      </section>

      {/* PRIVATE BY DESIGN (open source, verifiable) */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-[65ch]">
            <div className="eyebrow flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.6} /> private by design
            </div>
            <h2 className="mt-3 font-serif text-xl text-foreground">
              freeLN runs entirely on your machine. Nothing is uploaded.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              freeLN has no account and no server. When you open a note or drop in a folder, the
              files are read in your browser, rendered in your browser, and autosaved to your
              browser's own local storage. They never travel to sci-arch or anywhere else. Close
              the tab and your files stay on your disk, right where they were.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You do not have to take my word for it. The whole front end is open source, so you
              can read exactly what it does. The freeLN loader that reads your files is one small,
              readable file.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-border px-4 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                View the source <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={`${REPO_URL}/blob/main/src/lib/folder.js`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-border px-4 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Read the folder loader <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-[2px] border border-border bg-card p-5 sm:p-6">
            <div className="eyebrow">what freeLN does, and what it never does</div>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
              <li>
                <span className="font-medium text-foreground">Reads your files</span> with the
                browser File API, in the tab.
              </li>
              <li>
                <span className="font-medium text-foreground">Renders markdown</span> to HTML, in
                the tab.
              </li>
              <li>
                <span className="font-medium text-foreground">Autosaves drafts</span> to
                localStorage, on your device.
              </li>
              <li>
                <span className="font-medium text-foreground">Never</span> calls a server, uploads
                a file, or asks for an account.
              </li>
            </ul>
            <pre className="mt-4 overflow-x-auto rounded-[2px] border border-border bg-secondary/30 p-3 font-mono text-xs leading-relaxed text-foreground/80">{`// freeLN: everything stays local
const text = await file.text();      // read in your browser
localStorage.setItem(draftKey, text); // saved on your device
// no fetch(), no upload, no account`}</pre>
          </div>
        </div>
      </section>

      {/* THE LINEUP */}
      <section className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="font-serif text-xl text-foreground">The lineup</h2>
          <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
            {lineup.map((l, i) => (
              <div key={i} className="bg-card p-5 sm:p-6">
                {l.badge}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT + SUPPORT */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-[65ch]">
            <h2 className="font-serif text-xl text-foreground">Get in touch</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-foreground underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              . Say hi, or use the form.
            </p>
            {prepared ? (
              <div className="mt-6 rounded-[2px] border border-border bg-card p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  your message, ready to send to {CONTACT_EMAIL}
                </p>
                <pre className="mt-3 whitespace-pre-wrap border border-border bg-secondary/30 p-3 font-mono text-xs leading-relaxed text-foreground/85">
                  {composedBody}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={copyMessage}>
                    {copied ? "Copied!" : "Copy message"}
                  </Button>
                  <a href={mailtoHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Open email app
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => setPrepared(false)}>
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-2">
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lab.edu"
                  className="font-mono"
                />
                <Textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="resize-none"
                />
                <Button type="submit" className="w-full">
                  Prepare message
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-col justify-center rounded-[2px] border border-border bg-secondary/20 p-5 text-center sm:p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              freeLN is free, and it always will be. If it saved you time this semester, you can
              buy me lunch.
            </p>
            <StripeBuyButton className="mx-auto mt-5" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
