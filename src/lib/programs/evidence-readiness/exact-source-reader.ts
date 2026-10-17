import "server-only";
import { createHash } from "node:crypto";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { reviewedEvidenceAdmissionSource } from "../move-agent-admission";
import { downloadArtifactOutcome } from "@/lib/programs/deliverables/move-artifacts";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { ExactSourceCohortSchema, type ExactSourceCohort, type ExactSourceSnapshot, type NativeSourceRow } from "./exact-source-preparation";

export interface ExactSourceQuery {
  query(sql:string,values:unknown[]): Promise<{ rows: NativeSourceRow[] }>;
}
export async function readExactSourceSnapshot(db: ExactSourceQuery, raw: unknown, download = downloadArtifactOutcome, verifyActor?: (person:NativeSourceRow)=>Promise<boolean>): Promise<ExactSourceSnapshot> {
  const cohort = ExactSourceCohortSchema.parse(raw);
  const { rows:moves } = await db.query("SELECT id,client_id,current_phase,deleted_at,archived_at FROM public.engagements WHERE id=$1::uuid AND client_id::text=$2::uuid::text",[cohort.moveId,cohort.clientId]);
  if (moves.length!==1 || moves[0].current_phase!==cohort.expectedCurrentPhase || moves[0].deleted_at!==null || moves[0].archived_at!==null) throw new Error("source_move_changed");
  const { rows:people } = await db.query("SELECT id,graph_node_id,email FROM public.persons WHERE id=$1::uuid",[cohort.operatorPersonId]);
  if (people.length!==1 || (people[0].graph_node_id!==`clerk:${cohort.operatorClerkId}` && !(await verifyActor?.(people[0])))) throw new Error("source_actor_unbound");
  const { rows } = await db.query(`SELECT row_to_json(e) AS evidence,row_to_json(r) AS review,row_to_json(a) AS artifact,r.updated_at::text AS review_updated_at_db_text
    FROM public.program_evidence_items e
    LEFT JOIN public.program_evidence_reviews r ON r.evidence_id::text=e.id::text AND r.program_id::text=$1::uuid::text AND r.tenant_key=ANY($3::text[])
    LEFT JOIN public.move_artifacts a ON a.artifact_id::text=r.source_ref->>'move_artifact_id' AND a.move_id::text=$1::uuid::text AND a.tenant_id::text=$2::uuid::text
    WHERE e.program_id::text=$1::uuid::text AND e.tenant_key=ANY($3::text[]) AND e.id::text=ANY($4::text[])`,[cohort.moveId,cohort.clientId,tenantAliasesFor(cohort.clientKey),cohort.sources.map(source=>source.evidenceId)]);
  if (rows.length!==cohort.sources.length) throw new Error("source_row_missing_or_duplicate");
  const { rows:history } = await db.query(`SELECT artifact_id,tenant_id,tenant_key,move_id,file_name,version,lifecycle_state,supersedes_artifact_id,superseded_by_artifact_id,blob_sha256,metadata
    FROM public.move_artifacts WHERE move_id::text=$1::uuid::text AND tenant_id::text=$2::uuid::text AND file_name=ANY($3::text[])`,[cohort.moveId,cohort.clientId,cohort.sources.map(source=>source.filename)]);
  const { rows:readiness } = await db.query(`SELECT * FROM public.governed_object_readiness WHERE object_table='program_evidence_items' AND client_key=$1::text AND tenant_id=$2::uuid::text AND object_id=ANY($3::text[])`,[cohort.clientKey,cohort.clientId,cohort.sources.map(source=>source.evidenceId)]);
  const ctx = { clientId:cohort.clientId,clientKey:cohort.nativeTenantKey,userId:cohort.operatorPersonId,clerkUserId:cohort.operatorClerkId } as TenancyCtx;
  const sources: ExactSourceSnapshot["rows"] = [];
  for (const row of rows) {
    const evidence = row.evidence as NativeSourceRow | null;
    const review = row.review as NativeSourceRow | null;
    const artifact = row.artifact as NativeSourceRow | null;
    const expected = cohort.sources.find(source=>source.evidenceId===evidence?.id);
    if (!expected || !review || !artifact || artifact.artifact_id!==expected.artifactId || artifact.version!==expected.artifactVersion || artifact.blob_sha256!==expected.sourceSha256 || review.id!==expected.reviewId || evidence?.phase!==expected.phase || review.decision!=="approved") throw new Error("source_version_or_review_changed");
    if (!reviewedEvidenceAdmissionSource({clientKey:cohort.clientKey,tenantId:cohort.clientId,moveId:cohort.moveId,evidence:evidence!,review,artifact}) || canonicalTenantKey(String(artifact.tenant_key))!==cohort.clientKey) throw new Error("source_tenant_unbound");
    const outcome = await download({...ctx,clientKey:String(artifact.tenant_key)},expected.artifactId,cohort.moveId);
    if (!outcome.ok) throw new Error("source_original_blob_unreadable");
    if (outcome.file.bytes.length>10*1024*1024) throw new Error("source_original_blob_too_large");
    const originalBlobSha256 = createHash("sha256").update(outcome.file.bytes).digest("hex");
    if (originalBlobSha256!==expected.sourceSha256) throw new Error("source_original_blob_changed");
    sources.push({ evidence:evidence!,review,artifact,reviewUpdatedAtDbText:String(row.review_updated_at_db_text),originalBlobSha256 });
  }
  return { move:moves[0],person:people[0],rows:sources,history,readiness,readComplete:true,authenticatedActor:{personId:cohort.operatorPersonId,clerkId:cohort.operatorClerkId} };
}

