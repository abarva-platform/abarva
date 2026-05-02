// Governance · Packet 4.
//
// Hard gates block advance until approval; soft gates allow advance with
// an unresolved marker. Every check returns a GateCheck (shape in
// types.ts). Approvals route through founder_approval_requests.
//
// Hard gates (per application-control-plane lifecycle):
//   • P0 → P1 — approved seed can enter Discovery
//   • P2 → P3 — sponsor-signed charter can enter Design
//   • P3 → P4 — signed design can become an execution roadmap
//   • P4 → P5 — roadmap package can become approval/mobilization package
//   • P5 → P6 — funded, ready package can hand off monitoring to Tower
//
// Soft gates: later phase advances can bypass with reason. P0 exit is
// deliberately hard because it is where an idea becomes a funded
// Discovery motion.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  ApprovalAuthority,
  FounderApprovalRequestRow,
  GateCheck,
  TenancyCtx,
} from './types.db';
import { getProgramById } from './queries';
import { writeProgramAuditLogBestEffort } from './audit-log';

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/governance] TenancyCtx missing clientId or userId');
  }
}

interface GateRule {
  fromPhase: number;
  toPhase: number;
  hard: boolean;
  approverRole: ApprovalAuthority;
  checks: Array<{ key: string; describe: string; severity: 'hard' | 'soft' }>;
}

const GATE_RULES: GateRule[] = [
  {
    fromPhase: 0, toPhase: 1, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'program_seed_recorded', describe: 'Program seed recorded with classification', severity: 'hard' },
      { key: 'value_hypothesis_seed', describe: 'Value hypothesis seed names problem and target outcome', severity: 'hard' },
      { key: 'sponsor_assigned', describe: 'Sponsor candidate assigned for Phase 0 exit', severity: 'hard' },
      { key: 'discovery_funding_envelope', describe: 'Discovery funding or capacity envelope stated', severity: 'soft' },
      { key: 'initial_scope_boundary', describe: 'Initial scope boundary names the first cohort or use case', severity: 'soft' },
      { key: 'evidence_family_selected', describe: 'Evidence family selected for Phase 1 Discovery', severity: 'soft' },
    ],
  },
  {
    fromPhase: 1, toPhase: 2, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'discovery_report_signed_off', describe: 'Discovery synthesis report signed off', severity: 'hard' },
      { key: 'discovery_notes_ingested', describe: 'Discovery notes or workshop logs ingested', severity: 'hard' },
      { key: 'discovery_baseline_attested', describe: 'Baseline metrics are captured and attested, not merely planned', severity: 'hard' },
      { key: 'discovery_stakeholders_named', describe: 'Stakeholder map names required human owners with no hard-owner gaps', severity: 'hard' },
      { key: 'p2_readiness_cleared', describe: 'Discovery recommendation clears P2 without unresolved hard gaps', severity: 'hard' },
    ],
  },
  {
    fromPhase: 2, toPhase: 3, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'charter_signed_off', describe: 'Charter signed off by sponsor', severity: 'hard' },
      { key: 'baseline_captured', describe: 'Baseline metrics captured', severity: 'soft' },
      { key: 'sponsor_assigned', describe: 'Sponsor assigned', severity: 'hard' },
    ],
  },
  {
    fromPhase: 3, toPhase: 4, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'design_approved', describe: 'Solution and operating-model design signed off', severity: 'hard' },
      { key: 'requirements_design_outcome_trace', describe: 'Requirements-to-design-to-outcomes traceability captured', severity: 'hard' },
      { key: 'phase_3_findings_written', describe: 'Phase 3 findings written', severity: 'soft' },
      { key: 'cxo_interview_complete', describe: 'CXO interview completed', severity: 'soft' },
    ],
  },
  {
    fromPhase: 4, toPhase: 5, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'execution_roadmap_drafted', describe: 'Execution roadmap drafted with workstreams, estimates, timeline, milestones, dependencies, RACI, and risks', severity: 'hard' },
      { key: 'execution_milestones_defined', describe: 'Critical execution milestones defined', severity: 'hard' },
      { key: 'execution_success_criteria_defined', describe: 'Success criteria defined by execution phase', severity: 'hard' },
      { key: 'delivery_raci_named', describe: 'Delivery RACI names business, technology, vendor, finance, change, and Tower owners', severity: 'soft' },
      { key: 'vendor_selection_approved', describe: 'Vendor selection approved if applicable', severity: 'soft' },
      { key: 'tower_metric_plan_drafted', describe: 'Tower monitoring metric plan drafted', severity: 'soft' },
    ],
  },
  {
    fromPhase: 5, toPhase: 6, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'business_case_approved', describe: 'Business case approved for funding and mobilization', severity: 'hard' },
      { key: 'funding_approval_recorded', describe: 'Funding or capacity approval recorded', severity: 'hard' },
      { key: 'sponsor_alignment_confirmed', describe: 'Sponsor and stakeholder alignment confirmed', severity: 'hard' },
      { key: 'readiness_and_change_plan_signed_off', describe: 'Business readiness and change-management plan signed off', severity: 'hard' },
      { key: 'tower_handoff_plan_accepted', describe: 'Tower handoff and execution monitoring setup accepted', severity: 'hard' },
    ],
  },
];

