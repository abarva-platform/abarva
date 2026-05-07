import 'server-only';

// Intelligence v3 · server-side data builders for the remaining
// stages (By function · Patterns · Peer activity · My strategy ·
// Sessions). Each builder is independent, returns typed data, and
// fails closed (returns null) if the active client / supporting
// substrate isn't available.

import { getServerSupabase } from '@/lib/supabase-server';
import { getActiveClientRow } from '@/lib/active-client';
import {
  getAIInitiativesPageData,
  type AIInitiative,
} from '@/lib/admin/ai-initiatives/queries';
import type {
  ByFunctionData,
  FunctionRollup,
  PeerActivityData,
  PeerSignal,
  MyStrategyData,
  StrategyTheme,
} from './stages-display';

// ---------------------------------------------------------------------
// owner_function → office layer mapping
// ---------------------------------------------------------------------

const FUNCTION_TO_LAYER: Record<string, 'experience' | 'decision' | 'operations'> = {
  // Front office
  'Operations': 'experience',
  'Store Operations': 'experience',
  'Customer Care': 'experience',
  'Wealth & Branch': 'experience',
  'Branch': 'experience',
  'Customer': 'experience',
  'Marketing': 'experience',
  'Clinical': 'experience',
  'Clinical Operations': 'experience',
  'Sales': 'experience',
  // Middle office
  'Finance': 'decision',
  'Risk': 'decision',
  'Credit': 'decision',
  'Compliance': 'decision',
  'Strategy': 'decision',
  'Governance': 'decision',
  'Underwriting': 'decision',
  // Back office
  'IT': 'operations',
  'CTO': 'operations',
  'Engineering': 'operations',
  'Operations Support': 'operations',
  'Revenue Cycle': 'operations',
  'Supply Chain': 'operations',
  'HR': 'operations',
};

function functionToLayer(fn: string | null): 'experience' | 'decision' | 'operations' {
  if (!fn) return 'decision';
  return FUNCTION_TO_LAYER[fn] ?? 'decision';
}

// ---------------------------------------------------------------------
// By function builder
// ---------------------------------------------------------------------

