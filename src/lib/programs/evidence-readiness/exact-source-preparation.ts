import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { isCanonicalClientKey } from "@/lib/governance/context-corpus-policy";
import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import { validateManifest, type DatasetManifest } from "@/lib/governance/dataset-manifest";
import { toTenantContextSearchDocument, type EnterpriseContextChunkRow } from "@/lib/azure-search/tenant-context-backfill";
import type { SearchDocument } from "@/lib/azure-search/types";
import { reviewedExtractionFromStoredSourceRef } from "../evidence-review-contract";
import { reviewedEvidenceAdmissionSource, moveSourceRevision, MOVE_ADMISSION_EVIDENCE_COLUMNS, MOVE_ADMISSION_REVIEW_COLUMNS, MOVE_ADMISSION_ARTIFACT_COLUMNS, type MoveAdmissionSource } from "../move-agent-admission";

export const EXACT_SOURCE_DATASET_ID = "moves_reviewed_source_preparation_v1";
const sha = z.string().regex(/^[0-9a-f]{64}$/);
export const ExactSourceSchema = z.object({
  evidenceId: z.string().uuid(), artifactId: z.string().uuid(), reviewId: z.string().uuid(),
  artifactVersion: z.number().int().positive(), phase: z.number().int().min(0).max(5),
  filename: z.string().min(1).max(240), sourceSha256: sha,
  reviewUpdatedAt: z.string().min(1), ledgerExtractionSha256: sha,
}).strict();
export const ExactSourceCohortSchema = z.object({
  version: z.literal(1), datasetId: z.literal(EXACT_SOURCE_DATASET_ID),
  clientKey: z.string().min(1), nativeTenantKey: z.string().min(1), clientId: z.string().uuid(),
  moveId: z.string().uuid(), expectedCurrentPhase: z.number().int().min(0).max(5),
  operatorPersonId: z.string().uuid(), operatorClerkId: z.string().min(1),
  expectedReadiness: z.literal("absent"), sources: z.array(ExactSourceSchema).min(1).max(32),
}).strict();
export type ExactSourceCohort = z.infer<typeof ExactSourceCohortSchema>;
export function isDeclaredSyntheticSourceTenant(registry:unknown,clientKey:string):boolean {
  const schema=z.object({activeTenants:z.array(z.object({tenantKey:z.string(),packets:z.array(z.object({classification:z.string(),status:z.string()}))}))});
  const parsed=schema.safeParse(registry);
  return parsed.success && isCanonicalClientKey(clientKey) && parsed.data.activeTenants.some(tenant=>tenant.tenantKey===clientKey && tenant.packets.some(packet=>packet.classification==="synthetic-demo" && packet.status==="active-input"));
}
export type NativeSourceRow = Record<string, unknown>;
export interface ExactSourceSnapshot {
  move: NativeSourceRow; person: NativeSourceRow;
  rows: Array<{ evidence: NativeSourceRow; review: NativeSourceRow; artifact: NativeSourceRow; reviewUpdatedAtDbText: string; originalBlobSha256: string }>;
  history: NativeSourceRow[]; readiness: NativeSourceRow[];
  readComplete: true;
  authenticatedActor?: { personId:string;clerkId:string };
}
export interface PreparedSource {
  expected: z.infer<typeof ExactSourceSchema>; admissionSource: MoveAdmissionSource;
  eligible: boolean; documents: SearchDocument[]; quote: string; locator: string;
  citationDocumentId: string; downloadPath: string;
}
export interface ExactSourcePlan {
  version: 1; datasetId: string; cohort: ExactSourceCohort; sourceSetHash: string;
  sources: PreparedSource[]; documents: SearchDocument[];
  beforeReadiness: NativeSourceRow[]; readinessWrites: never[];
  rollback: { plannedIndexIdsNotOwned: string[]; ownedIndexIds: never[]; sourceAndReadinessWrites: false };
  modelCalls: 0; phaseWrites: 0; mode: "plan";
}

