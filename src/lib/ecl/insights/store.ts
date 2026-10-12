import type { JobDatabase } from "../../../../scripts/ecl/synthetic_enterprise_home_job";
import { GovernedObjectSchema, POLICY_VERSION } from "@/lib/governance/context-corpus-policy";
import { resolveLoadApproval, validateManifestRegistry } from "@/lib/governance/dataset-manifest";
import type { ApprovalEvidenceContext } from "@/lib/governance/delegated-approval";
import { insightLoadBinding } from "./load-approval";
import { insightHash } from "./engine";
import type { InsightFinding, InsightPlan } from "./types";

export function candidateGovernance(plan: InsightPlan, finding: InsightFinding, runId: string) {
  return GovernedObjectSchema.parse({
    id: finding.id, tenant_id: plan.tenantKey, client_key: plan.tenantKey,
    object_type: "enterprise_insight", source_layer: "signal", industry: null,
    enterprise_area: "cross_enterprise", function: null, process_area: null,
    use_case_category: null, source_basis: `deterministic:${finding.ruleKey}:${plan.ruleSetHash}`,
    source_references: finding.sourceRecordIds.map((id) => `ecl_source.source_record:${id}`),
    classification: "confidential", compliance_basis: null,
    agent_readiness_status: "not_reviewed", retrievability: "not_indexed",
    confidence_level: null, confidence_rationale: "Reproducible candidate; no human review or confidence attestation.",
    cited_render_verified_at: null, last_reviewed_at: null, owner: "Enterprise context operations",
    measurement_method: finding.ruleKey, provenance: {
      source_file: `canonical-assessment:${plan.assessmentId}:${plan.sourceSetHash}`,
      ingestion_run_id: runId, parse_method: "deterministic-rule-v1",
    }, policy_version: POLICY_VERSION, contract_hash: insightHash(finding), created_at: null, updated_at: null,
  });
}

/** Must be called inside the same serializable transaction that read the input. */
export async function persistInsightCandidates(
  db: JobDatabase,
  plan: InsightPlan,
  options: {
    datasetId: string; manifests: unknown[]; recordExists: (path: string) => boolean;
    runId: string; releaseRecord: string; jobRecord: Record<string, unknown>;
    approvalEvidence?: ApprovalEvidenceContext;
  },
): Promise<{ findings: number; idempotentReplay: boolean }> {
  const registryErrors = validateManifestRegistry(options.manifests.map((raw, i) => ({ file: String(i), raw })), options.recordExists);
  if (registryErrors.length) throw new Error(`Manifest registry refused: ${registryErrors.join("; ")}`);
  const approval = resolveLoadApproval(options.manifests,
    insightLoadBinding(plan, options.datasetId, options.releaseRecord),
    options.approvalEvidence);
  if (!approval.approved) throw new Error(`Load approval refused: ${approval.reasons.join("; ")}`);
  if (approval.approval.release_record !== options.releaseRecord) throw new Error("Approval release record mismatch");
  await db.query(
    `insert into ecl_projection.enterprise_insight_release
       (id, tenant_key, assessment_id, dataset_id, as_of, source_set_hash, rule_set_hash,
        result_hash, expected_finding_count, first_run_id, release_record, job_record_json,
        inventory_json, evaluations_json, load_version_hash)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15)
     on conflict (tenant_key, assessment_id, id) do nothing`,
    [plan.releaseId, plan.tenantKey, plan.assessmentId, options.datasetId, plan.asOf,
      plan.sourceSetHash, plan.ruleSetHash, plan.resultHash, plan.findings.length, options.runId,
      options.releaseRecord, JSON.stringify(options.jobRecord), JSON.stringify(plan.inventory), JSON.stringify(plan.evaluations), plan.loadVersionHash]);
  const release = await db.query<{ result_hash: string; source_set_hash: string; rule_set_hash: string; first_run_id: string; dataset_id: string; load_version_hash: string }>(
    `select result_hash, source_set_hash, rule_set_hash, first_run_id, dataset_id, load_version_hash
     from ecl_projection.enterprise_insight_release where tenant_key=$1 and assessment_id=$2 and id=$3`,
    [plan.tenantKey, plan.assessmentId, plan.releaseId]);
  if (release.rows.length !== 1 || release.rows[0].result_hash !== plan.resultHash ||
    release.rows[0].source_set_hash !== plan.sourceSetHash || release.rows[0].rule_set_hash !== plan.ruleSetHash ||
    release.rows[0].dataset_id !== options.datasetId || release.rows[0].load_version_hash !== plan.loadVersionHash) throw new Error("Existing insight release does not match the candidate");
  for (const finding of plan.findings) {
    const governance = candidateGovernance(plan, finding, release.rows[0].first_run_id);
    await db.query(
      `insert into ecl_projection.enterprise_insight_finding
       (id, tenant_key, assessment_id, release_id, rule_key, finding_kind, headline, detail,
        finding_hash, payload_json, governance_json)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb)
       on conflict (tenant_key, assessment_id, id) do nothing`,
      [finding.id, plan.tenantKey, plan.assessmentId, plan.releaseId, finding.ruleKey, finding.kind,
        finding.headline, finding.detail, insightHash(finding), JSON.stringify(finding), JSON.stringify(governance)]);
    for (const [table, column, ids] of [
      ["enterprise_insight_object_ref", "object_id", finding.objectIds],
      ["enterprise_insight_relationship_ref", "relationship_id", finding.relationshipIds],
      ["enterprise_insight_measure_ref", "measure_id", finding.measureIds],
      ["enterprise_insight_source_ref", "source_record_id", finding.sourceRecordIds],
      ["enterprise_insight_cube_ref", "cube_slice_id", finding.cubeSliceIds],
    ] as const) {
      for (const id of ids) await db.query(
        `insert into ecl_projection.${table} (tenant_key, assessment_id, finding_id, ${column})
         values ($1,$2,$3,$4) on conflict do nothing`, [plan.tenantKey, plan.assessmentId, finding.id, id]);
    }
  }
  const count = await verifyInsightCandidates(db, plan, release.rows[0].first_run_id);
  return { findings: count, idempotentReplay: release.rows[0].first_run_id !== options.runId };
}

