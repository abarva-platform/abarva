// Shared client-facing cleanup for generated Move artifacts. The model may echo
// internal implementation words from prompt/context instructions; those should
// never be what causes a sponsor-facing artifact to fail once the evidence and
// exhibits are otherwise correct.

const CLIENT_ARTIFACT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bsource rows\b/gi, "evidence details"],
  [/\bsource row\b/gi, "evidence detail"],
  [/\braw route\b/gi, "internal path"],
  [/\bblob path\b/gi, "stored artifact location"],
  [/\btenant key\b/gi, "client workspace"],
  [/\bmodel call\b/gi, "generation step"],
  [/\bimplementation detail\b/gi, "delivery detail"],
  [/\bcanonical internal id\b/gi, "internal reference"],
  [/\bdebug\b/gi, "diagnostic"],
  [/\bprompt[-\s]+injection\b/gi, "adversarial input attack"],
  [/\bprompt(?:s|ed|ing|[-\s]+(?:engineering|policy|policies|template|templates|instruction|instructions))?\b/gi, "request"],
];

export function sanitizeClientFacingArtifactHtml(html: string): string {
  return CLIENT_ARTIFACT_REPLACEMENTS.reduce(
    (cleaned, [pattern, replacement]) => cleaned.replace(pattern, replacement),
    html,
  );
}
