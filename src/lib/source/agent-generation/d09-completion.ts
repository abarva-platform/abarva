import type { SourceGenerationContext } from "./types";

const COMPLETION_MARKER = "<!-- abarva-d09-vendor-completion-v2 -->";
const WORKBOOK_HEADING = "## Appendix A · Vendor Response Workbook Tab Guide";

export function completeD09RfpGovernanceSections(args: {
  artifactCode: string;
  body: string;
  ctx: SourceGenerationContext;
}): string {
  if (args.artifactCode !== "d09_rfp_pack") return args.body;
  const draft = ensureD09VendorOpening(sanitizeD09ClientFacingNames(args.body));

  const body = draft
    .replaceAll(COMPLETION_MARKER, "")
    .replace(/\n*RFP package draft complete — pending client closure of registered gaps\.\s*$/u, "")
    .trim();
  return body.includes(WORKBOOK_HEADING)
    ? body
    : [body, vendorWorkbookInstructions()].join("\n\n");
}

function ensureD09VendorOpening(body: string): string {
  const opening = body.slice(0, 1_200).toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const hasPurpose = ["request for proposal", "invitation to bid", "purpose and scope", "scope of services"]
    .some((phrase) => opening.includes(phrase));
  const hasResponseDirection = ["response instruction", "submission instruction", "vendor response", "supplier response", "proposal response"]
    .some((phrase) => opening.includes(phrase));
  if (hasPurpose && hasResponseDirection) return body;

  const preface = [
    "## Solicitation purpose and scope",
    "",
    "This request for proposal invites qualified service providers to respond to the service requirements stated in this draft.",
    "",
    "Vendors must complete the Vendor Response Workbook and submit a proposal response against every mandatory requirement, pricing field, SLA, staffing commitment, transition obligation, assumption, exception, and evidence pointer.",
  ].join("\n");
  const lines = body.split("\n");
  if ((lines[0]?.trim() ?? "").startsWith("# ")) {
    return [lines[0], "", preface, "", ...lines.slice(1)].join("\n");
  }
  return [preface, "", body].join("\n");
}

export function sanitizeD09ClientFacingNames(body: string): string {
  return body
    .replace(/\bNorthwind\s+IT\b/giu, "Incumbent Provider A")
    .replace(/\bNorthwind\b/giu, "Incumbent Provider A")
    .replace(/\bApex\s+Digital\b/giu, "Incumbent Provider B");
}

function vendorWorkbookInstructions(): string {
  return [
    WORKBOOK_HEADING,
    "",
    "Vendors must complete one Vendor Response Workbook. Narrative files may supplement workbook answers, but they do not replace required workbook tabs or fields.",
    "",
    "| Workbook tab | Vendor must complete |",
    "|---|---|",
    "| Guide | Read completion rules, editable-field rules, evidence-pointer format, and submission instructions. |",
    "| Mandatory Compliance | Confirm every mandatory requirement with a disposition and evidence pointer. |",
    "| Requirement Response Matrix | Preserve each issued requirement ID and category with a normalized response. |",
    "| Vendor Claim Register | Enter automation, productivity, SLA, transition, security, staffing, risk-reduction, and cost-reduction claims with evidence and commitments. |",
    "| Solution Approach | Describe the proposed service model, governance, tooling, and tower approach. |",
    "| Pricing Response | Separate recurring run, one-time transition, optional service, change, pass-through, and credits; state volume and coverage assumptions. |",
    "| Staffing and Location | Provide role, tower, location, FTE, rate, coverage window, and subcontractor dependency. |",
    "| SLA Commitments | State proposed target, measurement period, credit formula, cap, cure window, and exclusions. |",
    "| Transition Plan | Provide phase, activity, owner, client dependency, exit criteria, rollback, and milestone linkage. |",
    "| Assumptions and Exclusions | List every scope, pricing, staffing, tooling, security, transition, and third-party assumption or exception. |",
    "| Commercial Exceptions | Record proposed alternatives and their price or delivery impact. |",
    "| Evidence Checklist | Point to the file, tab, row, page, exhibit, certificate, or reference supporting each material claim. |",
  ].join("\n");
}
