// Admin Loader — mapping proposal (Gate 1: arbitrary parsed content → canonical schema).
//
// Given parsed content (tabular columns/sample, or document text) and the
// preserved original it came from, propose which canonical LoaderDimension the
// content belongs to and how its source columns/sections map to canonical
// fields. The proposal is Claude-backed but the model is INJECTED via the
// MappingModel seam so tests never touch a live model. Document-derived
// proposals are always reviewRequired (facts from PDF/DOCX/etc. never
// auto-commit — see the context-ingestion truth standard in AGENTS.md).

import {
  LOADER_DIMENSIONS,
  type FieldMapping,
  type LoaderDimension,
  type MappingProposal,
  type PreservedSourceFile,
} from '@/lib/context-ingestion/loader/contract';
import { getAuditedAnthropicClient } from '@/lib/agent/stream';

/** Anthropic model used for mapping proposals. */
const MAPPING_MODEL = 'claude-sonnet-4-6';

/** Parsed upload content handed to the mapper. */
export interface ParsedContent {
  kind: 'tabular' | 'document';
  /** Header names for tabular content. */
  columns?: string[];
  /** A few representative rows for tabular content. */
  sampleRows?: Array<Record<string, unknown>>;
  /** Extracted text for document content. */
  text?: string;
}

/**
 * Injectable model seam. `propose` receives the fully-built prompt and returns
 * the model's raw JSON string. Tests pass a stub; production wraps the audited
 * Anthropic client via `auditedMappingModel`.
 */
export interface MappingModel {
  propose(prompt: string): Promise<string>;
}

/** Short, plain-language catalog of canonical fields, grouped by dimension. */
const FIELD_CATALOG: Record<LoaderDimension, string[]> = {
  leadership_org: ['person.name', 'person.title', 'person.reports_to', 'person.function', 'person.email'],
  kpis: ['kpi.name', 'kpi.current_value', 'kpi.target_value', 'kpi.unit', 'kpi.owner'],
  // L2 applications — deep: deployment model, architecture, hosting, lifecycle, compliance.
  applications_systems: [
    'system.name', 'system.vendor', 'system.product', 'system.capability', 'system.owner',
    'system.deployment_model', 'system.architecture', 'system.hosting_ref', 'system.lifecycle',
    'system.compliance_scope', 'system.annual_cost_usd', 'system.users', 'system.criticality', 'system.renewal_date',
  ],
  // L4 data & analytics — distinct classes (warehouse/lake/mart/cube/bi/etl), engine, host.
  data_analytics_stack: [
    'stack.asset_name', 'stack.class', 'stack.engine', 'stack.vendor', 'stack.host_ref',
    'stack.owner', 'stack.data_domains', 'stack.refresh', 'stack.maturity', 'stack.criticality',
  ],
  // L3 integration — pattern taxonomy + middleware + flow.
  integrations: [
    'integration.name', 'integration.source_system', 'integration.target_system', 'integration.pattern',
    'integration.middleware', 'integration.direction', 'integration.frequency', 'integration.data_volume', 'integration.owner',
  ],
  vendors_contracts: ['vendor.name', 'vendor.product', 'vendor.spend_usd', 'contract.type', 'contract.renewal_date', 'vendor.support_tier', 'vendor.baa_status', 'vendor.risk_score'],
  business_units_geographies: ['unit.name', 'unit.geography', 'unit.headcount', 'unit.revenue_usd'],
  initiatives_roadmap: ['initiative.name', 'initiative.phase', 'initiative.sponsor', 'initiative.budget_usd', 'initiative.target_date'],
  risks_controls: ['risk.name', 'risk.severity', 'risk.owner', 'control.name', 'control.status', 'control.compliance_scope'],
  financial_baseline: ['line.name', 'line.amount_usd', 'line.funding_source', 'line.fiscal_year', 'line.category'],
  processes_operating_model: ['process.name', 'process.owner', 'process.function', 'process.maturity'],
  // L5 infrastructure — the layer the model added: compute/virt/storage/network/DC/cloud.
  infrastructure_estate: [
    'infra.asset_name', 'infra.class', 'infra.make_model', 'infra.location', 'infra.capacity',
    'infra.virtualization', 'infra.cloud_account', 'infra.owner',
  ],
  // L1 business capability — the anchor systems hang off.
  business_capability: ['capability.name', 'capability.function', 'capability.value_stream', 'capability.owner'],
  unknown: [],
};

/** Build a flat, prompt-friendly catalog string. */
function formatFieldCatalog(): string {
  return LOADER_DIMENSIONS.map((dim) => `- ${dim}: ${FIELD_CATALOG[dim].join(', ')}`).join('\n');
}

