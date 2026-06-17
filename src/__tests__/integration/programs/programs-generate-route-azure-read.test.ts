// POST /api/v1/programs/[programId]/generate — orchestrated-delegation contract.
//
// The single-pass path (streamAgentTurn → draftModuleDeliverable → 200 inline doc)
// is RETIRED. This route now ENQUEUES a deliverable_runs row (status='queued') carrying
// the full job payload and returns 202 { runId, status:'queued' }. It does NO model work
// in the request — the durable worker (process-deliverable-queue) claims and runs it, so
// a recycled web replica cannot orphan the generation. These tests assert that contract
// and that neither the retired single-pass path nor the generation engine runs inline.

const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramById = jest.fn();
const getActiveClientRow = jest.fn();
const getDeliverableSpec = jest.fn();
const runDeliverableForTenant = jest.fn();
const createDeliverableRun = jest.fn();

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock('@/lib/programs/queries', () => ({
  getProgramById,
}));

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow,
}));

jest.mock('@/lib/programs/deliverable-registry', () => ({
  getDeliverableSpec,
}));

jest.mock('@/lib/deliverables/orchestrator/generate-service', () => ({
  runDeliverableForTenant,
}));

jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  createDeliverableRun,
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/programs/program_1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Let the fire-and-forget background generation settle. */
async function flushMicrotasks(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe('POST /api/v1/programs/[programId]/generate delegates to the orchestrator', () => {
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
    getActiveClientRow.mockResolvedValue({
      id: 'client_1',
      key: 'apex-retail',
      name: 'Apex Retail',
      industry_code: 'retail',
    });
    // Resolve the P2 gate document so the title/purpose are real.
    getDeliverableSpec.mockImplementation((key: string) =>
      key === 'discovery_report'
        ? {
            deliverableTypeKey: 'discovery_report',
            documentTitle: 'Discovery & Diagnosis Report',
            documentPurpose: 'Establishes the evidence base.',
            phase: 2,
          }
        : undefined,
    );
    createDeliverableRun.mockResolvedValue({ id: 'run_1' });
  });

  it('enqueues a run, returns 202 { runId, status:"queued" } with the job payload, and does NO model work', async () => {
    const { POST } = await import('@/app/api/v1/programs/[programId]/generate/route');
    const res = await POST(makeRequest({ phase: 2, deliverableTypeKey: 'discovery_report' }), {
      params: Promise.resolve({ programId: 'program_1' }),
    });

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      runId: 'run_1',
      status: 'queued',
      deliverableType: 'discovery_report',
      phase: 2,
    });

    // The run row is enqueued with the moves module, the move's archetype, AND the full
    // self-contained job payload the durable worker reconstructs the generation input from.
    expect(createDeliverableRun).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client_1',
        tenantKey: 'apex-retail',
        userId: 'user_1',
        module: 'moves',
        archetype: 'operational_optimization',
        deliverableType: 'discovery_report',
        jobPayload: expect.objectContaining({
          module: 'moves',
          useCaseArchetype: 'operational_optimization',
          deliverableType: 'discovery_report',
          sourceArtifactRef: 'program_1',
          clientDisplayName: 'Apex Retail',
          initiativeDisplayName: 'Owned Brand Margin Recovery',
        }),
      }),
    );

    // The request must not run the generation engine — that is the worker's job.
    await flushMicrotasks();
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
  });

  it('maps an unknown / legacy registry key onto a valid orchestrator deliverable type', async () => {
    const { POST } = await import('@/app/api/v1/programs/[programId]/generate/route');
    const res = await POST(makeRequest({ phase: 2, deliverableTypeKey: 'p2_package' }), {
      params: Promise.resolve({ programId: 'program_1' }),
    });

    expect(res.status).toBe(202);
    // Unmapped key falls through to its normalized self — still a valid run.
    await expect(res.json()).resolves.toMatchObject({
      runId: 'run_1',
      deliverableType: 'p2_package',
    });
    expect(createDeliverableRun).toHaveBeenCalledWith(
      expect.objectContaining({
        jobPayload: expect.objectContaining({ deliverableType: 'p2_package', module: 'moves' }),
      }),
    );
  });

  it('returns 404 when the program is not found', async () => {
    getProgramById.mockResolvedValueOnce(null);
    const { POST } = await import('@/app/api/v1/programs/[programId]/generate/route');
    const res = await POST(makeRequest({ phase: 2 }), {
      params: Promise.resolve({ programId: 'missing' }),
    });
    expect(res.status).toBe(404);
    expect(createDeliverableRun).not.toHaveBeenCalled();
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
  });
});

export {};
