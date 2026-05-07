// AIR-2 · AI Initiatives Registry loader.
//
// Reads a tenant template (full_load.json) and ingests its rows into
// the ai_* tables created by the AIR-1 migration. One tenant per
// invocation; pass --all to load Apex / Meridian / First Capital in
// sequence.
//
// Dependency order (matches the FK graph): business_goals first, then
// initiatives, then the 5 supporting tables (kpis, stakeholder_notes,
// decisions, vendors, scenarios). Re-runs are safe: PRIMARY KEY +
// UNIQUE constraints on the upsert calls make this idempotent.
//
// Provenance: every row is tagged with
// `loaded_via_template = '<tenant-slug>/full_load.json v<version>'`
// per the package's day-1 manual-load marker convention.

import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

// ---------------------------------------------------------------------
// Tenant slug mapping
// ---------------------------------------------------------------------
//
// Templates use kebab-case slugs (apex-retail · meridian-health ·
// first-capital-financial). The clients table key column is
// `tenant_key` which uses the broker convention (apexretail · meridian
// · arcturus). This map is the only place where the two conventions
// meet.

const SLUG_TO_TENANT_KEY: Record<string, string> = {
  'apex-retail': 'apexretail',
  'meridian-health': 'meridian',
  'first-capital-financial': 'arcturus',
};

const TENANT_KEY_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_TENANT_KEY).map(([slug, key]) => [key, slug]),
) as Record<string, string>;

// ---------------------------------------------------------------------
// Template shape
// ---------------------------------------------------------------------

interface TemplatePayload {
  tenant_slug: string;
  template_version: string;
  loaded_at: string;
  business_goals: Array<{
    goal_id: string;
    name: string;
    strategic_context: string;
    display_order: number;
  }>;
  initiatives: Array<{
    initiative_id: string;
    display_id: string;
    name: string;
    description: string;
    primary_category_id: string;
    secondary_category_id?: string | null;
    primary_goal_id: string;
    stage: string;
    stage_detail?: string | null;
    owner_name: string;
    owner_title: string;
    owner_function?: string | null;
    committed_annual_usd?: number | null;
    committed_total_usd?: number | null;
    measured_value_usd?: number | null;
    status_flag: string;
    status_summary: string;
    confidence_level: string;
    aligned_callout: boolean;
    aligned_rationale?: string | null;
  }>;
  kpi_history: Array<{
    initiative_id: string;
    kpi_name: string;
    kpi_unit?: string | null;
    quarter: string;
    kpi_value: number;
    target_value?: number | null;
    peer_median?: number | null;
    confidence_level: string;
  }>;
  stakeholder_notes: Array<{
    initiative_id: string;
    stakeholder_name: string;
    stakeholder_title: string;
    interview_date: string;
    quote: string;
    themes?: string[];
    attribution_consent?: boolean;
  }>;
  decisions: Array<{
    initiative_id: string;
    decision_name: string;
    decision_date?: string | null;
    sponsor_name?: string | null;
    decision_status: string;
    dissent_recorded?: boolean;
    dissent_summary?: string | null;
    outcome_status?: string | null;
  }>;
  vendors: Array<{
    initiative_id: string;
    vendor_name: string;
    contract_value_usd?: number | null;
    renewal_date?: string | null;
    financial_health?: string | null;
    notes?: string | null;
  }>;
  scenarios: Array<{
    initiative_id: string;
    scenario_name: string;
    trigger_event?: string | null;
    time_horizon_months?: number | null;
    probability_pct?: number | null;
    impact_summary: string;
  }>;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

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

async function resolveClientId(sb: SupabaseClient, tenantKey: string): Promise<string> {
  const { data, error } = await sb
    .from('clients')
    .select('id, name, tenant_key')
    .eq('tenant_key', tenantKey)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `Client row not found for tenant_key='${tenantKey}'. ` +
        `Run base seed wave first (npm run db:seed) or set tenant_key on the matching clients row.`,
    );
  }
  return data.id as string;
}

