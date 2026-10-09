// Governance · Packet 4 · 6-Phase doctrine.
//
// Doctrine: docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md
//
// AbarVa Strategic Moves runs P0..P5. Tower owns execution tracking
// downstream of P5. Strategic Moves therefore has FIVE gate
// transitions:
//
//   • P0 → P1 — Originate seed becomes a chartered move
//   • P1 → P2 — signed charter unlocks Discover & Diagnose
//   • P2 → P3 — diagnosed baseline + readiness unlocks Design Future State
//   • P3 → P4 — signed-off future-state design unlocks Roadmap & Business Case
//   • P4 → P5 — approved roadmap + business case unlocks Mobilize & Handoff
//   • P5 → Tower — mobilization package + value measurement contract hand off
//     execution tracking to Tower
//
// Hard gates block advance until approval; soft gates allow advance
// with an unresolved marker. Every check returns a GateCheck (shape in
// types.ts). Current gate approvals are explicit Moves actions by an
// authorized workspace user; legacy approval requests do not advance phases.
//
// P2 may return a "discontinue" recommendation — the gate is allowed
// to kill the move. P3 explicitly rejects tool-first solutions without
// a workflow integration plan. P5 gate-out (handoff to Tower) requires
// execution team acceptance, not just Strategic Moves team signoff.

import {
  getAzureWriteFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from "@/lib/data-plane/postgresCompat";
import type {
  ApprovalAuthority,
  GateCheck,
  TenancyCtx,
} from "./types.db";
import { getProgramById } from "./queries";
import { writeProgramAuditLogBestEffort } from "./audit-log";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { resolveMoveTier } from "./p0-extended-intake-fields";
import { listApprovedPhaseEvidence } from "./approved-phase-evidence";
import { resolveConfirmedSolutionRoute } from "./solution-route-assessment";
import {
  discoveryReportTextFromLatestVersion,
  p2ReadinessBlockedReason,
} from "./discovery-report-readiness";
import {
  GATE_STATE_UNREADABLE_CHECK,
  classifyGateStateReads,
  describeUnreadableGateState,
} from "./gate-state-readback";
import {
  isApprovedMoveEvidenceBasisCurrent,
  loadApprovedMoveEvidenceSnapshot,
} from "@/lib/programs/approved-move-evidence-snapshot";
import {
  reportUnevaluableApprovalCurrencyOnce,
  resolveDeliverableApprovalCurrencyScope,
} from "@/lib/programs/deliverable-approval-currency";
import {
  reportUnevaluableApprovedEvidenceBasisOnce,
  resolveApprovedEvidenceCurrencyBasis,
} from "@/lib/programs/approved-evidence-currency-basis";
import {
  describeDeliverableSignOffFailure,
  type DeliverableSignOffVerdict,
} from "@/lib/programs/deliverable-signoff-diagnosis";

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error(
      "[programs/governance] TenancyCtx missing clientId or userId",
    );
  }
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readRecordString(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = cleanText(record?.[key]);
    if (value) return value;
  }
  return "";
}

function readScaffoldString(
  charter: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  const scaffold = charter?.scaffold;
  if (!scaffold || typeof scaffold !== "object") return "";
  return readRecordString(scaffold as Record<string, unknown>, ...keys);
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

interface GateRule {
  fromPhase: number;
  toPhase: number;
  hard: boolean;
  approverRole: ApprovalAuthority;
  checks: Array<{ key: string; describe: string; severity: "hard" | "soft" }>;
}

const GATE_RULES: GateRule[] = [
  // P0 Originate → P1 Charter
  // The seed must be concrete enough to charter: hypothesis, sponsor
  // candidate, scope boundary, archetype, first evidence family.
  {
    fromPhase: 0,
    toPhase: 1,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "program_seed_recorded",
        describe: "Origination brief signed off with archetype classification",
        severity: "hard",
      },
      {
        key: "value_hypothesis_seed",
        describe:
          "Value hypothesis seed names problem trigger and target outcome",
        severity: "hard",
      },
      {
        key: "sponsor_assigned",
        describe: "Sponsor progress contact listed",
        severity: "hard",
      },
      {
        key: "discovery_funding_envelope",
        describe: "Charter funding or capacity envelope stated",
        severity: "soft",
      },
      {
        key: "initial_scope_boundary",
        describe: "Initial scope boundary names the first cohort or use case",
        severity: "soft",
      },
      {
        key: "evidence_family_selected",
        describe: "Evidence family selected for Discover & Diagnose",
        severity: "soft",
      },
    ],
  },
  // P1 Charter → P2 Discover & Diagnose
  // The approved charter must lock sponsor contact, value range, success metrics,
  // and stakeholder map before the move is allowed to spend Discovery
  // capacity on baselining and root cause work.
  {
    fromPhase: 1,
    toPhase: 2,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "charter_signed_off",
        describe: "Charter approved by an authorized Move user",
        severity: "hard",
      },
      {
        key: "sponsor_assigned",
        describe:
          "Sponsor contact listed for progress communication; product decision authority is assigned separately",
        severity: "hard",
      },
      {
        key: "baseline_captured",
        describe: "Initial value range and success metrics ratified",
        severity: "soft",
      },
    ],
  },
  // P2 Discover & Diagnose → P3 Design Future State
  // Discovery synthesis must lock baseline, stakeholders, root causes,
  // and confirm the move clears P2 without unresolved hard gaps. P2 is
  // allowed to recommend "discontinue" — the gate enforces that the
  // diagnosis is honest before design effort is spent.
  {
    fromPhase: 2,
    toPhase: 3,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "discovery_report_signed_off",
        describe: "Discovery synthesis report signed off",
        severity: "hard",
      },
      {
        key: "discovery_notes_ingested",
        describe: "Discovery notes or workshop logs ingested",
        severity: "hard",
      },
      {
        key: "discovery_baseline_attested",
        describe:
          "Baseline metrics are captured and attested, not merely planned",
        severity: "hard",
      },
      {
        key: "discovery_stakeholders_named",
        describe:
          "Stakeholder map names required human owners with no hard-owner gaps",
        severity: "hard",
      },
      {
        key: "p2_readiness_cleared",
        describe:
          "Diagnosis clears P2 without unresolved hard gaps or kill recommendation",
        severity: "hard",
      },
      {
        key: "solution_route_validated",
        describe:
          "P1 change assessment and P2 solution route are completed against approved evidence",
        severity: "hard",
      },
    ],
  },
  // P3 Design Future State → P4 Roadmap & Business Case
  // The signed-off future-state design names target state, operating
  // model shift, and risks/tradeoffs. P3 explicitly rejects tool-first
  // solutions without a workflow integration plan.
  {
    fromPhase: 3,
    toPhase: 4,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "solution_route_validated",
        describe:
          "The P1 change assessment and P2 solution route remain backed by approved evidence",
        severity: "hard",
      },
      {
        key: "design_approved",
        describe: "P3 solution design for the confirmed route signed off",
        severity: "hard",
      },
      {
        key: "requirements_design_outcome_trace",
        describe: "Requirements-to-design-to-outcomes traceability captured",
        severity: "hard",
      },
      {
        key: "phase_3_findings_written",
        describe: "Risks and tradeoffs named with mitigations",
        severity: "soft",
      },
      {
        key: "cxo_interview_complete",
        describe: "Operating-model owners interviewed",
        severity: "soft",
      },
    ],
  },
  // P4 Roadmap & Business Case → P5 Mobilize & Handoff
  // Approved roadmap + business case + value plan + cost model + change
  // readiness. This is the funding/mobilization gate. P5 then runs the
  // handoff to Tower; Tower owns downstream execution tracking.
  {
    fromPhase: 4,
    toPhase: 5,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "execution_roadmap_drafted",
        describe:
          "Roadmap drafted with workstreams, estimates, timeline, milestones, dependencies, RACI, and risks",
        severity: "hard",
      },
      {
        key: "business_case_approved",
        describe: "Business case and value plan approved",
        severity: "hard",
      },
      {
        key: "execution_milestones_defined",
        describe: "Critical execution milestones defined",
        severity: "hard",
      },
      {
        key: "execution_success_criteria_defined",
        describe: "Success criteria defined for execution",
        severity: "hard",
      },
      {
        key: "readiness_and_change_plan_signed_off",
        describe: "Change readiness and adoption plan signed off",
        severity: "hard",
      },
      {
        key: "funding_approval_recorded",
        describe: "Funding or capacity approval recorded",
        severity: "soft",
      },
      {
        key: "sponsor_alignment_confirmed",
        describe:
          "Handoff decision authority and stakeholder conditions documented",
        severity: "soft",
      },
      {
        key: "delivery_raci_named",
        describe:
          "Delivery RACI names business, technology, vendor, finance, change, and Tower owners",
        severity: "soft",
      },
      {
        key: "vendor_selection_approved",
        describe: "Vendor selection approved if applicable",
        severity: "soft",
      },
      {
        key: "tower_metric_plan_drafted",
        describe: "Tower monitoring metric plan drafted",
        severity: "soft",
      },
      {
        key: "tower_handoff_plan_accepted",
        describe:
          "Tower handoff plan drafted (final acceptance occurs during P5)",
        severity: "soft",
      },
    ],
  },
  // P5 Mobilize & Handoff → Tower
  // The Move leaves Strategic Moves only when the mobilization handoff and
  // value-measurement contract are signed off. Tower then owns ongoing
  // monitoring; Strategic Moves remains the auditable source record.
  {
    fromPhase: 5,
    toPhase: 6,
    hard: true,
    approverRole: "approver",
    checks: [
      {
        key: "handoff_package_signed_off",
        describe: "Mobilization and Tower handoff package signed off",
        severity: "hard",
      },
      {
        key: "value_measurement_contract_signed_off",
        describe: "Value measurement contract signed off",
        severity: "hard",
      },
      {
        key: "launch_readiness_attested",
        describe: "Launch readiness and go/no-go criteria attested",
        severity: "hard",
      },
      {
        key: "tower_cadence_defined",
        describe: "Tower governance and measurement cadence defined",
        severity: "hard",
      },
      {
        key: "p5_open_risks_recorded",
        describe: "Open launch risks and client-to-complete items recorded",
        severity: "soft",
      },
    ],
  },
];

