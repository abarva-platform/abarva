import "server-only";
import { NextRequest } from "next/server";
import { GET as readValueCase } from "@/app/api/v1/programs/[programId]/value-case/route";
import { getModuleState, getPhaseSnapshots, getProgramById } from "./queries";
import { phaseApprovalMatchesEvidence } from "./phase-gate-evidence-binding";
import { loadApprovedMoveEvidenceSnapshot } from "./approved-move-evidence-snapshot";
import { readValueModel } from "./value-model-capture";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  POLICY_VERSION,
  evaluateGovernedObject,
  type GovernedObject,
} from "@/lib/governance/context-corpus-policy";
import {
  P5_HANDOFF_DATASET,
  P5HandoffRefusal,
  p5Hash,
  p5LedgerId,
  readP5PublishedRows,
  verifyP5PublishedRows,
  type P5LedgerWrite,
} from "@/lib/data-plane/write-adapters/p5OutcomeHandoffAdapter";
import {
  P5_MEASUREMENT_PLAN_KEY,
  readP5MeasurementPlan,
  type P5HandoffBinding,
  type P5HandoffView,
  type P5MeasurementRow,
} from "./p5-measurement-plan";
import type { TenancyCtx } from "./types.db";
import type { ValueCaseResult, LeverResult } from "./value-engine/types";

interface ContractRow {
  id: string;
  status: string;
  current_version: number;
  signed_off_version: number | null;
  structured_data: Record<string, unknown> | null;
}

function governedMetric(
  binding: P5HandoffBinding,
  measure: P5MeasurementRow,
  lever: LeverResult,
): GovernedObject {
  const object: GovernedObject = {
    id: p5LedgerId(binding, lever.leverId),
    tenant_id: binding.clientId,
    client_key: binding.tenantKey,
    object_type: "planned_move_outcome",
    source_layer: "metric",
    industry: null,
    enterprise_area: null,
    function: null,
    process_area: null,
    use_case_category: null,
    strategic_move_phase_applicability: ["P5"],
    applicable_agents: [],
    source_basis:
      "Current signed P5 measurement contract and deterministic approved P4 case",
    source_references: [
      measure.sourceReference,
      `deliverable:${binding.contractId}:v${binding.contractVersion}:${binding.contractHash}`,
      ...lever.terms.base.map((term) => term.source),
    ],
    classification: "confidential",
    compliance_basis: null,
    agent_readiness_status: "committed_not_indexed",
    retrievability: "committed_not_indexed",
    confidence_level: "low",
    confidence_rationale:
      "Approved plan; no measured or realized outcome has been verified.",
    cited_render_verified_at: null,
    last_reviewed_at: null,
    owner: measure.ownerRole,
    data_domains: [],
    required_kpis: [lever.leverId],
    baseline_requirements: [measure.sourceReference, measure.comparator],
    measurement_method: measure.method,
    value_levers: [lever.leverId],
    known_failure_modes: [measure.openConditions],
    guardrails: [
      measure.exclusionRules,
      "Planned cash only; baseline and realized amounts remain unknown.",
    ],
    human_in_loop_controls: [
      "Authorized product handoff acceptance bound to the current document and inputs",
    ],
    allowed_agent_actions: [],
    blocked_agent_actions: [
      "claim_realized_value",
      "infer_baseline",
      "start_execution",
    ],
    provenance: {
      source_file: `deliverable:${binding.contractId}:v${binding.contractVersion}`,
      ingestion_run_id: `p5:${p5Hash(binding)}`,
      parse_method: "deterministic_p4_to_p5_handoff",
      committed_at: null,
      indexed_at: null,
      index_name: null,
    },
    policy_version: POLICY_VERSION,
    contract_hash: binding.contractHash,
    created_at: null,
    updated_at: null,
  };
  if (evaluateGovernedObject(object).decision === "block")
    throw new P5HandoffRefusal(
      "metric_governance_blocked",
      "The planned metric does not pass context governance. Nothing was published.",
    );
  return object;
}

