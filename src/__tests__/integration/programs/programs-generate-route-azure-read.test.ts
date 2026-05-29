const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramById = jest.fn();
const getModuleState = jest.fn();
const mockAzureRead = {
  query: jest.fn(),
  select: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
  withSession: jest.fn(),
};
const getActiveClientRow = jest.fn();
const buildTenantContextBlock = jest.fn();
const clientKeyToInventorySubstrateKey = jest.fn();
const streamAgentTurn = jest.fn();
const draftModuleDeliverable = jest.fn();
const getDeliverableSpec = jest.fn();
const getPhasePackV2 = jest.fn();
const formatPhasePackV2ForPrompt = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
  getModuleState,
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: mockAzureRead,
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow,
}));

jest.mock('@/lib/intelligence/persistence', () => ({
  buildTenantContextBlock,
}));

jest.mock('@/lib/agent/tools/intelligence/_shared', () => ({
  clientKeyToInventorySubstrateKey,
}));

jest.mock('@/lib/agent/stream', () => ({
  streamAgentTurn,
}));

jest.mock('@/lib/programs/nexus', () => ({
  draftModuleDeliverable,
}));

jest.mock('@/lib/programs/deliverable-registry', () => ({
  getDeliverableSpec,
}));

jest.mock('@/lib/programs/phase-packs', () => ({
  getPhasePackV2,
}));

jest.mock('@/lib/programs/phase-packs/format-v2', () => ({
  formatPhasePackV2ForPrompt,
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/programs/program_1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/programs/[programId]/generate read plane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({ clientId: 'client_1', clientKey: 'apex-retail', userId: 'user_1' });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    getProgramById.mockResolvedValue({
      id: 'program_1',
      name: 'Owned Brand Margin Recovery',
      currentPhase: 2,
      archetype: 'operational_optimization',
    });
    getModuleState.mockResolvedValue([{ moduleKey: 'diagnose', status: 'in_progress' }]);
    getActiveClientRow.mockResolvedValue({
      id: 'client_1',
      key: 'apex-retail',
      name: 'Apex Retail',
      industry_code: 'retail',
    });
    clientKeyToInventorySubstrateKey.mockReturnValue('apex-retail');
    buildTenantContextBlock.mockResolvedValue('--- TENANT CONTEXT ---\nMargin pressure context');
    getDeliverableSpec.mockReturnValue(null);
    getPhasePackV2.mockReturnValue(null);
    formatPhasePackV2ForPrompt.mockReturnValue('');
    streamAgentTurn.mockImplementation(async function* () {
      yield '# Generated Deliverable\n';
      yield 'Specific content.';
    });
    draftModuleDeliverable.mockResolvedValue({ deliverableId: 'deliv_1', versionId: 'ver_1' });
    mockAzureRead.query.mockResolvedValue([
      {
        deliverable_type_key: 'p1_package',
        title: 'Program Charter',
        status: 'published',
        content: 'Prior charter content',
        version: 3,
      },
    ]);
    mockAzureRead.select.mockImplementation(async (request) => {
      if (request.table === 'program_milestones') {
        return [{ id: 'ms_1', name: 'Gate 2', status: 'open', target_date: '2026-06-30' }];
      }
      if (request.table === 'program_risks') {
        return [{ id: 'risk_1', title: 'Data quality', likelihood: 'medium', impact: 'high', status: 'open' }];
      }
      if (request.table === 'persons') {
        return [
          { id: 'person_sponsor', name: 'Maya Patel', role: 'CFO' },
          { id: 'person_lead', name: 'Leo Chen', role: 'Program Lead' },
        ];
      }
      return [];
    });
    mockAzureRead.maybeSingle.mockImplementation(async (request) => {
      if (request.table === 'engagements') {
        return {
          id: 'program_1',
          name: 'Owned Brand Margin Recovery',
          status: 'active',
          lifecycle_state: 'approved',
          current_phase: 2,
          program_archetype: 'operational_optimization',
          maestro_oversight_level: 'standard',
          sponsor_person_id: 'person_sponsor',
          maestro_person_id: 'person_lead',
          charter: { objective: 'Recover owned-brand margin' },
        };
      }
      if (request.table === 'pattern_match_logs') return { pattern_key: 'owned-brand-margin-recovery' };
      if (request.table === 'engagement_topics') {
        return {
          topic_key: 'owned-brand-margin-recovery',
          title: 'Owned Brand Margin Recovery',
          phase_playbook: { diagnose: ['margin waterfall'] },
          failure_modes: { risks: ['supplier leakage'] },
          success_signals: { signals: ['basis point recovery'] },
        };
      }
      return null;
    });
  });

  it('assembles generation context through azureRead and preserves save response', async () => {
    const { POST } = await import('@/app/api/v1/programs/[programId]/generate/route');
    const res = await POST(makeRequest({ phase: 2, deliverableTypeKey: 'p2_package' }), {
      params: Promise.resolve({ programId: 'program_1' }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      deliverableId: 'deliv_1',
      versionId: 'ver_1',
      deliverableTypeKey: 'p2_package',
      saved: true,
      phase: 2,
    });
    expect(getProgramById).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_1' }),
      'program_1',
    );
    expect(getModuleState).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_1' }),
      'program_1',
    );
    expect(mockAzureRead.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM deliverables_v2 d'),
      ['program_1'],
    );
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'engagements',
      where: { id: 'program_1' },
    }));
    expect(mockAzureRead.maybeSingle).toHaveBeenCalledWith(expect.objectContaining({
      table: 'pattern_match_logs',
      where: { engagement_id: 'program_1', acted_upon: true },
    }));
    expect(draftModuleDeliverable).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'client_1' }),
      expect.objectContaining({
        programId: 'program_1',
        deliverableTypeKey: 'p2_package',
        draftContent: expect.stringContaining('Generated Deliverable'),
      }),
    );
  });
});

export {};
