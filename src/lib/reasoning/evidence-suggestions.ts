/**
 * Evidence suggestions — REASON-37
 *
 * Pure function that examines unmet gate criteria for a lifecycle pattern
 * instance and emits context-sensitive suggestions for what evidence a user
 * should upload next.
 *
 * Design principles:
 * - Pure: no IO, no Date.now(), no randomness. Same inputs → same outputs.
 * - Keyword-driven: suggestion catalogue is matched against criterion
 *   description words so suggestions stay relevant without an LLM call.
 * - Priority mirrors gate hardness: hard gates surface as 'high', soft gates
 *   surface as 'medium' (partial) or 'low' (unmet).
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { createGateEvaluator } from './gate-evaluator';

// ─── Public types ─────────────────────────────────────────────────────────────

export type EvidencePriority = 'high' | 'medium' | 'low';

export interface EvidenceSuggestion {
  /** Stable criterion id from the pattern definition. */
  criterionId: string;
  /** Human-readable description of the unmet criterion. */
  criterionDescription: string;
  /** 2–3 concrete document/artefact types the user should attach. */
  suggestedEvidenceTypes: string[];
  /**
   * Priority for display ordering.
   * - high   — hard gate, status 'unmet'
   * - medium — hard gate, status 'partial' OR soft gate, status 'unmet'
   * - low    — soft gate, status 'partial'
   */
  priority: EvidencePriority;
}

// ─── Keyword → evidence type catalogue ───────────────────────────────────────

/**
 * Each entry maps a keyword (lower-case substring match against the criterion
 * description) to one or more suggested evidence types.  Entries are checked
 * in order; a criterion may match multiple entries, all of which contribute to
 * the suggestion list (deduped, capped at 3).
 */
const KEYWORD_CATALOGUE: ReadonlyArray<{
  keywords: string[];
  suggestions: string[];
}> = [
  {
    keywords: ['pricing', 'price', 'cost', 'costs', 'fee', 'fees', 'tariff'],
    suggestions: ['pricing proposal', 'cost breakdown', 'fee schedule'],
  },
  {
    keywords: ['sla', 'service level', 'uptime', 'availability'],
    suggestions: ['service level agreement', 'SLA schedule', 'uptime commitment letter'],
  },
  {
    keywords: ['contract', 'agreement', 'msa', 'nda', 'legal'],
    suggestions: ['signed contract', 'master service agreement', 'NDA'],
  },
  {
    keywords: ['vendor', 'supplier', 'provider'],
    suggestions: ['vendor qualification record', 'supplier profile', 'reference list'],
  },
  {
    keywords: ['security', 'soc', 'compliance', 'audit', 'iso', 'pen test', 'pentest'],
    suggestions: ['SOC-2 Type II report', 'security audit report', 'compliance certificate'],
  },
  {
    keywords: ['privacy', 'gdpr', 'data protection', 'dpa'],
    suggestions: ['data processing agreement', 'privacy impact assessment', 'GDPR sign-off'],
  },
  {
    keywords: ['architecture', 'technical', 'design', 'integration'],
    suggestions: ['architecture diagram', 'technical design document', 'integration specification'],
  },
  {
    keywords: ['risk', 'mitigation', 'contingency'],
    suggestions: ['risk register', 'mitigation plan', 'contingency document'],
  },
  {
    keywords: ['approval', 'sign-off', 'sign off', 'steward', 'authorisation', 'authorization'],
    suggestions: ['approval record', 'sign-off email', 'authorisation memo'],
  },
  {
    keywords: ['budget', 'forecast', 'financial', 'capex', 'opex', 'roi'],
    suggestions: ['budget approval document', 'financial forecast', 'ROI model'],
  },
  {
    keywords: ['timeline', 'milestone', 'schedule', 'plan', 'roadmap'],
    suggestions: ['project timeline', 'milestone tracker', 'delivery schedule'],
  },
  {
    keywords: ['bafo', 'best and final', 'final offer'],
    suggestions: ['BAFO submission', 'final pricing proposal', 'revised commercial terms'],
  },
  {
    keywords: ['rfp', 'proposal', 'response'],
    suggestions: ['RFP response', 'vendor proposal', 'technical response document'],
  },
  {
    keywords: ['reference', 'case study', 'testimonial'],
    suggestions: ['customer reference', 'case study', 'reference letter'],
  },
  {
    keywords: ['insurance', 'liability', 'indemnity'],
    suggestions: ['insurance certificate', 'liability schedule', 'indemnity clause'],
  },
  {
    keywords: ['performance', 'kpi', 'metric', 'benchmark'],
    suggestions: ['performance scorecard', 'KPI definition document', 'benchmark report'],
  },
  {
    keywords: ['scoping', 'scope', 'statement of work', 'sow'],
    suggestions: ['statement of work', 'scope document', 'project charter'],
  },
  {
    keywords: ['stakeholder', 'sponsor', 'executive'],
    suggestions: ['stakeholder sign-off', 'executive sponsor memo', 'steering committee minutes'],
  },
];