export async function getByFunctionData(): Promise<ByFunctionData | null> {
  const client = await getActiveClientRow().catch(() => null);
  if (!client) return null;
  const page = await getAIInitiativesPageData(client.id).catch(() => null);
  if (!page || page.initiatives.length === 0) return null;

  const sb = getServerSupabase();
  const initiativeIds = page.initiatives.map((i) => i.initiativeId);

  // Decisions for "Gates" lens
  const { data: decisionRows } = await sb
    .from('ai_initiative_decisions')
    .select('initiative_id, decision_status')
    .in('initiative_id', initiativeIds);
  const decisionsByInitiative = new Map<string, { pending: number; stalled: number }>();
  for (const r of (decisionRows ?? []) as Array<{ initiative_id: string; decision_status: string }>) {
    const cur = decisionsByInitiative.get(r.initiative_id) ?? { pending: 0, stalled: 0 };
    if (r.decision_status === 'pending') cur.pending += 1;
    if (r.decision_status === 'stalled') cur.stalled += 1;
    decisionsByInitiative.set(r.initiative_id, cur);
  }

  // Vendors for "Dependencies" lens
  const { data: vendorRows } = await sb
    .from('ai_initiative_vendors')
    .select('initiative_id, renewal_date, vendor_name, financial_health')
    .in('initiative_id', initiativeIds);
  const vendorsByInitiative = new Map<
    string,
    Array<{ vendor_name: string; renewal_date: string | null; financial_health: string | null }>
  >();
  for (const r of (vendorRows ?? []) as Array<{
    initiative_id: string;
    vendor_name: string;
    renewal_date: string | null;
    financial_health: string | null;
  }>) {
    const list = vendorsByInitiative.get(r.initiative_id) ?? [];
    list.push({
      vendor_name: r.vendor_name,
      renewal_date: r.renewal_date,
      financial_health: r.financial_health,
    });
    vendorsByInitiative.set(r.initiative_id, list);
  }

  // Group by owner_function
  const byFunction = new Map<string, AIInitiative[]>();
  for (const i of page.initiatives) {
    const fn = i.ownerFunction ?? 'Unspecified';
    const list = byFunction.get(fn) ?? [];
    list.push(i);
    byFunction.set(fn, list);
  }

  const functions: FunctionRollup[] = [];
  for (const [fnName, initiatives] of byFunction.entries()) {
    const totalCommitted = initiatives.reduce(
      (s, i) => s + (i.committedAnnualUsd ?? 0),
      0,
    );
    const totalMeasured = initiatives.reduce(
      (s, i) => s + (i.measuredValueUsd ?? 0),
      0,
    );
    const healthy = initiatives.filter((i) => i.statusFlag === 'healthy').length;
    const atRisk = initiatives.filter((i) =>
      ['stalled', 'cost_overrun', 'duplication_risk', 'value_lag'].includes(i.statusFlag),
    ).length;
    const aligned = initiatives.filter((i) => i.alignedCallout).length;

    let pendingDecisions = 0;
    let stalledDecisions = 0;
    const upcomingRenewals: Array<{ vendorName: string; renewalDate: string; initiativeId: string }> = [];

    for (const i of initiatives) {
      const d = decisionsByInitiative.get(i.initiativeId);
      if (d) {
        pendingDecisions += d.pending;
        stalledDecisions += d.stalled;
      }
      const v = vendorsByInitiative.get(i.initiativeId) ?? [];
      for (const vendor of v) {
        if (vendor.renewal_date) {
          upcomingRenewals.push({
            vendorName: vendor.vendor_name,
            renewalDate: vendor.renewal_date,
            initiativeId: i.initiativeId,
          });
        }
      }
    }
    upcomingRenewals.sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));

    functions.push({
      function: fnName,
      layer: functionToLayer(fnName),
      initiatives: initiatives.map((i) => ({
        initiativeId: i.initiativeId,
        displayId: i.displayId,
        name: i.name,
        statusFlag: i.statusFlag,
        statusSummary: i.statusSummary,
        stage: i.stage,
        committedAnnualUsd: i.committedAnnualUsd,
        measuredValueUsd: i.measuredValueUsd,
        alignedCallout: i.alignedCallout,
        alignedRationale: i.alignedRationale,
      })),
      counts: {
        total: initiatives.length,
        healthy,
        atRisk,
        aligned,
      },
      committedAnnualUsd: totalCommitted,
      measuredValueUsd: totalMeasured,
      pendingDecisions,
      stalledDecisions,
      upcomingRenewals: upcomingRenewals.slice(0, 5),
    });
  }

  // Sort: layer order (experience → decision → operations), then by initiative count desc.
  const layerOrder: Record<string, number> = { experience: 0, decision: 1, operations: 2 };
  functions.sort((a, b) => {
    if (layerOrder[a.layer] !== layerOrder[b.layer]) {
      return layerOrder[a.layer] - layerOrder[b.layer];
    }
    return b.counts.total - a.counts.total;
  });

  return { functions };
}

// ---------------------------------------------------------------------
// Peer activity builder
// ---------------------------------------------------------------------

