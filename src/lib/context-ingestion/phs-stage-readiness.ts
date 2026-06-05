import {
  PHS_PHASE0_TEMPLATE_DEFINITIONS,
  type PHSPhase0TemplateId,
} from './phs-phase0-templates';
import type {
  PHSManifestValidationResult,
  PHSPhase0Manifest,
} from './phs-phase0-manifest';
import { validatePHSPhase0Manifest } from './phs-phase0-manifest';

export interface PHSReadinessContextChunk {
  chunkMetadata?: Record<string, unknown> | null;
  provenance?: Record<string, unknown> | null;
}

export interface PHSReadinessEvidenceRow {
  artifactRef: string;
  sourceRef?: Record<string, unknown> | null;
}

export interface PHSStageReadinessInput {
  contextChunks: readonly PHSReadinessContextChunk[];
  evidenceRows: readonly PHSReadinessEvidenceRow[];
  manifest?: PHSPhase0Manifest | null;
}

export interface PHSTemplateCoverage {
  templateId: PHSPhase0TemplateId;
  label: string;
  chunksLoaded: number;
  present: boolean;
}

export interface PHSStageReadiness {
  templateCoverage: PHSTemplateCoverage[];
  missingTemplateIds: PHSPhase0TemplateId[];
  evidenceLedgerRows: number;
  loaderCoverageComplete: boolean;
  manifestValidation: PHSManifestValidationResult | null;
  readyForStageAdvance: boolean;
  blockers: string[];
}

function metadataString(
  row: PHSReadinessContextChunk,
  key: string,
): string | null {
  for (const source of [row.chunkMetadata, row.provenance]) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function countChunksByTemplate(
  chunks: readonly PHSReadinessContextChunk[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const chunk of chunks) {
    const templateId = metadataString(chunk, 'template_id');
    if (!templateId?.startsWith('phs-')) continue;
    counts.set(templateId, (counts.get(templateId) ?? 0) + 1);
  }
  return counts;
}

function isPHSEvidenceLedgerRow(row: PHSReadinessEvidenceRow): boolean {
  return row.sourceRef?.template_id === 'phs-evidence-register'
    || row.artifactRef.startsWith('PHS-');
}

export function evaluatePHSStageReadiness(
  input: PHSStageReadinessInput,
): PHSStageReadiness {
  const counts = countChunksByTemplate(input.contextChunks);
  const templateCoverage = PHS_PHASE0_TEMPLATE_DEFINITIONS.map((template) => {
    const chunksLoaded = counts.get(template.id) ?? 0;
    return {
      templateId: template.id,
      label: template.label,
      chunksLoaded,
      present: chunksLoaded > 0,
    };
  });
  const missingTemplateIds = templateCoverage
    .filter((template) => !template.present)
    .map((template) => template.templateId);
  const evidenceLedgerRows = input.evidenceRows.filter(isPHSEvidenceLedgerRow).length;
  const manifestValidation = input.manifest
    ? validatePHSPhase0Manifest(input.manifest)
    : null;
  const loaderCoverageComplete = missingTemplateIds.length === 0;
  const blockers: string[] = [];

  if (!loaderCoverageComplete) {
    blockers.push(`Missing PHS loader templates: ${missingTemplateIds.join(', ')}`);
  }
  if (evidenceLedgerRows === 0) {
    blockers.push('No PHS evidence-register rows have been appended to the evidence ledger.');
  }
  if (!manifestValidation) {
    blockers.push('No validated PHS Phase 0 manifest is available.');
  } else if (!manifestValidation.readyForStageAdvance) {
    blockers.push('PHS Phase 0 manifest has validation errors.');
  }

  return {
    templateCoverage,
    missingTemplateIds,
    evidenceLedgerRows,
    loaderCoverageComplete,
    manifestValidation,
    readyForStageAdvance: blockers.length === 0,
    blockers,
  };
}
