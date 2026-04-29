/**
 * validate_synthesis tool · PR-INT-E verification.
 *
 * The tool wraps three layers:
 *   1. runQualityGates() — provenance, voice, length, pattern shape.
 *   2. Pattern alignment via keyword overlap (same temporary
 *      substitute used by search_patterns).
 *   3. ContradictionTemplate detection across PROGRAM_LIFECYCLE_PATTERNS.
 *
 * Each layer surfaces its own artifact stream:
 *   - aligned patterns → `pattern-match`
 *   - fired contradictions → `contradiction-flag`
 * Quality-gate issues are returned in the tool's data payload (the
 * agent narrates them in prose; no separate artifact for now).
 */

import { validateSynthesisTool } from '../validateSynthesis';
import type { ToolContext } from '../../registry';

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));

import { getActiveClientRow } from '@/lib/active-client';
const mockedGetActiveClientRow = getActiveClientRow as jest.MockedFunction<typeof getActiveClientRow>;

interface CapturedWrites {
  buffer: string[];
  ctx: ToolContext;
}

function makeCtx(): CapturedWrites {
  const buffer: string[] = [];
  const ctx: ToolContext = {
    request: new Request('http://localhost/'),
    surface: '/intelligence',
    writer: {
      write(text: string) {
        buffer.push(text);
      },
    },
  };
  return { buffer, ctx };
}

const APEX_CLIENT = {
  id: 'apex-uuid',
  name: 'Apex Retail Group',
  industry_code: 'retail',
  key: 'apex-retail' as const,
};

describe('validateSynthesisTool', () => {
  beforeEach(() => {
    mockedGetActiveClientRow.mockReset();
  });

  it("registers only for '/intelligence'", () => {
    expect(validateSynthesisTool.surfaces).toEqual(['/intelligence']);
  });

  it('rejects empty text', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await validateSynthesisTool.handler({ text: '   ' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('invalid_text');
    }
  });

  it('returns no_active_client when getActiveClientRow returns null', async () => {
    mockedGetActiveClientRow.mockResolvedValue(null);
    const { ctx } = makeCtx();
    const result = await validateSynthesisTool.handler({ text: 'A short synthesis.' }, ctx);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('no_active_client');
    }
  });

  it('runs quality gates and returns issues in data payload', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await validateSynthesisTool.handler(
      { text: 'too short to pass.' },
      ctx,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gates).toBeDefined();
      const gates = result.data.gates as { pass: boolean; issues: Array<{ gate: string }> };
      expect(gates.pass).toBe(false);
      expect(gates.issues.some((issue) => issue.gate === 'length')).toBe(true);
    }
  });

  it('surfaces aligned patterns as pattern-match artifacts', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    // Mention CDP-relevant signals so the manifest's CDP-shaped
    // patterns score against the synthesis.
    const text =
      'We are activating a customer data platform programme to integrate identity ' +
      'resolution across point-of-sale and ecommerce channels. The pattern of orchestrating ' +
      'platform deployment with measured baselines is well-documented per pattern playbook v1.0.';
    const result = await validateSynthesisTool.handler({ text, maxAlignedPatterns: 5 }, ctx);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.aligned_patterns)).toBe(true);
    }
    expect(buffer.some((line) => line.includes('[[artifact:pattern-match]]'))).toBe(true);
  });

  it('fires contradiction-flag artifacts when detection keywords appear', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx, buffer } = makeCtx();
    // CDP contradiction template's detectionHint mentions vendors
    // claiming high identity-resolution rates against measured
    // fragmentation baselines. Use those phrases in the synthesis
    // so the keyword check scores it.
    const text =
      'The vendor claims out-of-the-box identity resolution and household match rates ' +
      'above 90% for our customer data platform programme. The Discovery fragmentation ' +
      'baseline shows lower deterministic overlap across point-of-sale source systems. ' +
      'Per the playbook, this pattern needs a remediation track baseline source-of-truth.';
    const result = await validateSynthesisTool.handler(
      { text, maxContradictions: 5 },
      ctx,
    );
    expect(result.success).toBe(true);
    expect(buffer.some((line) => line.includes('[[artifact:contradiction-flag]]'))).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.contradictions)).toBe(true);
      expect((result.data.contradictions as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it('respects againstPatterns scope filter', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const result = await validateSynthesisTool.handler(
      {
        text:
          'Analytics modernization synthesis: orchestrate platform consolidation across data ' +
          'fabric, lakehouse, and pattern playbook. Per pattern playbook v1.',
        againstPatterns: ['pattern_analytics_modernization'],
      },
      ctx,
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const aligned = result.data.aligned_patterns as Array<{ pattern_id: string }>;
      // When scoped, only the named pattern (or its slug) can appear.
      expect(aligned.every((entry) => entry.pattern_id === 'pattern_analytics_modernization')).toBe(
        true,
      );
    }
  });

  it('clamps maxAlignedPatterns and maxContradictions to bounds', async () => {
    mockedGetActiveClientRow.mockResolvedValue(APEX_CLIENT);
    const { ctx } = makeCtx();
    const text =
      'Vendor claim baseline pattern playbook customer data platform identity resolution ' +
      'household match rate cohort n=500. Per pattern v1.0.';
    const result = await validateSynthesisTool.handler(
      { text, maxAlignedPatterns: 999, maxContradictions: 999 },
      ctx,
    );
    if (result.success) {
      expect((result.data.aligned_patterns as unknown[]).length).toBeLessThanOrEqual(8);
      expect((result.data.contradictions as unknown[]).length).toBeLessThanOrEqual(8);
    }
  });
});
