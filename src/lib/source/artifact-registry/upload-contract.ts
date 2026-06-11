import type { SourceStageKey } from "../types";
import type { SourceArtifactFamily, SourceArtifactFormat } from "./types";

export function sourceArtifactFormatFromMime(
  mimeType: string,
): SourceArtifactFormat {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx";
    case "text/markdown":
      return "markdown";
    case "text/html":
      return "html";
    case "text/csv":
      return "csv";
    case "text/plain":
      return "txt";
    case "image/png":
    case "image/jpeg":
      return "image";
    case "audio/mpeg":
    case "audio/mp4":
      return "audio";
    case "video/mp4":
      return "video";
    default:
      return "unknown";
  }
}

export function inferSourceArtifactFamily(args: {
  stageKey: SourceStageKey;
  filename: string;
  requestedFamily?: string | null;
}): SourceArtifactFamily {
  if (isSourceArtifactFamily(args.requestedFamily)) return args.requestedFamily;

  const name = args.filename.toLowerCase();
  if (name.includes("bafo")) return "bafo";
  if (name.includes("rfp")) return "rfp";
  if (name.includes("rfi")) return "rfi";
  if (name.includes("scorecard") || name.includes("evaluation"))
    return "scorecard";
  // 'rate' must be word-bounded: bare includes('rate') matched st-RATE-gy and
  // sent every "strategy" file to pricing_workbook (audit F2 follow-on).
  if (
    name.includes("pricing") ||
    /\brate\b|rate[ _-]?card/.test(name) ||
    name.includes("commercial")
  ) {
    return "pricing_workbook";
  }
  if (
    name.includes("meeting") ||
    name.includes("minutes") ||
    name.includes("notes")
  ) {
    return "meeting_notes";
  }
  if (name.includes("workshop")) return "workshop_output";
  if (
    name.includes("value") ||
    name.includes("kpi") ||
    name.includes("realization") ||
    name.includes("realisation")
  ) {
    return "value_ledger";
  }
  if (name.includes("strategy")) return "sourcing_strategy";
  if (name.includes("scope")) return "scope_document";
  if (name.includes("transition") || name.includes("risk"))
    return "transition_risk_register";

  // Raw client evidence (contracts, inventories, telemetry, org/financial data)
  // is NOT a stage deliverable. Falling through to the stage default would tag
  // e.g. an incumbent-contract CSV as 'sourcing_strategy' and falsely satisfy
  // the ART-* artifact-presence gate criterion for that family — a governance
  // bug (audit F2, 2026-06-11). Tag it 'other'; the evidence-readiness sync
  // (canvas-substrate/upload-sync) routes it to the right evidence requirement.
  if (
    /(contract|incumbent|msa|sow|renewal|agreement)/.test(name) ||
    /(inventory|cmdb|portfolio)/.test(name) ||
    /(sponsor|commitment|governance|mandate)/.test(name) ||
    /(incident|ticket|volume|itsm|telemetry|servicenow)/.test(name) ||
    /(roster|headcount|workforce|staffing)/.test(name) ||
    /(budget|spend|run[ _-]?cost|gl[ _-]?export)/.test(name)
  ) {
    return "other";
  }

  switch (args.stageKey) {
    case "strategy":
    case "intake":
    case "sourcing_strategy":
      return "sourcing_strategy";
    case "rfp":
    case "rfp_rfi_package":
      return "rfp";
    case "responses":
    case "vendor_responses":
      return "proposal";
    case "pricing":
      return "pricing_workbook";
    case "bafo":
    case "orals_bafo":
      return "bafo";
    case "executive_decision":
    case "selection":
      return "decision_brief";
    case "transition":
    case "contract_mobilization":
      return "transition_risk_register";
    case "scope":
      return "scope_document";
    case "value":
    case "value_realization":
      return "value_ledger";
    default:
      return "other";
  }
}

function isSourceArtifactFamily(
  value: string | null | undefined,
): value is SourceArtifactFamily {
  return (
    value === "rfi" ||
    value === "rfp" ||
    value === "bafo" ||
    value === "scorecard" ||
    value === "pricing_workbook" ||
    value === "proposal" ||
    value === "meeting_notes" ||
    value === "workshop_output" ||
    value === "decision_brief" ||
    value === "transition_risk_register" ||
    value === "value_ledger" ||
    value === "sourcing_strategy" ||
    value === "scope_document" ||
    value === "other"
  );
}
