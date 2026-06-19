// Source reasoning · the envelope quality gate (Phase 1, Slice 1.0 keystone)
//
// Makes "0 unsupported claims, 0 leaks" a CHECKED contract rather than a prompt
// instruction (§5.3). The defining rule: a Claim with an empty `supportedBy` array
// is a FAILURE, not a warning. Pure + unit-tested; no I/O, no clock.

import type { ReasoningEnvelope } from "./reasoning-envelope";
import { GATE_SUPPORTING_READINESS } from "./reasoning-envelope";

export type EnvelopeFailureKind =
  | "unsupported_claim"
  | "dangling_evidence_ref"
  | "leaked_internal_term"
  | "gate_claim_below_usable"
  | "refusal_incomplete";

export interface EnvelopeFailure {
  kind: EnvelopeFailureKind;
  detail: string;
  claimId?: string;
}

export interface EnvelopeValidation {
  ok: boolean;
  failures: EnvelopeFailure[];
}

/** Internal terms that must never leak into client-facing reasoning text. */
const LEAKED_TERMS = [
  "tenant_key",
  "tenantKey",
  "substrate",
  "source_event",
  "artifact-source-",
  "chunk_id",
] as const;

/**
 * Validate a Reasoning Envelope against the spec's machine-checkable quality bar.
 * Returns `ok: false` with every failure found (does not throw) so callers can
 * fall back to the legacy path and log the reasons.
 */
export function validateEnvelope(env: ReasoningEnvelope): EnvelopeValidation {
  const failures: EnvelopeFailure[] = [];

  // A refusal envelope is intentionally claim-light: it is valid as long as it
  // carries a reason + a minimum-data request (it renders the refusal, not a rec).
  if (env.refusal) {
    if (
      !env.refusal.reason.trim() ||
      !env.refusal.minimumDataRequest.trim()
    ) {
      failures.push({
        kind: "refusal_incomplete",
        detail: "refusal envelope missing reason or minimum-data request",
      });
    }
    return { ok: failures.length === 0, failures };
  }

  const evidenceIds = new Set(env.evidence.map((e) => e.id));
  const usableEvidenceIds = new Set(
    env.evidence
      .filter((e) => e.readinessState === GATE_SUPPORTING_READINESS)
      .map((e) => e.id),
  );

  for (const claim of env.claims) {
    // Keystone: every claim must cite at least one evidence ref.
    if (claim.supportedBy.length === 0) {
      failures.push({
        kind: "unsupported_claim",
        detail: `claim has no supporting evidence: "${claim.text.slice(0, 80)}"`,
        claimId: claim.id,
      });
      continue;
    }
    // Every cited ref must resolve to an evidence item in this envelope.
    for (const refId of claim.supportedBy) {
      if (!evidenceIds.has(refId)) {
        failures.push({
          kind: "dangling_evidence_ref",
          detail: `claim cites unknown evidence ref ${refId}`,
          claimId: claim.id,
        });
      }
    }
    // A gate-defining claim must rest on at least one "Usable Evidence" ref.
    if (
      claim.gateDefining &&
      !claim.supportedBy.some((id) => usableEvidenceIds.has(id))
    ) {
      failures.push({
        kind: "gate_claim_below_usable",
        detail: `gate-defining claim has no "Usable Evidence" support`,
        claimId: claim.id,
      });
    }
  }

  // No internal-term leakage in any client-facing reasoning text.
  const surfaces = [
    ...env.claims.map((c) => c.text),
    ...env.caveats.map((c) => c.text),
  ];
  for (const text of surfaces) {
    for (const term of LEAKED_TERMS) {
      if (text.includes(term)) {
        failures.push({
          kind: "leaked_internal_term",
          detail: `internal term "${term}" leaked into reasoning text`,
        });
      }
    }
  }

  return { ok: failures.length === 0, failures };
}
