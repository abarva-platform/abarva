import type { IndustryAIPatternDraft } from '@/lib/intelligence/canonical/industry-ai-pattern';

import {
  CANONICAL_BACKFILL_SCHEMA_VERSION,
  CANONICAL_COLLISION_RESOLUTION_RULES,
  buildPreviewRow,
  contentHash,
  resolveCanonicalPreviewCollisions,
  sanitizeLegacyClientNames,
  stableJson,
} from './preview-canonical-corpus-backfill';

const baseDraft: IndustryAIPatternDraft = {
  canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING',
  title: 'Contact Center AI Routing',
  summary: 'Route customer contacts using intent, value, and service context.',
  source_crosswalk: [{
    source_system: 'pattern_seed',
    source_id: 'PAT-CCAI-001',
    relationship: 'primary',
  }],
  source_systems: ['pattern_seed'],
  source_ids: ['PAT-CCAI-001'],
  industry: ['retail'],
  enterprise_area: 'front_office',
  function: 'contact_center',
  process_area: 'service_routing_and_resolution',
  use_case_category: 'agentic_workflow',
  strategic_move_phases: ['design'],
  confidence_level: 'high',
  source_basis: 'internal_pattern',
  confidence_rationale: 'Seeded from reviewed internal pattern.',
  primary_kpis: ['containment_rate', 'aht', 'csat'],
  required_data_domains: ['interaction_history', 'customer_profile', 'agent_skills'],
  source_references: [],
  quantitative_claims: [],
  unsupported_claim_flags: [],
  missing_required_fields: ['why_now'],
  missing_provenance: false,
};
const legacyRetailClientName = ['Ast', 'erline'].join('');

describe('preview canonical corpus backfill helpers', () => {
  it('stableJson produces deterministic hashes independent of object key order', () => {
    const left = { b: 2, a: { d: 4, c: 3 } };
    const right = { a: { c: 3, d: 4 }, b: 2 };

    expect(stableJson(left)).toBe(stableJson(right));
    expect(contentHash(left)).toBe(contentHash(right));
    expect(contentHash(left)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('buildPreviewRow creates a dry-run payload without inventing KPIs', () => {
    const row = buildPreviewRow(baseDraft, '2026-05-09T00:00:00.000Z');

    expect(row.action).toBe('dry_run_upsert_preview');
    expect(row.target_table).toBe('canonical_industry_ai_patterns');
    expect(row.upsert_payload.schema_version).toBe(CANONICAL_BACKFILL_SCHEMA_VERSION);
    expect(row.upsert_payload.primary_kpis).toEqual(['containment_rate', 'aht', 'csat']);
    expect(row.upsert_payload.secondary_kpis).toEqual([]);
    expect(row.upsert_payload.content_hash).toBe(row.content_hash);
    expect(row.missing_required_fields).toContain('why_now');
    expect(row.missing_provenance).toBe(false);
  });

  it('attaches duplicate risk from crosswalk inventory when available', () => {
    const row = buildPreviewRow(
      baseDraft,
      '2026-05-09T00:00:00.000Z',
      new Map([[
        'pattern_seed:PAT-CCAI-001',
        {
          source_system: 'pattern_seed',
          source_id: 'PAT-CCAI-001',
          duplicate_risk: 'high',
          likely_duplicate_ids: ['genome_patterns:GP-CCAI-001'],
        },
      ]]),
    );

    expect(row.duplicate_risk).toBe('high');
    expect(row.likely_duplicate_ids).toEqual(['genome_patterns:GP-CCAI-001']);
    expect(row.upsert_payload.duplicate_risk).toBe('high');
  });

  it('preserves missing provenance and unsupported quantitative claims', () => {
    const row = buildPreviewRow(
      {
        ...baseDraft,
        source_basis: undefined,
        confidence_rationale: undefined,
        missing_provenance: true,
        unsupported_claim_flags: [{
          claim: '20% savings',
          reason: 'No source reference',
          recommended_action: 'source_required',
        }],
      },
      '2026-05-09T00:00:00.000Z',
    );

    expect(row.source_basis).toBe('missing');
    expect(row.upsert_payload.source_basis).toBe('unknown');
    expect(row.missing_provenance).toBe(true);
    expect(row.unsupported_claim_count).toBe(1);
  });

  it('sanitizes legacy retail client naming in preview payloads', () => {
    const row = buildPreviewRow(
      {
        ...baseDraft,
        summary: `${legacyRetailClientName} evidence should be reviewed with the ${legacyRetailClientName} Retail steering team.`,
        business_problem: `${legacyRetailClientName}-specific service fragmentation is blocking personalization.`,
      },
      '2026-05-09T00:00:00.000Z',
    );

    expect(row.upsert_payload.summary).toContain('Apex Retail evidence');
    expect(row.upsert_payload.summary).not.toContain(legacyRetailClientName);
    expect(row.upsert_payload.business_problem).toContain('Apex Retail-specific');
  });

  it('sanitizes legacy retail client naming recursively', () => {
    const sanitized = sanitizeLegacyClientNames({
      email: `maria.delgado@${legacyRetailClientName.toLowerCase()}-retail.example`,
      nested: [
        `${legacyRetailClientName.toLowerCase()} retail group`,
        { label: `${legacyRetailClientName} Retail` },
      ],
    });

    expect(sanitized).toEqual({
      email: 'maria.delgado@apex-retail.example.com',
      nested: ['Apex Retail Group', { label: 'Apex Retail' }],
    });
  });

  it('resolves reviewed canonical id collisions without dropping source crosswalks', () => {
    const seedRow = buildPreviewRow({
      ...baseDraft,
      canonical_id: 'AIP-RETAIL-DEMAND_FORECASTING_INVENTORY_AI',
      source_crosswalk: [{
        source_system: 'pattern_seed',
        source_id: 'PAT-IND-RET-002',
        relationship: 'primary',
      }],
      source_systems: ['pattern_seed'],
      source_ids: ['PAT-IND-RET-002'],
      missing_provenance: true,
      missing_required_fields: ['confidence_rationale'],
    }, '2026-05-09T00:00:00.000Z');
    const manifestRow = buildPreviewRow({
      ...baseDraft,
      canonical_id: 'AIP-RETAIL-DEMAND_FORECASTING_INVENTORY_AI',
      source_crosswalk: [{
        source_system: 'generated_pattern_manifest',
        source_id: 'pattern_demand_forecasting_inventory_ai',
        relationship: 'primary',
      }],
      source_systems: ['generated_pattern_manifest'],
      source_ids: ['pattern_demand_forecasting_inventory_ai'],
      missing_provenance: false,
      missing_required_fields: [],
    }, '2026-05-09T00:00:00.000Z');

    const resolved = resolveCanonicalPreviewCollisions([seedRow, manifestRow]);

    expect(CANONICAL_COLLISION_RESOLUTION_RULES).toHaveLength(11);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].source_systems).toEqual(['generated_pattern_manifest', 'pattern_seed']);
    expect(resolved[0].source_ids).toEqual(['PAT-IND-RET-002', 'pattern_demand_forecasting_inventory_ai']);
    expect(resolved[0].missing_required_fields).toEqual(['confidence_rationale']);
    expect(resolved[0].missing_provenance).toBe(true);
    expect(resolved[0].upsert_payload.full_pattern).toMatchObject({
      collision_resolution: {
        preferred_source_key: 'generated_pattern_manifest:pattern_demand_forecasting_inventory_ai',
      },
    });
  });
});
