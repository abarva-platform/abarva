import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { PROGRAM_MODULE_EVIDENCE_COLUMNS } from "@/lib/deliverables/orchestrator/program-module-evidence-columns";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { isCanonicalClientKey } from "@/lib/governance/context-corpus-policy";
import {
  toTenantContextSearchDocument,
  type EnterpriseContextChunkRow,
} from "@/lib/azure-search/tenant-context-backfill";
import {
  moveSourceRevision,
  storedTimestamp,
  type MoveAdmissionSource,
} from "../move-agent-admission";
import {
  validateManifest,
  type DatasetManifest,
} from "@/lib/governance/dataset-manifest";
import type { ExactSourceQuery } from "./exact-source-reader";
import type { NativeSourceRow } from "./exact-source-preparation";

export const CAPTURE_DATASET_ID = "moves_phase_capture_preparation_v1";
export const PhaseCaptureCohortSchema = z
  .object({
    version: z.literal(1),
    datasetId: z.literal(CAPTURE_DATASET_ID),
    clientKey: z.string(),
    nativeTenantKey: z.string(),
    clientId: z.string().uuid(),
    moveId: z.string().uuid(),
    expectedCurrentPhase: z.number().int().min(0).max(5),
    operatorPersonId: z.string().uuid(),
    operatorClerkId: z.string(),
    sources: z
      .array(
        z
          .object({
            moduleId: z.string().uuid(),
            phase: z.number().int().min(0).max(5),
            sourceRevision: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict(),
      )
      .min(1)
      .max(32),
  })
  .strict();
export type PhaseCaptureCohort = z.infer<typeof PhaseCaptureCohortSchema>;
export const captureColumns = [
  ...PROGRAM_MODULE_EVIDENCE_COLUMNS,
  "engagement_id",
];
const record = (v: unknown): NativeSourceRow =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as NativeSourceRow) : {};

export async function readPhaseCaptureSnapshot(
  db: ExactSourceQuery,
  cohort: PhaseCaptureCohort,
  verifyActor: (person: NativeSourceRow) => Promise<boolean>,
) {
  const { rows: moves } = await db.query(
    "SELECT e.id,e.client_id,e.current_phase,e.deleted_at,e.archived_at,c.tenant_key,c.slug FROM public.engagements e JOIN public.clients c ON c.id=e.client_id WHERE e.id=$1::uuid AND e.client_id=$2::uuid",
    [cohort.moveId, cohort.clientId],
  );
  if (
    moves.length !== 1 ||
    moves[0].current_phase !== cohort.expectedCurrentPhase ||
    moves[0].deleted_at !== null ||
    moves[0].archived_at !== null ||
    canonicalTenantKey(String(moves[0].tenant_key)) !== cohort.clientKey ||
    canonicalTenantKey(String(moves[0].slug)) !== cohort.clientKey
  )
    throw new Error("source_capture_move_changed");
  const { rows: people } = await db.query(
    "SELECT id,graph_node_id,email FROM public.persons WHERE id=$1::uuid",
    [cohort.operatorPersonId],
  );
  if (people.length !== 1 || !(await verifyActor(people[0])))
    throw new Error("source_actor_unbound");
  const { rows } = await db.query(
    `SELECT ${captureColumns.join(",")} FROM public.program_modules WHERE engagement_id=$1::uuid AND id=ANY($2::uuid[]) ORDER BY id`,
    [cohort.moveId, cohort.sources.map((s) => s.moduleId)],
  );
  const { rows: readiness } = await db.query(
    "SELECT * FROM public.governed_object_readiness WHERE object_table='program_modules' AND client_key=$1 AND tenant_id=$2 AND object_id=ANY($3::text[])",
    [cohort.clientKey, cohort.clientId, cohort.sources.map((s) => s.moduleId)],
  );
  return { move: moves[0], rows, readiness, actorVerified: true as const };
}

/** Same selected native row and revision contract consumed by the evidence assembler. */
export function preparePhaseCapturePlan(
  raw: unknown,
  snapshot: Awaited<ReturnType<typeof readPhaseCaptureSnapshot>>,
  manifest: DatasetManifest,
  inspectBoundReadiness = false,
) {
  const cohort = PhaseCaptureCohortSchema.parse(raw);
  if (
    !isCanonicalClientKey(cohort.clientKey) ||
    canonicalTenantKey(cohort.nativeTenantKey) !== cohort.clientKey ||
    !validateManifest(manifest).ok ||
    manifest.dataset_id !== CAPTURE_DATASET_ID ||
    manifest.source_layer !== "move" ||
    manifest.classification !== "internal" ||
    manifest.tenant_scope !== "move_registry" ||
    manifest.retrieval_plan !== "azure_ai_search" ||
    !manifest.retrieval_proof_required ||
    !snapshot.actorVerified ||
    snapshot.move.id !== cohort.moveId ||
    snapshot.move.client_id !== cohort.clientId ||
    snapshot.move.current_phase !== cohort.expectedCurrentPhase ||
    snapshot.rows.length !== cohort.sources.length ||
    new Set(cohort.sources.map((s) => s.moduleId)).size !==
      cohort.sources.length ||
    (!inspectBoundReadiness && snapshot.readiness.length)
  )
    throw new Error("source_capture_scope_changed");
  const sources = cohort.sources.map((expected) => {
    const rawRow = snapshot.rows.find((row) => row.id === expected.moduleId);
    if (!rawRow || captureColumns.some((key) => !(key in rawRow)))
      throw new Error("source_capture_missing");
    const row = Object.fromEntries(
      captureColumns.map((key) => [
        key,
        key.endsWith("_at") ? storedTimestamp(rawRow[key]) : rawRow[key],
      ]),
    );
    const state = record(row.state_jsonb),
      value = state.value;
    if (
      row.engagement_id !== cohort.moveId ||
      row.phase_number !== expected.phase ||
      expected.phase > cohort.expectedCurrentPhase ||
      !String(row.module_key).startsWith(`phase_${expected.phase}_`) ||
      !["completed", "in_progress"].includes(String(row.status)) ||
      typeof value !== "string" ||
      !value.trim() ||
      moveSourceRevision(row) !== expected.sourceRevision
    )
      throw new Error("source_capture_revision_changed");
    const changedAt = [row.completed_at, row.started_at, row.created_at]
      .map(storedTimestamp)
      .filter((v): v is string => v !== null)
      .sort()
      .at(-1);
    if (!changedAt) throw new Error("source_capture_timestamp_missing");
    const source: MoveAdmissionSource = {
      objectTable: "program_modules",
      objectId: expected.moduleId,
      clientKey: cohort.clientKey,
      tenantId: cohort.clientId,
      sourceLayer: "move",
      sourceFile: `program_modules:${expected.moduleId}`,
      changedAt,
      binding: {
        version: 1,
        move_id: cohort.moveId,
        phase: expected.phase,
        source_revision_sha256: expected.sourceRevision,
      },
      citations: [expected.moduleId],
    };
    const originalBytes = JSON.stringify(row, null, 2) + "\n",
      sourceSha256 = createHash("sha256").update(originalBytes).digest("hex");
    const basePath = `/api/v1/programs/${cohort.moveId}/source-capture-proof?moduleId=${expected.moduleId}&revision=${expected.sourceRevision}`;
    const downloadPath = `${basePath}&download=1`,
      quote = value.slice(0, 500),
      locator = `P${expected.phase} saved answer: ${String(state.label ?? row.module_name)}`;
    const parts: Array<{ key: string; body: string }> = [];
    const chars = Array.from(originalBytes);
    for (let i = 0; i < chars.length; i += 4000)
      parts.push({
        key: `body:${i / 4000}`,
        body: chars.slice(i, i + 4000).join(""),
      });
    parts.push({ key: "quote:0", body: quote });
    const documents = parts.map((part, index) =>
      toTenantContextSearchDocument({
        client_id: cohort.clientId,
        tenant_key: cohort.clientKey,
        chunk_id: `move-capture:${cohort.moveId}:${expected.moduleId}:${expected.sourceRevision}:${part.key}`,
        source_segment_id: "move_reviewed_source",
        source_record_id: `${cohort.moveId}:${expected.moduleId}:P${expected.phase}`,
        source_doc: locator,
        source_path: downloadPath,
        chunk_index: index,
        chunk_text: part.body,
        lifecycle_state: "active",
        embedded_at: changedAt,
        source_file_id: null,
        source_row_number: null,
        agent_readiness_status: "not_reviewed",
        provenance: {
          source_basis: manifest.source_basis,
          source_citation: source.sourceFile,
          classification: "internal",
        },
        chunk_metadata: {
          confidence: 0,
          source_basis: manifest.source_basis,
          source_citation: source.sourceFile,
          classification: "internal",
        },
      } as EnterpriseContextChunkRow),
    );
    for (const doc of documents) {
      doc.confidence_level = "unverified";
      doc.source_row_number = null;
    }
    return {
      expected: { sourceSha256 },
      admissionSource: source,
      eligible: true,
      documents,
      quote,
      locator,
      citationDocumentId: documents.at(-1)!.id,
      downloadPath,
      originalBytes,
      proofPath: basePath,
    };
  });
  const documents = sources.flatMap((s) => s.documents);
  if (
    !documents.length ||
    documents.length > 1000 ||
    new Set(documents.map((d) => d.id)).size !== documents.length
  )
    throw new Error("source_capture_index_size_invalid");
  if (inspectBoundReadiness) {
    const seen = new Set();
    for (const row of snapshot.readiness) {
      const source = sources.find(
        (s) => s.admissionSource.objectId === row.object_id,
      )?.admissionSource;
      if (
        !source ||
        seen.has(source.objectId) ||
        row.object_table !== source.objectTable ||
        row.client_key !== cohort.clientKey ||
        row.tenant_id !== cohort.clientId ||
        moveSourceRevision(record(row.provenance).move_source_binding) !==
          moveSourceRevision(source.binding)
      )
        throw new Error("source_readiness_binding_changed");
      seen.add(source.objectId);
    }
  }
  return {
    version: 1 as const,
    datasetId: cohort.datasetId,
    cohort,
    sources,
    documents,
    sourceSetHash: moveSourceRevision({
      cohort,
      sources: sources.map((s) => s.admissionSource.binding),
      documents,
    }),
    beforeReadiness: snapshot.readiness,
    mode: "plan" as const,
  };
}
