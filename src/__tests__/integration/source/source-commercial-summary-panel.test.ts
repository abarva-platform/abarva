import {
  SourceCommercialSummaryPanel,
  CommercialSummaryRiskLevel,
  CommercialSummaryReadiness,
  SourceCommercialSummaryPanelProps,
  CommercialSummaryVendorRow,
} from '../../../components/source/SourceCommercialSummaryPanel';

const RISK_LEVELS: CommercialSummaryRiskLevel[] = ['critical', 'high', 'medium', 'low', 'not_assessed'];
const READINESS_VALUES: CommercialSummaryReadiness[] = ['ready', 'partially_ready', 'not_ready', 'blocked'];

describe('SourceCommercialSummaryPanel - type shape', () => {
  it('exports SourceCommercialSummaryPanel as a function', () => {
    expect(typeof SourceCommercialSummaryPanel).toBe('function');
  });

  it('CommercialSummaryRiskLevel includes all 5 values', () => {
    expect(RISK_LEVELS).toHaveLength(5);
    expect(RISK_LEVELS).toContain('critical');
    expect(RISK_LEVELS).toContain('high');
    expect(RISK_LEVELS).toContain('medium');
    expect(RISK_LEVELS).toContain('low');
    expect(RISK_LEVELS).toContain('not_assessed');
  });

  it('CommercialSummaryReadiness includes all 4 values', () => {
    expect(READINESS_VALUES).toHaveLength(4);
    expect(READINESS_VALUES).toContain('ready');
    expect(READINESS_VALUES).toContain('partially_ready');
    expect(READINESS_VALUES).toContain('not_ready');
    expect(READINESS_VALUES).toContain('blocked');
  });

  it('constructs a valid SourceCommercialSummaryPanelProps object', () => {
    const vendor: CommercialSummaryVendorRow = {
      vendorId: 'vendor-a',
      vendorName: 'Vendor Alpha',
      normalizedCost: 1_000_000,
      currency: 'USD',
      riskLevel: 'high',
      exceptionCount: 3,
      negotiationReadiness: 'partially_ready',
    };

    const props: SourceCommercialSummaryPanelProps = {
      eventId: 'evt-test',
      eventName: 'Test Event',
      stage: 'bafo',
      overallRiskLevel: 'high',
      vendors: [vendor],
      totalExceptions: 3,
      criticalExceptions: 0,
      topOpportunity: 'Price reduction opportunity: 5-8% delta vs. benchmark',
      generatedAt: '2026-04-26',
    };

    expect(props.eventId).toBe('evt-test');
    expect(props.vendors).toHaveLength(1);
    expect(props.vendors[0].vendorId).toBe('vendor-a');
    expect(props.overallRiskLevel).toBe('high');
    expect(props.totalExceptions).toBe(3);
  });

  it('constructs props with null topOpportunity', () => {
    const props: SourceCommercialSummaryPanelProps = {
      eventId: 'evt-no-opp',
      eventName: 'No Opportunity Event',
      stage: 'rfp',
      overallRiskLevel: 'low',
      vendors: [],
      totalExceptions: 0,
      criticalExceptions: 0,
      topOpportunity: null,
      generatedAt: '2026-04-26',
    };
    expect(props.topOpportunity).toBeNull();
    expect(props.vendors).toHaveLength(0);
  });

  it('constructs props with critical overall risk', () => {
    const props: SourceCommercialSummaryPanelProps = {
      eventId: 'evt-critical',
      eventName: 'Critical Risk Event',
      stage: 'negotiation',
      overallRiskLevel: 'critical',
      vendors: [],
      totalExceptions: 5,
      criticalExceptions: 2,
      topOpportunity: null,
      generatedAt: '2026-04-26',
    };
    expect(props.overallRiskLevel).toBe('critical');
    expect(props.criticalExceptions).toBe(2);
  });
});
