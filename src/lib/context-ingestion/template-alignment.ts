import {
  getFormatSupportProfile,
  getTemplateById,
  type TemplateExceptionMetadataRequirement,
} from './template-registry';
import { buildTemplateSchemaPreflight, type SchemaClarificationRequest } from './schema-preflight';
import type { UploadedFileFormat } from './types';

export type TemplateAlignmentStatus =
  | 'ready'
  | 'needs_mapping'
  | 'needs_metadata'
  | 'unsupported_format';

export interface TemplateAlignmentAssessment {
  status: TemplateAlignmentStatus;
  templateId: string;
  format: UploadedFileFormat;
  canonicalFormat: boolean;
  requiresExceptionApproval: boolean;
  parserLabel: string;
  missingRequiredFields: readonly string[];
  unknownColumns: readonly string[];
  missingMetadataKeys: readonly string[];
  metadataRequirements: readonly TemplateExceptionMetadataRequirement[];
  clarificationRequests: readonly SchemaClarificationRequest[];
}

function metadataAppliesToFormat(
  requirement: TemplateExceptionMetadataRequirement,
  format: UploadedFileFormat,
): boolean {
  return format !== 'unknown' && requirement.requiredForFormats.includes(format);
}

function isStructured(format: UploadedFileFormat): boolean {
  return format === 'csv' || format === 'xlsx' || format === 'json' || format === 'jsonl';
}

export function assessTemplateUploadAlignment(args: {
  templateId: string;
  format: UploadedFileFormat;
  headers?: readonly string[];
  suppliedMetadataKeys?: readonly string[];
}): TemplateAlignmentAssessment {
  const template = getTemplateById(args.templateId);
  if (!template) {
    throw new Error(`unknown_context_template:${args.templateId}`);
  }

  const profile = getFormatSupportProfile(args.format);
  if (!profile) {
    return {
      status: 'unsupported_format',
      templateId: template.id,
      format: args.format,
      canonicalFormat: false,
      requiresExceptionApproval: true,
      parserLabel: 'Unsupported file format',
      missingRequiredFields: [],
      unknownColumns: [],
      missingMetadataKeys: [],
      metadataRequirements: [],
      clarificationRequests: [
        {
          action: 'map_unknown_column',
          field: args.format,
          message: 'Upload a supported format or package the source in a ZIP manifest with parse metadata.',
        },
      ],
    };
  }

  const canonicalFormat = template.acceptedFormats.includes(args.format);
  const requiresExceptionApproval = !canonicalFormat || profile.requiresMetadataForException;
  const suppliedMetadata = new Set((args.suppliedMetadataKeys ?? []).map((key) => key.trim()).filter(Boolean));
  const metadataRequirements = template.exceptionMetadataRequirements.filter((requirement) =>
    metadataAppliesToFormat(requirement, args.format),
  );
  const missingMetadataKeys = requiresExceptionApproval
    ? metadataRequirements
        .filter((requirement) => !suppliedMetadata.has(requirement.key))
        .map((requirement) => requirement.key)
    : [];

  const preflight = isStructured(args.format) && args.headers
    ? buildTemplateSchemaPreflight({
        templateId: template.id,
        headers: args.headers,
      })
    : null;

  const mappingSatisfied = !preflight?.clarificationRequired || suppliedMetadata.has('field_mapping');
  const missingRequiredFields = preflight?.missingRequiredFields ?? [];
  const unknownColumns = preflight?.unknownColumns ?? [];
  const clarificationRequests: SchemaClarificationRequest[] = [
    ...(preflight?.clarificationRequests ?? []),
    ...missingMetadataKeys.map((key) => {
      const requirement = metadataRequirements.find((item) => item.key === key);
      return {
        action: 'supply_missing_required_field' as const,
        field: key,
        message: requirement
          ? `Provide ${requirement.label}: ${requirement.purpose}`
          : `Provide metadata field ${key}.`,
      };
    }),
  ];

  const status: TemplateAlignmentStatus = missingMetadataKeys.length > 0
    ? 'needs_metadata'
    : mappingSatisfied
      ? 'ready'
      : 'needs_mapping';

  return {
    status,
    templateId: template.id,
    format: args.format,
    canonicalFormat,
    requiresExceptionApproval,
    parserLabel: profile.parserLabel,
    missingRequiredFields,
    unknownColumns,
    missingMetadataKeys,
    metadataRequirements,
    clarificationRequests,
  };
}
