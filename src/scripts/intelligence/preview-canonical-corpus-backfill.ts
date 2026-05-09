import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';
import { config as loadDotenv } from 'dotenv';

import {
  fromGenomePatternRow,
  fromManifestEntry,
  fromPatternPackRow,
  fromPatternSeed,
  type GenomePatternRow,
  type PatternPackRow,
} from '@/lib/intelligence/canonical/build-canonical-pattern';
import type {
  CanonicalConfidenceLevel,
  CanonicalEnterpriseArea,
  CanonicalLifecycleStatus,
  CanonicalMaturityLevel,
  CanonicalSourceBasis,
  IndustryAIPattern,
  IndustryAIPatternDraft,
} from '@/lib/intelligence/canonical/industry-ai-pattern';
import { CANONICAL_INDUSTRY_AI_PATTERNS_TABLE } from '@/lib/intelligence/canonical/persistence-contract';
import { loadCorpus } from '@/lib/intelligence/loader';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import { DELIVERABLE_REGISTRY } from '@/lib/programs/deliverable-registry';
import { PACKS_V2 } from '@/lib/programs/phase-packs/v2';

export const CANONICAL_BACKFILL_SCHEMA_VERSION = '2026-05-09';
export const BACKFILL_PREVIEW_JSON = 'docs/knowledge-corpus/generated/canonical-corpus-backfill-preview.json';
export const BACKFILL_PREVIEW_MD = 'docs/knowledge-corpus/CANONICAL_CORPUS_BACKFILL_PREVIEW_2026-05-09.md';
const CROSSWALK_INVENTORY_JSON = 'docs/knowledge-corpus/generated/pattern-crosswalk-inventory.json';

type SourceSystem =
  | 'pattern_seed'
  | 'generated_pattern_manifest'
  | 'pattern_packs'
  | 'genome_patterns'
  | 'phase_packs'
  | 'deliverable_registry'
  | 'knowledge_source_doc';

type IncludedSourceSystem = Extract<
  SourceSystem,
  'pattern_seed' | 'generated_pattern_manifest' | 'pattern_packs' | 'genome_patterns'
>;

type SourceStatus = 'included' | 'skipped';
type DuplicateRisk = 'low' | 'medium' | 'high';

interface CollisionResolutionRule {
  canonical_id: string;
  preferred_source_key: string;
  merge_note: string;
}

interface SourceCount {
  source_system: SourceSystem;
  count: number;
  status: SourceStatus;
  note?: string;
}

interface CrosswalkInventoryEntry {
  source_system: SourceSystem;
  source_id: string;
  duplicate_risk?: DuplicateRisk;
  likely_duplicate_ids?: string[];
  recommended_action?: string;
}

interface CrosswalkInventoryReport {
  entries?: CrosswalkInventoryEntry[];
}

export interface CanonicalBackfillPreviewRow {
  canonical_id: string;
  title: string;
  source_systems: string[];
  source_ids: string[];
  target_table: typeof CANONICAL_INDUSTRY_AI_PATTERNS_TABLE;
  action: 'dry_run_upsert_preview';
  content_hash: string;
  duplicate_risk: DuplicateRisk | null;
  likely_duplicate_ids: string[];
  missing_required_fields: string[];
  missing_provenance: boolean;
  unsupported_claim_count: number;
  source_basis: CanonicalSourceBasis | 'missing';
  confidence_level: CanonicalConfidenceLevel;
  upsert_payload: Record<string, unknown>;
}

export interface CanonicalBackfillPreviewReport {
  generated_at: string;
  dry_run: true;
  target_table: typeof CANONICAL_INDUSTRY_AI_PATTERNS_TABLE;
  schema_version: typeof CANONICAL_BACKFILL_SCHEMA_VERSION;
  source_counts: SourceCount[];
  skipped_sources: SourceCount[];
  preview_rows: CanonicalBackfillPreviewRow[];
  summary: {
    total_preview_rows: number;
    rows_missing_provenance: number;
    rows_with_unsupported_claims: number;
    canonical_id_collision_count: number;
    canonical_id_collisions: Array<{ canonical_id: string; source_keys: string[] }>;
    duplicate_risk_summary: Record<DuplicateRisk, number>;
    top_missing_fields: Array<{ field: string; count: number }>;
  };
  db_status: {
    pattern_packs: SourceStatus;
    genome_patterns: SourceStatus;
    note: string;
  };
  write_status: 'not_executed_dry_run_only';
}

