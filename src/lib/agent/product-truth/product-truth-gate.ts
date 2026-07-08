// Global aVa Product Truth + Scope Guard — composed gate.
//
// Combines the capability-overreach, third-party-replacement, and
// tenant-evidence-claim guards into one result, matching the composed-gate
// shape already used in src/lib/programs/ava-chat/quality-gate.ts and
// src/lib/source/ava/answer-quality-gate.ts. Violations-only — the caller
// decides whether to log, block, or drive a repair pass.

import { checkCapabilityClaims } from "./capability-claim-guard";
import { checkThirdPartyReplacementClaims } from "./third-party-replacement-guard";
import { checkTenantEvidenceClaims } from "./tenant-evidence-claim-guard";
import type { ProductTruthCheckResult, ProductTruthViolation } from "./types";

export interface RunProductTruthGateOptions {
  /** Active tenant's client key, for pilot-tenant capability checks. */
  tenantKey?: string | null;
  /**
   * Grounding text supplied to the model this turn (system prompt + any
   * injected facts). When omitted, tenant-evidence-claim checking is
   * skipped rather than flagging every number as unsupported — callers that
   * don't yet thread grounding text through should opt in explicitly.
   */
  groundingText?: string;
}

export function runProductTruthGate(
  text: string,
  options: RunProductTruthGateOptions = {},
): ProductTruthCheckResult {
  const violations: ProductTruthViolation[] = [
    ...checkCapabilityClaims(text, options.tenantKey ?? null),
    ...checkThirdPartyReplacementClaims(text),
    ...(options.groundingText !== undefined
      ? checkTenantEvidenceClaims(text, options.groundingText)
      : []),
  ];

  return { pass: violations.length === 0, violations };
}
