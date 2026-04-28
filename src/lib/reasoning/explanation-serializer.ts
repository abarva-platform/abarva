/**
 * Explanation serializer — Layer 3 reasoning trace.
 *
 * Pure helper that takes a SynthesisContext + the deterministic reasoning
 * artefacts (gate evaluations, contradiction templates tested, failure mode
 * templates tested) and produces a serialisable payload the
 * ExplainQuoteDrawer renders rule-by-rule.
 *
 * Goal: surface "which rules fired" for a synthesis quote — not just the
 * detections that surfaced, but every template tested with its detection
 * result. This is the auditor view of the synthesis layer.
 *
 * Pure: same inputs → same outputs. No clock reads, no randomness.
 */

import type {
  CascadeImpact,
  CitationPointer,
  ContradictionDetection,
  FailureModeDetection,
  GateCriterionResult,
  GateEvaluation,
  PatternRef,
  SynthesisContext,
} from '@/lib/reasoning/types';

// ─── Serialised types ─────────────────────────────────────────────────────────

/**
 * A single gate criterion evaluation in trace form.
 * Mirrors `GateEvaluation` plus the human-readable description so the drawer
 * can render the rule label without a second lookup.
 */
export interface ExplanationGateRow {
  criterionId: string;
  stageId: string;
  status: GateEvaluation['status'];
  gateType: GateEvaluation['gateType'];
  description: string;
  evaluationHint: string;
  evidence: string[];
  patternRef: PatternRef;
}

/**
 * Per-stage grouping of gate criterion evaluations.
 */
export interface ExplanationGateStageGroup {
  stageId: string;
  rows: ExplanationGateRow[];
}

/**
 * One contradiction template tested + the result.
 * `fired === true` means the detector returned a `ContradictionDetection`.
 * `fired === false` means the template was tested but did not match.
 */
export interface ExplanationContradictionRow {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  fired: boolean;
  /** Confidence when fired; 0 when not fired. */
  confidence: number;
  /** Resolution path (always present from the template). */
  resolutionPath: string;
  /** Triggering evidence fields when fired; empty when not fired. */
  triggeringFields: string[];
  /** Parties from the template. */
  partyA: string;
  partyB: string;
}

/**
 * One failure mode template tested + the result.
 */
export interface ExplanationFailureModeRow {
  failureModeId: string;
  label: string;
  description: string;
  fired: boolean;
  confidence: number;
  matchedKeywords: string[];
  mitigations: string[];
  stages: string[];
}

/**
 * Cascade impact entry as a serialisable row.
 */
export interface ExplanationCascadeRow {
  sourceInstanceId: string;
  targetInstanceId: string;
  targetInstanceName?: string;
  linkType: CascadeImpact['linkType'];
  severity: CascadeImpact['severity'];
  impactSeverity?: CascadeImpact['impactSeverity'];
  impact: string;
}

/**
 * Citation row.
 */
export interface ExplanationCitationRow {
  patternId: string;
  patternVersion: string;
  section: string;
  excerpt: string;
  relevance: string;
}

/**
 * Top-level payload sent from `/api/reasoning/explain` to the drawer.
 */
export interface ExplanationPayload {
  /** Echo of the request: surface + instance. */
  surface: 'source' | 'programs' | 'tower';
  instanceId: string;
  instanceType: SynthesisContext['instanceType'];
  patternId: string;
  patternVersion: string;
  currentStage: string;
  /** Gate counts headline (matches provenance ribbon). */
  gateSummary: {
    total: number;
    met: number;
    unmet: number;
  };
  /** Every citation in the context. */
  citations: ExplanationCitationRow[];
  /** All gate criterion evaluations grouped by stage. */
  gates: ExplanationGateStageGroup[];
  /**
   * Every contradiction template tested with its detection result. Templates
   * that did not fire are included so the auditor sees the negative space.
   */
  contradictions: ExplanationContradictionRow[];
  /**
   * Every failure mode template tested with its detection result. Templates
   * that did not fire are included.
   */
  failureModes: ExplanationFailureModeRow[];
  /** All cascade impacts identified. */
  cascadeImpacts: ExplanationCascadeRow[];
}

// ─── Inputs to the serializer ─────────────────────────────────────────────────

/**
 * Minimal shape of a contradiction template carried alongside the context so
 * the serializer can render templates that did not fire. Mirrors
 * `ContradictionTemplate` from intelligence/seed-types but kept duck-typed so
 * the serializer does not import that module (keeps it usable in shape-only
 * paths like the Tower portfolio context).
 */
export interface ContradictionTemplateLite {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  partyA: string;
  partyB: string;
  resolutionPath: string;
}

export interface FailureModeTemplateLite {
  id: string;
  label: string;
  description: string;
  stages: string[];
  mitigations: string[];
}

/**
 * Inputs for the serializer. The `gateEvaluations` array is the full list of
 * per-stage criteria computed by the gate evaluator (one entry per
 * pattern-defined criterion at every stage). The serializer groups them by
 * stage and joins each row with its description / evaluationHint when
 * supplied via `unmetCriteriaIndex`.
 */