export const CANONICAL_COLLISION_RESOLUTION_RULES: CollisionResolutionRule[] = [
  {
    canonical_id: 'AIP-CROSS-INDUSTRY-AI_GOVERNANCE_OPERATING_MODEL',
    preferred_source_key: 'generated_pattern_manifest:pattern_ai_governance_operating_model',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-CROSS-INDUSTRY-AI_LED_PDLC',
    preferred_source_key: 'generated_pattern_manifest:pattern_ai_led_pdlc',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-CROSS-INDUSTRY-AI_USE_CASE_PORTFOLIO_MANAGEMENT',
    preferred_source_key: 'generated_pattern_manifest:pattern_ai_use_case_portfolio',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-CROSS-INDUSTRY-VENDOR_SPRAWL_AI_TOOL_RATIONALIZATION',
    preferred_source_key: 'generated_pattern_manifest:pattern_vendor_sprawl_ai_tool_rationalization',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-ENERGY-PREDICTIVE_MAINTENANCE_MODERNIZATION',
    preferred_source_key: 'generated_pattern_manifest:pattern_predictive_maintenance_modernization',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-FINANCIAL-SERVICES-CUSTOMER_ONBOARDING_KYC_AI',
    preferred_source_key: 'generated_pattern_manifest:pattern_customer_onboarding_kyc_ai',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-FINANCIAL-SERVICES-FRAUD_DETECTION_MODERNIZATION',
    preferred_source_key: 'generated_pattern_manifest:pattern_fraud_detection_modernization',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-HEALTHCARE-AMBIENT_INTELLIGENCE_CLINICAL_VALUE_CHAIN_AUTOMATION',
    preferred_source_key: 'generated_pattern_manifest:pattern_ambient_clinical_value_chain',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-HEALTHCARE-PRIOR_AUTHORIZATION_AUTOMATION',
    preferred_source_key: 'generated_pattern_manifest:pattern_prior_authorization_automation',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-RETAIL-DEMAND_FORECASTING_INVENTORY_AI',
    preferred_source_key: 'generated_pattern_manifest:pattern_demand_forecasting_inventory_ai',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
  {
    canonical_id: 'AIP-RETAIL-OWNED_BRAND_MARGIN_RECOVERY',
    preferred_source_key: 'generated_pattern_manifest:pattern_owned_brand_margin_recovery',
    merge_note: 'Generated manifest carries fuller provenance; pattern seed remains as source crosswalk.',
  },
];

const CANONICAL_COLLISION_RULE_BY_ID = new Map(
  CANONICAL_COLLISION_RESOLUTION_RULES.map((rule) => [rule.canonical_id, rule]),
);

function readOptionalEnvFile(): void {
  const explicitPath = process.env.KNOWLEDGE_BACKFILL_ENV_FILE;
  const defaultPath = path.join(process.cwd(), '.env.local');
  const envPath = explicitPath && explicitPath.trim() ? explicitPath : defaultPath;

  if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath, quiet: true });
  }
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function contentHash(value: unknown): string {
  return `sha256:${crypto.createHash('sha256').update(stableJson(value)).digest('hex')}`;
}

const LEGACY_RETAIL_CLIENT_TOKEN = ['Ast', 'erline'].join('');

function legacyRetailPattern(suffix = ''): RegExp {
  return new RegExp(`\\b${LEGACY_RETAIL_CLIENT_TOKEN}${suffix}\\b`, 'gi');
}

export function replaceLegacyRetailClientName(value: string): string {
  return value
    .replace(new RegExp(`${LEGACY_RETAIL_CLIENT_TOKEN}-retail\\.example`, 'gi'), 'apex-retail.example.com')
    .replace(legacyRetailPattern(' Retail Group'), 'Apex Retail Group')
    .replace(legacyRetailPattern(' Retail'), 'Apex Retail')
    .replace(legacyRetailPattern(), 'Apex Retail');
}

export function sanitizeLegacyClientNames<T>(value: T): T {
  if (typeof value === 'string') {
    return replaceLegacyRetailClientName(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLegacyClientNames(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeLegacyClientNames(item),
      ]),
    ) as T;
  }

  return value;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  return [];
}

