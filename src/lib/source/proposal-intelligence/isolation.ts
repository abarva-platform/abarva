// Vendor isolation — structural, provable.
//
// Hard rule: Vendor A's response must never enter a bundle that produces analysis for
// Vendor B. Isolation is enforced at bundle assembly (every object is tagged with its
// vendor) and PROVEN per output by the SourceProposalContextBundleTrace.

import { createHash } from "node:crypto";
import type { SourceProposalContextBundleTrace } from "./types";

export interface VendorTaggedObject {
  ref: string;
  /** the vendor this object belongs to; null = client/RFP-side object (shared). */
  vendorName: string | null;
}

export interface IsolationCheck {
  status: "isolated" | "violation_detected";
  violations: string[]; // refs that belong to another vendor
}

/** Verify every vendor-tagged object in a bundle belongs to the target vendor. */
export function checkVendorIsolation(
  targetVendor: string,
  objects: VendorTaggedObject[],
): IsolationCheck {
  const violations = objects
    .filter((o) => o.vendorName !== null && o.vendorName !== targetVendor)
    .map((o) => o.ref);
  return {
    status: violations.length === 0 ? "isolated" : "violation_detected",
    violations,
  };
}

/** Filter a candidate set down to the target vendor + shared client/RFP objects. */
export function isolateBundleForVendor<T extends VendorTaggedObject>(
  targetVendor: string,
  objects: T[],
): { bundle: T[]; excludedCount: number } {
  const bundle = objects.filter(
    (o) => o.vendorName === null || o.vendorName === targetVendor,
  );
  return { bundle, excludedCount: objects.length - bundle.length };
}

export interface ProposalTraceInput {
  sourceEventId: string;
  vendorName: string;
  proposalVersion: number;
  tenantId: string;
  archetype: string;
  evaluationStage: string;
  rfpRequirementsRetrieved: number;
  vendorFiles: string[];
  normalizedCategories: string[];
  evidenceUsed: string[];
  pricingInputsUsed: string[];
  excludedByReason: Record<string, number>;
  scoringCriteriaUsed: string[];
  assumptions: string[];
  missingInputs: string[];
  claims: { text: string; citation?: string }[];
  citations: string[];
  bundleObjects: VendorTaggedObject[];
  crossTenantHits?: number;
}

export function buildProposalContextTrace(
  inp: ProposalTraceInput,
): SourceProposalContextBundleTrace {
  const isolation = checkVendorIsolation(inp.vendorName, inp.bundleObjects);
  const citationSet = new Set(inp.citations);
  const unsupported = inp.claims.filter(
    (c) => !c.citation || !citationSet.has(c.citation),
  );
  const hash = createHash("sha256")
    .update(
      [
        inp.vendorName,
        inp.proposalVersion,
        ...inp.evidenceUsed,
        ...inp.pricingInputsUsed,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 16);
  return {
    trace_id: `prop-${inp.sourceEventId}-${inp.vendorName.replace(/\W+/g, "").toLowerCase()}-v${inp.proposalVersion}`,
    source_event_id: inp.sourceEventId,
    vendor_name: inp.vendorName,
    proposal_version: inp.proposalVersion,
    tenant_id: inp.tenantId,
    archetype: inp.archetype,
    evaluation_stage: inp.evaluationStage,
    rfp_requirements_retrieved: inp.rfpRequirementsRetrieved,
    vendor_response_files_retrieved: inp.vendorFiles,
    normalized_categories: inp.normalizedCategories,
    evidence_used: inp.evidenceUsed,
    pricing_inputs_used: inp.pricingInputsUsed,
    excluded_objects_by_reason: {
      ...inp.excludedByReason,
      ...(isolation.violations.length > 0
        ? { vendor_isolation_excluded: isolation.violations.length }
        : {}),
    },
    scoring_criteria_used: inp.scoringCriteriaUsed,
    assumptions: inp.assumptions,
    missing_inputs: inp.missingInputs,
    model_input_context_hash: hash,
    claims_detected: inp.claims.length,
    claims_supported: inp.claims.length - unsupported.length,
    claims_unsupported: unsupported.length,
    citations_emitted: inp.citations,
    tenant_leakage_status:
      (inp.crossTenantHits ?? 0) > 0 ? "leak_detected" : "clean",
    vendor_isolation_status: isolation.status,
  };
}