async function upsert(
  sb: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  conflictTarget: string,
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).upsert(rows, { onConflict: conflictTarget });
  if (error) {
    throw new Error(`Upsert into ${table} failed: ${error.message}`);
  }
}

function loadTemplate(templatePath: string): TemplatePayload {
  const abs = path.isAbsolute(templatePath)
    ? templatePath
    : path.resolve(process.cwd(), templatePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw) as TemplatePayload;
}

function provenanceTag(slug: string, version: string): string {
  return `${slug}/full_load.json ${version}`;
}

// ---------------------------------------------------------------------
// Per-tenant load
// ---------------------------------------------------------------------

async function loadOneTenant(
  sb: SupabaseClient,
  templatePath: string,
): Promise<{ tenant: string; counts: Record<string, number> }> {
  const tpl = loadTemplate(templatePath);
  const tenantKey = SLUG_TO_TENANT_KEY[tpl.tenant_slug];
  if (!tenantKey) {
    throw new Error(
      `Unknown tenant_slug '${tpl.tenant_slug}'. ` +
        `Expected one of: ${Object.keys(SLUG_TO_TENANT_KEY).join(', ')}.`,
    );
  }
  const clientId = await resolveClientId(sb, tenantKey);
  const tag = provenanceTag(tpl.tenant_slug, tpl.template_version);

  // 1. Business goals
  await upsert(
    sb,
    'ai_business_goals',
    tpl.business_goals.map((g) => ({
      goal_id: g.goal_id,
      client_id: clientId,
      name: g.name,
      strategic_context: g.strategic_context,
      display_order: g.display_order,
      loaded_via_template: tag,
    })),
    'goal_id',
  );

  // 2. Initiatives
  await upsert(
    sb,
    'ai_initiatives',
    tpl.initiatives.map((i) => ({
      initiative_id: i.initiative_id,
      client_id: clientId,
      display_id: i.display_id,
      name: i.name,
      description: i.description,
      primary_category_id: i.primary_category_id,
      secondary_category_id: i.secondary_category_id ?? null,
      primary_goal_id: i.primary_goal_id,
      stage: i.stage,
      stage_detail: i.stage_detail ?? null,
      owner_name: i.owner_name,
      owner_title: i.owner_title,
      owner_function: i.owner_function ?? null,
      committed_annual_usd: i.committed_annual_usd ?? null,
      committed_total_usd: i.committed_total_usd ?? null,
      measured_value_usd: i.measured_value_usd ?? null,
      status_flag: i.status_flag,
      status_summary: i.status_summary,
      confidence_level: i.confidence_level,
      aligned_callout: i.aligned_callout,
      aligned_rationale: i.aligned_rationale ?? null,
      loaded_via_template: tag,
    })),
    'initiative_id',
  );

  // 3. KPI history
  await upsert(
    sb,
    'ai_initiative_kpis',
    tpl.kpi_history.map((k) => ({
      initiative_id: k.initiative_id,
      kpi_name: k.kpi_name,
      kpi_unit: k.kpi_unit ?? null,
      quarter: k.quarter,
      kpi_value: k.kpi_value,
      target_value: k.target_value ?? null,
      peer_median: k.peer_median ?? null,
      confidence_level: k.confidence_level,
      loaded_via_template: tag,
    })),
    'initiative_id,kpi_name,quarter',
  );

  // 4. Stakeholder notes
  await upsert(
    sb,
    'ai_initiative_stakeholder_notes',
    tpl.stakeholder_notes.map((n) => ({
      initiative_id: n.initiative_id,
      stakeholder_name: n.stakeholder_name,
      stakeholder_title: n.stakeholder_title,
      interview_date: n.interview_date,
      quote: n.quote,
      themes: n.themes ?? null,
      attribution_consent: n.attribution_consent ?? false,
      loaded_via_template: tag,
    })),
    'note_id',
  );

  // 5. Decisions
  await upsert(
    sb,
    'ai_initiative_decisions',
    tpl.decisions.map((d) => ({
      initiative_id: d.initiative_id,
      decision_name: d.decision_name,
      decision_date: d.decision_date ?? null,
      sponsor_name: d.sponsor_name ?? null,
      decision_status: d.decision_status,
      dissent_recorded: d.dissent_recorded ?? false,
      dissent_summary: d.dissent_summary ?? null,
      outcome_status: d.outcome_status ?? null,
      loaded_via_template: tag,
    })),
    'decision_id',
  );

  // 6. Vendors
  await upsert(
    sb,
    'ai_initiative_vendors',
    tpl.vendors.map((v) => ({
      initiative_id: v.initiative_id,
      vendor_name: v.vendor_name,
      contract_value_usd: v.contract_value_usd ?? null,
      renewal_date: v.renewal_date ?? null,
      financial_health: v.financial_health ?? null,
      notes: v.notes ?? null,
      loaded_via_template: tag,
    })),
    'vendor_id',
  );

  // 7. Scenarios
  await upsert(
    sb,
    'ai_initiative_scenarios',
    tpl.scenarios.map((s) => ({
      initiative_id: s.initiative_id,
      scenario_name: s.scenario_name,
      trigger_event: s.trigger_event ?? null,
      time_horizon_months: s.time_horizon_months ?? null,
      probability_pct: s.probability_pct ?? null,
      impact_summary: s.impact_summary,
      loaded_via_template: tag,
    })),
    'scenario_id',
  );

  return {
    tenant: tpl.tenant_slug,
    counts: {
      business_goals: tpl.business_goals.length,
      initiatives: tpl.initiatives.length,
      kpi_history: tpl.kpi_history.length,
      stakeholder_notes: tpl.stakeholder_notes.length,
      decisions: tpl.decisions.length,
      vendors: tpl.vendors.length,
      scenarios: tpl.scenarios.length,
    },
  };
}