export function findGateRule(fromPhase: number, toPhase: number): GateRule | null {
  return GATE_RULES.find((g) => g.fromPhase === fromPhase && g.toPhase === toPhase) ?? null;
}

async function hasProgramEvidence(programId: string, phase: number): Promise<boolean> {
  const sb = getServerSupabase();
  const { data } = await sb
    .from('program_evidence_items')
    .select('id')
    .eq('program_id', programId)
    .eq('phase', phase)
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
): Promise<GateCheck> {
  assertTenancy(ctx);
  const rule = findGateRule(fromPhase, toPhase);
  if (!rule) {
    return { pass: false, failedChecks: [{ check: 'no_rule', reason: `No gate rule for ${fromPhase}→${toPhase}`, severity: 'hard' }], requiresApproval: false, approverRole: null };
  }
  const program = await getProgramById(ctx, programId);
  if (!program) {
    return { pass: false, failedChecks: [{ check: 'program_not_found', reason: 'Program not accessible', severity: 'hard' }], requiresApproval: false, approverRole: null };
  }
  if (program.currentPhase !== fromPhase) {
    return {
      pass: false,
      failedChecks: [{ check: 'phase_mismatch', reason: `Program is on phase ${program.currentPhase ?? 'unknown'}, not ${fromPhase}`, severity: 'hard' }],
      requiresApproval: false,
      approverRole: null,
    };
  }

  const sb = getServerSupabase();

  // Collect state signals
  const [{ data: deliverables }, { data: modules }, { data: participants }, { data: approvalRequests }, { data: milestones }] = await Promise.all([
    sb.from('deliverables_v2').select('id, deliverable_type_key, status').eq('engagement_id', programId),
    sb.from('program_modules').select('module_key, status').eq('engagement_id', programId),
    sb.from('engagement_participants').select('user_id, approval_authority').eq('engagement_id', programId),
    sb
      .from('program_approval_requests')
      .select('request_status, brief_snapshot')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(1),
    sb.from('program_milestones').select('id, name, status').eq('engagement_id', programId).limit(20),
  ]);

  const deliverableRows = (deliverables as Array<{ id: string; deliverable_type_key: string; status: string }> | null ?? []);
  const moduleRows = (modules as Array<{ module_key: string; status: string }> | null ?? []);
  const milestoneRows = (milestones as Array<{ id: string; name: string | null; status: string | null }> | null ?? []);
  const findDeliverable = (...keys: string[]) => deliverableRows
    .find((d) => keys.includes(d.deliverable_type_key));
  const isSignedOff = (row: { status: string } | undefined) => row?.status === 'signed_off';
  const isPresent = (row: { status: string } | undefined) => Boolean(row);
  const moduleCompleted = (...keys: string[]) => moduleRows
    .some((m) => keys.includes(m.module_key) && m.status === 'completed');

  const charterRow = deliverableRows
    .find((d) => d.deliverable_type_key === 'charter');
  const designRow = findDeliverable('design_spec', 'design', 'design_brief', 'solution_design', 'operating_model_design');
  const executionRoadmapRow = findDeliverable('execution_roadmap', 'execution_plan', 'roadmap', 'mobilization_roadmap');
  const requirementsTraceRow = findDeliverable('requirements_traceability', 'requirements_design_outcome_trace', 'traceability_matrix');
  const businessCaseRow = findDeliverable('business_case', 'funding_business_case', 'approval_business_case');
  const discoveryReportRow = findDeliverable('discovery_report', 'discovery_synthesis', 'discovery_findings');
  const changePlanRow = findDeliverable('change_management_plan', 'business_readiness_plan', 'readiness_and_change_plan');
  const towerHandoffRow = findDeliverable('tower_handoff_plan', 'execution_monitoring_plan', 'control_tower_handoff');
  const cxoInterviewModule = moduleRows
    .find((m) => m.module_key === 'cxo_interview');
  const hasSponsor = (participants as Array<{ approval_authority: string | null }> | null ?? [])
    .some((p) => p.approval_authority === 'sponsor');
  const latestSeedBrief = ((approvalRequests as Array<{
    request_status: string | null;
    brief_snapshot: Record<string, unknown> | null;
  }> | null) ?? [])[0]?.brief_snapshot ?? {};
  const briefString = JSON.stringify(latestSeedBrief).toLowerCase();

  let latestDiscoveryReportText = '';
  if (discoveryReportRow) {
    const { data: discoveryVersions } = await sb
      .from('deliverable_versions')
      .select('content, structured_data, generated_at')
      .eq('deliverable_id', (discoveryReportRow as { id?: string }).id)
      .order('generated_at', { ascending: false })
      .limit(1);
    const latestDiscoveryVersion = ((discoveryVersions as Array<{
      content: string | null;
      structured_data: Record<string, unknown> | null;
    }> | null) ?? [])[0];
    latestDiscoveryReportText = [
      latestDiscoveryVersion?.content ?? '',
      latestDiscoveryVersion?.structured_data ? JSON.stringify(latestDiscoveryVersion.structured_data) : '',
    ].join('\n').toLowerCase();
  }

  const discoveryReportHasHardGap =
    /\bhard gaps?\b/.test(latestDiscoveryReportText) ||
    /\bhard evidence gaps?\b/.test(latestDiscoveryReportText) ||
    /\bdo not advance\b/.test(latestDiscoveryReportText) ||
    /\bhold on\b/.test(latestDiscoveryReportText) ||
    /\bnot yet (pulled|extracted|captured|named|confirmed|verified|attested)\b/.test(latestDiscoveryReportText) ||
    /\bunverified\b/.test(latestDiscoveryReportText) ||
    /\bto resolve within\b/.test(latestDiscoveryReportText);
  const discoveryReportHasNamedOwnerGap =
    /\b(technical|security|business|adoption)\s+owner:\s*not yet named\b/.test(latestDiscoveryReportText) ||
    /\bowner names?\s*\([^)]*\)\s*(missing|unresolved|required)\b/.test(latestDiscoveryReportText);
  const discoveryReportHasBaselineAttestation =
    /\bbaseline\b/.test(latestDiscoveryReportText) &&
    /\b(attested|owner attestation|captured|current state|source of record)\b/.test(latestDiscoveryReportText) &&
    !discoveryReportHasHardGap;

  const failedChecks: GateCheck['failedChecks'] = [];
  for (const c of rule.checks) {
    let pass = false;
    switch (c.key) {
      case 'program_seed_recorded':
        pass =
          Boolean(program.archetype) ||
          typeof latestSeedBrief.matched_pattern_id === 'string' ||
          typeof latestSeedBrief.classification === 'string' ||
          typeof latestSeedBrief.function_code === 'string' ||
          typeof latestSeedBrief.objective_code === 'string' ||
          typeof latestSeedBrief.topic_code === 'string';
        break;
      case 'value_hypothesis_seed': {
        const problem = latestSeedBrief.problem_statement ?? latestSeedBrief.problemStatement;
        const target = latestSeedBrief.target_outcome ?? latestSeedBrief.targetOutcome;
        pass = typeof problem === 'string' && problem.trim().length >= 12 &&
          (typeof target === 'string' ? target.trim().length >= 8 : briefString.includes('target'));
        break;
      }
      case 'charter_drafted': pass = Boolean(charterRow && charterRow.status !== null); break;
      case 'charter_signed_off': pass = isSignedOff(charterRow); break;
      case 'sponsor_assigned': pass = hasSponsor; break;
      case 'discovery_report_signed_off':
        pass = isSignedOff(discoveryReportRow);
        break;
      case 'baseline_captured': {
        pass = moduleCompleted('baseline_capture', 'baseline') ||
          isPresent(findDeliverable('baseline', 'baseline_metrics', 'value_baseline'));
        break;
      }
      case 'discovery_baseline_attested':
        pass = discoveryReportHasBaselineAttestation ||
          isSignedOff(findDeliverable('baseline', 'baseline_metrics', 'value_baseline'));
        break;
      case 'discovery_stakeholders_named':
        pass = latestDiscoveryReportText.length > 0 &&
          /\bstakeholder/.test(latestDiscoveryReportText) &&
          !discoveryReportHasNamedOwnerGap &&
          !discoveryReportHasHardGap;
        break;
      case 'p2_readiness_cleared':
        pass = latestDiscoveryReportText.length > 0 &&
          !discoveryReportHasHardGap &&
          !/\bconditional proceed\b/.test(latestDiscoveryReportText);
        break;
      case 'discovery_notes_ingested':
        pass = isPresent(findDeliverable('discovery_notes', 'meeting_notes', 'workshop_notes')) ||
          moduleCompleted('discovery_notes_ingest', 'workshop_notes_ingest') ||
          (await hasProgramEvidence(programId, 1));
        break;
      case 'current_state_summary_drafted':
        pass = isPresent(findDeliverable('current_state_summary', 'discovery_summary', 'current_state_assessment'));
        break;
      case 'phase_3_findings_written': {
        pass = moduleCompleted('phase_3_findings', 'findings') ||
          isPresent(findDeliverable('phase_3_findings', 'design_findings'));
        break;
      }
      case 'cxo_interview_complete': pass = cxoInterviewModule?.status === 'completed'; break;
      case 'design_approved': pass = isSignedOff(designRow); break;
      case 'requirements_design_outcome_trace': pass = isPresent(requirementsTraceRow); break;
      case 'vendor_selection_approved': {
        const vendor = findDeliverable('vendor_selection', 'source_award_recommendation');
        pass = !vendor || vendor.status === 'signed_off';
        break;
      }
      case 'execution_plan_drafted': {
        pass = isPresent(executionRoadmapRow);
        break;
      }
      case 'execution_roadmap_drafted': pass = isPresent(executionRoadmapRow); break;
      case 'execution_milestones_defined':
        pass = milestoneRows.length > 0 || briefString.includes('milestone');
        break;
      case 'execution_success_criteria_defined':
        pass = isPresent(findDeliverable('execution_success_criteria', 'execution_roadmap', 'success_criteria')) ||
          briefString.includes('success criteria');
        break;
      case 'delivery_raci_named':
        pass = isPresent(findDeliverable('delivery_raci', 'raci', 'operating_model')) ||
          briefString.includes('raci');
        break;
      case 'tower_metric_plan_drafted':
        pass = isPresent(findDeliverable('tower_metric_plan', 'execution_monitoring_plan', 'control_tower_metrics')) ||
          briefString.includes('tower') || briefString.includes('monitoring');
        break;
      case 'business_case_approved': pass = isSignedOff(businessCaseRow); break;
      case 'funding_approval_recorded':
        pass = isSignedOff(findDeliverable('funding_approval', 'capacity_approval', 'approval_memo'));
        break;
      case 'sponsor_alignment_confirmed':
        pass = isSignedOff(findDeliverable('stakeholder_alignment', 'sponsor_alignment'));
        break;
      case 'readiness_and_change_plan_signed_off': pass = isSignedOff(changePlanRow); break;
      case 'tower_handoff_plan_accepted': pass = isSignedOff(towerHandoffRow); break;
      case 'discovery_funding_envelope':
        pass =
          briefString.includes('timeline') ||
          briefString.includes('funding') ||
          briefString.includes('capacity') ||
          briefString.includes('budget');
        break;
      case 'initial_scope_boundary':
        pass =
          briefString.includes('scope') ||
          briefString.includes('cohort') ||
          briefString.includes('internal teams') ||
          briefString.includes('use case');
        break;
      case 'evidence_family_selected':
        pass = Boolean(program.archetype) || briefString.includes('evidence') || briefString.includes('dora');
        break;
      default: pass = false;
    }
    if (!pass) failedChecks.push({ check: c.key, reason: c.describe, severity: c.severity });
  }

  const hardFails = failedChecks.some((f) => f.severity === 'hard');
  return {
    pass: failedChecks.length === 0,
    failedChecks,
    requiresApproval: rule.hard && !hardFails,
    approverRole: rule.hard ? rule.approverRole : null,
  };
}

