// The sci-arch MCP connector — a single source of truth so the landing page
// and /connect page never drift on the URL.
export const CONNECTOR_URL = "https://mcp.sci-arch.ca";

/** Copy the connector URL and call onCopied() (e.g. to flash a "Copied!" state). */
export function copyConnectorUrl(onCopied) {
  navigator.clipboard?.writeText(CONNECTOR_URL);
  onCopied?.();
}
