import type { Artifact } from '@/lib/agent/artifacts';
import { SOURCE_STAGE_LABELS } from './constants';
import { getSourcingEvent } from './queries';
import { setStageOverride } from './stage-overrides';
import { buildSourceStageGateReadiness } from './source-stage-gates';
import type { SourceStageGateReadinessItem } from './source-stage-gate-types';
import { SOURCE_EVENT_INSTANCES } from './source-event-instances';
import type { SourceEventInstance, VendorParticipant } from './source-event-instance';
import { buildBafoScenarioCompareView } from './bafo-scenario-compare-view';
import type { SourceStageKey } from './types';

export type SourcingToolResult =
  | { success: true; data: Record<string, unknown>; artifacts: Artifact[]; summary: string }
  | { success: false; error: string; recovery: string; artifacts: Artifact[] };

export interface AdvanceSourcingStageInput {
  eventId: string;
  toStage: number;
  rationale?: string;
  bypassGate?: boolean;
}

export interface CompareVendorsInput {
  eventId: string;
  vendorIds: string[];
  dimensions?: string[];
}

export interface RunBafoCheckInput {
  eventId: string;
}

const STAGE_PACK_TO_SOURCE_KEY: Record<number, SourceStageKey> = {
  0: 'strategy',
  1: 'scope',
  2: 'rfp',
  3: 'responses',
  4: 'evaluation',
  5: 'pricing',
  6: 'bafo',
  7: 'executive_decision',
  8: 'selection',
  9: 'transition',
  10: 'value',
};

const SOURCE_KEY_TO_STAGE_PACK: Partial<Record<SourceStageKey, number>> = {
  strategy: 0,
  intake: 0,
  sourcing_strategy: 0,
  scope: 1,
  rfp: 2,
  rfp_rfi_package: 2,
  responses: 3,
  vendor_responses: 3,
  evaluation: 4,
  pricing: 5,
  bafo: 6,
  orals_bafo: 6,
  executive_decision: 7,
  selection: 8,
  transition: 9,
  contract_mobilization: 9,
  value: 10,
  value_realization: 10,
};

export async function advanceSourcingStageTool(
  input: AdvanceSourcingStageInput,
): Promise<SourcingToolResult> {
  if (!Number.isInteger(input.toStage) || input.toStage < 0 || input.toStage > 10) {
    return recover('invalid_to_stage', 'Target stage must be an integer from 0 to 10.');
  }

  const event = await getSourcingEvent(input.eventId);
  if (!event) {
    return recover('event_not_found', `No sourcing event found for ${input.eventId}.`);
  }

  const fromStage = SOURCE_KEY_TO_STAGE_PACK[event.currentStageKey] ?? 0;
  if (input.toStage !== fromStage + 1 && !input.bypassGate) {
    return recover(
      'non_adjacent_stage',
      `The event is mapped to sourcing stage ${fromStage}; advance one stage at a time or set bypassGate with a rationale.`,
    );
  }

  const readiness = buildSourceStageGateReadiness({ event });
  const targetKey = STAGE_PACK_TO_SOURCE_KEY[input.toStage];
  const gate = findGateForTarget(readiness.gates, targetKey);
  const blockingGate = readiness.gates.find((item) => item.state === 'blocked')
    ?? (gate && (gate.state === 'blocked' || gate.state === 'needs_approval') ? gate : undefined);

  if (blockingGate && !input.bypassGate) {
    return {
      success: false,
      error: 'gate_blocked_hard',
      recovery: `Cannot advance to ${SOURCE_STAGE_LABELS[targetKey]} until ${blockingGate.blocker ?? blockingGate.transitionLabel} is resolved.`,
      artifacts: [toGateArtifact(blockingGate)],
    };
  }

  setStageOverride(input.eventId, targetKey);

  const artifact = {
    type: 'sourcing-stage-changed' as const,
    eventId: input.eventId,
    fromStage,
    toStage: input.toStage,
    snapshotId: `source-stage:${input.eventId}:${targetKey}`,
  };

  return {
    success: true,
    summary: `Advanced ${event.name} to ${SOURCE_STAGE_LABELS[targetKey]} in the in-memory demo stage store.`,
    data: {
      eventId: input.eventId,
      fromStage,
      toStage: input.toStage,
      stageKey: targetKey,
      stageLabel: SOURCE_STAGE_LABELS[targetKey],
      durablePersistence: false,
      rationale: input.rationale ?? null,
    },
    artifacts: [artifact],
  };
}