export async function loadP5HandoffBasis(
  ctx: TenancyCtx,
  moveId: string,
): Promise<{
  view: P5HandoffView;
  rows: P5LedgerWrite[];
}> {
  const program = await getProgramById(ctx, moveId);
  if (!program || program.clientId !== ctx.clientId)
    throw new P5HandoffRefusal(
      "move_not_readable",
      "This Move is not accessible.",
      404,
    );
  if (program.currentPhase !== 5 && program.currentPhase !== 6)
    throw new P5HandoffRefusal(
      "handoff_phase_required",
      "P4 must be approved before preparing the P5 measurement handoff.",
    );
  const tenantKey = canonicalTenantKey(ctx.clientKey ?? "");
  if (!CANONICAL_TENANT_KEYS.some((key) => key === tenantKey))
    throw new P5HandoffRefusal(
      "tenant_identity_unavailable",
      "The canonical tenant identity could not be verified.",
      503,
    );
  const evidence = await loadApprovedMoveEvidenceSnapshot({
    tenantKey: ctx.clientKey ?? "",
    moveId,
  });
  if (!evidence)
    throw new P5HandoffRefusal(
      "evidence_read_unavailable",
      "Approved evidence could not be read. No handoff state is claimed.",
      503,
    );
  const snapshots = await getPhaseSnapshots(ctx, moveId, 4);
  if (
    !phaseApprovalMatchesEvidence(4, snapshots, {
      revision: evidence.revision,
      latestEvidenceActivityAt: evidence.latestEvidenceActivityAt,
      revisionByPhase: evidence.revisionByPhase,
      latestEvidenceActivityAtByPhase: evidence.latestEvidenceActivityAtByPhase,
    })
  )
    throw new P5HandoffRefusal(
      "p4_approval_stale",
      "P4 must be current against approved evidence before publishing the measurement handoff.",
    );

  const modules = await getModuleState(ctx, moveId);
  const captured = (key: string) =>
    modules.find((row) => row.moduleKey === key)?.state?.value;
  const valueCapture = captured("phase_4_value_plan");
  const model = readValueModel(
    typeof valueCapture === "string" ? valueCapture : "",
  );
  if (model.kind !== "model")
    throw new P5HandoffRefusal(
      "p4_case_invalid",
      "Save a valid deterministic P4 value case before preparing the handoff.",
    );
  const response = await readValueCase(
    new NextRequest(
      `http://internal.invalid/api/v1/programs/${encodeURIComponent(moveId)}/value-case${model.model.deliveryModel ? `?delivery=${model.model.deliveryModel}` : ""}`,
    ),
    { params: Promise.resolve({ programId: moveId }) },
  );
  const value = (await response.json()) as {
    programId?: string;
    detail?: string;
    figuresRedacted?: boolean;
    case?: ValueCaseResult;
    costBasis?: unknown;
    registerInputs?: unknown;
  };
  if (
    !response.ok ||
    value.programId !== moveId ||
    value.figuresRedacted !== false
  )
    throw new P5HandoffRefusal(
      "p4_case_unavailable",
      value.detail ??
        "The current P4 value case could not be read with financial visibility.",
      response.status === 403 ? 403 : 503,
    );
  const result = value.case;
  if (
    !result ||
    result.status !== "evaluated" ||
    result.readyForApproval !== true ||
    result.levers.length === 0 ||
    result.levers.some(
      (lever) =>
        !lever.annualCents ||
        !Number.isSafeInteger(lever.annualCents.base) ||
        lever.annualCents.base < 0,
    )
  )
    throw new P5HandoffRefusal(
      "p4_case_blocked",
      "The deterministic P4 case has unresolved inputs or rules. Resolve them before preparing the handoff.",
    );
  const sb = getAzureWriteFluentClient();
  const ownersRead = await sb
    .from("engagement_participants")
    .select(
      "user_id, role, program_access_level, can_publish_deliverables, can_approve_phase_gates",
    )
    .eq("engagement_id", moveId);
  if (ownersRead.error || !Array.isArray(ownersRead.data))
    throw new P5HandoffRefusal(
      "receiving_owners_unavailable",
      "Receiving participants could not be read. No ownership is claimed.",
      503,
    );
  const owners = (
    ownersRead.data as Array<{
      user_id: string;
      role: string;
      program_access_level: string | null;
      can_publish_deliverables: boolean;
      can_approve_phase_gates: boolean;
    }>
  )
    .filter(
      (row) =>
        row.user_id &&
        row.role &&
        (row.program_access_level === "program_member" ||
          row.can_publish_deliverables === true ||
          row.can_approve_phase_gates === true),
    )
    .map((row) => ({ userId: row.user_id, role: row.role }));
  const view: P5HandoffView = {
    ok: true,
    programId: moveId,
    binding: null,
    savedPlan: null,
    owners,
    levers: result.levers.map((lever) => ({
      leverId: lever.leverId,
      name: lever.name,
      inCash: lever.inCash,
      projectedUsd: lever.inCash ? lever.annualCents!.base / 100 : 0,
    })),
    publication: { state: "not_yet_linked", rowIds: [] },
    detail:
      "Save a measurement plan and sign off the current P5 measurement contract before accepting the planned handoff.",
  };
  const rawPlan = captured(`phase_5_${P5_MEASUREMENT_PLAN_KEY}`);
  const plan = readP5MeasurementPlan(
    typeof rawPlan === "string" ? rawPlan : "",
  );
  if (!plan) return { view, rows: [] };
  view.savedPlan = plan;
  if (
    plan.measures.length !== result.levers.length ||
    result.levers.some(
      (lever) => !plan.measures.some((row) => row.leverId === lever.leverId),
    )
  )
    throw new P5HandoffRefusal(
      "measurement_levers_changed",
      "The saved measurement plan must name every current P4 lever once.",
    );
  if (
    plan.measures.some(
      (row) =>
        !owners.some(
          (owner) =>
            owner.userId === row.ownerUserId && owner.role === row.ownerRole,
        ),
    )
  )
    throw new P5HandoffRefusal(
      "receiving_owner_invalid",
      "Each receiving owner must be a current participant of this Move with the saved role.",
    );
  const contractRead = await sb
    .from("deliverables_v2")
    .select("id, status, current_version, signed_off_version, structured_data")
    .eq("engagement_id", moveId)
    .eq("deliverable_type_key", "value_measurement_contract");
  if (contractRead.error || !Array.isArray(contractRead.data))
    throw new P5HandoffRefusal(
      "contract_read_unavailable",
      "The measurement contract could not be read. No approval is claimed.",
      503,
    );
  const contracts = contractRead.data as ContractRow[];
  if (
    contracts.length !== 1 ||
    contracts[0].status !== "signed_off" ||
    !Number.isInteger(contracts[0].current_version) ||
    contracts[0].current_version < 1 ||
    contracts[0].signed_off_version !== contracts[0].current_version
  )
    return { view, rows: [] };
  const contract = contracts[0];
  const versionRead = await sb
    .from("deliverable_versions")
    .select("content, structured_data")
    .eq("deliverable_id", contract.id)
    .eq("version", contract.current_version);
  if (versionRead.error || !Array.isArray(versionRead.data))
    throw new P5HandoffRefusal(
      "contract_read_unavailable",
      "The signed contract content could not be read. No approval is claimed.",
      503,
    );
  const versions = versionRead.data as Array<{
    content: string;
    structured_data: unknown;
  }>;
  if (
    versions.length !== 1 ||
    typeof versions[0].content !== "string" ||
    !versions[0].content.trim()
  )
    throw new P5HandoffRefusal(
      "contract_content_absent",
      "The current signed measurement contract has no readable content.",
    );
  const binding: P5HandoffBinding = {
    tenantKey,
    clientId: ctx.clientId,
    moveId,
    contractId: contract.id,
    contractVersion: contract.current_version,
    contractHash: p5Hash(versions[0].content),
    planHash: p5Hash(plan),
    inputBasisHash: p5Hash({
      captures: modules
        .filter((row) => /^phase_[34]_/.test(row.moduleKey))
        .map((row) => ({
          key: row.moduleKey,
          state: row.state,
          status: row.status,
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
      case: result,
      costBasis: value.costBasis,
      registerInputs: value.registerInputs,
      p4Approval: snapshots,
      evidence: evidence.revisionByPhase,
      contractMetadata: contract.structured_data,
      versionMetadata: versions[0].structured_data,
    }),
  };
  const rows = result.levers.map((lever) => {
    const measure = plan.measures.find((row) => row.leverId === lever.leverId)!;
    return {
      id: p5LedgerId(binding, lever.leverId),
      subjectLabel: lever.name,
      category:
        lever.conversion === "risk_avoided"
          ? "risk_reduction"
          : lever.conversion === "non_cash"
            ? "productivity"
            : lever.conversion === "cost_reduction"
              ? "cost_avoidance"
              : "revenue_lift",
      projectedUsd: lever.inCash ? lever.annualCents!.base / 100 : 0,
      ownerRole: measure.ownerRole,
      sourceReference: measure.sourceReference,
      note: "Accepted planned measurement handoff. No baseline measurement, execution or realized value is claimed.",
      metadata: {
        datasetId: P5_HANDOFF_DATASET,
        binding,
        leverId: lever.leverId,
        ownerUserId: measure.ownerUserId,
        measure,
        p4Lever: lever,
        cashCounted: lever.inCash,
        governedObject: governedMetric(binding, measure, lever),
      },
    } satisfies P5LedgerWrite;
  });
  view.binding = binding;
  view.detail =
    "Review the current signed contract and saved plan, then accept the planned Tower handoff.";
  return { view, rows };
}

export async function readP5Handoff(
  ctx: TenancyCtx,
  moveId: string,
  independent = false,
) {
  const basis = await loadP5HandoffBasis(ctx, moveId);
  const published = await readP5PublishedRows(ctx, moveId, independent);
  if (published.length && !basis.view.binding)
    throw new P5HandoffRefusal(
      "publication_basis_changed",
      "The published handoff no longer has a current signed contract and saved measurement plan. Review a governed rebaseline.",
    );
  if (published.length) {
    const { evaluateGate } = await import("./governance");
    for (const phase of [4, 5]) {
      const gate = await evaluateGate(ctx, moveId, phase, phase + 1, {
        allowHistoricalPhase: true,
        skipP5Publication: true,
      });
      if (gate.failedChecks.some((check) => check.severity === "hard"))
        throw new P5HandoffRefusal(
          "publication_prerequisites_changed",
          "The published handoff no longer passes its current P4/P5 document and approval checks. Review the current prerequisites before proceeding.",
        );
    }
  }
  if (
    basis.view.binding &&
    verifyP5PublishedRows(published, basis.view.binding, basis.rows)
  ) {
    basis.view.publication = {
      state: "published",
      rowIds: basis.rows.map((row) => row.id),
    };
    basis.view.detail =
      "Planned handoff published and read back from Tower's outcome ledger. Baseline and realized values remain unknown.";
  }
  return basis;
}
