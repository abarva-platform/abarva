import type { AcceptedEventCandidate } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";

export function buildCandidatePanelShortlistDraft(
  candidates: readonly AcceptedEventCandidate[],
): string {
  if (
    candidates.length === 0 ||
    candidates.some((candidate) =>
      [
        candidate.authorityId,
        candidate.supplierId,
        candidate.legalName,
        candidate.acceptedByName,
        candidate.acceptedAt,
        candidate.acceptanceRationale,
        candidate.evidenceReference,
      ].some((value) => !value?.trim()) ||
      Number.isNaN(Date.parse(candidate.acceptedAt)))
  ) {
    throw new Error("An accepted candidate is missing event authority or identity evidence.");
  }

  const cell = (value: string): string =>
    value
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\\/g, "\\\\")
      .replace(/\|/g, "\\|")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const rows = [...candidates]
    .sort((a, b) =>
      a.legalName.localeCompare(b.legalName) ||
      a.supplierId.localeCompare(b.supplierId))
    .map((candidate) =>
      `| ${cell(candidate.legalName)} | ${cell(candidate.supplierId)} | ${cell(candidate.authorityId)} | ${cell(candidate.acceptanceRationale)} | ${cell(candidate.evidenceReference)} | ${cell(candidate.acceptedByName)} | ${cell(candidate.acceptedAt)} | Candidate only |`)
    .join("\n");

  return [
    "# Vendor Shortlist",
    "",
    "> DRAFT - INTERNAL REVIEW ONLY. Candidate-panel acceptance is not respondent selection or approval to invite.",
    "",
    "## §1 · Shortlist answer",
    "No vendor is approved for invitation. The event has accepted candidate-panel records for procurement review; a reviewed shortlist decision is still required.",
    "",
    "## §2 · Approved vendor list",
    "No vendor is approved for invitation. These are the event-accepted candidates, not an issued recipient list.",
    "",
    "| Legal entity | Canonical supplier ID | Event acceptance ID | Panel acceptance rationale | Acceptance evidence | Accepted by | Accepted at | Invitation status |",
    "|---|---|---|---|---|---|---|---|",
    rows,
    "",
    "## §3 · Excluded / not-invited vendor rationale",
    "No exclusion decision is recorded by this candidate-panel read. Do not infer that other suppliers were evaluated or disqualified.",
    "",
    "## §4 · Coverage, commercial, and risk fit",
    "Not established by candidate-panel acceptance. Review each candidate against the approved RFP requirements, qualification evidence, conflicts, and risk controls before recording a shortlist decision.",
    "",
    "## §5 · Conditions before release to vendors",
    "Respondent selection, NDA coverage, legal terms, and release approval remain separate decisions. Do not contact or issue a package to any candidate based on this draft.",
    "",
    "## §6 · Approval owner and audit trail",
    "Shortlist approver: not recorded. The event acceptance IDs and evidence references in §2 identify the source of the candidate panel only; they do not evidence an approved invitation decision.",
  ].join("\n");
}
