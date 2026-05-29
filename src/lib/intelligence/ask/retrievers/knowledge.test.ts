import { azureRead } from '@/lib/data-plane/azureRead';
import { retrieveKnowledge } from './knowledge';

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

const mockAzureRead = jest.mocked(azureRead);

describe('retrieveKnowledge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries active knowledge sources through the Azure read boundary', async () => {
    mockAzureRead.query.mockResolvedValue([
      {
        id: 'ks-1',
        source_key: 'nist-ai-rmf',
        title: 'NIST AI Risk Management Framework',
        publisher: 'NIST',
        content_type: 'framework',
        industry_tags: ['RETAIL'],
        topic_tags: ['ai'],
        published_at: '2023-01-01',
        summary: 'Risk management framework for AI governance.',
      },
    ]);

    const result = await retrieveKnowledge(['ai'], ['framework'], 'REGULATION');

    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM knowledge_sources'),
      ['active', ['framework'], '%ai%', ['ai'], ['AI']],
      { missingTable: 'empty' },
    );
    expect(result.sources).toEqual([
      expect.objectContaining({
        type: 'REGULATION',
        name: 'NIST AI Risk Management Framework',
        id: 'ks-1',
        detail: expect.stringContaining('Risk management framework'),
        confidence: 0.85,
      }),
    ]);
  });

  it('degrades to no sources on read failure', async () => {
    mockAzureRead.query.mockRejectedValue(new Error('read failed'));

    const result = await retrieveKnowledge(['ai']);

    expect(result).toEqual({ sources: [], averageConfidence: 0 });
  });
});
