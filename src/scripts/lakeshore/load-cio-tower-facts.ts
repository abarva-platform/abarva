/**
 * Lakeshore · cio_tower facts loader
 *
 * Reads the corrected F12 IT budget CSV (datasets/lakeshore-industries-synthetic-v4)
 * and seeds the cio_tower schema with:
 *   - source_registry: one entry for F12
 *   - measures: run_budget_fy26, change_budget_fy26, total_it_budget_fy26, ai_innovation_budget_fy26
 *   - question_contracts: 6 standard Tower contracts
 *   - entities: 1 holdco + 5 OpCo + 8 corporate org_units
 *   - facts: 2 per F12 row (run + change) + 3 enterprise-envelope rollups
 *   - measure_results: aggregated opco/corporate/grand-total per measure
 *
 * Run (local, needs DATABASE_URL in .env.local):
 *   npx ts-node -P tsconfig.json --skip-project src/scripts/lakeshore/load-cio-tower-facts.ts
 *
 * Run (ACA job, private VNet):
 *   az acr build → image-override job-abarva-db-migrate-lab-eastus → az containerapp job start
 *
 * Idempotent: all inserts use ON CONFLICT DO UPDATE.
 */

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import Papa from 'papaparse';
import { Client } from 'pg';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const TENANT_KEY = 'lakeshore-industries';
const PERIOD = 'FY26';
const BASIS = 'committed';
const SOURCE_KEY = 'lakeshore-f12-it-budget-v4';

const F12_PATH = path.resolve(
  process.cwd(),
  'datasets/lakeshore-industries-synthetic-v4/family-4-financial-commercial/F12_it-budget-financials.csv',
);

type F12Row = {
  budget_id: string;
  budget_area: string;
  owner_role: string;
  run_budget_usd: string;
  change_budget_usd: string;
  ai_or_data_budget_usd: string;
  labor_pct: string;
  vendor_pct: string;
  cloud_or_infra_pct: string;
  budget_pressure: string;
};

type DbRow = Record<string, unknown>;

function num(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
}

function isOpCo(row: F12Row): boolean {
  return row.budget_id.startsWith('LAK-PC-');
}

function entityKey(row: F12Row): string {
  return `${TENANT_KEY}::${isOpCo(row) ? 'portfolio_company' : 'org_unit'}::${row.budget_id.toLowerCase()}`;
}

function factKey(budgetId: string, amountType: 'run' | 'change'): string {
  return `${TENANT_KEY}::it_budget::${budgetId.toLowerCase()}::${amountType}::${PERIOD.toLowerCase()}`;
}

async function exec(client: Client, sql: string, params: unknown[] = []): Promise<void> {
  await client.query(sql, params);
}

