import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Client } from 'pg';
import { config as loadDotenv } from 'dotenv';

import {
  CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS,
  type CanonicalEnterpriseArea,
  type CanonicalIndustry,
  type CanonicalStrategicMovePhase,
} from '@/lib/intelligence/canonical/industry-ai-pattern';
import { loadCorpus } from '@/lib/intelligence/loader';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';
import type { PatternSeed } from '@/lib/intelligence/seed-types';
import { DELIVERABLE_REGISTRY } from '@/lib/programs/deliverable-registry';
import { PACKS_V2 } from '@/lib/programs/phase-packs/v2';

type SourceSystem =
  | 'pattern_seed'
  | 'generated_pattern_manifest'
  | 'pattern_packs'
  | 'genome_patterns'
  | 'phase_packs'
  | 'deliverable_registry'
  | 'knowledge_source_doc';

type DuplicateRisk = 'low' | 'medium' | 'high';
type RecommendedAction = 'keep' | 'normalize' | 'merge' | 'deprecate' | 'enrich';

interface InventoryEntry {
  source_system: SourceSystem;
  source_id: string;
  proposed_canonical_id: string;
  title: string;
  industry: CanonicalIndustry[];
  enterprise_area: CanonicalEnterpriseArea;
  function: string;
  process_area: string;
  use_case_category: string;
  strategic_move_phase_applicability: CanonicalStrategicMovePhase[];
  source_basis: string | null;
  confidence: string | number | null;
  missing_canonical_fields: string[];
  duplicate_risk: DuplicateRisk;
  likely_duplicate_ids: string[];
  recommended_action: RecommendedAction;
}

interface SourceCount {
  source_system: SourceSystem;
  count: number;
  status: 'included' | 'skipped';
  note?: string;
}

interface InventoryReport {
  generated_at: string;
  mode: 'source_code_only' | 'source_code_plus_db';
  source_counts: SourceCount[];
  entries: InventoryEntry[];
  duplicate_risk_summary: Record<DuplicateRisk, number>;
  industry_summary: Record<string, number>;
  db_status: {
    pattern_packs: 'included' | 'skipped';
    genome_patterns: 'included' | 'skipped';
    note: string;
  };
}

const OUTPUT_JSON = 'docs/knowledge-corpus/generated/pattern-crosswalk-inventory.json';
const OUTPUT_INVENTORY_MD = 'docs/knowledge-corpus/PATTERN_CROSSWALK_INVENTORY_2026-05-09.md';
const OUTPUT_DUPLICATE_MD = 'docs/knowledge-corpus/PATTERN_DUPLICATE_RISK_REPORT_2026-05-09.md';

const STRATEGIC_PHASES_BY_NUMBER: Record<number, CanonicalStrategicMovePhase> = {
  0: 'originate',
  1: 'charter',
  2: 'diagnose_discover',
  3: 'design',
  4: 'roadmap_business_case_change_value_plan',
  5: 'mobilize_handoff',
};

function readOptionalEnvFile(): void {
  const explicitPath = process.env.KNOWLEDGE_CROSSWALK_ENV_FILE;
  const defaultPath = path.join(process.cwd(), '.env.local');
  const envPath = explicitPath && explicitPath.trim() ? explicitPath : defaultPath;

  if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath, quiet: true });
  }
}

function normalizeIndustryTokens(value: unknown): CanonicalIndustry[] {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  const normalized = text.toLowerCase().replace(/-/g, '_');
  const industries = new Set<CanonicalIndustry>();

  if (normalized.includes('retail') || normalized.includes('cpg')) industries.add('retail');
  if (normalized.includes('health') || normalized.includes('provider') || normalized.includes('payer')) industries.add('healthcare');
  if (normalized.includes('financial') || normalized.includes('finserv') || /\bfs\b/.test(normalized)) {
    industries.add('financial_services');
  }
  if (normalized.includes('energy')) industries.add('energy');
  if (normalized.includes('public_sector') || normalized.includes('government')) industries.add('public_sector');
  if (normalized.includes('cross') || normalized.includes('enterprise') || normalized.includes('multi')) {
    industries.add('cross_industry');
  }

  return industries.size > 0 ? Array.from(industries) : ['other'];
}

