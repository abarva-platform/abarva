import {
  SourceCommercialSummarySurface,
  SourceCommercialSummarySurfaceProps,
} from '../../../components/source/SourceCommercialSummarySurface';
import {
  buildCommercialSummaryProps,
  SourceCommercialSummaryContext,
} from '../../../lib/source/source-commercial-summary';

describe('source-commercial-summary - buildCommercialSummaryProps', () => {
  it('returns props with correct eventId', () => {
    const ctx: SourceCommercialSummaryContext = {
      eventId: 'evt-test', eventName: 'Test', stage: 'bafo', vendorCount: 2,
    };
    const props = buildCommercialSummaryProps(ctx);
    expect(props.eventId).toBe('evt-test');
    expect(props.eventName).toBe('Test');
    expect(props.generatedAt).toBe('2026-04-26');
  });

  it('returns correct vendor count', () => {
    const props = buildCommercialSummaryProps({ eventId: 'e', eventName: 'E', stage: 'rfp', vendorCount: 3 });
    expect(props.vendors).toHaveLength(3);
  });

  it('returns zero vendors for vendorCount 0', () => {
    const props = buildCommercialSummaryProps({ eventId: 'e', eventName: 'E', stage: 'rfp', vendorCount: 0 });
    expect(props.vendors).toHaveLength(0);
    expect(props.topOpportunity).toBeNull();
  });

  it('is deterministic', () => {
    const ctx: SourceCommercialSummaryContext = { eventId: 'e', eventName: 'E', stage: 'bafo', vendorCount: 2 };
    expect(JSON.stringify(buildCommercialSummaryProps(ctx))).toBe(JSON.stringify(buildCommercialSummaryProps(ctx)));
  });
});

describe('SourceCommercialSummarySurface - type shape', () => {
  it('exports as a function', () => {
    expect(typeof SourceCommercialSummarySurface).toBe('function');
  });

  it('constructs valid props', () => {
    const props: SourceCommercialSummarySurfaceProps = {
      eventId: 'evt-test',
      eventName: 'Test Event',
      stage: 'bafo',
      vendorCount: 2,
    };
    expect(props.eventId).toBe('evt-test');
    expect(props.vendorCount).toBe(2);
  });

  it('accepts optional className', () => {
    const props: SourceCommercialSummarySurfaceProps = {
      eventId: 'e', eventName: 'E', stage: 'rfp', className: 'mt-4',
    };
    expect(props.className).toBe('mt-4');
  });
});
