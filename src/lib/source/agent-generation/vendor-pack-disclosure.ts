import type { SourceArtifactQualityGateMetadata } from "./quality-review";

export type D09VendorDisclosureCode =
  | "buyer_value_target"
  | "internal_workflow_metadata"
  | "internal_negotiation_material"
  | "unapproved_evaluation"
  | "unverified_timeline"
  | "internal_release_control";

export interface D09VendorDisclosureViolation {
  code: D09VendorDisclosureCode;
}

const BUYER_VALUE_TARGET = [
  /\b\d{1,3}(?:\.\d+)?\s*(?:[-–—]|to)\s*\d{1,3}(?:\.\d+)?\s*%[^\n.!?]{0,100}\b(?:savings?|run[-\s]?rate improvement|value target|planning hypothesis)\b/i,
  /\b(?:savings?|run[-\s]?rate improvement|value target|planning hypothesis)[^\n.!?]{0,100}\b\d{1,3}(?:\.\d+)?\s*(?:[-–—]|to)\s*\d{1,3}(?:\.\d+)?\s*%/i,
  /\b(?:buyer|client|internal)\s+(?:savings?|value|improvement)\s+target[^\n.!?]{0,80}\b\d{1,3}(?:\.\d+)?\s*%/i,
];

const INTERNAL_WORKFLOW_METADATA = [
  /\bapproval_granted\s*=\s*(?:true|false)\b/i,
  /\bLOW\s*\/\s*UNVALIDATED\b/i,
  /\b(?:synthetic|internal)\s+(?:workflow[-\s]?test|QA)\s+package\b/i,
];

const INTERNAL_NEGOTIATION_MATERIAL = [
  /\binternal\s+(?:review\s+and\s+)?negotiation\s+workbook\b/i,
  /\b(?:directional\s+commercial\s+leverage|buyer\s+negotiation\s+check)\b/i,
];

const UNAPPROVED_EVALUATION = [
  /\b(?:weights?|scoring|shortlist threshold)\s+(?:status\s*[—:-]\s*)?UNAPPROVED\b/i,
  /\bproposed draft for internal RFP drafting\b/i,
];

const UNVERIFIED_TIMELINE = [
  /\bT(?:₀|0)\s*\+\s*\d+\s*(?:business\s+)?(?:days?|weeks?)\b/iu,
  /\bT\s*\+\s*\d+\s*weeks?\s+from\s+sponsor\s+sign[-\s]?off\b/i,
];

const INTERNAL_RELEASE_CONTROL = [
  /\brelease holds?\s+RH-\d+\b/i,
  /\b(?:internal|buyer)\s+(?:release|approval)\s+gate\b/i,
];

export function findD09VendorDisclosureViolations(
  body: string,
): D09VendorDisclosureViolation[] {
  const violations: D09VendorDisclosureViolation[] = [];
  if (BUYER_VALUE_TARGET.some((pattern) => pattern.test(body))) {
    violations.push({ code: "buyer_value_target" });
  }
  if (INTERNAL_WORKFLOW_METADATA.some((pattern) => pattern.test(body))) {
    violations.push({ code: "internal_workflow_metadata" });
  }
  if (INTERNAL_NEGOTIATION_MATERIAL.some((pattern) => pattern.test(body))) {
    violations.push({ code: "internal_negotiation_material" });
  }
  if (UNAPPROVED_EVALUATION.some((pattern) => pattern.test(body))) {
    violations.push({ code: "unapproved_evaluation" });
  }
  if (UNVERIFIED_TIMELINE.some((pattern) => pattern.test(body))) {
    violations.push({ code: "unverified_timeline" });
  }
  if (INTERNAL_RELEASE_CONTROL.some((pattern) => pattern.test(body))) {
    violations.push({ code: "internal_release_control" });
  }
  return violations;
}

export function markD09VendorDisclosureReview(args: {
  artifactCode: string;
  body: string;
  qualityGate: SourceArtifactQualityGateMetadata | undefined;
}): {
  qualityGate: SourceArtifactQualityGateMetadata | undefined;
  failureDetail: string | null;
} {
  if (args.artifactCode !== "d09_rfp_pack") {
    return { qualityGate: args.qualityGate, failureDetail: null };
  }
  const violations = findD09VendorDisclosureViolations(args.body);
  if (violations.length === 0) {
    return { qualityGate: args.qualityGate, failureDetail: null };
  }
  const failureDetail = `Vendor disclosure check failed: ${violations.map(({ code }) => code).join(", ")}.`;
  return {
    qualityGate: args.qualityGate
      ? { ...args.qualityGate, passed: false, finalSummary: failureDetail }
      : undefined,
    failureDetail,
  };
}
