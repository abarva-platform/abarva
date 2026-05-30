import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { getAzureWriteFluentClient, type PostgresCompatClient } from '@/lib/data-plane/postgresCompat';
type SeedClient = PostgresCompatClient;
import { loadOneTenant } from './load-ai-initiatives';

const TEMPLATE_BASE = 'docs/build/intelligence/ai-initiatives-package/templates';
const TEMPLATE_PATHS = [
  `${TEMPLATE_BASE}/apex-retail/full_load.json`,
  `${TEMPLATE_BASE}/meridian-health/full_load.json`,
  `${TEMPLATE_BASE}/first-capital-financial/full_load.json`,
] as const;
const DEFAULT_TODAY = '2026-05-12';
const RENEWAL_WINDOW_DAYS = 90;

interface TemplatePayload {
  tenant_slug: string;
  template_version: string;
  initiatives: Array<{ initiative_id: string; display_id: string }>;
  kpi_history: Array<{
    initiative_id: string;
    kpi_name: string;
    quarter: string;
    kpi_value: number;
    peer_median?: number | null;
    confidence_level: string;
  }>;
  stakeholder_notes: Array<{
    initiative_id: string;
    stakeholder_name: string;
    stakeholder_title: string;
    interview_date: string;
    quote: string;
    attribution_consent?: boolean;
  }>;
  decisions: Array<{
    initiative_id: string;
    decision_name: string;
    decision_status: string;
    dissent_recorded?: boolean;
    dissent_summary?: string | null;
  }>;
  vendors: Array<{
    initiative_id: string;
    vendor_name: string;
    renewal_date?: string | null;
  }>;
  scenarios: Array<{
    initiative_id: string;
    scenario_name: string;
    probability_pct?: number | null;
  }>;
}

interface Args {
  apply: boolean;
  todayIso: string;
}

function parseArgs(argv: ReadonlyArray<string>): Args {
  const args = argv.slice(2);
  const todayIdx = args.indexOf('--today');
  return {
    apply: args.includes('--apply'),
    todayIso:
      todayIdx !== -1 && args[todayIdx + 1]
        ? args[todayIdx + 1]
        : process.env.TOWER_DEMO_TODAY ?? DEFAULT_TODAY,
  };
}

function readTemplate(templatePath: string): TemplatePayload {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), templatePath), 'utf8')) as TemplatePayload;
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) return Number.POSITIVE_INFINITY;
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function duplicateKeys(keys: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) dupes.add(key);
    seen.add(key);
  }
  return [...dupes];
}

