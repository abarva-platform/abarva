// EXPORT-3 · DOCX renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. EXPORT-4 wraps
// this with the API route + audit log.
//
// Supports kinds whose default or allowed format includes `docx`:
//   program-charter, discovery-report, pilot-result-report, outcome-report,
//   meeting-notes, decision-log (alt), workshop-facilitator-guide.
//
// EXPORT-3 shipped `program-charter`. EXPORT-3-EXTEND adds renderers for
// `discovery-report`, `outcome-report`, `meeting-notes`, and
// `decision-log`. The remaining kinds (`pilot-result-report`,
// `workshop-facilitator-guide`) still throw a clear EXPORT-3-EXTEND
// error until their per-kind renderer is added in a future slice.

import 'server-only';

import { Packer } from 'docx';

import { buildExportFilename } from '../filename';
import type { DeliverableRenderResult, DeliverableSpec } from '../types';

import {
  buildDecisionLogDocument,
  type DecisionLogPayload,
  type DecisionLogSpec,
} from './decision-log';
import {
  buildDiscoveryReportDocument,
  type DiscoveryReportPayload,
  type DiscoveryReportSpec,
} from './discovery-report';
import {
  buildMeetingNotesDocument,
  type MeetingNotesPayload,
  type MeetingNotesSpec,
} from './meeting-notes';
import {
  buildOutcomeReportDocument,
  type OutcomeReportPayload,
  type OutcomeReportSpec,
} from './outcome-report';
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
 * Shallow guard: spec.payload has the discovery-report envelope shape.
 *
 * Consistent with the program-charter guard, this validates only the
 * top-level fields the dispatcher needs to recognize the kind. Per-
 * section shape is the document builder's responsibility; per-section
 * validation lives at the API boundary in EXPORT-4 (Zod).
 */
function isDiscoveryReportPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  problemStatement: Record<string, unknown>;
  baseline: ReadonlyArray<unknown>;
  stakeholderMap: ReadonlyArray<unknown>;
  rootCauses: ReadonlyArray<unknown>;
  patternEvidence: Record<string, unknown>;
  p2Recommendation: string;
  p2RecommendationRationale: string;
} {
  const ps = payload.problemStatement;
  const baseline = payload.baseline;
  const sm = payload.stakeholderMap;
  const rc = payload.rootCauses;
  const pe = payload.patternEvidence;
  const rec = payload.p2Recommendation;
  const recRationale = payload.p2RecommendationRationale;
  return (
    typeof ps === 'object' &&
    ps !== null &&
    Array.isArray(baseline) &&
    Array.isArray(sm) &&
    Array.isArray(rc) &&
    typeof pe === 'object' &&
    pe !== null &&
    (rec === 'proceed' || rec === 'pivot' || rec === 'kill') &&
    typeof recRationale === 'string'
  );
}

/** Shallow guard: spec.payload has the outcome-report envelope shape. */
function isOutcomeReportPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  programSummary: Record<string, unknown>;
  outcomesVsBaseline: ReadonlyArray<unknown>;
  adoptionEvidence: ReadonlyArray<unknown>;
  benefitsAttestation: Record<string, unknown>;
  challengesAndMitigations: ReadonlyArray<unknown>;
  learningsForCatalog: ReadonlyArray<unknown>;
  p6HandoffPlan: Record<string, unknown>;
} {
  const ps = payload.programSummary;
  const outcomes = payload.outcomesVsBaseline;
  const adoption = payload.adoptionEvidence;
  const ba = payload.benefitsAttestation;
  const challenges = payload.challengesAndMitigations;
  const learnings = payload.learningsForCatalog;
  const handoff = payload.p6HandoffPlan;
  return (
    typeof ps === 'object' &&
    ps !== null &&
    Array.isArray(outcomes) &&
    Array.isArray(adoption) &&
    typeof ba === 'object' &&
    ba !== null &&
    Array.isArray(challenges) &&
    Array.isArray(learnings) &&
    typeof handoff === 'object' &&
    handoff !== null
  );
}

