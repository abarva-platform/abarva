import { describe, it, expect } from '@jest/globals';
import {
  normalizeQuestion,
  rollUpTopQuestions,
  summarizeAgentQuality,
  toSubstrateSnapshot,
} from '../aggregates';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';
import type { SynthesisViolationEvent } from '@/lib/intelligence/synthesis/violationsRecorder';

describe('C5 · pilot-dashboard aggregates', () => {
  describe('normalizeQuestion', () => {
    it('lowercases + collapses whitespace + strips trailing punctuation', () => {
      expect(normalizeQuestion('Who are our TOP 5 vendors?')).toBe('who are our top 5 vendors');
      expect(normalizeQuestion('  multiple   spaces   ')).toBe('multiple spaces');
      expect(normalizeQuestion('"smart quotes" inside')).toBe('"smart quotes" inside');
    });

    it('normalizes curly quotes to straight', () => {
      // Mojibake-resistant: curly quotes get folded for comparison.
      expect(normalizeQuestion("It’s the same")).toBe("it's the same");
    });

    it('returns empty for whitespace-only input', () => {
      expect(normalizeQuestion('   ')).toBe('');
    });
  });

  describe('rollUpTopQuestions', () => {
    it('groups questions by normalized form and sorts by count desc', () => {
      const rows = [
        { question: 'Who are our top vendors?', createdAt: '2026-05-10T00:00:00Z' },
        { question: 'who are our TOP vendors', createdAt: '2026-05-12T00:00:00Z' },
        { question: 'Who are our top vendors?', createdAt: '2026-05-15T00:00:00Z' },
        { question: 'What pressures matter?', createdAt: '2026-05-11T00:00:00Z' },
      ];
      const top = rollUpTopQuestions(rows, 10);
      expect(top).toHaveLength(2);
      expect(top[0].count).toBe(3);
      expect(top[0].lastAskedAt).toBe('2026-05-15T00:00:00Z');
      expect(top[1].count).toBe(1);
    });

    it('caps result at topN', () => {
      const rows = Array.from({ length: 20 }, (_, i) => ({
        question: `q${i}`,
        createdAt: '2026-05-15T00:00:00Z',
      }));
      const top = rollUpTopQuestions(rows, 5);
      expect(top).toHaveLength(5);
    });

    it('truncates question excerpts longer than 140 chars', () => {
      const long = 'X'.repeat(200);
      const top = rollUpTopQuestions([{ question: long, createdAt: '2026-05-15T00:00:00Z' }], 5);
      expect(top[0].questionExcerpt.length).toBe(138); // 137 chars + ellipsis = 138
      expect(top[0].questionExcerpt.endsWith('…')).toBe(true);
    });

    it('skips rows that normalize to empty', () => {
      const top = rollUpTopQuestions([
        { question: '   ', createdAt: '2026-05-15T00:00:00Z' },
        { question: 'real question', createdAt: '2026-05-15T00:00:00Z' },
      ]);
      expect(top).toHaveLength(1);
      expect(top[0].questionExcerpt).toBe('real question');
    });
  });

  describe('toSubstrateSnapshot', () => {
    it('emits 15 coverage tiles with zero counts when overview is null', () => {
      const s = toSubstrateSnapshot(null);
      expect(s.coverageTiles).toHaveLength(15);
      expect(s.coverageTiles.every((t) => t.rowCount === 0)).toBe(true);
      expect(s.contextCards).toEqual([]);
      expect(s.totalEvidence).toBe(0);
    });

    it('maps recordTypeCounts to coverage tiles when overview is populated', () => {
      const overview: EnterpriseContextOverview = {
        tenantKey: 'apexretail',
        tenantName: 'Apex Retail Group',
        counts: {
          sources: 11,
          records: 1029,
          facts: 11410,
          relationships: 220,
          evidence: 964,
          qualityIssues: 146,
          stewardshipTasks: 0,
          chunkQueue: 1029,
        },
        recordTypeCounts: {
          org_decision_rights: 40,
          renewal_calendar: 24,
          incidents: 180,
        },
        freshnessCounts: {},
        sourceSystems: ['ServiceNow'],
        evidenceUsableCount: 900,
        confidenceAverage: 0.84,
        qualitySummary: {},
        cards: [
          {
            key: 'platform-and-service-reliability',
            title: 'Platform and service reliability',
            whatWeKnow: '...',
            whyItMatters: '...',
            owner: 'CMDB Stewardship',
            freshness: 'fresh',
            confidence: '84%',
            evidenceCount: 1029,
            sourceSystems: ['ServiceNow'],
            actions: [],
          },
        ],
        contextInsights: [],
        sentinelFacts: [],
        vendorSpendRows: [],
      };

      const s = toSubstrateSnapshot(overview);
      expect(s.coverageTiles).toHaveLength(15);
      const orgTile = s.coverageTiles.find((t) => t.domain === 'org_decision_rights');
      expect(orgTile?.rowCount).toBe(40);
      const renewals = s.coverageTiles.find((t) => t.domain === 'renewal_calendar');
      expect(renewals?.rowCount).toBe(24);
      const spend = s.coverageTiles.find((t) => t.domain === 'spend_baseline');
      expect(spend?.rowCount).toBe(0); // not in recordTypeCounts
      expect(s.contextCards).toHaveLength(1);
      expect(s.contextCards[0].title).toBe('Platform and service reliability');
      expect(s.totalEvidence).toBe(964);
      expect(s.averageConfidence).toBeCloseTo(0.84);
    });
  });

  describe('summarizeAgentQuality', () => {
    it('summarizes guard telemetry for the requested tenant only', () => {
      const events: SynthesisViolationEvent[] = [
        {
          id: 'vlt_1',
          timestamp: '2026-05-15T00:00:00.000Z',
          route: '/api/chat/agent',
          surface: '/intelligence',
          tenantId: 'apex-retail',
          userId: null,
          violationCount: 0,
          violationTypes: [],
          violations: [],
          responseLength: 100,
        },
        {
          id: 'vlt_2',
          timestamp: '2026-05-15T00:01:00.000Z',
          route: '/api/chat/agent',
          surface: '/intelligence',
          tenantId: 'apex-retail',
          userId: null,
          violationCount: 2,
          violationTypes: ['sentinel-internal-consistency', 'fabricated-number'],
          violations: [
            { type: 'sentinel-internal-consistency', detail: 'bad date math' },
            { type: 'fabricated-number', detail: 'unsupported number' },
          ],
          responseLength: 200,
        },
        {
          id: 'vlt_3',
          timestamp: '2026-05-15T00:02:00.000Z',
          route: '/api/chat/agent',
          surface: '/intelligence',
          tenantId: 'meridian-health',
          userId: null,
          violationCount: 1,
          violationTypes: ['sentinel-voice-drift'],
          violations: [{ type: 'sentinel-voice-drift', detail: 'marketing phrase' }],
          responseLength: 120,
        },
      ];

      const summary = summarizeAgentQuality(events, 'apex-retail');
      expect(summary.recordedTurns).toBe(2);
      expect(summary.violationEvents).toBe(1);
      expect(summary.caughtViolationRate).toBe(0.5);
      expect(summary.sentinelInternalConsistencyEvents).toBe(1);
      expect(summary.byType).toEqual([
        { type: 'fabricated-number', count: 1 },
        { type: 'sentinel-internal-consistency', count: 1 },
      ]);
    });

    it('returns a null rate when no turns are recorded', () => {
      const summary = summarizeAgentQuality([], 'apex-retail');
      expect(summary.recordedTurns).toBe(0);
      expect(summary.caughtViolationRate).toBeNull();
      expect(summary.byType).toEqual([]);
    });
  });
});
