// Shared client-facing cleanup for generated Move artifacts. The model may echo
// internal implementation words from prompt/context instructions; those should
// never be what causes a sponsor-facing artifact to fail once the evidence and
// exhibits are otherwise correct.

const CLIENT_ARTIFACT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\[CLIENT TO COMPLETE:\s*([^\]]+)\]/gi, "Client input required: $1"],
  [/\bCLIENT TO COMPLETE:\s*/gi, "Client input required: "],
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
  [/\bP2\s+(?:discovery|discover(?:y)?|discover\s*&\s*diagnose)\b/gi, "discovery"],
  [/\bP3\s+(?:design|draft shaping|option(?:s)?|future-state design)\b/gi, "design"],
  [/\bP4\s+(?:roadmap|business case|planning)\b/gi, "roadmap and business-case planning"],
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
  [/\bprompt[-\s]+injection\b/gi, "adversarial input attack"],
  [/\bprompt(?:s|ed|ing|[-\s]+(?:engineering|policy|policies|template|templates|instruction|instructions))?\b/gi, "request"],
];

export function sanitizeClientFacingArtifactHtml(html: string): string {
  return CLIENT_ARTIFACT_REPLACEMENTS.reduce(
    (cleaned, [pattern, replacement]) => cleaned.replace(pattern, replacement),
    html,
  );
}
