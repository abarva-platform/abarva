import { buildSourceCommercialSignalsView } from '../source-commercial-signals-view';

describe('buildSourceCommercialSignalsView', () => {
  it('keeps the legacy deterministic view for legacy callers', () => {
    const view = buildSourceCommercialSignalsView('apex-retail');

    expect(view.deterministicSeed).toBe(true);
    expect(view.eventSummary.eventId).toBe('src-ams-2026');
    expect(view.signals).toHaveLength(5);
  });

  it('blocks governed foundation tenants from the Tower Source commercial fixture', () => {
    expect(() => buildSourceCommercialSignalsView('airline-demo-new')).toThrow(
      /governed_foundation_tenant/,
    );
  });
});
