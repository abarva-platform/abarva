import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { CanonicalBackfillPreviewReport, CanonicalBackfillPreviewRow } from './preview-canonical-corpus-backfill';
import {
  buildBackfillPlan,
  runBackfill,
} from './backfill-canonical-corpus';

function previewRow(overrides: Record<string, unknown> = {}) {
  const canonicalId = String(overrides.canonical_id ?? 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING');
  const sourceSystem = String(overrides.source_system ?? 'pattern_seed');
  const sourceId = String(overrides.source_id ?? 'PAT-CCAI-001');
  return {
    canonical_id: canonicalId,
    title: String(overrides.title ?? 'Contact Center AI Routing'),
    source_systems: [sourceSystem],
    source_ids: [sourceId],
    target_table: 'canonical_industry_ai_patterns',
    action: 'dry_run_upsert_preview',
    content_hash: String(overrides.content_hash ?? `sha256:${canonicalId.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
    duplicate_risk: overrides.duplicate_risk ?? null,
    likely_duplicate_ids: [],
    missing_required_fields: overrides.missing_required_fields ?? [],
    missing_provenance: overrides.missing_provenance ?? false,
    unsupported_claim_count: 0,
    source_basis: 'internal_pattern',
    confidence_level: 'high',
    upsert_payload: {
      canonical_id: canonicalId,
      title: String(overrides.title ?? 'Contact Center AI Routing'),
      summary: 'Routes contacts using intent, customer value, and agent capacity.',
      source_crosswalk: [{ source_system: sourceSystem, source_id: sourceId, relationship: 'primary' }],
      source_systems: [sourceSystem],
      source_ids: [sourceId],
      version: '1.0.0',
      schema_version: '2026-05-09',
      content_hash: String(overrides.content_hash ?? `sha256:${canonicalId.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
      lifecycle_status: 'draft',
      owner: 'abarva-corpus',
      last_reviewed_at: null,
      visibility_scope: 'global',
      tenant_key: null,
      client_id: null,
      industry: ['retail'],
      enterprise_area: 'front_office',
      function: 'contact_center',
      process_area: 'routing',
      use_case_category: 'agentic_workflow',
      strategic_move_phases: ['design'],
      maturity_level: 'proven',
      confidence_level: 'high',
      executive_question_answered: '',
      target_personas: ['CIO'],
      business_problem: '',
      why_now: '',
      value_hypothesis: '',
      primary_kpis: ['aht', 'csat', 'containment_rate'],
      secondary_kpis: [],
      baseline_needed: [],
      measurement_method: '',
      value_levers: ['experience'],
      time_to_value_band: '',
      implementation_complexity: 'medium',
      required_data_domains: ['interaction_history', 'agent_skills', 'customer_profile'],
      data_quality_dependencies: [],
      source_system_dependencies: [],
      integration_dependencies: [],
      vector_graph_semantic_dependencies: [],
      agentic_architecture_pattern: '',
      human_agent_workflow_design: '',
      autonomous_agent_action_boundaries: [],
      escalation_points: [],
      responsible_ai_guardrails: [],
      operating_model_changes: [],
      change_management_needs: [],
      recommended_workshops: [],
      recommended_artifacts: [],
      entry_criteria: [],
      exit_criteria: [],
      gate_evidence_required: [],
      common_failure_modes: [],
      anti_patterns: [],
      intervention_options: [],
      failure_mode_mitigations: [],
      source_basis: 'internal_pattern',
      source_references: [],
      confidence_rationale: 'Reviewed internal pattern.',
      quantitative_claims: [],
      unsupported_claim_flags: [],
      full_pattern: {},
      missing_required_fields: overrides.missing_required_fields ?? [],
      missing_provenance: overrides.missing_provenance ?? false,
      duplicate_risk: overrides.duplicate_risk ?? null,
      source_snapshot_at: '2026-05-09T00:00:00.000Z',
    },
  };
}

function previewReport(rows = [previewRow()]): CanonicalBackfillPreviewReport {
  return {
    generated_at: '2026-05-09T00:00:00.000Z',
    dry_run: true,
    target_table: 'canonical_industry_ai_patterns',
    schema_version: '2026-05-09',
    source_counts: [],
    skipped_sources: [],
    preview_rows: rows as unknown as CanonicalBackfillPreviewRow[],
    summary: {
      total_preview_rows: rows.length,
      rows_missing_provenance: 0,
      rows_with_unsupported_claims: 0,
      canonical_id_collision_count: 0,
      canonical_id_collisions: [],
      duplicate_risk_summary: { high: 0, medium: 0, low: 0 },
      top_missing_fields: [],
    },
    db_status: {
      pattern_packs: 'skipped',
      genome_patterns: 'skipped',
      note: 'test',
    },
    write_status: 'not_executed_dry_run_only',
  };
}

function writeTempPreview(report: CanonicalBackfillPreviewReport): { dir: string; inputPath: string; reportPath: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'canonical-backfill-'));
  const inputPath = path.join(dir, 'preview.json');
  const reportPath = path.join(dir, 'execution.md');
  fs.writeFileSync(inputPath, JSON.stringify(report, null, 2));
  return { dir, inputPath, reportPath };
}

