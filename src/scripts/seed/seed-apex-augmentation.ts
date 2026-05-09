// Apex pilot substrate augmentation validator / loader.
//
// Default mode is a local dry-run that validates the augmented Apex
// full_load.json without touching the database. Pass --apply to load via the
// existing AIR-2 idempotent upsert path.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { loadOneTenant } from './load-ai-initiatives';

const DEFAULT_TEMPLATE =
  'docs/build/intelligence/ai-initiatives-package/templates/apex-retail/full_load.json';
const DEFAULT_TODAY = '2026-05-12';
const RENEWAL_WINDOW_DAYS = 90;

interface ApexTemplate {
  tenant_slug: string;
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

interface CliArgs {
  apply: boolean;
  templatePath: string;
  todayIso: string;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args = argv.slice(2);
  const templateIdx = args.indexOf('--template');
  const todayIdx = args.indexOf('--today');
  return {
    apply: args.includes('--apply'),
    templatePath:
      templateIdx !== -1 && args[templateIdx + 1]
        ? args[templateIdx + 1]
        : DEFAULT_TEMPLATE,
    todayIso:
      todayIdx !== -1 && args[todayIdx + 1]
        ? args[todayIdx + 1]
        : process.env.TOWER_DEMO_TODAY ?? DEFAULT_TODAY,
  };
}

function readTemplate(templatePath: string): ApexTemplate {
  const abs = path.isAbsolute(templatePath)
    ? templatePath
    : path.resolve(process.cwd(), templatePath);
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as ApexTemplate;
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = Date.parse(targetIso);
  const today = Date.parse(todayIso);
  if (Number.isNaN(target) || Number.isNaN(today)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((target - today) / (1000 * 60 * 60 * 24));
}

function requireNoDuplicates(rows: ReadonlyArray<string>, label: string): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const key of rows) {
    if (seen.has(key)) errors.push(`${label} duplicate natural key: ${key}`);
    seen.add(key);
  }
  return errors;
}

