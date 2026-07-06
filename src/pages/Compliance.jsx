import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Download, Loader2 } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const mdComponents = {
  h1: (props) => <h1 className="mt-2 font-serif text-2xl text-foreground" {...props} />,
  h2: (props) => (
    <h2 className="mt-6 border-b border-border pb-1 font-serif text-lg text-foreground" {...props} />
  ),
  h3: (props) => <h3 className="mt-5 font-serif text-base text-foreground" {...props} />,
  p: (props) => <p className="mt-3 text-sm leading-relaxed text-foreground/85" {...props} />,
  li: (props) => <li className="ml-5 mt-1 list-disc text-sm text-foreground/85" {...props} />,
  strong: (props) => <strong className="font-medium text-foreground" {...props} />,
  table: (props) => <table className="my-4 w-full border-collapse font-mono text-[11px]" {...props} />,
  th: (props) => <th className="border-b border-border px-2 py-1 text-left font-medium" {...props} />,
  td: (props) => <td className="border-b border-border/50 px-2 py-1 text-foreground/85" {...props} />,
};

function download(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function saveBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Compliance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [docLoading, setDocLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    api.get("/compliance").then(({ data }) => {
      setDocs(data.docs);
      if (data.docs.length) setSelectedId(data.docs[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedId) return;
    setDocLoading(true);
    api.get(`/compliance/${encodeURIComponent(selectedId)}`).then(({ data }) => {
      setMarkdown(data.markdown);
      setDocLoading(false);
    });
  }, [selectedId]);

  const downloadCurrent = useCallback(() => {
    if (selectedId && markdown) download(`${selectedId}.md`, markdown);
  }, [selectedId, markdown]);

  const exportAll = useCallback(async (format) => {
    setExporting(format);
    setExportError("");
    try {
      const binary = format === "pdf" || format === "zip";
      const { data } = await api.get(
        `/compliance/export?format=${format}`,
        binary ? { responseType: "blob" } : {}
      );
      const mime =
        format === "pdf"
          ? "application/pdf"
          : format === "zip"
          ? "application/zip"
          : format === "html"
          ? "text/html;charset=utf-8"
          : "text/markdown;charset=utf-8";
      const blob = binary ? data : new Blob([data], { type: mime });
      saveBlob(`sci-arch-compliance.${format}`, blob);
    } catch (err) {
      if (format === "pdf" && err?.response?.status === 501) {
        setExportError("PDF export is not enabled on this server yet. Use .md or .zip.");
      } else {
        setExportError("Export failed. Please try again.");
      }
    } finally {
      setExporting(null);
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              § compliance &amp; validation
            </div>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
              Validation report &amp; SOPs.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              The documentation layer for Part 11 alignment: a self-proving validation report
              (live audit-chain check, record counts, version) plus the standard operating
              procedures behind it.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                export package
              </span>
              {["md", "pdf", "zip"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => exportAll(fmt)}
                  disabled={!!exporting}
                  className="btn-lift inline-flex h-9 items-center gap-1.5 border border-border px-3 text-sm text-foreground hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting === fmt ? "…" : `.${fmt}`}
                </button>
              ))}
            </div>
            {exportError && <p className="text-[11px] text-red-600">{exportError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <nav className="col-span-12 sm:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              documents
            </div>
            <ul className="mt-3 space-y-1">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={`flex w-full items-center gap-1.5 truncate px-2 py-1.5 text-left text-xs transition-colors ${
                      d.id === selectedId
                        ? "bg-foreground text-background"
                        : "text-foreground/75 hover:bg-secondary"
                    }`}
                  >
                    <FileText className="h-3 w-3 flex-none" />
                    <span className="truncate">{d.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-12 sm:col-span-9">
            <div className="mb-3 flex justify-end">
              <button
                onClick={downloadCurrent}
                disabled={docLoading}
                className="btn-lift inline-flex items-center gap-1 border border-border px-2 py-1 text-xs text-foreground hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors"
              >
                <Download className="h-3 w-3" /> download .md
              </button>
            </div>
            <div className="border border-border p-8">
              {docLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <article className="prose-eln">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {markdown}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
