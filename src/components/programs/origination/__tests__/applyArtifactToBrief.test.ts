/**
 * applyArtifactToBrief — origination brief reducer.
 *
 * Locks in:
 *   - OV2-1c · pattern-match artifacts must NOT mutate the brief on
 *     /programs/new (founder feedback — pattern matching belongs at
 *     /programs/<id>, not during brief creation). The parser still
 *     accepts pattern-match (used by Nexus on the program-detail
 *     surface); the origination panel just ignores them.
 *   - OV2-1b · meta artifacts (`brief-progress`, `overlap-alert`)
 *     populate the new sibling slots on the state object. Brief Progress
 *     replaces the previous emission outright; Overlap Alerts are
 *     deduped by `overlappingProgramId` and the latest emission per
 *     program wins (mirrors NexusReactivePanel.selectVisibleArtifacts).
 */

import {
  applyArtifactToBrief,
  EMPTY_BRIEF_STATE,
  shouldHydrateOriginationDraft,
} from '../ProgramOriginationWorkspace';
import { EMPTY_BRIEF } from '../ProgramBriefPanel';
import type {
  BriefProgressArtifact,
  OverlapAlertArtifact,
} from '@/lib/agent/artifacts';

describe('applyArtifactToBrief', () => {
  it('drops pattern-match artifacts on the origination surface (OV2-1c)', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF_STATE, {
      type: 'pattern-match',
      patternId: 'PAT-PRG-CDP-001',
      name: 'CDP Activation',
      summary: 'Customer data platform programme lifecycle.',
      successRatePct: 72,
      deploymentCount: 18,
    });
    // No state mutated — including the legacy matchedPatternId mirror.
    expect(out).toBe(EMPTY_BRIEF_STATE);
    expect(out.brief.matchedPatternId).toBeNull();
  });

  it('applies brief-field artifacts', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF_STATE, {
      type: 'brief-field',
      field: 'sponsor',
      value: 'Sarah Chen',
    });
    expect(out.brief.sponsor).toBe('Sarah Chen');
  });

  it('applies classification by archetype label', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF_STATE, {
      type: 'classification',
      archetype: 'CDP_ACTIVATION',
      archetypeLabel: 'CDP Activation',
      confidence: 'high',
    });
    expect(out.brief.classification).toBe('CDP Activation');
  });

  it('appends cross-program-dependency entries and dedupes by formatted line', () => {
    const first = applyArtifactToBrief(EMPTY_BRIEF_STATE, {
      type: 'cross-program-dependency',
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      currentPhase: 'P3 Design',
    });
    expect(first.brief.crossProgramDependencies).toEqual([
      'APX-CDP-2026 · Apex Retail CDP Activation (P3 Design)',
    ]);
    // Re-applying the same dependency is a no-op.
    const second = applyArtifactToBrief(first, {
      type: 'cross-program-dependency',
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      currentPhase: 'P3 Design',
    });
    expect(second).toBe(first);
  });

  it('returns the state unchanged for non-origination artifact types', () => {
    const out = applyArtifactToBrief(EMPTY_BRIEF_STATE, {
      type: 'gate-evaluation',
      gate: 'Build gate',
      status: 'unmet',
    });
    expect(out).toBe(EMPTY_BRIEF_STATE);
  });

  // ── OV2-1b · meta artifact handling ────────────────────────────────────

  it('OV2-1b · stores the latest brief-progress artifact (replace, not merge)', () => {
    const first: BriefProgressArtifact = {
      type: 'brief-progress',
      fieldsTotal: 8,
      fieldsFilled: 2,
      fields: [
        { id: 'sponsor', label: 'Sponsor', status: 'filled', value: 'Sarah Chen' },
        { id: 'problem', label: 'Problem', status: 'filled', value: 'AMS spend up 22%' },
        { id: 'outcome', label: 'Target outcome', status: 'empty' },
      ],
    };
    const afterFirst = applyArtifactToBrief(EMPTY_BRIEF_STATE, first);
    expect(afterFirst.briefProgress).toBe(first);

    const second: BriefProgressArtifact = {
      type: 'brief-progress',
      fieldsTotal: 8,
      fieldsFilled: 5,
      fields: [
        { id: 'sponsor', label: 'Sponsor', status: 'filled', value: 'Sarah Chen' },
        { id: 'problem', label: 'Problem', status: 'filled', value: 'AMS spend up 22%' },
        { id: 'outcome', label: 'Target outcome', status: 'partial' },
        { id: 'archetype', label: 'Archetype', status: 'filled', value: 'CDP Activation' },
        { id: 'timeline', label: 'Timeline', status: 'filled', value: '2 quarters' },
      ],
    };
    const afterSecond = applyArtifactToBrief(afterFirst, second);
    expect(afterSecond.briefProgress).toBe(second);
    // Latest replaces prior wholesale — no merging.
    expect(afterSecond.briefProgress?.fieldsFilled).toBe(5);
    expect(afterSecond.briefProgress?.fields).toHaveLength(5);
  });

  it('OV2-1b · brief-progress at fieldsFilled === fieldsTotal is treated like any other emission', () => {
    const complete: BriefProgressArtifact = {
      type: 'brief-progress',
      fieldsTotal: 3,
      fieldsFilled: 3,
      fields: [
        { id: 'sponsor', label: 'Sponsor', status: 'filled', value: 'Sarah Chen' },
        { id: 'problem', label: 'Problem', status: 'filled', value: 'AMS spend' },
        { id: 'outcome', label: 'Outcome', status: 'filled', value: 'Containment +15%' },
      ],
    };
    const out = applyArtifactToBrief(EMPTY_BRIEF_STATE, complete);
    // The reducer doesn't apply special complete-state magic — UI may
    // decide to render differently, but the slot is just the artifact.
    expect(out.briefProgress).toBe(complete);
    expect(out.brief).toBe(EMPTY_BRIEF);
    expect(out.overlapAlerts).toEqual([]);
  });

  it('OV2-1b · overlap-alert dedupes by overlappingProgramId; latest per program wins', () => {
    const firstEmission: OverlapAlertArtifact = {
      type: 'overlap-alert',
      overlappingProgramId: 'APX-CDP-2026',
      overlappingProgramName: 'Apex Retail CDP Activation',
      overlappingProgramPhase: 'P3 Design',
      overlapKind: 'sponsor',
      overlapDetail: 'Sarah Chen already sponsoring APX-CDP-2026.',
    };
    const afterFirst = applyArtifactToBrief(EMPTY_BRIEF_STATE, firstEmission);
    expect(afterFirst.overlapAlerts).toEqual([firstEmission]);

    // Steward refines the alert on the next turn — same program id.
    const refinedEmission: OverlapAlertArtifact = {
      type: 'overlap-alert',
      overlappingProgramId: 'APX-CDP-2026',
      overlappingProgramName: 'Apex Retail CDP Activation',
      overlappingProgramPhase: 'P3 Design',
      overlapKind: 'multiple',
      overlapDetail: 'Sponsor + archetype overlap with APX-CDP-2026 — reconcile scope.',
    };
    const afterRefined = applyArtifactToBrief(afterFirst, refinedEmission);
    expect(afterRefined.overlapAlerts).toEqual([refinedEmission]);
    expect(afterRefined.overlapAlerts).toHaveLength(1);
    expect(afterRefined.overlapAlerts[0]).toBe(refinedEmission);
  });

  it('OV2-1b · multiple distinct overlap-alerts coexist (different program ids)', () => {
    const cdp: OverlapAlertArtifact = {
      type: 'overlap-alert',
      overlappingProgramId: 'APX-CDP-2026',
      overlappingProgramName: 'Apex Retail CDP Activation',
      overlapKind: 'sponsor',
      overlapDetail: 'Same sponsor (Sarah Chen) on APX-CDP-2026.',
    };
    const ams: OverlapAlertArtifact = {
      type: 'overlap-alert',
      overlappingProgramId: 'APX-AMS-2026',
      overlappingProgramName: 'Apex Retail AMS Consolidation',
      overlappingProgramPhase: 'P1 Discovery',
      overlapKind: 'system',
      overlapDetail: 'Both programs touch the merch-ops application family.',
    };
    const afterCdp = applyArtifactToBrief(EMPTY_BRIEF_STATE, cdp);
    const afterBoth = applyArtifactToBrief(afterCdp, ams);
    expect(afterBoth.overlapAlerts).toHaveLength(2);
    expect(afterBoth.overlapAlerts).toEqual([cdp, ams]);
  });
});

describe('shouldHydrateOriginationDraft', () => {
  it('hydrates only when the persisted draft session matches the current browser session', () => {
    expect(shouldHydrateOriginationDraft({ sessionId: 'session-a' }, 'session-a')).toBe(true);
    expect(shouldHydrateOriginationDraft({ sessionId: 'session-a' }, 'session-b')).toBe(false);
    expect(shouldHydrateOriginationDraft({}, 'session-a')).toBe(false);
    expect(shouldHydrateOriginationDraft({ sessionId: 'session-a' }, null)).toBe(false);
  });
});