function validateTemplate(tpl: ApexTemplate, todayIso: string): string[] {
  const errors: string[] = [];
  if (tpl.tenant_slug !== 'apex-retail') {
    errors.push(`Expected tenant_slug apex-retail, got ${tpl.tenant_slug}`);
  }

  const initiativeIds = new Set(tpl.initiatives.map((i) => i.initiative_id));
  const initiativeDisplayIds = new Set(tpl.initiatives.map((i) => i.display_id));
  for (const expected of ['AR-01', 'AR-02', 'AR-03', 'AR-04', 'AR-05', 'AR-06', 'AR-07']) {
    if (!initiativeDisplayIds.has(expected)) {
      errors.push(`Missing initiative display_id ${expected}`);
    }
  }

  const allChildRows = [
    ...tpl.kpi_history,
    ...tpl.stakeholder_notes,
    ...tpl.decisions,
    ...tpl.vendors,
    ...tpl.scenarios,
  ];
  for (const row of allChildRows) {
    if (!initiativeIds.has(row.initiative_id)) {
      errors.push(`Unknown initiative_id on child row: ${row.initiative_id}`);
    }
  }

  errors.push(
    ...requireNoDuplicates(
      tpl.kpi_history.map((k) => `${k.initiative_id}|${k.kpi_name}|${k.quarter}`),
      'kpi_history',
    ),
    ...requireNoDuplicates(
      tpl.stakeholder_notes.map(
        (n) => `${n.initiative_id}|${n.stakeholder_name}|${n.interview_date}`,
      ),
      'stakeholder_notes',
    ),
    ...requireNoDuplicates(
      tpl.decisions.map((d) => `${d.initiative_id}|${d.decision_name}`),
      'decisions',
    ),
    ...requireNoDuplicates(
      tpl.scenarios.map((s) => `${s.initiative_id}|${s.scenario_name}`),
      'scenarios',
    ),
  );

  if (tpl.kpi_history.length < 80) errors.push(`Expected >=80 KPI rows, got ${tpl.kpi_history.length}`);
  if (tpl.decisions.length < 12) errors.push(`Expected >=12 decisions, got ${tpl.decisions.length}`);
  if (tpl.scenarios.length < 12) errors.push(`Expected >=12 scenarios, got ${tpl.scenarios.length}`);
  if (tpl.stakeholder_notes.length < 14) {
    errors.push(`Expected >=14 stakeholder notes, got ${tpl.stakeholder_notes.length}`);
  }

  for (const initiative of tpl.initiatives) {
    const kpis = tpl.kpi_history.filter((k) => k.initiative_id === initiative.initiative_id);
    const names = new Set(kpis.map((k) => k.kpi_name));
    const quarters = new Set(kpis.map((k) => k.quarter));
    if (kpis.length < 8) errors.push(`${initiative.display_id} has ${kpis.length} KPI rows; expected >=8`);
    if (names.size < 2) errors.push(`${initiative.display_id} has ${names.size} KPI names; expected >=2`);
    if (quarters.size < 4) errors.push(`${initiative.display_id} has ${quarters.size} quarters; expected >=4`);
  }

  for (const kpi of tpl.kpi_history) {
    if (!kpi.kpi_name || !kpi.quarter || typeof kpi.kpi_value !== 'number') {
      errors.push(`Malformed KPI row: ${JSON.stringify(kpi)}`);
    }
    if (!['HIGH', 'MED', 'LOW'].includes(kpi.confidence_level)) {
      errors.push(`Invalid KPI confidence: ${kpi.confidence_level}`);
    }
    if (typeof kpi.peer_median !== 'number') {
      errors.push(`Missing peer_median for ${kpi.initiative_id}|${kpi.kpi_name}|${kpi.quarter}`);
    }
  }

  const confidences = new Set(tpl.kpi_history.map((k) => k.confidence_level));
  for (const expected of ['HIGH', 'MED', 'LOW']) {
    if (!confidences.has(expected)) errors.push(`Missing KPI confidence bucket ${expected}`);
  }

  const dissentCount = tpl.decisions.filter((d) => d.dissent_recorded).length;
  if (dissentCount < 3) errors.push(`Expected >=3 dissent records, got ${dissentCount}`);
  for (const decision of tpl.decisions) {
    if (!['decided', 'pending', 'stalled', 'reversed'].includes(decision.decision_status)) {
      errors.push(`Invalid decision_status ${decision.decision_status}`);
    }
    if (decision.dissent_recorded && !decision.dissent_summary) {
      errors.push(`Dissent decision missing summary: ${decision.decision_name}`);
    }
  }

  const consentTrue = tpl.stakeholder_notes.filter((n) => n.attribution_consent).length;
  const consentFalse = tpl.stakeholder_notes.length - consentTrue;
  if (consentTrue < 4 || consentFalse < 2) {
    errors.push(`Expected consent mix >=4 true and >=2 false, got ${consentTrue}/${consentFalse}`);
  }
  for (const note of tpl.stakeholder_notes) {
    if (!note.stakeholder_name || !note.stakeholder_title || !note.interview_date || !note.quote) {
      errors.push(`Malformed stakeholder note: ${JSON.stringify(note)}`);
    }
    if (/^[A-Z]\\.?\\s+[A-Z][a-z]+/.test(note.stakeholder_name)) {
      errors.push(`Stakeholder note should use role-only attribution: ${note.stakeholder_name}`);
    }
  }

  const probabilities = tpl.scenarios
    .map((s) => s.probability_pct)
    .filter((p): p is number => typeof p === 'number');
  if (probabilities.length !== tpl.scenarios.length) {
    errors.push('Every scenario must include probability_pct');
  }
  if (new Set(probabilities).size < 6) {
    errors.push('Expected scenario probability_pct distribution with at least 6 distinct values');
  }

  const renewalsInWindow = tpl.vendors.filter((v) => {
    if (!v.renewal_date) return false;
    const days = daysUntil(v.renewal_date, todayIso);
    return days >= 0 && days <= RENEWAL_WINDOW_DAYS;
  });
  if (renewalsInWindow.length < 1) {
    errors.push(`Expected >=1 vendor renewal within ${RENEWAL_WINDOW_DAYS} days of ${todayIso}`);
  }

  return errors;
}

function loadEnvFiles(): void {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv();
}

function createSeedClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required in .env.local');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const tpl = readTemplate(args.templatePath);
  const errors = validateTemplate(tpl, args.todayIso);
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`- ${error}\n`);
    throw new Error(`Apex augmentation validation failed with ${errors.length} error(s)`);
  }

  process.stdout.write(
    [
      `Apex augmentation validation passed for ${args.templatePath}`,
      `  initiatives        ${tpl.initiatives.length}`,
      `  kpi_history        ${tpl.kpi_history.length}`,
      `  stakeholder_notes  ${tpl.stakeholder_notes.length}`,
      `  decisions          ${tpl.decisions.length}`,
      `  vendors            ${tpl.vendors.length}`,
      `  scenarios          ${tpl.scenarios.length}`,
      `  todayIso           ${args.todayIso}`,
    ].join('\n') + '\n',
  );

  if (!args.apply) {
    process.stdout.write('Dry-run only. Pass --apply to upsert into Supabase.\n');
    return;
  }

  loadEnvFiles();
  const sb = createSeedClient();
  const { counts } = await loadOneTenant(sb, args.templatePath);
  process.stdout.write(`Loaded Apex augmentation: ${JSON.stringify(counts)}\n`);
}

const isCli =
  typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module;
const isEsmCli =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli || isEsmCli) {
  main().catch((err) => {
    process.stderr.write(`\nLoad failed: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}
