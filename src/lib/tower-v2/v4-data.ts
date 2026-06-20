import { readFile } from 'node:fs/promises';
import path from 'node:path';

import Papa from 'papaparse';

type Row = Record<string, string | undefined>;

type ClientPack = {
  keys: string[];
  datasetDir: string;
  tenantName: string;
  format: 'v4' | 'northstar-v1';
};

export const TOWER_V2_CLIENT_PACKS: ClientPack[] = [
  {
    keys: ['apexretail', 'apex-retail', 'apex retail', 'apex retail group'],
    datasetDir: 'apex-retail-synthetic-v4',
    tenantName: 'Apex Retail Group',
    format: 'v4',
  },
  {
    keys: ['firstcapital', 'first-capital', 'first capital', 'arcturus', 'first capital financial'],
    datasetDir: 'first-capital-financial-synthetic-v4',
    tenantName: 'First Capital Financial',
    format: 'v4',
  },
  {
    keys: ['lakeshore', 'lakeshore-holdings', 'lakeshore industries', 'lakeshore holdings'],
    datasetDir: 'lakeshore-industries-synthetic-v4',
    tenantName: 'Lakeshore Holdings',
    format: 'v4',
  },
  {
    keys: ['meridian', 'meridian-health', 'meridian health', 'meridian health system'],
    datasetDir: 'meridian-health-synthetic-v4',
    tenantName: 'Meridian Health System',
    format: 'v4',
  },
  {
    keys: ['northstar', 'northstar-clinical', 'northstar clinical technologies'],
    datasetDir: 'northstar-clinical-tech-synthetic-v1',
    tenantName: 'Northstar Clinical Technologies',
    format: 'northstar-v1',
  },
  {
    keys: ['skyharbor', 'skyharbor-air', 'skyharbor air'],
    datasetDir: 'skyharbor-air-synthetic-v4',
    tenantName: 'SkyHarbor Air',
    format: 'v4',
  },
];

const AS_OF = Date.UTC(2026, 5, 17);