// ---------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------

const TEMPLATE_BASE = 'docs/build/intelligence/ai-initiatives-package/templates';
const ALL_TEMPLATE_PATHS: ReadonlyArray<string> = [
  `${TEMPLATE_BASE}/apex-retail/full_load.json`,
  `${TEMPLATE_BASE}/meridian-health/full_load.json`,
  `${TEMPLATE_BASE}/first-capital-financial/full_load.json`,
];

function parseArgs(argv: ReadonlyArray<string>): { all: boolean; template?: string } {
  const args = argv.slice(2);
  if (args.includes('--all')) return { all: true };
  const idx = args.indexOf('--template');
  if (idx !== -1 && args[idx + 1]) {
    return { all: false, template: args[idx + 1] };
  }
  return { all: false };
}

async function main(): Promise<void> {
  loadEnvFiles();
  const sb = createSeedClient();
  const { all, template } = parseArgs(process.argv);

  const paths = all ? ALL_TEMPLATE_PATHS : template ? [template] : [];
  if (paths.length === 0) {
    console.error('Usage:');
    console.error(
      '  npx tsx src/scripts/seed/load-ai-initiatives.ts --template <path-to-full_load.json>',
    );
    console.error(
      '  npx tsx src/scripts/seed/load-ai-initiatives.ts --all     # all 3 demo tenants',
    );
    process.exitCode = 1;
    return;
  }

  for (const p of paths) {
    process.stdout.write(`\nLoading ${p} ...\n`);
    const { tenant, counts } = await loadOneTenant(sb, p);
    process.stdout.write(`✓ ${tenant} (key: ${SLUG_TO_TENANT_KEY[tenant]})\n`);
    for (const [name, n] of Object.entries(counts)) {
      process.stdout.write(`    ${name.padEnd(20)} ${String(n).padStart(4)} rows\n`);
    }
  }

  process.stdout.write('\nDone.\n');
}

const isCli =
  typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module;
const isEsmCli =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli || isEsmCli) {
  main().catch((err) => {
    process.stderr.write(`\n✗ Load failed: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}

export { loadOneTenant, SLUG_TO_TENANT_KEY, TENANT_KEY_TO_SLUG };
