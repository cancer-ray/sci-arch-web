import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

/** Shared layout for legal/info pages. Content is markdown so it's easy to revise. */
export function LegalPage({ eyebrow, title, markdown }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-[65ch]">
          <div className="eyebrow">§ {eyebrow}</div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">{title}</h1>
          <article className="prose-eln mt-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: (props) => (
                  <h2 className="mt-8 border-b border-border pb-1 font-serif text-xl text-foreground" {...props} />
                ),
                h3: (props) => <h3 className="mt-5 font-serif text-lg text-foreground" {...props} />,
                p: (props) => <p className="mt-3 text-sm leading-relaxed text-foreground/85" {...props} />,
                li: (props) => <li className="ml-5 mt-1 list-disc text-sm text-foreground/85" {...props} />,
                strong: (props) => <strong className="font-medium text-foreground" {...props} />,
                em: (props) => <em className="text-foreground/85" {...props} />,
                a: (props) => <a className="text-primary underline underline-offset-2" {...props} />,
                table: (props) => (
                  <table className="my-4 w-full border-collapse font-mono text-xs" {...props} />
                ),
                th: (props) => (
                  <th className="border-b border-border px-2 py-1 text-left font-medium" {...props} />
                ),
                td: (props) => (
                  <td className="border-b border-border/50 px-2 py-1 text-foreground/85" {...props} />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