// ─── Fallback suggestion ──────────────────────────────────────────────────────

const FALLBACK_SUGGESTIONS: string[] = [
  'supporting document',
  'evidence attachment',
  'relevant record',
];

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Match a criterion description against the keyword catalogue and return up
 * to 3 suggested evidence types, deduped.
 */
function suggestionsForDescription(description: string): string[] {
  const lower = description.toLowerCase();
  const collected: string[] = [];

  for (const entry of KEYWORD_CATALOGUE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      for (const s of entry.suggestions) {
        if (!collected.includes(s)) {
          collected.push(s);
        }
        if (collected.length >= 3) break;
      }
    }
    if (collected.length >= 3) break;
  }

  return collected.length > 0 ? collected : FALLBACK_SUGGESTIONS;
}

/**
 * Map gate evaluation status + type to an EvidencePriority.
 *
 * | gateType | status   | priority |
 * | -------- | -------- | -------- |
 * | hard     | unmet    | high     |
 * | hard     | partial  | medium   |
 * | soft     | unmet    | medium   |
 * | soft     | partial  | low      |
 */
function priorityFor(
  gateType: 'hard' | 'soft',
  status: 'unmet' | 'partial',
): EvidencePriority {
  if (gateType === 'hard') {
    return status === 'unmet' ? 'high' : 'medium';
  }
  return status === 'unmet' ? 'medium' : 'low';
}

// ─── Instance type helpers ────────────────────────────────────────────────────

type ReasoningInstance = SourceEventInstance | ProgramInstance;

function isProgramInstance(
  instance: ReasoningInstance,
): instance is ProgramInstance {
  return (
    typeof (instance as ProgramInstance).currentPhase === 'number' &&
    Array.isArray((instance as ProgramInstance).phases)
  );
}

function currentStageIdFor(instance: ReasoningInstance): string {
  if (isProgramInstance(instance)) {
    const current = instance.phases.find(
      (p) => p.phaseId === instance.currentPhase,
    );
    if (current) return current.phaseLabel;
    return String(instance.currentPhase);
  }
  return instance.currentStage;
}

function buildEvidenceMapFor(
  instance: ReasoningInstance,
): Record<string, unknown> {
  if (isProgramInstance(instance)) {
    return buildProgramEvidenceMap(instance);
  }
  return buildEvidenceMap(instance);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive evidence suggestions for all unmet (and partial) gate criteria for
 * the instance's current stage.
 *
 * Returns an array sorted by priority: high → medium → low.
 */
export function buildEvidenceSuggestions(
  instance: ReasoningInstance,
  pattern: LifecyclePatternSeed,
): EvidenceSuggestion[] {
  const stageId = currentStageIdFor(instance);
  const evidenceMap = buildEvidenceMapFor(instance);
  const evaluator = createGateEvaluator(pattern);

  // unmetCriteria returns only status !== 'met' && !== 'waived'
  const unmet = evaluator.unmetCriteria(stageId, evidenceMap);

  const suggestions: EvidenceSuggestion[] = unmet.map((criterion) => {
    const status = criterion.status as 'unmet' | 'partial';
    return {
      criterionId: criterion.criterionId,
      criterionDescription: criterion.description,
      suggestedEvidenceTypes: suggestionsForDescription(criterion.description),
      priority: priorityFor(criterion.gateType, status),
    };
  });

  const ORDER: Record<EvidencePriority, number> = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}
