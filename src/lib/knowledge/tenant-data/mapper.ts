import 'server-only';

/**
 * TD-4 — TenantRecord -> EnterpriseAgentContextItem mapper.
 *
 * Pure transformation from the persisted tenant-data envelope to the
 * broker's existing context-item shape. No DB calls, no side effects,
 * no broker mutation. TD-5 wires this into
 * `agent-context-broker.ts` so the broker becomes a two-source
 * consumer (DB-backed + code-fixture fallback).
 *
 * See `docs/build/TENANT_DATA_INTEGRATION_DESIGN.md` §3.1 for the
 * mapping table that this module implements.
 */

import type {
  EnterpriseAgentContextItem,
  EnterpriseContextItemKind,
  EnterpriseContextSensitivity,
} from '@/lib/knowledge/agent-context-broker';

import type { TenantRecord } from './types';

type Classification = NonNullable<TenantRecord['classification']>;

type ContextItemDataClassification = EnterpriseAgentContextItem['dataClassification'];

const CANONICAL_TENANT_DATA_SOURCE_BASIS = 'tenant_admin_upload';

/**
 * Map a single persisted `TenantRecord` to an `EnterpriseAgentContextItem`.
 *
 * Returns `null` when the (segment_id, record_kind) pair has no mapping
 * defined or when required payload fields are missing — TD-5 filters
 * out unmappable records gracefully.
 */
export function mapTenantRecordToContextItem(
  record: TenantRecord,
): EnterpriseAgentContextItem | null {
  const payload = record.payload ?? {};

  switch (record.segmentId) {
    case 'it_landscape':
      if (record.recordKind === 'systems_inventory') {
        return mapSystem(record, payload);
      }
      return null;
    case 'kpi_dictionary':
      if (record.recordKind === 'kpi_definition' || record.recordKind === 'kpi_dictionary') {
        return mapKpiMetric(record, payload);
      }
      return null;
    case 'program_inventory':
      if (
        record.recordKind === 'program_record' ||
        record.recordKind === 'active_programs'
      ) {
        return mapProgram(record, payload);
      }
      return null;
    case 'evidence_ledger':
      if (
        record.recordKind === 'evidence_claim' ||
        record.recordKind === 'evidence_items'
      ) {
        return mapEvidence(record, payload);
      }
      return null;
    case 'vendor_contracts':
      if (
        record.recordKind === 'vendor_contract' ||
        record.recordKind === 'vendor_scorecards' ||
        record.recordKind === 'contract_clause_inventory'
      ) {
        return mapVendorContract(record, payload);
      }
      return null;
    case 'org_structure':
      if (
        record.recordKind === 'org_role' ||
        record.recordKind === 'executives' ||
        record.recordKind === 'it_leaders'
      ) {
        return mapPerson(record, payload);
      }
      return null;
    case 'cross_program_signals':
      if (
        record.recordKind === 'cross_program_signal' ||
        record.recordKind === 'signals'
      ) {
        return mapCrossProgramSignal(record, payload);
      }
      return null;
    default:
      return null;
  }
}

/**
 * Bulk variant — drops `null`s; returns only mappable items, in input order.
 */
