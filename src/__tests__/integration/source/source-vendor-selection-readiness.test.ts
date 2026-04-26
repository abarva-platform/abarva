import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getSourceArtifactStatusStripSeed,
  getSourceEventSeed,
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceExecutiveDecisionSummary,
  buildSourceVendorSelectionReadiness,
  formatSourceVendorSelectionReadinessAsMarkdown,
} from '@/lib/source';
import type { SourceCommercialSignals, SourceStageGateReadiness } from '@/lib/source';

const CUSTOM_GENERATED_AT = '2026-04-26T00:00:00.000Z';

function seededTestSignals(): SourceCommercialSignals {
  return {
    eventId: 'event-vendor-selection-test',
    generatedAt: CUSTOM_GENERATED_AT,
    pricingSignals: {
      status: 'partially_comparable',
      readinessScore: 61,
      comparableVendors: 2,
      notComparableVendors: 1,
      topTraps: [
        'Vendor B pricing template missing',
        'Vendor C automation support partially unsupported',
      ],
      blockers: [
        'Vendor B pricing template missing',
      ],
      narrative: 'Vendor B is missing pricing template details.',
    },
    bafoSignals: {
      overallReadiness: 'partially_ready',
      vendorReadyCount: 1,
      vendorConditionalCount: 1,
      vendorBlockedCount: 1,
      priorities: [
        'Close pricing template gap for Vendor B.',
        'Request automation evidence support for Vendor C.',
      ],
      blockers: [
        'Vendor B pricing template missing',
      ],
      nextAction: 'Issue required clarifications.',
    },
    riskSignals: {
      overallRiskLevel: 'high',
      totalCount: 2,
      criticalCount: 0,
      highCount: 1,
      openExceptionTitles: [
        'Vendor C automation evidence is weak and not contract-backed',
      ],
    },
    vendorTradeoffs: [
      {
        vendorId: 'vendor-a',
        vendorName: 'Vendor A',
        pricingRank: 1,
        pricingStatus: 'comparable',
        bafoReadiness: 'ready',
        riskLevel: 'medium',
        blockers: [
          'Transition assumption confirmation required.',
        ],
      },
      {
        vendorId: 'vendor-b',
        vendorName: 'Vendor B',
        pricingRank: null,
        pricingStatus: 'not_comparable',
        bafoReadiness: 'not_comparable',
        riskLevel: 'high',
        blockers: [
          'Vendor B pricing template missing.',
          'Transition scope clarifications missing.',
        ],
      },
      {
        vendorId: 'vendor-c',
        vendorName: 'Vendor C',
        pricingRank: 2,
        pricingStatus: 'comparable',
        bafoReadiness: 'conditional',
        riskLevel: 'high',
        blockers: [
          'Automation evidence not contract-backed.',
          'Productivity uplift assumption requires historical baseline.',
        ],
      },
    ],
    commercialReadiness: 'partially_ready',
    executiveImplications: {
      nexusGuidance: 'Keep selection posture as deferred until pricing and evidence gaps close.',
      atlasExecutiveImplication: 'Pricing comparability is mixed across vendors.',
      sentinelEvidenceNotes: [
        'Vendor C automation story needs proof.',
      ],
      stewardGateNotes: [
        'Selection gate is not ready while pricing template evidence remains incomplete.',
      ],
    },
    blockers: [
      'Vendor B pricing template missing',
      'Vendor C automation evidence not contract-backed',
    ],
    recommendedNextAction: 'Collect missing pricing and evidence artifacts before review.',
    sourceModulesUsed: [
      'pricing-normalization',
      'bafo-negotiation',
      'commercial-risk-detection',
    ],
  };
}

function seededStageGates(eventId: string, eventName: string): SourceStageGateReadiness {
  return {
    eventId,
    eventName,
    generatedAt: CUSTOM_GENERATED_AT,
    currentStageKey: 'scope',
    currentStageLabel: 'Scope',
    overallState: 'blocked',
    gates: [
      {
        transitionId: 'gate-scope-rfp',
        transitionLabel: 'Scope -> RFP',
        fromStageKey: 'scope',
        toStageKey: 'rfp_rfi_package',
        state: 'blocked',
        blocker: 'Scope artifact set incomplete.',
        requiredArtifacts: ['Scope Document', 'Minimum Data Request'],
        requiredApprovals: ['Business sponsor approval'],
        evidenceGap: 'Baseline data missing',
      },
    ],
    blockers: ['Scope artifact set incomplete.'],
    recommendedNextAction: 'Upload complete scope baseline and pricing assumptions.',
    summary: 'Scope -> RFP blocked by baseline artifacts.',
  };
}

