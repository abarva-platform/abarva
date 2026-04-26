import {
  buildCommercialRiskViewModel,
  SourceCommercialRiskContext,
  SourceCommercialRiskViewModel,
} from '../../../lib/source/source-commercial-risk-view';
import {
  SourceCommercialRiskPanel,
  SourceCommercialRiskPanelProps,
} from '../../../components/source/SourceCommercialRiskPanel';

const riskyCtx: SourceCommercialRiskContext = {
  eventId: 'evt-risk-test',
  eventName: 'Risk Test',
  vendorIds: ['vendor-a'],
  hasIncompleteEvidence: true,
  hasPricingAnomalies: true,
  hasScopeAmbiguity: false,
  hasGovernanceGap: false,
};

const cleanCtx: SourceCommercialRiskContext = {
  eventId: 'evt-clean',
  eventName: 'Clean',
  vendorIds: [],
  hasIncompleteEvidence: false,
  hasPricingAnomalies: false,
  hasScopeAmbiguity: false,
  hasGovernanceGap: false,
};

describe('source-commercial-risk-view - buildCommercialRiskViewModel', () => {
  it('returns exceptions when flags set', () => {
    const vm = buildCommercialRiskViewModel(riskyCtx);
    expect(vm.detectionResult.totalCount).toBeGreaterThan(0);
  });
  it('topExceptions has at most 5', () => {
    const vm = buildCommercialRiskViewModel(riskyCtx);
    expect(vm.topExceptions.length).toBeLessThanOrEqual(5);
  });
  it('caveat is non-empty', () => {
    expect(buildCommercialRiskViewModel(cleanCtx).caveat.length).toBeGreaterThan(0);
  });
  it('missingInputs warns on no vendors', () => {
    const vm = buildCommercialRiskViewModel(cleanCtx);
    expect(vm.missingInputs.some((m) => m.toLowerCase().includes('vendor'))).toBe(true);
  });
  it('is deterministic', () => {
    expect(JSON.stringify(buildCommercialRiskViewModel(riskyCtx))).toBe(JSON.stringify(buildCommercialRiskViewModel(riskyCtx)));
  });
});

describe('SourceCommercialRiskPanel - type shape', () => {
  it('exports as a function', () => { expect(typeof SourceCommercialRiskPanel).toBe('function'); });
  it('constructs valid props', () => {
    const vm = buildCommercialRiskViewModel(riskyCtx);
    const props: SourceCommercialRiskPanelProps = { viewModel: vm };
    expect(props.viewModel.detectionResult.eventId).toBe('evt-risk-test');
  });
});
