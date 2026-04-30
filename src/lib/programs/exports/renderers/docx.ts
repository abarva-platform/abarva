// EXPORT-3 · DOCX renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. EXPORT-4 wraps
// this with the API route + audit log.
//
// Supports kinds whose default or allowed format includes `docx`:
//   program-charter, discovery-report, pilot-result-report, outcome-report,
//   meeting-notes, decision-log (alt), workshop-facilitator-guide.
//
// EXPORT-3 ships `program-charter` only; the dispatcher returns a clear
// error for the other kinds until their per-kind renderer is added in
// follow-on slices (tracked as EXPORT-3-EXTEND).

import 'server-only';

import { Packer } from 'docx';

import { buildExportFilename } from '../filename';
import type { DeliverableRenderResult, DeliverableSpec } from '../types';

import {
  buildProgramCharterDocument,
  type ProgramCharterPayload,
  type ProgramCharterSpec,
} from './program-charter';

/** DOCX MIME (Open Office XML wordprocessing document). */
const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Shallow guard: spec.payload has the program-charter envelope shape.
 *
 * We deliberately validate only the top-level fields needed to recognize
 * the kind; the document builder is the source of truth for per-section
 * shape. Per-section validation lives in EXPORT-4 (Zod schema at the
 * API boundary) so the renderer stays pure.
 */
function isProgramCharterPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  valueHypothesis: Record<string, unknown>;
  sponsor: Record<string, unknown>;
  recommendedPath: Record<string, unknown>;
  architectureReviewAttestation: Record<string, unknown>;
  killCriterion: Record<string, unknown>;
  baselineKpis: ReadonlyArray<unknown>;
  signoff: Record<string, unknown>;
} {
  const vh = payload.valueHypothesis;
  const sponsor = payload.sponsor;
  const recommendedPath = payload.recommendedPath;
  const arch = payload.architectureReviewAttestation;
  const kill = payload.killCriterion;
  const kpis = payload.baselineKpis;
  const signoff = payload.signoff;
  return (
    typeof vh === 'object' &&
    vh !== null &&
    typeof sponsor === 'object' &&
    sponsor !== null &&
    typeof recommendedPath === 'object' &&
    recommendedPath !== null &&
    typeof arch === 'object' &&
    arch !== null &&
    typeof kill === 'object' &&
    kill !== null &&
    Array.isArray(kpis) &&
    typeof signoff === 'object' &&
    signoff !== null
  );
}

/**
 * Render a `DeliverableSpec` as a DOCX `DeliverableRenderResult`.
 *
 * EXPORT-3 supports `program-charter` only. Other DOCX-default kinds
 * throw a clear error pointing reviewers to the follow-on slice.
 */
export async function renderDeliverableAsDocx(
  spec: DeliverableSpec,
): Promise<DeliverableRenderResult> {
  let document;

  switch (spec.kind) {
    case 'program-charter': {
      if (!isProgramCharterPayloadShape(spec.payload)) {
        throw new Error(
          'program-charter payload is malformed: expected ' +
            '{ valueHypothesis, sponsor, recommendedPath, architectureReviewAttestation, killCriterion, baselineKpis: array, signoff }.',
        );
      }
      // Trust per-section shape to the document builder (consumers
      // validate upstream via Zod at the API boundary in EXPORT-4).
      const payload = spec.payload as unknown as ProgramCharterPayload;
      const charterSpec: ProgramCharterSpec = {
        ...spec,
        kind: 'program-charter',
        payload,
      };
      document = buildProgramCharterDocument(charterSpec);
      break;
    }
    case 'discovery-report':
    case 'pilot-result-report':
    case 'outcome-report':
    case 'meeting-notes':
    case 'decision-log':
    case 'workshop-facilitator-guide':
      throw new Error(
        `DOCX renderer for kind ${spec.kind} is a follow-on slice (EXPORT-3-EXTEND). EXPORT-3 ships program-charter only.`,
      );
    default:
      throw new Error(
        `Kind "${spec.kind}" does not have a DOCX renderer. Use the format router to pick the canonical format.`,
      );
  }

  const buffer = await Packer.toBuffer(document);
  const sizeBytes = buffer.byteLength;

  const filename = buildExportFilename({
    title: spec.title,
    kind: spec.kind,
    format: 'docx',
    generatedAt:
      spec.generatedAt !== undefined ? new Date(spec.generatedAt) : undefined,
  });

  return {
    format: 'docx',
    buffer,
    filename,
    contentType: DOCX_CONTENT_TYPE,
    sizeBytes,
  };
}

export { DOCX_CONTENT_TYPE };