/** Truncate long blobs so the prompt stays bounded. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…[truncated ${value.length - max} chars]`;
}

/** Compose the strict prompt sent to the model. */
export function buildMappingPrompt(args: {
  parsed: ParsedContent;
  source: PreservedSourceFile;
  tenantKey: string;
  targetDimension?: LoaderDimension;
}): string {
  const { parsed, source, tenantKey, targetDimension } = args;

  const contentBlock =
    parsed.kind === 'tabular'
      ? [
          `Content kind: tabular`,
          `Columns: ${JSON.stringify(parsed.columns ?? [])}`,
          `Sample rows: ${truncate(JSON.stringify(parsed.sampleRows ?? [], null, 0), 4000)}`,
        ].join('\n')
      : [`Content kind: document`, `Extracted text: ${truncate(parsed.text ?? '', 6000)}`].join('\n');

  const targetHint = targetDimension
    ? `\nThe operator has suggested the target dimension is "${targetDimension}". Prefer it only if the content genuinely fits; otherwise pick the best dimension and lower dimensionConfidence accordingly.`
    : '';

  return [
    `You map an uploaded file's parsed content to AbarVa's canonical context schema for tenant "${tenantKey}".`,
    `Preserved source file: ${source.filename} (objectKey: ${source.objectKey}).`,
    '',
    `Canonical dimensions and their field catalog:`,
    formatFieldCatalog(),
    `If nothing fits, use dimension "unknown" with low confidence.`,
    targetHint,
    '',
    `Parsed content to classify and map:`,
    contentBlock,
    '',
    `For each source column (tabular) or named section/cell (document), propose the single best canonical field.`,
    `Provide a citation that points into the preserved original (e.g. "column:Title", "row:2", "page:3", "sheet:Org!B2").`,
    `Confidence is a number from 0 to 1.`,
    '',
    `Respond with ONLY a single JSON object, no prose, no code fences, exactly this shape:`,
    `{`,
    `  "dimension": "<one of the canonical dimensions or 'unknown'>",`,
    `  "dimensionConfidence": <number 0..1>,`,
    `  "fieldMappings": [`,
    `    { "sourceColumn": "<source column or section ref>", "canonicalField": "<canonical field>", "confidence": <number 0..1>, "citation": "<pointer into the original>" }`,
    `  ]`,
    `}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

/** Coerce an unknown into a clamped 0..1 confidence number. */
function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Validate a parsed dimension string against the canonical set. */
function coerceDimension(value: unknown): LoaderDimension {
  if (typeof value === 'string' && (LOADER_DIMENSIONS as string[]).includes(value)) {
    return value as LoaderDimension;
  }
  return 'unknown';
}

/** Extract the first balanced JSON object from a possibly-noisy model string. */
function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  // Strip a leading/trailing code fence if present.
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const start = fenceStripped.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < fenceStripped.length; i += 1) {
    const ch = fenceStripped[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return fenceStripped.slice(start, i + 1);
      }
    }
  }
  return null;
}

interface ParsedModelProposal {
  dimension: LoaderDimension;
  dimensionConfidence: number;
  fieldMappings: FieldMapping[];
}

/** Parse + validate the model's JSON. Returns null if unusable. */
function parseModelProposal(raw: string): ParsedModelProposal | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object') return null;
  const record = obj as Record<string, unknown>;

  const rawMappings = Array.isArray(record.fieldMappings) ? record.fieldMappings : [];
  const fieldMappings: FieldMapping[] = rawMappings
    .map((entry): FieldMapping | null => {
      if (!entry || typeof entry !== 'object') return null;
      const m = entry as Record<string, unknown>;
      const sourceColumn = typeof m.sourceColumn === 'string' ? m.sourceColumn : '';
      const canonicalField = typeof m.canonicalField === 'string' ? m.canonicalField : '';
      if (!sourceColumn || !canonicalField) return null;
      const citation = typeof m.citation === 'string' ? m.citation : undefined;
      return {
        sourceColumn,
        canonicalField,
        confidence: clampConfidence(m.confidence),
        ...(citation ? { citation } : {}),
      };
    })
    .filter((m): m is FieldMapping => m !== null);

  return {
    dimension: coerceDimension(record.dimension),
    dimensionConfidence: clampConfidence(record.dimensionConfidence),
    fieldMappings,
  };
}

/**
 * Heuristic header-name dimension hints. Each entry: substring → canonical
 * field. Used by the deterministic fallback when the model output is
 * unparseable. Intentionally conservative and low-confidence.
 */
const HEADER_HINTS: Array<{ test: RegExp; dimension: LoaderDimension; field: string }> = [
  { test: /\b(title|role|position)\b/i, dimension: 'leadership_org', field: 'person.title' },
  { test: /\b(name|full[_\s]?name)\b/i, dimension: 'leadership_org', field: 'person.name' },
  { test: /\b(reports?[_\s]?to|manager)\b/i, dimension: 'leadership_org', field: 'person.reports_to' },
  { test: /\b(email|e-?mail)\b/i, dimension: 'leadership_org', field: 'person.email' },
  { test: /\b(kpi|metric|measure)\b/i, dimension: 'kpis', field: 'kpi.name' },
  { test: /\b(target)\b/i, dimension: 'kpis', field: 'kpi.target_value' },
  { test: /\b(system|application|app|platform)\b/i, dimension: 'applications_systems', field: 'system.name' },
  { test: /\b(vendor|supplier)\b/i, dimension: 'vendors_contracts', field: 'vendor.name' },
  { test: /\b(spend|annual[_\s]?cost|cost)\b/i, dimension: 'vendors_contracts', field: 'vendor.spend_usd' },
  { test: /\b(renewal)\b/i, dimension: 'vendors_contracts', field: 'contract.renewal_date' },
  { test: /\b(risk)\b/i, dimension: 'risks_controls', field: 'risk.name' },
  { test: /\b(initiative|program|project|roadmap)\b/i, dimension: 'initiatives_roadmap', field: 'initiative.name' },
  { test: /\b(budget|capex|opex|amount|usd)\b/i, dimension: 'financial_baseline', field: 'line.amount_usd' },
  { test: /\b(process|workflow)\b/i, dimension: 'processes_operating_model', field: 'process.name' },
  { test: /\b(integration|interface)\b/i, dimension: 'integrations', field: 'integration.source_system' },
  { test: /\b(geography|region|business[_\s]?unit|unit)\b/i, dimension: 'business_units_geographies', field: 'unit.name' },
];

/**
 * Deterministic fallback: simple header-name matching. Returns a low-confidence
 * proposal and never throws. Tabular only produces mappings; document content
 * falls back to "unknown" with no field mappings (a human must map it).
 */
function deterministicFallback(args: {
  parsed: ParsedContent;
  source: PreservedSourceFile;
  targetDimension?: LoaderDimension;
}): ParsedModelProposal {
  const { parsed, targetDimension } = args;
  if (parsed.kind !== 'tabular' || !parsed.columns || parsed.columns.length === 0) {
    return {
      dimension: targetDimension ?? 'unknown',
      dimensionConfidence: 0.1,
      fieldMappings: [],
    };
  }

  const fieldMappings: FieldMapping[] = [];
  const dimensionVotes = new Map<LoaderDimension, number>();

  for (const column of parsed.columns) {
    const hint = HEADER_HINTS.find((h) => h.test.test(column));
    if (!hint) continue;
    fieldMappings.push({
      sourceColumn: column,
      canonicalField: hint.field,
      confidence: 0.3,
      citation: `column:${column}`,
    });
    dimensionVotes.set(hint.dimension, (dimensionVotes.get(hint.dimension) ?? 0) + 1);
  }

  let dimension: LoaderDimension = targetDimension ?? 'unknown';
  let topVotes = 0;
  for (const [dim, votes] of dimensionVotes) {
    if (votes > topVotes) {
      topVotes = votes;
      dimension = dim;
    }
  }

  return {
    dimension,
    // Low confidence: this is header-name guessing, not model reasoning.
    dimensionConfidence: fieldMappings.length > 0 ? 0.3 : 0.1,
    fieldMappings,
  };
}

/**
 * Propose a mapping from arbitrary parsed content to the canonical schema.
 *
 * - Builds a strict JSON-only prompt and calls the injected model.
 * - Parses the model JSON robustly; on unparseable output, falls back to
 *   deterministic header-name matching (low confidence, never throws).
 * - Document-derived content is always `reviewRequired` (never auto-commit).
 */
export async function proposeMapping(args: {
  parsed: ParsedContent;
  source: PreservedSourceFile;
  tenantKey: string;
  targetDimension?: LoaderDimension;
  model: MappingModel;
}): Promise<MappingProposal> {
  const { parsed, source, tenantKey, targetDimension, model } = args;

  const prompt = buildMappingPrompt({ parsed, source, tenantKey, targetDimension });

  let proposal: ParsedModelProposal | null = null;
  try {
    const raw = await model.propose(prompt);
    proposal = parseModelProposal(raw);
  } catch {
    // Model errored — fall through to deterministic fallback.
    proposal = null;
  }

  if (!proposal) {
    proposal = deterministicFallback({ parsed, source, targetDimension });
  }

  return {
    source,
    dimension: proposal.dimension,
    dimensionConfidence: proposal.dimensionConfidence,
    fieldMappings: proposal.fieldMappings,
    ...(parsed.sampleRows ? { sampleRows: parsed.sampleRows } : {}),
    // Document-derived facts never auto-commit — they must enter review.
    reviewRequired: parsed.kind === 'document',
  };
}

/**
 * Production MappingModel backed by the audited Anthropic egress path.
 * Anthropic-only (claude-sonnet-4-6). Each `propose` call is independently
 * audited via `getAuditedAnthropicClient`.
 */
export function auditedMappingModel(args: { tenantId: string; userId?: string }): MappingModel {
  return {
    async propose(prompt: string): Promise<string> {
      const { client } = await getAuditedAnthropicClient({
        tenantId: args.tenantId,
        userId: args.userId,
        workflow: 'admin-loader-mapping-proposal',
        model: MAPPING_MODEL,
        prompt,
        dataClass: 'confidential',
        metadata: { stage: 'mapping-proposal' },
      });

      const message = await client.messages.create({
        model: MAPPING_MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();
    },
  };
}
