import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceAgentMission, SourceCommercialSignals } from '@/lib/source';
import {
  buildSourceExecutiveDecisionSummary,
  formatSourceExecutiveDecisionSummaryAsMarkdown,
  getSourceExecutiveDecisionBlockers,
  getSourceExecutiveDecisionOptions,
  summarizeSourceExecutiveDecision,
} from '@/lib/source';

function seededSignals(): SourceCommercialSignals {
  return {
    eventId: 'event-exec-summary',
    generatedAt: '2026-04-26T00:00:00.000Z',
    pricingSignals: {
      status: 'not_comparable',
      readinessScore: 62,
      comparableVendors: 1,
      notComparableVendors: 2,
      topTraps: [
        'Vendor B: Pricing template missing',
        'Vendor C: Automation savings not contract-backed',
      ],
      blockers: [
        'Vendor B pricing template missing',
      ],
      narrative: 'Pricing normalization shows one comparable vendor and two with blocking gaps.',
    },
    bafoSignals: {
      overallReadiness: 'partially_ready',
      vendorReadyCount: 1,
      vendorConditionalCount: 1,
      vendorBlockedCount: 1,
      priorities: [
        'Close pricing template gap for Vendor B',
        'Require evidence-backed automation commitments for Vendor C',
      ],
      blockers: [
        'Vendor B pricing template missing',
      ],
      nextAction: 'Issue targeted BAFO clarifications to Vendor B and Vendor C.',
    },
    riskSignals: {
      overallRiskLevel: 'high',
      totalCount: 3,
      criticalCount: 0,
      highCount: 2,
      openExceptionTitles: [
        'Vendor C automation claim lacks contract-backed evidence',
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
          'Transition assumptions need final lock',
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
          'Vendor B pricing template missing',
          'Transition plan detail missing',
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
          'Automation evidence not contract-backed',
          'Assumption: productivity uplift at 25% without baseline proof',
        ],
      },
    ],
    commercialReadiness: 'partially_ready',
    executiveImplications: {
      nexusGuidance: 'Stay in clarification mode until pricing and evidence blockers close.',
      atlasExecutiveImplication: 'Current tradeoff favors Vendor A while Vendor B and C remain conditional.',
      sentinelEvidenceNotes: [
        'Vendor C evidence confidence is low for automation claims.',
      ],
      stewardGateNotes: [
        'Selection gate remains closed until pricing and evidence blockers are resolved.',
      ],
    },
    blockers: [
      'Vendor B pricing template missing',
      'Vendor C evidence confidence is low for automation claims',
    ],
    recommendedNextAction: 'Issue deterministic clarification pack and rerun executive summary.',
    sourceModulesUsed: [
      'pricing-normalization',
      'bafo-negotiation',
      'commercial-risk-detection',
    ],
  };
}

function seededMissions(): SourceAgentMission[] {
  return [
    {
      missionId: 'mission-nexus-next',
      agentName: 'nexus',
      missionType: 'next_action',
      title: 'Close BAFO clarifications',
      summary: 'Close pending BAFO clarifications before executive selection review.',
      priority: 'high',
      state: 'active',
      trigger: 'stage_focus',
      sourceEventId: 'event-exec-summary',
      stageId: 'selection',
      relatedArtifactId: undefined,
      evidenceStatus: 'lowConfidence',
      blockerReason: undefined,
      recommendedAction: 'Send clarification requests to Vendor B and Vendor C.',
      suggestedActions: [],
      handoffTarget: 'sentinel',
      contextUsed: [],
      createdAt: '2026-04-26T00:00:00.000Z',
    },
    {
      missionId: 'mission-sentinel-gap',
      agentName: 'sentinel',
      missionType: 'evidence_gap',
      title: 'Resolve evidence gaps',
      summary: 'Evidence is insufficient for automation-related claims.',
      priority: 'critical',
      state: 'blocked',
      trigger: 'missing_inputs_detected',
      sourceEventId: 'event-exec-summary',
      stageId: 'selection',
      relatedArtifactId: undefined,
      evidenceStatus: 'missing',
      blockerReason: 'Vendor C evidence confidence is low for automation claims',
      recommendedAction: 'Collect contract-backed evidence for automation commitments.',
      suggestedActions: [],
      handoffTarget: 'nexus',
      contextUsed: [],
      createdAt: '2026-04-26T00:00:00.000Z',
    },
  ];
}

