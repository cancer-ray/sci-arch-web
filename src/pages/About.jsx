import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { SoloLnBadge } from "@/components/SoloLnBadge";
import { GroupLnBadge } from "@/components/GroupLnBadge";
import { PlusBadge } from "@/components/PlusBadge";
import { KofiButton } from "@/components/KofiButton";
import { Lock, ExternalLink } from "lucide-react";

const REPO_URL = "https://github.com/cancer-ray/sci-arch-web";

const lineup = [
  {
    badge: <FreeLnBadge size="lg" />,
    plus: false,
    body: "Free, local, for anyone writing up their own work. No account, nothing uploaded.",
  },
  {
    badge: <SoloLnBadge size="lg" />,
    plus: true,
    body: "For founders and individual scientists: a cloud notebook of your own. Launching next week.",
  },
  {
    badge: <GroupLnBadge size="lg" />,
    plus: true,
    body: "What I built at scrybio.ai. Shared notebooks, e-signatures, a full audit trail. Scales from a two-person lab to an enterprise. Launching in August.",
  },
];

export default function About() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSending(true);
    window.location.href = `mailto:ryan@sci-arch.ca?subject=${encodeURIComponent(
      "Hi from sci-arch.ca"
    )}&body=${encodeURIComponent(`From: ${email}\n\n${message}`)}`;
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* HEADER */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            § about
          </div>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
            About sci-arch.
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Solo-founded, bootstrapped.
          </p>
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="border-b border-border bg-secondary/20">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-8 px-6 py-16 sm:flex-row sm:items-center sm:gap-10">
          <img
            src="/images/ryan-about.jpg"
            alt="Ryan Lee"
            className="h-40 w-40 flex-none rounded-full border border-border object-cover shadow-[0_4px_20px_rgba(0,0,0,0.10)] ring-1 ring-border/40 ring-offset-2 ring-offset-background sm:h-48 sm:w-48"
            style={{ objectPosition: "50% 20%" }}
          />
          <blockquote>
            <p className="font-serif text-2xl leading-snug tracking-tight text-foreground sm:text-3xl">
              "I shipped freeLN to give students a way to stay organized, and graduate faster, by
              putting AI to work in their data. It's free, and it always will be."
            </p>
            <footer className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Ryan Lee · CEO &amp; founder
            </footer>
          </blockquote>
        </div>
      </section>

      {/* BACKGROUND */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-xl text-foreground">Background</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bachelor's at McMaster: four years of biology and psychology. Then seven years in a
              biomedical engineering doctorate, most of it hands-on: real experiments, real
              failures, real notebooks that never held up the way anyone said they would. By day
              I'm CTO at scrybio.ai, a DNA computing company running an agentic DNA design
              pipeline.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-foreground">Why groupLN exists</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              At scrybio.ai, our AI pipeline started writing a lot of our documentation. I went
              looking for a lab notebook with real write rules for that: who wrote what, when,
              reviewed by whom. Couldn't find one. So I built groupLN internally. Told a few other
              founders about it. Every one of them had the same problem. So I shipped it.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-foreground">The gap</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              AI is genuinely good at science. Used right, it's a copy of you: same reasoning,
              same shorthand, same instincts, just faster. But its changes aren't signed. Nobody
              can say who actually wrote a line, or whether a human ever looked at it. A record
              nobody can vouch for isn't a record.
            </p>
          </div>
          <div>
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
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.6} /> private by design
            </div>
            <h2 className="mt-3 font-serif text-xl text-foreground">
              freeLN runs entirely on your machine. Nothing is uploaded.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              freeLN has no account and no server. When you open a note or drop in a
              folder, the files are read in your browser, rendered in your browser, and
              autosaved to your browser's own local storage. They never travel to sci-arch
              or anywhere else. Close the tab and your files stay on your disk, right where
              they were.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You do not have to take my word for it. The entire front end is open source,
              so you can read exactly what it does. The freeLN engine that loads your files
              is one small, readable file.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-lift inline-flex h-9 items-center gap-2 border border-border px-4 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                View the source <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={`${REPO_URL}/blob/main/src/lib/folder.js`}
                target="_blank"
                rel="noreferrer"
                className="btn-lift inline-flex h-9 items-center gap-2 border border-border px-4 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Read the folder loader <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="border border-border bg-secondary/20 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              what freeLN does, and what it never does
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
              <li>
                <span className="font-medium text-foreground">Reads your files</span> with
                the browser File API, in the tab.
              </li>
              <li>
                <span className="font-medium text-foreground">Renders markdown</span> to
                HTML, in the tab.
              </li>
              <li>
                <span className="font-medium text-foreground">Autosaves drafts</span> to
                localStorage, on your device.
              </li>
              <li>
                <span className="font-medium text-foreground">Never</span> calls a server,
                uploads a file, or asks for an account.
              </li>
            </ul>
            <pre className="mt-4 overflow-x-auto border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground/80">{`// freeLN: everything stays local
const text = await file.text();      // read in your browser
localStorage.setItem(draftKey, text); // saved on your device
// no fetch(), no upload, no account`}</pre>
          </div>
        </div>
      </section>

      {/* THE LINEUP */}
      <section className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-serif text-xl text-foreground">The lineup</h2>
          <div className="mt-6 grid gap-0 border border-border sm:grid-cols-3">
            {lineup.map((l, i) => (
              <div
                key={i}
                className={`p-6 ${i < lineup.length - 1 ? "sm:border-r border-border" : ""} ${
                  i > 0 ? "border-t sm:border-t-0 border-border" : ""
                }`}
              >
                {l.plus && (
                  <div className="mb-1.5">
                    <PlusBadge size="sm" />
                  </div>
                )}
                {l.badge}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT + SUPPORT */}
      <section>
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-xl text-foreground">Get in touch</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <a
                href="mailto:ryan@sci-arch.ca"
                className="text-foreground underline underline-offset-4"
              >
                ryan@sci-arch.ca
              </a>
              . Say hi, or use the form.
            </p>
            {sent ? (
              <div className="mt-6 border border-border p-4">
                <p className="text-sm text-foreground">
                  Your email app should have opened. Send it and I'll reply at{" "}
                  <span className="font-mono">{email}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-2">
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@lab.edu"
                  className="h-9 w-full border border-border bg-transparent px-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full resize-none border border-border bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-lift h-9 w-full bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col justify-center border border-border bg-secondary/20 p-8 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              freeLN is free, and it always will be. If it saved you time this semester, you can
              buy me a coffee.
            </p>
            <KofiButton className="btn-lift mx-auto mt-5 inline-flex h-10 items-center gap-2 bg-foreground px-5 text-sm font-medium text-background hover:opacity-90" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