function inferEnterpriseArea(...values: unknown[]): CanonicalEnterpriseArea {
  const text = values.map((value) => String(value ?? '')).join(' ').toLowerCase().replace(/-/g, '_');

  if (/(customer|member|patient|sales|marketing|loyalty|commerce|contact|branch|advisor|onboarding|digital_front)/.test(text)) {
    return 'front_office';
  }

  if (/(operations|merchandising|inventory|supply|fraud|aml|kyc|underwriting|claims|prior|clinical|care|quality|risk|revenue_cycle|store)/.test(text)) {
    return 'middle_office';
  }

  if (/(finance|hr|procurement|legal|vendor|erp|it_|security|governance|analytics|reporting|contracts|close)/.test(text)) {
    return 'back_office';
  }

  return 'enterprise_platform';
}

function inferFunction(...values: unknown[]): string {
  const text = values.map((value) => String(value ?? '')).join(' ').toLowerCase();
  const candidates: Array<[RegExp, string]> = [
    [/contact|service|call center/, 'contact_center'],
    [/loyalty|personalization|next.best|customer/, 'customer_experience'],
    [/merchandising|assortment|pricing|promotion/, 'merchandising'],
    [/inventory|supply|demand|forecast/, 'supply_chain'],
    [/fraud|aml|kyc|financial crimes/, 'risk_compliance'],
    [/prior auth|authorization|claims|payer/, 'payer_operations'],
    [/clinical|ambient|care/, 'clinical_operations'],
    [/finance|close|working capital/, 'finance'],
    [/procurement|sourcing|vendor/, 'procurement'],
    [/architecture|platform|data|semantic|graph|vector/, 'enterprise_platform'],
  ];

  return candidates.find(([pattern]) => pattern.test(text))?.[1] ?? 'unknown';
}

function inferProcessArea(...values: unknown[]): string {
  const text = values.map((value) => String(value ?? '')).join(' ').toLowerCase();
  const candidates: Array<[RegExp, string]> = [
    [/routing|contact|service recovery/, 'service_routing_and_resolution'],
    [/personalization|next.best|segmentation/, 'personalization_and_activation'],
    [/forecast|inventory|replenishment/, 'demand_inventory_planning'],
    [/merchandising|assortment|margin/, 'merchandising_planning'],
    [/fraud|aml|kyc/, 'financial_crime_operations'],
    [/prior auth|authorization/, 'prior_authorization'],
    [/revenue cycle|denial/, 'revenue_cycle_management'],
    [/architecture|integration|data fabric|semantic/, 'data_architecture'],
    [/sourcing|procurement|contract/, 'sourcing_lifecycle'],
  ];

  return candidates.find(([pattern]) => pattern.test(text))?.[1] ?? 'unknown';
}