function object(value: unknown): NativeSourceRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("source_object_missing");
  return value as NativeSourceRow;
}
function requireColumns(row: NativeSourceRow, columns: readonly string[]) {
  if (columns.some(column => !Object.prototype.hasOwnProperty.call(row, column))) throw new Error("source_snapshot_incomplete");
}
/** Preserve PostgreSQL microseconds independently of the consumer's ISO digest. */
export function losslessReviewTimestamp(text: string): string {
  const match = text.match(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d:\d\d)(?:\.(\d{1,6}))?(Z|[+-]\d\d(?::?\d\d)?)$/);
  if (!match) throw new Error("review_timestamp_invalid");
  const zone = match[4] === "Z" ? "+00:00" : match[4].length === 3 ? `${match[4]}:00` : match[4].length === 5 ? `${match[4].slice(0,3)}:${match[4].slice(3)}` : match[4];
  const seconds = new Date(`${match[1]}T${match[2]}${zone}`);
  if (!Number.isFinite(seconds.getTime())) throw new Error("review_timestamp_invalid");
  return `${seconds.toISOString().slice(0,19)}.${(match[3] ?? "").padEnd(6,"0")}Z`;
}
/** The reviewed contract contains strings, arrays and an integer version. */
export function reviewedLedgerDigest(value: unknown): string {
  function canonical(v: unknown): unknown {
    if (typeof v === "number" && !Number.isSafeInteger(v)) throw new Error("ledger_numeric_encoding_unestablished");
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).sort(([a],[b]) => {
      const aa = Array.from(a, ch => ch.codePointAt(0)!); const bb = Array.from(b, ch => ch.codePointAt(0)!);
      for (let i=0;i<Math.min(aa.length,bb.length);i++) if (aa[i]!==bb[i]) return aa[i]-bb[i];
      return aa.length-bb.length;
    }).map(([k,n]) => [k,canonical(n)]));
    return v;
  }
  const ascii = JSON.stringify(canonical(value)).replace(/[\x7f-\uffff]/g, ch => `\\u${ch.charCodeAt(0).toString(16).padStart(4,"0")}`);
  return createHash("sha256").update(ascii,"utf8").digest("hex");
}

