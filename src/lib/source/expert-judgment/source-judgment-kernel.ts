import type { DealPackInput } from '../exports/deal-pack/stage-sections';
import {
  artifactEvidenceRef,
  evidenceLabel,
  gateBlockers,
  hasChallengedSavings,
  hasIncompletePricing,
  hasP0AiDataRisk,
  hasRenewalUrgency,
  priceIsBeingUsedToOverrideRisk,
  selectionMemoHoldsAward,
} from './source-judgment-rules';
import type {
  SourceJudgment,
  SourceJudgmentAction,
  SourceJudgmentArtifact,
  SourceJudgmentBlocker,
  SourceJudgmentEvidence,
  SourceJudgmentEvidenceRow,
  SourceJudgmentGap,
  SourceJudgmentInput,
} from './source-judgment-types';

export function buildSourceJudgmentFromDealPack(input: DealPackInput): SourceJudgment {
  return buildSourceJudgment({
    eventName: input.eventName,
    eventCode: input.eventCode,
    currentStageKey: input.currentStageKey,
    eventOwner: input.eventOwner,
    estimatedValueUsd: input.estimatedValueUsd,
    artifacts: input.stages.flatMap((stage) =>
      stage.artifacts.map((artifact) => ({
        code: artifact.code,
        title: artifact.title,
        body:
          artifact.kind === 'narrative'
            ? artifact.bodyMarkdown
            : input.artifactStates.find((state) => state.artifactCode === artifact.code)?.body ?? '',
        bodyIsAuthored: artifact.bodyIsAuthored,
        kind: artifact.kind,
        structuredKind: artifact.kind === 'structured' ? artifact.structured?.kind : undefined,
      })),
    ),
    gateCriteria: input.gateCriteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      state: criterion.state,
    })),
    evidence: input.evidence.map((row) => ({
      requirementId: row.requirementId,
      currentState: row.currentState,
      sourceArtifactId: row.sourceArtifactId,
      notes: row.notes,
    })),
  });
}