function fakeSupabase(existing: Array<{ canonical_id: string; content_hash: string | null }> = []) {
  const state = {
    upserted: [] as Array<Record<string, unknown>>,
  };
  const client = {
    from() {
      return {
        select() {
          return {
            in: async () => ({ data: existing, error: null }),
          };
        },
        upsert: async (rows: Array<Record<string, unknown>>) => {
          state.upserted.push(...rows);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  return { client, state };
}

describe('canonical corpus backfill executor', () => {
  it('plans non-colliding rows and blocks duplicate canonical ids from the write set', () => {
    const report = previewReport([
      previewRow({ canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING', source_id: 'PAT-CCAI-001' }),
      previewRow({
        canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING',
        source_system: 'generated_pattern_manifest',
        source_id: 'manifest-contact-center',
      }),
      previewRow({ canonical_id: 'AIP-RETAIL-DEMAND-FORECASTING', source_id: 'PAT-DEMAND-001' }),
    ]);

    const plan = buildBackfillPlan(report, { strict: false });

    expect(plan.collisions).toHaveLength(1);
    expect(plan.collisions[0].canonical_id).toBe('AIP-RETAIL-CONTACT-CENTER-AI-ROUTING');
    expect(plan.rows_to_consider.map((row) => row.canonical_id)).toEqual(['AIP-RETAIL-DEMAND-FORECASTING']);
  });

  it('dry-runs without credentials and writes a report', async () => {
    const { inputPath, reportPath } = writeTempPreview(previewReport());

    const summary = await runBackfill({
      mode: 'dry-run',
      strict: false,
      inputPath,
      reportPath,
      generatedAt: '2026-05-09T00:00:00.000Z',
    }, null);

    expect(summary.db_status).toBe('comparison_skipped_missing_credentials');
    expect(summary.rows_considered).toBe(1);
    expect(summary.rows_written).toBe(0);
    expect(fs.readFileSync(reportPath, 'utf8')).toContain('No database mutation was performed');
  });

  it('compares content hashes when credentials are available', async () => {
    const row = previewRow({ canonical_id: 'AIP-RETAIL-DEMAND-FORECASTING', content_hash: 'sha256:new' });
    const { inputPath, reportPath } = writeTempPreview(previewReport([row]));
    const { client } = fakeSupabase([{ canonical_id: 'AIP-RETAIL-DEMAND-FORECASTING', content_hash: 'sha256:old' }]);

    const summary = await runBackfill({
      mode: 'dry-run',
      strict: false,
      inputPath,
      reportPath,
      generatedAt: '2026-05-09T00:00:00.000Z',
    }, client);

    expect(summary.db_status).toBe('comparison_success');
    expect(summary.rows_would_insert).toBe(0);
    expect(summary.rows_would_update).toBe(1);
    expect(summary.rows_unchanged).toBe(0);
  });

  it('refuses write mode when canonical id collisions exist', async () => {
    const { inputPath, reportPath } = writeTempPreview(previewReport([
      previewRow({ source_id: 'PAT-CCAI-001' }),
      previewRow({ source_system: 'generated_pattern_manifest', source_id: 'manifest-contact-center' }),
    ]));
    const { client, state } = fakeSupabase();

    const summary = await runBackfill({
      mode: 'write',
      strict: false,
      inputPath,
      reportPath,
      generatedAt: '2026-05-09T00:00:00.000Z',
    }, client);

    expect(summary.db_status).toBe('write_blocked');
    expect(summary.db_error).toContain('Canonical-id collisions');
    expect(state.upserted).toHaveLength(0);
  });

  it('writes eligible rows with canonical_id as the upsert key when unblocked', async () => {
    const { inputPath, reportPath } = writeTempPreview(previewReport([
      previewRow({ canonical_id: 'AIP-RETAIL-DEMAND-FORECASTING', content_hash: 'sha256:new' }),
    ]));
    const { client, state } = fakeSupabase();

    const summary = await runBackfill({
      mode: 'write',
      strict: false,
      inputPath,
      reportPath,
      generatedAt: '2026-05-09T00:00:00.000Z',
    }, client);

    expect(summary.db_status).toBe('write_success');
    expect(summary.rows_written).toBe(1);
    expect(state.upserted).toHaveLength(1);
    expect(state.upserted[0].canonical_id).toBe('AIP-RETAIL-DEMAND-FORECASTING');
    expect(state.upserted[0].updated_by).toBe('canonical_corpus_backfill_2026_05_09');
  });

  it('strict mode blocks incomplete rows from write mode', async () => {
    const { inputPath, reportPath } = writeTempPreview(previewReport([
      previewRow({
        canonical_id: 'AIP-RETAIL-INCOMPLETE',
        missing_required_fields: ['agentic_architecture_pattern'],
      }),
    ]));
    const { client, state } = fakeSupabase();

    const summary = await runBackfill({
      mode: 'write',
      strict: true,
      inputPath,
      reportPath,
      generatedAt: '2026-05-09T00:00:00.000Z',
    }, client);

    expect(summary.db_status).toBe('write_blocked');
    expect(summary.db_error).toContain('Strict mode blocked');
    expect(state.upserted).toHaveLength(0);
  });
});
