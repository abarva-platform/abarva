// Shared client-facing cleanup for generated Move artifacts. The model may echo
// internal implementation words from prompt/context instructions; those should
// never be what causes a sponsor-facing artifact to fail once the evidence and
// exhibits are otherwise correct.

const CLIENT_ARTIFACT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\[CLIENT TO COMPLETE:\s*([^\]]+)\]/gi, "Client input required: $1"],
  [/\bCLIENT TO COMPLETE:\s*/gi, "Client input required: "],
  [/\bClient[-\s]to[-\s]Complete Checklist\b/gi, "Client Input Checklist"],
  [/\bclient[-\s]to[-\s]complete\b/gi, "client input"],
  [/\bis\s+TBC\b/gi, "requires confirmation"],
  [/\bis\s+to be confirmed\b/gi, "requires confirmation"],
  [/\bTBC\b/gi, "requires confirmation"],
  [/\bto be confirmed\b/gi, "requires confirmation"],
  [/<strong>P([1-5])<\/strong>(\s*[—-])/gi, "<strong>Priority $1</strong>$2"],
  [/<b>P([1-5])<\/b>(\s*[—-])/gi, "<b>Priority $1</b>$2"],
  [/\*\*P([1-5])\*\*(\s*[—-])/g, "**Priority $1**$2"],
  [
    /\bP([1-5])\s+([A-Z][A-Za-z&/ ,.-]{2,90}?)(\s*\(open input\b)/g,
    "Priority $1 owner: $2$3",
  ],
  [/\bP([1-5])\s+inputs\b/gi, "Priority $1 inputs"],
  [/\bP([1-5])\s+input\b/gi, "Priority $1 input"],
  [/\bP0\s+origination\b/gi, "origination"],
  [/\bP1\s+charter\b/gi, "charter"],
  [
    /\bP2\s+(?:discovery|discover(?:y)?|discover\s*&\s*diagnose)\b/gi,
    "discovery",
  ],
  [
    /\bP3\s+(?:design|draft shaping|option(?:s)?|future-state design)\b/gi,
    "design",
  ],
  [
    /\bP4\s+(?:roadmap|business case|planning)\b/gi,
    "roadmap and business-case planning",
  ],
  [/\bP5\s+(?:handoff|execute|execution)\b/gi, "handoff"],
  [/\bsource rows\b/gi, "evidence details"],
  [/\bsource row\b/gi, "evidence detail"],
  [/\braw route\b/gi, "internal path"],
  [/\bblob path\b/gi, "stored artifact location"],
  [/\btenant key\b/gi, "client workspace"],
  [/\bmodel call\b/gi, "generation step"],
  [/\bimplementation detail\b/gi, "delivery detail"],
  [/\bcanonical internal id\b/gi, "internal reference"],
  [/\bdebug\b/gi, "diagnostic"],
  [/\bsubstrate\b/gi, "enterprise data foundation"],
  [/\bcontext rows\b/gi, "evidence records"],
  [/\btower rows\b/gi, "measurement records"],
  [/\bquality score\b/gi, "evidence readiness rating"],
  [
    /\bdata plane evidence\b/gi,
    "evidence from the client evidence environment",
  ],
  [/\bdata plane\b/gi, "client evidence environment"],
  [/\bprompt[-\s]+injection\b/gi, "adversarial input attack"],
  [
    /\bprompt(?:s|ed|ing|[-\s]+(?:engineering|policy|policies|template|templates|instruction|instructions))?\b/gi,
    "request",
  ],
  // Keep the formal appendix heading intact, but remove implementation-facing
  // "Source Register" references from narrative prose before the quality scan.
  [/\bevidence appendix\s*\(\s*Source Register\s*\)/gi, "evidence appendix"],
  [/\btied to (?:the )?Source Register\b/gi, "tied to cited evidence"],
  [/\bSource Register\b/gi, "evidence appendix"],
  [
    /\benterprise_context(?:_chunks|_records|_facts|_sources)?\b/gi,
    "enterprise evidence",
  ],
  // Internal identifier leak guard (roadmap governed-artifact-sync review): a
  // raw DB user/actor UUID must never appear in a client-facing artifact.
  // Redact UUIDs that follow an approver/actor/user label in VISIBLE TEXT only
  // — deliberately anchored to the label so element ids, data-* attributes and
  // URL path segments (which also contain UUIDs) are never touched.
  [
    /\b(approv(?:er|ed)(?:\s+by)?|actor|user|reviewer|owner|assigned to|approver id)\b(\s*(?:id|by)?\s*[:=]?\s*)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "$1$2(audit reference on file)",
  ],
];

const PHASE_LABELS: Record<string, string> = {
  P0: "origination",
  P1: "charter",
  P2: "discovery",
  P3: "design",
  P4: "roadmap planning",
  P5: "handoff",
};

const BARE_UUID_RE =
  /(^|[^A-Za-z0-9_/-])([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?![A-Za-z0-9_/-])/gi;

function applyClientArtifactReplacements(value: string): string {
  return CLIENT_ARTIFACT_REPLACEMENTS.reduce(
    (cleaned, [pattern, replacement]) => cleaned.replace(pattern, replacement),
    value,
  );
}

export function sanitizeClientFacingArtifactHtml(html: string): string {
  const protectedHeadings: string[] = [];
  const withProtectedHeadings = html.replace(
    /<h([1-6])\b[^>]*>[^<]*\bSource Register\b[^<]*<\/h\1>/gi,
    (heading) => {
      const token = `__ABARVA_SOURCE_REGISTER_HEADING_${protectedHeadings.length}__`;
      protectedHeadings.push(heading);
      return token;
    },
  );
  const cleaned = applyClientArtifactReplacements(withProtectedHeadings);
  const phaseCleaned = cleaned.replace(
    /(?<![A-Za-z0-9_-])P([0-5])(?![A-Za-z0-9_])/g,
    (phase) => PHASE_LABELS[phase] ?? phase,
  );
  return protectedHeadings.reduce(
    (restored, heading, index) =>
      restored.replace(`__ABARVA_SOURCE_REGISTER_HEADING_${index}__`, heading),
    phaseCleaned,
  );
}

export function sanitizeClientFacingArtifactMarkdown(markdown: string): string {
  const cleaned = applyClientArtifactReplacements(markdown);
  const phaseCleaned = cleaned.replace(
    /(?<![A-Za-z0-9_-])P([0-5])(?![A-Za-z0-9_])/g,
    (phase) => PHASE_LABELS[phase] ?? phase,
  );
  return phaseCleaned.replace(
    BARE_UUID_RE,
    (_match, prefix: string) => `${prefix}(internal reference on file)`,
  );
}
