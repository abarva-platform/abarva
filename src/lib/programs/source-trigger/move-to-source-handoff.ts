// Move→Source hand-off adapter · loop wiring.
//
// `runMoveToSourceTrigger` (Slice 2.6) is pure logic that turns a shaped
// Move's `MobilizationPlan` into a `SourceRecommendation`. But the Moves
// surface holds a `StrategicMove` view-model, not a full mobilization plan
// — the plan lives behind the shaping pipeline and is not persisted onto
// the Move view-model the detail page renders.
//
// This module is the connective tissue: it derives a *minimal*
// `MobilizationPlan` from the `StrategicMove` view-model the detail page
// already has, runs the Slice 2.6 trigger over it, and projects the
// resulting `SourceRecommendation` onto a Source-event-creation payload
// (`/api/v1/source/events` body shape). It carries the Move↔event linkage
// (`linkedProgramId`) so the cross-module trace viewer can later show the
// hand-off.
//
// Pure module — no I/O, no React, no database. Deterministic: the same
// Move always yields the same hand-off payload. The CTA on the Moves
// surface and the create-Source-event API path compose this.
//
// Methodology: docs/strategy/ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md
// §1 (North-Star loop), Wave 2 Slice 2.6 + loop-wiring follow-on (GAP-2).

import type {
  DeliveryLean,
  SolutionArchetypeKey,
} from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import { getSolutionArchetype } from '@/lib/programs/taxonomy/solution-archetype-taxonomy';
import type {
  BacklogEpic,
  MobilizationPlan,
  PlanItem,
  PlanHorizon,
  SquadRole,
} from '@/lib/programs/mobilization/mobilization-plan';
import type { StrategicMove } from '@/lib/programs/types.ui';
import {
  runMoveToSourceTrigger,
  type MoveToSourceTriggerResult,
  type SourcingEngagementKind,
} from './move-to-source-trigger';

/** The Source-event `event_type` the `/api/v1/source/events` route accepts. */
export type SourceEventType =
  | 'managed_service'
  | 'software'
  | 'staffing'
  | 'infrastructure'
  | 'consulting'
  | 'other';

/**
 * Map a Move-to-Source engagement kind onto the Source-event `event_type`
 * the intake route persists. `product` → packaged software; a
 * vendor-operated run → `managed_service`; an SI engagement → `consulting`.
 */
const ENGAGEMENT_TO_EVENT_TYPE: Readonly<
  Record<SourcingEngagementKind, SourceEventType>
> = {
  product: 'software',
  managed_service: 'managed_service',
  systems_integrator: 'consulting',
};

/** The body shape `POST /api/v1/source/events` accepts. */
export interface SourceEventSeedPayload {
  eventName: string;
  eventType: SourceEventType;
  triggerDescription: string;
  scopeDescription: string;
  decisionOwner?: string;
  /** The Move id — the Move↔Source-event linkage the trace viewer joins on. */
  linkedProgramId: string;
  estimatedValueUsd?: number;
}

/** The full result of running the Move→Source hand-off for a Move. */
export interface MoveToSourceHandoffResult {
  /** The underlying Slice 2.6 trigger result — reasoning, disposition. */
  trigger: MoveToSourceTriggerResult;
  /**
   * The Source-event-creation payload, present only when the trigger's
   * disposition is `sourcing_required`; `null` otherwise. When `null` the
   * CTA shows the trigger reasoning rather than offering a Source hand-off.
   */
  seed: SourceEventSeedPayload | null;
}

// ─── Internal: deriving a minimal MobilizationPlan from a Move ──────────────

/**
 * Map the `StrategicMove` view-model's free-text `archetype` onto a
 * `SolutionArchetypeKey`. Falls back to `vendor_led_implementation` — the
 * archetype most likely to need a Source lane — when the string does not
 * match a known key, so the hand-off degrades safely rather than throwing.
 */
function resolveArchetypeKey(archetype: string): SolutionArchetypeKey {
  const normalized = archetype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const known: readonly SolutionArchetypeKey[] = [
    'automation',
    'assistant',
    'retrieval_copilot',
    'human_in_loop_agent',
    'full_agentic_workflow',
    'data_remediation',
    'vendor_led_implementation',
    'process_redesign',
  ];
  if ((known as readonly string[]).includes(normalized)) {
    return normalized as SolutionArchetypeKey;
  }
  // ai_product_enablement and similar product-shaped strings → buy a product.
  if (/product|enablement|platform/.test(normalized)) {
    return 'vendor_led_implementation';
  }
  return 'vendor_led_implementation';
}

/**
 * The delivery lean for the derived plan. A `vendor_led_implementation`
 * archetype is a `buy`; a `data_remediation` Move leans `orchestrate`;
 * everything else leans `build`. The trigger then decides build-vs-source
 * from this lean (no Slice 1.2 gate signal is available off the view-model).
 */
function deriveDeliveryLean(key: SolutionArchetypeKey): DeliveryLean {
  if (key === 'vendor_led_implementation') return 'buy';
  if (key === 'data_remediation') return 'orchestrate';
  return 'build';
}

