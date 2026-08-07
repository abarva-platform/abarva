import {
  MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS,
  type MeridianPhase0TemplateId,
} from "./meridian-phase0-templates";
import type {
  MeridianManifestValidationResult,
  MeridianPhase0Manifest,
} from "./meridian-phase0-manifest";
import { validateMeridianPhase0Manifest } from "./meridian-phase0-manifest";

export interface MeridianReadinessContextChunk {
  chunkMetadata?: Record<string, unknown> | null;
  provenance?: Record<string, unknown> | null;
}

export interface MeridianReadinessEvidenceRow {
  artifactRef: string;
  sourceRef?: Record<string, unknown> | null;
}

export interface MeridianStageReadinessInput {
  contextChunks: readonly MeridianReadinessContextChunk[];
  evidenceRows: readonly MeridianReadinessEvidenceRow[];
  manifest?: MeridianPhase0Manifest | null;
}

export interface MeridianTemplateCoverage {
  templateId: MeridianPhase0TemplateId;
  label: string;
  chunksLoaded: number;
  present: boolean;
}

export interface MeridianStageReadiness {
  templateCoverage: MeridianTemplateCoverage[];
  missingTemplateIds: MeridianPhase0TemplateId[];
  evidenceLedgerRows: number;
  loaderCoverageComplete: boolean;
  manifestValidation: MeridianManifestValidationResult | null;
  readyForStageAdvance: boolean;
  blockers: string[];
}

function metadataString(
  row: MeridianReadinessContextChunk,
  key: string,
): string | null {
  for (const source of [row.chunkMetadata, row.provenance]) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function countChunksByTemplate(
  chunks: readonly MeridianReadinessContextChunk[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const chunk of chunks) {
    const templateId = metadataString(chunk, "template_id");
    if (!templateId?.startsWith("meridian-")) continue;
    counts.set(templateId, (counts.get(templateId) ?? 0) + 1);
  }
  return counts;
}

function isMeridianEvidenceLedgerRow(
  row: MeridianReadinessEvidenceRow,
): boolean {
  return (
    row.sourceRef?.template_id === "meridian-evidence-register" ||
    row.artifactRef.startsWith("Meridian-")
  );
}

export function evaluateMeridianStageReadiness(
  input: MeridianStageReadinessInput,
): MeridianStageReadiness {
  const counts = countChunksByTemplate(input.contextChunks);
  const templateCoverage = MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS.map(
    (template) => {
      const chunksLoaded = counts.get(template.id) ?? 0;
      return {
        templateId: template.id,
        label: template.label,
        chunksLoaded,
        present: chunksLoaded > 0,
      };
    },
  );
  const missingTemplateIds = templateCoverage
    .filter((template) => !template.present)
    .map((template) => template.templateId);
  const evidenceLedgerRows = input.evidenceRows.filter(
    isMeridianEvidenceLedgerRow,
  ).length;
  const manifestValidation = input.manifest
    ? validateMeridianPhase0Manifest(input.manifest)
    : null;
  const loaderCoverageComplete = missingTemplateIds.length === 0;
  const blockers: string[] = [];

  if (!loaderCoverageComplete) {
    blockers.push(
      `Missing Meridian loader templates: ${missingTemplateIds.join(", ")}`,
    );
  }
  if (evidenceLedgerRows === 0) {
    blockers.push(
      "No Meridian evidence-register rows have been appended to the evidence ledger.",
    );
  }
  if (!manifestValidation) {
    blockers.push("No validated Meridian Phase 0 manifest is available.");
  } else if (!manifestValidation.readyForStageAdvance) {
    blockers.push("Meridian Phase 0 manifest has validation errors.");
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
