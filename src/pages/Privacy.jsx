import { LegalPage } from "@/components/LegalPage";
import { PRIVACY_MD } from "@/lib/legal/privacy.md";

export default function Privacy() {
  return <LegalPage eyebrow="privacy" title="Privacy policy." markdown={PRIVACY_MD} />;
}
