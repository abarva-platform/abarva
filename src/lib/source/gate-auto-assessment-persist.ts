import {
  selectSourceWriteAdapter,
  type SourceWriteAdapter,
} from '@/lib/data-plane/write-adapters/sourceWriteAdapter';
import type {
  SourceEventEvidence,
  SourceEventGateCriterion,
} from './canvas-substrate';
import {
  AUTO_EVIDENCE_REVIEWER_ID,
  assessStageGate,
  type GateAssessmentEvidenceMatch,
} from './gate-auto-assessment';
import type { SourceStageKey } from './types';

export interface PersistAutoAssessmentResult {
  written: string[];
  skipped: string[];
  failed: string[];
}

interface PersistAutoAssessmentOptions {
  writeAdapter?: SourceWriteAdapter;
  now?: () => string;
}

export async function persistAutoAssessment(
  input: {
    eventId: string;
    clientKey: string;
    fromStage: SourceStageKey;
    criteria: SourceEventGateCriterion[];
    evidence: SourceEventEvidence[];
  },
  options: PersistAutoAssessmentOptions = {},
): Promise<PersistAutoAssessmentResult> {
  const result: PersistAutoAssessmentResult = {
    written: [],
    skipped: [],
    failed: [],
  };
  const adapter =
    options.writeAdapter ??
    selectSourceWriteAdapter(undefined, input.clientKey);
  const now = options.now ?? (() => new Date().toISOString());
  const evidenceByRequirement = new Map(
    input.evidence.map((row) => [row.requirementId, row]),
  );
  const criteriaById = new Map(
    input.criteria.map((criterion) => [criterion.criterionId, criterion]),
  );
  const assessment = assessStageGate({
    fromStage: input.fromStage,
    criteria: input.criteria,
    evidence: input.evidence,
  });

  for (const assessed of assessment.criteria) {
    const criterion = criteriaById.get(assessed.criterionId);
    if (!criterion) continue;
    if (criterion.state !== 'pending') {
      result.skipped.push(criterion.criterionId);
      continue;
    }
    if (assessed.displayState !== 'met_auto_evidence') {
      result.skipped.push(criterion.criterionId);
      continue;
    }

    const evidenceArtifactIds = evidenceIdsForMatches(
      assessed.evidence,
      evidenceByRequirement,
    );
    const note = autoEvidenceNote(assessed.evidence);
    const nowIso = now();
    const update = await adapter.updateGateCriterion({
      criterionRowId: criterion.id,
      state: 'met',
      reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
      reviewedAtIso: nowIso,
      notes: note,
      evidenceArtifactIds,
      updatedAtIso: nowIso,
    });
    if (!update.ok) {
      result.failed.push(criterion.criterionId);
      continue;
    }

    result.written.push(criterion.criterionId);
    const log = await adapter.insertActivityLog({
      eventId: input.eventId,
      clientKey: input.clientKey,
      actorUserId: null,
      actorDisplayName: 'AbarVa auto evidence assessment',
      actorRole: 'system',
      actionType: 'gate_criterion_auto_assessed',
      actionLabel: `Auto-assessed gate criterion ${criterion.criterionId} from evidence`,
      stageKey: input.fromStage,
      criterionId: criterion.criterionId,
      reason: note,
      metadata: {
        reviewerUserId: AUTO_EVIDENCE_REVIEWER_ID,
        evidenceArtifactIds,
      },
      occurredAtIso: nowIso,
    });
    if (!log.ok) {
      console.error('[source auto-assessment activity] insert failed:', log.error);
    }
  }

  return result;
}

function evidenceIdsForMatches(
  matches: GateAssessmentEvidenceMatch[],
  evidenceByRequirement: Map<string, SourceEventEvidence>,
): string[] {
  const ids = matches
    .filter((match) => match.satisfied)
    .map((match) => {
      const evidence = evidenceByRequirement.get(match.requirementId);
      return match.sourceArtifactId ?? evidence?.id ?? null;
    })
    .filter((id): id is string => Boolean(id));
  return Array.from(new Set(ids));
}

function autoEvidenceNote(matches: GateAssessmentEvidenceMatch[]): string {
  const satisfied = matches.filter((match) => match.satisfied);
  const summary = satisfied
    .map(
      (match) =>
        `${match.requirementId} at '${match.currentState}' >= minimum '${match.minimumState}'`,
    )
    .join('; ');
  return `Auto-met from evidence: ${summary || 'required evidence satisfied'}`;
}
