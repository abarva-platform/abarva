// Behavior tests for the agent context-bundle trace spine (PR-1).
//
// These prove the governance contract the brief requires:
//  - the trace records what was INCLUDED and EXCLUDED (with reason);
//  - the model input is HASHED, never stored raw;
//  - redacted mode strips human-readable labels;
//  - the grounding report asserts retrieval preceded the model.
//
// Pure modules only (no DB, no server-only) so they run in CI/lab mode.

import {
  buildNexusTrace,
  buildSentinelTrace,
  computeConfidenceDistribution,
  nexusConfidenceToNumeric,
  type RawAskSource,
  type RawNexusSource,
} from '@/lib/agent-trace/build';
import { hashModelInput, redactTrace } from '@/lib/agent-trace/redaction';
import { AGENT_TRACE_VERSION, type TraceExcludedObject } from '@/lib/agent-trace/types';

const common = {
  questionId: 'q-1',
  tenantId: 'apexretail',
  tenantKey: 'apex-retail',
  surface: 'moves' as const,
  userIntent: 'research',
  modelInputHash: hashModelInput({ system: 'sys', user: 'usr' }),
  emittedAt: '2026-06-09T00:00:00.000Z',
};

describe('hashModelInput', () => {
  it('is deterministic for identical input', () => {
    const a = hashModelInput({ system: 'A', user: 'B' });
    const b = hashModelInput({ system: 'A', user: 'B' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when the input changes', () => {
    expect(hashModelInput({ system: 'A', user: 'B' })).not.toBe(
      hashModelInput({ system: 'A', user: 'C' }),
    );
  });

  it('separates system from user (no field-boundary collision)', () => {
    // "AB"+"" must not collide with "A"+"B".
    expect(hashModelInput({ system: 'AB', user: '' })).not.toBe(
      hashModelInput({ system: 'A', user: 'B' }),
    );
  });
});

describe('computeConfidenceDistribution', () => {
  it('buckets low/medium/high and computes stats', () => {
    const dist = computeConfidenceDistribution([
      { id: '1', kind: 'tenant_context', confidence: 0.2 },
      { id: '2', kind: 'tenant_context', confidence: 0.5 },
      { id: '3', kind: 'corpus_pattern', confidence: 0.9 },
      { id: '4', kind: 'corpus_pattern', confidence: null },
    ]);
    expect(dist.count).toBe(3);
    expect(dist.buckets).toEqual({ low: 1, medium: 1, high: 1 });
    expect(dist.min).toBeCloseTo(0.2);
    expect(dist.max).toBeCloseTo(0.9);
    expect(dist.mean).toBeCloseTo((0.2 + 0.5 + 0.9) / 3);
  });

  it('handles an empty set', () => {
    const dist = computeConfidenceDistribution([]);
    expect(dist).toEqual({
      count: 0,
      min: null,
      max: null,
      mean: null,
      buckets: { low: 0, medium: 0, high: 0 },
    });
  });
});

describe('buildNexusTrace', () => {
  const sources: RawNexusSource[] = [
    { id: 'p1', type: 'pattern', name: 'Contact Center AI', confidence: 'high' },
    { id: 'f1', type: 'client_fact', name: 'Apex revenue', confidence: 'medium' },
    { id: 'v1', type: 'vendor', name: 'Vendor X', confidence: 'low' },
  ];

  it('routes sources into the correct buckets', () => {
    const trace = buildNexusTrace({ ...common, sources, patternNamespace: 'retail' });
    expect(trace.retrieved_corpus_patterns.map((o) => o.id)).toEqual(['p1']);
    expect(trace.retrieved_tenant_context.map((o) => o.id).sort()).toEqual(['f1', 'v1']);
    expect(trace.agent).toBe('nexus');
    expect(trace.trace_version).toBe(AGENT_TRACE_VERSION);
  });

  it('stamps the pattern grounding namespace only on patterns', () => {
    const trace = buildNexusTrace({ ...common, sources, patternNamespace: 'retail' });
    expect(trace.retrieved_corpus_patterns[0].namespace).toBe('retail');
    expect(trace.retrieved_tenant_context[0].namespace).toBeNull();
  });

  it('asserts retrieval preceded the model in the grounding report', () => {
    const trace = buildNexusTrace({ ...common, sources });
    expect(trace.grounding_report.retrievalPrecededModel).toBe(true);
    expect(trace.grounding_report.bundleObjectCount).toBe(3);
    expect(trace.grounding_report.hasTenantEvidence).toBe(true);
    expect(trace.grounding_report.hasApprovedPattern).toBe(true);
  });

  it('records excluded objects with governance reasons', () => {
    const excluded: TraceExcludedObject[] = [
      { id: 'x1', kind: 'corpus_pattern', reason: 'not_reviewed' },
      { id: 'x2', kind: 'tenant_context', reason: 'tenant_mismatch' },
    ];
    const trace = buildNexusTrace({ ...common, sources, excluded });
    expect(trace.excluded_objects).toHaveLength(2);
    expect(trace.grounding_report.excludedByReason).toEqual({
      not_reviewed: 1,
      tenant_mismatch: 1,
    });
  });

  it('carries the hashed model input, never raw prompt text', () => {
    const trace = buildNexusTrace({ ...common, sources });
    expect(trace.model_input_hash).toMatch(/^[a-f0-9]{64}$/);
    const serialized = JSON.stringify(trace);
    expect(serialized).not.toContain('sys');
    expect(serialized).not.toContain('usr');
  });
});

describe('buildSentinelTrace', () => {
  const sources: RawAskSource[] = [
    { id: 'pat-1', type: 'PATTERN', name: 'IT Productivity', confidence: 0.8 },
    { id: 'ten-1', type: 'TENANT', name: 'Meridian fact', confidence: 0.6 },
    { id: null, type: 'WORLDVIEW', name: 'CXO trend', confidence: 0.3 },
  ];

  it('synthesizes a stable id when the source id is null', () => {
    const trace = buildSentinelTrace({
      ...common,
      surface: 'intelligence',
      sources,
    });
    const worldview = trace.retrieved_tenant_context.find((o) => o.kind === 'worldview');
    expect(worldview?.id).toBe('WORLDVIEW:CXO trend');
  });

  it('counts distinct source bases', () => {
    const trace = buildSentinelTrace({ ...common, surface: 'intelligence', sources });
    // patterns + tenant + worldview kinds → 3 distinct bases (no sourceBasis set).
    expect(trace.source_basis_count).toBeGreaterThanOrEqual(2);
  });

  it('starts all validation gates pending', () => {
    const trace = buildSentinelTrace({ ...common, surface: 'intelligence', sources });
    expect(trace.validation_status).toBe('pending');
    expect(trace.claim_validation_status).toBe('pending');
    expect(trace.tenant_isolation_status).toBe('pending');
  });
});

describe('redactTrace', () => {
  it('strips labels and details but keeps ids, kinds, reasons, and the hash', () => {
    const trace = buildNexusTrace({
      ...common,
      sources: [{ id: 'p1', type: 'pattern', name: 'Secret Pattern Name', confidence: 'high' }],
      excluded: [{ id: 'x1', kind: 'tenant_context', reason: 'restricted', detail: 'sensitive note' }],
      missingContext: ['some private topic'],
    });
    const redacted = redactTrace(trace);
    expect(redacted.redacted).toBe(true);
    const serialized = JSON.stringify(redacted);
    expect(serialized).not.toContain('Secret Pattern Name');
    expect(serialized).not.toContain('sensitive note');
    expect(serialized).not.toContain('some private topic');
    // Spine preserved:
    expect(redacted.retrieved_corpus_patterns[0].id).toBe('p1');
    expect(redacted.retrieved_corpus_patterns[0].kind).toBe('corpus_pattern');
    expect(redacted.excluded_objects[0].reason).toBe('restricted');
    expect(redacted.model_input_hash).toBe(trace.model_input_hash);
  });

  it('is idempotent', () => {
    const trace = buildNexusTrace({
      ...common,
      sources: [{ id: 'p1', type: 'pattern', name: 'Name', confidence: 'high' }],
    });
    const once = redactTrace(trace);
    const twice = redactTrace(once);
    expect(twice).toEqual(once);
  });
});

describe('nexusConfidenceToNumeric', () => {
  it('maps categorical confidence to numbers', () => {
    expect(nexusConfidenceToNumeric('high')).toBe(0.85);
    expect(nexusConfidenceToNumeric('medium')).toBe(0.55);
    expect(nexusConfidenceToNumeric('low')).toBe(0.25);
    expect(nexusConfidenceToNumeric(null)).toBeNull();
    expect(nexusConfidenceToNumeric(undefined)).toBeNull();
  });
});