function validateTemplate(tpl: TemplatePayload, todayIso: string): string[] {
  const errors: string[] = [];
  const initiativeIds = new Set(tpl.initiatives.map((initiative) => initiative.initiative_id));
  const childSets: Array<[string, Array<{ initiative_id: string }>]> = [
    ['kpi_history', tpl.kpi_history],
    ['stakeholder_notes', tpl.stakeholder_notes],
    ['decisions', tpl.decisions],
    ['vendors', tpl.vendors],
    ['scenarios', tpl.scenarios],
  ];

  if (tpl.initiatives.length < 7) errors.push(`expected >=7 initiatives, got ${tpl.initiatives.length}`);
  if (!tpl.template_version.includes('tower-agent-depth')) {
    errors.push(`template_version must include tower-agent-depth, got ${tpl.template_version}`);
  }

  for (const [label, rows] of childSets) {
    for (const row of rows) {
      if (!initiativeIds.has(row.initiative_id)) {
        errors.push(`${label} references unknown initiative_id ${row.initiative_id}`);
      }
    }
  }

  const kpiDuplicates = duplicateKeys(
    tpl.kpi_history.map((row) => `${row.initiative_id}|${row.kpi_name}|${row.quarter}`),
  );
  if (kpiDuplicates.length > 0) errors.push(`duplicate KPI natural keys: ${kpiDuplicates.join(', ')}`);
  const decisionDuplicates = duplicateKeys(
    tpl.decisions.map((row) => `${row.initiative_id}|${row.decision_name}`),
  );
  if (decisionDuplicates.length > 0) errors.push(`duplicate decision natural keys: ${decisionDuplicates.join(', ')}`);
  const scenarioDuplicates = duplicateKeys(
    tpl.scenarios.map((row) => `${row.initiative_id}|${row.scenario_name}`),
  );
  if (scenarioDuplicates.length > 0) errors.push(`duplicate scenario natural keys: ${scenarioDuplicates.join(', ')}`);

  const kpiFloor = tpl.initiatives.length * 4 * 4;
  if (tpl.kpi_history.length < kpiFloor) errors.push(`expected >=${kpiFloor} KPI rows, got ${tpl.kpi_history.length}`);
  for (const initiative of tpl.initiatives) {
    const rows = tpl.kpi_history.filter((row) => row.initiative_id === initiative.initiative_id);
    const metricNames = new Set(rows.map((row) => row.kpi_name));
    const quarters = new Set(rows.map((row) => row.quarter));
    if (metricNames.size < 4) errors.push(`${initiative.display_id} has ${metricNames.size} KPI names; expected >=4`);
    if (quarters.size < 4) errors.push(`${initiative.display_id} has ${quarters.size} quarters; expected >=4`);
  }
  for (const row of tpl.kpi_history) {
    if (typeof row.kpi_value !== 'number') errors.push(`KPI missing numeric kpi_value: ${row.initiative_id}|${row.kpi_name}|${row.quarter}`);
    if (typeof row.peer_median !== 'number') errors.push(`KPI missing numeric peer_median: ${row.initiative_id}|${row.kpi_name}|${row.quarter}`);
    if (!['HIGH', 'MED', 'LOW'].includes(row.confidence_level)) {
      errors.push(`KPI invalid confidence_level: ${row.confidence_level}`);
    }
  }

  if (tpl.decisions.length < tpl.initiatives.length * 2) {
    errors.push(`expected >=${tpl.initiatives.length * 2} decisions, got ${tpl.decisions.length}`);
  }
  const dissent = tpl.decisions.filter((row) => row.dissent_recorded).length;
  if (dissent < 3) errors.push(`expected >=3 dissent decisions, got ${dissent}`);
  for (const decision of tpl.decisions) {
    if (decision.dissent_recorded && !decision.dissent_summary) {
      errors.push(`dissent decision missing summary: ${decision.decision_name}`);
    }
  }

  if (tpl.scenarios.length < tpl.initiatives.length * 2) {
    errors.push(`expected >=${tpl.initiatives.length * 2} scenarios, got ${tpl.scenarios.length}`);
  }
  const probabilities = tpl.scenarios.map((row) => row.probability_pct);
  if (probabilities.some((value) => typeof value !== 'number')) {
    errors.push('every scenario must include numeric probability_pct');
  }
  if (new Set(probabilities).size < 6) {
    errors.push('scenario probabilities need at least 6 distinct values');
  }

  if (tpl.stakeholder_notes.length < tpl.initiatives.length * 2) {
    errors.push(`expected >=${tpl.initiatives.length * 2} stakeholder notes, got ${tpl.stakeholder_notes.length}`);
  }
  const consentTrue = tpl.stakeholder_notes.filter((note) => note.attribution_consent).length;
  const consentFalse = tpl.stakeholder_notes.length - consentTrue;
  if (consentTrue < 4 || consentFalse < 2) {
    errors.push(`stakeholder consent mix too thin: true=${consentTrue}, false=${consentFalse}`);
  }

  const renewalsInWindow = tpl.vendors.filter((vendor) => {
    if (!vendor.renewal_date) return false;
    const days = daysUntil(vendor.renewal_date, todayIso);
    return days >= 0 && days <= RENEWAL_WINDOW_DAYS;
  });
  if (renewalsInWindow.length < 1) {
    errors.push(`expected >=1 vendor renewal within ${RENEWAL_WINDOW_DAYS} days of ${todayIso}`);
  }

  return errors;
}

function loadEnvFiles(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv();
}

function createSeedClient(): SeedClient {
  return getAzureWriteFluentClient();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const failures: string[] = [];
  for (const templatePath of TEMPLATE_PATHS) {
    const tpl = readTemplate(templatePath);
    const errors = validateTemplate(tpl, args.todayIso);
    if (errors.length > 0) {
      failures.push(`${templatePath}\n  - ${errors.join('\n  - ')}`);
      continue;
    }
    process.stdout.write(
      `${tpl.tenant_slug}: OK (${tpl.kpi_history.length} KPI rows, ${tpl.decisions.length} decisions, ${tpl.scenarios.length} scenarios, ${tpl.stakeholder_notes.length} notes)\n`,
    );
  }

  if (failures.length > 0) {
    throw new Error(`Tower substrate depth validation failed:\n${failures.join('\n')}`);
  }

  if (!args.apply) {
    process.stdout.write('Dry-run only. Pass --apply to upsert the validated templates into Azure Postgres.\n');
    return;
  }

  loadEnvFiles();
  const sb = createSeedClient();
  for (const templatePath of TEMPLATE_PATHS) {
    const result = await loadOneTenant(sb, templatePath);
    process.stdout.write(`Loaded ${result.tenant}: ${JSON.stringify(result.counts)}\n`);
  }
}

const isCli =
  typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module;
const isEsmCli =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli || isEsmCli) {
  main().catch((err) => {
    process.stderr.write(`\n${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}

export { TEMPLATE_PATHS, validateTemplate };
