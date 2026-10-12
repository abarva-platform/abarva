import {
  DatasetManifestSchema,
  type LoadBinding,
} from "@/lib/governance/dataset-manifest";
import {
  loadDelegationEvidence,
  type ApprovalEvidenceContext,
} from "@/lib/governance/delegated-approval";
import type { ProofStore } from "../../../../scripts/ecl/synthetic_enterprise_home_job";
import type { InsightPlan } from "./types";

export const INSIGHT_LOAD_BUILD_VERSION = "integrated-insights-v1";

export function insightLoadBinding(
  plan: InsightPlan,
  datasetId: string,
  releaseRecord: string,
): LoadBinding {
  return {
    dataset_id: datasetId,
    tenant_key: plan.tenantKey,
    assessment_id: plan.assessmentId,
    source_set_hash: plan.loadVersionHash,
    object_count: plan.findings.length,
    ingestion_method: "operator_aca_job",
    release_record: releaseRecord,
    extra_bindings: {
      build_version: INSIGHT_LOAD_BUILD_VERSION,
      release_id: plan.releaseId,
      as_of: plan.asOf,
      load_version_hash: plan.loadVersionHash,
      canonical_source_set_hash: plan.sourceSetHash,
      rule_set_hash: plan.ruleSetHash,
      result_hash: plan.resultHash,
      target_agent_ready: 0,
      target_review_state: "not_reviewed",
      target_state: "candidate",
    },
  };
}

/** Only the selected manifest may request authenticated private proof reads. */
export async function readInsightLoadEvidence(
  manifests: unknown[],
  datasetId: string,
  store: ProofStore,
): Promise<ApprovalEvidenceContext | undefined> {
  const selected = manifests.filter(
    (item) => (item as { dataset_id?: string } | null)?.dataset_id === datasetId,
  );
  if (selected.length !== 1) return undefined;
  const raw = selected[0] as { load_approval?: { delegated_decision?: unknown } };
  if (!raw.load_approval?.delegated_decision) return undefined;
  const manifest = DatasetManifestSchema.parse(raw);
  const declaration = manifest.load_approval!.delegated_decision!;
  const prefix = store.uriFor("operator-proof/delegated-approvals/");
  const read = async (uri: string) => {
    const url = new URL(uri);
    if (
      uri !== `${url.origin}${url.pathname}` ||
      url.protocol !== "https:" ||
      url.username || url.password ||
      !uri.startsWith(prefix) ||
      !/\/[a-f0-9]{64}\/(authority|decision)\.json$/.test(url.pathname) ||
      url.pathname.split("/").some((part) => part.includes("%"))
    ) throw new Error("Delegated insight proof is outside the private approval path");
    const bytes = await store.read(uri, 1_000_000);
    if (bytes.byteLength > 1_000_000)
      throw new Error("Delegated insight proof exceeds its size limit");
    return bytes;
  };
  return loadDelegationEvidence([declaration], read);
}
