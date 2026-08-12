/**
 * One upload-package policy for the Responses stage.
 *
 * The Responses stage renders the requirement in two places: the package
 * cockpit strip (what a buyer must ask vendors for) and the file-readiness
 * ledger (what is actually loaded, per vendor). They previously carried
 * separate hand-maintained lists, so the same file family could read
 * "Required" in one panel and "Conditional" in the other on the same screen.
 * Both now derive from this module, so the requirement and the label can only
 * drift if this file changes.
 */

export type VendorResponseFileRequirement =
  | "Required"
  | "Conditional"
  | "Optional";

export interface VendorResponseFileFamily {
  key: string;
  /** Label used everywhere on the Responses stage. */
  label: string;
  requirement: VendorResponseFileRequirement;
  /** Where the content is expected to come from. */
  sourceSystem: string;
  ownerRole: string;
  formats: string;
  /** Short description for the compact cockpit strip. */
  shortDetail: string;
}

export const VENDOR_RESPONSE_FILE_FAMILIES: readonly VendorResponseFileFamily[] =
  [
    {
      key: "main_proposal",
      label: "Main proposal package",
      requirement: "Required",
      sourceSystem: "Vendor response pack",
      ownerRole: "Vendor response lead",
      formats: "PDF or DOCX",
      shortDetail: "PDF or DOCX response narrative",
    },
    {
      key: "pricing_template",
      label: "Pricing workbook",
      requirement: "Required",
      sourceSystem: "Commercial workbook",
      ownerRole: "Commercial lead",
      formats: "XLSX, CSV",
      shortDetail: "XLSX or CSV with units and volumes",
    },
    {
      key: "sla_response",
      label: "SLA commitments",
      requirement: "Conditional",
      sourceSystem: "Main proposal or SLA exhibit",
      ownerRole: "Service owner",
      formats: "PDF, DOCX, XLSX",
      shortDetail: "Service levels, credits, remedies",
    },
    {
      key: "staffing_model",
      label: "Staffing and location model",
      requirement: "Conditional",
      sourceSystem: "Main proposal or delivery exhibit",
      ownerRole: "Delivery lead",
      formats: "PDF, DOCX, XLSX",
      shortDetail: "Roles, locations, coverage model",
    },
    {
      key: "transition_plan",
      label: "Transition plan",
      requirement: "Conditional",
      sourceSystem: "Main proposal or transition exhibit",
      ownerRole: "Transition lead",
      formats: "PDF, DOCX, XLSX",
      shortDetail: "Timeline, dependencies, cutover risk",
    },
    {
      key: "exceptions",
      label: "Exceptions and assumptions",
      requirement: "Conditional",
      sourceSystem: "Redlines or Q&A log",
      ownerRole: "Legal/procurement",
      formats: "DOCX, XLSX, PDF",
      shortDetail: "Assumptions, exclusions, redlines",
    },
    {
      key: "proof_exhibits",
      label: "Proof exhibits",
      requirement: "Optional",
      sourceSystem: "Reference artifacts",
      ownerRole: "Vendor SMEs",
      formats: "PDF, DOCX, XLSX, CSV",
      shortDetail: "Case studies, security, automation proof",
    },
  ];

/** Files that must exist per vendor before parser-backed scoring can start. */
export const VENDOR_RESPONSE_REQUIRED_FILE_COUNT =
  VENDOR_RESPONSE_FILE_FAMILIES.filter(
    (family) => family.requirement === "Required",
  ).length;

export const VENDOR_RESPONSE_ACCEPTED_FORMATS = "PDF, DOCX, XLSX, CSV";