function lifecycleValue(value: unknown): CanonicalLifecycleStatus {
  const candidate = stringValue(value);
  if (candidate === 'reviewed' || candidate === 'validated' || candidate === 'deprecated') return candidate;
  return 'draft';
}

function confidenceValue(value: unknown): CanonicalConfidenceLevel {
  const candidate = stringValue(value);
  if (candidate === 'medium' || candidate === 'high' || candidate === 'validated') return candidate;
  return 'low';
}

function maturityValue(value: unknown): CanonicalMaturityLevel {
  const candidate = stringValue(value);
  if (candidate === 'proven' || candidate === 'scaled' || candidate === 'experimental') return candidate;
  return 'emerging';
}

function enterpriseAreaValue(value: unknown): CanonicalEnterpriseArea {
  const candidate = stringValue(value);
  if (candidate === 'front_office' || candidate === 'middle_office' || candidate === 'back_office') return candidate;
  return 'enterprise_platform';
}

function implementationComplexityValue(value: unknown): IndustryAIPattern['implementation_complexity'] {
  const candidate = stringValue(value);
  if (candidate === 'low' || candidate === 'medium' || candidate === 'high') return candidate;
  return 'unknown';
}

function sourceBasisValue(value: unknown): CanonicalSourceBasis | 'missing' {
  const candidate = stringValue(value);
  if (
    candidate === 'internal_pattern'
    || candidate === 'public_research'
    || candidate === 'inferred_from_patterns'
    || candidate === 'user_seeded'
    || candidate === 'tenant_evidence'
    || candidate === 'synthetic_seed'
    || candidate === 'unknown'
  ) {
    return candidate;
  }

  return 'missing';
}

function indexCrosswalkInventory(): Map<string, CrosswalkInventoryEntry> {
  const inventoryPath = path.join(process.cwd(), CROSSWALK_INVENTORY_JSON);
  if (!fs.existsSync(inventoryPath)) return new Map();

  const report = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')) as CrosswalkInventoryReport;
  const entries = report.entries ?? [];
  return new Map(entries.map((entry) => [`${entry.source_system}:${entry.source_id}`, entry]));
}

