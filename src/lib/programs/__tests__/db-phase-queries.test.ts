const mockCanReadProgram = jest.fn();
const mockAzureSelect = jest.fn();
const mockAzureMaybeSingle = jest.fn();

jest.mock('@/lib/auth/program-access-policy', () => ({
  canReadProgram: (...args: unknown[]) => mockCanReadProgram(...args),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
    maybeSingle: (...args: unknown[]) => mockAzureMaybeSingle(...args),
  },
}));

import { getEngagementWithPhaseData } from '../db-phase-queries';

describe('getEngagementWithPhaseData', () => {
  beforeEach(() => {
    mockCanReadProgram.mockReset();
    mockAzureSelect.mockReset();
    mockAzureMaybeSingle.mockReset();
    mockCanReadProgram.mockResolvedValue(true);
    mockAzureMaybeSingle.mockResolvedValue({
      id: 'program-1',
      client_id: 'client-1',
      name: 'Apex CDP',
      status: 'active',
      lifecycle_state: 'in_progress',
      current_phase: 3,
      program_archetype: 'ai_transformation',
      maestro_oversight_level: 'standard',
      sponsor_person_id: 'person-1',
      maestro_person_id: null,
      charter: { objective: 'Improve loyalty' },
    });
    mockAzureSelect.mockImplementation((request: { table: string }) => {
      switch (request.table) {
        case 'program_milestones':
          return Promise.resolve([{ id: 'milestone-1', name: 'Gate 3', status: 'open', target_date: null, phase_number: 3 }]);
        case 'program_risks':
          return Promise.resolve([]);
        case 'persons':
          return Promise.resolve([{ id: 'person-1', name: 'Priya Shah', role: 'CIO' }]);
        case 'evidence':
          return Promise.resolve([{ id: 'evidence-1', summary: 'Evidence', evidence_type: 'note', confidence_level: 'high', observed_at: null, created_at: '2026-05-01T00:00:00Z' }]);
        case 'engagement_phases':
          return Promise.resolve([{ id: 'phase-1' }]);
        case 'phase_approvals':
          return Promise.resolve([{ id: 'approval-1', action: 'approved', actor_name: 'Sponsor', created_at: '2026-05-01T00:00:00Z' }]);
        case 'program_modules':
        case 'program_evidence_items':
        case 'deliverables_v2':
        case 'program_audit_log':
          return Promise.resolve([]);
        default:
          return Promise.reject(new Error(`unexpected table ${request.table}`));
      }
    });
  });

  it('assembles phase data through azureRead after RBAC', async () => {
    const result = await getEngagementWithPhaseData(
      'program-1',
      'client-1',
      { clientId: 'client-1', userId: 'user-1' },
    );

    expect(mockCanReadProgram).toHaveBeenCalledWith(
      { clientId: 'client-1', userId: 'user-1' },
      'program-1',
    );
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'engagements',
      where: { id: 'program-1', client_id: 'client-1' },
    }));
    expect(result?.engagement.name).toBe('Apex CDP');
    expect(result?.engagement.sponsor).toEqual({ name: 'Priya Shah', role: 'CIO' });
    expect(result?.gateApprovals).toHaveLength(1);
  });

  it('returns null when RBAC denies access', async () => {
    mockCanReadProgram.mockResolvedValue(false);

    await expect(getEngagementWithPhaseData(
      'program-1',
      'client-1',
      { clientId: 'client-1', userId: 'user-1' },
    )).resolves.toBeNull();
    expect(mockAzureMaybeSingle).not.toHaveBeenCalled();
  });
});
