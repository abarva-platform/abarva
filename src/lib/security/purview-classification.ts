// Purview classification — B5b async upload guard
//
// Provides the async `evaluateSensitiveUploadWithPurview` function
// designed in `docs/security/B5b-PURVIEW-INTEGRATION-DESIGN.md`. The
// async path layers Microsoft Purview classification on top of the
// existing sync pattern-based guard.
//
// Today this module ships the abstraction with a stub Purview client
// so:
//   - Tier-2 / Tier-3 callers can adopt the async signature NOW
//   - When Codex's Bicep ships the per-tenant Purview accounts +
//     managed-identity wiring, only `getPurviewClient()` swaps to a
//     real implementation. No call-site changes.
//
// The sync `evaluateSensitiveUpload` remains the hot-path guard for
// Tier-1 UI uploads. This file does not modify it.
//
// Backlog: B5b. Design: docs/security/B5b-PURVIEW-INTEGRATION-DESIGN.md.

import {
  evaluateSensitiveUpload,
  type UploadProtectionResult,
} from '@/lib/security/sensitive-upload-guard';

/**
 * Input shape extends the sync guard with the tenant key so a future
 * implementation can pick the per-tenant Purview account.
 */
export interface PurviewEvaluationInput {
  filename: string;
  mimeType?: string | null;
  bytes: ArrayBuffer | Uint8Array;
  declaredClassification?: FormDataEntryValue | string | null;
  tenantClientKey: string;
}

export interface PurviewLabel {
  /** Human-readable label name. */
  label: string;
  /** Purview's 4-level sensitivity bucket. */
  sensitivity: 'public' | 'general' | 'confidential' | 'highly_confidential';
  /** The Purview classification rule IDs that fired. */
  matchedRules: ReadonlyArray<string>;
}

export interface PurviewEvaluationResult extends UploadProtectionResult {
  /** True if Purview was reachable and returned a result. */
  purviewReached: boolean;
  /** Purview's labels, if any. Empty when purviewReached=false. */
  purviewLabels: ReadonlyArray<PurviewLabel>;
}

/**
 * Abstraction over the actual Purview SDK. The default implementation
 * is unreachable (purviewReached=false), so the async path safely
 * degrades to the sync pattern guard until the real client is wired.
 *
 * Replace via `setPurviewClient` in production bootstrap (the Container
 * App's startup code injects the real, managed-identity-backed client
 * after Codex's Bicep ships).
 */
export interface PurviewClient {
  classify(args: {
    tenantClientKey: string;
    filename: string;
    mimeType?: string | null;
    bytes: Uint8Array;
  }): Promise<{
    reached: true;
    labels: ReadonlyArray<PurviewLabel>;
  } | { reached: false; reason: string }>;
}

const unreachablePurviewClient: PurviewClient = {
  async classify() {
    return { reached: false, reason: 'purview_not_configured' };
  },
};

let injectedClient: PurviewClient = unreachablePurviewClient;

export function setPurviewClient(client: PurviewClient): void {
  injectedClient = client;
}

export function getPurviewClient(): PurviewClient {
  return injectedClient;
}

/** Test helper — restores the default unreachable client. */
export function resetPurviewClient(): void {
  injectedClient = unreachablePurviewClient;
}

/**
 * Map Purview sensitivity + matched-rule signal to the existing
 * 5-level taxonomy. Decision logic mirrors the design doc:
 *
 *   - public                                                  → 'public'
 *   - general                                                 → 'internal'
 *   - confidential                                            → 'confidential_business'
 *   - highly_confidential (no PHI/PII/PCI rule)               → 'restricted_financial'
 *   - highly_confidential + Purview PHI/PII/PCI rule fired    → 'regulated_phi_pii_suspected'
 */
function highestClassificationFromPurview(
  labels: ReadonlyArray<PurviewLabel>,
): UploadProtectionResult['declaredClassification'] | null {
  if (labels.length === 0) return null;

  let highest: PurviewLabel['sensitivity'] = 'public';
  let hasRegulatedRule = false;
  const order: Record<PurviewLabel['sensitivity'], number> = {
    public: 0,
    general: 1,
    confidential: 2,
    highly_confidential: 3,
  };

  for (const lbl of labels) {
    if (order[lbl.sensitivity] > order[highest]) highest = lbl.sensitivity;
    for (const rule of lbl.matchedRules) {
      if (/hipaa|phi|pii|pci|gdpr|ccpa|ssn|tax|passport/i.test(rule)) {
        hasRegulatedRule = true;
      }
    }
  }

  if (highest === 'highly_confidential' && hasRegulatedRule) {
    return 'regulated_phi_pii_suspected';
  }
  if (highest === 'highly_confidential') return 'restricted_financial';
  if (highest === 'confidential') return 'confidential_business';
  if (highest === 'general') return 'internal';
  return 'public';
}

/**
 * Async evaluation: run the sync pattern guard first (fast-deny path),
 * then call Purview only if the sync guard said `allow`. If Purview
 * upgrades the classification to `regulated_phi_pii_suspected`, we
 * override to `quarantine`.
 *
 * Degraded mode: if Purview is unreachable, the result is exactly the
 * sync guard's decision with `purviewReached: false`.
 *
 * Callers MUST check `result.decision`. Callers MAY use
 * `purviewReached + purviewLabels` for audit-row enrichment.
 */
export async function evaluateSensitiveUploadWithPurview(
  input: PurviewEvaluationInput,
): Promise<PurviewEvaluationResult> {
  // 1 · sync guard first
  const syncResult = evaluateSensitiveUpload({
    filename: input.filename,
    mimeType: input.mimeType,
    bytes: input.bytes,
    declaredClassification: input.declaredClassification,
  });

  // 2 · if sync already said quarantine, skip Purview — saves a
  //     network round-trip on the obvious PHI/PII cases.
  if (syncResult.decision === 'quarantine') {
    return { ...syncResult, purviewReached: false, purviewLabels: [] };
  }

  // 3 · call Purview
  const bytesArr =
    input.bytes instanceof Uint8Array
      ? input.bytes
      : new Uint8Array(input.bytes);

  const client = getPurviewClient();
  const classifyResult = await client.classify({
    tenantClientKey: input.tenantClientKey,
    filename: input.filename,
    mimeType: input.mimeType ?? null,
    bytes: bytesArr,
  });

  if (!classifyResult.reached) {
    // 4a · degraded mode — Purview unreachable. Return sync result + flag.
    return {
      ...syncResult,
      purviewReached: false,
      purviewLabels: [],
    };
  }

  // 4b · merge Purview classification with the sync result. If Purview
  // upgrades to regulated, we override the decision.
  const purviewClassification = highestClassificationFromPurview(classifyResult.labels);
  if (purviewClassification === 'regulated_phi_pii_suspected') {
    return {
      ...syncResult,
      declaredClassification: 'regulated_phi_pii_suspected',
      decision: 'quarantine',
      storageAllowed: false,
      indexingAllowed: false,
      evidenceExtractionAllowed: false,
      purviewReached: true,
      purviewLabels: classifyResult.labels,
      message:
        'Upload quarantined: Microsoft Purview classification flagged PHI/PII/PCI patterns. ' +
        'Audit row records both pattern-match and Purview labels.',
    };
  }

  // 4c · Purview reached but didn't escalate. Preserve sync result;
  // surface Purview labels for audit enrichment.
  return {
    ...syncResult,
    purviewReached: true,
    purviewLabels: classifyResult.labels,
  };
}
