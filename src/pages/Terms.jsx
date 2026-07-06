import { LegalPage } from "@/components/LegalPage";
import { TERMS_MD } from "@/lib/legal/terms.md";

export default function Terms() {
  return <LegalPage eyebrow="terms" title="Terms of service." markdown={TERMS_MD} />;
}
