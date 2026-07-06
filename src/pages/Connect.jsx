import { useState } from "react";
import { Copy, Bot, KeyRound, PenLine } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CONNECTOR_URL, copyConnectorUrl } from "@/lib/connector";

const steps = [
  {
    icon: KeyRound,
    title: "Generate an API key",
    body: "Sign in to your sci-arch account and create a connector key from your account settings. Keys are scoped to you: an AI acting on a key acts as you, in the audit trail.",
  },
  {
    icon: Copy,
    title: "Add the connector to Claude",
    body: `Paste ${CONNECTOR_URL} as a custom connector in Claude (Code or claude.ai), with your API key as the bearer token.`,
  },
  {
    icon: Bot,
    title: "Ask it to work in your notebook",
    body: "Try: \"draft a procedure entry for a Suzuki coupling\" or \"search my notebook for the last time I used Pd(PPh3)4.\" Claude reads, drafts, and edits, nothing more.",
  },
  {
    icon: PenLine,
    title: "You review and sign",
    body: "Every AI action lands as a signed, versioned, attributable record. Only you can sign and lock it; Claude never does.",
  },
];

export default function Connect() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    copyConnectorUrl(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          § connect
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">
          Add sci-arch to Claude.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          A remote MCP connector that lets Claude read, draft, and edit your notebook as you.
          No AI markup: you already pay for your model, we don&apos;t add a seat fee on top.
        </p>

        <div className="mt-8 flex items-center gap-3 border border-border bg-secondary/20 p-4">
          <span className="flex-1 truncate font-mono text-sm text-foreground">{CONNECTOR_URL}</span>
          <button
            onClick={copy}
            className="inline-flex h-8 items-center gap-2 border border-border px-3 text-xs text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <ol className="mt-10 space-y-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="flex gap-4 border-t border-border pt-6">
                <div className="flex-none">
                  <div className="flex h-9 w-9 items-center justify-center border border-border">
                    <Icon className="h-4 w-4 text-foreground" strokeWidth={1.6} />
                  </div>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 font-serif text-xl text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          A note on trust: signing and locking a record, reopening a locked record, billing, and
          lab membership are never exposed to the connector. Those stay deliberately human-only.
        </div>
      </main>
      <Footer />
    </div>
  );
}