// Classify fast lane (`moves_classify_fast_lane_v1`) — NOT in GATE_RULES.
// findGateRule only returns this for the exact (1, 5) pair, and only when the
// caller opts in via `fastLaneEligible`. Every other (fromPhase, toPhase)
// pair — including plain findGateRule(1, 5) with fastLaneEligible omitted —
// is completely unaffected; GATE_RULES itself is untouched by this feature.
const CLASSIFY_FAST_LANE_RULE: GateRule = {
  fromPhase: 1,
  toPhase: 5,
  hard: true,
  approverRole: "approver",
  checks: [
    {
      key: "fast_lane_decision_recorded",
      describe:
        "Move is tagged complexity tier 'Straightforward' — a named owner decided directly, no Discover/Design/Business Case required",
      severity: "hard",
    },
  ],
};

/**
 * `fastLaneEligible` must be computed by the caller (Move tier === 'Straightforward'
 * AND the tenant has `moves_classify_fast_lane_v1` enabled) — this function has no
 * DB/tenant access itself. Omitted or false: behavior is identical to the prior
 * 2-argument signature for every (fromPhase, toPhase) pair, including (1, 5).
 */
export function findGateRule(
  fromPhase: number,
  toPhase: number,
  opts?: { fastLaneEligible?: boolean },
): GateRule | null {
  if (opts?.fastLaneEligible && fromPhase === 1 && toPhase === 5) {
    return CLASSIFY_FAST_LANE_RULE;
  }
  return (
    GATE_RULES.find(
      (g) => g.fromPhase === fromPhase && g.toPhase === toPhase,
    ) ?? null
  );
}

/** A single gate criterion, identified by its canonical governance key. */
export interface GateRuleCriterion {
  /** Canonical key — the SAME id `evaluateGate` reports in `failedChecks`. */
  key: string;
  /** Reviewer-facing description of the criterion. */
  describe: string;
  severity: "hard" | "soft";
}

/**
 * The canonical gate criteria for the transition OUT of `fromPhase`
 * (`fromPhase` → `fromPhase + 1`). Returns `null` when no gate rule exists
 * — e.g. the terminal phase, where there is nothing left to gate. This is
 * the single source of truth for gate-criterion ids; every surface that
 * renders gate progress must read these keys so the detail page and the
 * phase workspace can never diverge.
 */
export function gateCriteriaForPhase(
  fromPhase: number,
): GateRuleCriterion[] | null {
  const rule = GATE_RULES.find((g) => g.fromPhase === fromPhase);
  if (!rule) return null;
  return rule.checks.map((c) => ({
    key: c.key,
    describe: c.describe,
    severity: c.severity,
  }));
}

async function hasProgramEvidence(
  programId: string,
  phase: number | number[],
  sb: SupabaseClient,
): Promise<boolean> {
  // Discovery / current-state evidence is ingested with an inconsistent phase tag
  // across routes (current-state/ingest → 1, …/orchestrate → 2). Accept any of the
  // supplied phases so a gate check isn't starved by which intake route was used.
  const phases = Array.isArray(phase) ? phase : [phase];
  const { data } = await sb
    .from("program_evidence_items")
    .select("id")
    .eq("program_id", programId)
    .in("phase", phases)
    .limit(1);
  return ((data as Array<{ id: string }> | null) ?? []).length > 0;
}

/**
 * Evaluate gate conditions by reading program state. Returns pass/fail
 * with per-check severity. Callers decide whether to bypass or request
 * approval.
 */