export function buildSourceJudgment(input: SourceJudgmentInput): SourceJudgment {
  const joinedEvidence = joinEventText(input);
  const blockers: SourceJudgmentBlocker[] = [...gateBlockers(input.gateCriteria)];
  const evidenceGaps: SourceJudgmentGap[] = [];
  const challengedAssumptions = [];
  const nextActions: SourceJudgmentAction[] = [];
  const selectionMemo = findArtifact(input.artifacts, 'd27_selection_memo');

  if (selectionMemo?.body && selectionMemoHoldsAward(selectionMemo.body)) {
    blockers.push({
      severity: 'P0',
      domain: 'governance',
      description: 'Selection memo explicitly holds award or says selection is pending.',
      requiredResolution: 'Update the selection memo only after BAFO, legal, pricing and gate blockers close.',
      evidenceRef: artifactEvidenceRef(selectionMemo),
    });
  }

  if (hasP0AiDataRisk(joinedEvidence)) {
    blockers.push({
      severity: 'P0',
      domain: 'ai_data_rights',
      description: 'Open P0 AI/data-rights, telemetry, model-improvement or audit-rights blocker detected.',
      requiredResolution: 'Redline the AI/data-rights clause or obtain explicit accountable risk acceptance before award.',
      evidenceRef: firstEvidenceRef(input, /telemetry|model-improvement|data rights|audit rights|ai clause|p0/i),
    });
  }

  if (hasIncompletePricing(joinedEvidence)) {
    blockers.push({
      severity: 'P1',
      domain: 'pricing',
      description: 'Pricing is incomplete or not comparable across vendors.',
      requiredResolution: 'Run targeted BAFO and require conforming pricing submissions before normalization.',
      evidenceRef: firstEvidenceRef(input, /pricing|ai module|blank|non-comparable|not comparable/i),
    });
    evidenceGaps.push({
      gap: 'Comparable vendor pricing is not complete.',
      whyItMatters: 'A CXO cannot approve award from an apples-to-apples commercial view until missing pricing is closed or explicitly excluded.',
      blocksDecision: true,
    });
  }

  if (hasChallengedSavings(joinedEvidence)) {
    challengedAssumptions.push({
      assumption: 'Pilot savings can be used as base-case value.',
      challenge: 'Savings evidence is challenged, stale or not representative; use conservative/base-case sensitivity rather than the headline pilot claim.',
      sensitivity: 'high' as const,
    });
    evidenceGaps.push({
      gap: 'Defensible base-case savings evidence is not settled.',
      whyItMatters: 'Unsupported value claims can turn a sourcing recommendation into an optimism artifact.',
      blocksDecision: true,
    });
  }

  if (priceIsBeingUsedToOverrideRisk(joinedEvidence)) {
    challengedAssumptions.push({
      assumption: 'Lowest price can justify award despite P0 AI/data risk.',
      challenge: 'Price cannot override unresolved legal, AI/data-rights or audit-rights blockers.',
      sensitivity: 'high' as const,
    });
  }

  const urgentRenewal = hasRenewalUrgency(joinedEvidence);
  if (urgentRenewal) {
    nextActions.push({
      action: 'Protect the renewal notice window while preserving P0 legal, pricing and governance gates.',
      owner: input.eventOwner ?? undefined,
      urgency: 'now',
    });
  }

  const blockingP0 = blockers.some((blocker) => blocker.severity === 'P0');
  const blockingPricing = blockers.some((blocker) => blocker.domain === 'pricing');
  const hasSelection = Boolean(selectionMemo?.body?.trim());
  const verdict = blockingP0
    ? 'do_not_award_yet'
    : blockingPricing || evidenceGaps.some((gap) => gap.blocksDecision)
      ? 'proceed_to_bafo'
      : hasSelection
        ? 'award_ready'
        : 'pause_for_evidence';

  if (verdict !== 'award_ready') {
    nextActions.push({
      action:
        verdict === 'proceed_to_bafo'
          ? 'Run targeted BAFO to close pricing comparability, challenged savings and vendor assumption gaps.'
          : 'Hold award and close blockers before supplier commitment.',
      owner: input.eventOwner ?? undefined,
      urgency: urgentRenewal ? 'now' : 'next_7_days',
    });
  } else {
    nextActions.push({
      action: 'Proceed with controlled award path and preserve risk controls through signature.',
      owner: input.eventOwner ?? undefined,
      urgency: 'next_30_days',
    });
  }

  const evidenceUsed = buildEvidenceUsed(input.evidence, input.artifacts);
  const whatWouldChangeTheVerdict = verdict === 'award_ready'
    ? ['A material legal, pricing, security, transition or evidence exception emerges before signature.']
    : [
        'All P0 legal, AI/data-rights, audit and governance blockers close or are explicitly risk-accepted.',
        'Vendor pricing becomes complete and comparable, or non-comparable scope is explicitly excluded.',
        'Challenged savings are replaced with defensible base-case evidence and sensitivity.',
      ];

  return {
    verdict,
    confidence: deriveConfidence(blockers, evidenceUsed),
    executiveSummary: summarizeVerdict(verdict, blockers),
    rationale: buildRationale(verdict, blockers, evidenceGaps, challengedAssumptions.length),
    blockers: dedupeBlockers(blockers),
    evidenceUsed,
    evidenceGaps,
    challengedAssumptions,
    nextActions: dedupeActions(nextActions),
    whatWouldChangeTheVerdict,
  };
}

function joinEventText(input: SourceJudgmentInput): string {
  return [
    input.eventName,
    input.eventCode,
    input.currentStageKey,
    ...input.artifacts.map((artifact) => `${artifact.title}\n${artifact.body ?? ''}`),
    ...input.evidence.map((row) => `${row.requirementId}\n${row.currentState ?? ''}\n${row.notes ?? ''}`),
  ].join('\n');
}