/** Derive the squad from the Move's sponsor + participants. */
function deriveSquad(move: StrategicMove): SquadRole[] {
  const squad: SquadRole[] = [];
  if (move.sponsor) {
    squad.push({
      key: 'accountable_owner',
      title: move.sponsor.role || 'Move sponsor',
      responsibility: `Accountable owner for "${move.name}".`,
      accountable: true,
    });
  }
  for (const participant of move.participants.slice(0, 4)) {
    squad.push({
      key: `participant_${participant.personId}`,
      title: participant.role || 'Squad member',
      responsibility: `Contributes to "${move.name}".`,
      accountable: false,
    });
  }
  if (squad.length === 0) {
    squad.push({
      key: 'accountable_owner',
      title: 'Move owner',
      responsibility: `Accountable owner for "${move.name}".`,
      accountable: true,
    });
  }
  return squad;
}

/**
 * Derive backlog epics from the Move's deliverables — the design and
 * solution artifacts the external lane delivers against. Each non-sourcing
 * deliverable becomes one epic so `carveScope` has something to carve.
 */
function deriveBacklog(move: StrategicMove): BacklogEpic[] {
  return move.deliverables
    .filter((d) => d.typeKey !== 'sourcing_strategy')
    .slice(0, 6)
    .map((d, index) => ({
      id: `move-deliverable-${index + 1}`,
      title: d.title,
      buildsNodes: [d.typeKey],
      size: 'medium' as const,
    }));
}

/**
 * Build the minimal `MobilizationPlan` the Slice 2.6 trigger reasons over.
 * This is a *projection* of the Move view-model, not the full Slice 2.4
 * plan — it carries exactly the fields `runMoveToSourceTrigger` reads:
 * `proposedMove`, `archetypeName`, `deliveryLean`, `squad`, `backlog`,
 * `items`, `pilotHorizon`, `pilotGatingItems`, `readyForTightPath`.
 */
export function deriveMobilizationPlanFromMove(
  move: StrategicMove,
): MobilizationPlan {
  const archetypeKey = resolveArchetypeKey(move.archetype);
  const archetype = getSolutionArchetype(archetypeKey);
  const deliveryLean = deriveDeliveryLean(archetypeKey);
  const backlog = deriveBacklog(move);
  const pilotHorizon: PlanHorizon = 'day_60';
  const items: PlanItem[] = [];
  const allGatesCleared = move.gateCriteria.every((c) => c.completed);

  return {
    proposedMove: move.name,
    archetype: archetypeKey,
    archetypeName: archetype.name,
    architectureOptionId: `move-${move.id}-recommended`,
    deliveryLean,
    squad: deriveSquad(move),
    backlog,
    items,
    pilotHorizon,
    pilotGatingItems: items.filter((i) => i.blocksPilot),
    readyForTightPath: allGatesCleared,
    notes: [
      'Mobilization plan projected from the Move view-model for the Move→Source hand-off.',
    ],
  };
}

// ─── Entry point ────────────────────────────────────────────────────────────

/** A concise, sourcing-advisor-voice Source-event name for the Move. */
function eventNameFor(move: StrategicMove): string {
  return `${move.name} — sourcing`;
}

/**
 * Run the Move→Source hand-off for a `StrategicMove`.
 *
 * Derives a minimal mobilization plan from the Move, runs the Slice 2.6
 * trigger, and — when the trigger says `sourcing_required` — projects the
 * recommendation onto a Source-event-creation payload that carries the
 * Move↔event linkage. Pure and deterministic.
 */
export function runMoveToSourceHandoff(
  move: StrategicMove,
): MoveToSourceHandoffResult {
  const plan = deriveMobilizationPlanFromMove(move);
  const trigger = runMoveToSourceTrigger({ mobilizationPlan: plan });

  if (trigger.disposition !== 'sourcing_required' || !trigger.recommendation) {
    return { trigger, seed: null };
  }

  const rec = trigger.recommendation;
  const scopeLines: string[] = [
    `What to source: ${rec.whatToSource}`,
    `Category hint: ${rec.categoryHint}`,
    '',
    'External lane scope:',
    ...rec.externalScope.map((line) => `• ${line}`),
    '',
    'Retained by the tenant squad:',
    ...rec.retainedScope.map((line) => `• ${line}`),
  ];
  if (rec.assumptions.length > 0) {
    scopeLines.push('', 'Assumptions carried from the Move:');
    for (const assumption of rec.assumptions) {
      scopeLines.push(`• ${assumption.assumption}`);
    }
  }

  const seed: SourceEventSeedPayload = {
    eventName: eventNameFor(move),
    eventType: ENGAGEMENT_TO_EVENT_TYPE[rec.engagementKind],
    triggerDescription: `Handed off from the Move "${move.name}" (${move.displayCode}). The Move's mobilization lean is "${trigger.deliveryLean}" — delivery needs an external ${rec.engagementKindLabel.toLowerCase()}.`,
    scopeDescription: scopeLines.join('\n'),
    decisionOwner: move.sponsor?.name,
    linkedProgramId: move.id,
    estimatedValueUsd: move.valueAtStake.projected
      ? Math.round(
          (move.valueAtStake.projected.low + move.valueAtStake.projected.high) /
            2,
        )
      : undefined,
  };

  return { trigger, seed };
}
