import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import Papa from 'papaparse';

type Row = Record<string, string | undefined>;

const CLIENT_ROOTS: Array<{
  keys: string[];
  datasetDir: string;
  tenantName: string;
}> = [
  {
    keys: ['apexretail', 'apex-retail', 'apex', 'apex retail', 'apex retail group'],
    datasetDir: 'apex-retail-synthetic-v4',
    tenantName: 'Apex Retail Group',
  },
  {
    keys: ['firstcapital', 'first-capital', 'arcturus', 'first capital financial'],
    datasetDir: 'first-capital-financial-synthetic-v4',
    tenantName: 'First Capital Financial',
  },
  {
    keys: ['lakeshore', 'lakeshore-industries', 'lakeshore industries', 'lakeshore holdings'],
    datasetDir: 'lakeshore-industries-synthetic-v4',
    tenantName: 'Lakeshore Holdings',
  },
  {
    keys: ['meridian', 'meridian-health', 'meridian health'],
    datasetDir: 'meridian-health-synthetic-v4',
    tenantName: 'Meridian Health',
  },
  {
    keys: ['skyharbor', 'skyharbor-air', 'skyharbor air'],
    datasetDir: 'skyharbor-air-synthetic-v4',
    tenantName: 'SkyHarbor Air',
  },
];

const AS_OF = Date.UTC(2026, 5, 17);
const REQUIRED_TOWER_V2_FILES = [
  'family-4-financial-commercial/F12_it-budget-financials.csv',
  'family-4-financial-commercial/F11_vendors-contracts-licenses.csv',
  'ai-control-tower/T01_initiative-registry.csv',
  'ai-control-tower/T07_benefit-realization.csv',
  'ai-control-tower/T08_spend-contracts.csv',
  'ai-control-tower/T12_derived-actions.csv',
] as const;

