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
}

export const PROJECTION_READINESS_TABLE = "ecl_projection.home_enterprise_landscape";
export const SIGNAL_READINESS_TABLE = "home_ecl_narrative_signal";

export function readinessKey(objectTable: string, objectId: string): string {
  return `${objectTable}:${objectId}`;
}

export function verifiedReadiness(
  proof: NarrativeReadinessProof | undefined,
  tenantKey: string,
  expectedHash: string,
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
    proof.source_basis &&
    proof.agent_readiness_status === "agent_ready" &&
    (proof.retrievability === "fts_indexed" || proof.retrievability === "search_indexed") &&
    proof.cited_render_verified_at &&
    (proof.confidence_level === "high" || proof.confidence_level === "medium"),
  );
}