export async function evaluateGate(
  ctx: TenancyCtx,
  programId: string,
  fromPhase: number,
  toPhase: number,
  opts: { supabase?: SupabaseClient; allowHistoricalPhase?: boolean } = {},
): Promise<GateCheck> {
  assertTenancy(ctx);
  let rule = findGateRule(fromPhase, toPhase);
  // Classify fast lane: (1, 5) has no GATE_RULES entry, so the plain lookup
  // above always misses it — exactly as before this feature existed. Only
  // for this specific pair, and only when that plain lookup missed, pay the
  // cost of an early program fetch to check tier + tenant eligibility. Every
  // other (fromPhase, toPhase) pair never reaches this branch.
  let program: Awaited<ReturnType<typeof getProgramById>> = null;
  if (!rule && fromPhase === 1 && toPhase === 5) {
    program = await getProgramById(ctx, programId);
    if (program) {
      const tier = resolveMoveTier(program.charter);
      const fastLaneEnabled = isFeatureEnabled(
        ctx,
        "moves_classify_fast_lane_v1",
      );
      rule = findGateRule(fromPhase, toPhase, {
        fastLaneEligible: tier === "Straightforward" && fastLaneEnabled,
      });
    }
  }
  if (!rule) {
    return {
      pass: false,
      failedChecks: [
        {
          check: "no_rule",
          reason: `No gate rule for ${fromPhase}→${toPhase}`,
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    };
  }
  if (!program) {
    program = await getProgramById(ctx, programId);
  }
  if (!program) {
    return {
      pass: false,
      failedChecks: [
        {
          check: "program_not_found",
          reason: "Program not accessible",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    };
  }
  const historicalReapproval =
    opts.allowHistoricalPhase === true &&
    typeof program.currentPhase === "number" &&
    program.currentPhase > fromPhase;
  if (program.currentPhase !== fromPhase && !historicalReapproval) {
    return {
      pass: false,
      failedChecks: [
        {
          check: "phase_mismatch",
          reason: `Program is on phase ${program.currentPhase ?? "unknown"}, not ${fromPhase}`,
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    };
  }

  const sb = opts.supabase ?? getAzureWriteFluentClient();

  // Collect state signals
  // `error` is read on every one of these: the compat client never throws, so a
  // dropped `error` arrives as `data: null` and every collector below coerces
  // that to `[]` — the same shape as a Move that has genuinely produced
  // nothing. See `gate-state-readback.ts`.
  const [
    { data: deliverables, error: deliverablesError },
    { data: modules, error: modulesError },
    { data: participants, error: participantsError },
    { data: approvalRequests, error: approvalRequestsError },
    { data: milestones, error: milestonesError },
  ] = await Promise.all([
    sb
      .from("deliverables_v2")
      .select(
        "id, deliverable_type_key, status, approved_artifact_id, structured_data",
      )
      .eq("engagement_id", programId),
    sb
      .from("program_modules")
      .select("module_key, status, state_jsonb")
      .eq("engagement_id", programId),
    sb
      .from("engagement_participants")
      .select("user_id, approval_authority, role")
      .eq("engagement_id", programId),
    sb
      .from("program_approval_requests")
      .select("request_status, brief_snapshot")
      .eq("program_id", programId)
      .order("created_at", { ascending: false })
      .limit(1),
    sb
      .from("program_milestones")
      .select("id, name, status")
      .eq("engagement_id", programId)
      .limit(20),
  ]);

  const deliverableRows =
    (deliverables as Array<{
      id: string;
      deliverable_type_key: string;
      status: string;
      approved_artifact_id?: string | null;
      structured_data?: Record<string, unknown> | null;
    }> | null) ?? [];
  const moduleRows =
    (modules as Array<{
      module_key: string;
      status: string;
      state_jsonb?: Record<string, unknown> | null;
    }> | null) ?? [];
  const milestoneRows =
    (milestones as Array<{
      id: string;
      name: string | null;
      status: string | null;
    }> | null) ?? [];
  const findDeliverable = (...keys: string[]) =>
    deliverableRows.find((d) => keys.includes(d.deliverable_type_key));
  const findDeliverables = (...keys: string[]) =>
    deliverableRows.filter((d) => keys.includes(d.deliverable_type_key));
  // Not `snapshot | null`: a null conflates "nothing approved" with "I could not
  // read the basis", and only the first of those may veto a recorded human
  // approval. See `approved-evidence-currency-basis.ts`.
  const evidenceBasis = await resolveApprovedEvidenceCurrencyBasis({
    tenantKey: ctx.clientKey,
    moveId: programId,
    load: loadApprovedMoveEvidenceSnapshot,
  });
  const currentEvidenceSnapshot = evidenceBasis.evaluable
    ? evidenceBasis.snapshot
    : null;
  const linkedArtifactIds = deliverableRows
    .map((row) => row.approved_artifact_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const linkedArtifactRows =
    ctx.clientKey && linkedArtifactIds.length > 0
      ? await sb
          .from("move_artifacts")
          .select(
            "artifact_id, tenant_key, move_id, artifact_family, lifecycle_state, created_at, metadata",
          )
          .eq("tenant_key", ctx.clientKey)
          .eq("move_id", programId)
          .in("artifact_id", linkedArtifactIds)
      : { data: [], error: null };
  const linkedArtifactById = new Map(
    (
      (linkedArtifactRows.data as Array<{
        artifact_id: string;
        tenant_key: string;
        move_id: string;
        artifact_family: string;
        lifecycle_state: string;
        created_at?: string | null;
        metadata?: Record<string, unknown> | null;
      }> | null) ?? []
    ).map((artifact) => [artifact.artifact_id, artifact]),
  );
  // The verdict, not just the boolean. `isSignedOff` below keeps the boolean
  // shape every other caller already uses; the five HARD criteria that ARE a
  // single sign-off call read the cause so the blocked reader is told which of
  // the four states they are in and which single action answers it. See
  // `deliverable-signoff-diagnosis.ts`.
  const signOffVerdict = (
    row:
      | {
          id: string;
          deliverable_type_key: string;
          status: string;
          approved_artifact_id?: string | null;
          structured_data?: Record<string, unknown> | null;
        }
      | undefined,
  ): DeliverableSignOffVerdict => {
    const pass: DeliverableSignOffVerdict = {
      ok: true,
      cause: "signed_off",
      status: row?.status ?? null,
    };
    if (!row) return { ok: false, cause: "absent", status: null };
    if (row.status !== "signed_off")
      return { ok: false, cause: "not_signed_off", status: row.status };
    const structured = row.structured_data ?? {};
    const structuredGenerated =
      structured.source === "generated_by_orchestrator" ||
      structured.source === "generated_artifact_acceptance" ||
      structured.source === "moves_program_generate" ||
      typeof structured.generated_artifact_id === "string" ||
      typeof structured.generatedArtifactId === "string";
    const structuredEvidenceSnapshotHash =
      typeof structured.evidenceSnapshotHash === "string"
        ? structured.evidenceSnapshotHash
        : null;
    // A phase this check cannot run at is NOT a stale approval — see
    // `deliverable-approval-currency.ts`. Return BEFORE the lineage comparisons
    // rather than computing them and ignoring the result: with the scope resolved
    // first, `deliverablePhase` below is always the phase the comparison actually
    // runs at, so there is no branch where a currency verdict is derived from a
    // phase that does not exist.
    const currencyScope = resolveDeliverableApprovalCurrencyScope(
      row.deliverable_type_key,
    );
    if (!currencyScope.evaluable) {
      // Say so rather than silently allowing it: the only way this row's approval
      // currency becomes checkable again is a registry change, and that is worth
      // seeing in the logs instead of inferring from a gate that stopped failing.
      reportUnevaluableApprovalCurrencyOnce(
        row.deliverable_type_key,
        currencyScope.reason,
      );
      return pass;
    }
    const deliverablePhase = currencyScope.phase;
    const structuredLineageCurrent = Boolean(
      currentEvidenceSnapshot &&
      deliverablePhase &&
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: currentEvidenceSnapshot,
        phase: deliverablePhase,
        recordedRevision:
          (typeof structured.phaseEvidenceSnapshotHash === "string"
            ? structured.phaseEvidenceSnapshotHash
            : structuredEvidenceSnapshotHash) ?? null,
        scope:
          typeof structured.evidenceSnapshotScope === "string"
            ? structured.evidenceSnapshotScope
            : null,
        generatedAt:
          typeof structured.generatedAt === "string"
            ? structured.generatedAt
            : null,
      }),
    );
    const linkedArtifactId = row.approved_artifact_id;
    const linkedArtifact = linkedArtifactId
      ? linkedArtifactById.get(linkedArtifactId)
      : null;
    const linkedMetadata = linkedArtifact?.metadata ?? {};
    const linkedArtifactMatchesDeliverable = Boolean(
      row &&
      (linkedMetadata.deliverableId === row.id ||
        (typeof structured.generatedArtifactId === "string" &&
          linkedMetadata.generatedArtifactId ===
            structured.generatedArtifactId)),
    );
    // Split on purpose. The ownership/lifecycle half is snapshot-INDEPENDENT, so
    // it keeps its veto even when the evidence basis cannot be read; the evidence
    // comparison below is the only half an unevaluable basis may skip.
    const linkedArtifactIntegrityOk = Boolean(
      linkedArtifact &&
      linkedArtifact.tenant_key === ctx.clientKey &&
      linkedArtifact.move_id === programId &&
      linkedArtifact.artifact_family === "generated_deliverable" &&
      linkedArtifact.lifecycle_state === "current" &&
      linkedArtifactMatchesDeliverable,
    );
    if (!evidenceBasis.tenantScopeResolved) {
      // With no tenant key the `move_artifacts` lookup above was never issued,
      // so `linkedArtifactIntegrityOk` is false for want of a read rather than
      // for want of a valid artifact. Nothing about this approval is evaluable;
      // report it and leave the recorded human sign-off standing.
      reportUnevaluableApprovedEvidenceBasisOnce(
        programId,
        evidenceBasis.reason,
      );
      return pass;
    }
    if (linkedArtifactId && !linkedArtifactIntegrityOk)
      return {
        ok: false,
        cause: "linked_artifact_integrity",
        status: row.status,
      };
    if (!evidenceBasis.evaluable) {
      // The reads ran, so integrity was just checked for real. Only the evidence
      // comparison is unevaluable — and an unevaluable check is not a stale
      // approval, the same rule `resolveDeliverableApprovalCurrencyScope` applies
      // above. Without this the whole gate ladder held with no reason rendered.
      reportUnevaluableApprovedEvidenceBasisOnce(
        programId,
        evidenceBasis.reason,
      );
      return pass;
    }
    // `linkedArtifactIntegrityOk` here is redundant and a mutation that removes
    // it SURVIVES: reaching this line with a truthy `linkedArtifact` implies a
    // truthy `linkedArtifactId`, which implies the veto above already passed. It
    // is kept so this Boolean states the whole condition it depends on rather
    // than inheriting half of it from a control-flow accident one line up — if
    // that veto is ever changed to collect a reason instead of returning, this
    // comparison stays correct. Not a coverage gap.
    const linkedArtifactCurrent = Boolean(
      linkedArtifactIntegrityOk &&
      linkedArtifact &&
      deliverablePhase &&
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: evidenceBasis.snapshot,
        phase: deliverablePhase,
        recordedRevision:
          typeof linkedMetadata.phaseEvidenceSnapshotHash === "string"
            ? linkedMetadata.phaseEvidenceSnapshotHash
            : typeof linkedMetadata.evidenceSnapshotHash === "string"
              ? linkedMetadata.evidenceSnapshotHash
              : null,
        scope:
          typeof linkedMetadata.evidenceSnapshotScope === "string"
            ? linkedMetadata.evidenceSnapshotScope
            : null,
        generatedAt: linkedArtifact.created_at ?? null,
      }),
    );

    if (linkedArtifactId && !linkedArtifactCurrent)
      return { ok: false, cause: "evidence_basis_stale", status: row.status };
    if (
      structuredGenerated &&
      !structuredLineageCurrent &&
      !linkedArtifactCurrent
    ) {
      return { ok: false, cause: "evidence_basis_stale", status: row.status };
    }
    return pass;
  };
  const isSignedOff = (row: Parameters<typeof signOffVerdict>[0]): boolean =>
    signOffVerdict(row).ok;
  // One authenticated, authorized workspace user records the approval. Role
  // labels describe stakeholders and reviewers; they are not separate gate
  // actors or extra approval requirements.
  const meetsApprovalBar = async (
    row:
      | {
          id: string;
          deliverable_type_key: string;
          status: string;
          structured_data?: Record<string, unknown> | null;
        }
      | undefined,
  ): Promise<boolean> => {
    return isSignedOff(row);
  };
  const anyMeetsApprovalBar = async (
    rows: Array<{
      id: string;
      deliverable_type_key: string;
      status: string;
      structured_data?: Record<string, unknown> | null;
    }>,
  ): Promise<boolean> => {
    for (const row of rows) {
      if (await meetsApprovalBar(row)) return true;
    }
    return false;
  };
  const isPresent = (row: { status: string } | undefined) => Boolean(row);
  const moduleCompleted = (...keys: string[]) =>
    moduleRows.some(
      (m) => keys.includes(m.module_key) && m.status === "completed",
    );
  // Several HARD checks below fall back to matching common words (e.g.
  // "outcome", "validation", "ready") against phaseCaptureText — the
  // concatenated free-text `state_jsonb.value` of every `phase_N_*` module,
  // regardless of that module's own status. That free-text match alone was
  // enough to satisfy a BLOCKING hard gate with zero real deliverable,
  // evidence, or even a completed module — confirmed live: a Move advanced
  // P3→P4 via `requirements_design_outcome_trace`'s fallback with 0 P3
  // deliverables generated. Every such fallback below is now additionally
  // gated on at least one `phase_N_*` module actually being `completed`
  // (a real, explicit user action), not merely present/in-progress/draft.
  const phaseModulesCompleted = (phase: number) =>
    moduleRows.some(
      (m) =>
        m.module_key.startsWith(`phase_${phase}_`) && m.status === "completed",
    );

  const charterRow = deliverableRows.find(
    (d) => d.deliverable_type_key === "charter",
  );
  const originationBriefRow = findDeliverable(
    "origination_brief",
    "program_seed_brief",
    "program_seed",
  );
  const hasSignedOriginationBrief = isSignedOff(originationBriefRow);
  const designRows = findDeliverables(
    "design_spec",
    "design",
    "design_brief",
    "solution_design",
    "operating_model_design",
    "target_state_architecture",
    "process_change_estimate_brief",
  );
  const executionRoadmapRow = findDeliverable(
    "execution_roadmap",
    "execution_plan",
    "roadmap",
    "mobilization_roadmap",
  );
  const requirementsTraceRow = findDeliverable(
    "requirements_traceability",
    "requirements_design_outcome_trace",
    "traceability_matrix",
  );
  const businessCaseRow = findDeliverable(
    "business_case",
    "funding_business_case",
    "approval_business_case",
  );
  const discoveryReportRow = findDeliverable(
    "discovery_report",
    "discovery_synthesis",
    "discovery_findings",
  );
  const changePlanRow = findDeliverable(
    "change_management_plan",
    "business_readiness_plan",
    "readiness_and_change_plan",
  );
  const towerHandoffRow = findDeliverable(
    "tower_handoff_plan",
    "execution_monitoring_plan",
    "control_tower_handoff",
  );
  const handoffPackageRow = findDeliverable(
    "handoff_package",
    "mobilization_handoff_package",
    "mobilization_package",
  );
  const valueMeasurementContractRow = findDeliverable(
    "value_measurement_contract",
    "benefits_realization_plan",
    "value_contract",
  );
  const cxoInterviewModule = moduleRows.find(
    (m) => m.module_key === "cxo_interview",
  );
  const hasSponsor = (
    (participants as Array<{
      approval_authority: string | null;
      role?: string | null;
    }> | null) ?? []
  ).some(
    (p) =>
      p.approval_authority === "sponsor" ||
      /^(co[- ]?)?sponsor$/i.test(p.role?.trim() ?? ""),
  );
  const latestSeedBrief =
    ((approvalRequests as Array<{
      request_status: string | null;
      brief_snapshot: Record<string, unknown> | null;
    }> | null) ?? [])[0]?.brief_snapshot ?? {};
  const briefString = JSON.stringify(latestSeedBrief).toLowerCase();
  const phaseCaptureText = moduleRows
    .filter((m) => m.module_key.startsWith(`phase_${fromPhase}_`))
    .map((m) => {
      const value = m.state_jsonb?.value;
      return typeof value === "string"
        ? value
        : JSON.stringify(m.state_jsonb ?? {});
    })
    .join("\n")
    .toLowerCase();
  const captureValue = (phase: number, key: string) => {
    const row = moduleRows.find(
      (item) => item.module_key === `phase_${phase}_${key}`,
    );
    const value = row?.state_jsonb?.value;
    return typeof value === "string" ? value : "";
  };
  const captureCompleted = (phase: number, key: string) =>
    moduleRows.some(
      (item) =>
        item.module_key === `phase_${phase}_${key}` &&
        item.status === "completed",
    );
  const routeEvidenceReferences =
    fromPhase === 2 || fromPhase === 3
      ? await listApprovedPhaseEvidence(ctx, programId, 2)
      : [];
  const confirmedSolutionRoute =
    fromPhase === 2 || fromPhase === 3
      ? resolveConfirmedSolutionRoute({
          businessChangeAssessment: captureValue(
            1,
            "business_change_assessment",
          ),
          routeValidation: captureValue(2, "solution_route_validation"),
          approvedEvidenceReferences: routeEvidenceReferences.map(
            (item) => item.evidenceId,
          ),
        })
      : null;

  let latestOriginationBriefText = "";
  let originationVersionError: { message?: string | null } | null = null;
  if (originationBriefRow) {
    const { data: originationVersions, error: originationVersionsError } =
      await sb
        .from("deliverable_versions")
        .select("content, structured_data, generated_at")
        .eq("deliverable_id", (originationBriefRow as { id?: string }).id)
        .order("generated_at", { ascending: false })
        .limit(1);
    originationVersionError = originationVersionsError ?? null;
    const latestOriginationVersion = ((originationVersions as Array<{
      content: string | null;
      structured_data: Record<string, unknown> | null;
    }> | null) ?? [])[0];
    latestOriginationBriefText = [
      latestOriginationVersion?.content ?? "",
      latestOriginationVersion?.structured_data
        ? JSON.stringify(latestOriginationVersion.structured_data)
        : "",
    ]
      .join("\n")
      .toLowerCase();
  }
  const p0SeedEvidenceText = [briefString, latestOriginationBriefText].join(
    "\n",
  );
  const charter = program.charter ?? null;
  const p0ProblemText =
    cleanText(program.problemStatement) ||
    readScaffoldString(charter, "problem_statement", "problemStatement") ||
    readRecordString(
      charter,
      "problem_statement",
      "problemStatement",
      "business_trigger",
    );
  const p0ValueText =
    cleanText(program.targetOutcome) ||
    readScaffoldString(charter, "value_hypothesis", "valueHypothesis") ||
    readRecordString(
      charter,
      "value_hypothesis",
      "valueHypothesis",
      "target_outcome",
      "targetOutcome",
      "initial_value_hypothesis",
    );
  const p0SponsorText =
    readScaffoldString(charter, "sponsor_candidate", "sponsorCandidate") ||
    readRecordString(
      charter,
      "sponsor_candidate",
      "sponsorCandidate",
      "sponsor",
      "stakeholder_owner_view",
    );
  const p0ScopeText =
    readScaffoldString(charter, "scope_boundary", "scopeBoundary") ||
    readRecordString(
      charter,
      "scope_boundary",
      "scopeBoundary",
      "initial_scope",
      "affected_function_process",
    );
  const p0EvidenceText =
    readScaffoldString(charter, "evidence_family", "evidenceFamily") ||
    readRecordString(
      charter,
      "evidence_family",
      "evidenceFamily",
      "known_evidence",
    );
  const p0FoundationText =
    cleanText(program.timelineHorizon) ||
    readScaffoldString(
      charter,
      "foundation_readiness",
      "foundationReadiness",
    ) ||
    readRecordString(
      charter,
      "foundation_readiness",
      "foundationReadiness",
      "timeline",
      "timeline_horizon",
      "missing_evidence_open_questions",
    );

  let latestDiscoveryReportText = "";
  let discoveryVersionError: { message?: string | null } | null = null;
  if (discoveryReportRow) {
    const { data: discoveryVersions, error: discoveryVersionsError } = await sb
      .from("deliverable_versions")
      .select("content, structured_data, generated_at")
      .eq("deliverable_id", (discoveryReportRow as { id?: string }).id)
      .order("generated_at", { ascending: false })
      .limit(1);
    discoveryVersionError = discoveryVersionsError ?? null;
    const latestDiscoveryVersion = ((discoveryVersions as Array<{
      content: string | null;
      structured_data: Record<string, unknown> | null;
    }> | null) ?? [])[0];
    latestDiscoveryReportText = discoveryReportTextFromLatestVersion(
      latestDiscoveryVersion,
    );
  }

  // The 6-phase doctrine moved Discovery to P2 (Discover & Diagnose),
  // so the legacy "before P2 gate close" cues now refer to P3-entry
  // risks. We accept either phrasing here so prior synthesis content
  // remains compatible with the new model.
  const discoveryReportNamesFutureGateRisk =
    /\bbefore p[2-4] gate close\b/.test(latestDiscoveryReportText) ||
    /\bat p[2-4] entry\b/.test(latestDiscoveryReportText) ||
    /\bfor p[2-4] entry resolution\b/.test(latestDiscoveryReportText) ||
    /\bbefore p[2-4] scoping begins\b/.test(latestDiscoveryReportText) ||
    /\bbefore (?:synthesis|design) (?:wraps|closes)\b/.test(
      latestDiscoveryReportText,
    ) ||
    /\bwill block p[2-4][→-]p[3-5]\b/.test(latestDiscoveryReportText) ||
    /\bbecomes a hard blocker at p[2-4][→-]p[3-5]\b/.test(
      latestDiscoveryReportText,
    ) ||
    /\bp[2-4] architecture trade-?off\b/.test(latestDiscoveryReportText) ||
    /\bnot blocking (?:advance|the gate|gate advancement)\b/.test(
      latestDiscoveryReportText,
    ) ||
    /\bdoes not block (?:advance|the gate|gate advancement)\b/.test(
      latestDiscoveryReportText,
    );
  const discoveryReportExplicitlyClearsHardGaps =
    /\b(?:no|zero)\s+(?:open\s+|unresolved\s+)?hard (?:evidence )?gaps?\b/.test(
      latestDiscoveryReportText,
    ) ||
    /\bwithout\s+(?:open\s+|unresolved\s+)?hard (?:evidence )?gaps?\b/.test(
      latestDiscoveryReportText,
    );
  const discoveryReportHasHardGap =
    (/\bhard gaps?\b/.test(latestDiscoveryReportText) &&
      !discoveryReportExplicitlyClearsHardGaps) ||
    (/\bhard evidence gaps?\b/.test(latestDiscoveryReportText) &&
      !discoveryReportExplicitlyClearsHardGaps) ||
    /\bdo not advance\b/.test(latestDiscoveryReportText) ||
    /\bhold on\b/.test(latestDiscoveryReportText) ||
    (/\bnot yet (pulled|extracted|captured|named|confirmed|verified|attested)\b/.test(
      latestDiscoveryReportText,
    ) &&
      !discoveryReportNamesFutureGateRisk) ||
    /\bunverified\b/.test(latestDiscoveryReportText) ||
    /\bto resolve within\b/.test(latestDiscoveryReportText);
  const discoveryReportHasNamedOwnerGap =
    !discoveryReportNamesFutureGateRisk &&
    (/\b(technical|security|business|adoption)\s+owner:\s*not yet named\b/.test(
      latestDiscoveryReportText,
    ) ||
      /\bowner names?\s*\([^)]*\)\s*(missing|unresolved|required)\b/.test(
        latestDiscoveryReportText,
      ));
  const discoveryReportHasBaselineAttestation =
    /\bbaselines?\b/.test(latestDiscoveryReportText) &&
    /\b(attested|owner attestation|captured|current state|source of record)\b/.test(
      latestDiscoveryReportText,
    ) &&
    !discoveryReportHasHardGap;
  const discoveryReportHasWorkshopEvidence =
    latestDiscoveryReportText.length > 0 &&
    /\b(workshop|meeting notes|interview|attendees|source of record|owner attestation)\b/.test(
      latestDiscoveryReportText,
    ) &&
    /\b(decision|baseline|contradiction|action item|stakeholder)\b/.test(
      latestDiscoveryReportText,
    ) &&
    !discoveryReportHasHardGap;

  // Every criterion below answers from the seven reads above, and an unreadable
  // read is indistinguishable from a Move that produced nothing. Refuse by name
  // rather than let 30 of the 38 branches report an absence nobody observed.
  // The verdict does not change — an unread state cannot clear a HARD
  // criterion — only what the refusal says.
  const stateReadback = classifyGateStateReads({
    deliverables: deliverablesError ? { error: deliverablesError } : null,
    program_modules: modulesError ? { error: modulesError } : null,
    engagement_participants: participantsError
      ? { error: participantsError }
      : null,
    approval_requests: approvalRequestsError
      ? { error: approvalRequestsError }
      : null,
    milestones: milestonesError ? { error: milestonesError } : null,
    origination_brief_version: originationVersionError
      ? { error: originationVersionError }
      : null,
    discovery_report_version: discoveryVersionError
      ? { error: discoveryVersionError }
      : null,
    linked_artifacts: linkedArtifactRows.error
      ? { error: linkedArtifactRows.error }
      : null,
  });
  if (!stateReadback.readable) {
    return {
      pass: false,
      failedChecks: [
        {
          check: GATE_STATE_UNREADABLE_CHECK,
          reason: describeUnreadableGateState(stateReadback.unreadable),
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    };
  }

  const failedChecks: GateCheck["failedChecks"] = [];
  for (const c of rule.checks) {
    let pass = false;
    let failureReason = c.describe;
    switch (c.key) {
      case "program_seed_recorded":
        // Initial Setup approval only unlocks P0. P0 -> P1 needs the
        // actual P0 seed artifact signed off; otherwise the button can skip
        // the Origination work Nexus just coached the user through.
        pass = hasSignedOriginationBrief;
        break;
      case "value_hypothesis_seed": {
        pass =
          hasSignedOriginationBrief &&
          ((hasText(p0ProblemText) && hasText(p0ValueText)) ||
            (/\b(problem|problem_statement|trigger|current pain|pain)\b/.test(
              p0SeedEvidenceText,
            ) &&
              /\b(value hypothesis|target_outcome|target outcome|outcome|mechanism)\b/.test(
                p0SeedEvidenceText,
              )));
        break;
      }
      case "charter_drafted":
        pass = Boolean(charterRow && charterRow.status !== null);
        break;
      case "charter_signed_off": {
        const verdict = signOffVerdict(charterRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "charter",
          });
        }
        break;
      }
      case "sponsor_assigned":
        pass =
          hasSponsor ||
          (fromPhase === 0 &&
            hasSignedOriginationBrief &&
            (hasText(p0SponsorText) ||
              briefString.includes("sponsor") ||
              p0SeedEvidenceText.includes("sponsor")));
        break;
      case "discovery_report_signed_off": {
        const verdict = signOffVerdict(discoveryReportRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "discovery_report",
          });
        }
        break;
      }
      case "baseline_captured": {
        pass =
          moduleCompleted("baseline_capture", "baseline") ||
          isPresent(
            findDeliverable("baseline", "baseline_metrics", "value_baseline"),
          );
        break;
      }
      case "discovery_baseline_attested":
        pass =
          discoveryReportHasBaselineAttestation ||
          isSignedOff(
            findDeliverable("baseline", "baseline_metrics", "value_baseline"),
          ) ||
          (fromPhase === 2 &&
            /\bbaseline|current state|metric|volume|cost|quality|cycle time|handle time\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "discovery_stakeholders_named":
        pass =
          (latestDiscoveryReportText.length > 0 &&
            /\bstakeholder/.test(latestDiscoveryReportText) &&
            !discoveryReportHasNamedOwnerGap &&
            !discoveryReportHasHardGap) ||
          (fromPhase === 2 &&
            /\b(stakeholder|owner|ownership|sponsor|business|technology|risk|finance|operations|architecture|compliance|privacy|security|supervisor|steward|handoff|queue|role)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "p2_readiness_cleared":
        pass =
          (latestDiscoveryReportText.length > 0 &&
            !discoveryReportHasHardGap &&
            !/\bconditional proceed\b/.test(latestDiscoveryReportText)) ||
          (fromPhase === 2 &&
            /\b(proceed|recommend|clear|ready|no unresolved hard)\b/.test(
              phaseCaptureText,
            ) &&
            !/\b(do not advance|kill|stop|unresolved hard gap)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        if (!pass) {
          failureReason = p2ReadinessBlockedReason({
            hasReportRow: Boolean(discoveryReportRow),
            reportText: latestDiscoveryReportText,
            hasHardGap: discoveryReportHasHardGap,
          });
        }
        break;
      case "solution_route_validated":
        pass =
          captureCompleted(1, "business_change_assessment") &&
          captureCompleted(2, "solution_route_validation") &&
          confirmedSolutionRoute !== null;
        break;
      case "discovery_notes_ingested":
        pass =
          isPresent(
            findDeliverable(
              "discovery_notes",
              "meeting_notes",
              "workshop_notes",
            ),
          ) ||
          moduleCompleted("discovery_notes_ingest", "workshop_notes_ingest") ||
          (await hasProgramEvidence(programId, [1, 2], sb)) ||
          discoveryReportHasWorkshopEvidence ||
          (fromPhase === 2 &&
            /\b(current state|finding|baseline|metric|gap|root cause|handoff|process|data quality|governance|evidence confidence|recommendation)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "current_state_summary_drafted":
        pass = isPresent(
          findDeliverable(
            "current_state_summary",
            "discovery_summary",
            "current_state_assessment",
          ),
        );
        break;
      case "phase_3_findings_written": {
        pass =
          moduleCompleted("phase_3_findings", "findings") ||
          isPresent(findDeliverable("phase_3_findings", "design_findings"));
        break;
      }
      case "cxo_interview_complete":
        pass = cxoInterviewModule?.status === "completed";
        break;
      case "design_approved":
        if (confirmedSolutionRoute?.route === "technical_product") {
          pass = await meetsApprovalBar(
            findDeliverable("target_state_architecture"),
          );
          if (!pass) {
            failureReason =
              "Target architecture is not signed off with the required technology and risk/security reviews.";
          }
        } else if (
          confirmedSolutionRoute?.route === "process_change" &&
          confirmedSolutionRoute.workflowChange !== "material" &&
          confirmedSolutionRoute.roleAccountabilityChange !== "material"
        ) {
          pass =
            (await meetsApprovalBar(
              findDeliverable("target_state_architecture"),
            )) &&
            (await meetsApprovalBar(
              findDeliverable("process_change_estimate_brief"),
            ));
          if (!pass) {
            failureReason =
              "The target architecture and bounded process-change estimate brief must both be signed off.";
          }
        } else {
          pass = await anyMeetsApprovalBar(designRows);
        }
        break;
      case "requirements_design_outcome_trace":
        pass =
          confirmedSolutionRoute?.route === "technical_product" ||
          (confirmedSolutionRoute?.route === "process_change" &&
            confirmedSolutionRoute.workflowChange !== "material" &&
            confirmedSolutionRoute.roleAccountabilityChange !== "material")
            ? await meetsApprovalBar(requirementsTraceRow)
            : isPresent(requirementsTraceRow) ||
              (fromPhase === 3 &&
                /\b(requirement|trace|outcome|root cause|design choice|evidence-backed|validation)\b/.test(
                  phaseCaptureText,
                ) &&
                phaseModulesCompleted(fromPhase));
        break;
      case "vendor_selection_approved": {
        const vendor = findDeliverable(
          "vendor_selection",
          "source_award_recommendation",
        );
        pass = !vendor || vendor.status === "signed_off";
        break;
      }
      case "execution_plan_drafted": {
        pass = isPresent(executionRoadmapRow);
        break;
      }
      case "execution_roadmap_drafted":
        pass = isPresent(executionRoadmapRow);
        break;
      case "execution_milestones_defined":
        pass =
          milestoneRows.length > 0 ||
          briefString.includes("milestone") ||
          (fromPhase === 4 &&
            /\b(milestone|30\/60\/90|30-60-90|roadmap|sequence|critical path)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "execution_success_criteria_defined":
        pass =
          isPresent(
            findDeliverable(
              "execution_success_criteria",
              "execution_roadmap",
              "success_criteria",
            ),
          ) ||
          briefString.includes("success criteria") ||
          (fromPhase === 4 &&
            /\b(success criteria|target|baseline|measurement|kpi)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "delivery_raci_named":
        pass =
          isPresent(
            findDeliverable(
              "delivery_raci",
              "raci",
              // `operating_model_design` is the registry key for the Operating
              // Model Design — the P3 document that names the work split and
              // accountability this criterion is about. It is built by the P3
              // generation set and stored under the REGISTRY spelling, because
              // the acceptance path maps the orchestrator type back through
              // `deliverableKeyForOrchestratorType` before writing the row.
              // Only `operating_model`, the orchestrator alias, was listed, and
              // nothing ever writes that: the other two spellings are neither
              // registry keys nor allowed authorship keys either, so a
              // generated and signed-off Operating Model Design left this
              // criterion unmet and it passed only on the prose fallbacks
              // below.
              "operating_model_design",
              "operating_model",
            ),
          ) ||
          briefString.includes("raci") ||
          (fromPhase === 4 &&
            /\b(raci|owner|accountable|responsible|delivery lead)\b/.test(
              phaseCaptureText,
            ));
        break;
      case "tower_metric_plan_drafted":
        pass =
          isPresent(
            findDeliverable(
              // `tower_metrics_plan` is the registry key this criterion is
              // about: a `gateArtifact: true` P4 entry, in
              // `PHASE_CANONICAL_KEYS[4]`, and the key the generated-artifact
              // acceptance route writes for a Tower metrics document. It was
              // missing here, so the document the Move builds could not
              // satisfy the criterion named after it and the check passed only
              // on the prose fallback below.
              "tower_metrics_plan",
              "tower_metric_plan",
              "execution_monitoring_plan",
              "control_tower_metrics",
            ),
          ) ||
          briefString.includes("tower") ||
          briefString.includes("monitoring") ||
          (fromPhase === 4 &&
            /\b(tower|monitoring|metric|cadence|outcome ledger)\b/.test(
              phaseCaptureText,
            ));
        break;
      case "business_case_approved": {
        // The sixth HARD criterion that is a single sign-off call, and the only
        // one whose body reads `meetsApprovalBar` rather than `isSignedOff` —
        // that async wrapper delegates straight to `isSignedOff`, so the verdict
        // here is the same predicate and `pass` is unchanged. It was missed when
        // the other five were given causes because a grep for `isSignedOff`
        // structurally cannot see it. Of the four single-row sign-off criteria
        // that still restate themselves, this is the only one whose deliverable
        // is in `PHASE_CANONICAL_KEYS` (P4), which is what makes the `absent`
        // arm's "run Approve & Build" a remedy that can actually work here.
        const verdict = signOffVerdict(businessCaseRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "business_case",
          });
        }
        break;
      }
      case "funding_approval_recorded": {
        // SOFT, so neither blocked-message reader renders this sentence — both
        // filter to `severity === "hard"` first. It is not inert: the advance
        // route copies every soft failure into the gate decision artifact's
        // `carriedGaps` WITH its reason, and that record is the auditable
        // account of what was outstanding when the Move advanced anyway. With
        // the default reason it stored the criterion's own `describe` —
        // "Funding or capacity approval recorded" — which reads as the thing
        // having happened and names neither the cause nor the next action.
        const row = findDeliverable(
          "funding_approval",
          "capacity_approval",
          "approval_memo",
        );
        const verdict = signOffVerdict(row);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            // The row's own spelling when one exists, so the sentence names the
            // document that is actually there rather than the first alias of
            // the group; the primary spelling when none does.
            deliverableTypeKey: row?.deliverable_type_key ?? "funding_approval",
          });
        }
        break;
      }
      case "sponsor_alignment_confirmed": {
        // `sponsor_alignment` is accepted alongside `stakeholder_alignment`
        // because this criterion has no capture-text fallback and no phase
        // generation set produces either key, so deliberate authorship
        // (`complete_deliverable`) is its ONLY producer — and that tool both
        // allows and advertises the two spellings as interchangeable for this
        // artifact. Reading only one of them meant an accepted, signed-off
        // alignment record could satisfy the criterion named after it or be
        // invisible to it, decided by which spelling the agent happened to
        // pick. Same class as `tower_metric_plan_drafted` below.
        const row = findDeliverable(
          "stakeholder_alignment",
          "sponsor_alignment",
        );
        const verdict = signOffVerdict(row);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey:
              row?.deliverable_type_key ?? "stakeholder_alignment",
          });
        }
        break;
      }
      case "readiness_and_change_plan_signed_off": {
        const verdict = signOffVerdict(changePlanRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "readiness_and_change_plan",
          });
        }
        break;
      }
      case "tower_handoff_plan_accepted": {
        const verdict = signOffVerdict(towerHandoffRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey:
              towerHandoffRow?.deliverable_type_key ?? "tower_handoff_plan",
          });
        }
        break;
      }
      case "handoff_package_signed_off": {
        const verdict = signOffVerdict(handoffPackageRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "handoff_package",
          });
        }
        break;
      }
      case "value_measurement_contract_signed_off": {
        const verdict = signOffVerdict(valueMeasurementContractRow);
        pass = verdict.ok;
        if (!pass) {
          failureReason = describeDeliverableSignOffFailure({
            cause: verdict.cause,
            status: verdict.status,
            deliverableTypeKey: "value_measurement_contract",
          });
        }
        break;
      }
      case "launch_readiness_attested":
        pass =
          isSignedOff(handoffPackageRow) ||
          (fromPhase === 5 &&
            /\b(launch readiness|go\/no-go|go-no-go|entry criteria|environment|access|ready)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "tower_cadence_defined":
        pass =
          isSignedOff(valueMeasurementContractRow) ||
          isSignedOff(handoffPackageRow) ||
          (fromPhase === 5 &&
            /\b(tower|cadence|governance|measurement|reporting|review)\b/.test(
              phaseCaptureText,
            ) &&
            phaseModulesCompleted(fromPhase));
        break;
      case "p5_open_risks_recorded":
        pass =
          isSignedOff(handoffPackageRow) ||
          (fromPhase === 5 &&
            /\b(risk|open item|client-to-complete|caveat|mitigation)\b/.test(
              phaseCaptureText,
            ));
        break;
      case "discovery_funding_envelope":
        pass =
          hasText(p0FoundationText) ||
          briefString.includes("timeline") ||
          briefString.includes("funding") ||
          briefString.includes("capacity") ||
          briefString.includes("budget") ||
          p0SeedEvidenceText.includes("timeline") ||
          p0SeedEvidenceText.includes("funding") ||
          p0SeedEvidenceText.includes("capacity") ||
          p0SeedEvidenceText.includes("time box");
        break;
      case "initial_scope_boundary":
        pass =
          hasText(p0ScopeText) ||
          briefString.includes("scope") ||
          briefString.includes("cohort") ||
          briefString.includes("internal teams") ||
          briefString.includes("use case") ||
          p0SeedEvidenceText.includes("scope") ||
          p0SeedEvidenceText.includes("cohort") ||
          p0SeedEvidenceText.includes("use case");
        break;
      case "evidence_family_selected":
        pass =
          Boolean(program.archetype) ||
          hasText(p0EvidenceText) ||
          briefString.includes("evidence") ||
          briefString.includes("dora") ||
          p0SeedEvidenceText.includes("evidence family") ||
          p0SeedEvidenceText.includes("first evidence");
        break;
      case "fast_lane_decision_recorded":
        // Reaching fromPhase===1 already proves the P0->P1 gate passed (a
        // listed sponsor contact + approved origination brief) — this check only needs
        // to confirm the Move still carries the 'Straightforward' tag.
        // evaluateGate only reaches this rule at all when that's already
        // true (see the (1,5) branch above), so this is a defense-in-depth
        // re-check, not the primary gate.
        pass = resolveMoveTier(program.charter) === "Straightforward";
        break;
      default:
        pass = false;
    }
    if (!pass)
      failedChecks.push({
        check: c.key,
        reason: failureReason,
        severity: c.severity,
      });
  }

  const hardFails = failedChecks.some((f) => f.severity === "hard");
  return {
    pass: failedChecks.length === 0,
    failedChecks,
    requiresApproval: rule.hard && !hardFails,
    approverRole: rule.hard ? rule.approverRole : null,
  };
}

