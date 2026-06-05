import {
  listSourceArtifactOperations,
  type SourceArtifactOperation,
} from "./artifact-operations";
import { SOURCE_ARTIFACT_MIME_ALLOWLIST } from "./artifact-registry/mime";
import { sourceArtifactFormatFromMime } from "./artifact-registry/upload-contract";
import type { SourceArtifactFormat } from "./artifact-registry/types";
import { getAllowedFormats, listAllKinds } from "./exports/format-router";
import { KIND_TO_ARTIFACT_CODE, type SourceDeliverableKind } from "./exports/types";

export type SourceArtifactBindingStatus =
  | "wired"
  | "partial"
  | "planned"
  | "blocked";

export interface SourceArtifactDownloadBinding {
  format: SourceArtifactFormat;
  rendererBacked: boolean;
}

export interface SourceArtifactBindingRow {
  artifactCode: string;
  artifactName: string;
  stageLabel: string;
  operationStatus: SourceArtifactOperation["status"];
  bindingStatus: SourceArtifactBindingStatus;
  supportedUploads: SourceArtifactFormat[];
  uploadMimeTypes: Record<string, string[]>;
  uploadFormatGaps: SourceArtifactFormat[];
  supportedDownloads: SourceArtifactFormat[];
  rendererBackedFormats: SourceArtifactFormat[];
  missingRendererForDeclaredDownloads: SourceArtifactFormat[];
  rendererFormatsMissingFromGoldStandard: SourceArtifactFormat[];
  downloadBindings: SourceArtifactDownloadBinding[];
  goldStandardTocCount: number;
  goldStandardExpectationCount: number;
  nextGap: string;
}

export interface SourceArtifactBindingSummary {
  totalArtifacts: number;
  uploadIntakeReady: number;
  rendererBackedDeclaredDownloads: number;
  wired: number;
  partial: number;
  planned: number;
  blocked: number;
}

export interface SourceArtifactBindingMatrix {
  generatedAt: string;
  rows: SourceArtifactBindingRow[];
  summary: SourceArtifactBindingSummary;
}

export const SOURCE_ARTIFACT_UPLOAD_FORMAT_MIME_TYPES: ReadonlyMap<
  SourceArtifactFormat,
  readonly string[]
> = buildUploadMimeTypeMap();

export const SOURCE_ARTIFACT_RENDERABLE_FORMATS: ReadonlyMap<
  string,
  readonly SourceArtifactFormat[]
> = buildRenderableFormatsMap();

export function listSourceArtifactBindingRows(
  operations: readonly SourceArtifactOperation[] = listSourceArtifactOperations(),
): SourceArtifactBindingRow[] {
  return operations.map((operation) => {
    const uploadFormatGaps = operation.goldStandard.supportedUploads.filter(
      (format) => !SOURCE_ARTIFACT_UPLOAD_FORMAT_MIME_TYPES.has(format),
    );
    const rendererBackedFormats =
      SOURCE_ARTIFACT_RENDERABLE_FORMATS.get(operation.artifactCode) ?? [];
    const rendererSet = new Set(rendererBackedFormats);
    const declaredDownloadSet = new Set(operation.goldStandard.supportedDownloads);
    const missingRendererForDeclaredDownloads =
      operation.goldStandard.supportedDownloads.filter(
        (format) => !rendererSet.has(format),
      );
    const rendererFormatsMissingFromGoldStandard = rendererBackedFormats.filter(
      (format) => !declaredDownloadSet.has(format),
    );

    return {
      artifactCode: operation.artifactCode,
      artifactName: operation.artifactName,
      stageLabel: operation.stageLabel,
      operationStatus: operation.status,
      bindingStatus: resolveBindingStatus({
        operation,
        uploadFormatGaps,
        missingRendererForDeclaredDownloads,
      }),
      supportedUploads: [...operation.goldStandard.supportedUploads],
      uploadMimeTypes: uploadMimeTypesFor(operation.goldStandard.supportedUploads),
      uploadFormatGaps,
      supportedDownloads: [...operation.goldStandard.supportedDownloads],
      rendererBackedFormats: [...rendererBackedFormats],
      missingRendererForDeclaredDownloads,
      rendererFormatsMissingFromGoldStandard,
      downloadBindings: operation.goldStandard.supportedDownloads.map((format) => ({
        format,
        rendererBacked: rendererSet.has(format),
      })),
      goldStandardTocCount: operation.goldStandard.tableOfContents.length,
      goldStandardExpectationCount:
        operation.goldStandard.bestInClassExpectations.length,
      nextGap: operation.nextGap,
    };
  });
}

