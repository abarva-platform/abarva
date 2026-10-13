import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";
import { azureRead } from "@/lib/data-plane/azureRead";
import { buildValidatedAgentContextBundle, type GovernedCandidate } from "@/lib/governance/agent-context-bundle";
import { CORPUS_GLOBAL_SCOPE, GovernedObjectSchema, isCanonicalClientKey, POLICY_VERSION, type SourceLayer } from "@/lib/governance/context-corpus-policy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { reviewedExtractionFromStoredSourceRef } from "./evidence-review-contract";

export type MoveAdmissionState = "admitted" | "absent" | "unreadable" | "unbound" | "stale" | "blocked";
export interface MoveSourceBinding {
  version: 1;
  move_id: string;
  phase: number;
  source_revision_sha256: string;
  source_artifact_id?: string;
  source_artifact_version?: number;
  source_blob_sha256?: string;
  review_id?: string;
  review_updated_at?: string;
  reviewed_extraction_sha256?: string;
}
export interface MoveAdmissionSource {
  objectTable: string;
  objectId: string;
  clientKey: string;
  tenantId: string;
  sourceLayer: SourceLayer;
  sourceFile: string | null;
  changedAt: string | null;
  binding: MoveSourceBinding;
  citations: string[];
}
export interface MoveAdmissionDiagnostic { objectTable: string; objectId: string; state: MoveAdmissionState }

export function storedTimestamp(value: unknown): string | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function canonicalValue(value: unknown): unknown {
  if (value instanceof Date) return storedTimestamp(value);
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, nested]) => [key, canonicalValue(nested)]));
}
/** Digest the stored revision for comparison; this does not earn readiness. */
export function moveSourceRevision(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalValue(value))).digest("hex");
}

export const MOVE_ADMISSION_EVIDENCE_COLUMNS = ["id", "tenant_key", "program_id", "attachment_id", "phase", "evidence_type", "title", "summary", "extracted_text", "extracted_structured", "confidence", "created_at"] as const;
export const MOVE_ADMISSION_REVIEW_COLUMNS = ["id", "tenant_key", "program_id", "evidence_id", "family_key", "phase", "decision", "reviewed_at", "updated_at", "source_ref"] as const;
export const MOVE_ADMISSION_ARTIFACT_COLUMNS = ["artifact_id", "tenant_id", "tenant_key", "move_id", "phase", "version", "blob_sha256", "blob_path", "lifecycle_state", "metadata", "updated_at"] as const;
function selectedRevision(row: Record<string, unknown>, columns: readonly string[]) {
  return Object.fromEntries(columns.map(key => [key, key.endsWith("_at") ? storedTimestamp(row[key]) : row[key] ?? null]));
}

const sha = z.string().regex(/^[0-9a-f]{64}$/);
const BindingSchema = z.object({
  version: z.literal(1), move_id: z.string().min(1), phase: z.number().int().min(0).max(5),
  source_revision_sha256: sha, source_artifact_id: z.string().min(1).optional(),
  source_artifact_version: z.number().int().positive().optional(), source_blob_sha256: sha.optional(),
  review_id: z.string().min(1).optional(), review_updated_at: z.string().optional(), reviewed_extraction_sha256: sha.optional(),
}).strict();
const AdmissionSchema = GovernedObjectSchema.pick({
  client_key: true, tenant_id: true, source_layer: true, source_basis: true,
  classification: true, retrievability: true, agent_readiness_status: true,
  confidence_level: true, cited_render_verified_at: true, provenance: true, policy_version: true,
}).extend({
  object_table: z.string().min(1), object_id: z.string().min(1), policy_version: z.literal(POLICY_VERSION),
  policy_validation_status: z.literal("pass"), policy_validated_at: z.string().min(1),
});

/** Bind an approved extraction to the declared native source version and bytes. */
export function reviewedEvidenceAdmissionSource(args: {
  clientKey: string; tenantId: string; moveId: string;
  evidence: Record<string, unknown>; review: Record<string, unknown>; artifact: Record<string, unknown>;
}): MoveAdmissionSource | null {
  const { evidence, review, artifact } = args;
  const clientKey = canonicalTenantKey(args.clientKey);
  const sourceRef = record(review.source_ref);
  const metadata = record(artifact.metadata);
  const reviewed = reviewedExtractionFromStoredSourceRef(sourceRef);
  const reviewedAt = storedTimestamp(review.reviewed_at);
  const updatedAt = storedTimestamp(review.updated_at);
  const hash = sha.safeParse(artifact.blob_sha256);
  const artifactId = textValue(sourceRef.move_artifact_id);
  const phase = evidence.phase;
  if (!clientKey || !reviewed || !reviewedAt || !updatedAt || !hash.success ||
    !textValue(evidence.id) || !textValue(review.id) || review.evidence_id !== evidence.id || review.decision !== "approved" ||
    evidence.program_id !== args.moveId || review.program_id !== args.moveId || artifact.move_id !== args.moveId ||
    canonicalTenantKey(textValue(evidence.tenant_key)) !== clientKey || canonicalTenantKey(textValue(review.tenant_key)) !== clientKey ||
    canonicalTenantKey(textValue(artifact.tenant_key)) !== clientKey || artifact.tenant_id !== args.tenantId ||
    !Number.isInteger(phase) || Number(phase) < 0 || Number(phase) > 5 || review.phase !== phase || artifact.phase !== phase ||
    !artifactId || artifact.artifact_id !== artifactId || !Number.isInteger(artifact.version) || Number(artifact.version) < 1 ||
    metadata.sha256 !== hash.data || metadata.storage !== "azure_blob" || !textValue(artifact.blob_path) ||
    artifact.lifecycle_state !== "current") return null;
  const binding: MoveSourceBinding = {
    version: 1, move_id: args.moveId, phase: Number(phase),
    source_revision_sha256: moveSourceRevision({ evidence: selectedRevision(evidence, MOVE_ADMISSION_EVIDENCE_COLUMNS), review: selectedRevision(review, MOVE_ADMISSION_REVIEW_COLUMNS), artifact: selectedRevision(artifact, MOVE_ADMISSION_ARTIFACT_COLUMNS) }),
    source_artifact_id: artifactId, source_artifact_version: Number(artifact.version), source_blob_sha256: hash.data,
    review_id: String(review.id), review_updated_at: updatedAt, reviewed_extraction_sha256: moveSourceRevision(reviewed),
  };
  const dates = [reviewedAt, updatedAt, storedTimestamp(artifact.updated_at)].filter((v): v is string => v !== null);
  return {
    objectTable: "program_evidence_items", objectId: String(evidence.id), clientKey, tenantId: args.tenantId,
    sourceLayer: "uploaded_evidence", sourceFile: String(artifact.blob_path), changedAt: dates.sort().at(-1)!,
    binding, citations: reviewed.structured.citations.map(c => c.locator),
  };
}

