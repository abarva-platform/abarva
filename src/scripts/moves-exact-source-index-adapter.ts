import "server-only";
import { collectFailedIndexResults } from "@/lib/azure-search/index-results";
import { resolveLoadApproval, type DatasetManifest } from "@/lib/governance/dataset-manifest";
import type { ApprovalEvidenceContext } from "@/lib/governance/delegated-approval";
import { moveSourceRevision } from "@/lib/programs/move-agent-admission";
import { verifyExactIndexedDocuments,type ExactSourcePlan,type NativeSourceRow } from "@/lib/programs/evidence-readiness/exact-source-preparation";

export function scopedIndexRowDiff(plan:ExactSourcePlan,before:readonly NativeSourceRow[]) {
  if (new Set(before.map(row=>row.id)).size!==before.length || before.some(row=>!plan.documents.some(doc=>doc.id===row.id))) throw new Error("source_index_before_state_unbound");
  const existing=plan.documents.filter(doc=>before.some(row=>row.id===doc.id));
  verifyExactIndexedDocuments(existing,before);
  const create=plan.documents.filter(doc=>!before.some(row=>row.id===doc.id));
  return { create,unchanged:existing.map(doc=>doc.id),delete:[] as never[],sourceWrites:[] as never[],readinessWrites:[] as never[],rollback:{newOwnedIdsOnly:create.map(doc=>doc.id),expectedDocuments:create} };
}

export async function applyApprovedExactSourceIndex(args: {
  plan:ExactSourcePlan;manifest:DatasetManifest;releaseRecord:string;evidence?:ApprovalEvidenceContext;
  replan:()=>Promise<ExactSourcePlan>;readBefore:()=>Promise<NativeSourceRow[]>;
  upload:(documents:ExactSourcePlan["documents"])=>Promise<unknown>;
}) {
  const {plan}=args;
  const decision=resolveLoadApproval([args.manifest],{dataset_id:plan.datasetId,tenant_key:plan.cohort.clientKey,assessment_id:plan.cohort.moveId,move_id:plan.cohort.moveId,source_set_hash:plan.sourceSetHash,object_count:plan.sources.filter(source=>source.eligible).length,ingestion_method:"operator_aca_job",release_record:args.releaseRecord},args.evidence);
  if (!decision.approved) throw new Error(`source_index_load_not_approved:${decision.reasons.join(";")}`);
  const fresh=await args.replan();
  if (fresh.sourceSetHash!==plan.sourceSetHash || moveSourceRevision(fresh.documents)!==moveSourceRevision(plan.documents)) throw new Error("source_changed_before_index");
  const diff=scopedIndexRowDiff(fresh,await args.readBefore());
  if (!diff.create.length) return {mode:"idempotent",createdIds:[],rowDiff:diff};
  const body=await args.upload(diff.create) as {value?:Array<{key?:string;status?:boolean}>};
  const failed=collectFailedIndexResults(body);
  if (!Array.isArray(body?.value) || body.value.length!==diff.create.length || new Set(body.value.map(row=>row.key)).size!==diff.create.length || body.value.some(row=>!diff.create.some(doc=>doc.id===row.key)||row.status!==true) || failed.length) throw new Error("source_index_partial_or_unverified_result");
  const after=await args.replan();
  if (after.sourceSetHash!==plan.sourceSetHash) throw new Error("source_changed_during_index");
  return {mode:"index_submission_unverified",createdIds:diff.create.map(doc=>doc.id),rowDiff:diff};
}
