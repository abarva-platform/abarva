import {
  buildStrategicMove,
  buildStrategicMovePortfolio,
  deriveDisplayCode,
  deriveMapLabel,
  hasTerminalTowerHandoffActivity,
  hasTerminalTowerHandoffPassed,
  hasTerminalTowerHandoffSnapshot,
} from "@/lib/programs/transformers";
import { azureRead } from "@/lib/data-plane/azureRead";
import { evaluateGate } from "@/lib/programs/governance";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    maybeSingle: jest.fn(),
    select: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock("@/lib/programs/governance", () => ({
  evaluateGate: jest.fn(),
  gateCriteriaForPhase: jest.fn(() => [
    {
      key: "charter_signed_off",
      describe: "Charter signed off",
      severity: "hard",
    },
  ]),
}));

const maybeSingleMock = azureRead.maybeSingle as jest.MockedFunction<
  typeof azureRead.maybeSingle
>;
const selectMock = azureRead.select as jest.MockedFunction<
  typeof azureRead.select
>;
const queryMock = azureRead.query as jest.MockedFunction<
  typeof azureRead.query
>;
const evaluateGateMock = evaluateGate as jest.MockedFunction<
  typeof evaluateGate
>;

describe("strategic move transformer helpers", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    selectMock.mockReset();
    queryMock.mockReset();
    evaluateGateMock.mockReset();

    maybeSingleMock.mockImplementation(async (request) => {
      if (request.table === "clients") {
        return {
          id: "client-1",
          name: "Apex Retail Group",
          industry_code: "RETAIL",
          slug: "apex-retail",
        } as never;
      }
      return null;
    });
    selectMock.mockResolvedValue([]);
    queryMock.mockResolvedValue([]);
  });

  it("derives display code from industry code, name, and year", () => {
    const code = deriveDisplayCode(
      {
        name: "Healthcare Data Analytics Modernization",
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      { industryCode: "MH", slug: "meridian-health" },
    );
    expect(code).toBe("MH-HEALTHCARE-2026");
  });

  it("derives compact map labels", () => {
    expect(
      deriveMapLabel({
        name: "Healthcare Data Analytics Modernization for Agentic Care",
      }),
    ).toBe("HDAM");
  });

  it("recognizes P5 gate pass as the terminal Tower handoff completion signal", () => {
    expect(
      hasTerminalTowerHandoffPassed({
        currentPhase: 5,
        gatesPassed: [0, 1, 2, 3, 4, 5],
      } as never),
    ).toBe(true);
    expect(
      hasTerminalTowerHandoffPassed({
        currentPhase: 5,
        gatesPassed: [{ phase: "P5" }],
      } as never),
    ).toBe(true);
    expect(
      hasTerminalTowerHandoffPassed({
        currentPhase: 4,
        gatesPassed: [5],
      } as never),
    ).toBe(false);
  });

  it("recognizes persisted P5 terminal handoff activity when gates_passed is stale", () => {
    expect(
      hasTerminalTowerHandoffActivity([
        {
          title: "phase_5 · completed (was in_progress)",
          detail: "Completed P5 terminal Tower handoff",
        },
      ]),
    ).toBe(true);
    expect(
      hasTerminalTowerHandoffActivity([
        {
          action: "phase_5:completed",
          summary: "phase_5 moved to completed",
        },
      ]),
    ).toBe(true);
    expect(
      hasTerminalTowerHandoffActivity([
        {
          action: "phase_5_launch_readiness:signed_off",
          summary: "phase_5_launch_readiness moved to signed_off",
        },
      ]),
    ).toBe(false);
  });

  it("recognizes an approved P5 phase snapshot as terminal Tower handoff completion", () => {
    expect(
      hasTerminalTowerHandoffSnapshot([
        {
          phase_number: 5,
          approval_status: "approved",
        },
      ]),
    ).toBe(true);
    expect(
      hasTerminalTowerHandoffSnapshot([
        {
          phase_number: 5,
          approval_status: "pending",
        },
      ]),
    ).toBe(false);
    expect(
      hasTerminalTowerHandoffSnapshot([
        {
          phase_number: 4,
          approval_status: "approved",
        },
      ]),
    ).toBe(false);
  });

  it("keeps portfolio list hydration from running expensive gate evaluation by default", async () => {
    const move = {
      id: "move-1",
      clientId: "client-1",
      name: "FedNow modernization",
      sponsorPersonId: null,
      problemStatement: null,
      targetOutcome: null,
      timelineHorizon: null,
      valueProjectedLowUsd: null,
      valueProjectedHighUsd: null,
      valueVerifiedUsd: null,
      valueVerifiedStatus: null,
      valueCurrency: null,
      valueAssumptions: null,
      archetype: null,
      originSource: null,
      originSourceRef: null,
      status: "active",
      lifecycleState: "active",
      currentPhase: 1,
      currentModuleKey: null,
      maestroOversightLevel: null,
      founderApprovalRequired: false,
      phaseLockedAt: null,
      phaseLockedByUserId: null,
      dataResidencyRegion: null,
      retentionPolicyYears: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: null,
      charter: null,
      functionPackKey: null,
      functionPackConfidence: null,
      gatesPassed: [],
    } as never;

    const portfolio = await buildStrategicMovePortfolio(
      { clientId: "client-1", userId: "user-1" },
      [move],
    );

    expect(evaluateGateMock).not.toHaveBeenCalled();
    expect(portfolio.moves[0]?.gateCriteria).toEqual([
      {
        id: "charter_signed_off",
        label: "Charter signed off",
        severity: "hard",
        verified: false,
        completed: false,
      },
    ]);
  });

  it("marks the Strategic Move page model terminal-complete from an approved P5 snapshot", async () => {
    selectMock.mockImplementation(async (request) => {
      if (request.table === "phase_snapshots") {
        return [
          {
            created_at: "2026-07-17T07:01:06.000Z",
            phase_number: 5,
            approval_status: "approved",
          },
        ] as never;
      }
      return [];
    });

    const move = await buildStrategicMove(
      { clientId: "client-1", userId: "user-1" },
      {
        id: "move-1",
        clientId: "client-1",
        name: "Terminal handoff proof",
        sponsorPersonId: null,
        problemStatement: null,
        targetOutcome: null,
        timelineHorizon: null,
        valueProjectedLowUsd: null,
        valueProjectedHighUsd: null,
        valueVerifiedUsd: null,
        valueVerifiedStatus: null,
        valueCurrency: null,
        valueAssumptions: null,
        archetype: null,
        originSource: null,
        originSourceRef: null,
        status: "active",
        lifecycleState: "active",
        currentPhase: 5,
        currentModuleKey: null,
        maestroOversightLevel: null,
        founderApprovalRequired: false,
        phaseLockedAt: null,
        phaseLockedByUserId: null,
        dataResidencyRegion: null,
        retentionPolicyYears: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: null,
        charter: null,
        functionPackKey: null,
        functionPackConfidence: null,
        gatesPassed: [],
      } as never,
      { evaluateGateCriteria: false },
    );

    expect(move.terminalComplete).toBe(true);
  });

  it("marks the Strategic Move page model terminal-complete from the explicit P5 module row", async () => {
    selectMock.mockImplementation(async (request) => {
      if (
        request.table === "module_state_log" &&
        request.where &&
        "module_key" in request.where
      ) {
        return [
          {
            created_at: "2026-07-17T07:01:06.000Z",
            module_key: "phase_5",
            new_state: "completed",
            changed_by_user_id: null,
          },
        ] as never;
      }
      return [];
    });

    const move = await buildStrategicMove(
      { clientId: "client-1", userId: "user-1" },
      {
        id: "move-1",
        clientId: "client-1",
        name: "Terminal handoff proof",
        sponsorPersonId: null,
        problemStatement: null,
        targetOutcome: null,
        timelineHorizon: null,
        valueProjectedLowUsd: null,
        valueProjectedHighUsd: null,
        valueVerifiedUsd: null,
        valueCurrency: null,
        valueAssumptions: null,
        valueVerifiedStatus: null,
        archetype: null,
        originSource: null,
        originSourceRef: null,
        status: "active",
        lifecycleState: "active",
        currentPhase: 5,
        currentModuleKey: null,
        maestroOversightLevel: null,
        founderApprovalRequired: false,
        phaseLockedAt: null,
        phaseLockedByUserId: null,
        dataResidencyRegion: null,
        retentionPolicyYears: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: null,
        charter: null,
        functionPackKey: null,
        functionPackConfidence: null,
        gatesPassed: [],
      } as never,
      { evaluateGateCriteria: false },
    );

    expect(move.terminalComplete).toBe(true);
    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "module_state_log",
        where: expect.objectContaining({
          engagement_id: "move-1",
          module_key: "phase_5",
        }),
        limit: 1,
      }),
    );
  });

  it("renders a sparse newly-created Move instead of throwing on missing optional state", async () => {
    maybeSingleMock.mockImplementation(async (request) => {
      if (request.table === "clients") {
        return {
          id: "client-1",
          name: "Lakeshore Holdings",
          industry_code: "RETAIL",
          slug: "lakeshore",
        } as never;
      }
      return null;
    });
    selectMock.mockImplementation(async (request) => {
      if (request.table === "program_audit_log") {
        throw new Error("optional activity table unavailable");
      }
      return [];
    });

    const move = await buildStrategicMove(
      { clientId: "client-1", userId: "user-1" },
      {
        id: "4df724ce-d4d4-48cf-8329-49eeae5eb66a",
        clientId: "client-1",
        name: "" as never,
        sponsorPersonId: null,
        problemStatement: null,
        targetOutcome: null,
        timelineHorizon: null,
        valueProjectedLowUsd: null,
        valueProjectedHighUsd: null,
        valueVerifiedUsd: null,
        valueVerifiedStatus: null,
        valueCurrency: null,
        valueAssumptions: null,
        archetype: null,
        originSource: null,
        originSourceRef: null,
        status: null,
        lifecycleState: "draft",
        currentPhase: 2,
        currentModuleKey: null,
        maestroOversightLevel: null,
        founderApprovalRequired: false,
        phaseLockedAt: null,
        phaseLockedByUserId: null,
        dataResidencyRegion: null,
        retentionPolicyYears: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: "2026-06-27T00:00:00.000Z",
        updatedAt: null,
        charter: null,
        functionPackKey: null,
        functionPackConfidence: null,
        gatesPassed: [],
      } as never,
    );

    expect(move.name).toBe("—");
    expect(move.displayCode).toMatch(/RETAIL-MOVE-2026/);
    expect(move.status.text).toBeTruthy();
    expect(move.recentActivity).toEqual([]);
  });
});
