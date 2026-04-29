/**
 * outputValidator — F0.3 verification (Programs Strict Completion v1.2)
 *
 * Covers each of the 5 violation types and their happy paths.
 * Validator is post-hoc telemetry; the structural mechanism for
 * action-claim integrity is F0.4 tool-use, so this validator does
 * NOT include action-claim violation types.
 */

import { validateSynthesisOutput } from '../outputValidator';

describe('outputValidator · uncited-pattern', () => {
  it('flags pattern IDs not present in retrieval', () => {
    const result = validateSynthesisOutput(
      'Per PAT-PRG-CDP-001 the lifecycle suggests Build gate next.',
      { retrievedPatternIds: ['PAT-PRG-AMS-001'] },
    );
    const types = result.violations.map((v) => v.type);
    expect(types).toContain('uncited-pattern');
    expect(result.valid).toBe(false);
  });

  it('does NOT flag patterns that ARE in retrieval', () => {
    const result = validateSynthesisOutput(
      'Per PAT-PRG-CDP-001 the lifecycle suggests Build gate next. [PAT-PRG-CDP-001: lifecycle].',
      { retrievedPatternIds: ['PAT-PRG-CDP-001'] },
    );
    expect(result.violations.filter((v) => v.type === 'uncited-pattern')).toEqual([]);
  });

  it('skips uncited-pattern check when retrievedPatternIds is undefined', () => {
    const result = validateSynthesisOutput('Per PAT-FAKE-999 ...', {});
    expect(result.violations.filter((v) => v.type === 'uncited-pattern')).toEqual([]);
  });
});

describe('outputValidator · fabricated-number', () => {
  it('flags dollar amounts not present in retrieval context', () => {
    const result = validateSynthesisOutput(
      'Vendor C costs $14M annually. [tenant-specific: based on Apex contract data].',
      { hasRetrieval: true, retrievedNumbers: ['$1.8M', '$2.4M'] },
    );
    expect(result.violations.some((v) => v.type === 'fabricated-number')).toBe(true);
  });

  it('flags percentages not in retrieval context', () => {
    const result = validateSynthesisOutput(
      'Vendor consolidation typically reduces TCO 87%. [PAT-FOO-001: source].',
      { hasRetrieval: true, retrievedNumbers: ['33%', '14%'], retrievedPatternIds: ['PAT-FOO-001'] },
    );
    expect(result.violations.some((v) => v.type === 'fabricated-number')).toBe(true);
  });

  it('does not flag numbers present in retrieval', () => {
    const result = validateSynthesisOutput(
      'Vendor C is $1.8M. [tenant-specific: contract data].',
      { hasRetrieval: true, retrievedNumbers: ['$1.8M'] },
    );
    expect(result.violations.filter((v) => v.type === 'fabricated-number')).toEqual([]);
  });

  it('skips number check when hasRetrieval is false', () => {
    const result = validateSynthesisOutput('That is around $50M annually.', {
      hasRetrieval: false,
    });
    expect(result.violations.filter((v) => v.type === 'fabricated-number')).toEqual([]);
  });
});

describe('outputValidator · undisclosed-fallback', () => {
  it('flags responses with specific numbers but no layer disclosure', () => {
    const result = validateSynthesisOutput(
      'AI cloud spend is at $2.4M annually. The benchmark is roughly 33% over budget. Negotiate the rate card to recover savings; vendor consolidation typically lands within a quarter.',
    );
    const types = result.violations.map((v) => v.type);
    expect(types).toContain('undisclosed-fallback');
  });

  it('does NOT flag when a layer disclosure phrase is present', () => {
    const result = validateSynthesisOutput(
      'AI cloud spend is at $2.4M [tenant-specific: based on Apex 2026 budget]. Recommend rate-card renegotiation for Q2 recovery.',
    );
    expect(result.violations.filter((v) => v.type === 'undisclosed-fallback')).toEqual([]);
  });

  it('does NOT flag general practice preface', () => {
    const result = validateSynthesisOutput(
      "Drawing on general practice (not AbarVa-specific): vendor consolidation tracks reduce TCO 12-18% on average; pair with retention guarantees to manage transition risk on the order of 30%.",
    );
    expect(result.violations.filter((v) => v.type === 'undisclosed-fallback')).toEqual([]);
  });

  it('skips short responses', () => {
    const result = validateSynthesisOutput('Sure.');
    expect(result.violations.filter((v) => v.type === 'undisclosed-fallback')).toEqual([]);
  });
});

describe('outputValidator · rigid-scope-refusal', () => {
  it('flags rigid refusal phrases without redirect', () => {
    const result = validateSynthesisOutput(
      "I'm sorry, vendor selection is outside my lane.",
    );
    expect(result.violations.some((v) => v.type === 'rigid-scope-refusal')).toBe(true);
  });

  it('soft-passes when refusal is paired with a redirect', () => {
    const result = validateSynthesisOutput(
      "Probably mid-70s in Tampa today. But you're not here for weather — here's what's pressing on your portfolio: APX-CDP-2026 Build gate.",
    );
    // The phrase "for weather" doesn't match rigid-refusal phrases, so
    // this is a clean small-talk handoff with redirect — no violation.
    expect(result.violations.filter((v) => v.type === 'rigid-scope-refusal')).toEqual([]);
  });

  it('catches "I can only discuss" boilerplate', () => {
    const result = validateSynthesisOutput(
      "I can only discuss program scope topics related to AI delivery patterns.",
    );
    expect(result.violations.some((v) => v.type === 'rigid-scope-refusal')).toBe(true);
  });
});

describe('outputValidator · malformed-citation-tag', () => {
  it('flags uppercase variants', () => {
    const result = validateSynthesisOutput('Reasoning [USER-CONTEXT: based on data].');
    expect(result.violations.some((v) => v.type === 'malformed-citation-tag')).toBe(true);
  });

  it('flags em-dash variant (no canonical colon)', () => {
    const result = validateSynthesisOutput('Reasoning [user-context — based on data].');
    expect(result.violations.some((v) => v.type === 'malformed-citation-tag')).toBe(true);
  });

  it('does NOT flag canonical [head: detail]', () => {
    const result = validateSynthesisOutput(
      'Reasoning [user-context: based on David CDP sponsorship].',
    );
    expect(result.violations.filter((v) => v.type === 'malformed-citation-tag')).toEqual([]);
  });
});

describe('outputValidator · happy path', () => {
  it('returns valid = true for a fully-cited, properly-disclosed response', () => {
    const result = validateSynthesisOutput(
      `Morning. Per [PAT-PRG-CDP-001: CDP lifecycle], the Build gate is the live concern. [tenant-specific: 2024 Vendor C selection] gives precedent for the consolidation argument.`,
      {
        retrievedPatternIds: ['PAT-PRG-CDP-001'],
        hasRetrieval: true,
        retrievedNumbers: [],
      },
    );
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns valid = true for an empty response (degenerate case)', () => {
    const result = validateSynthesisOutput('');
    expect(result.valid).toBe(true);
  });
});