export function prepareExactSourcePlan(raw: unknown, snapshot: ExactSourceSnapshot, manifest: DatasetManifest, options: { inspectBoundReadiness?:boolean } = {}): ExactSourcePlan {
  const cohort = ExactSourceCohortSchema.parse(raw);
  const canonical = canonicalTenantKey(cohort.clientKey);
  if (canonical !== cohort.clientKey || !isCanonicalClientKey(canonical) || canonicalTenantKey(cohort.nativeTenantKey)!==canonical) throw new Error("source_tenant_unbound");
  if (!validateManifest(manifest).ok || manifest.dataset_id!==cohort.datasetId || manifest.tenant_scope!=="move_registry" || manifest.client_key!==null || manifest.classification!=="internal" || manifest.source_layer!=="uploaded_evidence" || manifest.retrieval_plan!=="azure_ai_search" || !manifest.retrieval_proof_required) throw new Error("source_manifest_unbound");
  if (!snapshot.readComplete || snapshot.move.id!==cohort.moveId || snapshot.move.client_id!==cohort.clientId || snapshot.move.current_phase!==cohort.expectedCurrentPhase || snapshot.move.deleted_at!==null || snapshot.move.archived_at!==null) throw new Error("source_move_changed");
  if (snapshot.person.id!==cohort.operatorPersonId || (snapshot.person.graph_node_id!==`clerk:${cohort.operatorClerkId}` && !(snapshot.authenticatedActor?.personId===cohort.operatorPersonId && snapshot.authenticatedActor.clerkId===cohort.operatorClerkId))) throw new Error("source_actor_unbound");
  for (const key of ["evidenceId","artifactId","reviewId","filename"] as const) if (new Set(cohort.sources.map(s=>s[key])).size!==cohort.sources.length) throw new Error("source_identity_duplicate");
  if (snapshot.rows.length!==cohort.sources.length || snapshot.history.length!==cohort.sources.length || (!options.inspectBoundReadiness && snapshot.readiness.length!==0)) throw new Error("source_before_state_changed");
  const sources = cohort.sources.map(expected => {
    const matches = snapshot.rows.filter(row=>row.evidence.id===expected.evidenceId);
    if (matches.length!==1) throw new Error("source_row_missing_or_duplicate");
    const row = matches[0];
    requireColumns(row.evidence,MOVE_ADMISSION_EVIDENCE_COLUMNS); requireColumns(row.review,MOVE_ADMISSION_REVIEW_COLUMNS); requireColumns(row.artifact,MOVE_ADMISSION_ARTIFACT_COLUMNS);
    const saved = object(row.review.source_ref).reviewed_extraction;
    const structured=object(row.evidence.extracted_structured??{});
    const classifications=[object(row.artifact.metadata).classification,structured.classification,(structured.governance as NativeSourceRow|undefined)?.classification].filter(value=>value!=null);
    if (classifications.some(value=>value!=="internal" && value!=="public")) throw new Error("source_classification_not_released");
    if (row.evidence.confidence!=null && (typeof row.evidence.confidence!=="number" || !Number.isFinite(row.evidence.confidence) || row.evidence.confidence<0 || row.evidence.confidence>1)) throw new Error("source_confidence_invalid");
    const reviewed = reviewedExtractionFromStoredSourceRef(row.review.source_ref);
    const whitespace=(value:string)=>value.replace(/\s+/gu," ").trim();
    if (!reviewed || typeof row.evidence.extracted_text!=="string" || !reviewed.structured.citations.every(citation=>whitespace(String(row.evidence.extracted_text)).includes(whitespace(citation.quote)))) throw new Error("source_quote_not_in_extraction");
    const history = snapshot.history.filter(item=>item.file_name===expected.filename);
    if (!reviewed || history.length!==1 || history[0].artifact_id!==expected.artifactId || history[0].version!==expected.artifactVersion || history[0].lifecycle_state!=="current" || history[0].supersedes_artifact_id!==null || history[0].superseded_by_artifact_id!==null || history[0].tenant_id!==cohort.clientId || history[0].move_id!==cohort.moveId || row.artifact.file_name!==expected.filename || row.artifact.artifact_id!==expected.artifactId || row.artifact.version!==expected.artifactVersion || row.evidence.phase!==expected.phase || row.review.id!==expected.reviewId || row.review.reviewed_by_user_id!==cohort.operatorPersonId || row.artifact.blob_sha256!==expected.sourceSha256 || row.originalBlobSha256!==expected.sourceSha256 || losslessReviewTimestamp(row.reviewUpdatedAtDbText)!==losslessReviewTimestamp(expected.reviewUpdatedAt) || reviewedLedgerDigest(saved)!==expected.ledgerExtractionSha256) throw new Error("source_version_or_review_changed");
    const source = reviewedEvidenceAdmissionSource({ clientKey:canonical,tenantId:cohort.clientId,moveId:cohort.moveId,...row });
    if (!source || !source.changedAt || !source.sourceFile || !reviewed.structured.citations.length) throw new Error("source_binding_or_citation_missing");
    const pending=buildValidatedAgentContextBundle([{id:source.objectId,client_key:source.clientKey,tenant_id:source.tenantId,source_layer:source.sourceLayer,source_basis:manifest.source_basis,classification:"internal",confidence_level:"unverified",retrievability:"not_indexed",agent_readiness_status:"not_reviewed",cited_render_verified_at:null,citations:source.citations}],{requireAgentReady:true});
    if (pending.usable.length!==0) throw new Error("source_preparation_minted_readiness");
    const downloadPath = `/api/v1/programs/${cohort.moveId}/artifacts/${expected.artifactId}/download?inline=1`;
    const recordId = `${cohort.moveId}:${expected.evidenceId}:P${expected.phase}`;
    const prefix = `move-source:${cohort.moveId}:${expected.evidenceId}:${source.binding.source_revision_sha256}`;
    const reviewedText = [reviewed.summary,...Object.values(reviewed.structured).flatMap(value => value.map(item=>typeof item==="string"?item:`${item.quote}\n${item.locator}`))].join("\n\n");
    const codePoints = Array.from(reviewedText);
    const parts: Array<{ key:string;body:string }> = [];
    for (let i=0;i<codePoints.length;i+=4000) parts.push({ key:`body:${i/4000}`,body:codePoints.slice(i,i+4000).join("") });
    const citation = reviewed.structured.citations[0];
    parts.push({ key:"quote:0",body:citation.quote });
    const documents = parts.map(part => {
      const chunk: EnterpriseContextChunkRow = { client_id:cohort.clientId,tenant_key:canonical,chunk_id:`${prefix}:${part.key}`,source_segment_id:"move_reviewed_source",source_record_id:recordId,source_doc:expected.filename,source_path:downloadPath,chunk_index:parts.indexOf(part),chunk_text:part.body,lifecycle_state:"active",embedded_at:source.changedAt,source_file_id:expected.artifactId,source_row_number:null,agent_readiness_status:"not_reviewed",provenance:{ source_basis:manifest.source_basis,source_citation:source.sourceFile,classification:"internal" },chunk_metadata:{ confidence:typeof row.evidence.confidence==="number"?row.evidence.confidence:0,source_basis:manifest.source_basis,source_citation:source.sourceFile,classification:"internal" } };
      return { ...toTenantContextSearchDocument(chunk), confidence:typeof row.evidence.confidence==="number"?row.evidence.confidence:null,confidence_level:"unverified",source_row_number:null };
    });
    return { expected,admissionSource:source,eligible:expected.phase<=cohort.expectedCurrentPhase,documents,quote:citation.quote,locator:citation.locator,citationDocumentId:documents.at(-1)!.id,downloadPath };
  });
  const documents = sources.filter(source=>source.eligible).flatMap(source=>source.documents);
  if (options.inspectBoundReadiness) {
    const seen=new Set<string>();
    for(const row of snapshot.readiness) {
      const source=sources.find(s=>s.admissionSource.objectId===row.object_id)?.admissionSource;
      if(!source || seen.has(source.objectId) || row.object_table!==source.objectTable || row.client_key!==source.clientKey || row.tenant_id!==source.tenantId || moveSourceRevision(object(row.provenance).move_source_binding)!==moveSourceRevision(source.binding)) throw new Error("source_readiness_binding_changed");
      seen.add(source.objectId);
    }
  }
  if (!documents.length || documents.length>1000 || new Set(documents.map(doc=>doc.id)).size!==documents.length) throw new Error("source_index_plan_empty_or_duplicate");
  return { version:1,datasetId:cohort.datasetId,cohort,sourceSetHash:moveSourceRevision({ cohort,sources:sources.map(s=>s.admissionSource.binding),documents }),sources,documents,beforeReadiness:snapshot.readiness,readinessWrites:[],rollback:{ plannedIndexIdsNotOwned:documents.map(doc=>doc.id),ownedIndexIds:[],sourceAndReadinessWrites:false },modelCalls:0,phaseWrites:0,mode:"plan" };
}

