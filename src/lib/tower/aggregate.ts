import { getServerSupabase } from '@/lib/supabase-server';

export interface TowerClient {
  id: string;
  name: string;
  industry_code: string | null;
}

export interface ContradictionRow {
  id: string;
  contradiction_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggested_action: string | null;
  evidence: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  triggered_engagement_id: string | null;
  use_case_id: string | null;
}

export interface TowerViewModel {
  client: TowerClient;
  clients: TowerClient[];
  inventory: {
    total: number;
    byStage: Record<string, number>;
    byBusinessUnit: Record<string, number>;
    inProduction: number;
    inPilot: number;
    stalled: number;
    freshness: Date | null;
  };
  adoption: {
    avgPenetrationPct: number;
    totalDau: number;
    totalWau: number;
    avgDropOffPct: number;
    coveredUseCaseCount: number;
    freshness: Date | null;
  };
  value: {
    verifiedUsd: number;
    projectedUsd: number;
    byDriver: Record<string, { baseline: number; observed: number }>;
    coveredUseCaseCount: number;
    freshness: Date | null;
  };
  risk: {
    totalAssessed: number;
    approved: number;
    conditional: number;
    pending: number;
    highRisk: number;
    biasIncidents: number;
    phiCount: number;
    freshness: Date | null;
  };
  cost: {
    monthlySpendUsd: number;
    projected6moUsd: number;
    byCategory: {
      llm: number;
      compute: number;
      storage: number;
      license: number;
      integration: number;
    };
    freshness: Date | null;
  };
  contradictions: ContradictionRow[];
}

type JsonObj = Record<string, unknown>;

function maxDate(dates: Array<string | null | undefined>): Date | null {
  const ts = dates
    .filter((d): d is string => typeof d === 'string' && d.length > 0)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (ts.length === 0) return null;
  return new Date(Math.max(...ts));
}

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export async function listTowerClients(): Promise<TowerClient[]> {
  const { data, error } = await getServerSupabase()
    .from('clients')
    .select('id, name, industry_code')
    .order('name', { ascending: true });
  if (error) return [];
  return (data ?? []) as TowerClient[];
}

