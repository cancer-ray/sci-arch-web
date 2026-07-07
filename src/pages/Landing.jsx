import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  HardDrive,
  Download,
  Search,
  ShieldCheck,
  Users,
  Lock,
  Bot,
  UserX,
  Clock,
  FolderX,
  Copy,
  PenLine,
  Plug,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ElnHero } from "@/components/ElnHero";
import { PricingTable } from "@/components/PricingTable";
import { FreeLnBadge } from "@/components/FreeLnBadge";
import { Seo } from "@/components/Seo";
import { CONNECTOR_URL, copyConnectorUrl } from "@/lib/connector";
import { LANDING } from "@/constants/testIds";

const studentFeatures = [
  {
    id: LANDING.featureLocal,
    label: "01",
    title: "Write, save, import, free",
    body: "freeLN runs entirely in your browser: write new entries or bring in notes from Word, PDF, Notion, or another ELN export. It all stays on your machine.",
    icon: HardDrive,
  },
  {
    id: LANDING.featureMarkdown,
    label: "02",
    title: "Markdown-native",
    body: "Tables, formulas, procedures, checklists. Write in Obsidian, VS Code, or vim, sci-arch renders it exactly.",
    icon: FileText,
  },
  {
    id: LANDING.featureSearch,
    label: "03",
    title: "Full-text search",
    body: "Grep across every experiment. Find that reagent lot, that protocol tweak, that gel from last semester in one keystroke.",
    icon: Search,
  },
  {
    id: LANDING.featureExport,
    label: "04",
    title: "Export for lab reports",
    body: "Every entry exports to clean PDF for TA submissions and thesis appendices, no reformatting.",
    icon: Download,
  },
  {
    id: LANDING.featureFree,
    label: "05",
    title: "AI-capable",
    body: "Bring your own model, back it up to the cloud, and manage your personal reagents.",
    icon: Bot,
    preview: "soloLN · coming soon",
  },
  {
    id: LANDING.featureImages,
    label: "06",
    title: "Built for teams",
    body: "A GLP-compliance layer for labs ranging from 2 employees to enterprise: inventory management, shared seats, tracked commenting between users, and shared equipment booking.",
    icon: Users,
    preview: "groupLN · coming soon",
  },
];


const faqs = [
  {
    q: "What's the difference between freeLN and sci-arch+?",
    a: "freeLN is live today: fully local, nothing is ever uploaded, free forever. sci-arch+ is the cloud product, coming soon: soloLN (a solo scientist's synced, audit-ready notebook) and groupLN (for small labs and teams: shared notebooks, e-signatures, and a full audit trail). Join the waitlist on the pricing section above for early access.",
  },
  {
    q: "Where is my data stored?",
    a: "With freeLN, on your machine, nowhere else. It runs entirely in your browser, so I do not collect or read your data and nothing is uploaded to a server. With sci-arch+ (the cloud tier), your notebook lives in your own account on Supabase (Postgres plus encrypted storage) with per-lab access controls; see the privacy policy for the full data map.",
  },
  {
    q: "Is Claude allowed for science?",
    a: "Yes. The concern isn't whether you use AI, it's whether the record is defensible. An AI can't legally sign a lab note, so if it drafts unattributed, ungoverned text, that's the problem. Connect Claude through our MCP and every action it takes is signed under your name in a tamper-evident trail; you review and sign before it counts.",
  },
  {
    q: "Do I have to use AI?",
    a: "No. Every feature works fully by hand, start to finish. AI is optional power tooling, never required.",
  },
  {
    q: "What can Claude actually do in my notebook?",
    a: "Draft entries from your raw notes, check your reagent inventory, reformat a table, search past experiments, or summarize a week of work, anything short of the final sign-off. If you're not sure where to start, email me and I'll walk you through a real setup.",
  },
  {
    q: "What can I import into freeLN?",
    a: "Word documents, PDFs, Notion or Obsidian exports, and exports from other ELNs. sci-arch converts them to markdown entirely in your browser. Nothing is uploaded to a server.",
  },
  {
    q: "Is sci-arch open source?",
    a: "The client is open. The sync and audit backend is proprietary for the paid tier.",
  },
];