/** Compare the typed index instant at 100 ns precision; native review proof is separate. */
function indexedTimestampTicks(value:unknown):bigint|null {
  if (typeof value!=="string") return null;
  const match=value.match(/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d:\d\d)(?:\.(\d{1,7}))?(Z|[+-]\d\d:\d\d)$/);
  if (!match || Number(match[1].slice(0,4))<1) return null;
  const utcCalendar=new Date(`${match[1]}T${match[2]}Z`);
  if (!Number.isFinite(utcCalendar.getTime()) || utcCalendar.toISOString().slice(0,19)!==`${match[1]}T${match[2]}`) return null;
  if (match[4]!=="Z") {
    const hours=Number(match[4].slice(1,3)),minutes=Number(match[4].slice(4,6));
    if (hours>14 || minutes>59 || (hours===14 && minutes!==0)) return null;
  }
  const seconds=Date.parse(`${match[1]}T${match[2]}${match[4]}`);
  if (!Number.isFinite(seconds)) return null;
  return BigInt(seconds)*BigInt(10000)+BigInt((match[3]??"").padEnd(7,"0"));
}

export function verifyExactIndexedDocuments(expected: readonly SearchDocument[], actual: readonly NativeSourceRow[]) {
  if (actual.length!==expected.length || new Set(actual.map(row=>row.id)).size!==actual.length) throw new Error("source_index_membership_incomplete");
  for (const document of expected) {
    const found = actual.find(row=>row.id===document.id);
    if (!found || Object.entries(document).some(([key,value]) => {
      if (key==="@search.action") return false;
      if (!Object.prototype.hasOwnProperty.call(found,key)) return true;
      if (key==="last_seen_at") {
        const expectedTime=indexedTimestampTicks(value),actualTime=indexedTimestampTicks(found[key]);
        return expectedTime===null || actualTime===null || expectedTime!==actualTime;
      }
      return moveSourceRevision(found[key])!==moveSourceRevision(value);
    })) throw new Error("source_index_content_or_scope_changed");
  }
}

export function renderSourceCitationProof(source: PreparedSource, sourceSetHash: string): string {
  if (!source.eligible) throw new Error("source_future_phase");
  if (source.downloadPath!==`/api/v1/programs/${source.admissionSource.binding.move_id}/artifacts/${source.expected.artifactId}/download?inline=1`) throw new Error("source_link_unbound");
  const escape = (s:string)=>s.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[ch]!);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Source verification</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main data-source-proof="non-model" data-source-set-hash="${escape(sourceSetHash)}" data-source-revision="${escape(source.admissionSource.binding.source_revision_sha256)}" data-index-document="${escape(source.citationDocumentId)}"><h1>Source verification</h1><p>Reviewed synthetic source. Business facts are not independently client-attested.</p><h2>${escape(source.expected.filename)}</h2><blockquote data-retrieved-quote>${escape(source.quote)}</blockquote><p>${escape(source.locator)}</p><a data-original-source href="${escape(source.downloadPath)}">Open original file</a><p>This view verifies a retrieved citation. It does not grant model readiness or approve a phase.</p></main></body></html>`;
}