export async function getPeerActivityData(): Promise<PeerActivityData | null> {
  const client = await getActiveClientRow().catch(() => null);
  if (!client) return null;
  const page = await getAIInitiativesPageData(client.id).catch(() => null);
  if (!page || page.initiatives.length === 0) return null;

  const initiativeIds = page.initiatives.map((i) => i.initiativeId);
  const sb = getServerSupabase();

  // Latest KPI per (initiative, kpi_name) where peer_median is set.
  const { data: kpiRows } = await sb
    .from('ai_initiative_kpis')
    .select(
      'initiative_id, kpi_name, kpi_unit, quarter, kpi_value, target_value, peer_median, confidence_level',
    )
    .in('initiative_id', initiativeIds)
    .not('peer_median', 'is', null);

  const initiativeById = new Map(page.initiatives.map((i) => [i.initiativeId, i]));

  // Take the latest quarter per (initiative, kpi_name).
  const latest = new Map<
    string,
    {
      initiativeId: string;
      kpiName: string;
      kpiUnit: string | null;
      quarter: string;
      value: number;
      target: number | null;
      peerMedian: number;
    }
  >();
  for (const r of (kpiRows ?? []) as Array<{
    initiative_id: string;
    kpi_name: string;
    kpi_unit: string | null;
    quarter: string;
    kpi_value: number | string;
    target_value: number | string | null;
    peer_median: number | string;
  }>) {
    const key = `${r.initiative_id}::${r.kpi_name}`;
    const cur = latest.get(key);
    if (!cur || r.quarter > cur.quarter) {
      latest.set(key, {
        initiativeId: r.initiative_id,
        kpiName: r.kpi_name,
        kpiUnit: r.kpi_unit,
        quarter: r.quarter,
        value: typeof r.kpi_value === 'string' ? Number.parseFloat(r.kpi_value) : r.kpi_value,
        target:
          r.target_value === null
            ? null
            : typeof r.target_value === 'string'
              ? Number.parseFloat(r.target_value)
              : r.target_value,
        peerMedian:
          typeof r.peer_median === 'string' ? Number.parseFloat(r.peer_median) : r.peer_median,
      });
    }
  }

  const signals: PeerSignal[] = Array.from(latest.values())
    .map((row) => {
      const initiative = initiativeById.get(row.initiativeId);
      if (!initiative) return null;
      const delta = row.value - row.peerMedian;
      const pct = row.peerMedian === 0 ? 0 : (delta / row.peerMedian) * 100;
      // Heuristic: lower is better for "burden" / "rate" / "time" KPIs;
      // for everything else higher is better. Without per-KPI metadata,
      // we treat "above peer = ahead" as the default; UI surfaces both
      // sides clearly.
      return {
        initiativeId: initiative.initiativeId,
        initiativeDisplayId: initiative.displayId,
        initiativeName: initiative.name,
        kpiName: row.kpiName,
        kpiUnit: row.kpiUnit,
        quarter: row.quarter,
        tenantValue: row.value,
        peerMedian: row.peerMedian,
        targetValue: row.target,
        deltaVsPeer: delta,
        deltaPctVsPeer: pct,
      } satisfies PeerSignal;
    })
    .filter((s): s is PeerSignal => s !== null);

  // Sort by absolute delta descending (most-divergent first).
  signals.sort((a, b) => Math.abs(b.deltaPctVsPeer) - Math.abs(a.deltaPctVsPeer));

  return {
    signals,
    totals: {
      kpiCount: signals.length,
      aheadOfPeer: signals.filter((s) => s.deltaVsPeer > 0).length,
      behindPeer: signals.filter((s) => s.deltaVsPeer < 0).length,
      onPar: signals.filter((s) => s.deltaVsPeer === 0).length,
    },
  };
}

// ---------------------------------------------------------------------
// My strategy builder — business goals + the initiatives serving them
// ---------------------------------------------------------------------

export async function getMyStrategyData(): Promise<MyStrategyData | null> {
  const client = await getActiveClientRow().catch(() => null);
  if (!client) return null;
  const page = await getAIInitiativesPageData(client.id).catch(() => null);
  if (!page || page.goals.length === 0) return null;

  const initsByGoal = new Map<string, AIInitiative[]>();
  for (const i of page.initiatives) {
    const list = initsByGoal.get(i.primaryGoalId) ?? [];
    list.push(i);
    initsByGoal.set(i.primaryGoalId, list);
  }

  const themes: StrategyTheme[] = page.goals.map((goal) => {
    const initiatives = initsByGoal.get(goal.goalId) ?? [];
    const totalCommitted = initiatives.reduce(
      (s, i) => s + (i.committedAnnualUsd ?? 0),
      0,
    );
    const totalMeasured = initiatives.reduce(
      (s, i) => s + (i.measuredValueUsd ?? 0),
      0,
    );
    const healthy = initiatives.filter((i) => i.statusFlag === 'healthy').length;
    const atRisk = initiatives.filter((i) =>
      ['stalled', 'cost_overrun', 'duplication_risk', 'value_lag'].includes(i.statusFlag),
    ).length;
    const aligned = initiatives.filter((i) => i.alignedCallout).length;
    return {
      goalId: goal.goalId,
      goalName: goal.name,
      strategicContext: goal.strategicContext,
      initiativeCount: initiatives.length,
      committedAnnualUsd: totalCommitted,
      measuredValueUsd: totalMeasured,
      healthyCount: healthy,
      atRiskCount: atRisk,
      alignedCount: aligned,
      initiatives: initiatives.map((i) => ({
        initiativeId: i.initiativeId,
        displayId: i.displayId,
        name: i.name,
        statusFlag: i.statusFlag,
        alignedCallout: i.alignedCallout,
      })),
    };
  });

  return {
    themes,
    totals: {
      themeCount: themes.length,
      committedTotalUsd: themes.reduce((s, t) => s + t.committedAnnualUsd, 0),
      alignedCount: themes.reduce((s, t) => s + t.alignedCount, 0),
      themesWithGap: themes.filter((t) => t.atRiskCount > 0).length,
    },
  };
}
