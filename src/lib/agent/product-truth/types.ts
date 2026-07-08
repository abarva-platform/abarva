// Global aVa Product Truth + Scope Guard — shared types.
//
// Purpose: stop agent chat (Nexus/Sentinel/Atlas/Steward, across every
// surface) from hallucinating (a) product capabilities that don't exist or
// aren't live for the asking tenant, (b) tenant facts without evidence
// backing, (c) claims that AbarVa replaces/certifies against third parties
// (Gartner/Forrester/Big Four/etc.), and (d) unsafe suggested questions that
// bait the model into those hallucinations. Modeled on the existing
// voice-doctrine (src/lib/agent/voice-doctrine/*.ts) and answer-quality-gate
// (src/lib/source/ava/answer-quality-gate.ts) patterns already in this
// codebase — violations-only, no auto-repair inside the module.

export type CapabilityMaturity =
  | "shipped"
  | "partial"
  | "pilot_tenant_only"
  | "not_built";

export interface ProductCapabilityEntry {
  /** Stable identifier. Snake-case. */
  key: string;
  surface:
    | "moves"
    | "source"
    | "tower"
    | "home"
    | "intelligence"
    | "setup"
    | "platform";
  /** Human-facing label for this capability, for use in repair guidance. */
  label: string;
  maturity: CapabilityMaturity;
  /** Tenants this capability is live for, when maturity is pilot_tenant_only. */
  pilotTenants?: readonly string[];
  /**
   * What an agent may honestly say about this capability right now. This is
   * quoted into repair instructions when a claim overreaches.
   */
  claimGuidance: string;
  /**
   * Phrases that, if present in an answer alongside a definitive/live framing
   * for this capability, indicate an overreaching claim worth flagging.
   */
  triggerPhrases: readonly RegExp[];
}

export type ProductTruthViolationCategory =
  | "capability_overreach"
  | "third_party_replacement_claim"
  | "unsupported_tenant_claim"
  | "tenant_leakage_or_stale_fact"
  | "wrong_moves_model"
  | "out_of_scope"
  | "internal_error_leak"
  | "unsafe_suggested_question"
  | "professional_boundary_missing";

export interface ProductTruthViolation {
  category: ProductTruthViolationCategory;
  id: string;
  matchedText: string;
  detail: string;
}

export interface ProductTruthCheckResult {
  pass: boolean;
  violations: ProductTruthViolation[];
}

export interface ProductTruthRuntimeContext {
  tenantKey?: string | null;
  tenantName?: string | null;
  surface?: string | null;
  query?: string | null;
  groundingText?: string;
}

export interface ProductTruthRepairResult {
  text: string;
  violations: ProductTruthViolation[];
  repaired: boolean;
  blocked: boolean;
}