export function resolveTowerV2ClientPack(clientKey?: string | null, tenantName?: string | null): ClientPack {
  const probe = `${clientKey ?? ''} ${tenantName ?? ''}`.toLowerCase();
  const fallback = TOWER_V2_CLIENT_PACKS[0];
  if (!fallback) {
    throw new Error('tower_v2_client_packs_not_configured');
  }
  return TOWER_V2_CLIENT_PACKS.find((entry) => entry.keys.some((key) => probe.includes(key))) ?? fallback;
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

function towerScript(args: {
  root: string;
  tenantName: string;
  programs: unknown[];
  vendors: unknown[];
  fnObs: Record<string, unknown>;
  inits: Record<string, unknown>;
  actions: unknown[];
  total: Record<string, number>;
}): string {
  return `/* AbarVa Tower v2 data generated from ${args.root}. Synthetic, not real customer data. */
const PROGRAMS = ${JSON.stringify(args.programs)};
const VENDORS = ${JSON.stringify(args.vendors)};
const FN_OBS = ${JSON.stringify(args.fnObs)};
const INITS = ${JSON.stringify(args.inits)};
const ACTIONS = ${JSON.stringify(args.actions)};
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const TOTAL = {
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
const CAT_MIX = ['software', 'hardware', 'services', 'cloud', 'labor'].map(k => ({ key: k, label: k[0].toUpperCase() + k.slice(1), val: sum(PROGRAMS, p => p.mix[k] || 0) }));
const AI_REALIZED = sum(Object.values(INITS), i => i.realized);
const NEXUS_CHIPS = ['Where is the money going?', 'Show CapEx vs OpEx', 'Which contracts renew soonest?', 'How are AI investments doing?', 'What should we stop?'];
window.ABARVA_TOWER_V2_BINDING = ${JSON.stringify({ source: args.root, tenantName: args.tenantName, ...args.total })};
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

async function buildNorthstarV1DataScript(
  client: ClientPack,
): Promise<{ script: string; tenantName: string; root: string }> {
  const [financials, vendorsRaw, appsRaw, initiativesRaw, closedRaw, aiToolsRaw] = await Promise.all([
    readCsv(client.datasetDir, '01-financials/financial-kpi-workbook.csv'),
    readCsv(client.datasetDir, '09-vendors-contracts/vendor-contracts.csv'),
    readCsv(client.datasetDir, '07-application-portfolio/application-portfolio.csv'),
    readCsv(client.datasetDir, '10-initiatives/initiatives-active.csv'),
    readCsv(client.datasetDir, '10-initiatives/initiatives-closed.csv'),
    readCsv(client.datasetDir, '14-ai-models-tools/ai-tool-footprint.csv'),
  ]);

  const latestPeriod = [...new Set(financials.map((row) => firstText(row, ['period'])).filter(Boolean))]
    .sort()
    .at(-1);
  const latestFinancials = financials.filter((row) => firstText(row, ['period']) === latestPeriod);
  const appsByBusinessUnit = new Map<string, Row[]>();
  for (const row of appsRaw) {
    const unit = firstText(row, ['business_unit_id'], 'UNASSIGNED');
    const next = appsByBusinessUnit.get(unit) ?? [];
    next.push(row);
    appsByBusinessUnit.set(unit, next);
  }

  const programs = latestFinancials.map((row, index) => {
    const unit = firstText(row, ['business_unit_id'], `NST-BU-${index + 1}`);
    const unitApps = appsByBusinessUnit.get(unit) ?? [];
    const run = unitApps.reduce((sum, app) => sum + firstNumber(app, ['annual_run_cost_usd']), 0);
    const rnd = firstNumber(row, ['r_and_d_usd']);
    const sga = firstNumber(row, ['sg_and_a_usd']);
    const change = rnd * 0.35 + sga * 0.05;
    const budget = run + change;
    const aiBudget = Math.max(budget * 0.1, aiToolsRaw.length * 350_000);
    const operatingMargin = firstNumber(row, ['operating_margin_pct']);
    const linkedInitiatives = initiativesRaw
      .filter((initiative) => {
        const appIds = firstText(initiative, ['linked_app_ids']);
        return unitApps.some((app) => appIds.includes(firstText(app, ['app_id'])));
      })
      .slice(0, 4)
      .map((initiative) => firstText(initiative, ['initiative_id']));
    return {
      id: unit,
      name: firstText(row, ['business_unit'], unit),
      fn: firstText(row, ['business_unit'], unit),
      owner: unitApps[0] ? firstText(unitApps[0], ['owner_role'], 'CIO') : 'CIO',
      cat: change > run * 0.8 ? 'Transform' : change > run * 0.35 ? 'Change' : 'Run',
      vendor: unitApps[0] ? firstText(unitApps[0], ['ams_vendor'], 'Mixed vendors') : 'Mixed vendors',
      budget: moneyM(budget),
      ytd: moneyM(budget * 0.58),
      capex: moneyM(change),
      opex: moneyM(run),
      mix: {
        software: moneyM(run * 0.24),
        hardware: moneyM(run * 0.12),
        services: moneyM(run * 0.28),
        cloud: moneyM(run * 0.16),
        labor: moneyM(change * 0.45),
      },
      aiBudget: moneyM(aiBudget),
      aiYtd: moneyM(aiBudget * 0.5),
      status: operatingMargin < 14 ? 'at-risk' : operatingMargin < 18 ? 'watch' : 'on-track',
      note: `${latestPeriod ?? 'Latest period'} operating margin ${operatingMargin || 'n/a'}% with ${unitApps.length} mapped applications.`,
      inits: linkedInitiatives,
    };
  });

  const vendors = [...vendorsRaw]
    .sort((a, b) => firstNumber(b, ['annual_value_usd']) - firstNumber(a, ['annual_value_usd']))
    .slice(0, 10)
    .map((row) => {
      const months = monthsUntil(firstText(row, ['renewal_date']));
      return {
        name: firstText(row, ['vendor_name']),
        cat: firstText(row, ['category'], 'Vendor'),
        acv: moneyM(firstNumber(row, ['annual_value_usd'])),
        renew: displayDate(firstText(row, ['renewal_date'])),
        months,
        urgency: months <= 6 ? 'at-risk' : months <= 12 ? 'watch' : 'on-track',
        prog: firstText(row, ['category'], 'Unassigned owner'),
        note: `${firstText(row, ['exit_terms'], 'standard renewal')} · ${firstText(row, ['ai_clauses'], 'AI terms not loaded')}.`,
      };
    });

  const inits = Object.fromEntries(
    [...initiativesRaw]
      .sort((a, b) => firstNumber(b, ['projected_value_usd']) - firstNumber(a, ['projected_value_usd']))
      .slice(0, 18)
      .map((row) => {
        const id = firstText(row, ['initiative_id']);
        return [id, {
          t: firstText(row, ['title']),
          committed: moneyM(firstNumber(row, ['committed_usd'])),
          ytd: moneyM(firstNumber(row, ['committed_usd']) * 0.52),
          realized: moneyM(firstNumber(row, ['projected_value_usd']) * 0.28),
          verdict: verdict(firstText(row, ['sentinel_posture', 'status'])),
        }];
      }),
  );

  const closedRealized = closedRaw.reduce((sum, row) => sum + firstNumber(row, ['realized_value_usd']), 0);
  const fnObs = Object.fromEntries(programs.map((program) => [program.fn, {
    adoption: Math.max(12, Math.min(84, Math.round((program.aiYtd / (program.aiBudget || 1)) * 100))),
    value: moneyM(closedRealized / Math.max(programs.length, 1)),
    vnote: program.note,
  }]));

  const actionCandidates = initiativesRaw.filter((row) => {
    const posture = firstText(row, ['sentinel_posture']);
    return /kill|hold|restructure/i.test(posture);
  });
  const actions = actionCandidates.slice(0, 4).map((row, index) => {
    const posture = firstText(row, ['sentinel_posture']);
    const kind = posture.includes('kill') ? 'kill' : posture.includes('hold') ? 'gov' : 'fund';
    const impact = firstNumber(row, ['projected_value_usd']);
    return {
      id: firstText(row, ['initiative_id'], `NST-ACTION-${index + 1}`),
      kind,
      kicker: kind === 'kill' ? 'Stop / redirect' : kind === 'gov' ? 'Governance gate' : 'Unblock value',
      impact: `$${moneyM(impact)}M projected value`,
      title: firstText(row, ['title']),
      why: `${client.tenantName} posture is ${posture || 'under review'} for this initiative.`,
      rec: `Route to <b>${firstText(row, ['sponsor_role'], 'CIO')}</b> for the next steering decision. Nexus proposes; the owner approves the Move.`,
      grid: [
        ['Posture', posture || 'under review'],
        ['Projected value', `$${moneyM(impact)}M`],
        ['Committed', `$${moneyM(firstNumber(row, ['committed_usd']))}M`],
        ['Owner', firstText(row, ['sponsor_role'], 'CIO')],
      ],
      owner: firstText(row, ['sponsor_role'], 'CIO'),
      move: firstText(row, ['title']),
    };
  });

  const total = {
    programs: programs.length,
    vendors: vendorsRaw.length,
    initiatives: initiativesRaw.length,
    spendRows: appsRaw.length,
    benefitRows: closedRaw.length,
  };
  const root = `datasets/${client.datasetDir}`;
  return {
    script: towerScript({ root, tenantName: client.tenantName, programs, vendors, fnObs, inits, actions, total }),
    tenantName: client.tenantName,
    root,
  };
}

export async function buildTowerV2V4DataScript(args: {
  clientKey?: string | null;
  tenantName?: string | null;
} = {}): Promise<{ script: string; tenantName: string; root: string }> {
  const client = resolveTowerV2ClientPack(args.clientKey, args.tenantName);
  if (client.format === 'northstar-v1') {
    return buildNorthstarV1DataScript(client);
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

  const root = `datasets/${client.datasetDir}`;
  const script = towerScript({ root, tenantName: client.tenantName, programs, vendors, fnObs, inits, actions, total });

  return { script, tenantName: client.tenantName, root };
}
