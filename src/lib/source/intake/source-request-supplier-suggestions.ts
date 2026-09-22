import {
  buildCandidateSupplierRegistrySlice,
  type CandidateSupplierAuthorityRow,
  type CandidateSupplierContactPolicy,
  type CandidateSupplierEligibility,
  type CandidateSupplierProjectionRow,
} from "@/lib/source/candidate-suppliers/candidate-supplier-authority";

export type SourceRequestSupplierSuggestion = {
  supplierId: string;
  legalEntityId: string;
  legalName: string;
  label: "Suggested for review";
  existingContractVendor: boolean;
  eligibility: CandidateSupplierEligibility;
  contactPolicy: CandidateSupplierContactPolicy;
  contactReadiness: CandidateSupplierProjectionRow["contactReadiness"];
  contactActionAvailable: false;
  sourceReference: string;
};

export type SourceRequestSupplierSuggestionProjection = {
  status: "available" | "empty" | "blocked";
  blockers: readonly string[];
  rows: readonly SourceRequestSupplierSuggestion[];
  excludedCount: number;
};

export function buildSourceRequestSupplierSuggestions(input: {
  tenantKey: string;
  eventId: string;
  acceptedMapping: {
    categoryId: string;
    archetypeId: string;
  } | null;
  registryAvailable: boolean;
  registryRows: readonly CandidateSupplierAuthorityRow[];
  contractVendorLegalEntityIds: readonly string[];
  contractEvidenceAvailable: boolean;
}): SourceRequestSupplierSuggestionProjection {
  if (!input.acceptedMapping) {
    return {
      status: "blocked",
      blockers: [
        "A named mapping decision is required before supplier suggestions.",
      ],
      rows: [],
      excludedCount: 0,
    };
  }
  if (!input.registryAvailable) {
    return {
      status: "blocked",
      blockers: ["The governed candidate-supplier registry is unavailable."],
      rows: [],
      excludedCount: 0,
    };
  }
  if (!input.contractEvidenceAvailable) {
    return {
      status: "blocked",
      blockers: [
        "Existing-contract vendor linkage is unavailable, so candidates cannot be separated safely.",
      ],
      rows: [],
      excludedCount: 0,
    };
  }

  const slice = buildCandidateSupplierRegistrySlice({
    registryAvailable: input.registryAvailable,
    tenantKey: input.tenantKey,
    eventId: input.eventId,
    filters: {
      categoryKey: input.acceptedMapping.categoryId,
      archetypeKey: input.acceptedMapping.archetypeId,
    },
    rows: input.registryRows,
    selectedSupplierIds: [],
  });
  if (slice.status === "blocked" || slice.status === "unavailable") {
    return {
      status: "blocked",
      blockers: slice.blockers,
      rows: [],
      excludedCount: slice.excluded.length,
    };
  }

  const currentVendors = new Set(input.contractVendorLegalEntityIds);
  const rows = slice.candidates.map((candidate) => ({
    supplierId: candidate.supplierId,
    legalEntityId: candidate.legalEntityId,
    legalName: candidate.legalName,
    label: "Suggested for review" as const,
    existingContractVendor: currentVendors.has(candidate.legalEntityId),
    eligibility: candidate.eligibility,
    contactPolicy: candidate.contactPolicy,
    contactReadiness: candidate.contactReadiness,
    // This surface is evidence, not a send or invitation control.
    contactActionAvailable: false as const,
    sourceReference: candidate.source.reference,
  }));

  return {
    status: rows.length > 0 ? "available" : "empty",
    blockers: [],
    rows,
    excludedCount: slice.excluded.length,
  };
}