export function mapTenantRecordsToContextItems(
  records: TenantRecord[],
): EnterpriseAgentContextItem[] {
  const items: EnterpriseAgentContextItem[] = [];
  for (const record of records) {
    const item = mapTenantRecordToContextItem(record);
    if (item) {
      items.push(item);
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Per-kind builders
// ---------------------------------------------------------------------------

function mapSystem(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const vendor = readString(payload.vendor);
  const category =
    readString(payload.category) ?? readString(payload.domain);
  const criticality = lowerOrUndefined(
    readString(payload.business_criticality) ?? readString(payload.criticality),
  );
  const renewalDate =
    readString(payload.renewal_date) ?? readString(payload.contract_expiry);
  const ownerId =
    readString(payload.owner_id) ??
    readString(payload.owner_person_id) ??
    readString(payload.it_owner);

  if (!vendor && !category && !criticality && !renewalDate && !ownerId) {
    return null;
  }

  const summary = [
    vendor ?? null,
    category ?? null,
    criticality ? `criticality ${criticality}` : null,
    renewalDate ? `renewal ${renewalDate}` : null,
    ownerId ? `owner ${ownerId}` : null,
  ]
    .filter((piece): piece is string => Boolean(piece))
    .join('; ');

  return buildItem({
    record,
    kind: 'system',
    summary,
    extraProvenanceIds: dedupe([ownerId]),
  });
}

function mapKpiMetric(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const currentValue = readScalar(payload.current_value);
  const targetFy =
    readScalar(payload.target_fy2026) ?? readScalar(payload.target);
  const sourceSystem =
    readString(payload.source_system) ??
    readString(payload.source_system_id);
  const dataOwner =
    readString(payload.data_owner) ??
    readString(payload.data_owner_person_id);
  const confidence = readScalar(payload.confidence);

  if (!currentValue && !targetFy && !sourceSystem && !dataOwner && confidence === undefined) {
    return null;
  }

  const summary = [
    currentValue !== undefined ? `current ${currentValue}` : null,
    targetFy !== undefined ? `target ${targetFy}` : null,
    sourceSystem ? `source ${sourceSystem}` : null,
    dataOwner ? `data owner ${dataOwner}` : null,
    confidence !== undefined ? `confidence ${confidence}` : null,
  ]
    .filter((piece): piece is string => Boolean(piece))
    .join('; ');

  return buildItem({
    record,
    kind: 'kpi_metric',
    summary,
    extraProvenanceIds: dedupe([sourceSystem, dataOwner]),
  });
}

function mapProgram(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const phase =
    readString(payload.current_phase_name) ??
    readString(payload.current_phase) ??
    readString(payload.lifecycle_state);
  const sponsor =
    readString(payload.sponsor) ?? readString(payload.sponsor_id);
  const programLead =
    readString(payload.program_lead) ?? readString(payload.program_lead_id);
  const budgetApproved = readScalar(payload.budget_approved_usd);
  const budgetConsumed = readScalar(payload.budget_consumed_usd);
  const openContradiction =
    readString(payload.open_contradiction) ??
    readString(payload.contradiction);

  if (!phase && !sponsor && !programLead && budgetApproved === undefined) {
    return null;
  }

  const segments: string[] = [];
  if (phase) segments.push(phase);
  if (sponsor) segments.push(`sponsor ${sponsor}`);
  if (programLead) segments.push(`lead ${programLead}`);
  if (budgetApproved !== undefined || budgetConsumed !== undefined) {
    const consumed = budgetConsumed !== undefined ? String(budgetConsumed) : '?';
    const approved = budgetApproved !== undefined ? String(budgetApproved) : '?';
    segments.push(`budget ${consumed}/${approved}`);
  }
  if (openContradiction) {
    segments.push(`OPEN CONTRADICTION: ${openContradiction}`);
  }

  return buildItem({
    record,
    kind: 'program',
    summary: segments.join('; '),
    extraProvenanceIds: dedupe([sponsor, programLead]),
  });
}

function mapEvidence(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const claim = readString(payload.claim) ?? readString(payload.claim_text);
  const sourceDoc = readString(payload.source_doc);
  const confidence = readScalar(payload.confidence);
  const caveat = readString(payload.caveat) ?? readString(payload.caveats);

  if (!claim) {
    return null;
  }

  const trailerParts: string[] = [];
  if (sourceDoc) trailerParts.push(`source: ${sourceDoc}`);
  if (confidence !== undefined) trailerParts.push(`confidence ${confidence}`);
  if (caveat) trailerParts.push(`caveat: ${caveat}`);

  const summary = trailerParts.length
    ? `${claim} (${trailerParts.join(', ')})`
    : claim;

  return buildItem({
    record,
    kind: 'evidence',
    summary,
    extraProvenanceIds: dedupe([sourceDoc]),
  });
}

function mapVendorContract(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const vendorName = readString(payload.vendor_name);
  const product =
    readString(payload.product) ?? readString(payload.category);
  const annualSpend =
    readScalar(payload.annual_spend_usd) ??
    readString(payload.annual_spend_bucket);
  const renewal =
    readString(payload.renewal_or_expiry) ??
    readString(payload.renewal_date) ??
    readString(payload.contract_expiry);
  const riskLevel =
    readString(payload.risk_level) ??
    readString(payload.risk_score) ??
    readScalarString(payload.risk_score);
  const keyRisk =
    readString(payload.key_risk) ?? readString(payload.risk_notes);

  if (!vendorName && !product && !keyRisk) {
    return null;
  }

  const segments: string[] = [];
  if (vendorName && product) {
    segments.push(`${vendorName} — ${product}`);
  } else if (vendorName) {
    segments.push(vendorName);
  } else if (product) {
    segments.push(product);
  }
  if (annualSpend !== undefined) segments.push(`spend ${annualSpend}`);
  if (renewal) segments.push(`renewal ${renewal}`);
  if (riskLevel !== undefined) segments.push(`risk ${riskLevel}`);
  if (keyRisk) segments.push(`key risk: ${keyRisk}`);

  return buildItem({
    record,
    kind: 'vendor_contract',
    summary: segments.join('; '),
    extraProvenanceIds: dedupe([
      readString(payload.vendor_id),
    ]),
  });
}

function mapPerson(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const role =
    readString(payload.role) ??
    readString(payload.title);
  const orgUnit =
    readString(payload.org_unit) ??
    readString(payload.scope) ??
    readString(payload.role_scope);
  const reportsTo =
    readString(payload.reports_to_role) ?? readString(payload.reports_to);
  const priorities = readStringArray(
    payload.priorities ?? payload.stated_priorities_fy2026,
  );
  const decisionRights = readStringArray(payload.decision_rights);

  if (!role && !orgUnit && priorities.length === 0) {
    return null;
  }

  const segments: string[] = [];
  if (role) segments.push(role);
  if (orgUnit) segments.push(`org unit ${orgUnit}`);
  if (reportsTo) segments.push(`reports to ${reportsTo}`);
  if (priorities.length > 0) {
    segments.push(`priorities ${priorities.slice(0, 3).join('; ')}`);
  }
  if (decisionRights.length > 0) {
    segments.push(`decision rights: ${decisionRights[0]}`);
  }

  return buildItem({
    record,
    kind: 'person',
    summary: segments.join('; '),
    extraProvenanceIds: dedupe([reportsTo]),
  });
}

function mapCrossProgramSignal(
  record: TenantRecord,
  payload: Record<string, unknown>,
): EnterpriseAgentContextItem | null {
  const programs = readStringArray(payload.programs);
  const severity = readString(payload.severity);
  const recommendation = readString(payload.recommendation);

  if (programs.length === 0 && !severity && !recommendation) {
    return null;
  }

  const segments: string[] = [];
  if (programs.length > 0) segments.push(`Programs: ${programs.join(', ')}`);
  if (severity) segments.push(`severity ${severity}`);
  if (recommendation) segments.push(recommendation);

  return buildItem({
    record,
    kind: 'cross_program_signal',
    summary: segments.join('; '),
    extraProvenanceIds: dedupe(programs),
  });
}

// ---------------------------------------------------------------------------
// Shared envelope builder
// ---------------------------------------------------------------------------

function buildItem(args: {
  record: TenantRecord;
  kind: EnterpriseContextItemKind;
  summary: string;
  extraProvenanceIds: string[];
}): EnterpriseAgentContextItem {
  const { record, kind, summary, extraProvenanceIds } = args;
  const sourceDoc = readString(record.payload?.source_doc);
  const provenanceIds = dedupe([
    record.recordId,
    sourceDoc,
    ...extraProvenanceIds,
  ]);

  return {
    id: `tenant-data:${record.recordId}`,
    kind,
    title: record.title,
    summary,
    tenantKey: record.tenantKey,
    sourceBasis: record.sourceBasis ?? CANONICAL_TENANT_DATA_SOURCE_BASIS,
    dataClassification: classificationToContextItem(record.classification),
    sensitivity: classificationToSensitivity(record.classification),
    provenanceIds,
    linkedEvidence: [],
  };
}

// ---------------------------------------------------------------------------
// Classification + sensitivity helpers
// ---------------------------------------------------------------------------

const CLASSIFICATION_FIXED: ReadonlyArray<Classification> = [
  'public',
  'internal',
  'confidential',
  'restricted',
];

function normaliseClassification(
  classification: TenantRecord['classification'],
): Classification | undefined {
  if (!classification) return undefined;
  const lower = classification.toLowerCase() as Classification;
  return CLASSIFICATION_FIXED.includes(lower) ? lower : undefined;
}

function classificationToContextItem(
  classification: TenantRecord['classification'],
): ContextItemDataClassification {
  return normaliseClassification(classification) ?? 'internal';
}

function classificationToSensitivity(
  classification: TenantRecord['classification'],
): EnterpriseContextSensitivity {
  const normalised = normaliseClassification(classification);
  if (normalised === 'restricted') return 'l4_raw';
  if (normalised === 'confidential') return 'structured';
  return 'summary';
}

// ---------------------------------------------------------------------------
// Payload field readers
// ---------------------------------------------------------------------------

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readScalar(value: unknown): string | number | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function readScalarString(value: unknown): string | undefined {
  const scalar = readScalar(value);
  return scalar === undefined ? undefined : String(scalar);
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function lowerOrUndefined(value: string | undefined): string | undefined {
  return value === undefined ? undefined : value.toLowerCase();
}

function dedupe(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
