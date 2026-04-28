import {
  buildBafoNegotiationViewModel,
  SourceBafoNegotiationViewContext,
  SourceBafoNegotiationViewModel,
} from '../../../lib/source/source-bafo-negotiation-view';
import {
  SourceBafoNegotiationModelPanel,
  SourceBafoNegotiationModelPanelProps,
} from '../../../components/source/SourceBafoNegotiationModelPanel';

const ctx: SourceBafoNegotiationViewContext = {
  eventId: 'evt-bafo-test',
  eventName: 'BAFO Test',
  vendorIds: ['vendor-a', 'vendor-b'],
  stage: 'bafo',
};

describe('source-bafo-negotiation-view - buildBafoNegotiationViewModel', () => {
  let vm: SourceBafoNegotiationViewModel;
  beforeAll(() => { vm = buildBafoNegotiationViewModel(ctx); });

  it('returns correct eventId', () => { expect(vm.summary.eventId).toBe('evt-bafo-test'); });
  it('topLevers has at most 3', () => { expect(vm.topLevers.length).toBeLessThanOrEqual(3); });
  it('topOpportunities has at most 3', () => { expect(vm.topOpportunities.length).toBeLessThanOrEqual(3); });
  it('caveat is non-empty', () => { expect(vm.caveat.length).toBeGreaterThan(0); });
  it('missingInputs is empty for valid bafo input', () => { expect(vm.missingInputs).toHaveLength(0); });
  it('missingInputs warns when not bafo stage', () => {
    const vm2 = buildBafoNegotiationViewModel({ ...ctx, stage: 'rfp' });
    expect(vm2.missingInputs.some((m) => m.toLowerCase().includes('bafo'))).toBe(true);
  });
  it('is deterministic', () => {
    expect(JSON.stringify(buildBafoNegotiationViewModel(ctx))).toBe(JSON.stringify(buildBafoNegotiationViewModel(ctx)));
  });
});

describe('SourceBafoNegotiationModelPanel - type shape', () => {
  it('exports as a function', () => { expect(typeof SourceBafoNegotiationModelPanel).toBe('function'); });
  it('constructs valid props', () => {
    const vm = buildBafoNegotiationViewModel(ctx);
    const props: SourceBafoNegotiationModelPanelProps = { viewModel: vm };
    expect(props.viewModel.summary.eventId).toBe('evt-bafo-test');
  });
});
