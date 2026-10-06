const COMPLETION_MARKER = "<!-- abarva-response-control-completion-v1 -->";

function searchableText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAutomationCommitmentTable(body: string): boolean {
  return searchableText(body).includes(
    "automation productivity commitment table",
  );
}

function hasSubmissionCertification(body: string): boolean {
  const closing = searchableText(body.slice(-1_800));
  return [
    "supplier certification",
    "vendor certification",
    "authorized representative",
    "submit the completed",
    "return the completed",
  ].some((phrase) => closing.includes(phrase));
}

export function completeD11ResponseControlSections(args: {
  artifactCode: string;
  body: string;
}): string {
  if (args.artifactCode !== "d11_response_checklist") return args.body;
  if (args.body.includes(COMPLETION_MARKER)) return args.body;

  const additions: string[] = [COMPLETION_MARKER];
  if (!hasAutomationCommitmentTable(args.body)) {
    additions.push(
      [
        "## Automation / Productivity Commitment Table",
        "",
        "A vendor that claims automation, artificial intelligence, productivity, transformation, or efficiency must complete one row for every proposed commitment. Narrative claims without a corresponding row are not scored as commitments.",
        "",
        "| Required field | Vendor completion rule | Evaluation use |",
        "|---|---|---|",
        "| Commitment ID | Provide a unique, stable identifier used in the proposal, pricing response, implementation plan, and proposed contract schedule. | Preserves the claim through evaluation, clarification, negotiation, and contracting. |",
        "| Claim type and affected service | Select automation, productivity, transformation, or efficiency and identify the affected requirement, service tower, process, and system population. | Prevents broad claims from being scored outside the stated scope. |",
        "| Baseline and measurement source | State the current baseline, measurement period, source system, data owner, and calculation method. | Establishes whether the claimed improvement can be independently measured. |",
        "| Committed outcome and date | State the numeric outcome, delivery date, ramp profile, dependencies, and acceptance evidence. | Separates a contractual commitment from a roadmap aspiration. |",
        "| Commercial treatment | State the price reduction, credit, gainshare, fee at risk, or other contractual remedy if the commitment is achieved late or not achieved. | Connects the operational claim to enforceable economics. |",
        "| Evidence reference | Identify the supporting case study, calculation, tool output, or delivery evidence and the workbook location where it can be reviewed. | Allows evaluators to test support before assigning weight. |",
      ].join("\n"),
    );
  }

  if (!hasSubmissionCertification(args.body)) {
    additions.push(
      [
        "## Submission Certification",
        "",
        "The vendor must return the completed controlled workbook with its proposal. An authorized representative must certify that required fields are complete, assumptions and exceptions are disclosed, referenced evidence is available for review, and every stated commercial commitment can be incorporated into the proposed contract.",
        "",
        "The certification must identify the authorized representative, title, submission date, workbook version, proposal-validity period, and any approved clarification reference. An incomplete certification is treated as a response-completeness exception.",
      ].join("\n"),
    );
  }

  return [args.body.trim(), ...additions].join("\n\n");
}
