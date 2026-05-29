const mockAzureSelect = jest.fn();

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
  },
}));

import { loadApprovalPersonDisplayMap } from '../approval-person-resolver';

describe('loadApprovalPersonDisplayMap', () => {
  beforeEach(() => {
    mockAzureSelect.mockReset();
    mockAzureSelect.mockResolvedValue([]);
  });

  it('deduplicates person IDs and reads display rows through azureRead', async () => {
    mockAzureSelect.mockResolvedValue([
      { id: 'person-1', name: 'Priya Shah', role: 'CIO' },
      { id: 'person-2', name: 'Marco Lee', role: null },
    ]);

    const result = await loadApprovalPersonDisplayMap(['person-1', 'person-2', 'person-1', null]);

    expect(mockAzureSelect).toHaveBeenCalledWith({
      table: 'persons',
      columns: ['id', 'name', 'role'],
      where: { id: { op: 'in', value: ['person-1', 'person-2'] } },
    });
    expect(result.get('person-1')).toContain('Priya Shah');
    expect(result.get('person-2')).toBe('Marco Lee');
  });

  it('returns an empty map when the read plane is unavailable', async () => {
    mockAzureSelect.mockRejectedValue(new Error('connection failed'));

    await expect(loadApprovalPersonDisplayMap(['person-1'])).resolves.toEqual(new Map());
  });
});
