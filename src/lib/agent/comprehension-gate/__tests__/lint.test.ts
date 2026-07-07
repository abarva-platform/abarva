import { gate } from '../lint';

describe('comprehension gate', () => {
  it('substitutes raw ids and internal codes with human labels', () => {
    const result = gate('Open signal:39901c16-2e8b-4c8c-80aa-8a0182f26754 for source_event_id.', {
      tenantKey: 'apex-retail',
    });

    expect(result.blocked).toBe(false);
    expect(result.cleaned).toContain('portfolio signal');
    expect(result.cleaned).toContain('source event id');
    expect(result.detectedIssues).toHaveLength(2);
  });

  it('blocks unexplained acronyms outside the executive lexicon', () => {
    const result = gate('The QBRG owner should approve the Move.', {
      tenantKey: 'apex-retail',
    });

    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain('unexplained acronyms');
  });
});
