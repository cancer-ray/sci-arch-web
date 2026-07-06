import { Link } from "react-router-dom";
import { LogoMark, Wordmark } from "@/components/Logo";
import { LANDING } from "@/constants/testIds";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      data-testid={LANDING.footer}
      className="mt-24 border-t border-border"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-foreground">
            <LogoMark size={20} />
            <Wordmark />
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Part 11-aligned electronic lab notebook, built by a wet-lab scientist. Own your data.
            Markdown-native.
          </p>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Product
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-foreground/80 hover:text-foreground" to="/#features">Features</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/workspace">Workspace</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/pricing">Pricing</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/#faq">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            freeLN
          </p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li>Write, save &amp; import .md</li>
            <li>No account, nothing uploaded</li>
            <li>Full-text search</li>
            <li>Light / dark themes</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Contact
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a className="text-foreground/80 hover:text-foreground" href="mailto:ryan@sci-arch.ca">
                ryan@sci-arch.ca
              </a>
            </li>
            <li className="text-foreground/80">sci-arch.ca</li>
          </ul>
          <p className="mb-3 mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Legal
          </p>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-foreground/80 hover:text-foreground" to="/privacy">Privacy</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/terms">Terms</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/about">About</Link></li>
            <li><Link className="text-foreground/80 hover:text-foreground" to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          <p className="max-w-2xl leading-relaxed">
            sci-arch stores account and notebook data to run the sci-arch+ service. For
            freeLN, we do not keep any of your scientific data. See our{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span>© {year} sci-arch</span>
            <span className="font-mono uppercase tracking-[0.2em]">v0.2 preview</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
