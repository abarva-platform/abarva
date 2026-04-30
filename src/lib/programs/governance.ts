// Governance · Packet 4.
//
// Hard gates block advance until approval; soft gates allow advance with
// an unresolved marker. Every check returns a GateCheck (shape in
// types.ts). Approvals route through founder_approval_requests.
//
// Hard gates (per Packet 4 §4.5):
//   • Phase 3 entry — charter signed_off
//   • Phase 3 CXO interview — sponsor attested findings
//   • Phase 5 entry — design approved
//   • Phase 6 CXO verification — outcome attestation
//
// Soft gates: any other phase advance, lead can bypass with reason.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  ApprovalAuthority,
  FounderApprovalRequestRow,
  GateCheck,
  TenancyCtx,
} from './types.db';
import { getProgramById } from './queries';

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
    fromPhase: 0, toPhase: 1, hard: false, approverRole: 'contributor',
    checks: [
      { key: 'sponsor_assigned', describe: 'Sponsor assigned for Phase 0 exit', severity: 'soft' },
    ],
  },
  {
    fromPhase: 1, toPhase: 2, hard: false, approverRole: 'contributor',
    checks: [
      { key: 'charter_drafted', describe: 'Charter has draft content', severity: 'soft' },
      { key: 'sponsor_assigned', describe: 'Sponsor assigned', severity: 'soft' },
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
    fromPhase: 3, toPhase: 4, hard: false, approverRole: 'approver',
    checks: [
      { key: 'phase_3_findings_written', describe: 'Phase 3 findings written', severity: 'soft' },
      { key: 'cxo_interview_complete', describe: 'CXO interview completed', severity: 'soft' },
    ],
  },
  {
    fromPhase: 4, toPhase: 5, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'design_approved', describe: 'Design approved by sponsor', severity: 'hard' },
      { key: 'vendor_selection_approved', describe: 'Vendor selection approved if applicable', severity: 'soft' },
      { key: 'execution_plan_drafted', describe: 'Execution plan drafted', severity: 'soft' },
    ],
  },
  {
    fromPhase: 5, toPhase: 6, hard: true, approverRole: 'sponsor',
    checks: [
      { key: 'outcome_report_drafted', describe: 'Outcome report drafted', severity: 'soft' },
      { key: 'cxo_verification_complete', describe: 'CXO verification completed', severity: 'hard' },
      { key: 'benefits_realization_attested', describe: 'Benefits realization attested', severity: 'hard' },
    ],
  },
];

export function findGateRule(fromPhase: number, toPhase: number): GateRule | null {
  return GATE_RULES.find((g) => g.fromPhase === fromPhase && g.toPhase === toPhase) ?? null;
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
  const [{ data: deliverables }, { data: modules }, { data: participants }] = await Promise.all([
    sb.from('deliverables_v2').select('id, deliverable_type_key, status').eq('engagement_id', programId),
    sb.from('program_modules').select('module_key, status').eq('engagement_id', programId),
    sb.from('engagement_participants').select('user_id, approval_authority').eq('engagement_id', programId),
  ]);

  const charterRow = (deliverables as Array<{ deliverable_type_key: string; status: string }> | null ?? [])
    .find((d) => d.deliverable_type_key === 'charter');
  const designRow = (deliverables as Array<{ deliverable_type_key: string; status: string }> | null ?? [])
    .find((d) => d.deliverable_type_key === 'design_spec' || d.deliverable_type_key === 'design' || d.deliverable_type_key === 'design_brief');
  const outcomeRow = (deliverables as Array<{ deliverable_type_key: string; status: string }> | null ?? [])
    .find((d) => d.deliverable_type_key === 'outcome_report');
  const cxoInterviewModule = (modules as Array<{ module_key: string; status: string }> | null ?? [])
    .find((m) => m.module_key === 'cxo_interview');
  const cxoVerificationModule = (modules as Array<{ module_key: string; status: string }> | null ?? [])
    .find((m) => m.module_key === 'cxo_verification');
  const hasSponsor = (participants as Array<{ approval_authority: string | null }> | null ?? [])
    .some((p) => p.approval_authority === 'sponsor');

  const failedChecks: GateCheck['failedChecks'] = [];
  for (const c of rule.checks) {
    let pass = false;
    switch (c.key) {
      case 'charter_drafted': pass = !!charterRow && charterRow.status !== null; break;
      case 'charter_signed_off': pass = charterRow?.status === 'signed_off'; break;
      case 'sponsor_assigned': pass = hasSponsor; break;
      case 'baseline_captured': {
        const baselineModule = (modules as Array<{ module_key: string; status: string }> | null ?? [])
          .find((m) => m.module_key === 'baseline_capture' || m.module_key === 'baseline');
        pass = baselineModule?.status === 'completed';
        break;
      }
      case 'phase_3_findings_written': {
        const findings = (modules as Array<{ module_key: string; status: string }> | null ?? [])
          .find((m) => m.module_key === 'phase_3_findings' || m.module_key === 'findings');
        pass = findings?.status === 'completed';
        break;
      }
      case 'cxo_interview_complete': pass = cxoInterviewModule?.status === 'completed'; break;
      case 'design_approved': pass = designRow?.status === 'signed_off'; break;
      case 'vendor_selection_approved': {
        const vendor = (deliverables as Array<{ deliverable_type_key: string; status: string }> | null ?? [])
          .find((d) => d.deliverable_type_key === 'vendor_selection');
        pass = !vendor || vendor.status === 'signed_off';
        break;
      }
      case 'execution_plan_drafted': {
        const ep = (deliverables as Array<{ deliverable_type_key: string; status: string }> | null ?? [])
          .find((d) => d.deliverable_type_key === 'execution_plan');
        pass = !!ep;
        break;
      }
      case 'outcome_report_drafted': pass = !!outcomeRow; break;
      case 'cxo_verification_complete': pass = cxoVerificationModule?.status === 'completed'; break;
      case 'benefits_realization_attested': {
        const benefits = (modules as Array<{ module_key: string; status: string }> | null ?? [])
          .find((m) => m.module_key === 'benefits_realization');
        pass = benefits?.status === 'completed';
        break;
      }
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
  return (data as { id: string }).id;
}

export async function decideApproval(
  ctx: TenancyCtx,
  approvalId: string,
  decision: 'approved' | 'denied',
  notes?: string,
): Promise<void> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { error } = await sb
    .from('founder_approval_requests')
    .update({
      status: decision,
      approver_user_id: ctx.userId,
      decision_notes: notes ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', approvalId)
    .eq('status', 'pending');
  if (error) throw error;
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
