import { azureRead } from '@/lib/data-plane/azureRead';
import { retrieveVendor } from './vendor';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const mockAzureRead = jest.mocked(azureRead);

describe('retrieveVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads tech stack vendor deployments through the Azure read boundary', async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        vendor_name: 'Wipro',
        category: 'AMS',
        product_name: 'Retail AMS',
        deployment_model: 'managed_service',
        annual_spend_usd: 32000000,
        touches_ai: true,
        seat_count: 250,
        industry_code: 'RETAIL',
      },
    ]);

    const result = await retrieveVendor(['Wipro']);

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM tech_stack_items t'),
      ['%Wipro%'],
      { missingTable: 'empty' },
    );
    expect(result.sources).toEqual([
      expect.objectContaining({
        type: 'VENDOR',
        name: 'Wipro',
        detail: expect.stringContaining('Aggregate annual spend: $32.0M'),
        confidence: 0.85,
      }),
    ]);
  });

  it('returns an empty result when no vendor rows match', async () => {
    mockAzureRead.query.mockResolvedValue([]);

    const result = await retrieveVendor(['missing vendor']);

    expect(result).toEqual({ sources: [], averageConfidence: 0 });
  });
});
