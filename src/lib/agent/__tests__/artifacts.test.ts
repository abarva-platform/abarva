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

describe('extractArtifacts · sourcing artifacts', () => {
  it('parses vendor-card with optional risk flags and pattern id', () => {
    const result = extractArtifacts(
      '[[artifact:vendor-card]]{"vendorId":"ven-servicenow","name":"ServiceNow","tier":"enterprise","positioning":"Strong ITSM-led AMS incumbent candidate.","riskFlags":["Incumbent lock-in"],"patternId":"PAT-SRC-VEN-ITSM-AMS"}[[/artifact]]',
    );
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'vendor-card',
      vendorId: 'ven-servicenow',
      name: 'ServiceNow',
      tier: 'enterprise',
      riskFlags: ['Incumbent lock-in'],
      patternId: 'PAT-SRC-VEN-ITSM-AMS',
    });
  });

  it('parses pricing-benchmark with citation discipline fields', () => {
    const result = extractArtifacts(
      '[[artifact:pricing-benchmark]]{"category":"AMS managed services","metric":"monthly run-rate per application","median":4200,"p25":3100,"p75":6100,"source":"Apex benchmark pack","sampleSize":18,"patternId":"PAT-SRC-PRC-AMS-RUN-RATE"}[[/artifact]]',
    );
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'pricing-benchmark',
      category: 'AMS managed services',
      median: 4200,
      source: 'Apex benchmark pack',
      sampleSize: 18,
    });
  });

  it('parses contract-clause, BAFO scoreboard, walkaway, and sourcing stage signals', () => {
    const input =
      '[[artifact:contract-clause]]{"clauseId":"exit-assistance-rate-card","title":"Exit assistance rate card","currentLanguage":"Reasonable transition assistance.","recommendedLanguage":"Attach roles, rate caps, and 120-day transfer window.","leverage":"BAFO is still open.","patternId":"PAT-SRC-CON-EXIT-ASSISTANCE"}[[/artifact]]' +
      '[[artifact:bafo-scoreboard]]{"vendors":[{"vendorId":"ven-a","name":"Vendor A"},{"vendorId":"ven-b","name":"Vendor B"}],"dimensions":[{"label":"Commercial fit","weight":35},{"label":"Transition risk","weight":25}],"scoresMatrix":[[82,68],[76,84]],"notes":"Vendor B carries less transition risk."}[[/artifact]]' +
      '[[artifact:walkaway-signal]]{"credibility":"soft","reasoning":"Two alternatives exist, but neither has dates locked.","recommendation":"Lock challenger availability before threatening walkaway."}[[/artifact]]' +
      '[[artifact:sourcing-stage-progress]]{"evidenceItemId":"bafo-calendar-locked","label":"BAFO calendar locked","severity":"hard","status":"unmet","detail":"Dates are still tentative."}[[/artifact]]' +
      '[[artifact:sourcing-stage-changed]]{"eventId":"apex-retail-ams-outsourcing-2026","fromStage":5,"toStage":6,"snapshotId":"snap-src-001"}[[/artifact]]';
    const result = extractArtifacts(input);

    expect(result.artifacts.map((artifact) => artifact.type)).toEqual([
      'contract-clause',
      'bafo-scoreboard',
      'walkaway-signal',
      'sourcing-stage-progress',
      'sourcing-stage-changed',
    ]);
    expect(result.artifacts[1]).toMatchObject({
      type: 'bafo-scoreboard',
      vendors: [
        { vendorId: 'ven-a', name: 'Vendor A' },
        { vendorId: 'ven-b', name: 'Vendor B' },
      ],
      scoresMatrix: [
        [82, 68],
        [76, 84],
      ],
    });
    expect(result.artifacts[4]).toMatchObject({
      type: 'sourcing-stage-changed',
      eventId: 'apex-retail-ams-outsourcing-2026',
      fromStage: 5,
      toStage: 6,
    });
  });

  it('rejects malformed sourcing payloads without crashing', () => {
    const result = extractArtifacts(
      '[[artifact:vendor-card]]{"vendorId":"ven-x","name":"Vendor X","tier":"mega","positioning":"Invalid tier."}[[/artifact]]' +
        '[[artifact:bafo-scoreboard]]{"vendors":[{"vendorId":"ven-a","name":"Vendor A"}],"dimensions":[{"label":"Commercial","weight":50}],"scoresMatrix":[[90,91]]}[[/artifact]]',
    );
    expect(result.artifacts).toHaveLength(0);
    expect(result.visibleText).toContain('[[artifact:vendor-card parse-failed]]');
    expect(result.visibleText).toContain('[[artifact:bafo-scoreboard parse-failed]]');
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

describe('extractArtifacts · Surface 2 program-detail artifacts', () => {
  it('accepts gate-evaluation with all four valid statuses', () => {
    for (const status of ['met', 'unmet', 'pending', 'blocked'] as const) {
      const r = extractArtifacts(
        `[[artifact:gate-evaluation]]{"gate":"Build gate · privacy","status":"${status}","detail":"x","reasoning":"y"}[[/artifact]]`,
      );
      expect(r.artifacts).toHaveLength(1);
      expect(r.artifacts[0]).toMatchObject({
        type: 'gate-evaluation',
        gate: 'Build gate · privacy',
        status,
        detail: 'x',
        reasoning: 'y',
      });
    }
  });

  it('rejects gate-evaluation with an unknown status', () => {
    const r = extractArtifacts(
      '[[artifact:gate-evaluation]]{"gate":"Build gate","status":"in-progress"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('parses evidence-highlight with required + optional fields', () => {
    const r = extractArtifacts(
      '[[artifact:evidence-highlight]]{"evidenceId":"EV-CDP-013","label":"Vendor C contract","reason":"Privacy clauses missing on p14."}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'evidence-highlight',
      evidenceId: 'EV-CDP-013',
      label: 'Vendor C contract',
      reason: 'Privacy clauses missing on p14.',
    });
  });

  it('parses phase-recommendation with blockers + nextActions arrays', () => {
    const r = extractArtifacts(
      '[[artifact:phase-recommendation]]{"phase":3,"recommendation":"Hold on advancing to Build.","blockers":["Privacy attestation outstanding"],"nextActions":["Schedule privacy review"]}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'phase-recommendation',
      phase: 3,
      recommendation: 'Hold on advancing to Build.',
      blockers: ['Privacy attestation outstanding'],
      nextActions: ['Schedule privacy review'],
    });
  });

  it('rejects phase-recommendation with out-of-range phase', () => {
    const r = extractArtifacts(
      '[[artifact:phase-recommendation]]{"phase":99,"recommendation":"x"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('parses program-focus', () => {
    const r = extractArtifacts(
      '[[artifact:program-focus]]{"programId":"APX-CC-2026","name":"Contact Center AI","currentPhase":"P4 Build"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'program-focus',
      programId: 'APX-CC-2026',
      name: 'Contact Center AI',
      currentPhase: 'P4 Build',
    });
  });
});

describe('extractArtifacts · Surface 2 PR-B phase-pack visibility', () => {
  it('parses phase-progress with all three valid statuses', () => {
    for (const status of ['met', 'unmet', 'unknown'] as const) {
      const r = extractArtifacts(
        `[[artifact:phase-progress]]{"evidenceItemId":"charter-signed-off","label":"Charter signed off","severity":"hard","status":"${status}","detail":"sponsor draft only"}[[/artifact]]`,
      );
      expect(r.artifacts).toHaveLength(1);
      expect(r.artifacts[0]).toMatchObject({
        type: 'phase-progress',
        evidenceItemId: 'charter-signed-off',
        label: 'Charter signed off',
        severity: 'hard',
        status,
        detail: 'sponsor draft only',
      });
    }
  });

  it('parses phase-progress without optional detail', () => {
    const r = extractArtifacts(
      '[[artifact:phase-progress]]{"evidenceItemId":"x","label":"X","severity":"soft","status":"unknown"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'phase-progress',
      evidenceItemId: 'x',
      label: 'X',
      severity: 'soft',
      status: 'unknown',
    });
    expect((r.artifacts[0] as { detail?: string }).detail).toBeUndefined();
  });

  it('rejects phase-progress with unknown status', () => {
    const r = extractArtifacts(
      '[[artifact:phase-progress]]{"evidenceItemId":"x","label":"X","severity":"hard","status":"in-progress"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('rejects phase-progress with bad severity', () => {
    const r = extractArtifacts(
      '[[artifact:phase-progress]]{"evidenceItemId":"x","label":"X","severity":"medium","status":"met"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('rejects phase-progress with empty evidenceItemId', () => {
    const r = extractArtifacts(
      '[[artifact:phase-progress]]{"evidenceItemId":"","label":"X","severity":"hard","status":"met"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('parses anti-pattern-flag with all required fields', () => {
    const r = extractArtifacts(
      '[[artifact:anti-pattern-flag]]{"antiPatternId":"phantom-sponsor","label":"The Phantom Sponsor","detectedSignal":"User cannot describe sponsor calendar commitment","whatToFlag":"Sponsor pattern looks delegated; high probability of stalling at first decision.","mitigation":"Insist on a recurring sponsor cadence on the calendar before close."}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'anti-pattern-flag',
      antiPatternId: 'phantom-sponsor',
      label: 'The Phantom Sponsor',
    });
  });

  it('rejects anti-pattern-flag missing whatToFlag', () => {
    const r = extractArtifacts(
      '[[artifact:anti-pattern-flag]]{"antiPatternId":"x","label":"X","detectedSignal":"y","mitigation":"z"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
  });

  it('rejects anti-pattern-flag with empty detectedSignal', () => {
    const r = extractArtifacts(
      '[[artifact:anti-pattern-flag]]{"antiPatternId":"x","label":"X","detectedSignal":"","whatToFlag":"y","mitigation":"z"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(0);
    expect(r.visibleText).toContain('parse-failed');
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

describe('extractArtifacts · Surface 2 PR-L program-phase-changed', () => {
  it('parses program-phase-changed with required fields', () => {
    const r = extractArtifacts(
      '[[artifact:program-phase-changed]]{"programId":"apx-cdp-2026","fromPhase":3,"toPhase":4,"snapshotId":"snap-123"}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'program-phase-changed',
      programId: 'apx-cdp-2026',
      fromPhase: 3,
      toPhase: 4,
      snapshotId: 'snap-123',
    });
  });

  it('parses program-phase-changed without optional snapshotId', () => {
    const r = extractArtifacts(
      '[[artifact:program-phase-changed]]{"programId":"p","fromPhase":2,"toPhase":3}[[/artifact]]',
    );
    expect(r.artifacts).toHaveLength(1);
    expect(r.artifacts[0]).toMatchObject({
      type: 'program-phase-changed',
      programId: 'p',
      fromPhase: 2,
      toPhase: 3,
    });
    expect((r.artifacts[0] as { snapshotId?: string }).snapshotId).toBeUndefined();
  });

  it('rejects program-phase-changed with out-of-range phase', () => {
    expect(
      extractArtifacts(
        '[[artifact:program-phase-changed]]{"programId":"p","fromPhase":3,"toPhase":7}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
    expect(
      extractArtifacts(
        '[[artifact:program-phase-changed]]{"programId":"p","fromPhase":-1,"toPhase":4}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });

  it('rejects program-phase-changed with non-numeric phase', () => {
    expect(
      extractArtifacts(
        '[[artifact:program-phase-changed]]{"programId":"p","fromPhase":"3","toPhase":4}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });

  it('rejects program-phase-changed with empty programId', () => {
    expect(
      extractArtifacts(
        '[[artifact:program-phase-changed]]{"programId":"","fromPhase":3,"toPhase":4}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });
});

describe('extractArtifacts · graph-neighborhood (PR-INT-D)', () => {
  it('parses a well-formed graph-neighborhood artifact', () => {
    const input =
      '[[artifact:graph-neighborhood]]{"rootId":"pattern_ai_use_case_portfolio","rootLabel":"AI Use Case Portfolio Management","nodeCount":11,"edgeCount":10,"topEdges":[{"targetId":"pattern_analytics_modernization","targetLabel":"Analytics Modernization","edgeType":"co_applies_with"}]}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'graph-neighborhood',
      rootId: 'pattern_ai_use_case_portfolio',
      rootLabel: 'AI Use Case Portfolio Management',
      nodeCount: 11,
      edgeCount: 10,
    });
    if (result.artifacts[0].type === 'graph-neighborhood') {
      expect(result.artifacts[0].topEdges).toEqual([
        {
          targetId: 'pattern_analytics_modernization',
          targetLabel: 'Analytics Modernization',
          edgeType: 'co_applies_with',
        },
      ]);
    }
  });

  it('drops malformed edges but keeps the rest', () => {
    const input =
      '[[artifact:graph-neighborhood]]{"rootId":"r","rootLabel":"Root","nodeCount":3,"edgeCount":2,"topEdges":[' +
      '{"targetId":"a","targetLabel":"A","edgeType":"co_applies_with"},' +
      '{"targetId":"b","edgeType":"co_applies_with"},' +
      '{"targetId":"c","targetLabel":"C","edgeType":"unknown"}' +
      ']}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(1);
    if (result.artifacts[0].type === 'graph-neighborhood') {
      expect(result.artifacts[0].topEdges).toHaveLength(1);
      expect(result.artifacts[0].topEdges[0].targetId).toBe('a');
    }
  });

  it('rejects non-array topEdges', () => {
    expect(
      extractArtifacts(
        '[[artifact:graph-neighborhood]]{"rootId":"r","rootLabel":"R","nodeCount":1,"edgeCount":0,"topEdges":"none"}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });

  it('rejects negative counts', () => {
    expect(
      extractArtifacts(
        '[[artifact:graph-neighborhood]]{"rootId":"r","rootLabel":"R","nodeCount":-1,"edgeCount":0,"topEdges":[]}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });

  it('rejects empty rootId or rootLabel', () => {
    expect(
      extractArtifacts(
        '[[artifact:graph-neighborhood]]{"rootId":"","rootLabel":"R","nodeCount":1,"edgeCount":0,"topEdges":[]}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
    expect(
      extractArtifacts(
        '[[artifact:graph-neighborhood]]{"rootId":"r","rootLabel":"","nodeCount":1,"edgeCount":0,"topEdges":[]}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });
});

describe('extractArtifacts · contradiction-flag (PR-INT-D)', () => {
  it('parses a well-formed contradiction-flag artifact', () => {
    const input =
      '[[artifact:contradiction-flag]]{"contradictionId":"vendor-savings-vs-measured","label":"Vendor savings claim vs measured reality","severity":"high","partyA":"Vendor benchmark","partyB":"Measured run-rate","detectionDescription":"Vendor cites 22% savings; tenant measures 7%.","resolutionPath":"Pull baseline source-of-truth and re-cite."}[[/artifact]]';
    const result = extractArtifacts(input);
    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'contradiction-flag',
      contradictionId: 'vendor-savings-vs-measured',
      severity: 'high',
      partyA: 'Vendor benchmark',
      partyB: 'Measured run-rate',
    });
  });

  it("rejects severity outside 'low' | 'medium' | 'high'", () => {
    expect(
      extractArtifacts(
        '[[artifact:contradiction-flag]]{"contradictionId":"c1","label":"L","severity":"critical","partyA":"A","partyB":"B","detectionDescription":"d","resolutionPath":"r"}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });

  it('rejects empty required fields', () => {
    expect(
      extractArtifacts(
        '[[artifact:contradiction-flag]]{"contradictionId":"","label":"L","severity":"low","partyA":"A","partyB":"B","detectionDescription":"d","resolutionPath":"r"}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
    expect(
      extractArtifacts(
        '[[artifact:contradiction-flag]]{"contradictionId":"c","label":"","severity":"low","partyA":"A","partyB":"B","detectionDescription":"d","resolutionPath":"r"}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
    expect(
      extractArtifacts(
        '[[artifact:contradiction-flag]]{"contradictionId":"c","label":"L","severity":"low","partyA":"A","partyB":"B","detectionDescription":"","resolutionPath":"r"}[[/artifact]]',
      ).artifacts,
    ).toHaveLength(0);
  });
});
