// Execute phase ops surface · Packet 11.
//
// Wraps milestones, work items, risks, and evidence for the Execute
// tab cluster. Reuses mutations.ts primitives and adds roll-ups,
// blocked-item escalation, and Nexus-drafted flag helpers.
//
// Blocked items auto-escalate to Maestro oversight after 48h per
// Packet 11.

import { getServerSupabase } from '@/lib/supabase-server';
import type {
  MilestoneStatus,
  ProgramMilestoneRow,
  ProgramRiskRow,
  ProgramWorkItemRow,
  RiskImpact,
  RiskLikelihood,
  TenancyCtx,
} from './types.db';
import { getMilestones, getRisks, getWorkItems } from './queries';
import { raiseMaestroFlag } from './governance';

const BLOCKED_ESCALATION_HOURS = 48;

function assertTenancy(ctx: TenancyCtx): void {
  if (!ctx?.clientId || !ctx?.userId) {
    throw new Error('[programs/execute] TenancyCtx missing clientId or userId');
  }
}

export interface ExecuteRollup {
  milestones: {
    total: number;
    byStatus: Record<MilestoneStatus, number>;
    atRisk: ProgramMilestoneRow[];
    upcomingWithin30d: ProgramMilestoneRow[];
  };
  workItems: {
    total: number;
    byStatus: Record<ProgramWorkItemRow['status'], number>;
    blockedOver48h: Array<ProgramWorkItemRow & { blockedHours: number }>;
    overdue: ProgramWorkItemRow[];
  };
  risks: {
    total: number;
    open: number;
    critical: ProgramRiskRow[];
    byHeat: Record<string, number>;
  };
  nexusDrafted: {
    workItemCount: number;
    deliverableCount: number;
  };
}

function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

/**
 * Aggregate Execute-surface rollup. Used by the ExecuteSurface tab
 * cluster to render header stats + risk heatmap + attention queue.
 */
export async function getExecuteRollup(ctx: TenancyCtx, programId: string): Promise<ExecuteRollup> {
  assertTenancy(ctx);
  const [milestones, workItems, risks] = await Promise.all([
    getMilestones(ctx, programId),
    getWorkItems(ctx, programId),
    getRisks(ctx, programId),
  ]);

  const msByStatus: Record<MilestoneStatus, number> = {
    upcoming: 0, at_risk: 0, hit: 0, missed: 0, cancelled: 0,
  };
  const atRisk: ProgramMilestoneRow[] = [];
  const upcomingWithin30d: ProgramMilestoneRow[] = [];
  for (const m of milestones) {
    msByStatus[m.status] += 1;
    if (m.status === 'at_risk') atRisk.push(m);
    if (m.status === 'upcoming' && m.targetDate) {
      const days = (new Date(m.targetDate).getTime() - Date.now()) / 86_400_000;
      if (days >= 0 && days <= 30) upcomingWithin30d.push(m);
    }
  }

  const wiByStatus: Record<ProgramWorkItemRow['status'], number> = {
    open: 0, in_progress: 0, blocked: 0, done: 0, cancelled: 0,
  };
  const blockedOver48h: Array<ProgramWorkItemRow & { blockedHours: number }> = [];
  const overdue: ProgramWorkItemRow[] = [];
  for (const wi of workItems) {
    wiByStatus[wi.status] += 1;
    if (wi.status === 'blocked') {
      const blockedMarker = (wi.metadata?.blocked_at as string | undefined) ?? null;
      const hours = blockedMarker
        ? (Date.now() - new Date(blockedMarker).getTime()) / 3_600_000
        : 0;
      if (hours >= BLOCKED_ESCALATION_HOURS) blockedOver48h.push({ ...wi, blockedHours: Math.round(hours) });
    }
    if (wi.dueDate && wi.status !== 'done' && wi.status !== 'cancelled') {
      const d = (Date.now() - new Date(wi.dueDate).getTime()) / 86_400_000;
      if (d > 0) overdue.push(wi);
    }
  }

  const risksOpen = risks.filter((r) => r.status === 'open' || r.status === 'mitigating');
  const critical = risksOpen.filter((r) => r.likelihood === 'high' && r.impact === 'high');
  const heatBuckets = ['high_high', 'high_medium', 'medium_high', 'medium_medium', 'low_any'];
  const byHeat: Record<string, number> = Object.fromEntries(heatBuckets.map((k) => [k, 0]));
  for (const r of risksOpen) {
    const key =
      r.likelihood === 'high' && r.impact === 'high' ? 'high_high'
      : r.likelihood === 'high' && r.impact === 'medium' ? 'high_medium'
      : r.likelihood === 'medium' && r.impact === 'high' ? 'medium_high'
      : r.likelihood === 'medium' && r.impact === 'medium' ? 'medium_medium'
      : 'low_any';
    byHeat[key] += 1;
  }

  const nexusDraftedWorkItems = workItems.filter((wi) => wi.metadata?.nexus_drafted === true).length;

  const sb = getServerSupabase();
  const { count: nexusDrafted } = await sb
    .from('deliverables_v2')
    .select('id', { count: 'exact', head: true })
    .eq('engagement_id', programId)
    .eq('created_by', 'nexus');

  return {
    milestones: {
      total: milestones.length,
      byStatus: msByStatus,
      atRisk,
      upcomingWithin30d,
    },
    workItems: {
      total: workItems.length,
      byStatus: wiByStatus,
      blockedOver48h,
      overdue,
    },
    risks: {
      total: risks.length,
      open: risksOpen.length,
      critical,
      byHeat,
    },
    nexusDrafted: {
      workItemCount: nexusDraftedWorkItems,
      deliverableCount: nexusDrafted ?? 0,
    },
  };
}

