import { getTemplateById, type ContextTemplateDefinition } from './template-registry';

export type SchemaClarificationAction =
  | 'map_unknown_column'
  | 'supply_missing_required_field';

export interface SchemaClarificationRequest {
  action: SchemaClarificationAction;
  field: string;
  message: string;
  allowedTargets?: readonly string[];
}

export interface TemplateSchemaPreflight {
  template: ContextTemplateDefinition;
  headers: readonly string[];
  mappedRequiredFields: readonly string[];
  mappedOptionalFields: readonly string[];
  missingRequiredFields: readonly string[];
  unknownColumns: readonly string[];
  clarificationRequired: boolean;
  clarificationRequests: readonly SchemaClarificationRequest[];
}

function normalizeField(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function mapTemplateFields(fields: readonly string[]): Map<string, string> {
  return new Map(fields.map((field) => [normalizeField(field), field]));
}

export function buildTemplateSchemaPreflight(args: {
  templateId: string;
  headers: readonly string[];
}): TemplateSchemaPreflight {
  const template = getTemplateById(args.templateId);
  if (!template) {
    throw new Error(`unknown_context_template:${args.templateId}`);
  }

  const required = mapTemplateFields(template.requiredFields);
  const optional = mapTemplateFields(template.optionalFields);
  const normalizedHeaders = args.headers
    .map((header) => ({ raw: header.trim(), normalized: normalizeField(header) }))
    .filter((header) => header.raw && header.normalized);
  const present = new Set(normalizedHeaders.map((header) => header.normalized));
  const mappedRequiredFields = template.requiredFields.filter((field) => present.has(normalizeField(field)));
  const mappedOptionalFields = template.optionalFields.filter((field) => present.has(normalizeField(field)));
  const missingRequiredFields = template.requiredFields.filter((field) => !present.has(normalizeField(field)));
  const unknownColumns = normalizedHeaders
    .filter((header) => !required.has(header.normalized) && !optional.has(header.normalized))
    .map((header) => header.raw);
  const allowedTargets = [...template.requiredFields, ...template.optionalFields];
  const clarificationRequests: SchemaClarificationRequest[] = [
    ...missingRequiredFields.map((field) => ({
      action: 'supply_missing_required_field' as const,
      field,
      message: `Supply or map the required field ${field} before this file can be committed.`,
    })),
    ...unknownColumns.map((field) => ({
      action: 'map_unknown_column' as const,
      field,
      message: `Map ${field} to a template field or mark it evidence-only before commit.`,
      allowedTargets,
    })),
  ];

  return {
    template,
    headers: normalizedHeaders.map((header) => header.raw),
    mappedRequiredFields,
    mappedOptionalFields,
    missingRequiredFields,
    unknownColumns,
    clarificationRequired: clarificationRequests.length > 0,
    clarificationRequests,
  };
}
