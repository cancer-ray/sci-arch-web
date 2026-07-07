import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { FileText, Download, Loader2, CloudOff } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { mdComponents } from "@/lib/markdown";
import { Button } from "@/components/ui/button";

const BACKEND_DOWN_MSG = "sci-arch+ backend isn't available yet — you're on the list.";

function BackendInterstitial() {
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <CloudOff className="h-5 w-5 text-muted-foreground" strokeWidth={1.4} />
      <div className="eyebrow">sci-arch+</div>
      <h2 className="font-serif text-xl text-foreground">Backend isn&apos;t available yet.</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The sci-arch+ backend isn&apos;t available yet — you&apos;re on the list. The validation
        report and SOPs will appear here the moment it comes online.
      </p>
    </div>
  );
}

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

export default function Compliance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [docLoading, setDocLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/compliance")
      .then(({ data }) => {
        setBackendDown(false);
        setDocs(data.docs);
        if (data.docs.length) setSelectedId(data.docs[0].id);
        else setDocLoading(false);
      })
      .catch(() => {
        setBackendDown(true);
        setDocLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedId) return;
    setDocLoading(true);
    api
      .get(`/compliance/${encodeURIComponent(selectedId)}`)
      .then(({ data }) => {
        setMarkdown(data.markdown);
        setDocLoading(false);
      })
      .catch(() => {
        setBackendDown(true);
        setDocLoading(false);
      });
  }, [selectedId]);

  const downloadCurrent = useCallback(() => {
    if (selectedId && markdown) download(`${selectedId}.md`, markdown);
  }, [selectedId, markdown]);

  const downloadAll = useCallback(async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/compliance/export");
      download("sci-arch-compliance.md", data);
    } catch {
      toast.error(BACKEND_DOWN_MSG);
    } finally {
      setExporting(false);
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
      <main className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="eyebrow">§ compliance &amp; validation</div>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
              Validation report &amp; SOPs.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              The documentation layer for Part 11 alignment: a self-proving validation report
              (live audit-chain check, record counts, version) plus the standard operating
              procedures behind it.
            </p>
          </div>
          <Button variant="outline" onClick={downloadAll} disabled={exporting || backendDown}>
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Download all (.md)"}
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <nav className="col-span-12 sm:col-span-3">
            <div className="eyebrow">documents</div>
            <ul className="mt-3 space-y-1">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={`flex w-full items-center gap-1.5 truncate rounded-[2px] px-2 py-1.5 text-left text-xs transition-colors ${
                      d.id === selectedId
                        ? "bg-primary/10 text-primary"
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
              <Button variant="outline" size="sm" onClick={downloadCurrent} disabled={docLoading || backendDown}>
                <Download className="h-3 w-3" /> download .md
              </Button>
            </div>
            <div className="rounded-[2px] border border-border p-6 sm:p-8">
              {backendDown ? (
                <BackendInterstitial />
              ) : docLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <article className="prose-eln">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents({})}>
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
