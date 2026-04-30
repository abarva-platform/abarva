// EXPORT-3 · DOCX renderer dispatcher.
//
// Pure (spec) -> DeliverableRenderResult. No I/O, no auth. EXPORT-4 wraps
// this with the API route + audit log.
//
// Supports kinds whose default or allowed format includes `docx`:
//   program-charter, discovery-report, pilot-result-report, outcome-report,
//   meeting-notes, decision-log (alt), workshop-facilitator-guide.
//
// EXPORT-3 shipped `program-charter`. EXPORT-3-EXTEND added renderers for
// `discovery-report`, `outcome-report`, `meeting-notes`, and
// `decision-log`. EXPORT-3-EXTEND-2 closes the DOCX taxonomy by adding
// `pilot-result-report` and `workshop-facilitator-guide`. After this
// slice the dispatcher handles all 7 DOCX-default narrative kinds with
// no deferred throws.

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
  buildPilotResultReportDocument,
  type PilotResultReportPayload,
  type PilotResultReportSpec,
} from './pilot-result-report';
import {
  buildProgramCharterDocument,
  type ProgramCharterPayload,
  type ProgramCharterSpec,
} from './program-charter';
import {
  buildWorkshopFacilitatorGuideDocument,
  type WorkshopFacilitatorGuidePayload,
  type WorkshopFacilitatorGuideSpec,
} from './workshop-facilitator-guide';

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

/** Shallow guard: spec.payload has the pilot-result-report envelope shape. */
function isPilotResultReportPayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  programSummary: Record<string, unknown>;
  pilotCohort: Record<string, unknown>;
  successCriteria: ReadonlyArray<unknown>;
  observedOutcomes: ReadonlyArray<unknown>;
  edgeCases: ReadonlyArray<unknown>;
  scaleValidation: Record<string, unknown>;
  changeReadiness: Record<string, unknown>;
  p5Recommendation: string;
  p5RecommendationRationale: string;
} {
  const ps = payload.programSummary;
  const cohort = payload.pilotCohort;
  const successCriteria = payload.successCriteria;
  const observedOutcomes = payload.observedOutcomes;
  const edgeCases = payload.edgeCases;
  const scaleValidation = payload.scaleValidation;
  const changeReadiness = payload.changeReadiness;
  const rec = payload.p5Recommendation;
  const recRationale = payload.p5RecommendationRationale;
  return (
    typeof ps === 'object' &&
    ps !== null &&
    typeof cohort === 'object' &&
    cohort !== null &&
    Array.isArray(successCriteria) &&
    Array.isArray(observedOutcomes) &&
    Array.isArray(edgeCases) &&
    typeof scaleValidation === 'object' &&
    scaleValidation !== null &&
    typeof changeReadiness === 'object' &&
    changeReadiness !== null &&
    (rec === 'go' || rec === 'no-go' || rec === 'extend-pilot') &&
    typeof recRationale === 'string'
  );
}

/** Shallow guard: spec.payload has the workshop-facilitator-guide envelope shape. */
function isWorkshopFacilitatorGuidePayloadShape(
  payload: Record<string, unknown>,
): payload is Record<string, unknown> & {
  workshop: Record<string, unknown>;
  preWorkshopPrep: Record<string, unknown>;
  agenda: ReadonlyArray<unknown>;
  facilitationProbes: ReadonlyArray<unknown>;
  antiPatterns: ReadonlyArray<unknown>;
  closeout: Record<string, unknown>;
} {
  const workshop = payload.workshop;
  const prep = payload.preWorkshopPrep;
  const agenda = payload.agenda;
  const probes = payload.facilitationProbes;
  const antiPatterns = payload.antiPatterns;
  const closeout = payload.closeout;
  return (
    typeof workshop === 'object' &&
    workshop !== null &&
    typeof prep === 'object' &&
    prep !== null &&
    Array.isArray(agenda) &&
    Array.isArray(probes) &&
    Array.isArray(antiPatterns) &&
    typeof closeout === 'object' &&
    closeout !== null
  );
}

/**
 * Render a `DeliverableSpec` as a DOCX `DeliverableRenderResult`.
 *
 * Supported kinds: `program-charter` (EXPORT-3),
 * `discovery-report`, `outcome-report`, `meeting-notes`, `decision-log`
 * (EXPORT-3-EXTEND), and `pilot-result-report`,
 * `workshop-facilitator-guide` (EXPORT-3-EXTEND-2). The DOCX taxonomy
 * is now complete; non-DOCX-default kinds throw a clear "no renderer"
 * error pointing callers at the format router.
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
    case 'pilot-result-report': {
      if (!isPilotResultReportPayloadShape(spec.payload)) {
        throw new Error(
          'pilot-result-report payload is malformed: expected ' +
            '{ programSummary, pilotCohort, successCriteria: array, observedOutcomes: array, edgeCases: array, scaleValidation, changeReadiness, p5Recommendation: go|no-go|extend-pilot, p5RecommendationRationale: string }.',
        );
      }
      const payload = spec.payload as unknown as PilotResultReportPayload;
      const prSpec: PilotResultReportSpec = {
        ...spec,
        kind: 'pilot-result-report',
        payload,
      };
      document = buildPilotResultReportDocument(prSpec);
      break;
    }
    case 'workshop-facilitator-guide': {
      if (!isWorkshopFacilitatorGuidePayloadShape(spec.payload)) {
        throw new Error(
          'workshop-facilitator-guide payload is malformed: expected ' +
            '{ workshop, preWorkshopPrep, agenda: array, facilitationProbes: array, antiPatterns: array, closeout }.',
        );
      }
      const payload = spec.payload as unknown as WorkshopFacilitatorGuidePayload;
      const wfSpec: WorkshopFacilitatorGuideSpec = {
        ...spec,
        kind: 'workshop-facilitator-guide',
        payload,
      };
      document = buildWorkshopFacilitatorGuideDocument(wfSpec);
      break;
    }
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