export async function buildTowerViewModel(clientId: string): Promise<TowerViewModel | null> {
  const sb = getServerSupabase();

  // Client list for selector
  const clients = await listTowerClients();
  const client = clients.find((c) => c.id === clientId) ?? null;
  if (!client) return null;

  // Inventory
  const { data: useCases } = await sb
    .from('use_cases')
    .select('id, stage, business_unit, updated_at')
    .eq('client_id', clientId);
  const inventoryRows =
    (useCases as Array<{ id: string; stage: string; business_unit: string | null; updated_at: string }> | null) ?? [];

  const byStage: Record<string, number> = {};
  const byBusinessUnit: Record<string, number> = {};
  for (const r of inventoryRows) {
    byStage[r.stage] = (byStage[r.stage] ?? 0) + 1;
    const bu = r.business_unit ?? 'Unassigned';
    byBusinessUnit[bu] = (byBusinessUnit[bu] ?? 0) + 1;
  }

  const useCaseIds = inventoryRows.map((r) => r.id);

  // Adoption
  const { data: usageRows } = useCaseIds.length > 0
    ? await sb
        .from('use_case_usage_metrics')
        .select('use_case_id, penetration_pct, dau, wau, drop_off_rate_pct, period_end, created_at')
        .in('use_case_id', useCaseIds)
    : { data: [] };
  const usage = (usageRows as Array<JsonObj> | null) ?? [];

  // Value
  const { data: valueRows } = useCaseIds.length > 0
    ? await sb
        .from('use_case_value_metrics')
        .select('use_case_id, value_driver, baseline, observed, confidence, created_at')
        .in('use_case_id', useCaseIds)
    : { data: [] };
  const valueArr = (valueRows as Array<JsonObj> | null) ?? [];

  // Risk
  const { data: riskRows } = useCaseIds.length > 0
    ? await sb
        .from('use_case_risk')
        .select(
          'use_case_id, model_risk_level, governance_approval_status, bias_incidents_count, data_classification, updated_at',
        )
        .in('use_case_id', useCaseIds)
    : { data: [] };
  const riskArr = (riskRows as Array<JsonObj> | null) ?? [];

  // Cost
  const { data: costRows } = useCaseIds.length > 0
    ? await sb
        .from('use_case_cost_metrics')
        .select(
          'use_case_id, llm_spend_usd, compute_spend_usd, storage_spend_usd, vendor_license_spend_usd, integration_spend_usd, total_spend_usd, projected_6mo_spend_usd, period_end, created_at',
        )
        .in('use_case_id', useCaseIds)
    : { data: [] };
  const costArr = (costRows as Array<JsonObj> | null) ?? [];

  // Contradictions
  const { data: contradictionRows } = await sb
    .from('contradictions')
    .select(
      'id, contradiction_type, severity, description, suggested_action, evidence, detected_at, resolved_at, triggered_engagement_id, use_case_id',
    )
    .eq('client_id', clientId)
    .is('resolved_at', null)
    .order('severity', { ascending: true });
  const contradictions = (contradictionRows as ContradictionRow[] | null) ?? [];

  // Aggregates
  const inProduction = (byStage.execute ?? 0) + (byStage.realize ?? 0);
  const inPilot = (byStage.evidence ?? 0) + (byStage.review ?? 0);
  const stalled = byStage.stalled ?? 0;

  const penetrationVals = usage.map((u) => toNum(u.penetration_pct)).filter((n) => n > 0);
  const avgPenetrationPct =
    penetrationVals.length > 0 ? penetrationVals.reduce((a, b) => a + b, 0) / penetrationVals.length : 0;
  const totalDau = usage.reduce((s, u) => s + toNum(u.dau), 0);
  const totalWau = usage.reduce((s, u) => s + toNum(u.wau), 0);
  const dropOffVals = usage.map((u) => toNum(u.drop_off_rate_pct)).filter((n) => n > 0);
  const avgDropOffPct =
    dropOffVals.length > 0 ? dropOffVals.reduce((a, b) => a + b, 0) / dropOffVals.length : 0;
  const coveredAdoption = new Set(usage.map((u) => String(u.use_case_id))).size;

  const byDriver: Record<string, { baseline: number; observed: number }> = {};
  let verifiedUsd = 0;
  for (const v of valueArr) {
    const driver = String(v.value_driver ?? 'other');
    const baseline = toNum(v.baseline);
    const observed = toNum(v.observed);
    byDriver[driver] = byDriver[driver] ?? { baseline: 0, observed: 0 };
    byDriver[driver].baseline += baseline;
    byDriver[driver].observed += observed;
    if (v.confidence === 'high' || v.confidence === 'medium') {
      verifiedUsd += Math.max(0, observed - baseline);
    }
  }

  type RiskSummary = {
    approved: number;
    conditional: number;
    pending: number;
    highRisk: number;
    biasIncidents: number;
    phiCount: number;
  };
  const riskSummary = riskArr.reduce<RiskSummary>(
    (acc, r) => {
      const status = String(r.governance_approval_status ?? '');
      if (status === 'approved') acc.approved += 1;
      else if (status === 'conditional') acc.conditional += 1;
      else acc.pending += 1;
      if (String(r.model_risk_level) === 'high') acc.highRisk += 1;
      acc.biasIncidents += toNum(r.bias_incidents_count);
      const classes = (r.data_classification as string[] | null) ?? [];
      if (Array.isArray(classes) && classes.includes('PHI')) acc.phiCount += 1;
      return acc;
    },
    { approved: 0, conditional: 0, pending: 0, highRisk: 0, biasIncidents: 0, phiCount: 0 },
  );

  // Latest cost period per use case → sum for monthly spend
  const latestCostPerUseCase = new Map<string, JsonObj>();
  for (const c of costArr) {
    const key = String(c.use_case_id);
    const prev = latestCostPerUseCase.get(key);
    if (!prev) latestCostPerUseCase.set(key, c);
    else if (String(c.period_end) > String(prev.period_end)) latestCostPerUseCase.set(key, c);
  }
  let monthlySpendUsd = 0;
  let projected6moUsd = 0;
  const costByCategory = { llm: 0, compute: 0, storage: 0, license: 0, integration: 0 };
  for (const c of latestCostPerUseCase.values()) {
    monthlySpendUsd += toNum(c.total_spend_usd);
    projected6moUsd += toNum(c.projected_6mo_spend_usd);
    costByCategory.llm += toNum(c.llm_spend_usd);
    costByCategory.compute += toNum(c.compute_spend_usd);
    costByCategory.storage += toNum(c.storage_spend_usd);
    costByCategory.license += toNum(c.vendor_license_spend_usd);
    costByCategory.integration += toNum(c.integration_spend_usd);
  }

  const projectedUsd = projected6moUsd - monthlySpendUsd * 6;

  return {
    client,
    clients,
    inventory: {
      total: inventoryRows.length,
      byStage,
      byBusinessUnit,
      inProduction,
      inPilot,
      stalled,
      freshness: maxDate(inventoryRows.map((r) => r.updated_at)),
    },
    adoption: {
      avgPenetrationPct,
      totalDau,
      totalWau,
      avgDropOffPct,
      coveredUseCaseCount: coveredAdoption,
      freshness: maxDate(usage.map((u) => String(u.created_at))),
    },
    value: {
      verifiedUsd,
      projectedUsd,
      byDriver,
      coveredUseCaseCount: new Set(valueArr.map((v) => String(v.use_case_id))).size,
      freshness: maxDate(valueArr.map((v) => String(v.created_at))),
    },
    risk: {
      totalAssessed: riskArr.length,
      approved: riskSummary.approved,
      conditional: riskSummary.conditional,
      pending: riskSummary.pending,
      highRisk: riskSummary.highRisk,
      biasIncidents: riskSummary.biasIncidents,
      phiCount: riskSummary.phiCount,
      freshness: maxDate(riskArr.map((r) => String(r.updated_at))),
    },
    cost: {
      monthlySpendUsd,
      projected6moUsd,
      byCategory: costByCategory,
      freshness: maxDate(costArr.map((c) => String(c.created_at))),
    },
    contradictions,
  };
}
