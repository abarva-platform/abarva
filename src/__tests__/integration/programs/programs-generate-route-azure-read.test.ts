// POST /api/v1/programs/[programId]/generate — Moves deliverable redo route contract.
//
// The durable-run enqueue path was retired for this route in the Moves redo.
// The route is now intentionally thin: tenancy + program lookup, then the
// tested generateArtifact(args, deps) keystone with injected sources/model deps.

const requireTenancy = jest.fn();
const tenancyErrorResponse = jest.fn();
const getProgramById = jest.fn();
const generateArtifact = jest.fn();
const createMovesGenerateArtifactDeps = jest.fn();
const draftModuleDeliverable = jest.fn();

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy,
  tenancyErrorResponse,
}));

jest.mock("@/lib/programs/queries", () => ({
  getProgramById,
}));

jest.mock("@/lib/deliverables/generate-artifact", () => ({
  generateArtifact,
}));

jest.mock("@/lib/deliverables/moves-generate-deps", () => ({
  createMovesGenerateArtifactDeps,
  normalizeMovesDeliverableKey: jest.fn(
    (key: string | undefined, phase: number) =>
      key === "p2_package"
        ? "discovery_report"
        : (key ?? `phase_${phase}_artifact`),
  ),
}));

jest.mock("@/lib/deliverables/profiles/registry", () => ({
  getDeliverableProfile: jest.fn(() => ({
    title: "Discovery & Diagnosis Report",
  })),
}));

jest.mock("@/lib/deliverables/generated-phase-digest", () => ({
  buildGeneratedPhaseDigest: jest.fn(() => ({
    decisions: [
      { phase: 2, decision: "Discovery generated", rationale: "test" },
    ],
  })),
}));

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable,
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/programs/program_1/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/programs/[programId]/generate delegates to generateArtifact", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    requireTenancy.mockResolvedValue({
      clientId: "client_1",
      clientKey: "apex-retail",
      userId: "user_1",
    });
    tenancyErrorResponse.mockImplementation((err: unknown) => {
      throw err;
    });
    getProgramById.mockResolvedValue({
      id: "program_1",
      name: "Owned Brand Margin Recovery",
      currentPhase: 2,
      archetype: "operational_optimization",
      problemStatement: "Improve margin leakage using current-state evidence.",
      targetOutcome: "Reduce leakage.",
    });
    createMovesGenerateArtifactDeps.mockReturnValue({
      contextSources: {},
      gateSources: {},
      callModel: jest.fn(),
    });
    generateArtifact.mockResolvedValue({
      status: "generated",
      html: "<html><body><svg></svg><table><tr><td>Discovery</td></tr></table></body></html>",
      context: {
        moveId: "program_1",
        tenantKey: "apex-retail",
        targetPhase: 2,
      },
      goldenBar: {
        pass: true,
        reasons: [],
        hasDataGap: false,
        proseOnly: false,
      },
    });
    draftModuleDeliverable.mockResolvedValue({
      deliverableId: "deliverable_1",
      versionId: "version_1",
    });
  });

  it("calls generateArtifact with injected deps and persists the HTML artifact", async () => {
    const { POST } =
      await import("@/app/api/v1/programs/[programId]/generate/route");
    const res = await POST(
      makeRequest({ phase: 2, deliverableTypeKey: "p2_package" }),
      {
        params: Promise.resolve({ programId: "program_1" }),
      },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      deliverableId: "deliverable_1",
      versionId: "version_1",
      phase: 2,
      deliverableKey: "discovery_report",
      outputFormat: "html",
    });

    expect(createMovesGenerateArtifactDeps).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "apex-retail" }),
    );
    expect(generateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: "program_1",
        tenantKey: "apex-retail",
        phase: 2,
        artifact: "discovery_report",
        allowApprovedRetry: true,
        useCaseQuery: "Improve margin leakage using current-state evidence.",
      }),
      expect.objectContaining({
        contextSources: expect.any(Object),
        gateSources: expect.any(Object),
        callModel: expect.any(Function),
      }),
    );
    expect(draftModuleDeliverable).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "apex-retail" }),
      expect.objectContaining({
        programId: "program_1",
        moduleKey: "discovery_report",
        deliverableTypeKey: "discovery_report",
        draftContent: expect.stringContaining("<svg"),
        structuredData: expect.objectContaining({
          output_format: "html",
          mode: "program_generate",
          solution_context: expect.objectContaining({
            moveId: "program_1",
            tenantKey: "apex-retail",
          }),
        }),
      }),
    );
  });

  it("returns a structured 409 when the phase gate blocks generation", async () => {
    generateArtifact.mockResolvedValueOnce({
      status: "blocked_gate",
      httpStatus: 409,
      blockers: [
        {
          code: "gate_not_approved",
          phase: 2,
          severity: "hard",
          reason: "Phase 2 gate is not approved.",
        },
      ],
    });

    const { POST } =
      await import("@/app/api/v1/programs/[programId]/generate/route");
    const res = await POST(
      makeRequest({ phase: 2, deliverableTypeKey: "p2_package" }),
      {
        params: Promise.resolve({ programId: "program_1" }),
      },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "generation_gate_blocked",
      phase: 2,
      deliverableKey: "discovery_report",
    });
    expect(draftModuleDeliverable).not.toHaveBeenCalled();
  });

  it("returns 404 when the program is not found", async () => {
    getProgramById.mockResolvedValueOnce(null);
    const { POST } =
      await import("@/app/api/v1/programs/[programId]/generate/route");
    const res = await POST(makeRequest({ phase: 2 }), {
      params: Promise.resolve({ programId: "missing" }),
    });
    expect(res.status).toBe(404);
    expect(generateArtifact).not.toHaveBeenCalled();
    expect(draftModuleDeliverable).not.toHaveBeenCalled();
  });
});

export {};