describe('Source vendor selection readiness model', () => {
  it('builds deterministic readiness for seeded source event and stays blocked when issues remain', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(event).toBeTruthy();

    const first = buildSourceVendorSelectionReadiness({ event: event! });
    const second = buildSourceVendorSelectionReadiness({ event: event! });

    expect(first.eventId).toBe(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
    expect(first.generatedAt).toBe(CUSTOM_GENERATED_AT);
    expect(JSON.stringify(first)).toEqual(JSON.stringify(second));
    expect(first.readinessStatus).not.toBe('ready_for_selection_review');
    expect(first.selectionReviewReady).toBe(false);
    expect(first.unresolvedCommercialIssues.length).toBeGreaterThan(0);
  });

  it('marks Vendor B as blocked when pricing template is missing', () => {
    const signals = seededTestSignals();
    const decision = buildSourceExecutiveDecisionSummary({
      event: {
        id: signals.eventId,
        name: 'Custom Vendor Selection Event',
        currentStageKey: 'selection',
        valueAtStakeUsd: 8_000_000,
      },
      commercialSignals: signals,
    });

    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: 'event-vendor-selection-test',
        name: 'Custom Vendor Selection Event',
        currentStageLabel: 'Selection',
        currentStageKey: 'selection',
        valueAtStakeUsd: 8_000_000,
      },
      commercialSignals: signals,
      executiveDecisionSummary: decision,
      stageGateReadiness: seededStageGates(signals.eventId, 'Custom Vendor Selection Event'),
    });

    expect(readiness.blockedVendors).toContain('Vendor B');
    expect(readiness.readinessStatus).toBe('blocked_missing_pricing');
    expect(readiness.requiredApprovalsForSelection).toContain('Business sponsor approval');
    expect(readiness.unresolvedCommercialIssues.join(' ')).toContain('Vendor B pricing template missing');
  });

  it('surfaces evidence caution when automation proof is weak', () => {
    const signals = seededTestSignals();
    const decision = buildSourceExecutiveDecisionSummary({
      event: {
        id: signals.eventId,
        name: 'Custom Vendor Selection Event',
        currentStageKey: 'selection',
        valueAtStakeUsd: 8_000_000,
      },
      commercialSignals: signals,
    });

    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: signals.eventId,
        name: 'Custom Vendor Selection Event',
        currentStageLabel: 'Selection',
        currentStageKey: 'selection',
      },
      commercialSignals: signals,
      executiveDecisionSummary: decision,
      stageGateReadiness: seededStageGates(signals.eventId, 'Custom Vendor Selection Event'),
    });

    expect(readiness.unresolvedEvidenceIssues.join(' ')).toContain('Vendor C automation evidence');
    expect(readiness.sentinelCautions.join(' ')).toContain('Vendor C automation evidence');
  });

  it('exposes required artifacts, approvals, and module provenance', () => {
    const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation);
    expect(event).toBeTruthy();

    const readiness = buildSourceVendorSelectionReadiness({
      event: event!,
    });

    expect(readiness.requiredArtifacts.length).toBeGreaterThan(0);
    expect(readiness.requiredApprovals.length).toBeGreaterThan(0);
    expect(readiness.sourceModulesUsed).toContain('commercial-signals');
    expect(readiness.sourceModulesUsed).toContain('source-stage-gates');
    expect(readiness.sourceModulesUsed).toContain('executive-decision-summary');
  });

  it('returns stable markdown summary output', () => {
    const event = getSourceArtifactStatusStripSeed(SOURCE_GOLDEN_EVENT_IDS.amsConsolidation);
    const artifactStatus = event.artifacts.slice(0, 2);
    const readiness = buildSourceVendorSelectionReadiness({
      event: {
        id: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
        name: 'AMS Consolidation Assessment',
        currentStageLabel: 'Selection',
        currentStageKey: 'selection',
      },
      artifactStatus,
      generatedAt: CUSTOM_GENERATED_AT,
    });

    const markdown = formatSourceVendorSelectionReadinessAsMarkdown(readiness);
    expect(markdown).toContain('# Source Vendor Selection Readiness');
    expect(markdown).toContain(`Event: AMS Consolidation Assessment (${SOURCE_GOLDEN_EVENT_IDS.amsConsolidation})`);
    expect(markdown).toContain('Selection-ready:');
    expect(readiness.rationale.length).toBeGreaterThan(0);
  });

  it('keeps model/build selection readiness deterministic with only approved imports', () => {
    const sources = [
      'src/lib/source/vendor-selection-readiness.ts',
      'src/__tests__/integration/source/source-vendor-selection-readiness.test.ts',
    ]
      .map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8'))
      .join('\\n');

    expect(sources).not.toMatch(/from ['\"][^'\"]*(openai|anthropic|ai\/react|@anthropic-ai\/sdk)['\"]/i);
    expect(sources).not.toMatch(/from ['\"][^'\"]*(upload|parser|parsing|artifact-drawer|workflow-engine|approval-engine)['\"]/i);
    expect(sources).not.toMatch(/from ['\"][^'\"]*(database|supabase|migrations)['\"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
