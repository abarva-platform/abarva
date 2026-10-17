import "server-only";
import {
  resolveLoadApproval,
  type DatasetManifest,
} from "@/lib/governance/dataset-manifest";
import type { ApprovalEvidenceContext } from "@/lib/governance/delegated-approval";
import {
  verifyExactIndexedDocuments,
  type ExactSourcePlan,
  type NativeSourceRow,
} from "@/lib/programs/evidence-readiness/exact-source-preparation";
import { moveSourceRevision } from "@/lib/programs/move-agent-admission";
export type SourceIndexPlan = Pick<
  ExactSourcePlan,
  "datasetId" | "sourceSetHash" | "documents"
> & {
  cohort: Pick<ExactSourcePlan["cohort"], "moveId" | "clientKey">;
  sources: Array<{ eligible: boolean }>;
};

export function scopedIndexRowDiff(
  plan: SourceIndexPlan,
  before: readonly NativeSourceRow[],
) {
  if (
    new Set(before.map((row) => row.id)).size !== before.length ||
    before.some((row) => !plan.documents.some((doc) => doc.id === row.id))
  )
    throw new Error("source_index_before_state_unbound");
  const existing = plan.documents.filter((doc) =>
    before.some((row) => row.id === doc.id),
  );
  verifyExactIndexedDocuments(existing, before);
  const create = plan.documents.filter(
    (doc) => !before.some((row) => row.id === doc.id),
  );
  return {
    mode: "read_only_index_plan" as const,
    proposedMissingDocuments: create,
    creationGuaranteed: false,
    unchanged: existing.map((doc) => doc.id),
    delete: [] as never[],
    sourceWrites: [] as never[],
    readinessWrites: [] as never[],
    rollback: {
      plannedIdsNotOwned: create.map((doc) => doc.id),
      ownedIds: [] as never[],
      deleteAllowed: false,
    },
  };
}

export async function applyApprovedExactSourceIndex(args: {
  plan: SourceIndexPlan;
  manifest: DatasetManifest;
  releaseRecord: string;
  evidence?: ApprovalEvidenceContext;
  replan: () => Promise<SourceIndexPlan>;
  readBefore: () => Promise<NativeSourceRow[]>;
  upload: (documents: ExactSourcePlan["documents"]) => Promise<unknown>;
  serialize?: <T>(work: () => Promise<T>) => Promise<T>;
  auditUpload?: (receipt: unknown) => Promise<void>;
}) {
  const { plan } = args;
  const decision = resolveLoadApproval(
    [args.manifest],
    {
      dataset_id: plan.datasetId,
      tenant_key: plan.cohort.clientKey,
      assessment_id: plan.cohort.moveId,
      move_id: plan.cohort.moveId,
      source_set_hash: plan.sourceSetHash,
      object_count: plan.sources.filter((source) => source.eligible).length,
      ingestion_method: "operator_aca_job",
      release_record: args.releaseRecord,
    },
    args.evidence,
  );
  if (!decision.approved)
    throw new Error(
      `source_index_load_not_approved:${decision.reasons.join(";")}`,
    );
  if (!args.serialize || !args.auditUpload)
    throw new Error("source_index_serialized_writer_required");
  return args.serialize(async () => {
    const fresh = await args.replan();
    if (
      fresh.sourceSetHash !== plan.sourceSetHash ||
      moveSourceRevision(fresh.documents) !== moveSourceRevision(plan.documents)
    )
      throw new Error("source_index_plan_changed");
    const diff = scopedIndexRowDiff(fresh, await args.readBefore());
    const missing = diff.proposedMissingDocuments;
    const createdIds: string[] = [];
    if (missing.length) {
      const receipt = await args.upload(missing);
      await args.auditUpload!(receipt);
      const rows = (
        receipt as {
          value?: Array<{ key: string; status: boolean; statusCode: number }>;
        }
      )?.value;
      if (
        !Array.isArray(rows) ||
        rows.length !== missing.length ||
        new Set(rows.map((r) => r.key)).size !== rows.length ||
        rows.some(
          (row) =>
            !missing.some((doc) => doc.id === row.key) ||
            row.status !== true ||
            row.statusCode !== 201,
        )
      )
        throw new Error("source_index_creation_not_proven");
      createdIds.push(...rows.map((row) => row.key));
    }
    verifyExactIndexedDocuments(fresh.documents, await args.readBefore());
    if ((await args.replan()).sourceSetHash !== plan.sourceSetHash)
      throw new Error("source_index_native_source_changed");
    return {
      status: "indexed" as const,
      sourceSetHash: plan.sourceSetHash,
      indexedAt: new Date().toISOString(),
      createdIds,
      unchangedIds: diff.unchanged,
      readinessWrites: 0,
      phaseWrites: 0,
      deleteAllowed: false,
    };
  });
}
