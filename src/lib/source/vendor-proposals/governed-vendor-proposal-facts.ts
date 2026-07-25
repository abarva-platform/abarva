// Governed-candidate mapper for accepted VendorProposalFacts — mirrors
// governedCandidateFromVendorLeverFact
// (src/lib/source/ava/vendor-coverage-governed-answer.ts) exactly, so an
// accepted proposal fact can honestly back an aVa chat answer or any other
// agent-context consumer via buildValidatedAgentContextBundle.
//
// KNOWN, DELIBERATE LIMITATION (same shape as the vendor-lever precedent):
// "accepted" (this module's own governed review state) is a DIFFERENT axis
// from "agent_ready" (AGENTS.md's context-and-corpus policy: fts_indexed /
// search_indexed + end-to-end cite-render verification). Nothing indexes
// source_vendor_proposal_facts anywhere today, so every candidate here is
// honestly retrievability: "not_indexed" / agent_readiness_status:
// "not_reviewed" regardless of this table's own review_status. The gate is
// called with requireAgentReady: false for the same reason the vendor-lever
// answer is: `true` would permanently block this feature, which would not be
// honest — it would just hide the real state behind a stricter setting this
// evidence class can never satisfy yet. A `block` decision (e.g. a
// downstream_context_policy override) still fully suppresses the candidate.

import {
  buildValidatedAgentContextBundle,
  type GovernedCandidate,
} from "@/lib/governance/agent-context-bundle";
import type { ConfidenceLevel } from "@/lib/governance/context-corpus-policy";
import type {
  VendorProposalFactConfidence,
  VendorProposalFactRecord,
} from "./types";

/** `VendorProposalFactConfidence` ('low'|'med'|'high') and `ConfidenceLevel`
 * ('low'|'medium'|'high'|'unverified') don't share string values — an
 * explicit mapper, not a cast, matching factConfidenceToConfidenceLevel in
 * vendor-coverage-governed-answer.ts. */
export function vendorProposalFactConfidenceToConfidenceLevel(
  confidence: VendorProposalFactConfidence,
): ConfidenceLevel {
  switch (confidence) {
    case "low":
      return "low";
    case "med":
      return "medium";
    case "high":
      return "high";
  }
}

/**
 * Map one ACCEPTED vendor proposal fact to a `GovernedCandidate`. Callers
 * must only pass facts already resolved via
 * getAuthoritativeVendorProposalFacts — this function does not itself check
 * review status.
 */
export function governedCandidateFromVendorProposalFact(
  fact: VendorProposalFactRecord,
  scope: { clientKey: string; tenantId: string | null },
): GovernedCandidate {
  const citation: string[] = [];
  if (fact.sourceQuote) citation.push(fact.sourceQuote);
  else if (fact.sourcePointer) {
    citation.push(`${fact.sourcePointer.doc} — ${fact.sourcePointer.locator}`);
  }

  return {
    id: fact.id,
    client_key: scope.clientKey,
    tenant_id: scope.tenantId,
    source_layer: "vendor",
    source_basis: fact.sourcePointer?.doc ?? null,
    classification: "confidential",
    retrievability: "not_indexed",
    agent_readiness_status: "not_reviewed",
    confidence_level: vendorProposalFactConfidenceToConfidenceLevel(
      fact.confidence,
    ),
    cited_render_verified_at: null,
    title: `${fact.vendorKey} · ${fact.factKey}`,
    citations: citation,
  };
}

/**
 * Run a set of already-accepted facts through the mandatory governance gate.
 * Returns the bundle unchanged — callers decide what to do with a `block`
 * decision (e.g. the vendor-coverage answer builder suppresses its table
 * entirely rather than degrading to a fabricated one; a future aVa-context
 * caller for proposal facts should do the same).
 */
export function buildGovernedVendorProposalFactBundle(
  facts: readonly VendorProposalFactRecord[],
  scope: { clientKey: string; tenantId: string | null },
) {
  const candidates = facts.map((fact) =>
    governedCandidateFromVendorProposalFact(fact, scope),
  );
  return buildValidatedAgentContextBundle(candidates, {
    requireAgentReady: false,
  });
}