describe('Source executive decision summary thin synthesis', () => {
  it('builds deterministic summary from commercial signals and unified missions', () => {
    const input = {
      event: {
        id: 'event-exec-summary',
        name: 'Executive Decision Event',
        currentStageKey: 'selection',
        valueAtStakeUsd: 12500000,
      },
      commercialSignals: seededSignals(),
      unifiedMissions: seededMissions(),
      generatedAt: '2026-04-26T00:00:00.000Z',
    } as const;

    const first = buildSourceExecutiveDecisionSummary(input);
    const second = buildSourceExecutiveDecisionSummary(input);

    expect(first).toEqual(second);
    expect(first.vendorTradeoffs).toHaveLength(3);
    expect(first.sourceModulesUsed).toEqual(['commercial-signals', 'unified-agent-missions']);
    expect(first.atlasExecutiveBrief.length).toBeGreaterThan(0);
  });

  it('surfaces pricing blocker and evidence caution from provided signals and missions', () => {
    const summary = buildSourceExecutiveDecisionSummary({
      event: {
        id: 'event-exec-summary',
        name: 'Executive Decision Event',
        currentStageKey: 'selection',
      },
      commercialSignals: seededSignals(),
      unifiedMissions: seededMissions(),
    });

    expect(summary.blockers.join(' ').toLowerCase()).toContain('pricing template');
    expect(summary.sentinelCautions.join(' ').toLowerCase()).toContain('vendor c');
    expect(summary.vendorTradeoffs.find((tradeoff) => tradeoff.vendorId === 'vendor-b')?.viability).toBe('not_viable');
  });

  it('does not return ready_for_selection_review while blockers remain', () => {
    const summary = buildSourceExecutiveDecisionSummary({
      event: {
        id: 'event-exec-summary',
        name: 'Executive Decision Event',
        currentStageKey: 'selection',
      },
      commercialSignals: seededSignals(),
      unifiedMissions: seededMissions(),
    });

    expect(summary.decisionPosture).not.toBe('ready_for_selection_review');
    expect(summary.recommendedDecisionPosture).toBe(summary.decisionPosture);
    expect(getSourceExecutiveDecisionBlockers(summary).length).toBeGreaterThan(0);
    expect(getSourceExecutiveDecisionOptions(summary).length).toBeGreaterThan(0);
  });

  it('summary and markdown formatter return expected executive output', () => {
    const summary = buildSourceExecutiveDecisionSummary({
      event: {
        id: 'event-exec-summary',
        name: 'Executive Decision Event',
        currentStageKey: 'selection',
        valueAtStakeUsd: 12500000,
      },
      commercialSignals: seededSignals(),
      unifiedMissions: seededMissions(),
    });

    const text = summarizeSourceExecutiveDecision(summary);
    const markdown = formatSourceExecutiveDecisionSummaryAsMarkdown(summary);

    expect(text).toContain('Executive decision (event-exec-summary)');
    expect(markdown).toContain('# Source Executive Decision Summary');
    expect(markdown).toContain('Decision posture:');
    expect(markdown).toContain('Vendor tradeoffs');
    expect(markdown).toContain('Source modules used: commercial-signals, unified-agent-missions');
  });

  it('keeps thin synthesis implementation free of model and upload/parsing imports', () => {
    const sources = [
      'src/lib/source/executive-decision-summary.ts',
      'src/lib/source/executive-decision-types.ts',
      'src/lib/source/commercial-signals.ts',
      'src/lib/source/commercial-mission-adapter.ts',
      'src/lib/source/index.ts',
      'src/__tests__/integration/source/source-executive-decision-summary.test.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    expect(sources).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(sources).not.toMatch(/from ['"][^'"]*(upload|parser|artifact-drawer|scorecard-ui)['"]/i);
    expect(sources).not.toMatch(/\bfetch\(/i);
  });
});