export async function verifyInsightCandidates(db: JobDatabase, plan: InsightPlan, firstRunId: string): Promise<number> {
  return (await readInsightCandidateContent(db, plan, firstRunId)).findings;
}

export async function readInsightCandidateContent(db: JobDatabase, plan: InsightPlan, firstRunId: string) {
  const stored = await db.query<{ id: string; finding_hash: string; payload_json: InsightFinding; governance_json: unknown }>(
    `select id::text, finding_hash, payload_json, governance_json from ecl_projection.enterprise_insight_finding
     where tenant_key=$1 and assessment_id=$2 and release_id=$3 order by id`,
    [plan.tenantKey, plan.assessmentId, plan.releaseId]);
  if (stored.rows.length !== plan.findings.length || stored.rows.some((row, index) =>
    row.id !== plan.findings[index].id || row.finding_hash !== insightHash(plan.findings[index]) ||
    insightHash(row.payload_json) !== insightHash(plan.findings[index]) ||
    insightHash(row.governance_json) !== insightHash(candidateGovernance(plan, plan.findings[index], firstRunId)))) {
    throw new Error("Insight content readback failed");
  }
  const findingComparisons = stored.rows.map((row, index) => ({
    id: row.id,
    expectedFindingHash: insightHash(plan.findings[index]),
    storedFindingHash: row.finding_hash,
    actualPayloadHash: insightHash(row.payload_json),
    expectedGovernanceHash: insightHash(candidateGovernance(plan, plan.findings[index], firstRunId)),
    actualGovernanceHash: insightHash(row.governance_json),
  }));
  const lineageComparisons: Array<{ table: string; expectedCount: number; actualCount: number; expectedHash: string; actualHash: string }> = [];
  for (const [table, column, key] of [
    ["enterprise_insight_object_ref", "object_id", "objectIds"],
    ["enterprise_insight_relationship_ref", "relationship_id", "relationshipIds"],
    ["enterprise_insight_measure_ref", "measure_id", "measureIds"],
    ["enterprise_insight_source_ref", "source_record_id", "sourceRecordIds"],
    ["enterprise_insight_cube_ref", "cube_slice_id", "cubeSliceIds"],
  ] as const) {
    const refs = await db.query<{ finding_id: string; ref_id: string }>(
      `select r.finding_id::text, r.${column}::text as ref_id from ecl_projection.${table} r
       join ecl_projection.enterprise_insight_finding f
         on f.tenant_key=r.tenant_key and f.assessment_id=r.assessment_id and f.id=r.finding_id
       where f.tenant_key=$1 and f.assessment_id=$2 and f.release_id=$3`,
      [plan.tenantKey, plan.assessmentId, plan.releaseId]);
    const expected = plan.findings.flatMap((finding) => finding[key].map((ref_id) => ({ finding_id: finding.id, ref_id })));
    const order = (rows: typeof expected) => rows.sort((a, b) => `${a.finding_id}:${a.ref_id}`.localeCompare(`${b.finding_id}:${b.ref_id}`));
    const actualHash = insightHash(order(refs.rows));
    const expectedHash = insightHash(order(expected));
    if (actualHash !== expectedHash) throw new Error(`Insight lineage readback failed: ${table}`);
    lineageComparisons.push({ table, expectedCount: expected.length, actualCount: refs.rows.length, expectedHash, actualHash });
  }
  return { findings: stored.rows.length, findingComparisons, lineageComparisons };
}