export async function compareVendorsTool(
  input: CompareVendorsInput,
): Promise<SourcingToolResult> {
  if (!Array.isArray(input.vendorIds) || input.vendorIds.length < 2) {
    return recover('not_enough_vendors', 'Compare vendors requires at least two vendor ids.');
  }

  const event = await getSourcingEvent(input.eventId);
  const instance = findSourceInstance(input.eventId);
  if (!event || !instance) {
    return recover('event_not_found', `No typed source instance found for ${input.eventId}.`);
  }

  const selected = input.vendorIds
    .map((id) => instance.vendors.find((vendor) => vendor.id === id))
    .filter((vendor): vendor is VendorParticipant => Boolean(vendor));

  if (selected.length < 2) {
    return recover('vendors_not_found', 'At least two requested vendors must exist on the source event.');
  }

  const dimensions = input.dimensions?.length
    ? input.dimensions.map((label) => ({ label, weight: Math.round(100 / input.dimensions!.length) }))
    : [
      { label: 'Fit', weight: 35 },
      { label: 'Risk', weight: 25 },
      { label: 'Commercial', weight: 25 },
      { label: 'Activation', weight: 15 },
    ];

  const vendorCards: Artifact[] = selected.map((vendor) => ({
    type: 'vendor-card' as const,
    vendorId: vendor.id,
    name: vendor.name,
    tier: vendor.status === 'selected' ? 'enterprise' : 'specialist',
    positioning: summarizeVendorPosition(vendor),
    riskFlags: vendor.riskFlags.map((flag) => flag.label),
  }));

  const scoreboard = {
    type: 'bafo-scoreboard' as const,
    vendors: selected.map((vendor) => ({ vendorId: vendor.id, name: vendor.name })),
    dimensions,
    scoresMatrix: selected.map((vendor) => dimensions.map((dimension) => deterministicScore(vendor, dimension.label))),
    notes: 'Deterministic seeded comparison. Scores are directional placeholders, not live procurement scoring.',
  };

  return {
    success: true,
    summary: `Compared ${selected.length} vendors for ${event.name}.`,
    data: {
      eventId: input.eventId,
      vendorIds: selected.map((vendor) => vendor.id),
      dimensions: dimensions.map((dimension) => dimension.label),
      deterministicSeed: true,
    },
    artifacts: [...vendorCards, scoreboard],
  };
}

export async function runBafoCheckTool(input: RunBafoCheckInput): Promise<SourcingToolResult> {
  const event = await getSourcingEvent(input.eventId);
  const instance = findSourceInstance(input.eventId);
  if (!event || !instance) {
    return recover('event_not_found', `No typed source instance found for ${input.eventId}.`);
  }

  const bafoView = buildBafoScenarioCompareView();
  const blockers = bafoView.vendorSets.filter((vendor) => vendor.hasActiveBlocker);
  const credibility = blockers.length === 0 ? 'strong' : blockers.length === 1 ? 'soft' : 'theatre';
  const recommendation = blockers.length === 0
    ? 'Proceed with BAFO using current scenario set and preserve written assumptions.'
    : `Resolve ${blockers.map((vendor) => vendor.vendorName).join(', ')} blocker(s) before treating walkaway leverage as credible.`;

  return {
    success: true,
    summary: `BAFO check for ${event.name}: walkaway credibility is ${credibility}.`,
    data: {
      eventId: input.eventId,
      currentStage: event.currentStageKey,
      vendorCount: instance.vendors.length,
      blockerCount: blockers.length,
      deterministicSeed: true,
    },
    artifacts: [
      {
        type: 'walkaway-signal' as const,
        credibility,
        reasoning: blockers.length === 0
          ? 'No deterministic BAFO scenario blockers are active.'
          : blockers.map((vendor) => `${vendor.vendorName}: ${vendor.blockerNote}`).join(' '),
        recommendation,
      },
      {
        type: 'bafo-scoreboard' as const,
        vendors: bafoView.vendorSets.map((vendor) => ({ vendorId: vendor.vendorId, name: vendor.vendorName })),
        dimensions: [
          { label: 'Conservative', weight: 34 },
          { label: 'Base', weight: 33 },
          { label: 'Stretch', weight: 33 },
        ],
        scoresMatrix: bafoView.vendorSets.map((vendor) => vendor.scenarios.map((scenario) => scenario.totalEstimatedSavingUsd)),
        notes: bafoView.honestDisclaimer,
      },
    ],
  };
}

function findSourceInstance(eventId: string): SourceEventInstance | null {
  return SOURCE_EVENT_INSTANCES.find((instance) => instance.id === eventId) ?? null;
}

function findGateForTarget(
  gates: SourceStageGateReadinessItem[],
  targetKey: SourceStageKey,
): SourceStageGateReadinessItem | undefined {
  return gates.find((gate) => gate.toStageKey === targetKey)
    ?? gates.find((gate) => gate.fromStageKey === targetKey);
}

function toGateArtifact(gate: SourceStageGateReadinessItem): Artifact {
  return {
    type: 'sourcing-stage-progress',
    evidenceItemId: gate.transitionId,
    label: gate.transitionLabel,
    severity: 'hard',
    status: 'unmet',
    detail: gate.blocker ?? gate.evidenceGap ?? 'Gate is not ready.',
  };
}

function summarizeVendorPosition(vendor: VendorParticipant): string {
  const status = vendor.status.replace(/-/g, ' ');
  const differentiator = vendor.differentiators[0] ?? 'Seeded vendor profile has limited differentiator detail.';
  return `${status}. ${differentiator}`;
}

function deterministicScore(vendor: VendorParticipant, dimension: string): number {
  const riskPenalty = vendor.riskFlags.filter((flag) => flag.status === 'open').length * 7;
  const statusBoost = vendor.status === 'selected' ? 14 : vendor.status === 'invited-bafo' ? 8 : 0;
  const base = 68 + statusBoost - riskPenalty + (dimension.length % 5);
  return Math.max(35, Math.min(95, base));
}

function recover(error: string, recovery: string): SourcingToolResult {
  return { success: false, error, recovery, artifacts: [] };
}
