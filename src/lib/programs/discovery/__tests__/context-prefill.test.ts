import { emptyDiscoveryShape, captureField } from '../discovery-intake';
import { applyContextToShape, type ContextFact } from '../context-prefill';

const facts: ContextFact[] = [
  { kind: 'system', label: 'Epic Clarity', domain: 'clinical' },
  { kind: 'system', label: 'UKG Pro', domain: 'workforce' },
  { kind: 'fact', label: 'Health system on Epic' },
  { kind: 'fact', label: 'industry = healthcare' },
];

describe('applyContextToShape — context-layer pre-fill (don\'t-ask-what-we-know)', () => {
  it('maps systems to confirmed, context-sourced landscape facts', () => {
    const out = applyContextToShape(emptyDiscoveryShape(), facts);
    expect(out.landscape.value).toHaveLength(2);
    expect(out.landscape.sources).toEqual(['context']);
    expect(out.landscape.value?.[0]).toMatchObject({
      domain: 'clinical',
      system: 'Epic Clarity',
      source: 'context',
      review: 'confirmed',
    });
  });

  it('maps general facts into `known`, deduplicated', () => {
    const seeded = { ...emptyDiscoveryShape(), known: ['Health system on Epic'] };
    const out = applyContextToShape(seeded, facts);
    expect(out.known).toEqual(['Health system on Epic', 'industry = healthcare']);
  });

  it('appends to an existing landscape rather than clobbering', () => {
    const shape = emptyDiscoveryShape();
    shape.landscape = captureField(shape.landscape, [
      { domain: 'financial', system: 'SAP', source: 'upload', review: 'review_pending' },
    ], 'upload');
    const out = applyContextToShape(shape, facts);
    expect(out.landscape.value).toHaveLength(1 + 2);
    expect(out.landscape.sources.sort()).toEqual(['context', 'upload']);
  });

  it('is a no-op (same reference) for an empty fact set', () => {
    const shape = emptyDiscoveryShape();
    expect(applyContextToShape(shape, [])).toBe(shape);
  });

  it('never mutates the input shape', () => {
    const shape = emptyDiscoveryShape();
    const before = JSON.stringify(shape);
    applyContextToShape(shape, facts);
    expect(JSON.stringify(shape)).toEqual(before);
  });
});