export interface SerializeInputs {
  surface: 'source' | 'programs' | 'tower';
  context: SynthesisContext;
  /**
   * Every gate evaluation across every stage. The serializer groups them by
   * stageId for the drawer output.
   */
  gateEvaluations: GateEvaluation[];
  /**
   * Optional lookup: criterionId → { description, evaluationHint }. When
   * supplied (and it should be — the gate evaluator can produce it), the
   * serializer enriches each gate row with its rule label. When omitted, the
   * description / hint default to empty strings (drawer falls back to
   * criterionId).
   */
  criterionDescriptions?: Map<string, { description: string; evaluationHint: string }>;
  /**
   * Every contradiction template defined on the governing pattern. The
   * serializer pairs each template with its detection result (or `fired:
   * false`) so the trace shows negative space.
   */
  contradictionTemplates: ContradictionTemplateLite[];
  /** Every failure mode template defined on the governing pattern. */
  failureModeTemplates: FailureModeTemplateLite[];
}

// ─── Serializer ───────────────────────────────────────────────────────────────

/**
 * Build an `ExplanationPayload` from a synthesis context plus the
 * deterministic reasoning artefacts that produced it. Pure.
 */
export function serializeSynthesisExplanation(
  inputs: SerializeInputs,
): ExplanationPayload {
  const {
    surface,
    context,
    gateEvaluations,
    criterionDescriptions,
    contradictionTemplates,
    failureModeTemplates,
  } = inputs;

  // ── Gates: group by stage, in stage-id order encountered ─────────────────
  const stageOrder: string[] = [];
  const stageRows = new Map<string, ExplanationGateRow[]>();

  // Index unmet hint/description by criterionId for lookup. The synthesis
  // context's `gatesSummary.blocked` is also a useful source for the
  // current-stage hard blockers.
  const blockedIndex = new Map<string, GateCriterionResult>();
  for (const b of context.gatesSummary.blocked) {
    blockedIndex.set(b.criterionId, b);
  }

  for (const ev of gateEvaluations) {
    if (!stageRows.has(ev.stageId)) {
      stageRows.set(ev.stageId, []);
      stageOrder.push(ev.stageId);
    }
    const desc = criterionDescriptions?.get(ev.criterionId);
    const blocked = blockedIndex.get(ev.criterionId);
    stageRows.get(ev.stageId)!.push({
      criterionId: ev.criterionId,
      stageId: ev.stageId,
      status: ev.status,
      gateType: ev.gateType,
      description: desc?.description ?? blocked?.description ?? '',
      evaluationHint: desc?.evaluationHint ?? blocked?.evaluationHint ?? '',
      evidence: ev.evidence,
      patternRef: ev.patternRef,
    });
  }

  const gates: ExplanationGateStageGroup[] = stageOrder.map((stageId) => ({
    stageId,
    rows: stageRows.get(stageId) ?? [],
  }));

  // ── Contradictions: every template + detection result ────────────────────
  const detectionByTemplate = new Map<string, ContradictionDetection>();
  for (const d of context.activeContradictions) {
    detectionByTemplate.set(d.templateId, d);
  }
  const contradictions: ExplanationContradictionRow[] = contradictionTemplates.map((t) => {
    const fired = detectionByTemplate.get(t.id);
    return {
      templateId: t.id,
      label: t.label,
      severity: t.severity,
      fired: fired !== undefined,
      confidence: fired?.confidence ?? 0,
      resolutionPath: t.resolutionPath,
      triggeringFields: fired?.triggeringEvidence.map((e) => e.field) ?? [],
      partyA: t.partyA,
      partyB: t.partyB,
    };
  });

  // ── Failure modes: every template + detection result ─────────────────────
  const fmByTemplate = new Map<string, FailureModeDetection>();
  for (const d of context.failureModes) {
    fmByTemplate.set(d.failureModeId, d);
  }
  const failureModes: ExplanationFailureModeRow[] = failureModeTemplates.map((t) => {
    const fired = fmByTemplate.get(t.id);
    return {
      failureModeId: t.id,
      label: t.label,
      description: t.description,
      fired: fired !== undefined,
      confidence: fired?.confidence ?? 0,
      matchedKeywords: fired?.matchedKeywords ?? [],
      mitigations: t.mitigations,
      stages: t.stages,
    };
  });

  // ── Cascade impacts ──────────────────────────────────────────────────────
  const cascadeImpacts: ExplanationCascadeRow[] = context.cascadeContext.map((c) => ({
    sourceInstanceId: c.sourceInstanceId,
    targetInstanceId: c.targetInstanceId,
    targetInstanceName: c.targetInstanceName,
    linkType: c.linkType,
    severity: c.severity,
    impactSeverity: c.impactSeverity,
    impact: c.impact,
  }));

  // ── Citations ────────────────────────────────────────────────────────────
  const citations: ExplanationCitationRow[] = context.citations.map((c: CitationPointer) => ({
    patternId: c.ref.patternId,
    patternVersion: c.ref.patternVersion,
    section: c.ref.section,
    excerpt: c.excerpt,
    relevance: c.relevance,
  }));

  return {
    surface,
    instanceId: context.instanceId,
    instanceType: context.instanceType,
    patternId: context.patternId,
    patternVersion: context.patternVersion,
    currentStage: context.currentStage,
    gateSummary: {
      total: context.gatesSummary.total,
      met: context.gatesSummary.met,
      unmet: context.gatesSummary.unmet,
    },
    citations,
    gates,
    contradictions,
    failureModes,
    cascadeImpacts,
  };
}
