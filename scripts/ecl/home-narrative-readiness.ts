import { createHash } from "node:crypto";
import { CANONICAL_TENANT_KEYS } from "../../src/config/tenants/CANONICAL_TENANTS";
import { POLICY_VERSION } from "../../src/lib/governance/context-corpus-policy";

export interface NarrativeReadinessProof {
  object_table: string;
  object_id: string;
  client_key: string;
  tenant_id: string | null;
  source_layer: string;
  source_basis: string | null;
  classification: string;
  retrievability: string;
  agent_readiness_status: string;
  confidence_level: string | null;
  cited_render_verified_at: string | null;
  policy_validation_status: string;
  policy_version: string;
  policy_validated_at: string | null;
  source_hash: string | null;
  content_hash: string | null;
}

export const PROJECTION_READINESS_TABLE = "ecl_projection.home_enterprise_landscape";
export const SIGNAL_READINESS_TABLE = "home_ecl_narrative_signal";

export function narrativeReadinessOnlyMode(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  write: boolean,
  fromPlanPath: string | null,
): boolean {
  const value = env.HOME_ECL_NARRATIVE_READINESS_ONLY;
  if (value !== undefined && value !== "true" && value !== "false") {
    throw new Error("HOME_ECL_NARRATIVE_READINESS_ONLY must be true or false");
  }
  const enabled = argv.includes("--readiness-only") || value === "true";
  if (enabled && (write || fromPlanPath)) {
    throw new Error("Readiness-only inspection cannot apply or replay a narrative plan");
  }
  return enabled;
}

export function assertNarrativeInspectionScope(tenantKey: string | null | undefined, assessmentId: string | null | undefined): void {
  if (!tenantKey || !(CANONICAL_TENANT_KEYS as readonly string[]).includes(tenantKey) ||
    !assessmentId || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,119}$/.test(assessmentId)) {
    throw new Error("Readiness inspection requires an explicit canonical tenant and assessment");
  }
}

export function readinessKey(objectTable: string, objectId: string): string {
  return `${objectTable}:${objectId}`;
}

/**
 * The source version a derived signal's readiness proof is bound to: the source hash of every
 * projection row the signal cites, in any order, each counted once. The narrative builder and
 * whatever records a signal's proof both call this, so the two cannot disagree on the format.
 */
export function signalSourceHash(citedRowSourceHashes: readonly string[]): string {
  return createHash("sha256")
    .update(JSON.stringify([...new Set(citedRowSourceHashes)].sort()))
    .digest("hex");
}

export function verifiedReadiness(
  proof: NarrativeReadinessProof | undefined,
  tenantKey: string,
  expectedHash: string,
  expectedContentHash: string,
): boolean {
  return Boolean(
    proof &&
    proof.client_key === tenantKey &&
    proof.tenant_id === tenantKey &&
    proof.source_layer === "signal" &&
    proof.classification === "internal" &&
    proof.policy_validation_status === "pass" &&
    proof.policy_version === POLICY_VERSION &&
    proof.policy_validated_at &&
    proof.source_hash === expectedHash &&
    proof.content_hash === expectedContentHash &&
    proof.source_basis &&
    proof.agent_readiness_status === "agent_ready" &&
    (proof.retrievability === "fts_indexed" || proof.retrievability === "search_indexed") &&
    proof.cited_render_verified_at &&
    (proof.confidence_level === "high" || proof.confidence_level === "medium"),
  );
}