function inferUseCaseCategory(...values: unknown[]): string {
  const text = values.map((value) => String(value ?? '')).join(' ').toLowerCase();
  if (/agent|copilot|routing|automation/.test(text)) return 'agentic_workflow';
  if (/forecast|prediction|scoring|risk/.test(text)) return 'decision_intelligence';
  if (/architecture|platform|data|semantic|graph|vector/.test(text)) return 'data_ai_platform';
  if (/sourcing|procurement|contract|vendor/.test(text)) return 'sourcing_intelligence';
  if (/governance|compliance|guardrail|policy/.test(text)) return 'governance_risk_compliance';
  return 'unknown';
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function canonicalIdFor(sourceSystem: SourceSystem, sourceId: string, title: string, industries: CanonicalIndustry[]): string {
  const industry = industries.find((item) => item !== 'other') ?? industries[0] ?? 'other';
  return `AIP-${industry.toUpperCase().replace(/_/g, '-')}-${toSlug(title || sourceId).toUpperCase() || toSlug(sourceId).toUpperCase()}`;
}

function missingFields(entry: Partial<InventoryEntry>): string[] {
  const presentFields = new Set<string>([
    'canonical_id',
    'title',
    'source_crosswalk',
    'source_systems',
    'source_ids',
  ]);

  if (entry.title) presentFields.add('summary');
  if (entry.industry?.length) presentFields.add('industry');
  if (entry.enterprise_area) presentFields.add('enterprise_area');
  if (entry.function && entry.function !== 'unknown') presentFields.add('function');
  if (entry.process_area && entry.process_area !== 'unknown') presentFields.add('process_area');
  if (entry.use_case_category && entry.use_case_category !== 'unknown') presentFields.add('use_case_category');
  if (entry.strategic_move_phase_applicability?.length) presentFields.add('strategic_move_phases');
  if (entry.confidence) presentFields.add('confidence_level');
  if (entry.source_basis) presentFields.add('source_basis');

  return CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS
    .map((field) => String(field))
    .filter((field) => !presentFields.has(field));
}

function buildEntry(input: {
  source_system: SourceSystem;
  source_id: string;
  title: string;
  industry: CanonicalIndustry[];
  enterprise_area: CanonicalEnterpriseArea;
  function: string;
  process_area: string;
  use_case_category: string;
  strategic_move_phase_applicability?: CanonicalStrategicMovePhase[];
  source_basis?: string | null;
  confidence?: string | number | null;
}): InventoryEntry {
  const base: InventoryEntry = {
    source_system: input.source_system,
    source_id: input.source_id,
    proposed_canonical_id: canonicalIdFor(input.source_system, input.source_id, input.title, input.industry),
    title: input.title,
    industry: input.industry,
    enterprise_area: input.enterprise_area,
    function: input.function,
    process_area: input.process_area,
    use_case_category: input.use_case_category,
    strategic_move_phase_applicability: input.strategic_move_phase_applicability ?? [],
    source_basis: input.source_basis ?? null,
    confidence: input.confidence ?? null,
    missing_canonical_fields: [],
    duplicate_risk: 'low',
    likely_duplicate_ids: [],
    recommended_action: 'normalize',
  };

  base.missing_canonical_fields = missingFields(base);
  return base;
}

function entriesFromPatternSeeds(patterns: readonly PatternSeed[]): InventoryEntry[] {
  return patterns.map((pattern) => {
    const text = [pattern.title, pattern.domain, pattern.vertical, pattern.thesis, pattern.applicability, pattern.body];
    return buildEntry({
      source_system: 'pattern_seed',
      source_id: pattern.id,
      title: pattern.title,
      industry: normalizeIndustryTokens(pattern.vertical),
      enterprise_area: inferEnterpriseArea(...text),
      function: inferFunction(...text),
      process_area: inferProcessArea(...text),
      use_case_category: inferUseCaseCategory(...text),
      source_basis: null,
      confidence: pattern.confidence,
    });
  });
}

function entriesFromManifest(): InventoryEntry[] {
  return getPatternManifestEntries().map((pattern) => {
    const text = [
      pattern.name,
      pattern.category,
      pattern.shortDescription,
      pattern.longDescription,
      pattern.triggerSymptoms,
      pattern.detectionSignals,
      pattern.interventions,
    ];
    return buildEntry({
      source_system: 'generated_pattern_manifest',
      source_id: pattern.id,
      title: pattern.name,
      industry: pattern.crossIndustry ? ['cross_industry'] : normalizeIndustryTokens(pattern.sectorApplicability),
      enterprise_area: inferEnterpriseArea(...text),
      function: inferFunction(...text),
      process_area: inferProcessArea(...text),
      use_case_category: inferUseCaseCategory(...text),
      source_basis: pattern.sourceFile ? 'internal_pattern' : null,
      confidence: pattern.confidenceFloor,
    });
  });
}

function entriesFromPhasePacks(): InventoryEntry[] {
  return Object.entries(PACKS_V2).map(([phase, pack]) => {
    const phaseNumber = Number(phase);
    return buildEntry({
      source_system: 'phase_packs',
      source_id: String(pack.phase_id),
      title: pack.phase_name,
      industry: ['cross_industry'],
      enterprise_area: 'enterprise_platform',
      function: 'strategic_moves',
      process_area: `phase_${phaseNumber}`,
      use_case_category: 'phase_training',
      strategic_move_phase_applicability: [STRATEGIC_PHASES_BY_NUMBER[phaseNumber]].filter(Boolean),
      source_basis: 'internal_pattern',
      confidence: null,
    });
  });
}

function entriesFromDeliverables(): InventoryEntry[] {
  return DELIVERABLE_REGISTRY.map((deliverable) => {
    const phase = STRATEGIC_PHASES_BY_NUMBER[deliverable.phase];
    return buildEntry({
      source_system: 'deliverable_registry',
      source_id: deliverable.deliverableTypeKey,
      title: deliverable.documentTitle,
      industry: ['cross_industry'],
      enterprise_area: 'enterprise_platform',
      function: 'strategic_moves',
      process_area: `phase_${deliverable.phase}`,
      use_case_category: 'artifact_template',
      strategic_move_phase_applicability: phase ? [phase] : [],
      source_basis: 'internal_pattern',
      confidence: null,
    });
  });
}

function entriesFromKnowledgeDocs(): InventoryEntry[] {
  const docsDir = path.join(process.cwd(), 'docs/knowledge-corpus');
  const generatedReportFiles = new Set([
    path.basename(OUTPUT_INVENTORY_MD),
    path.basename(OUTPUT_DUPLICATE_MD),
    'WAVE_1_EXECUTION_SUMMARY_2026-05-09.md',
  ]);

  return fs.readdirSync(docsDir)
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !generatedReportFiles.has(file))
    .sort()
    .map((file) => {
      const fullPath = path.join(docsDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const heading = content.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, '');
      const text = [file, heading, content.slice(0, 2000)];
      return buildEntry({
        source_system: 'knowledge_source_doc',
        source_id: file,
        title: heading,
        industry: normalizeIndustryTokens(text.join(' ')),
        enterprise_area: inferEnterpriseArea(...text),
        function: inferFunction(...text),
        process_area: inferProcessArea(...text),
        use_case_category: inferUseCaseCategory(...text),
        source_basis: 'internal_pattern',
        confidence: null,
      });
    });
}