/** Shallow guard: spec.payload has the meeting-notes envelope shape. */
function isMeetingNotesPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  meeting: Record<string, unknown>;
  attendees: ReadonlyArray<unknown>;
  keyDiscussions: ReadonlyArray<unknown>;
  decisions: ReadonlyArray<unknown>;
  actionItems: ReadonlyArray<unknown>;
  notesAuthor: string;
} {
  const meeting = payload.meeting;
  const attendees = payload.attendees;
  const keyDiscussions = payload.keyDiscussions;
  const decisions = payload.decisions;
  const actionItems = payload.actionItems;
  const notesAuthor = payload.notesAuthor;
  return (
    typeof meeting === 'object' &&
    meeting !== null &&
    Array.isArray(attendees) &&
    Array.isArray(keyDiscussions) &&
    Array.isArray(decisions) &&
    Array.isArray(actionItems) &&
    typeof notesAuthor === 'string'
  );
}

/** Shallow guard: spec.payload has the decision-log envelope shape. */
function isDecisionLogPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  programSummary: Record<string, unknown>;
  entries: ReadonlyArray<unknown>;
} {
  const ps = payload.programSummary;
  const entries = payload.entries;
  return (
    typeof ps === 'object' &&
    ps !== null &&
    Array.isArray(entries)
  );
}

/**
 * Render a `DeliverableSpec` as a DOCX `DeliverableRenderResult`.
 *
 * Supported kinds: `program-charter` (EXPORT-3) and
 * `discovery-report`, `outcome-report`, `meeting-notes`, `decision-log`
 * (EXPORT-3-EXTEND). Other DOCX-supporting kinds throw a clear error
 * pointing reviewers to the still-pending follow-on slice.
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
    case 'discovery-report': {
      if (!isDiscoveryReportPayloadShape(spec.payload)) {
        throw new Error(
          'discovery-report payload is malformed: expected ' +
            '{ problemStatement, baseline: array, stakeholderMap: array, rootCauses: array, patternEvidence, p2Recommendation: proceed|pivot|kill, p2RecommendationRationale: string }.',
        );
      }
      const payload = spec.payload as unknown as DiscoveryReportPayload;
      const drSpec: DiscoveryReportSpec = {
        ...spec,
        kind: 'discovery-report',
        payload,
      };
      document = buildDiscoveryReportDocument(drSpec);
      break;
    }
    case 'outcome-report': {
      if (!isOutcomeReportPayloadShape(spec.payload)) {
        throw new Error(
          'outcome-report payload is malformed: expected ' +
            '{ programSummary, outcomesVsBaseline: array, adoptionEvidence: array, benefitsAttestation, challengesAndMitigations: array, learningsForCatalog: array, p6HandoffPlan }.',
        );
      }
      const payload = spec.payload as unknown as OutcomeReportPayload;
      const orSpec: OutcomeReportSpec = {
        ...spec,
        kind: 'outcome-report',
        payload,
      };
      document = buildOutcomeReportDocument(orSpec);
      break;
    }
    case 'meeting-notes': {
      if (!isMeetingNotesPayloadShape(spec.payload)) {
        throw new Error(
          'meeting-notes payload is malformed: expected ' +
            '{ meeting, attendees: array, keyDiscussions: array, decisions: array, actionItems: array, notesAuthor: string }.',
        );
      }
      const payload = spec.payload as unknown as MeetingNotesPayload;
      const mnSpec: MeetingNotesSpec = {
        ...spec,
        kind: 'meeting-notes',
        payload,
      };
      document = buildMeetingNotesDocument(mnSpec);
      break;
    }
    case 'decision-log': {
      if (!isDecisionLogPayloadShape(spec.payload)) {
        throw new Error(
          'decision-log payload is malformed: expected ' +
            '{ programSummary, entries: array }.',
        );
      }
      const payload = spec.payload as unknown as DecisionLogPayload;
      const dlSpec: DecisionLogSpec = {
        ...spec,
        kind: 'decision-log',
        payload,
      };
      document = buildDecisionLogDocument(dlSpec);
      break;
    }
    case 'pilot-result-report':
    case 'workshop-facilitator-guide':
      throw new Error(
        `DOCX renderer for kind ${spec.kind} is a follow-on slice (EXPORT-3-EXTEND). EXPORT-3 + EXPORT-3-EXTEND ship program-charter, discovery-report, outcome-report, meeting-notes, and decision-log.`,
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