export function buildSourceArtifactBindingMatrix(
  operations?: readonly SourceArtifactOperation[],
  generatedAt = new Date().toISOString(),
): SourceArtifactBindingMatrix {
  const rows = listSourceArtifactBindingRows(operations);
  return {
    generatedAt,
    rows,
    summary: summarizeSourceArtifactBindingRows(rows),
  };
}

export function summarizeSourceArtifactBindingRows(
  rows: readonly SourceArtifactBindingRow[],
): SourceArtifactBindingSummary {
  return {
    totalArtifacts: rows.length,
    uploadIntakeReady: rows.filter((row) => row.uploadFormatGaps.length === 0)
      .length,
    rendererBackedDeclaredDownloads: rows.filter(
      (row) => row.missingRendererForDeclaredDownloads.length === 0,
    ).length,
    wired: rows.filter((row) => row.bindingStatus === "wired").length,
    partial: rows.filter((row) => row.bindingStatus === "partial").length,
    planned: rows.filter((row) => row.bindingStatus === "planned").length,
    blocked: rows.filter((row) => row.bindingStatus === "blocked").length,
  };
}

function resolveBindingStatus(args: {
  operation: SourceArtifactOperation;
  uploadFormatGaps: readonly SourceArtifactFormat[];
  missingRendererForDeclaredDownloads: readonly SourceArtifactFormat[];
}): SourceArtifactBindingStatus {
  if (args.uploadFormatGaps.length > 0) return "blocked";
  if (
    args.operation.status === "wired" &&
    args.missingRendererForDeclaredDownloads.length === 0
  ) {
    return "wired";
  }
  if (args.operation.status === "planned") return "planned";
  return "partial";
}

function buildUploadMimeTypeMap(): Map<SourceArtifactFormat, string[]> {
  const byFormat = new Map<SourceArtifactFormat, string[]>();
  for (const mimeType of SOURCE_ARTIFACT_MIME_ALLOWLIST) {
    const format = sourceArtifactFormatFromMime(mimeType);
    if (format === "unknown") continue;
    byFormat.set(format, [...(byFormat.get(format) ?? []), mimeType]);
  }
  return byFormat;
}

function buildRenderableFormatsMap(): Map<string, SourceArtifactFormat[]> {
  const byArtifact = new Map<string, Set<SourceArtifactFormat>>();
  for (const kind of listAllKinds()) {
    const artifactCode = KIND_TO_ARTIFACT_CODE[kind as SourceDeliverableKind];
    const current = byArtifact.get(artifactCode) ?? new Set<SourceArtifactFormat>();
    for (const format of getAllowedFormats(kind as SourceDeliverableKind)) {
      current.add(format as SourceArtifactFormat);
    }
    byArtifact.set(artifactCode, current);
  }

  return new Map(
    [...byArtifact.entries()].map(([artifactCode, formats]) => [
      artifactCode,
      [...formats].sort(),
    ]),
  );
}

function uploadMimeTypesFor(
  formats: readonly SourceArtifactFormat[],
): Record<string, string[]> {
  return Object.fromEntries(
    formats.map((format) => [
      format,
      [...(SOURCE_ARTIFACT_UPLOAD_FORMAT_MIME_TYPES.get(format) ?? [])],
    ]),
  );
}
