/**
 * Agent streaming artifacts — Surface 1 PR2 verification
 *
 * Locks in the sentinel parser. The grammar is
 *   [[artifact:<type>]]<JSON>[[/artifact]]
 * and the parser must:
 *   - extract well-formed artifacts and strip them from visible text
 *   - tolerate sentinels split across stream chunks (return remaining)
 *   - preserve non-artifact text verbatim
 *   - reject malformed JSON / unknown types without crashing
 */

import { extractArtifacts, type Artifact } from '../artifacts';

describe('extractArtifacts · happy path', () => {
  it('strips a single complete artifact and dispatches it', () => {
    const input =
      'I matched this to AMS Consolidation — see the card on your right. ' +
      '[[artifact:pattern-match]]{"patternId":"PAT-PRG-AMS-CONSOLIDATION-001","name":"AMS Consolidation","summary":"…","successRatePct":78,"deploymentCount":12}[[/artifact]] ' +
      'What timeline are you working with?';
    const result = extractArtifacts(input);
    expect(result.visibleText).not.toContain('[[artifact:');
    expect(result.visibleText).not.toContain('[[/artifact]]');
    expect(result.visibleText).toContain('I matched this to AMS Consolidation');
    expect(result.visibleText).toContain('What timeline are you working with?');
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'pattern-match',
      patternId: 'PAT-PRG-AMS-CONSOLIDATION-001',
      name: 'AMS Consolidation',
      successRatePct: 78,
      deploymentCount: 12,
    });
    expect(result.remaining).toBe('');
  });

  it('handles multiple artifacts in one stream', () => {
    const input =
      '[[artifact:brief-field]]{"field":"programName","value":"AMS Consolidation 2026"}[[/artifact]]' +
      ' Got it. ' +
      '[[artifact:classification]]{"archetype":"AMS_CONSOLIDATION","archetypeLabel":"AMS Consolidation","confidence":"high"}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(2);
    expect(result.artifacts[0]).toMatchObject({
      type: 'brief-field',
      field: 'programName',
      value: 'AMS Consolidation 2026',
    });
    expect(result.artifacts[1]).toMatchObject({
      type: 'classification',
      archetype: 'AMS_CONSOLIDATION',
      archetypeLabel: 'AMS Consolidation',
      confidence: 'high',
    });
    expect(result.visibleText.trim()).toBe('Got it.');
  });

  it('parses cross-program-dependency', () => {
    const input =
      'This overlaps with your CDP work. ' +
      '[[artifact:cross-program-dependency]]{"programId":"APX-CDP-2026","programName":"Apex Retail CDP Activation","currentPhase":"P3 Design"}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'cross-program-dependency',
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      currentPhase: 'P3 Design',
    });
  });
});

describe('extractArtifacts · streaming-chunk safety', () => {
  it('returns the unclosed artifact tail as `remaining` when the close sentinel is missing', () => {
    const input =
      'I matched this to AMS — ' +
      '[[artifact:pattern-match]]{"patternId":"PAT-PRG-AMS-CONSOLIDATION-001"';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(0);
    expect(result.visibleText).toContain('I matched this to AMS — ');
    expect(result.remaining.startsWith('[[artifact:pattern-match]]')).toBe(true);
  });

  it('completes the artifact when the next chunk supplies the close sentinel', () => {
    // Simulate two-chunk streaming: feed remaining + next-chunk back through.
    const chunk1 =
      'I matched this — [[artifact:brief-field]]{"field":"programName","value":"AMS';
    const r1 = extractArtifacts(chunk1);
    expect(r1.artifacts).toHaveLength(0);
    expect(r1.remaining.length).toBeGreaterThan(0);

    const chunk2 = ' Consolidation 2026"}[[/artifact]] What timeline?';
    const r2 = extractArtifacts(r1.remaining + chunk2);
    expect(r2.artifacts).toHaveLength(1);
    expect(r2.artifacts[0]).toMatchObject({
      type: 'brief-field',
      field: 'programName',
      value: 'AMS Consolidation 2026',
    });
    expect(r2.visibleText).toContain('What timeline?');
    expect(r2.remaining).toBe('');
  });

  it("defers a partial OPEN sentinel split across chunks (regression: '[[artifact:brief-fie' must not commit as visible)", () => {
    // The production bug: the open sentinel itself was split, so the
    // previous parser committed `[[artifact:brief-fie` as visible text
    // and the user saw raw artifact tuples.
    const chunk1 = 'Brief is shaping up. [[artifact:brief-fie';
    const r1 = extractArtifacts(chunk1);
    expect(r1.artifacts).toHaveLength(0);
    expect(r1.visibleText).toBe('Brief is shaping up. ');
    expect(r1.remaining).toBe('[[artifact:brief-fie');

    const chunk2 = 'ld]]{"field":"lead","value":"Lin Martinez"}[[/artifact]] Done.';
    const r2 = extractArtifacts(r1.remaining + chunk2);
    expect(r2.artifacts).toHaveLength(1);
    expect(r2.artifacts[0]).toMatchObject({
      type: 'brief-field',
      field: 'lead',
      value: 'Lin Martinez',
    });
    expect(r2.visibleText).toBe(' Done.');
    expect(r2.remaining).toBe('');
  });

  it('defers a single trailing `[[` (could be the start of any sentinel)', () => {
    const r = extractArtifacts('Some prose. [[');
    expect(r.visibleText).toBe('Some prose. ');
    expect(r.remaining).toBe('[[');
  });

  it('defers a trailing single `[` (might be the start of `[[`)', () => {
    const r = extractArtifacts('Trailing bracket [');
    expect(r.visibleText).toBe('Trailing bracket ');
    expect(r.remaining).toBe('[');
  });

  it('does NOT defer a literal `[bracket]` that is clearly not a sentinel', () => {
    const r = extractArtifacts('Plain text with [bracketed] content.');
    expect(r.visibleText).toBe('Plain text with [bracketed] content.');
    expect(r.remaining).toBe('');
  });

  it('handles open sentinel cleanly broken just at the colon', () => {
    const chunk1 = 'Hello. [[artifact:';
    const r1 = extractArtifacts(chunk1);
    expect(r1.visibleText).toBe('Hello. ');
    expect(r1.remaining).toBe('[[artifact:');
    const chunk2 = 'classification]]{"archetypeLabel":"AMS Consolidation"}[[/artifact]]';
    const r2 = extractArtifacts(r1.remaining + chunk2);
    expect(r2.artifacts).toHaveLength(1);
    expect(r2.artifacts[0]).toMatchObject({
      type: 'classification',
      archetypeLabel: 'AMS Consolidation',
    });
  });
});

