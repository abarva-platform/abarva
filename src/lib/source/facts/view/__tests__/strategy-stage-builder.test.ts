import { buildStrategyStageView } from '../strategy-stage-builder';

describe('Strategy intelligence grounding', () => {
  it('does not present an uncited benchmark or sponsor approval as a universal fact', () => {
    const view = buildStrategyStageView({
      provenance: 'live',
      facts: {
        sponsor: 'Event Owner',
        mandate: 'Run a synthetic sourcing workflow',
        valueThesis: 'Planning target pending baseline',
      },
    });
    const intel = view.intel.points.map((point) => point.text).join(' ');
    expect(intel).not.toMatch(/18.24%|comparable events/i);
    expect(intel).not.toMatch(/sponsor.backed|sponsor sign.off/i);
  });
});