export async function decideApproval(
  ctx: TenancyCtx,
  programId: string,
  approvalId: string,
  decision: "approved" | "denied",
  notes?: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();

  const { data, error } = await sb
    .from("founder_approval_requests")
    .update({
      status: decision,
      approver_user_id: ctx.userId,
      decision_notes: notes ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("engagement_id", programId)
    .eq("id", approvalId)
    .eq("status", "pending")
    .select("id, engagement_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const resolvedProgramId =
    (data as { engagement_id?: string | null } | null)?.engagement_id ??
    programId;
  await writeProgramAuditLogBestEffort(ctx, {
    programId: resolvedProgramId,
    engagementId: resolvedProgramId,
    action: `phase_approval_${decision}`,
    fromState: "approval_pending",
    toState: decision,
    rationale: notes ?? null,
    evidenceRefs: [approvalId],
  });
  return true;
}

/**
 * Raise a Maestro oversight flag. Called by the Maestro agent, Nexus
 * quality gate, or explicit user action.
 */
export async function raiseMaestroFlag(
  ctx: TenancyCtx,
  programId: string,
  input: {
    flagType:
      | "decision_required"
      | "approval_needed"
      | "quality_concern"
      | "risk_detected"
      | "policy_violation"
      | "scope_drift";
    severity: "critical" | "warning" | "info";
    raisedBy: "maestro" | "nexus" | "system" | "user";
    headline: string;
    context?: Record<string, unknown>;
  },
): Promise<string> {
  assertTenancy(ctx);
  const sb = getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("maestro_oversight_flags")
    .insert({
      engagement_id: programId,
      flag_type: input.flagType,
      severity: input.severity,
      raised_by: input.raisedBy,
      raised_by_user_id: input.raisedBy === "user" ? ctx.userId : null,
      headline: input.headline,
      context_jsonb: input.context ?? {},
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function resolveMaestroFlag(
  ctx: TenancyCtx,
  programId: string,
  flagId: string,
  resolutionNotes: string,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const { data, error } = await sb
    .from("maestro_oversight_flags")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by_user_id: ctx.userId,
      resolution_notes: resolutionNotes,
    })
    .eq("engagement_id", programId)
    .eq("id", flagId)
    .is("resolved_at", null)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

/**
 * Policy check for a user's authority on a specific action. Used by API
 * routes before mutating program state.
 */
export async function hasAuthority(
  ctx: TenancyCtx,
  programId: string,
  required: ApprovalAuthority,
  opts: { supabase?: SupabaseClient } = {},
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = opts.supabase ?? getAzureWriteFluentClient();
  const { data } = await sb
    .from("engagement_participants")
    .select("approval_authority")
    .eq("engagement_id", programId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  const auth = (data as { approval_authority: ApprovalAuthority | null } | null)
    ?.approval_authority;
  if (!auth || required === "sponsor" || auth === "sponsor") return false;
  const hierarchy: Record<ApprovalAuthority, number> = {
    observer: 0,
    contributor: 1,
    approver: 2,
    sponsor: 1,
  };
  return hierarchy[auth] >= hierarchy[required];
}