/** Build a single-source proof request from authenticated native identity. */
export async function resolveSourceProofCohort(db: ExactSourceQuery, args: {
  clientId:string;clientKey:string;nativeTenantKey:string;moveId:string;evidenceId:string;personId:string;clerkId:string;
}): Promise<ExactSourceCohort> {
  const { rows } = await db.query(`SELECT e.id,e.phase,r.id AS review_id,r.updated_at::text AS review_updated_at_db_text,r.source_ref,a.artifact_id,a.version,a.file_name,a.blob_sha256,p.current_phase
    FROM public.engagements p JOIN public.program_evidence_items e ON e.program_id::text=p.id::text AND e.tenant_key=ANY($3::text[])
    JOIN public.program_evidence_reviews r ON r.evidence_id::text=e.id::text AND r.program_id::text=p.id::text AND r.tenant_key=ANY($3::text[])
    JOIN public.move_artifacts a ON a.artifact_id::text=r.source_ref->>'move_artifact_id' AND a.move_id::text=p.id::text AND a.tenant_id::text=$2::uuid::text
    WHERE p.id=$1::uuid AND p.client_id::text=$2::uuid::text AND e.id::text=$4::uuid::text AND p.deleted_at IS NULL AND p.archived_at IS NULL`,[args.moveId,args.clientId,tenantAliasesFor(args.clientKey),args.evidenceId]);
  if (rows.length!==1) throw new Error("source_row_missing_or_duplicate");
  const row=rows[0];
  if (Number(row.phase)>Number(row.current_phase)) throw new Error("source_future_phase");
  const { reviewedLedgerDigest,EXACT_SOURCE_DATASET_ID } = await import("./exact-source-preparation");
  const sourceRef=row.source_ref as NativeSourceRow;
  return ExactSourceCohortSchema.parse({version:1,datasetId:EXACT_SOURCE_DATASET_ID,clientKey:args.clientKey,nativeTenantKey:args.nativeTenantKey,clientId:args.clientId,moveId:args.moveId,expectedCurrentPhase:row.current_phase,operatorPersonId:args.personId,operatorClerkId:args.clerkId,expectedReadiness:"absent",sources:[{evidenceId:row.id,artifactId:row.artifact_id,reviewId:row.review_id,artifactVersion:row.version,phase:row.phase,filename:row.file_name,sourceSha256:row.blob_sha256,reviewUpdatedAt:row.review_updated_at_db_text,ledgerExtractionSha256:reviewedLedgerDigest(sourceRef.reviewed_extraction)}]});
}
