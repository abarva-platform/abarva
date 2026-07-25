const canReadProgramMock = jest.fn();
const mockAzureSelect = jest.fn();

jest.mock('@/lib/auth/program-access-policy', () => ({
  canReadProgram: (...args: unknown[]) => canReadProgramMock(...args),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
  },
}));

import {
  formatProgramEvidenceForPrompt,
  listProgramEvidenceForPrompt,
} from '../evidence-context';

describe('program evidence context prompt block', () => {
  beforeEach(() => {
    canReadProgramMock.mockReset();
    canReadProgramMock.mockResolvedValue(true);
    mockAzureSelect.mockReset();
    mockAzureSelect.mockResolvedValue([]);
  });

  it('lists only APPROVED captured program evidence after access is allowed', async () => {
    mockAzureSelect
      .mockResolvedValueOnce([
        { evidence_id: 'evidence-1', reviewed_at: '2026-05-03T00:00:00.000Z', updated_at: '2026-05-03T00:00:00.000Z' },
      ])
      .mockResolvedValueOnce([
        {
          id: 'evidence-1',
          title: 'pasted-workshop-notes-2026-05-02.txt',
          evidence_type: 'meeting_notes',
          phase: 2,
          summary: 'Parsed evidence summary',
          extracted_text: 'Baseline candidate: application inventory completeness is 72 percent.',
          extracted_structured: {
            parse_method: 'text-line-parser',
            baseline_candidates: ['Application inventory completeness is 72 percent.'],
          },
          created_at: '2026-05-02T03:36:02.000Z',
        },
      ]);

    const items = await listProgramEvidenceForPrompt(
      { clientId: 'client-1', userId: 'user-1', role: 'program_user' },
      'program-1',
    );

    expect(canReadProgramMock).toHaveBeenCalledWith(
      { clientId: 'client-1', userId: 'user-1', role: 'program_user' },
      'program-1',
    );
    expect(items).toEqual([
      expect.objectContaining({
        title: 'pasted-workshop-notes-2026-05-02.txt',
        parseMethod: 'text-line-parser',
        structuredSignals: ['Application inventory completeness is 72 percent.'],
        approvedAt: '2026-05-03T00:00:00.000Z',
      }),
    ]);
    expect(mockAzureSelect).toHaveBeenNthCalledWith(1, expect.objectContaining({
      table: 'program_evidence_reviews',
      where: { tenant_key: '', program_id: 'program-1', decision: 'approved' },
    }));
    expect(mockAzureSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({
      table: 'program_evidence_items',
      where: { program_id: 'program-1', id: { op: 'in', value: ['evidence-1'] } },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 8,
    }));
  });

  it('returns nothing when no evidence has been approved', async () => {
    mockAzureSelect.mockResolvedValueOnce([]);
    const items = await listProgramEvidenceForPrompt(
      { clientId: 'client-1', userId: 'user-1', role: 'program_user' },
      'program-1',
    );
    expect(items).toEqual([]);
    expect(mockAzureSelect).toHaveBeenCalledTimes(1);
  });

  it('formats evidence so Nexus cannot call the ledger empty', () => {
    const block = formatProgramEvidenceForPrompt([
      {
        id: 'evidence-1',
        title: 'pasted-workshop-notes-2026-05-02.txt',
        evidenceType: 'meeting_notes',
        phase: 2,
        summary: 'Parsed workshop notes',
        extractedText: 'Baseline candidate: application inventory completeness is 72 percent.',
        parseMethod: 'text-line-parser',
        structuredSignals: [
          'Average monthly invoice exceptions: 1,872.',
          'Manual touch hours per month: 2,345.',
          'Average resolution days: 7.4.',
        ],
        createdAt: '2026-05-02T03:36:02.000Z',
        approvedAt: '2026-05-03T00:00:00.000Z',
        observations: [],
        assumptions: [],
        openQuestions: [],
        citations: [],
      },
    ]);

    expect(block).toContain('PROGRAM EVIDENCE LEDGER');
    expect(block).toContain('pasted-workshop-notes-2026-05-02.txt');
    expect(block).toContain('Structured signals');
    expect(block).toContain('1,872');
    expect(block).toContain('2,345');
    expect(block).toContain('7.4');
    expect(block).toContain('application inventory completeness is 72 percent');
    expect(block).toContain('Do not say there are zero uploaded items');
  });
});
