import { getServerSupabase } from '@/lib/supabase-server';

export interface EnterpriseSummary {
  techStack: {
    total: number;
    aiTouching: number;
    totalAnnualSpendUsd: number;
    byCategory: Array<{ category: string; count: number; spend: number }>;
  };
  projects: {
    total: number;
    aiTouching: number;
    inFlight: number;
    totalBudgetUsd: number;
    totalSpentUsd: number;
  };
  staffAug: {
    total: number;
    totalFte: number;
    totalAnnualSpendUsd: number;
    aiTouching: number;
  };
  volumetrics: {
    latestApiCallsMillions: number;
    latestTokensBillions: number;
    activeModels: number;
    dataPipelines: number;
    storageTb: number;
    apiCallsSeries: number[]; // last 30 days, oldest-first
  };
}

interface TechRow { category: string | null; annual_spend_usd: number | null; touches_ai: boolean | null }
interface ProjectRow { status: string | null; touches_ai: boolean | null; total_budget_usd: number | null; spent_to_date_usd: number | null }
interface AugRow { headcount_fte: number | null; annual_spend_usd: number | null; touches_ai: boolean | null }
interface VolRow {
  snapshot_date: string;
  api_calls_millions: number | null;
  tokens_billions: number | null;
  active_models: number | null;
  data_pipelines: number | null;
  storage_tb: number | null;
}

export async function loadEnterpriseSummary(clientId: string): Promise<EnterpriseSummary> {
  const sb = getServerSupabase();

  const [techRes, projRes, augRes, volRes] = await Promise.all([
    sb.from('tech_stack_items').select('category, annual_spend_usd, touches_ai').eq('client_id', clientId),
    sb.from('tech_projects').select('status, touches_ai, total_budget_usd, spent_to_date_usd').eq('client_id', clientId),
    sb.from('staff_augmentation').select('headcount_fte, annual_spend_usd, touches_ai').eq('client_id', clientId),
    sb
      .from('volumetrics_snapshots')
      .select('snapshot_date, api_calls_millions, tokens_billions, active_models, data_pipelines, storage_tb')
      .eq('client_id', clientId)
      .order('snapshot_date', { ascending: true })
      .limit(30),
  ]);

  const techRows = (techRes.data as TechRow[] | null) ?? [];
  const byCategoryMap = new Map<string, { count: number; spend: number }>();
  let techTotalSpend = 0;
  let techAi = 0;
  for (const t of techRows) {
    const cat = (t.category ?? 'other').toString();
    const prev = byCategoryMap.get(cat) ?? { count: 0, spend: 0 };
    const spend = Number(t.annual_spend_usd ?? 0);
    byCategoryMap.set(cat, { count: prev.count + 1, spend: prev.spend + spend });
    techTotalSpend += spend;
    if (t.touches_ai) techAi += 1;
  }
  const byCategory = [...byCategoryMap.entries()]
    .map(([category, v]) => ({ category, count: v.count, spend: v.spend }))
    .sort((a, b) => b.spend - a.spend);

  const projRows = (projRes.data as ProjectRow[] | null) ?? [];
  let projAi = 0;
  let projInFlight = 0;
  let projBudget = 0;
  let projSpent = 0;
  for (const p of projRows) {
    if (p.touches_ai) projAi += 1;
    if (p.status === 'in_flight') projInFlight += 1;
    projBudget += Number(p.total_budget_usd ?? 0);
    projSpent += Number(p.spent_to_date_usd ?? 0);
  }

  const augRows = (augRes.data as AugRow[] | null) ?? [];
  let augFte = 0;
  let augSpend = 0;
  let augAi = 0;
  for (const a of augRows) {
    augFte += Number(a.headcount_fte ?? 0);
    augSpend += Number(a.annual_spend_usd ?? 0);
    if (a.touches_ai) augAi += 1;
  }

  const volRows = (volRes.data as VolRow[] | null) ?? [];
  const latest = volRows[volRows.length - 1];
  const apiSeries = volRows.map((v) => Number(v.api_calls_millions ?? 0));

  return {
    techStack: {
      total: techRows.length,
      aiTouching: techAi,
      totalAnnualSpendUsd: techTotalSpend,
      byCategory,
    },
    projects: {
      total: projRows.length,
      aiTouching: projAi,
      inFlight: projInFlight,
      totalBudgetUsd: projBudget,
      totalSpentUsd: projSpent,
    },
    staffAug: {
      total: augRows.length,
      totalFte: augFte,
      totalAnnualSpendUsd: augSpend,
      aiTouching: augAi,
    },
    volumetrics: {
      latestApiCallsMillions: Number(latest?.api_calls_millions ?? 0),
      latestTokensBillions: Number(latest?.tokens_billions ?? 0),
      activeModels: Number(latest?.active_models ?? 0),
      dataPipelines: Number(latest?.data_pipelines ?? 0),
      storageTb: Number(latest?.storage_tb ?? 0),
      apiCallsSeries: apiSeries,
    },
  };
}