export async function admitMoveSources<T>(
  items: readonly T[], sourceFor: (item: T) => MoveAdmissionSource | null | undefined,
  scope: { clientKey: string; tenantId: string; moveId: string; phase: number },
): Promise<{ items: T[]; diagnostics: MoveAdmissionDiagnostic[] }> {
  const clientKey = canonicalTenantKey(scope.clientKey);
  const diagnostics: MoveAdmissionDiagnostic[] = [];
  const sources = items.map(item => ({ item, source: sourceFor(item) }));
  const usable = new Set<T>();
  const validScope = clientKey && isCanonicalClientKey(clientKey) && clientKey !== CORPUS_GLOBAL_SCOPE && scope.tenantId && scope.moveId && Number.isInteger(scope.phase) && scope.phase >= 0 && scope.phase <= 5;
  const bound = sources.filter(({ source }) => {
    if (!source) { diagnostics.push({ objectTable: "unknown", objectId: "unknown", state: "unbound" }); return false; }
    if (!validScope || source.clientKey !== clientKey || source.tenantId !== scope.tenantId || source.binding.move_id !== scope.moveId || source.binding.phase > scope.phase || !BindingSchema.safeParse(source.binding).success) {
      diagnostics.push({ objectTable: source.objectTable, objectId: source.objectId, state: "blocked" }); return false;
    }
    return true;
  });
  const tables = [...new Set(bound.map(({ source }) => source!.objectTable))];
  for (const table of tables) {
    const group = bound.filter(({ source }) => source!.objectTable === table);
    let rows: Record<string, unknown>[];
    try {
      rows = await azureRead.select<Record<string, unknown>>({ table: "governed_object_readiness", columns: [
        "object_table", "object_id", "client_key", "tenant_id", "source_layer", "source_basis", "classification", "retrievability", "agent_readiness_status", "confidence_level", "cited_render_verified_at", "provenance", "policy_version", "policy_validation_status", "policy_validated_at",
      ], where: { object_table: table, object_id: { op: "in", value: [...new Set(group.map(({ source }) => source!.objectId))] }, client_key: clientKey!, tenant_id: scope.tenantId }, limit: 1000 });
    } catch {
      group.forEach(({ source }) => diagnostics.push({ objectTable: table, objectId: source!.objectId, state: "unreadable" })); continue;
    }
    for (const { item, source: maybeSource } of group) {
      const source = maybeSource!;
      const diag = (state: MoveAdmissionState) => diagnostics.push({ objectTable: table, objectId: source.objectId, state });
      const matches = rows.filter(row => row.object_table === table && row.object_id === source.objectId);
      if (matches.length === 0) { diag("absent"); continue; }
      if (matches.length !== 1) { diag("blocked"); continue; }
      const raw = matches[0];
      const proof = BindingSchema.safeParse(record(raw.provenance).move_source_binding);
      if (!proof.success) { diag("unbound"); continue; }
      if (moveSourceRevision(proof.data) !== moveSourceRevision(source.binding)) { diag("stale"); continue; }
      const parsed = AdmissionSchema.safeParse({ ...raw, cited_render_verified_at: storedTimestamp(raw.cited_render_verified_at), policy_validated_at: storedTimestamp(raw.policy_validated_at) });
      if (!parsed.success) { diag("blocked"); continue; }
      const row = parsed.data;
      if (row.client_key !== clientKey || row.tenant_id !== scope.tenantId || row.source_layer !== source.sourceLayer) { diag("blocked"); continue; }
      if (!source.changedAt || !source.sourceFile || row.provenance?.source_file !== source.sourceFile) { diag("unbound"); continue; }
      const changed = Date.parse(source.changedAt);
      if (![row.provenance.indexed_at, row.cited_render_verified_at, row.policy_validated_at].every(value => {
        const time = storedTimestamp(value); return time !== null && Number.isFinite(changed) && Date.parse(time) >= changed;
      })) { diag("stale"); continue; }
      const candidate: GovernedCandidate = {
        id: source.objectId, client_key: row.client_key, tenant_id: row.tenant_id, source_layer: row.source_layer,
        source_basis: row.source_basis, classification: row.classification, retrievability: row.retrievability,
        agent_readiness_status: row.agent_readiness_status, confidence_level: row.confidence_level,
        cited_render_verified_at: row.cited_render_verified_at, citations: source.citations,
      };
      if (buildValidatedAgentContextBundle([candidate], { requireAgentReady: true }).usable.length !== 1) { diag("blocked"); continue; }
      usable.add(item); diag("admitted");
    }
  }
  return { items: items.filter(item => usable.has(item)), diagnostics };
}
