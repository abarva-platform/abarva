// Moves Expert Kernel exports — public surface.
//
// Server-only registry binding (artifact id × format) → renderer. The download
// route resolves a tenant case + artifact + format through here and serializes
// the result. The Expert Review Console reads the artifact catalog to list
// what is downloadable.
//
// Mirrors the Source export architecture (`src/lib/source/exports/index.ts`):
// pure renderer modules + a thin route that streams bytes.

import 'server-only';

import type { Document as DocxDocument } from 'docx';
import type ExcelJS from 'exceljs';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import type { ExpertReviewCaseEntry } from '../expert-review-cases';
import {
  artifactSupportsFormat,
  resolveKernelArtifact,
  type ArtifactFormat,
  type KernelArtifactEntry,
} from './artifact-catalog';
import { buildKernelArtifactDocx } from './business-case-docx';
import { buildKernelFinancialModelXlsx } from './financial-model-xlsx';
import { buildKernelArtifactPdf } from './business-case-pdf';
import { artifactFilenameStem } from './format-helpers';

export {
  KERNEL_ARTIFACTS,
  MOVES_PHASE_LABEL,
  MOVES_PHASE_ORDER,
  ARTIFACT_CONTENT_TYPE,
  artifactSupportsFormat,
  isArtifactFormat,
  isKernelArtifactId,
  resolveKernelArtifact,
} from './artifact-catalog';
export type {
  ArtifactFormat,
  KernelArtifactEntry,
  KernelArtifactId,
  MovesPhase,
} from './artifact-catalog';
export { artifactFilenameStem } from './format-helpers';

/** Args for a kernel artifact render. */
export interface RenderKernelArtifactArgs {
  caseEntry: ExpertReviewCaseEntry;
  artifact: KernelArtifactEntry;
  format: ArtifactFormat;
  /** ISO date the document was generated. */
  generatedOn: string;
}

/** The rendered artifact — discriminated by format. */
export type RenderedKernelArtifact =
  | { format: 'docx'; document: DocxDocument }
  | { format: 'xlsx'; workbook: ExcelJS.Workbook }
  | { format: 'pdf'; element: ReactElement<DocumentProps> };

/**
 * Render a kernel artifact. Pure — the route serializes the result (Packer for
 * docx, workbook.xlsx.writeBuffer for xlsx, pdf().toBuffer for pdf).
 *
 * Throws when the artifact does not support the requested format — the route
 * validates first, so this is a defensive guard.
 */
export function renderKernelArtifact(
  args: RenderKernelArtifactArgs,
): RenderedKernelArtifact {
  const { caseEntry, artifact, format, generatedOn } = args;
  if (!artifactSupportsFormat(artifact.id, format)) {
    throw new Error(
      `Artifact '${artifact.id}' is not available in format '${format}'.`,
    );
  }
  switch (format) {
    case 'docx':
      return {
        format: 'docx',
        document: buildKernelArtifactDocx({ caseEntry, artifact, generatedOn }),
      };
    case 'xlsx':
      return {
        format: 'xlsx',
        workbook: buildKernelFinancialModelXlsx({ caseEntry, generatedOn }),
      };
    case 'pdf':
      return {
        format: 'pdf',
        element: buildKernelArtifactPdf({ caseEntry, artifact, generatedOn }),
      };
    default:
      throw new Error(`Unknown export format '${format as string}'.`);
  }
}

/** The download filename for a rendered artifact. */
export function kernelArtifactFilename(
  tenantKey: string,
  artifactId: string,
  format: ArtifactFormat,
  generatedOn: string,
): string {
  const stem = artifactFilenameStem(tenantKey, artifactId);
  return `${stem}-${generatedOn}.${format}`;
}

/** Build the full set of (artifact, format) download options for a case. */
export interface KernelDownloadOption {
  artifactId: string;
  format: ArtifactFormat;
  label: string;
  phase: string;
}

export {
  buildKernelArtifactDocx,
  buildKernelFinancialModelXlsx,
  buildKernelArtifactPdf,
};
export { resolveKernelArtifact as resolveArtifact };
