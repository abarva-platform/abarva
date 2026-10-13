import "server-only";
import { resolveLoadApproval, type DatasetManifest } from "@/lib/governance/dataset-manifest";
import type { ApprovalEvidenceContext } from "@/lib/governance/delegated-approval";
import { verifyExactIndexedDocuments,type ExactSourcePlan,type NativeSourceRow } from "@/lib/programs/evidence-readiness/exact-source-preparation";

export function scopedIndexRowDiff(plan:ExactSourcePlan,before:readonly NativeSourceRow[]) {
  if (new Set(before.map(row=>row.id)).size!==before.length || before.some(row=>!plan.documents.some(doc=>doc.id===row.id))) throw new Error("source_index_before_state_unbound");
  const existing=plan.documents.filter(doc=>before.some(row=>row.id===doc.id));
  verifyExactIndexedDocuments(existing,before);
  const create=plan.documents.filter(doc=>!before.some(row=>row.id===doc.id));
  return { mode:"read_only_index_plan" as const,proposedMissingDocuments:create,creationGuaranteed:false,unchanged:existing.map(doc=>doc.id),delete:[] as never[],sourceWrites:[] as never[],readinessWrites:[] as never[],rollback:{plannedIdsNotOwned:create.map(doc=>doc.id),ownedIds:[] as never[],deleteAllowed:false} };
}

export async function applyApprovedExactSourceIndex(args: {
  plan:ExactSourcePlan;manifest:DatasetManifest;releaseRecord:string;evidence?:ApprovalEvidenceContext;
  replan:()=>Promise<ExactSourcePlan>;readBefore:()=>Promise<NativeSourceRow[]>;
  upload:(documents:ExactSourcePlan["documents"])=>Promise<unknown>;
}) {
  const {plan}=args;
  const decision=resolveLoadApproval([args.manifest],{dataset_id:plan.datasetId,tenant_key:plan.cohort.clientKey,assessment_id:plan.cohort.moveId,move_id:plan.cohort.moveId,source_set_hash:plan.sourceSetHash,object_count:plan.sources.filter(source=>source.eligible).length,ingestion_method:"operator_aca_job",release_record:args.releaseRecord},args.evidence);
  if (!decision.approved) throw new Error(`source_index_load_not_approved:${decision.reasons.join(";")}`);
  // Azure upload can replace a raced document. Approval is not atomic ownership.
  // A separately reviewed serialized writer and creation proof are prerequisites.
  throw new Error("source_index_write_capability_unreleased");
}