async function upsertBatch(client: Client, table: string, rows: DbRow[], conflictCols: string[]): Promise<number> {
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]!);
  const updateCols = cols.filter((c) => !conflictCols.includes(c));
  let written = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const vals: unknown[] = [];
    const tuples = batch.map((row) => {
      const placeholders = cols.map((c) => {
        vals.push(row[c] ?? null);
        return `$${vals.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const conflictClause =
      updateCols.length === 0
        ? 'DO NOTHING'
        : `DO UPDATE SET ${updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}`;
    await client.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES ${tuples.join(', ')} ON CONFLICT (${conflictCols.join(', ')}) ${conflictClause}`,
      vals,
    );
    written += batch.length;
  }
  return written;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.log('DRY-RUN mode — no DB writes');

  // ── Parse F12 ───────────────────────────────────────────────────────────────
  const csvText = readFileSync(F12_PATH, 'utf8');
  const parsed = Papa.parse<F12Row>(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    console.error('CSV parse error:', parsed.errors[0]?.message);
    process.exit(1);
  }
  const rows = parsed.data;
  console.log(`Parsed ${rows.length} rows from F12`);

  // ── Compute aggregates ───────────────────────────────────────────────────────
  const opcoRows = rows.filter(isOpCo);
  const corpRows = rows.filter((r) => !isOpCo(r));

  const opcoRun = opcoRows.reduce((s, r) => s + num(r.run_budget_usd), 0);
  const opcoChange = opcoRows.reduce((s, r) => s + num(r.change_budget_usd), 0);
  const corpRun = corpRows.reduce((s, r) => s + num(r.run_budget_usd), 0);
  const corpChange = corpRows.reduce((s, r) => s + num(r.change_budget_usd), 0);
  const aiRow = rows.find((r) => r.budget_id === 'LAK-CS-008');
  const aiTotal = aiRow ? num(aiRow.run_budget_usd) + num(aiRow.change_budget_usd) : 0;
  const grandRun = opcoRun + corpRun;
  const grandChange = opcoChange + corpChange;
  const grandTotal = grandRun + grandChange;

  console.log(`  OpCo IT:    run=$${(opcoRun / 1e6).toFixed(1)}M  change=$${(opcoChange / 1e6).toFixed(1)}M  total=$${((opcoRun + opcoChange) / 1e6).toFixed(1)}M`);
  console.log(`  Corporate:  run=$${(corpRun / 1e6).toFixed(1)}M  change=$${(corpChange / 1e6).toFixed(1)}M  total=$${((corpRun + corpChange) / 1e6).toFixed(1)}M`);
  console.log(`  Grand total: $${(grandTotal / 1e6).toFixed(1)}M  (run=$${(grandRun / 1e6).toFixed(1)}M + change=$${(grandChange / 1e6).toFixed(1)}M)`);
  console.log(`  AI/Innovation: $${(aiTotal / 1e6).toFixed(1)}M`);

  if (dryRun) {
    console.log('\nDRY-RUN complete — would write to cio_tower.{source_registry,measures,question_contracts,entities,facts,measure_results}');
    return;
  }

  // ── Connect ──────────────────────────────────────────────────────────────────
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('\nConnected to DB');

  try {
    // ── 1. source_registry ───────────────────────────────────────────────────
    await upsertBatch(
      client,
      'cio_tower.source_registry',
      [
        {
          source_key: SOURCE_KEY,
          tenant_key: TENANT_KEY,
          source_system: 'synthetic_dataset_v4',
          source_file: 'datasets/lakeshore-industries-synthetic-v4/family-4-financial-commercial/F12_it-budget-financials.csv',
          source_kind: 'file',
          source_version: 'v4-corrected-2026-07-05',
          trust_tier: 'synthetic_demo',
          row_count: rows.length,
          freshness_date: '2026-07-05',
          metadata: JSON.stringify({
            total_it_budget_usd: grandTotal,
            opco_it_budget_usd: opcoRun + opcoChange,
            corporate_it_budget_usd: corpRun + corpChange,
            correction_note: 'Rebuilt 2026-07-05 — old rows had inflated operating-company budgets (~$983M). Correct structure: holdco total = sum(OpCo IT) + corporate shared services. Grand total $190.6M.',
          }),
        },
      ],
      ['source_key'],
    );
    console.log('✓ source_registry');

    // ── 2. measures (global — no tenant_key) ────────────────────────────────
    const measures: DbRow[] = [
      {
        measure_key: 'run_budget_fy26',
        label: 'FY26 Run IT Budget',
        description: 'Annual run-the-business IT spending commitment for FY26 across all scopes.',
        default_scope: 'enterprise_envelope',
        grain_filter: JSON.stringify({ amount_type: 'run', view: 'it_budget', period: 'FY26' }),
        group_by: JSON.stringify(['scope', 'entity_type']),
        aggregation: 'sum',
        honesty_rule: 'return_not_loaded_when_no_matching_facts',
        artifact_default: 'metric_card',
        formula: 'SUM(value_numeric) WHERE amount_type=run AND view=it_budget AND period=FY26',
        formula_version: 'cio_tower_v1',
        active: true,
      },
      {
        measure_key: 'change_budget_fy26',
        label: 'FY26 Change IT Budget',
        description: 'Annual change-the-business IT spending commitment for FY26 across all scopes.',
        default_scope: 'enterprise_envelope',
        grain_filter: JSON.stringify({ amount_type: 'change', view: 'it_budget', period: 'FY26' }),
        group_by: JSON.stringify(['scope', 'entity_type']),
        aggregation: 'sum',
        honesty_rule: 'return_not_loaded_when_no_matching_facts',
        artifact_default: 'metric_card',
        formula: 'SUM(value_numeric) WHERE amount_type=change AND view=it_budget AND period=FY26',
        formula_version: 'cio_tower_v1',
        active: true,
      },
      {
        measure_key: 'total_it_budget_fy26',
        label: 'FY26 Total IT Budget',
        description: 'Total IT budget (run + change) across all portfolio companies and corporate shared services.',
        default_scope: 'enterprise_envelope',
        grain_filter: JSON.stringify({ view: 'it_budget', period: 'FY26' }),
        group_by: JSON.stringify(['scope']),
        aggregation: 'sum',
        honesty_rule: 'return_not_loaded_when_no_matching_facts',
        artifact_default: 'metric_card',
        formula: 'SUM(value_numeric) WHERE view=it_budget AND period=FY26',
        formula_version: 'cio_tower_v1',
        active: true,
      },
      {
        measure_key: 'ai_innovation_budget_fy26',
        label: 'FY26 AI & Innovation Budget',
        description: 'Dedicated AI and innovation investment via the Corporate AI and Innovation Office.',
        default_scope: 'shared_services',
        grain_filter: JSON.stringify({ view: 'it_budget', period: 'FY26', entity_key_prefix: `${TENANT_KEY}::org_unit::lak-cs-008` }),
        group_by: JSON.stringify([]),
        aggregation: 'sum',
        honesty_rule: 'return_not_loaded_when_no_matching_facts',
        artifact_default: 'metric_card',
        formula: 'SUM(value_numeric) WHERE entity_key LIKE %lak-cs-008% AND view=it_budget AND period=FY26',
        formula_version: 'cio_tower_v1',
        active: true,
      },
    ];
    await upsertBatch(client, 'cio_tower.measures', measures, ['measure_key']);
    console.log(`✓ measures (${measures.length})`);

    // ── 3. question_contracts (global) ───────────────────────────────────────
    const contracts: DbRow[] = [
      {
        contract_key: 'tower_total_it_spend',
        surface: 'tower',
        intent: 'lookup',
        question_family: 'it_budget_total',
        measure_key: 'total_it_budget_fy26',
        default_scope: 'enterprise_envelope',
        dimensions: JSON.stringify(['scope', 'portfolio_company']),
        filters_schema: JSON.stringify({ period: 'FY26' }),
        required_fields: JSON.stringify(['value_numeric', 'scope']),
        artifact_type: 'metric_card',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([
          'What is our total IT spend?',
          'How much are we spending on IT this year?',
          'What is the FY26 IT budget?',
        ]),
        active: true,
      },
      {
        contract_key: 'tower_run_change_split',
        surface: 'tower',
        intent: 'table',
        question_family: 'it_budget_run_change',
        measure_key: 'run_budget_fy26',
        default_scope: 'enterprise_envelope',
        dimensions: JSON.stringify(['scope', 'amount_type']),
        filters_schema: JSON.stringify({ period: 'FY26' }),
        required_fields: JSON.stringify(['value_numeric', 'amount_type']),
        artifact_type: 'table',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([
          'Show me the run vs change split',
          'What is the run/change breakdown?',
          'How much is run vs change?',
        ]),
        active: true,
      },
      {
        contract_key: 'tower_top_it_programs_by_budget',
        surface: 'tower',
        intent: 'table',
        question_family: 'it_programs_ranked',
        measure_key: 'total_it_budget_fy26',
        default_scope: 'portfolio_company',
        dimensions: JSON.stringify(['entity_display_name', 'scope']),
        filters_schema: JSON.stringify({ period: 'FY26', limit: 10 }),
        required_fields: JSON.stringify(['value_numeric', 'entity_display_name']),
        artifact_type: 'table',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([
          'What are the top IT programs by budget?',
          'Rank the largest IT initiatives',
          'Which portfolio companies have the highest IT spend?',
        ]),
        active: true,
      },
      {
        contract_key: 'tower_value_realization',
        surface: 'tower',
        intent: 'diagnose',
        question_family: 'value_realization',
        measure_key: null,
        default_scope: 'enterprise_envelope',
        dimensions: JSON.stringify([]),
        filters_schema: JSON.stringify({}),
        required_fields: JSON.stringify([]),
        artifact_type: 'text',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([
          'Where is value being realized?',
          'What is the measured value from AI investments?',
          'Show value realization status',
        ]),
        active: true,
      },
      {
        contract_key: 'tower_trend_it_budget',
        surface: 'tower',
        intent: 'chart',
        question_family: 'it_budget_trend',
        measure_key: 'total_it_budget_fy26',
        default_scope: 'enterprise_envelope',
        dimensions: JSON.stringify(['period']),
        filters_schema: JSON.stringify({}),
        required_fields: JSON.stringify(['period', 'value_numeric']),
        artifact_type: 'chart',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([
          'Show IT budget trend',
          'How has IT spend changed year over year?',
          'FY25 vs FY26 IT budget',
        ]),
        active: true,
      },
      {
        contract_key: 'tower_outside_scope',
        surface: 'tower',
        intent: 'outside_scope',
        question_family: 'outside_tower_scope',
        measure_key: null,
        default_scope: 'enterprise_envelope',
        dimensions: JSON.stringify([]),
        filters_schema: JSON.stringify({}),
        required_fields: JSON.stringify([]),
        artifact_type: 'handoff',
        outside_scope_rule: 'refuse_and_offer_tower_scope',
        prompt_policy_key: 'cio_tower_visible_answer_v1',
        visible_answer_contract: 'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
        examples: JSON.stringify([]),
        active: true,
      },
    ];
    await upsertBatch(client, 'cio_tower.question_contracts', contracts, ['contract_key']);
    console.log(`✓ question_contracts (${contracts.length})`);

    // ── 4. entities ──────────────────────────────────────────────────────────
    const holdcoEntityKey = `${TENANT_KEY}::holding_company::lakeshore-holdings`;
    const entities: DbRow[] = [
      {
        entity_key: holdcoEntityKey,
        tenant_key: TENANT_KEY,
        entity_type: 'holding_company',
        display_name: 'Lakeshore Holdings',
        parent_entity_key: null,
        source_key: SOURCE_KEY,
        source_row: 'enterprise_profile',
        attributes: JSON.stringify({
          portfolio_revenue_usd: 7120000000,
          portfolio_companies: 5,
          total_direct_it_budget_usd: grandTotal,
        }),
      },
      ...rows.map((row) => ({
        entity_key: entityKey(row),
        tenant_key: TENANT_KEY,
        entity_type: isOpCo(row) ? 'portfolio_company' : 'org_unit',
        display_name: row.budget_area,
        parent_entity_key: holdcoEntityKey,
        source_key: SOURCE_KEY,
        source_row: row.budget_id,
        attributes: JSON.stringify({
          owner_role: row.owner_role,
          budget_pressure: row.budget_pressure,
          labor_pct: parseInt(row.labor_pct, 10),
          vendor_pct: parseInt(row.vendor_pct, 10),
          cloud_or_infra_pct: parseInt(row.cloud_or_infra_pct, 10),
        }),
      })),
    ];
    await upsertBatch(client, 'cio_tower.entities', entities, ['entity_key']);
    console.log(`✓ entities (${entities.length}: 1 holdco + ${opcoRows.length} OpCo + ${corpRows.length} corporate)`);

    // ── 5. facts ─────────────────────────────────────────────────────────────
    const facts: DbRow[] = [];

    for (const row of rows) {
      const scope = isOpCo(row) ? 'portfolio_company' : 'shared_services';
      const eKey = entityKey(row);
      const eType = isOpCo(row) ? 'portfolio_company' : 'org_unit';

      facts.push({
        fact_key: factKey(row.budget_id, 'run'),
        tenant_key: TENANT_KEY,
        entity_key: eKey,
        entity_type: eType,
        measure: 'run_budget_fy26',
        scope,
        view: 'it_budget',
        amount_type: 'run',
        basis: BASIS,
        period: PERIOD,
        value_numeric: num(row.run_budget_usd),
        unit: 'usd',
        value_source: 'synthetic',
        confidence: 'high',
        source_key: SOURCE_KEY,
        source_row: row.budget_id,
        attributes: JSON.stringify({ budget_area: row.budget_area }),
      });

      facts.push({
        fact_key: factKey(row.budget_id, 'change'),
        tenant_key: TENANT_KEY,
        entity_key: eKey,
        entity_type: eType,
        measure: 'change_budget_fy26',
        scope,
        view: 'it_budget',
        amount_type: 'change',
        basis: BASIS,
        period: PERIOD,
        value_numeric: num(row.change_budget_usd),
        unit: 'usd',
        value_source: 'synthetic',
        confidence: 'high',
        source_key: SOURCE_KEY,
        source_row: row.budget_id,
        attributes: JSON.stringify({ budget_area: row.budget_area }),
      });
    }

    // Enterprise-envelope rollup facts
    const rollups: DbRow[] = [
      {
        fact_key: `${TENANT_KEY}::it_budget::opco-total::run::fy26`,
        tenant_key: TENANT_KEY,
        entity_key: holdcoEntityKey,
        entity_type: 'holding_company',
        measure: 'run_budget_fy26',
        scope: 'enterprise_envelope',
        view: 'it_budget',
        amount_type: 'run',
        basis: BASIS,
        period: PERIOD,
        value_numeric: opcoRun,
        unit: 'usd',
        value_source: 'derived',
        confidence: 'high',
        source_key: SOURCE_KEY,
        source_row: 'LAK-PC-001..LAK-PC-005',
        is_rollup_of: 'LAK-PC-001,LAK-PC-002,LAK-PC-003,LAK-PC-004,LAK-PC-005',
        attributes: JSON.stringify({ rollup_type: 'opco_run_total', opco_count: opcoRows.length }),
      },
      {
        fact_key: `${TENANT_KEY}::it_budget::corporate-total::run::fy26`,
        tenant_key: TENANT_KEY,
        entity_key: holdcoEntityKey,
        entity_type: 'holding_company',
        measure: 'run_budget_fy26',
        scope: 'enterprise_envelope',
        view: 'it_budget',
        amount_type: 'run',
        basis: BASIS,
        period: PERIOD,
        value_numeric: corpRun,
        unit: 'usd',
        value_source: 'derived',
        confidence: 'high',
        source_key: SOURCE_KEY,
        source_row: 'LAK-CS-001..LAK-CS-008',
        is_rollup_of: 'LAK-CS-001,LAK-CS-002,LAK-CS-003,LAK-CS-004,LAK-CS-005,LAK-CS-006,LAK-CS-007,LAK-CS-008',
        attributes: JSON.stringify({ rollup_type: 'corporate_run_total', corporate_count: corpRows.length }),
      },
      {
        fact_key: `${TENANT_KEY}::it_budget::grand-total::fy26`,
        tenant_key: TENANT_KEY,
        entity_key: holdcoEntityKey,
        entity_type: 'holding_company',
        measure: 'total_it_budget_fy26',
        scope: 'enterprise_envelope',
        view: 'it_budget',
        amount_type: 'none',
        basis: BASIS,
        period: PERIOD,
        value_numeric: grandTotal,
        unit: 'usd',
        value_source: 'derived',
        confidence: 'high',
        source_key: SOURCE_KEY,
        source_row: 'F12-all-rows',
        is_rollup_of: rows.map((r) => r.budget_id).join(','),
        component_of: null,
        attributes: JSON.stringify({
          rollup_type: 'grand_total',
          opco_it_usd: opcoRun + opcoChange,
          corporate_it_usd: corpRun + corpChange,
          run_total_usd: grandRun,
          change_total_usd: grandChange,
        }),
      },
    ];

    const allFacts = [...facts, ...rollups];
    await upsertBatch(client, 'cio_tower.facts', allFacts, ['fact_key']);
    console.log(`✓ facts (${facts.length} line-item + ${rollups.length} rollup = ${allFacts.length} total)`);

    // ── 6. measure_results ───────────────────────────────────────────────────
    const allFactKeys = allFacts.map((f) => f.fact_key as string);
    const opcoFactKeys = rows.filter(isOpCo).flatMap((r) => [factKey(r.budget_id, 'run'), factKey(r.budget_id, 'change')]);
    const corpFactKeys = rows.filter((r) => !isOpCo(r)).flatMap((r) => [factKey(r.budget_id, 'run'), factKey(r.budget_id, 'change')]);

    const measureResults: DbRow[] = [
      // Grand-total run
      {
        result_key: `${TENANT_KEY}::run_budget_fy26::enterprise_envelope::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'run_budget_fy26',
        scope: 'enterprise_envelope',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({}),
        value_numeric: grandRun,
        value_json: JSON.stringify({ opco_run: opcoRun, corporate_run: corpRun }),
        source_fact_keys: rows.map((r) => factKey(r.budget_id, 'run')),
        formula_version: 'cio_tower_v1',
      },
      // OpCo run
      {
        result_key: `${TENANT_KEY}::run_budget_fy26::portfolio_company::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'run_budget_fy26',
        scope: 'portfolio_company',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({}),
        value_numeric: opcoRun,
        value_json: JSON.stringify(Object.fromEntries(opcoRows.map((r) => [r.budget_id, num(r.run_budget_usd)]))),
        source_fact_keys: opcoRows.map((r) => factKey(r.budget_id, 'run')),
        formula_version: 'cio_tower_v1',
      },
      // Corporate run
      {
        result_key: `${TENANT_KEY}::run_budget_fy26::shared_services::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'run_budget_fy26',
        scope: 'shared_services',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({}),
        value_numeric: corpRun,
        value_json: JSON.stringify(Object.fromEntries(corpRows.map((r) => [r.budget_id, num(r.run_budget_usd)]))),
        source_fact_keys: corpRows.map((r) => factKey(r.budget_id, 'run')),
        formula_version: 'cio_tower_v1',
      },
      // Grand-total change
      {
        result_key: `${TENANT_KEY}::change_budget_fy26::enterprise_envelope::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'change_budget_fy26',
        scope: 'enterprise_envelope',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({}),
        value_numeric: grandChange,
        value_json: JSON.stringify({ opco_change: opcoChange, corporate_change: corpChange }),
        source_fact_keys: rows.map((r) => factKey(r.budget_id, 'change')),
        formula_version: 'cio_tower_v1',
      },
      // Grand total (run+change)
      {
        result_key: `${TENANT_KEY}::total_it_budget_fy26::enterprise_envelope::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'total_it_budget_fy26',
        scope: 'enterprise_envelope',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({}),
        value_numeric: grandTotal,
        value_json: JSON.stringify({
          opco_total: opcoRun + opcoChange,
          corporate_total: corpRun + corpChange,
          run_total: grandRun,
          change_total: grandChange,
          opco_run: opcoRun,
          opco_change: opcoChange,
          corp_run: corpRun,
          corp_change: corpChange,
        }),
        source_fact_keys: allFactKeys,
        formula_version: 'cio_tower_v1',
      },
      // AI / Innovation
      {
        result_key: `${TENANT_KEY}::ai_innovation_budget_fy26::shared_services::${PERIOD}::${BASIS}`,
        tenant_key: TENANT_KEY,
        measure_key: 'ai_innovation_budget_fy26',
        scope: 'shared_services',
        period: PERIOD,
        basis: BASIS,
        dimensions: JSON.stringify({ budget_area: 'LAK-CS-008' }),
        value_numeric: aiTotal,
        value_json: JSON.stringify({
          budget_id: 'LAK-CS-008',
          budget_area: 'Corporate · AI and Innovation Office',
          run: aiRow ? num(aiRow.run_budget_usd) : 0,
          change: aiRow ? num(aiRow.change_budget_usd) : 0,
        }),
        source_fact_keys: [
          factKey('LAK-CS-008', 'run'),
          factKey('LAK-CS-008', 'change'),
        ],
        formula_version: 'cio_tower_v1',
      },
    ];
    await upsertBatch(client, 'cio_tower.measure_results', measureResults, [
      'tenant_key',
      'measure_key',
      'scope',
      'period',
      'basis',
      'dimensions',
    ]);
    console.log(`✓ measure_results (${measureResults.length})`);

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n── Receipt ────────────────────────────────────────────────');
    console.log(`  tenant:          ${TENANT_KEY}`);
    console.log(`  period:          ${PERIOD}`);
    console.log(`  total IT budget: $${(grandTotal / 1e6).toFixed(1)}M`);
    console.log(`    OpCo IT:       $${((opcoRun + opcoChange) / 1e6).toFixed(1)}M (${opcoRows.length} portfolio companies)`);
    console.log(`    Corporate IT:  $${((corpRun + corpChange) / 1e6).toFixed(1)}M (${corpRows.length} shared-service functions)`);
    console.log(`    AI/Innovation: $${(aiTotal / 1e6).toFixed(1)}M (LAK-CS-008)`);
    console.log(`  facts written:   ${allFacts.length}`);
    console.log(`  entities:        ${entities.length}`);
    console.log('────────────────────────────────────────────────────────────');
    console.log('\n✓ cio_tower Lakeshore IT budget load complete');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