const problemPoints = [
  {
    icon: UserX,
    title: "Not attributable",
    body: "An AI is not a legal signer. When it writes a lab note, there's no accountable person behind the entry.",
  },
  {
    icon: Clock,
    title: "No paper trail",
    body: "Paste in AI output and you get no timestamp, no author, no history of what changed. It shows up fully formed, with no record of how it got there.",
  },
  {
    icon: FolderX,
    title: "An unvalidated shadow system",
    body: "A chat window is not a controlled system. It's the same raw-data-integrity failure mode as a shared login or an uncontrolled spreadsheet.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [faqEmail, setFaqEmail] = useState("");
  const [faqMessage, setFaqMessage] = useState("");
  const [faqCopied, setFaqCopied] = useState(false);

  const handleCopyConnector = () => {
    copyConnectorUrl(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // No backend is deployed yet, so nothing is POSTed anywhere. The primary
  // path copies the composed message for the visitor to paste into any mail
  // client; the mailto link is the secondary path. Neither clears the form,
  // so the composed message stays visible.
  const faqMailto = `mailto:ryan@sci-arch.ca?subject=${encodeURIComponent(
    "Question from sci-arch.ca"
  )}&body=${encodeURIComponent(`From: ${faqEmail}\n\n${faqMessage}`)}`;

  const copyFaqMessage = async () => {
    try {
      await navigator.clipboard.writeText(
        `To: ryan@sci-arch.ca\nFrom: ${faqEmail}\n\n${faqMessage}`
      );
      setFaqCopied(true);
      setTimeout(() => setFaqCopied(false), 2200);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the mailto
      // link below remains as the fallback path.
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="sci-arch: make your lab's AI work defensible"
        description="An electronic lab notebook that makes AI-assisted work defensible: every action, human or AI, lands signed, versioned, and audit-ready. Part 11-aligned. freeLN is free and runs in your browser."
        event="landing_view"
      />
      <Nav />

      {/* HERO */}
      <section
        id="top"
        data-testid={LANDING.hero}
        className="relative scroll-mt-14 border-b border-border dna-bg dna-bg-strong"
      >
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-12 lg:px-8">
          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow"
            >
              § sci-arch · electronic lab notebook · sci-arch.ca
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Make your lab's AI work
              <br className="hidden sm:block" />
              <span className="italic text-foreground/85"> defensible.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground"
            >
              Let your AI write the lab notes. sci-arch keeps a record that holds up: every action,
              human or AI, lands signed, versioned, and audit-ready. Bring your own Claude, no AI markup.
            </motion.p>
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-5 space-y-2.5"
            >
              <li className="flex items-start gap-2.5 text-base">
                <ShieldCheck className="mt-1 h-4 w-4 flex-none text-foreground" strokeWidth={1.6} />
                <span>
                  <span className="font-medium text-foreground">Audit-ready AI actions</span>{" "}
                  <span className="text-muted-foreground">every AI edit is attributable, versioned, tamper-evident. A human signs; AI never does.</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-base">
                <Bot className="mt-1 h-4 w-4 flex-none text-foreground" strokeWidth={1.6} />
                <span>
                  <span className="font-medium text-foreground">Bring your own AI</span>{" "}
                  <span className="text-muted-foreground">connect Claude via our MCP connector. No AI markup; you own the model.</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5 text-base">
                <Download className="mt-1 h-4 w-4 flex-none text-foreground" strokeWidth={1.6} />
                <span>
                  <span className="font-medium text-foreground">One-click defensible export</span>{" "}
                  <span className="text-muted-foreground">a signed, timestamped record a PI or QA reviewer trusts.</span>
                </span>
              </li>
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="mt-8 flex flex-wrap items-center gap-3"
              data-testid={LANDING.heroCtaPrimary}
            >
              <Button size="lg" onClick={() => navigate("/workspace")}>
                Start writing, free
              </Button>
              <Button
                variant="outline"
                size="lg"
                data-testid={LANDING.heroCtaSecondary}
                onClick={() => navigate("/pricing")}
              >
                Lab manager? Get early access →
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-3 flex items-center gap-2"
            >
              <FreeLnBadge size="sm" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                free · runs in your browser
              </span>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="md:col-span-7"
          >
            <div className="relative">
              <div className="absolute -left-6 top-0 hidden font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground md:block [writing-mode:vertical-rl]">
                fig. 01 · live editor
              </div>
              <ElnHero />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:px-6 lg:px-8">
          <span>Made by a wet-lab scientist</span>
          <span>· Every AI action is signed</span>
          <span>· Bring your own Claude</span>
          <span>· No AI markup</span>
          <span>· A human always signs</span>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="dna-bg border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <div className="eyebrow">§ the problem</div>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              AI is already writing your lab notes.<br className="hidden sm:block" /> The record it
              leaves is indefensible.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            {problemPoints.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="flex flex-col bg-background p-5 sm:p-6">
                  <Icon className="h-5 w-5 text-foreground" strokeWidth={1.4} />
                  <h3 className="mt-5 font-serif text-xl text-foreground">{p.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STUDENT FEATURES */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-14 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">§</span>
              <FreeLnBadge size="sm" />
            </div>
            <h2 className="mt-2 max-w-2xl font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Experiments are already hard.{" "}
              <span className="italic text-foreground/85">Your lab notes shouldn't be.</span>
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Get started now, no account or credit card required.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate("/workspace")}>
            Start writing, free
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {studentFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.id}
                data-testid={f.id}
                className={`group relative flex flex-col p-5 transition-colors sm:p-6 ${
                  f.preview ? "bg-secondary" : "bg-background hover:bg-secondary"
                }`}
              >
                <div className="flex items-start justify-between">
                  <Icon className={`h-5 w-5 ${f.preview ? "text-foreground/60" : "text-foreground"}`} strokeWidth={1.4} />
                  <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                    {f.label}
                  </span>
                </div>
                <h3 className={`mt-5 font-serif text-xl ${f.preview ? "text-foreground/70" : "text-foreground"}`}>
                  {f.title}
                </h3>
                <p className={`mt-2 text-base leading-relaxed ${f.preview ? "text-muted-foreground/85" : "text-muted-foreground"}`}>
                  {f.body}
                </p>
                {f.preview && (
                  <Badge variant="soon" className="mt-4 w-fit gap-1">
                    <Lock className="h-2.5 w-2.5" /> {f.preview}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* WORK WITH CLAUDE */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-12 lg:px-8">
          <div className="md:col-span-6">
            <div className="eyebrow">§ work with claude</div>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Run your notebook from Claude.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Claude can draft a protocol from your last three entries, reformat a reagent table,
              or search six months of notebooks for one result, you review and sign. New to
              working with Claude?{" "}
              <a
                href="mailto:ryan@sci-arch.ca?subject=Show me how to connect Claude"
                className="text-foreground underline underline-offset-4"
              >
                I'll show you how, live
              </a>
              .
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate("/connect")}>
                <Plug className="h-3.5 w-3.5" />
                Add the sci-arch MCP connector to Claude
              </Button>
              <Button variant="outline" size="lg" onClick={handleCopyConnector}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy connector URL"}
              </Button>
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {CONNECTOR_URL}
            </p>
          </div>
          <div className="md:col-span-6">
            <div className="rounded-[2px] border border-border bg-secondary p-5 sm:p-6">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                audit trail · exp-402
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-foreground/85">created entry</span>
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    human · r. ford
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-foreground/85">drafted procedure</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                    <Bot className="h-3 w-3" /> ai-assisted · claude
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-foreground/85">edited reagent table</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                    <Bot className="h-3 w-3" /> ai-assisted · claude
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-foreground/85">signed &amp; locked</span>
                  <span className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.15em] text-success">
                    <PenLine className="h-3 w-3" /> human · r. ford
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <div id="pricing" className="scroll-mt-14">
        <PricingTable />
      </div>

      {/* FAQ */}
      <section id="faq" data-testid={LANDING.faqSection} className="scroll-mt-14 border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-12 lg:px-8">
          <div className="md:col-span-4">
            <div className="eyebrow">§ questions</div>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Frequently asked.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Still curious? Email{" "}
              <a href="mailto:ryan@sci-arch.ca" className="text-foreground underline underline-offset-4">
                ryan@sci-arch.ca
              </a>
              , or ask directly below.
            </p>
            <div className="mt-6 rounded-[2px] border border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  copyFaqMessage();
                }}
                className="space-y-2"
              >
                <Input
                  required
                  type="email"
                  value={faqEmail}
                  onChange={(e) => setFaqEmail(e.target.value)}
                  placeholder="you@lab.edu"
                  className="w-full"
                />
                <Textarea
                  required
                  rows={3}
                  value={faqMessage}
                  onChange={(e) => setFaqMessage(e.target.value)}
                  placeholder="Your question"
                  className="w-full resize-none"
                />
                <Button type="submit" className="w-full">
                  {faqCopied ? "Copied — paste into any email" : "Copy email + message"}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Copies your message addressed to{" "}
                  <span className="font-mono">ryan@sci-arch.ca</span>. Or{" "}
                  <a
                    href={faqMailto}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    open it in your email app
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
          <div className="md:col-span-8">
            <Accordion type="single" collapsible className="border-t border-border">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  data-testid={LANDING.faqItem(i)}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="py-5 text-left font-serif text-lg text-foreground hover:no-underline">
                    <span className="mr-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