export async function requestFounderApproval(
  ctx: TenancyCtx,
  programId: string,
  input: {
    requestType: FounderApprovalRequestRow['requestType'];
    headline: string;
    context?: Record<string, unknown>;
    approverUserId?: string;
    approverRole?: ApprovalAuthority;
    deadlineHours?: number;
  },
): Promise<string> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const deadline = input.deadlineHours
    ? new Date(Date.now() + input.deadlineHours * 3_600_000).toISOString()
    : null;
  const { data, error } = await sb
    .from('founder_approval_requests')
    .insert({
      engagement_id: programId,
      request_type: input.requestType,
      status: 'pending',
      requested_by_user_id: ctx.userId,
      approver_user_id: input.approverUserId ?? null,
      approver_role: input.approverRole ?? null,
      headline: input.headline,
      context_jsonb: input.context ?? {},
      deadline_at: deadline,
    })
    .select('id')
    .single();
  if (error) throw error;
  const approvalId = (data as { id: string }).id;
  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: 'phase_approval_requested',
    fromState: null,
    toState: 'approval_pending',
    rationale: input.headline,
    evidenceRefs: [approvalId],
  });
  return approvalId;
}

export async function decideApproval(
  ctx: TenancyCtx,
  approvalId: string,
  decision: 'approved' | 'denied',
  notes?: string,
): Promise<void> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('founder_approval_requests')
    .update({
      status: decision,
      approver_user_id: ctx.userId,
      decision_notes: notes ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .eq('status', 'pending')
    .select('id, engagement_id')
    .single();
  if (error) throw error;
  const programId = (data as { engagement_id?: string | null } | null)?.engagement_id ?? approvalId;
  await writeProgramAuditLogBestEffort(ctx, {
    programId,
    engagementId: programId,
    action: `phase_approval_${decision}`,
    fromState: 'approval_pending',
    toState: decision,
    rationale: notes ?? null,
    evidenceRefs: [approvalId],
  });
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
      | 'decision_required' | 'approval_needed' | 'quality_concern'
      | 'risk_detected' | 'policy_violation' | 'scope_drift';
    severity: 'critical' | 'warning' | 'info';
    raisedBy: 'maestro' | 'nexus' | 'system' | 'user';
    headline: string;
    context?: Record<string, unknown>;
  },
): Promise<string> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('maestro_oversight_flags')
    .insert({
      engagement_id: programId,
      flag_type: input.flagType,
      severity: input.severity,
      raised_by: input.raisedBy,
      raised_by_user_id: input.raisedBy === 'user' ? ctx.userId : null,
      headline: input.headline,
      context_jsonb: input.context ?? {},
    })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function resolveMaestroFlag(
  ctx: TenancyCtx,
  flagId: string,
  resolutionNotes: string,
): Promise<void> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { error } = await sb
    .from('maestro_oversight_flags')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by_user_id: ctx.userId,
      resolution_notes: resolutionNotes,
    })
    .eq('id', flagId);
  if (error) throw error;
}

/**
 * Policy check for a user's authority on a specific action. Used by API
 * routes before mutating program state.
 */
export async function hasAuthority(
  ctx: TenancyCtx,
  programId: string,
  required: ApprovalAuthority,
): Promise<boolean> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data } = await sb
    .from('engagement_participants')
    .select('approval_authority')
    .eq('engagement_id', programId)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  const auth = (data as { approval_authority: ApprovalAuthority | null } | null)?.approval_authority;
  if (!auth) return false;
  const hierarchy: Record<ApprovalAuthority, number> = { observer: 0, contributor: 1, approver: 2, sponsor: 3 };
  return hierarchy[auth] >= hierarchy[required];
}
