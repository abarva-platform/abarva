// EXPORT-2 · XLSX renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. EXPORT-4 wraps
// this with the API route + audit log.
//
// Supports kinds whose default or allowed format includes `xlsx`:
//   okr-baseline, stakeholder-map, synthesis-options-table, execution-plan,
//   bafo-scoreboard, decision-log (alt), roadmap (alt), financial-baseline.
//
// EXPORT-2 ships `okr-baseline` only; the dispatcher returns a clear
// error for the other kinds until their per-kind renderer is added in
// follow-on slices (tracked as EXPORT-2-EXTEND).

import 'server-only';

import ExcelJS from 'exceljs';

import { buildExportFilename } from '../filename';
import type { DeliverableRenderResult, DeliverableSpec } from '../types';

import {
  buildOkrBaselineWorkbook,
  type OkrBaselinePayload,
  type OkrBaselineSpec,
} from './okr-baseline';

/** XLSX MIME (Open Office XML spreadsheet). */
const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Shallow guard: spec.payload has the OKR-baseline envelope shape.
 *
 * We deliberately validate only the top-level fields we need to recognize
 * the kind; the workbook builder is the source of truth for per-row
 * shape. Per-row validation lives in EXPORT-4 (Zod schema at the API
 * boundary) so the renderer stays pure.
 */
function isOkrBaselinePayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  cohort: string;
  capturedAt: string;
  metrics: ReadonlyArray<unknown>;
} {
  const cohort = payload.cohort;
  const capturedAt = payload.capturedAt;
  const metrics = payload.metrics;
  return (
    typeof cohort === 'string' &&
    typeof capturedAt === 'string' &&
    Array.isArray(metrics)
  );
}

/**
 * Render a `DeliverableSpec` as an XLSX `DeliverableRenderResult`.
 *
 * EXPORT-2 supports `okr-baseline` only. Other XLSX-default kinds throw
 * a clear error pointing reviewers to the follow-on slice.
 */
export async function renderDeliverableAsXlsx(
  spec: DeliverableSpec,
): Promise<DeliverableRenderResult> {
  let workbook: ExcelJS.Workbook;

  switch (spec.kind) {
    case 'okr-baseline': {
      if (!isOkrBaselinePayloadShape(spec.payload)) {
        throw new Error(
          'okr-baseline payload is malformed: expected { cohort: string, capturedAt: string, metrics: array }.',
        );
      }
      // Trust per-row shape to the workbook builder (consumers validate
      // upstream via Zod at the API boundary in EXPORT-4).
      const payload: OkrBaselinePayload = {
        cohort: spec.payload.cohort,
        capturedAt: spec.payload.capturedAt,
        metrics: spec.payload.metrics as OkrBaselinePayload['metrics'],
        contradictions: spec.payload.contradictions as
          | OkrBaselinePayload['contradictions']
          | undefined,
      };
      const okrSpec: OkrBaselineSpec = { ...spec, kind: 'okr-baseline', payload };
      workbook = buildOkrBaselineWorkbook(okrSpec);
      break;
    }
    case 'stakeholder-map':
    case 'synthesis-options-table':
    case 'execution-plan':
    case 'bafo-scoreboard':
    case 'financial-baseline':
    case 'decision-log':
    case 'roadmap':
      throw new Error(
        `XLSX renderer for kind ${spec.kind} is a follow-on slice (EXPORT-2-EXTEND). EXPORT-2 ships okr-baseline only.`,
      );
    default:
      throw new Error(
        `Kind "${spec.kind}" does not have an XLSX renderer. Use the format router to pick the canonical format.`,
      );
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
  const sizeBytes = buffer.byteLength;

  const filename = buildExportFilename({
    title: spec.title,
    kind: spec.kind,
    format: 'xlsx',
    generatedAt: spec.generatedAt !== undefined ? new Date(spec.generatedAt) : undefined,
  });

  return {
    format: 'xlsx',
    buffer,
    filename,
    contentType: XLSX_CONTENT_TYPE,
    sizeBytes,
  };
}

export { XLSX_CONTENT_TYPE };