/**
 * Scan a program's work items and escalate any that have been blocked
 * for >=48h by raising a Maestro oversight flag. Idempotent via
 * flag context fingerprint (flag is not re-raised for the same item
 * within a rolling window).
 *
 * Intended to run as a background sweep (every 15min same as
 * contradictions agent per spec §4.1).
 */
export async function escalateBlockedItems(ctx: TenancyCtx, programId: string): Promise<{ escalated: number; skipped: number }> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const workItems = await getWorkItems(ctx, programId);

  // Existing active flags referencing work items
  const { data: existingFlags } = await sb
    .from('maestro_oversight_flags')
    .select('context_jsonb')
    .eq('engagement_id', programId)
    .eq('flag_type', 'risk_detected')
    .is('resolved_at', null);
  const flaggedIds = new Set<string>();
  for (const f of ((existingFlags as Array<{ context_jsonb: Record<string, unknown> | null }> | null) ?? [])) {
    const wiId = (f.context_jsonb?.work_item_id as string | undefined) ?? undefined;
    if (wiId) flaggedIds.add(wiId);
  }

  let escalated = 0;
  let skipped = 0;
  for (const wi of workItems) {
    if (wi.status !== 'blocked') continue;
    const blockedMarker = (wi.metadata?.blocked_at as string | undefined) ?? null;
    if (!blockedMarker) { skipped += 1; continue; }
    const hours = (Date.now() - new Date(blockedMarker).getTime()) / 3_600_000;
    if (hours < BLOCKED_ESCALATION_HOURS) { skipped += 1; continue; }
    if (flaggedIds.has(wi.id)) { skipped += 1; continue; }

    await raiseMaestroFlag(ctx, programId, {
      flagType: 'risk_detected',
      severity: 'warning',
      raisedBy: 'system',
      headline: `Work item "${wi.title}" blocked ${Math.round(hours)}h`,
      context: {
        work_item_id: wi.id,
        blocked_hours: Math.round(hours),
        item_type: wi.itemType,
        assigned_user_id: wi.assignedUserId,
      },
    });
    escalated += 1;
  }
  return { escalated, skipped };
}

/**
 * Mark a work item as blocked with a reason. Sets blocked_at inside
 * metadata_jsonb so escalateBlockedItems can pick it up later.
 */
export async function blockWorkItem(ctx: TenancyCtx, programId: string, workItemId: string, reason: string): Promise<void> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data: current } = await sb
    .from('program_work_items')
    .select('metadata_jsonb')
    .eq('id', workItemId)
    .eq('engagement_id', programId)
    .maybeSingle();
  const nextMeta = {
    ...((current as { metadata_jsonb: Record<string, unknown> | null } | null)?.metadata_jsonb ?? {}),
    blocked_at: new Date().toISOString(),
    blocked_reason: reason,
    blocked_by_user_id: ctx.userId,
  };
  const { error } = await sb
    .from('program_work_items')
    .update({ status: 'blocked', metadata_jsonb: nextMeta })
    .eq('id', workItemId)
    .eq('engagement_id', programId);
  if (error) throw error;
}

/** Mark a work item as Nexus-drafted · sets metadata flag. */
export async function markWorkItemNexusDrafted(
  ctx: TenancyCtx,
  programId: string,
  workItemId: string,
  draftContext?: Record<string, unknown>,
): Promise<void> {
  assertTenancy(ctx);
  const sb = getServerSupabase();
  const { data: current } = await sb
    .from('program_work_items')
    .select('metadata_jsonb')
    .eq('id', workItemId)
    .eq('engagement_id', programId)
    .maybeSingle();
  const nextMeta = {
    ...((current as { metadata_jsonb: Record<string, unknown> | null } | null)?.metadata_jsonb ?? {}),
    nexus_drafted: true,
    nexus_drafted_at: new Date().toISOString(),
    nexus_draft_context: draftContext ?? {},
  };
  const { error } = await sb
    .from('program_work_items')
    .update({ metadata_jsonb: nextMeta })
    .eq('id', workItemId)
    .eq('engagement_id', programId);
  if (error) throw error;
}

/**
 * Risk heat score · high×high = 9, high×medium/medium×high = 6, etc.
 * Deterministic, used by the heatmap renderer.
 */
export function riskHeatScore(likelihood: RiskLikelihood, impact: RiskImpact): number {
  const map: Record<RiskLikelihood, number> = { low: 1, medium: 2, high: 3 };
  return map[likelihood] * map[impact];
}