function valueFrom(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return fallback;
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

async function entriesFromPatternPacks(): Promise<InventoryEntry[] | null> {
  const rows = await queryOptionalDb('pattern_packs');
  if (!rows) return null;

  return rows.map((row) => {
    const sourceId = valueFrom(row, ['id', 'code', 'pattern_id'], 'pattern_pack_unknown');
    const title = valueFrom(row, ['title', 'name', 'pattern_name', 'category'], sourceId);
    const text = [title, row.category, row.sector_applicability, row.trigger_symptoms, row.detection_signals, row.intervention_options];
    return buildEntry({
      source_system: 'pattern_packs',
      source_id: sourceId,
      title,
      industry: normalizeIndustryTokens(row.sector_applicability ?? row.metadata ?? title),
      enterprise_area: inferEnterpriseArea(...text),
      function: inferFunction(...text),
      process_area: inferProcessArea(...text),
      use_case_category: inferUseCaseCategory(...text),
      source_basis: row.source_id ? 'internal_pattern' : null,
      confidence: valueFrom(row, ['confidence_level'], '') || null,
    });
  });
}

async function entriesFromGenomePatterns(): Promise<InventoryEntry[] | null> {
  const rows = await queryOptionalDb('genome_patterns');
  if (!rows) return null;

  return rows.map((row) => {
    const sourceId = valueFrom(row, ['code', 'id'], 'genome_pattern_unknown');
    const title = valueFrom(row, ['name', 'title'], sourceId);
    const text = [title, row.description, row.summary, row.tags, row.keywords, row.office_category];
    return buildEntry({
      source_system: 'genome_patterns',
      source_id: sourceId,
      title,
      industry: normalizeIndustryTokens(row.industry ?? row.vertical ?? row.tags ?? title),
      enterprise_area: inferEnterpriseArea(row.office_category, ...text),
      function: inferFunction(...text),
      process_area: inferProcessArea(...text),
      use_case_category: inferUseCaseCategory(...text),
      source_basis: null,
      confidence: row.failure_rate_pct ? 'low' : null,
    });
  });
}

function tokenKey(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function applyDuplicateRisk(entries: InventoryEntry[]): InventoryEntry[] {
  const keyed = entries.map((entry) => ({
    entry,
    tokens: tokenKey(`${entry.title} ${entry.function} ${entry.process_area} ${entry.use_case_category}`),
  }));

  for (const item of keyed) {
    const duplicates = keyed
      .filter((candidate) => candidate.entry.source_id !== item.entry.source_id || candidate.entry.source_system !== item.entry.source_system)
      .map((candidate) => ({
        id: `${candidate.entry.source_system}:${candidate.entry.source_id}`,
        score: jaccard(item.tokens, candidate.tokens),
        sameIndustry: candidate.entry.industry.some((industry) => item.entry.industry.includes(industry)),
        sameArea: candidate.entry.enterprise_area === item.entry.enterprise_area,
      }))
      .filter((candidate) => candidate.score >= 0.42 && (candidate.sameIndustry || candidate.sameArea))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    item.entry.likely_duplicate_ids = duplicates.map((candidate) => candidate.id);
    if (duplicates.some((candidate) => candidate.score >= 0.72)) {
      item.entry.duplicate_risk = 'high';
      item.entry.recommended_action = 'merge';
    } else if (duplicates.length > 0) {
      item.entry.duplicate_risk = 'medium';
      item.entry.recommended_action = 'normalize';
    } else if (item.entry.missing_canonical_fields.length > 30) {
      item.entry.duplicate_risk = 'low';
      item.entry.recommended_action = 'enrich';
    } else {
      item.entry.duplicate_risk = 'low';
      item.entry.recommended_action = 'keep';
    }
  }

  return entries;
}

function summarizeCounts(entries: InventoryEntry[], dbStatus: InventoryReport['db_status']): SourceCount[] {
  const sourceSystems: SourceSystem[] = [
    'pattern_seed',
    'generated_pattern_manifest',
    'pattern_packs',
    'genome_patterns',
    'phase_packs',
    'deliverable_registry',
    'knowledge_source_doc',
  ];

  return sourceSystems.map((source_system) => {
    const count = entries.filter((entry) => entry.source_system === source_system).length;
    if (source_system === 'pattern_packs' || source_system === 'genome_patterns') {
      const status = dbStatus[source_system];
      return {
        source_system,
        count,
        status,
        note: status === 'skipped' ? dbStatus.note : undefined,
      };
    }

    return { source_system, count, status: 'included' };
  });
}

function countBy<T extends string>(entries: InventoryEntry[], getter: (entry: InventoryEntry) => T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    for (const key of getter(entry)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function markdownTable(headers: string[], rows: string[][]): string {
  const escape = (value: string) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escape).join(' | ')} |`),
  ].join('\n');
}

function renderInventoryMarkdown(report: InventoryReport): string {
  const countRows = report.source_counts.map((count) => [
    count.source_system,
    String(count.count),
    count.status,
    count.note ?? '',
  ]);

  const entryRows = report.entries.map((entry) => [
    entry.source_system,
    entry.source_id,
    entry.proposed_canonical_id,
    entry.title,
    entry.industry.join(', '),
    entry.enterprise_area,
    entry.function,
    entry.process_area,
    entry.use_case_category,
    entry.strategic_move_phase_applicability.join(', '),
    entry.source_basis ?? '',
    String(entry.confidence ?? ''),
    String(entry.missing_canonical_fields.length),
    entry.duplicate_risk,
    entry.recommended_action,
  ]);

  return `# Pattern Crosswalk Inventory

Date: 2026-05-09

Generated by: \`src/scripts/intelligence/generate-pattern-crosswalk-inventory.ts\`

Mode: \`${report.mode}\`

This is a read-only Wave 1 inventory. It proposes canonical mappings and duplicate-risk flags without mutating source data or database content.

## Source Counts

${markdownTable(['Source system', 'Count', 'Status', 'Note'], countRows)}

## Reconciliation Notes

- TypeScript seed corpus count: ${report.source_counts.find((item) => item.source_system === 'pattern_seed')?.count ?? 0}. Audit target: 186.
- Generated pattern manifest count: ${report.source_counts.find((item) => item.source_system === 'generated_pattern_manifest')?.count ?? 0}. Audit target: 17.
- \`pattern_packs\` count: ${report.source_counts.find((item) => item.source_system === 'pattern_packs')?.count ?? 0}. Audit target if DB is available: 28.
- \`genome_patterns\` count: ${report.source_counts.find((item) => item.source_system === 'genome_patterns')?.count ?? 0}. Audit target if DB is available: 40.
- DB status: ${report.db_status.note}

## Industry Summary

${markdownTable(['Industry', 'Objects'], Object.entries(report.industry_summary).map(([key, value]) => [key, String(value)]))}

## Object Inventory

The complete per-object inventory is also emitted as JSON at \`${OUTPUT_JSON}\`. Missing canonical fields are summarized by count here to keep the markdown readable; the JSON contains the full missing-field list for each object.

${markdownTable(
    [
      'Source',
      'Source id',
      'Proposed canonical id',
      'Title',
      'Industry',
      'Area',
      'Function',
      'Process',
      'Use case category',
      'Phases',
      'Source basis',
      'Confidence',
      'Missing fields',
      'Duplicate risk',
      'Action',
    ],
    entryRows,
  )}
`;
}

function renderDuplicateMarkdown(report: InventoryReport): string {
  const riskRows = Object.entries(report.duplicate_risk_summary).map(([risk, count]) => [risk, String(count)]);
  const highMediumRows = report.entries
    .filter((entry) => entry.duplicate_risk !== 'low')
    .map((entry) => [
      entry.duplicate_risk,
      entry.source_system,
      entry.source_id,
      entry.title,
      entry.industry.join(', '),
      entry.enterprise_area,
      entry.likely_duplicate_ids.join(', '),
      entry.recommended_action,
    ]);

  const industryRows = ['retail', 'healthcare', 'financial_services'].map((industry) => {
    const entries = report.entries.filter((entry) => entry.industry.includes(industry as CanonicalIndustry));
    const high = entries.filter((entry) => entry.duplicate_risk === 'high').length;
    const medium = entries.filter((entry) => entry.duplicate_risk === 'medium').length;
    return [industry, String(entries.length), String(high), String(medium)];
  });

  return `# Pattern Duplicate Risk Report

Date: 2026-05-09

Generated by: \`src/scripts/intelligence/generate-pattern-crosswalk-inventory.ts\`

This report identifies likely duplicate or overlapping pattern-like objects across source-code corpus, generated manifest, optional DB rows, phase packs, deliverables, and knowledge-corpus docs. It does not deprecate or merge anything.

## Risk Summary

${markdownTable(['Duplicate risk', 'Objects'], riskRows)}

## Target Industry Coverage

${markdownTable(['Industry', 'Objects inventoried', 'High risk', 'Medium risk'], industryRows)}

## Medium And High Duplicate Risks

${highMediumRows.length > 0 ? markdownTable(['Risk', 'Source', 'Source id', 'Title', 'Industry', 'Area', 'Likely duplicate ids', 'Action'], highMediumRows) : 'No medium or high duplicate risks detected by the current heuristic.'}

## Recommended Next Actions

1. Treat high-risk rows as merge-review candidates before adding new content.
2. Treat medium-risk rows as normalization candidates; they may be sibling patterns rather than true duplicates.
3. Resolve Retail duplication first because Retail has the most existing overlap across seed corpus, genome patterns, manifest, and docs.
4. Do not bulk-author Healthcare or Financial Services content until the canonical id crosswalk is accepted.
5. Add a human review step before any future deprecation because this heuristic intentionally favors surfacing overlap over silent suppression.
`;
}

async function main(): Promise<void> {
  readOptionalEnvFile();

  const entries: InventoryEntry[] = [];
  const corpus = loadCorpus();
  entries.push(...entriesFromPatternSeeds(corpus.patterns));
  entries.push(...entriesFromManifest());
  entries.push(...entriesFromPhasePacks());
  entries.push(...entriesFromDeliverables());
  entries.push(...entriesFromKnowledgeDocs());

  const patternPackEntries = await entriesFromPatternPacks();
  const genomePatternEntries = await entriesFromGenomePatterns();
  if (patternPackEntries) entries.push(...patternPackEntries);
  if (genomePatternEntries) entries.push(...genomePatternEntries);

  applyDuplicateRisk(entries);

  const dbStatus: InventoryReport['db_status'] = {
    pattern_packs: patternPackEntries ? 'included' : 'skipped',
    genome_patterns: genomePatternEntries ? 'included' : 'skipped',
    note: patternPackEntries && genomePatternEntries
      ? 'DB credentials were available; pattern_packs and genome_patterns were inventoried read-only.'
      : 'DB credentials were unavailable or query failed; DB sections were skipped in source-code-only mode.',
  };

  const report: InventoryReport = {
    generated_at: new Date().toISOString(),
    mode: patternPackEntries || genomePatternEntries ? 'source_code_plus_db' : 'source_code_only',
    source_counts: [],
    entries: entries.sort((a, b) => `${a.source_system}:${a.source_id}`.localeCompare(`${b.source_system}:${b.source_id}`)),
    duplicate_risk_summary: countBy(entries, (entry) => [entry.duplicate_risk]) as Record<DuplicateRisk, number>,
    industry_summary: countBy(entries, (entry) => entry.industry),
    db_status: dbStatus,
  };

  report.source_counts = summarizeCounts(report.entries, dbStatus);

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(OUTPUT_INVENTORY_MD, renderInventoryMarkdown(report));
  fs.writeFileSync(OUTPUT_DUPLICATE_MD, renderDuplicateMarkdown(report));

  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_INVENTORY_MD}`);
  console.log(`Wrote ${OUTPUT_DUPLICATE_MD}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
