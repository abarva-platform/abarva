import {
  SOURCE_INTAKE_INTENTS,
  parseSourceIntakeIntent,
  getSourceIntakeShape,
  resolveSourceIntakeShape,
  type SourceIntakeIntent,
  type IntakeFieldId,
} from '../intake-intent';

const REQUIRED_FIELD_IDS: IntakeFieldId[] = [
  'trigger',
  'decisionOwner',
  'scopeBoundary',
  'valueTarget',
  'baselineOwner',
];

// The six mid-stream entry buttons on the Decision Queue link to
// `/source/new?intent=<id>`. These are the contract.
const QUEUE_ENTRY_INTENTS: SourceIntakeIntent[] = [
  'vendor',
  'renewal',
  'rfp-response',
  'business-request',
  'cut-spend',
  'compare-vendors',
];

describe('parseSourceIntakeIntent', () => {
  it('parses every known intent', () => {
    for (const intent of QUEUE_ENTRY_INTENTS) {
      expect(parseSourceIntakeIntent(intent)).toBe(intent);
    }
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(parseSourceIntakeIntent('  RENEWAL ')).toBe('renewal');
    expect(parseSourceIntakeIntent('Cut-Spend')).toBe('cut-spend');
  });

  it('takes the first value from an array param', () => {
    expect(parseSourceIntakeIntent(['vendor', 'renewal'])).toBe('vendor');
  });

  it('returns null for an unknown intent', () => {
    expect(parseSourceIntakeIntent('not-a-real-intent')).toBeNull();
  });

  it('returns null for missing / empty values (backward-compat path)', () => {
    expect(parseSourceIntakeIntent(null)).toBeNull();
    expect(parseSourceIntakeIntent(undefined)).toBeNull();
    expect(parseSourceIntakeIntent('')).toBeNull();
    expect(parseSourceIntakeIntent([])).toBeNull();
  });
});

describe('SOURCE_INTAKE_INTENTS', () => {
  it('exposes exactly the six Decision Queue entry intents', () => {
    expect([...SOURCE_INTAKE_INTENTS].sort()).toEqual([...QUEUE_ENTRY_INTENTS].sort());
  });
});

describe('getSourceIntakeShape', () => {
  it('returns a distinct, fully-shaped intake for each intent', () => {
    const headings = new Set<string>();
    const prompts = new Set<string>();
    for (const intent of QUEUE_ENTRY_INTENTS) {
      const shape = getSourceIntakeShape(intent);
      expect(shape).not.toBeNull();
      expect(shape!.intent).toBe(intent);

      // Each intent reshapes the header...
      expect(shape!.eyebrow.length).toBeGreaterThan(0);
      expect(shape!.heading.length).toBeGreaterThan(0);
      expect(shape!.subhead.length).toBeGreaterThan(0);

      // ...prefills the conversation...
      expect(shape!.prefilledPrompt.length).toBeGreaterThan(0);
      expect(shape!.initialQuote.length).toBeGreaterThan(0);

      // ...and steers downstream.
      expect(shape!.routingHint.label.length).toBeGreaterThan(0);
      expect(shape!.routingHint.description.length).toBeGreaterThan(0);

      headings.add(shape!.heading);
      prompts.add(shape!.prefilledPrompt);
    }
    // No two intents share a heading or a prefilled prompt — the reshape is real.
    expect(headings.size).toBe(QUEUE_ENTRY_INTENTS.length);
    expect(prompts.size).toBe(QUEUE_ENTRY_INTENTS.length);
  });

  it('keeps the five canonical field ids so the events API contract is unchanged', () => {
    for (const intent of QUEUE_ENTRY_INTENTS) {
      const shape = getSourceIntakeShape(intent)!;
      expect(shape.fields.map((f) => f.id)).toEqual(REQUIRED_FIELD_IDS);
      for (const field of shape.fields) {
        expect(field.label.length).toBeGreaterThan(0);
        expect(field.prompt.length).toBeGreaterThan(0);
        expect(field.placeholder.length).toBeGreaterThan(0);
      }
    }
  });

  it('routes renewal toward the Renewal Cockpit', () => {
    const shape = getSourceIntakeShape('renewal')!;
    expect(shape.routingHint.label).toMatch(/renewal cockpit/i);
    expect(shape.fields[0].label).toMatch(/contract/i);
  });

  it('routes rfp-response toward proposal normalization', () => {
    const shape = getSourceIntakeShape('rfp-response')!;
    expect(shape.routingHint.label).toMatch(/normaliz/i);
  });

  it('routes business-request toward the category classifier', () => {
    const shape = getSourceIntakeShape('business-request')!;
    expect(shape.routingHint.label).toMatch(/classifier/i);
  });

  it('routes cut-spend toward savings / shelfware analysis', () => {
    const shape = getSourceIntakeShape('cut-spend')!;
    expect(shape.routingHint.label).toMatch(/savings|shelfware/i);
  });

  it('routes compare-vendors toward a normalized scorecard', () => {
    const shape = getSourceIntakeShape('compare-vendors')!;
    expect(shape.routingHint.label).toMatch(/scorecard/i);
  });

  it('returns null for unknown / missing intents (generic intake fallback)', () => {
    expect(getSourceIntakeShape(null)).toBeNull();
    expect(getSourceIntakeShape(undefined)).toBeNull();
  });
});

describe('resolveSourceIntakeShape', () => {
  it('parses a raw query-param straight to a shape', () => {
    expect(resolveSourceIntakeShape('renewal')?.intent).toBe('renewal');
    expect(resolveSourceIntakeShape(' RFP-RESPONSE ')?.intent).toBe('rfp-response');
  });

  it('returns null when no intent param is present — preserving the generic intake', () => {
    expect(resolveSourceIntakeShape(null)).toBeNull();
    expect(resolveSourceIntakeShape(undefined)).toBeNull();
    expect(resolveSourceIntakeShape('garbage')).toBeNull();
  });
});
