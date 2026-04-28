/**
 * Provenance ribbon helper tests — REASON-27
 *
 * Deterministic: pure functions over fixture inputs. No React, no network.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import {
  formatCitations,
  summarizeBlockers,
  summarizeCascade,
  summarizeFailureModes,
  summarizeGates,
  summarizePortfolio,
} from '@/lib/reasoning/provenance-ribbon-helpers';
import type {
  CascadeImpact,
  CitationPointer,
  FailureModeDetection,
  GateCriterionResult,
} from '@/lib/reasoning/types';

const ctx = buildSourceSynthesisContext(
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  PAT_SRC_AMS_001,
);

describe('formatCitations', () => {
  it('returns at least one cited pattern for the AMS context', () => {
    const cited = formatCitations(ctx.citations);
    expect(cited.length).toBeGreaterThan(0);
  });

  it('deduplicates citations sharing the same patternId', () => {
    const dupes: CitationPointer[] = [
      {
        ref: { patternId: 'PAT-SRC-AMS-001', patternVersion: '1.0', section: 'A' },
        excerpt: 'a',
        relevance: 'a',
      },
      {
        ref: { patternId: 'PAT-SRC-AMS-001', patternVersion: '1.0', section: 'B' },
        excerpt: 'b',
        relevance: 'b',
      },
    ];
    expect(formatCitations(dupes).length).toBe(1);
  });

  it('caps results at the provided limit', () => {
    const many: CitationPointer[] = Array.from({ length: 10 }, (_, i) => ({
      ref: { patternId: `PAT-X-${i}`, patternVersion: '1.0', section: `§${i}` },
      excerpt: 'x',
      relevance: 'x',
    }));
    expect(formatCitations(many, 3).length).toBe(3);
  });

  it('falls back to the patternId when the pattern is not in the catalog', () => {
    const unknown: CitationPointer[] = [
      {
        ref: { patternId: 'PAT-DOES-NOT-EXIST', patternVersion: '1.0', section: '§x' },
        excerpt: 'x',
        relevance: 'x',
      },
    ];
    expect(formatCitations(unknown)[0].title).toBe('PAT-DOES-NOT-EXIST');
  });
});

describe('summarizeGates', () => {
  it('derives cleared, pending, and hasBlocker from the context summary', () => {
    const view = summarizeGates(ctx.gatesSummary);
    expect(view.total).toBe(ctx.gatesSummary.total);
    expect(view.cleared).toBe(ctx.gatesSummary.met);
    expect(view.pending).toBe(Math.max(0, ctx.gatesSummary.total - ctx.gatesSummary.met));
    expect(view.hasBlocker).toBe(ctx.gatesSummary.blocked.length > 0);
  });

  it('returns hasBlocker=false when there are no hard blockers', () => {
    const view = summarizeGates({ total: 4, met: 4, unmet: 0, blocked: [] });
    expect(view.hasBlocker).toBe(false);
    expect(view.pending).toBe(0);
  });
});

describe('summarizeBlockers', () => {
  const makeBlocker = (id: string, description: string): GateCriterionResult => ({
    criterionId: id,
    stageId: 'P3',
    status: 'unmet',
    gateType: 'hard',
    evidence: [],
    description,
    evaluationHint: description,
    patternRef: { patternId: 'PAT-X', patternVersion: '1.0', section: '§1' },
    evaluatedAt: 0,
  });

  it('returns severity=none with empty blockers', () => {
    const view = summarizeBlockers({
      gatesSummary: { total: 1, met: 1, unmet: 0, blocked: [] },
    });
    expect(view).toEqual({ count: 0, severity: 'none', topLabel: null });
  });

  it('returns severity=amber for a single blocker and surfaces its description', () => {
    const view = summarizeBlockers({
      gatesSummary: {
        total: 1,
        met: 0,
        unmet: 1,
        blocked: [makeBlocker('b1', 'AMS BAFO award pending')],
      },
    });
    expect(view.count).toBe(1);
    expect(view.severity).toBe('amber');
    expect(view.topLabel).toBe('AMS BAFO award pending');
  });

  it('returns severity=red when two or more blockers are open', () => {
    const view = summarizeBlockers({
      gatesSummary: {
        total: 2,
        met: 0,
        unmet: 2,
        blocked: [makeBlocker('b1', 'first'), makeBlocker('b2', 'second')],
      },
    });
    expect(view.count).toBe(2);
    expect(view.severity).toBe('red');
    expect(view.topLabel).toBe('first');
  });
});

describe('summarizeCascade', () => {
  const cascade = (severity: CascadeImpact['severity']): CascadeImpact => ({
    sourceInstanceId: 'src',
    targetInstanceId: 'tgt',
    linkType: 'depends-on',
    impact: 'x',
    severity,
  });

  it('reports zero count and no blocking impact when cascade is empty', () => {
    expect(summarizeCascade({ cascadeContext: [] })).toEqual({
      count: 0,
      hasBlockingImpact: false,
    });
  });

  it('flags hasBlockingImpact=true when any cascade entry is blocking', () => {
    const view = summarizeCascade({
      cascadeContext: [cascade('informational'), cascade('blocking')],
    });
    expect(view.count).toBe(2);
    expect(view.hasBlockingImpact).toBe(true);
  });

  it('returns hasBlockingImpact=false when all entries are informational', () => {
    const view = summarizeCascade({
      cascadeContext: [cascade('informational'), cascade('accelerating')],
    });
    expect(view.hasBlockingImpact).toBe(false);
  });
});

describe('summarizePortfolio', () => {
  it('reads program / source counts from a Tower snapshot', () => {
    const view = summarizePortfolio({
      instanceSnapshot: { programCount: 4, sourceEventCount: 1, totalInstanceCount: 5 },
    });
    expect(view.programCount).toBe(4);
    expect(view.sourceEventCount).toBe(1);
    expect(view.totalInstanceCount).toBe(5);
    expect(view.headline).toBe('4 programs · 1 source event');
  });

  it('falls back to zero when snapshot fields are missing', () => {
    const view = summarizePortfolio({ instanceSnapshot: {} });
    expect(view.programCount).toBe(0);
    expect(view.sourceEventCount).toBe(0);
    expect(view.totalInstanceCount).toBe(0);
    expect(view.headline).toBe('0 programs · 0 source events');
  });

  it('ignores non-numeric or negative snapshot values', () => {
    const view = summarizePortfolio({
      instanceSnapshot: { programCount: 'two', sourceEventCount: -3 },
    });
    expect(view.programCount).toBe(0);
    expect(view.sourceEventCount).toBe(0);
  });

  it('derives totalInstanceCount from programs + source events when absent', () => {
    const view = summarizePortfolio({
      instanceSnapshot: { programCount: 3, sourceEventCount: 2 },
    });
    expect(view.totalInstanceCount).toBe(5);
  });
});

describe('summarizeFailureModes', () => {
  const detection = (
    id: string,
    label: string,
    confidence: number,
  ): FailureModeDetection => ({
    id,
    failureModeId: id,
    label,
    description: label,
    stages: [],
    mitigations: [],
    confidence,
    matchedKeywords: [],
    detectedFromKeys: [],
  });

  it('returns zeros and null label when no failure modes are detected', () => {
    expect(summarizeFailureModes({ failureModes: [] })).toEqual({
      count: 0,
      highConfidence: 0,
      topLabel: null,
      topConfidence: 0,
    });
  });

  it('counts detections at or above 0.6 confidence as high-confidence', () => {
    const view = summarizeFailureModes({
      failureModes: [
        detection('fm1', 'Governance gap', 0.4),
        detection('fm2', 'Transition risk', 0.6),
        detection('fm3', 'Staffing shortfall', 0.85),
      ],
    });
    expect(view.count).toBe(3);
    expect(view.highConfidence).toBe(2);
  });

  it('selects the highest-confidence detection as top', () => {
    const view = summarizeFailureModes({
      failureModes: [
        detection('fm1', 'Governance gap', 0.5),
        detection('fm2', 'Staffing shortfall', 0.92),
        detection('fm3', 'Transition risk', 0.7),
      ],
    });
    expect(view.topLabel).toBe('Staffing shortfall');
    expect(view.topConfidence).toBeCloseTo(0.92, 5);
  });

  it('detects failure modes on the AMS Vendor Consolidation 2026 source context', () => {
    const view = summarizeFailureModes(ctx);
    // PAT_SRC_AMS_001 declares failure modes that key off governance,
    // transition, staffing — all present in the AMS evidence map. The
    // detector should fire at least once on this canonical fixture.
    expect(view.count).toBeGreaterThan(0);
    expect(view.topLabel).not.toBeNull();
    expect(view.topConfidence).toBeGreaterThan(0);
  });
});
