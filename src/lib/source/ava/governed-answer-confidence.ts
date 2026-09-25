import type { GovernedCandidate } from "@/lib/governance/agent-context-bundle";
import type { ConfidenceLevel } from "@/lib/governance/context-corpus-policy";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";

/**
 * The governance state a confidence level is derived from.
 *
 * One ladder, one home. `artifact-quality-governed-answer.ts` implemented this
 * rule privately over `SourceArtifactRegistryRecordWithContent`; three vendor
 * response builders implemented nothing and stamped `"high"` as a literal.
 * The rule is the same in both cases — what differs is the state each source
 * layer reads it from — so the ladder lives here and each layer supplies an
 * adapter.
 */
export interface GovernanceEvidenceState {
  /** A named human accepted this object, or it is the client-final version. */
  approved: boolean;
  /** The object was machine-read without loss. */
  parsed: boolean;
  /** At least one assertion in the object carries a reference back to source. */
  cited: boolean;
}

/**
 * high   — a human accepted it
 * medium — it was read cleanly, or it points back at its source, but nobody
 *          has accepted it
 * low    — neither
 *
 * Deliberately NOT a function of `retrievability` or `agent_readiness_status`.
 * Confidence states how well-founded the content is; those two state whether
 * the object has been indexed and reviewed for agent use. A client-final
 * artifact that nobody has embedded yet is legitimately `high` + `not_indexed`
 * + `not_reviewed`, which is exactly what `governedCandidateFromSourceArtifact`
 * produces today, so a cross-field ban on that combination would reject the
 * one call site that was already correct.
 */
export function confidenceFromGovernanceState(
  state: GovernanceEvidenceState,
): ConfidenceLevel {
  if (state.approved) return "high";
  if (state.parsed || state.cited) return "medium";
  return "low";
}

function packageCarriesSourceReference(
  responsePackage: NormalizedVendorResponsePackage,
): boolean {
  return responsePackage.rows.some(
    (row) =>
      Boolean(row.evidenceRefs?.length) ||
      Boolean(row.pricingRef) ||
      Boolean(row.slaRef) ||
      Boolean(row.exceptionRef),
  );
}

/**
 * Map a normalized vendor response package onto the ladder above.
 *
 * `reviewState` is compared to the literal `"accepted"` rather than tested for
 * truthiness. It is a single-member union today, so presence and value are the
 * same thing; the comparison keeps them different, so a second member added
 * later does not silently start counting as an acceptance.
 */
export function normalizedVendorResponseGovernanceState(
  responsePackage: NormalizedVendorResponsePackage,
): GovernanceEvidenceState {
  return {
    approved:
      responsePackage.authority?.acceptedArtifactOnly === true ||
      responsePackage.reviewState === "accepted",
    parsed:
      responsePackage.parserWarnings.length === 0 &&
      responsePackage.analytics.requirementCount > 0,
    cited: packageCarriesSourceReference(responsePackage),
  };
}

export function confidenceForNormalizedVendorResponse(
  responsePackage: NormalizedVendorResponsePackage,
): ConfidenceLevel {
  return confidenceFromGovernanceState(
    normalizedVendorResponseGovernanceState(responsePackage),
  );
}

/**
 * The governed fields every vendor-response-backed candidate shares.
 *
 * Extracted so the next builder in this directory inherits the derivation
 * instead of copying a literal: the three that did — award readiness, BAFO
 * instructions and pricing comparison — each wrote its own object and each
 * wrote `confidence_level: "high"` into it. A builder that spreads this gets
 * the rule; one that overrides a field has to say so in the diff.
 *
 * `retrievability` and `agent_readiness_status` stay constant here because
 * they are constant for this source layer: a normalized response package is
 * held in the module read model and is neither indexed nor reviewed. They are
 * stated once rather than three times, and their value is unchanged.
 */
export function vendorResponseGovernedFields(
  responsePackage: NormalizedVendorResponsePackage,
  scope: { clientKey: string; tenantId: string | null },
): Pick<
  GovernedCandidate,
  | "id"
  | "client_key"
  | "tenant_id"
  | "source_layer"
  | "source_basis"
  | "classification"
  | "retrievability"
  | "agent_readiness_status"
  | "confidence_level"
  | "cited_render_verified_at"
> {
  return {
    id: responsePackage.artifactId,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: "vendor",
    source_basis: responsePackage.originalName,
    classification: "confidential",
    retrievability: "not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level: confidenceForNormalizedVendorResponse(responsePackage),
    cited_render_verified_at: null,
  };
}
