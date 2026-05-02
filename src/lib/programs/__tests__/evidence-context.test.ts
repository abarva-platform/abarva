const canReadProgramMock = jest.fn();
const queryState: { rows: Array<Record<string, unknown>> | null; error: null | { message: string } } = {
  rows: null,
  error: null,
};

jest.mock('@/lib/auth/program-access-policy', () => ({
  canReadProgram: (...args: unknown[]) => canReadProgramMock(...args),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: queryState.rows, error: queryState.error }),
          }),
        }),
      }),
    }),
  }),
}));

import {
  formatProgramEvidenceForPrompt,
  listProgramEvidenceForPrompt,
} from '../evidence-context';

describe('program evidence context prompt block', () => {
  beforeEach(() => {
    canReadProgramMock.mockReset();
    canReadProgramMock.mockResolvedValue(true);
    queryState.rows = null;
    queryState.error = null;
  });

  it('lists captured program evidence only after access is allowed', async () => {
    queryState.rows = [
      {
        id: 'evidence-1',
        title: 'pasted-workshop-notes-2026-05-02.txt',
        evidence_type: 'meeting_notes',
        summary: 'Parsed evidence summary',
        extracted_text: 'Baseline candidate: application inventory completeness is 72 percent.',
        extracted_structured: { parse_method: 'text-line-parser' },
        created_at: '2026-05-02T03:36:02.000Z',
      },
    ];

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
      }),
    ]);
  });

  it('formats evidence so Nexus cannot call the ledger empty', () => {
    const block = formatProgramEvidenceForPrompt([
      {
        id: 'evidence-1',
        title: 'pasted-workshop-notes-2026-05-02.txt',
        evidenceType: 'meeting_notes',
        summary: 'Parsed workshop notes',
        extractedText: 'Baseline candidate: application inventory completeness is 72 percent.',
        parseMethod: 'text-line-parser',
        createdAt: '2026-05-02T03:36:02.000Z',
      },
    ]);

    expect(block).toContain('PROGRAM EVIDENCE LEDGER');
    expect(block).toContain('pasted-workshop-notes-2026-05-02.txt');
    expect(block).toContain('application inventory completeness is 72 percent');
    expect(block).toContain('Do not say there are zero uploaded items');
  });
});