function findArtifact(artifacts: ReadonlyArray<SourceJudgmentArtifact>, code: string): SourceJudgmentArtifact | undefined {
  return artifacts.find((artifact) => artifact.code === code);
}

function firstEvidenceRef(input: SourceJudgmentInput, pattern: RegExp): string | undefined {
  const artifact = input.artifacts.find((item) => pattern.test(`${item.title}\n${item.body ?? ''}`));
  if (artifact) return artifactEvidenceRef(artifact);
  const evidence = input.evidence.find((row) => pattern.test(`${row.requirementId}\n${row.currentState ?? ''}\n${row.notes ?? ''}`));
  return evidence ? evidenceLabel(evidence) : undefined;
}

function buildEvidenceUsed(
  evidence: ReadonlyArray<SourceJudgmentEvidenceRow>,
  artifacts: ReadonlyArray<SourceJudgmentArtifact>,
): SourceJudgmentEvidence[] {
  const rows = evidence.slice(0, 6).map((row) => ({
    label: evidenceLabel(row),
    sourceType: 'event-evidence-ledger',
    confidence: row.currentState?.toLowerCase().includes('usable') ? 'high' as const : 'medium' as const,
    relevance: row.notes ?? row.currentState ?? 'Event evidence row used by Source judgment kernel.',
  }));
  if (rows.length > 0) return rows;
  return artifacts
    .filter((artifact) => artifact.bodyIsAuthored && artifact.body?.trim())
    .slice(0, 6)
    .map((artifact) => ({
      label: artifactEvidenceRef(artifact),
      sourceType: artifact.kind ?? 'source-artifact',
      confidence: 'medium' as const,
      relevance: 'Authored Source artifact used by Source judgment kernel.',
    }));
}

function deriveConfidence(
  blockers: ReadonlyArray<SourceJudgmentBlocker>,
  evidence: ReadonlyArray<SourceJudgmentEvidence>,
): 'high' | 'medium' | 'low' {
  if (blockers.some((blocker) => blocker.severity === 'P0')) return 'high';
  if (evidence.length >= 3) return 'medium';
  return 'low';
}

function summarizeVerdict(verdict: SourceJudgment['verdict'], blockers: ReadonlyArray<SourceJudgmentBlocker>): string {
  if (verdict === 'award_ready') return 'Award readiness is supported, subject to controlled signature path and preserved risk controls.';
  if (verdict === 'proceed_to_bafo') return 'Do not award yet; proceed to targeted BAFO to close pricing, value and assumption gaps.';
  if (verdict === 'do_not_award_yet') return 'Do not award yet; unresolved blockers make supplier commitment unsafe.';
  if (blockers.length > 0) return 'Pause the sourcing decision until the named blockers close.';
  return 'Recommendation is pending because evidence is not sufficient for a sourcing decision.';
}

function buildRationale(
  verdict: SourceJudgment['verdict'],
  blockers: ReadonlyArray<SourceJudgmentBlocker>,
  gaps: ReadonlyArray<SourceJudgmentGap>,
  challengedAssumptionCount: number,
): string[] {
  const rationale = [`Verdict is ${verdict.replaceAll('_', ' ')} based on deterministic Source judgment rules.`];
  if (blockers.length > 0) rationale.push(`${blockers.length} blocker(s) prevent award readiness.`);
  if (gaps.length > 0) rationale.push(`${gaps.length} evidence/pricing gap(s) must stay visible to the CXO.`);
  if (challengedAssumptionCount > 0) rationale.push(`${challengedAssumptionCount} assumption(s) are challenged and cannot be treated as base-case facts.`);
  return rationale;
}

function dedupeBlockers(blockers: SourceJudgmentBlocker[]): SourceJudgmentBlocker[] {
  const seen = new Set<string>();
  return blockers.filter((blocker) => {
    const key = `${blocker.severity}:${blocker.domain}:${blocker.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeActions(actions: SourceJudgmentAction[]): SourceJudgmentAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.action)) return false;
    seen.add(action.action);
    return true;
  });
}