export function buildPreviewRow(
  draft: IndustryAIPatternDraft,
  sourceSnapshotAt: string,
  crosswalkIndex = new Map<string, CrosswalkInventoryEntry>(),
): CanonicalBackfillPreviewRow {
  const primaryCrosswalk = draft.source_crosswalk[0];
  const crosswalkKey = primaryCrosswalk ? `${primaryCrosswalk.source_system}:${primaryCrosswalk.source_id}` : '';
  const inventoryEntry = crosswalkIndex.get(crosswalkKey);
  const confidence_level = confidenceValue(draft.confidence_level);
  const source_basis = sourceBasisValue(draft.source_basis);
  const missing_required_fields = draft.missing_required_fields.map(String).sort();
  const unsupported_claim_count = draft.unsupported_claim_flags?.length ?? 0;

  const payload = sanitizeLegacyClientNames({
    canonical_id: draft.canonical_id,
    title: draft.title,
    summary: stringValue(draft.summary, draft.title),
    source_crosswalk: draft.source_crosswalk,
    source_systems: draft.source_systems,
    source_ids: draft.source_ids,
    version: stringValue(draft.version, '1.0.0'),
    schema_version: CANONICAL_BACKFILL_SCHEMA_VERSION,
    lifecycle_status: lifecycleValue(draft.lifecycle_status),
    owner: stringValue(draft.owner, 'abarva-corpus'),
    last_reviewed_at: draft.last_reviewed_at ?? null,
    visibility_scope: 'global',
    tenant_key: null,
    client_id: null,
    industry: arrayValue(draft.industry),
    enterprise_area: enterpriseAreaValue(draft.enterprise_area),
    function: stringValue(draft.function),
    process_area: stringValue(draft.process_area),
    use_case_category: stringValue(draft.use_case_category),
    strategic_move_phases: arrayValue(draft.strategic_move_phases),
    maturity_level: maturityValue(draft.maturity_level),
    confidence_level,
    executive_question_answered: stringValue(draft.executive_question_answered),
    target_personas: arrayValue(draft.target_personas),
    business_problem: stringValue(draft.business_problem),
    why_now: stringValue(draft.why_now),
    value_hypothesis: stringValue(draft.value_hypothesis),
    primary_kpis: arrayValue(draft.primary_kpis),
    secondary_kpis: arrayValue(draft.secondary_kpis),
    baseline_needed: arrayValue(draft.baseline_needed),
    measurement_method: stringValue(draft.measurement_method),
    value_levers: arrayValue(draft.value_levers),
    time_to_value_band: stringValue(draft.time_to_value_band),
    implementation_complexity: implementationComplexityValue(draft.implementation_complexity),
    required_data_domains: arrayValue(draft.required_data_domains),
    data_quality_dependencies: arrayValue(draft.data_quality_dependencies),
    source_system_dependencies: arrayValue(draft.source_system_dependencies),
    integration_dependencies: arrayValue(draft.integration_dependencies),
    vector_graph_semantic_dependencies: arrayValue(draft.vector_graph_semantic_dependencies),
    agentic_architecture_pattern: stringValue(draft.agentic_architecture_pattern),
    human_agent_workflow_design: stringValue(draft.human_agent_workflow_design),
    autonomous_agent_action_boundaries: arrayValue(draft.autonomous_agent_action_boundaries),
    escalation_points: arrayValue(draft.escalation_points),
    responsible_ai_guardrails: arrayValue(draft.responsible_ai_guardrails),
    operating_model_changes: arrayValue(draft.operating_model_changes),
    change_management_needs: arrayValue(draft.change_management_needs),
    recommended_workshops: arrayValue(draft.recommended_workshops),
    recommended_artifacts: arrayValue(draft.recommended_artifacts),
    entry_criteria: arrayValue(draft.entry_criteria),
    exit_criteria: arrayValue(draft.exit_criteria),
    gate_evidence_required: arrayValue(draft.gate_evidence_required),
    common_failure_modes: arrayValue(draft.common_failure_modes),
    anti_patterns: arrayValue(draft.anti_patterns),
    intervention_options: arrayValue(draft.intervention_options),
    failure_mode_mitigations: arrayValue(draft.failure_mode_mitigations),
    source_basis: source_basis === 'missing' ? 'unknown' : source_basis,
    source_references: draft.source_references ?? [],
    confidence_rationale: stringValue(draft.confidence_rationale),
    quantitative_claims: draft.quantitative_claims ?? [],
    unsupported_claim_flags: draft.unsupported_claim_flags ?? [],
    full_pattern: draft,
    missing_required_fields,
    missing_provenance: draft.missing_provenance,
    duplicate_risk: inventoryEntry?.duplicate_risk ?? null,
    source_snapshot_at: sourceSnapshotAt,
  });
  const hash = contentHash(payload);

  return {
    canonical_id: payload.canonical_id,
    title: payload.title,
    source_systems: payload.source_systems,
    source_ids: payload.source_ids,
    target_table: CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
    action: 'dry_run_upsert_preview',
    content_hash: hash,
    duplicate_risk: inventoryEntry?.duplicate_risk ?? null,
    likely_duplicate_ids: inventoryEntry?.likely_duplicate_ids ?? [],
    missing_required_fields,
    missing_provenance: draft.missing_provenance,
    unsupported_claim_count,
    source_basis,
    confidence_level,
    upsert_payload: {
      ...payload,
      content_hash: hash,
    },
  };
}

async function queryOptionalDb(table: 'pattern_packs' | 'genome_patterns'): Promise<Record<string, unknown>[] | null> {
  if (!process.env.DATABASE_URL) return null;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`select * from ${table}`);
    return result.rows as Record<string, unknown>[];
  } catch (error) {
    console.warn(`Skipped ${table}: ${(error as Error).message}`);
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function countMissingFields(rows: CanonicalBackfillPreviewRow[]): Array<{ field: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const field of row.missing_required_fields) {
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field))
    .slice(0, 20);
}

function countDuplicateRisk(rows: CanonicalBackfillPreviewRow[]): Record<DuplicateRisk, number> {
  return {
    high: rows.filter((row) => row.duplicate_risk === 'high').length,
    medium: rows.filter((row) => row.duplicate_risk === 'medium').length,
    low: rows.filter((row) => row.duplicate_risk === 'low').length,
  };
}