function normalizeClientProbe(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function pickRoot(clientKey?: string | null, tenantName?: string | null) {
  const normalizedClientKey = normalizeClientProbe(clientKey);
  if (normalizedClientKey) {
    const keyMatch = CLIENT_ROOTS.find((entry) =>
      entry.keys.some((key) => normalizeClientProbe(key) === normalizedClientKey),
    );
    if (keyMatch) return keyMatch;
  }

  const normalizedTenantName = normalizeClientProbe(tenantName);
  if (normalizedTenantName) {
    const exactNameMatch = CLIENT_ROOTS.find((entry) =>
      entry.keys.some((key) => normalizeClientProbe(key) === normalizedTenantName),
    );
    if (exactNameMatch) return exactNameMatch;

    const containsNameMatch = CLIENT_ROOTS.find((entry) =>
      entry.keys.some((key) => normalizedTenantName.includes(normalizeClientProbe(key))),
    );
    if (containsNameMatch) return containsNameMatch;
  }

  return CLIENT_ROOTS[0];
}

export function resolveTowerV2V4Dataset(args: {
  clientKey?: string | null;
  tenantName?: string | null;
} = {}): { tenantName: string; root: string } {
  const client = pickRoot(args.clientKey, args.tenantName);
  return {
    tenantName: text(client.tenantName, args.tenantName ?? ''),
    root: `datasets/${client.datasetDir}`,
  };
}

function text(value: unknown, fallback = ''): string {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function num(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyM(value: number): number {
  return Math.round((value / 1_000_000) * 10) / 10;
}

function firstNumber(row: Row, keys: string[]): number {
  for (const key of keys) {
    const value = num(row[key]);
    if (value) return value;
  }
  return 0;
}

function firstText(row: Row, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = text(row[key]);
    if (value) return value;
  }
  return fallback;
}

async function readCsv(datasetDir: string, relativePath: string): Promise<Row[]> {
  const csv = await readFile(path.join(process.cwd(), 'datasets', datasetDir, relativePath), 'utf8');
  const parsed = Papa.parse<Row>(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return parsed.data;
}

async function hasFullTowerV2Dataset(datasetDir: string): Promise<boolean> {
  const root = path.join(process.cwd(), 'datasets', datasetDir);
  const checks = REQUIRED_TOWER_V2_FILES.map(async (relativePath) => {
    await access(path.join(root, relativePath));
  });
  const results = await Promise.allSettled(checks);
  return results.every((result) => result.status === 'fulfilled');
}

async function buildFallbackDataScript(args: {
  root: string;
  tenantName: string;
  reason: string;
}): Promise<string> {
  const binding = {
    source: args.root,
    tenantName: args.tenantName,
    fallback: true,
    reason: args.reason,
    programs: 0,
    vendors: 0,
    initiatives: 0,
    spendRows: 0,
    benefitRows: 0,
  };
  return `/* AbarVa Tower v2 fail-closed binding for ${args.tenantName}. No cross-tenant fallback data is emitted. */
var PROGRAMS = [];
var VENDORS = [];
var FN_OBS = {};
var INITS = {};
var ACTIONS = [];
var sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
var TOTAL = {
  budget: 0,
  ytd: 0,
  capex: 0,
  opex: 0,
  aiBudget: 0,
  aiYtd: 0,
  run: 0,
  change: 0,
  transform: 0,
};
var CAT_MIX = ['software', 'hardware', 'services', 'cloud', 'labor'].map(k => ({ key: k, label: k[0].toUpperCase() + k.slice(1), val: 0 }));
var AI_REALIZED = 0;
var NEXUS_CHIPS = ['What Tower data is loaded?', 'Which template files are missing?', 'How do we load this client?', 'What can I safely show?', 'What should be loaded next?'];
window.ABARVA_TOWER_V2_BINDING = ${JSON.stringify({
    ...binding,
  })};
`;
}

function monthsUntil(dateText: string): number {
  const date = Date.parse(`${dateText}T00:00:00Z`);
  if (!Number.isFinite(date)) return 99;
  return Math.max(0, Math.round((date - AS_OF) / (1000 * 60 * 60 * 24 * 30.4375)));
}

function displayDate(dateText: string): string {
  const date = Date.parse(`${dateText}T00:00:00Z`);
  if (!Number.isFinite(date)) return 'Renewal not set';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

function statusFromText(value: string, budget: number, aiBudget: number): string {
  const raw = value.toLowerCase();
  if (raw.includes('blocked') || raw.includes('critical') || raw.includes('crowding')) return 'at-risk';
  if (raw.includes('within') || raw.includes('normal') || raw.includes('stable')) return 'on-track';
  if (budget && aiBudget / budget > 0.18) return 'watch';
  return 'watch';
}

function programCategory(spendType: string, run: number, change: number, aiBudget: number): string {
  const raw = spendType.toLowerCase();
  if (raw === 'run') return 'Run';
  if (raw.includes('transform')) return 'Transform';
  if (raw.includes('change')) return change > run ? 'Change' : 'Run';
  if (run > change) return 'Run';
  if (change > run && aiBudget > 0 && aiBudget / (run + change || 1) > 0.18) return 'Transform';
  return change > run * 0.55 ? 'Change' : 'Run';
}

function verdict(status: string): string {
  const raw = status.toLowerCase();
  if (raw.includes('kill') || raw.includes('sunset')) return 'kill';
  if (raw.includes('hold') || raw.includes('blocked')) return 'hold';
  if (raw.includes('restructure') || raw.includes('watch')) return 'restructure';
  return 'continue';
}

export async function buildTowerV2V4DataScript(args: {
  clientKey?: string | null;
  tenantName?: string | null;
} = {}): Promise<{ script: string; tenantName: string; root: string }> {
  const client = pickRoot(args.clientKey, args.tenantName);
  const displayTenantName = text(client.tenantName, args.tenantName ?? '');
  const root = `datasets/${client.datasetDir}`;

  if (!(await hasFullTowerV2Dataset(client.datasetDir))) {
    return {
      script: await buildFallbackDataScript({
        root,
        tenantName: displayTenantName,
        reason: 'full Tower v4 CSV set not packaged for this active tenant',
      }),
      tenantName: displayTenantName,
      root,
    };
  }

  const [budgets, vendorsRaw, initiativesRaw, benefitsRaw, spendRaw, actionsRaw] = await Promise.all([
    readCsv(client.datasetDir, 'family-4-financial-commercial/F12_it-budget-financials.csv'),
    readCsv(client.datasetDir, 'family-4-financial-commercial/F11_vendors-contracts-licenses.csv'),
    readCsv(client.datasetDir, 'ai-control-tower/T01_initiative-registry.csv'),
    readCsv(client.datasetDir, 'ai-control-tower/T07_benefit-realization.csv'),
    readCsv(client.datasetDir, 'ai-control-tower/T08_spend-contracts.csv'),
    readCsv(client.datasetDir, 'ai-control-tower/T12_derived-actions.csv'),
  ]);

  const benefitByInitiative = new Map<string, { promised: number; measured: number; confidence: string }>();
  for (const row of benefitsRaw) {
    const id = firstText(row, ['initiative_id']);
    if (!id) continue;
    const current = benefitByInitiative.get(id) ?? { promised: 0, measured: 0, confidence: 'medium' };
    current.promised += firstNumber(row, ['promised_benefit_usd', 'committed_value_usd']);
    current.measured += firstNumber(row, ['measured_value_usd', 'realized_value_ytd_usd']);
    current.confidence = firstText(row, ['confidence'], current.confidence);
    benefitByInitiative.set(id, current);
  }

  const spendByInitiative = new Map<string, { budget: number; ytd: number; contract: number; vendor: string }>();
  for (const row of spendRaw) {
    const id = firstText(row, ['initiative_id']);
    if (!id) continue;
    const current = spendByInitiative.get(id) ?? { budget: 0, ytd: 0, contract: 0, vendor: firstText(row, ['vendor_or_tool', 'vendor_or_internal']) };
    current.budget += firstNumber(row, ['annual_budget_usd', 'fy26_budget_usd']);
    current.ytd += firstNumber(row, ['ytd_spend_usd', 'actual_ytd_usd']);
    current.contract += firstNumber(row, ['contract_value_usd']);
    if (!current.vendor) current.vendor = firstText(row, ['vendor_or_tool', 'vendor_or_internal']);
    spendByInitiative.set(id, current);
  }

  const initiativeById = new Map(initiativesRaw.map((row) => [firstText(row, ['initiative_id']), row]));
  const initiativesByArea = new Map<string, string[]>();
  for (const row of initiativesRaw) {
    const area = firstText(row, ['business_area', 'portfolio_segment'], 'Unassigned');
    const next = initiativesByArea.get(area) ?? [];
    next.push(firstText(row, ['initiative_id']));
    initiativesByArea.set(area, next);
  }

  const vendors = [...vendorsRaw]
    .sort((a, b) => firstNumber(b, ['annual_contract_value_usd', 'annual_run_rate_usd']) - firstNumber(a, ['annual_contract_value_usd', 'annual_run_rate_usd']))
    .slice(0, 10)
    .map((row) => {
      const months = monthsUntil(firstText(row, ['renewal_date']));
      const acv = firstNumber(row, ['annual_contract_value_usd', 'annual_run_rate_usd']);
      const criticality = firstText(row, ['criticality'], 'medium').toLowerCase();
      return {
        name: firstText(row, ['vendor_name']),
        cat: firstText(row, ['category', 'scope'], 'Vendor'),
        acv: moneyM(acv),
        renew: displayDate(firstText(row, ['renewal_date'])),
        months,
        urgency: months <= 6 || criticality === 'high' || criticality === 'critical' ? 'at-risk' : months <= 12 ? 'watch' : 'on-track',
        prog: firstText(row, ['owned_by'], 'Unassigned owner'),
        note: `${firstText(row, ['commercial_risk', 'notes'], 'normal')} · ${firstText(row, ['license_or_unit_basis', 'scope'], 'license basis not loaded')}.`,
      };
    });

  const programs = budgets.map((row) => {
    const explicitBudget = firstNumber(row, ['fy26_budget_usd']);
    const run = firstNumber(row, ['run_budget_usd']) || (firstText(row, ['spend_type']).toLowerCase() === 'run' ? explicitBudget : explicitBudget * 0.62);
    const change = firstNumber(row, ['change_budget_usd']) || Math.max(0, explicitBudget - run);
    const budget = run + change;
    const aiBudget = firstNumber(row, ['ai_or_data_budget_usd']) || budget * 0.12;
    const labor = budget * (firstNumber(row, ['labor_pct']) || 34) / 100;
    const vendor = budget * (firstNumber(row, ['vendor_pct']) || 40) / 100;
    const cloud = budget * (firstNumber(row, ['cloud_or_infra_pct']) || 20) / 100;
    const residual = Math.max(0, budget - labor - vendor - cloud);
    const name = firstText(row, ['budget_area'], 'Unassigned budget area');
    const linkedInitiatives = initiativesByArea.get(name) ?? [];
    return {
      id: firstText(row, ['budget_id', 'budget_line_id'], name),
      name,
      fn: name,
      owner: firstText(row, ['owner_role', 'owner_team_id'], 'Unassigned owner'),
      cat: programCategory(firstText(row, ['spend_type']), run, change, aiBudget),
      vendor: vendors[0]?.name ?? 'Mixed vendors',
      budget: moneyM(budget),
      ytd: moneyM(budget * 0.54),
      capex: moneyM(change),
      opex: moneyM(run),
      mix: {
        software: moneyM(residual * 0.55),
        hardware: moneyM(cloud * 0.26),
        services: moneyM(vendor),
        cloud: moneyM(cloud * 0.74),
        labor: moneyM(labor),
      },
      aiBudget: moneyM(aiBudget),
      aiYtd: moneyM(aiBudget * 0.54),
      status: statusFromText(firstText(row, ['budget_pressure', 'spend_type']), budget, aiBudget),
      note: `${firstText(row, ['budget_pressure', 'spend_type'], 'within plan')} · ${firstText(row, ['owner_role', 'owner_team_id'], 'Unassigned owner')} owns ${name}.`,
      inits: linkedInitiatives.slice(0, 4),
    };
  });

  const inits = Object.fromEntries(
    [...initiativesRaw]
      .sort((a, b) => firstNumber(b, ['promised_benefit_usd', 'promised_value_usd']) - firstNumber(a, ['promised_benefit_usd', 'promised_value_usd']))
      .slice(0, 18)
      .map((row) => {
        const id = firstText(row, ['initiative_id']);
        const benefit = benefitByInitiative.get(id) ?? {
          promised: firstNumber(row, ['promised_benefit_usd', 'promised_value_usd']),
          measured: firstNumber(row, ['measured_value_usd', 'measured_value_ytd_usd']),
        };
        const spend = spendByInitiative.get(id) ?? { budget: 0, ytd: 0 };
        return [id, {
          t: firstText(row, ['initiative_name']),
          committed: moneyM(spend.budget || benefit.promised * 0.1),
          ytd: moneyM(spend.ytd),
          realized: moneyM(benefit.measured || firstNumber(row, ['measured_value_usd', 'measured_value_ytd_usd'])),
          verdict: verdict(firstText(row, ['status', 'scale_decision'])),
        }];
      }),
  );

  const fnObs = Object.fromEntries(programs.map((program) => {
    const linked = program.inits.map((id) => initiativeById.get(id)).filter(Boolean);
    const promised = linked.reduce((sum, row) => sum + firstNumber(row!, ['promised_benefit_usd', 'promised_value_usd']), 0);
    const measured = linked.reduce((sum, row) => sum + firstNumber(row!, ['measured_value_usd', 'measured_value_ytd_usd']), 0);
    return [program.fn, {
      adoption: promised ? Math.max(8, Math.min(82, Math.round((measured / promised) * 100))) : Math.round(program.aiBudget ? 35 : 12),
      value: moneyM(measured),
      vnote: program.note,
    }];
  }));

  const actions = actionsRaw.slice(0, 4).map((row, index) => {
    const initiativeId = firstText(row, ['derived_from']).split(';')[0] ?? '';
    const initiative = initiativeById.get(initiativeId);
    const spend = spendByInitiative.get(initiativeId) ?? { ytd: 0 };
    const impact = firstNumber(row, ['expected_impact_usd', 'expected_value_usd']);
    const kind = index === 0 || firstText(row, ['priority']).toUpperCase() === 'P0' ? 'kill' : index === 1 ? 'gov' : 'fund';
    const owner = firstText(row, ['decision_owner', 'owner_role'], 'Named owner');
    const initiativeName = text(initiative?.initiative_name, initiativeId);
    const initiativeState = firstText(initiative ?? {}, ['status', 'scale_decision'], 'under review');
    const blocker = firstText(initiative ?? {}, ['primary_blocker'], 'decision evidence pending');
    return {
      id: firstText(row, ['action_id']),
      kind,
      kicker: kind === 'kill' ? 'Stop / redirect' : kind === 'gov' ? 'Governance gate' : 'Unblock value',
      impact: `$${moneyM(impact)}M expected impact`,
      title: firstText(row, ['action_title']),
      why: `${initiativeName} is ${initiativeState} with ${blocker}.`,
      rec: `Route to <b>${owner}</b> for the next steering decision. Nexus proposes; the owner approves the Move.`,
      grid: [
        ['Priority', firstText(row, ['priority'])],
        ['Expected impact', `$${moneyM(impact)}M`],
        ['Spend YTD', `$${moneyM(spend.ytd)}M`],
        ['Owner', owner],
      ],
      owner,
      move: firstText(row, ['action_title']),
    };
  });

  const total = {
    programs: programs.length,
    vendors: vendorsRaw.length,
    initiatives: initiativesRaw.length,
    spendRows: spendRaw.length,
    benefitRows: benefitsRaw.length,
  };

  const script = `/* AbarVa Tower v2 data generated from ${root}. Synthetic, not real customer data. */
var PROGRAMS = ${JSON.stringify(programs)};
var VENDORS = ${JSON.stringify(vendors)};
var FN_OBS = ${JSON.stringify(fnObs)};
var INITS = ${JSON.stringify(inits)};
var ACTIONS = ${JSON.stringify(actions)};
var sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
var TOTAL = {
  budget: sum(PROGRAMS, p => p.budget),
  ytd: sum(PROGRAMS, p => p.ytd),
  capex: sum(PROGRAMS, p => p.capex),
  opex: sum(PROGRAMS, p => p.opex),
  aiBudget: sum(PROGRAMS, p => p.aiBudget),
  aiYtd: sum(PROGRAMS, p => p.aiYtd),
  run: sum(PROGRAMS, p => p.opex),
  change: sum(PROGRAMS, p => p.capex),
  transform: sum(PROGRAMS.filter(p => p.cat === 'Transform'), p => p.budget),
};
var CAT_MIX = ['software', 'hardware', 'services', 'cloud', 'labor'].map(k => ({ key: k, label: k[0].toUpperCase() + k.slice(1), val: sum(PROGRAMS, p => p.mix[k] || 0) }));
var AI_REALIZED = sum(Object.values(INITS), i => i.realized);
var NEXUS_CHIPS = ['Where is the money going?', 'Show CapEx vs OpEx', 'Which contracts renew soonest?', 'How are AI investments doing?', 'What should we stop?'];
window.ABARVA_TOWER_V2_BINDING = ${JSON.stringify({ source: root, tenantName: displayTenantName, ...total })};
`;

  return { script, tenantName: displayTenantName, root };
}
