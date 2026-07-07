import type { PHSManifestObjectType } from './phs-phase0-manifest';

export type PHSPhase0TemplateId =
  | 'phs-evidence-register'
  | 'phs-uploaded-artifacts'
  | 'phs-workload-inventory'
  | 'phs-rate-card'
  | 'phs-gate-criteria'
  | 'phs-approval-records';

export interface PHSPhase0TemplateDefinition {
  id: PHSPhase0TemplateId;
  objectType: PHSManifestObjectType;
  label: string;
  acceptedFormats: readonly ('csv' | 'xlsx' | 'json')[];
  requiredFields: readonly string[];
  optionalFields: readonly string[];
  ownerRole: string;
  purpose: string;
  stageAdvanceUse: string;
}

export interface PHSPhase0TemplatePreflight {
  template: PHSPhase0TemplateDefinition;
  headers: readonly string[];
  missingRequiredFields: readonly string[];
  unknownColumns: readonly string[];
  valid: boolean;
}

export const PHS_PHASE0_TEMPLATE_DEFINITIONS: readonly PHSPhase0TemplateDefinition[] = [
  {
    id: 'phs-evidence-register',
    objectType: 'evidence_item',
    label: 'PHS evidence register',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'citation_key',
      'title',
      'source_type',
      'owner',
      'evidence_date',
      'sensitivity',
      'confidence',
      'summary',
      'usable_by_surface',
    ],
    optionalFields: ['source_url', 'storage_path', 'source_quote', 'notes'],
    ownerRole: 'Data steward',
    purpose: 'Creates the public, synthetic, corpus, and generated evidence spine for all PHS demo claims.',
    stageAdvanceUse: 'Every material claim in generated artifacts must cite one of these keys.',
  },
  {
    id: 'phs-uploaded-artifacts',
    objectType: 'uploaded_artifact',
    label: 'PHS uploaded artifact registry',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'artifact_id',
      'display_name',
      'artifact_type',
      'phase',
      'owner',
      'storage_path',
      'parse_status',
      'approval_status',
      'sensitivity',
      'source_evidence_ids',
    ],
    optionalFields: ['export_format', 'download_url', 'waiver_reason', 'notes'],
    ownerRole: 'Program steward',
    purpose: 'Proves setup artifacts exist, are parseable, and are linked to evidence before the stage advances.',
    stageAdvanceUse: 'Artifacts must be parsed and approved or named-waived before use in a later phase.',
  },
  {
    id: 'phs-workload-inventory',
    objectType: 'workload_record',
    label: 'PHS workload inventory',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'workload_id',
      'workload_name',
      'domain',
      'current_platform',
      'data_sources',
      'phi_level',
      'owner',
      'business_criticality',
      'modernization_disposition',
      'effort_size',
      'risk',
    ],
    optionalFields: ['current_cost_usd', 'report_count', 'pipeline_count', 'notes'],
    ownerRole: 'CIO delegate',
    purpose: 'Prevents Databricks architecture and migration claims from floating above real workload inventory.',
    stageAdvanceUse: 'Architecture and value artifacts can use Databricks patterns only where inventory rows support them.',
  },
  {
    id: 'phs-rate-card',
    objectType: 'rate_card_row',
    label: 'PHS rate card',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'rate_card_id',
      'role',
      'internal_or_external',
      'location',
      'hourly_rate_usd',
      'utilization_assumption',
      'source',
      'effective_date',
    ],
    optionalFields: ['scenario', 'confidence', 'notes'],
    ownerRole: 'Finance reviewer',
    purpose: 'Gives the business case repeatable cost assumptions instead of one-off estimates.',
    stageAdvanceUse: 'Value artifacts must cite approved rate card rows before showing investment ranges.',
  },
  {
    id: 'phs-gate-criteria',
    objectType: 'gate_criterion',
    label: 'PHS gate criteria',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'gate_id',
      'phase',
      'criterion',
      'blocker_level',
      'required_evidence',
      'owner',
      'status',
      'waiver_allowed',
    ],
    optionalFields: ['waiver_reason', 'due_date', 'notes'],
    ownerRole: 'Program steward',
    purpose: 'Makes stage advancement a governed decision instead of a visual state.',
    stageAdvanceUse: 'Blocked P0/P1 gates prevent phase advancement unless a named waiver is allowed and recorded.',
  },
  {
    id: 'phs-approval-records',
    objectType: 'approval_record',
    label: 'PHS approval records',
    acceptedFormats: ['csv', 'xlsx', 'json'],
    requiredFields: [
      'approval_id',
      'artifact_id',
      'approver_name',
      'role',
      'decision',
      'note',
      'timestamp',
      'conditions',
    ],
    optionalFields: ['approval_meeting', 'approval_channel', 'notes'],
    ownerRole: 'Executive sponsor',
    purpose: 'Ensures no artifact becomes externally usable without a named human decision.',
    stageAdvanceUse: 'External-use and phase-promotion actions require approved or named-waived records.',
  },
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function getPHSPhase0Template(
  templateId: string,
): PHSPhase0TemplateDefinition | null {
  return PHS_PHASE0_TEMPLATE_DEFINITIONS.find((template) => template.id === templateId) ?? null;
}

export function getRequiredPHSPhase0TemplateIds(): PHSPhase0TemplateId[] {
  return PHS_PHASE0_TEMPLATE_DEFINITIONS.map((template) => template.id);
}

export function buildPHSPhase0TemplatePreflight(args: {
  templateId: PHSPhase0TemplateId;
  headers: readonly string[];
}): PHSPhase0TemplatePreflight {
  const template = getPHSPhase0Template(args.templateId);
  if (!template) throw new Error(`unknown_phs_phase0_template:${args.templateId}`);

  const normalizedHeaders = new Map(
    args.headers
      .map((header) => header.trim())
      .filter(Boolean)
      .map((header) => [normalize(header), header] as const),
  );
  const knownFields = new Set([
    ...template.requiredFields.map(normalize),
    ...template.optionalFields.map(normalize),
  ]);
  const missingRequiredFields = template.requiredFields.filter(
    (field) => !normalizedHeaders.has(normalize(field)),
  );
  const unknownColumns = [...normalizedHeaders.entries()]
    .filter(([normalized]) => !knownFields.has(normalized))
    .map(([, raw]) => raw);

  return {
    template,
    headers: [...normalizedHeaders.values()],
    missingRequiredFields,
    unknownColumns,
    valid: missingRequiredFields.length === 0,
  };
}
