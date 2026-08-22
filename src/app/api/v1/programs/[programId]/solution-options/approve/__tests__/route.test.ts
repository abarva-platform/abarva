const requireTenancyMock = jest.fn();
jest.mock("@/app/api/v1/programs/_auth", () => ({
  __esModule: true,
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  tenancyErrorResponse: () =>
    Response.json({ error: "unauthorized" }, { status: 401 }),
}));

const getProgramByIdMock = jest.fn();
jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const completeDeliverableMock = jest.fn();
jest.mock("@/lib/programs/mutations", () => ({
  __esModule: true,
  completeDeliverable: (...args: unknown[]) => completeDeliverableMock(...args),
}));

const loadApprovedSolutionApproachMock = jest.fn();
jest.mock("@/lib/programs/approved-solution-approach", () => {
  const actual = jest.requireActual(
    "@/lib/programs/approved-solution-approach",
  );
  return {
    __esModule: true,
    ...actual,
    loadApprovedSolutionApproach: (...args: unknown[]) =>
      loadApprovedSolutionApproachMock(...args),
  };
});

const neqMock = jest.fn();
const inMock = jest.fn();
const eqMock = jest.fn();
const updateMock = jest.fn();
const fromMock = jest.fn();
jest.mock("@/lib/programs/programs-auth-mode-server", () => ({
  __esModule: true,
  getProgramsRouteSupabase: async () => ({ supabase: { from: fromMock } }),
}));

import { POST } from "../route";

const PROGRAM_ID = "program-123";
const CTX = { clientId: "client-1", userId: "user-1", role: "maestro" };

function makeRequest(body: unknown): Request {
  return new Request(
    `http://localhost/api/v1/programs/${PROGRAM_ID}/solution-options/approve`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  getProgramByIdMock.mockReset();
  completeDeliverableMock.mockReset();
  loadApprovedSolutionApproachMock.mockReset();
  neqMock.mockReset();
  inMock.mockReset();
  eqMock.mockReset();
  updateMock.mockReset();
  fromMock.mockReset();
  requireTenancyMock.mockResolvedValue(CTX);
  getProgramByIdMock.mockResolvedValue({
    id: PROGRAM_ID,
    name: "Clinical + Claims Foundation",
  });
  completeDeliverableMock.mockResolvedValue({
    deliverableId: "deliverable-1",
    versionId: "version-1",
    status: "signed_off",
  });
  loadApprovedSolutionApproachMock.mockResolvedValue(null);
  neqMock.mockResolvedValue({ error: null });
  inMock.mockImplementation(() => ({ neq: neqMock }));
  eqMock.mockImplementation(() => ({ in: inMock }));
  updateMock.mockImplementation(() => ({ eq: eqMock }));
  fromMock.mockImplementation(() => ({ update: updateMock }));
});

describe("POST /api/v1/programs/:programId/solution-options/approve", () => {
  it("persists the chosen option as a signed-off solution context digest", async () => {
    const res = await POST(
      makeRequest({
        chosenOption: "Option 2 - Governed Databricks Lakehouse",
        rationale: "Best fit for governed clinical + claims use cases.",
        approach: "3/6/9/12 incremental lakehouse build.",
        tradeoffsAccepted: ["Parallel BI migration"],
        options: [
          {
            id: "option-2",
            name: "Governed Databricks Lakehouse",
            summary: "Recommended.",
            recommended: true,
          },
        ],
      }) as never,
      { params: Promise.resolve({ programId: PROGRAM_ID }) },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      deliverableId: "deliverable-1",
      versionId: "version-1",
      chosenOption: "Option 2 - Governed Databricks Lakehouse",
      architectureMayProceed: true,
    });
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      CTX,
      PROGRAM_ID,
      expect.objectContaining({
        deliverableTypeKey: "solution_approach_options",
        title: "Approved Solution Approach Option",
        moduleKey: "design",
        signOff: true,
        structuredData: expect.objectContaining({
          phase: 3,
          artifact: "solution_approach_options",
          output_format: "approval_digest",
          mode: "solution_option_approval",
          solutionContextDigest: expect.objectContaining({
            chosenOption: "Option 2 - Governed Databricks Lakehouse",
            tradeoffsAccepted: ["Parallel BI migration"],
          }),
        }),
      }),
    );
    expect(updateMock).toHaveBeenCalledWith({ status: "superseded" });
    expect(inMock).toHaveBeenCalledWith(
      "deliverable_type_key",
      expect.arrayContaining([
        "target_state_architecture",
        "solution_design",
        "operating_model_design",
        "sourcing_strategy",
      ]),
    );
  });

  it("reuses an identical existing approval without superseding P3 outputs", async () => {
    loadApprovedSolutionApproachMock.mockResolvedValue({
      decisionId: "decision-existing",
      decisionVersion: "2026-08-22T18:00:00.000Z",
      decisionHash: "hash-existing",
      selectedOptionId: "option-2",
      selectedOptionVersion: "1",
      approach: "3/6/9/12 incremental lakehouse build.",
      options: [
        {
          id: "option-2",
          name: "Governed Databricks Lakehouse",
          summary: "Recommended.",
          recommended: true,
        },
      ],
      chosenOption: "Option 2 - Governed Databricks Lakehouse",
      rejectedOptions: [],
      tradeoffsAccepted: ["Parallel BI migration"],
      scope: [],
      exclusions: [],
      assumptions: [],
      constraints: [],
      unresolvedDecisions: [],
      decision: {
        phase: 3,
        decision:
          "Approved solution option: Option 2 - Governed Databricks Lakehouse",
        rationale: "Best fit for governed clinical + claims use cases.",
        approvedBy: "user-1",
        approvedAt: "2026-08-22T18:00:00.000Z",
      },
    });

    const res = await POST(
      makeRequest({
        chosenOption: "Option 2 - Governed Databricks Lakehouse",
        rationale: "Best fit for governed clinical + claims use cases.",
        approach: "3/6/9/12 incremental lakehouse build.",
        tradeoffsAccepted: ["Parallel BI migration"],
        options: [
          {
            id: "option-2",
            name: "Governed Databricks Lakehouse",
            summary: "Recommended.",
            recommended: true,
          },
        ],
      }) as never,
      { params: Promise.resolve({ programId: PROGRAM_ID }) },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      ok: true,
      decisionId: "decision-existing",
      decisionVersion: "2026-08-22T18:00:00.000Z",
      decisionHash: "hash-existing",
      reusedExistingApproval: true,
      architectureMayProceed: true,
    });
    expect(completeDeliverableMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("requires a chosen option", async () => {
    const res = await POST(makeRequest({}) as never, {
      params: Promise.resolve({ programId: PROGRAM_ID }),
    });

    expect(res.status).toBe(400);
    expect(completeDeliverableMock).not.toHaveBeenCalled();
  });
});