describe('extractArtifacts · classification permissiveness', () => {
  it('accepts classification with only archetypeLabel and derives archetype', () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"archetypeLabel":"AMS Consolidation","confidence":"high"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'classification',
      archetypeLabel: 'AMS Consolidation',
      archetype: 'AMS_CONSOLIDATION',
      confidence: 'high',
    });
  });

  it('accepts classification with only archetype and uses it for both fields', () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"archetype":"CDP_ACTIVATION"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'classification',
      archetype: 'CDP_ACTIVATION',
      archetypeLabel: 'CDP_ACTIVATION',
    });
  });

  it("accepts classification with `name` alias (Steward's most common malformed shape)", () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"name":"AMS_CONSOLIDATION","confidence":"high"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'classification',
      archetype: 'AMS_CONSOLIDATION',
      archetypeLabel: 'AMS_CONSOLIDATION',
      confidence: 'high',
    });
  });

  it('accepts classification with `value` alias (matches brief-field-shape mistakes)', () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"value":"CDP Activation"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'classification',
      archetypeLabel: 'CDP Activation',
      archetype: 'CDP_ACTIVATION',
    });
  });

  it('accepts classification with `label` alias', () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"label":"Demand Forecasting","archetype":"DEMAND_FORECAST"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'classification',
      archetypeLabel: 'Demand Forecasting',
      archetype: 'DEMAND_FORECAST',
    });
  });

  it('rejects classification with neither field', () => {
    const r = extractArtifacts(
      '[[artifact:classification]]{"confidence":"high"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });
});

describe('extractArtifacts · malformed input', () => {
  it('surfaces malformed JSON as a parse-failed marker rather than crashing', () => {
    const input =
      '[[artifact:brief-field]]{"field":"programName","value":}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(0);
    expect(result.visibleText).toContain('parse-failed');
  });

  it('rejects unknown artifact types gracefully', () => {
    const input = '[[artifact:made-up-type]]{}[[/artifact]] tail.';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(0);
    expect(result.visibleText).toContain('parse-failed');
    expect(result.visibleText).toContain('tail.');
  });

  it('rejects brief-field with an out-of-allowed-set field name', () => {
    const input =
      '[[artifact:brief-field]]{"field":"random-thing","value":"x"}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(0);
    expect(result.visibleText).toContain('parse-failed');
  });

  it('preserves non-artifact text verbatim', () => {
    const input = 'Plain prose, no artifacts here. With a [bracket] inside.';
    const result = extractArtifacts(input);
    expect(result.visibleText).toBe(input);
    expect(result.artifacts).toHaveLength(0);
  });
});

describe('extractArtifacts · type-narrowing', () => {
  it('returns a discriminated union — caller can switch on `type`', () => {
    const input =
      '[[artifact:brief-field]]{"field":"sponsor","value":"Lin Martinez"}[[/artifact]]' +
      '[[artifact:pattern-match]]{"patternId":"PAT-FOO-001","name":"Foo","summary":"bar"}[[/artifact]]';
    const result = extractArtifacts(input);
    const withFields = result.artifacts.map((a: Artifact) => {
      switch (a.type) {
        case 'brief-field':
          return { kind: 'field', field: a.field, value: a.value };
        case 'pattern-match':
          return { kind: 'pattern', patternId: a.patternId };
        case 'classification':
          return { kind: 'classification' };
        case 'cross-program-dependency':
          return { kind: 'dep' };
      }
    });
    expect(withFields).toEqual([
      { kind: 'field', field: 'sponsor', value: 'Lin Martinez' },
      { kind: 'pattern', patternId: 'PAT-FOO-001' },
    ]);
  });
});
