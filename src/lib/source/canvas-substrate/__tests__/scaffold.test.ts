import {
  buildEventScaffold,
  expectedScaffoldRowCount,
} from '../scaffold';
import {
  SOURCE_ARTIFACT_SPECS,
  SOURCE_GATE_CRITERIA,
  SOURCE_EVIDENCE_REQUIREMENTS,
} from '../../canonical-specs';

describe('buildEventScaffold', () => {
  const input = {
    sourceEventId: 'evt-12345',
    tenantKey: 'apexretail',
  };

  it('produces one artifact-state row per canonical spec', () => {
    const out = buildEventScaffold(input);
    expect(out.artifactStates.length).toBe(SOURCE_ARTIFACT_SPECS.length);
  });

  it('produces one criterion-state row per canonical criterion', () => {
    const out = buildEventScaffold(input);
    expect(out.gateCriterionStates.length).toBe(SOURCE_GATE_CRITERIA.length);
  });

  it('produces one evidence-state row per canonical requirement', () => {
    const out = buildEventScaffold(input);
    expect(out.evidenceStates.length).toBe(SOURCE_EVIDENCE_REQUIREMENTS.length);
  });

  it('every artifact-state row carries event id + tenant key', () => {
    const out = buildEventScaffold(input);
    for (const row of out.artifactStates) {
      expect(row.source_event_id).toBe(input.sourceEventId);
      expect(row.tenant_key).toBe(input.tenantKey);
      expect(row.status).toBe('not_started');
      expect(row.tier).toBe('stub');
    }
  });

  it('every criterion-state row defaults to pending', () => {
    const out = buildEventScaffold(input);
    for (const row of out.gateCriterionStates) {
      expect(row.state).toBe('pending');
      expect(row.source_event_id).toBe(input.sourceEventId);
    }
  });

  it('every evidence-state row defaults to Not Requested', () => {
    const out = buildEventScaffold(input);
    for (const row of out.evidenceStates) {
      expect(row.current_state).toBe('Not Requested');
      expect(row.source_event_id).toBe(input.sourceEventId);
    }
  });

  it('artifact codes round-trip from spec to row exactly', () => {
    const out = buildEventScaffold(input);
    const codes = out.artifactStates.map((r) => r.artifact_code).sort();
    const specCodes = SOURCE_ARTIFACT_SPECS.map((s) => s.code).sort();
    expect(codes).toEqual(specCodes);
  });

  it('preserves gate-defining flag from spec', () => {
    const out = buildEventScaffold(input);
    const rowByCode = new Map(out.artifactStates.map((r) => [r.artifact_code, r]));
    for (const spec of SOURCE_ARTIFACT_SPECS) {
      const row = rowByCode.get(spec.code);
      expect(row?.gate_defining).toBe(spec.gateDefining);
      expect(row?.requirement_level).toBe(spec.requirementLevel);
    }
  });

  it('criterion ids round-trip exactly', () => {
    const out = buildEventScaffold(input);
    const ids = out.gateCriterionStates.map((r) => r.criterion_id).sort();
    const canonicalIds = SOURCE_GATE_CRITERIA.map((c) => c.criterionId).sort();
    expect(ids).toEqual(canonicalIds);
  });

  it('evidence requirement ids round-trip exactly', () => {
    const out = buildEventScaffold(input);
    const ids = out.evidenceStates.map((r) => r.requirement_id).sort();
    const canonicalIds = SOURCE_EVIDENCE_REQUIREMENTS.map((e) => e.requirementId).sort();
    expect(ids).toEqual(canonicalIds);
  });
});

describe('expectedScaffoldRowCount', () => {
  it('matches the canonical catalog totals', () => {
    const counts = expectedScaffoldRowCount();
    expect(counts.artifactStates).toBe(SOURCE_ARTIFACT_SPECS.length);
    expect(counts.gateCriterionStates).toBe(SOURCE_GATE_CRITERIA.length);
    expect(counts.evidenceStates).toBe(SOURCE_EVIDENCE_REQUIREMENTS.length);
    expect(counts.total).toBe(
      SOURCE_ARTIFACT_SPECS.length +
        SOURCE_GATE_CRITERIA.length +
        SOURCE_EVIDENCE_REQUIREMENTS.length,
    );
  });

  it('produces the expected total for one event (sanity bound)', () => {
    const total = expectedScaffoldRowCount().total;
    // 33 artifacts + 47 criteria + 23 evidence = 103 rows per event
    expect(total).toBeGreaterThanOrEqual(80);
    expect(total).toBeLessThanOrEqual(180);
  });
});