function canonicalIdCollisions(rows: CanonicalBackfillPreviewRow[]): Array<{ canonical_id: string; source_keys: string[] }> {
  const ids = new Map<string, string[]>();
  for (const row of rows) {
    const sourceKeys = row.source_systems.map((source, index) => `${source}:${row.source_ids[index] ?? 'unknown'}`);
    ids.set(row.canonical_id, [...(ids.get(row.canonical_id) ?? []), ...sourceKeys]);
  }

  return [...ids.entries()]
    .filter(([, sourceKeys]) => sourceKeys.length > 1)
    .map(([canonical_id, source_keys]) => ({ canonical_id, source_keys: source_keys.sort() }))
    .sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));
}

function previewSourceKeys(row: CanonicalBackfillPreviewRow): string[] {
  return row.source_systems.map((source, index) => `${source}:${row.source_ids[index] ?? 'unknown'}`);
}

function uniqueStringArray(values: unknown[]): string[] {
  return [...new Set(values.flatMap((value) => (
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  )))].sort();
}

function uniqueObjectArray(values: unknown[]): unknown[] {
  const byStableJson = new Map<string, unknown>();
  for (const collection of values) {
    if (!Array.isArray(collection)) continue;
    for (const value of collection) {
      byStableJson.set(stableJson(value), value);
    }
  }

  return [...byStableJson.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

function mergeResolvedCollisionRows(
  rows: CanonicalBackfillPreviewRow[],
  rule: CollisionResolutionRule,
): CanonicalBackfillPreviewRow {
  const preferred = rows.find((row) => previewSourceKeys(row).includes(rule.preferred_source_key));
  if (!preferred) return rows[0];

  const mergedPayload = {
    ...preferred.upsert_payload,
    source_crosswalk: uniqueObjectArray(rows.map((row) => row.upsert_payload.source_crosswalk)),
    source_systems: uniqueStringArray(rows.map((row) => row.upsert_payload.source_systems)),
    source_ids: uniqueStringArray(rows.map((row) => row.upsert_payload.source_ids)),
    source_references: uniqueObjectArray(rows.map((row) => row.upsert_payload.source_references)),
    quantitative_claims: uniqueObjectArray(rows.map((row) => row.upsert_payload.quantitative_claims)),
    unsupported_claim_flags: uniqueObjectArray(rows.map((row) => row.upsert_payload.unsupported_claim_flags)),
    missing_required_fields: [...new Set(rows.flatMap((row) => row.missing_required_fields))].sort(),
    missing_provenance: rows.some((row) => row.missing_provenance),
    duplicate_risk: rows.some((row) => row.duplicate_risk === 'high')
      ? 'high'
      : rows.some((row) => row.duplicate_risk === 'medium')
        ? 'medium'
        : rows.some((row) => row.duplicate_risk === 'low')
          ? 'low'
          : null,
    full_pattern: {
      selected: preferred.upsert_payload.full_pattern,
      merged_alternatives: rows
        .filter((row) => row !== preferred)
        .map((row) => row.upsert_payload.full_pattern),
      collision_resolution: {
        rule: 'canonical_collision_resolution_2026_05_09',
        preferred_source_key: rule.preferred_source_key,
        merged_source_keys: rows.flatMap(previewSourceKeys).sort(),
        note: rule.merge_note,
      },
    },
  };
  const mergedHash = contentHash(mergedPayload);

  return {
    ...preferred,
    source_systems: mergedPayload.source_systems as string[],
    source_ids: mergedPayload.source_ids as string[],
    content_hash: mergedHash,
    duplicate_risk: mergedPayload.duplicate_risk as DuplicateRisk | null,
    likely_duplicate_ids: [...new Set(rows.flatMap((row) => row.likely_duplicate_ids))].sort(),
    missing_required_fields: mergedPayload.missing_required_fields as string[],
    missing_provenance: mergedPayload.missing_provenance as boolean,
    unsupported_claim_count: (mergedPayload.unsupported_claim_flags as unknown[]).length,
    upsert_payload: {
      ...mergedPayload,
      content_hash: mergedHash,
    },
  };
}

export function resolveCanonicalPreviewCollisions(
  rows: CanonicalBackfillPreviewRow[],
): CanonicalBackfillPreviewRow[] {
  const byCanonicalId = new Map<string, CanonicalBackfillPreviewRow[]>();
  for (const row of rows) {
    byCanonicalId.set(row.canonical_id, [...(byCanonicalId.get(row.canonical_id) ?? []), row]);
  }

  return [...byCanonicalId.entries()]
    .flatMap(([canonicalId, groupRows]) => {
      if (groupRows.length <= 1) return groupRows;
      const rule = CANONICAL_COLLISION_RULE_BY_ID.get(canonicalId);
      return rule ? [mergeResolvedCollisionRows(groupRows, rule)] : groupRows;
    })
    .sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (value: string) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

function renderMarkdown(report: CanonicalBackfillPreviewReport): string {
  const sourceRows = report.source_counts.map((source) => [
    source.source_system,
    String(source.count),
    source.status,
    source.note ?? '',
  ]);
  const missingRows = report.summary.top_missing_fields.map((item) => [item.field, String(item.count)]);
  const collisionRows = report.summary.canonical_id_collisions.slice(0, 40).map((item) => [
    item.canonical_id,
    item.source_keys.join(', '),
  ]);
  const previewRows = report.preview_rows.slice(0, 80).map((row) => [
    row.canonical_id,
    row.title,
    row.source_systems.join(', '),
    String(row.missing_required_fields.length),
    row.missing_provenance ? 'yes' : 'no',
    row.duplicate_risk ?? '',
    row.content_hash,
  ]);

  return `# Canonical Corpus Backfill Preview

Date: 2026-05-09

Generated by: \`src/scripts/intelligence/preview-canonical-corpus-backfill.ts\`

Dry run: \`${report.dry_run}\`

Target table: \`${report.target_table}\`

Write status: \`${report.write_status}\`

This report previews deterministic payloads for the persisted canonical corpus. It does not insert, update, delete, truncate, or mutate database content.

## Source Counts

${markdownTable(['Source system', 'Count', 'Status', 'Note'], sourceRows)}

## Summary

- Preview rows: ${report.summary.total_preview_rows}
- Canonical id collisions: ${report.summary.canonical_id_collision_count}
- Rows missing provenance: ${report.summary.rows_missing_provenance}
- Rows with unsupported quantitative claims: ${report.summary.rows_with_unsupported_claims}
- Duplicate risk high: ${report.summary.duplicate_risk_summary.high}
- Duplicate risk medium: ${report.summary.duplicate_risk_summary.medium}
- Duplicate risk low: ${report.summary.duplicate_risk_summary.low}
- DB status: ${report.db_status.note}

## Top Missing Fields

${missingRows.length > 0 ? markdownTable(['Field', 'Missing row count'], missingRows) : 'No missing fields detected.'}

## Canonical Id Collisions

These rows would collide on the persisted table primary key and must be merged, renamed, or reviewed before any write execution.

${collisionRows.length > 0 ? markdownTable(['Canonical id', 'Source keys'], collisionRows) : 'No canonical id collisions detected.'}

## Preview Rows

First 80 rows are shown here. The complete deterministic payload preview is written to \`${BACKFILL_PREVIEW_JSON}\`.

${markdownTable(['Canonical id', 'Title', 'Sources', 'Missing fields', 'Missing provenance', 'Duplicate risk', 'Content hash'], previewRows)}

## Next Step

Review this preview before any write path is added. PR-A2 intentionally leaves DB application and backfill execution pending.
`;
}

export async function buildCanonicalBackfillPreviewReport(generatedAt: string): Promise<CanonicalBackfillPreviewReport> {
  readOptionalEnvFile();

  const corpus = loadCorpus();
  const drafts: Array<{ source: IncludedSourceSystem; draft: IndustryAIPatternDraft }> = [
    ...corpus.patterns.map((pattern) => ({ source: 'pattern_seed' as const, draft: fromPatternSeed(pattern) })),
    ...getPatternManifestEntries().map((entry) => ({
      source: 'generated_pattern_manifest' as const,
      draft: fromManifestEntry(entry),
    })),
  ];

  const patternPackRows = await queryOptionalDb('pattern_packs');
  const genomePatternRows = await queryOptionalDb('genome_patterns');
  if (patternPackRows) {
    drafts.push(...patternPackRows.map((row) => ({
      source: 'pattern_packs' as const,
      draft: fromPatternPackRow(row as PatternPackRow),
    })));
  }
  if (genomePatternRows) {
    drafts.push(...genomePatternRows.map((row) => ({
      source: 'genome_patterns' as const,
      draft: fromGenomePatternRow(row as GenomePatternRow),
    })));
  }

  const crosswalkIndex = indexCrosswalkInventory();
  const previewRows = resolveCanonicalPreviewCollisions(drafts
    .map(({ draft }) => buildPreviewRow(draft, generatedAt, crosswalkIndex))
    .sort((a, b) => a.canonical_id.localeCompare(b.canonical_id)));
  const collisions = canonicalIdCollisions(previewRows);
  const sourceCount = (source: IncludedSourceSystem): number => drafts.filter((draft) => draft.source === source).length;
  const dbStatus: CanonicalBackfillPreviewReport['db_status'] = {
    pattern_packs: patternPackRows ? 'included' : 'skipped',
    genome_patterns: genomePatternRows ? 'included' : 'skipped',
    note: patternPackRows && genomePatternRows
      ? 'DB credentials were available; pattern_packs and genome_patterns were included read-only.'
      : 'DB credentials were unavailable or query failed; DB-backed pattern rows were skipped.',
  };
  const skippedSources: SourceCount[] = [
    {
      source_system: 'phase_packs',
      count: Object.keys(PACKS_V2).length,
      status: 'skipped',
      note: 'Phase packs are training/workflow guidance, not persisted IndustryAIPattern rows in PR-A2.',
    },
    {
      source_system: 'deliverable_registry',
      count: DELIVERABLE_REGISTRY.length,
      status: 'skipped',
      note: 'Deliverables remain artifact metadata; they will map to patterns after runtime retrieval is in place.',
    },
    {
      source_system: 'knowledge_source_doc',
      count: fs.readdirSync(path.join(process.cwd(), 'docs/knowledge-corpus')).filter((file) => file.endsWith('.md')).length,
      status: 'skipped',
      note: 'Knowledge docs are provenance/design inputs, not direct canonical pattern rows in PR-A2.',
    },
  ];

  return {
    generated_at: generatedAt,
    dry_run: true,
    target_table: CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
    schema_version: CANONICAL_BACKFILL_SCHEMA_VERSION,
    source_counts: [
      { source_system: 'pattern_seed', count: sourceCount('pattern_seed'), status: 'included' },
      { source_system: 'generated_pattern_manifest', count: sourceCount('generated_pattern_manifest'), status: 'included' },
      {
        source_system: 'pattern_packs',
        count: sourceCount('pattern_packs'),
        status: dbStatus.pattern_packs,
        note: dbStatus.pattern_packs === 'skipped' ? dbStatus.note : undefined,
      },
      {
        source_system: 'genome_patterns',
        count: sourceCount('genome_patterns'),
        status: dbStatus.genome_patterns,
        note: dbStatus.genome_patterns === 'skipped' ? dbStatus.note : undefined,
      },
      ...skippedSources,
    ],
    skipped_sources: skippedSources,
    preview_rows: previewRows,
    summary: {
      total_preview_rows: previewRows.length,
      rows_missing_provenance: previewRows.filter((row) => row.missing_provenance).length,
      rows_with_unsupported_claims: previewRows.filter((row) => row.unsupported_claim_count > 0).length,
      canonical_id_collision_count: collisions.length,
      canonical_id_collisions: collisions,
      duplicate_risk_summary: countDuplicateRisk(previewRows),
      top_missing_fields: countMissingFields(previewRows),
    },
    db_status: dbStatus,
    write_status: 'not_executed_dry_run_only',
  };
}

async function main(): Promise<void> {
  const generatedAt = process.env.CANONICAL_BACKFILL_PREVIEW_GENERATED_AT ?? new Date().toISOString();
  const report = await buildCanonicalBackfillPreviewReport(generatedAt);

  fs.mkdirSync(path.dirname(BACKFILL_PREVIEW_JSON), { recursive: true });
  fs.writeFileSync(BACKFILL_PREVIEW_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(BACKFILL_PREVIEW_MD, renderMarkdown(report));

  console.log(`Wrote ${BACKFILL_PREVIEW_JSON}`);
  console.log(`Wrote ${BACKFILL_PREVIEW_MD}`);
  console.log(`Dry-run preview rows: ${report.summary.total_preview_rows}`);
  console.log(`Write status: ${report.write_status}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
