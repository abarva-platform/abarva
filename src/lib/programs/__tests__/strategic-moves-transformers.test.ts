import {
  buildGateCriteria,
  buildStrategicMove,
  buildStrategicMovePortfolio,
  gateCriteriaForViewedPhase,
  deriveDisplayCode,
  deriveMapLabel,
  hasTerminalTowerHandoffActivity,
  hasTerminalTowerHandoffPassed,
  hasTerminalTowerHandoffSnapshot,
} from "@/lib/programs/transformers";
import { azureRead } from "@/lib/data-plane/azureRead";
import { evaluateGate } from "@/lib/programs/governance";
import { demoSafeClientText } from "@/lib/client-config";

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

  // U-556. `deriveDisplayCode` copies `firstSegment(name)` -- the first
  // hyphen-separated piece of the slugified move name -- into the middle of the
  // code verbatim, so the rendered display code inherits whatever token leads
  // the move name, including a build or run stamp. That is a client-surface
  // label: `displayCode` is rendered by `MoveListTable` and in two places in
  // `StrategicMovesHomeClient`. Both halves are asserted, because only the pair
  // is the invariant: the stamp reaches the derived code, AND the shared client
  // sanitizer removes it before it renders.
  it("carries a leading run stamp from the move name into the derived display code", () => {
    expect(
      deriveDisplayCode(
        {
          name: "20260622161738 recovery",
          createdAt: "2026-06-22T16:17:38.000Z",
        },
        { industryCode: null, slug: "demo-tenant" },
      ),
    ).toBe("DEMOTENANT-20260622161738-2026");
  });

  it("renders no run stamp on the client surface for such a move", () => {
    const code = deriveDisplayCode(
      {
        name: "20260622161738 recovery",
        createdAt: "2026-06-22T16:17:38.000Z",
      },
      { industryCode: null, slug: "demo-tenant" },
    );
    expect(demoSafeClientText(code)).toBe("DEMOTENANT-2026");
    expect(demoSafeClientText(code)).not.toMatch(/\d{8}T?\d{6}Z?/);
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

  it("exports canonical gate criteria evaluated from governance state", async () => {
    evaluateGateMock.mockResolvedValue({
      pass: true,
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });

    const criteria = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
    );

    expect(evaluateGateMock).toHaveBeenCalledWith(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
      2,
    );
    expect(criteria).toEqual([
      {
        id: "charter_signed_off",
        label: "Charter signed off",
        severity: "hard",
        verified: true,
        completed: true,
      },
    ]);
  });

  it("evaluates reopened prior-phase criteria against the historical gate", async () => {
    evaluateGateMock.mockResolvedValue({
      pass: false,
      failedChecks: [
        {
          check: "charter_signed_off",
          reason: "The charter is not bound to current approved evidence.",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const criteria = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
      { allowHistoricalPhase: true },
    );

    expect(evaluateGateMock).toHaveBeenCalledWith(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
      2,
      { allowHistoricalPhase: true },
    );
    expect(criteria[0]).toMatchObject({ verified: true, completed: false });
  });

  it("projects the viewed historical gate without replacing current-phase criteria", async () => {
    const ctx = { clientId: "client-1", userId: "user-1" };
    const currentCriteria = [
      {
        id: "measurement_owner_named",
        label: "Measurement owner named",
        severity: "hard" as const,
        verified: true,
        completed: true,
      },
    ];
    const move = {
      id: "move-1",
      currentPhase: 5,
      gateCriteria: currentCriteria,
    };
    evaluateGateMock.mockResolvedValue({
      pass: true,
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });

    const historical = await gateCriteriaForViewedPhase(ctx, move, 2);
    expect(evaluateGateMock).toHaveBeenCalledWith(ctx, "move-1", 2, 3, {
      allowHistoricalPhase: true,
    });
    expect(historical[0]).toMatchObject({ verified: true, completed: true });
    expect(historical).not.toBe(currentCriteria);

    evaluateGateMock.mockClear();
    expect(await gateCriteriaForViewedPhase(ctx, move, 5)).toBe(currentCriteria);
    expect(evaluateGateMock).not.toHaveBeenCalled();
  });

  it("carries the evaluator's reason on an unmet criterion and none on a met one", async () => {
    evaluateGateMock.mockResolvedValue({
      pass: false,
      failedChecks: [
        {
          check: "charter_signed_off",
          reason: "  The charter is not bound to current approved evidence.  ",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });
    const unmet = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
    );
    expect(unmet[0]).toHaveProperty(
      "reason",
      "The charter is not bound to current approved evidence.",
    );

    evaluateGateMock.mockResolvedValue({
      pass: true,
      failedChecks: [],
      requiresApproval: false,
      approverRole: null,
    });
    const met = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
    );
    expect(met[0]).not.toHaveProperty("reason");
  });

  // A failed state read is not a per-criterion signal. The evaluator reports it
  // as one hard `gate_state_unreadable` check, and `buildGateCriteria` already
  // held the right treatment for its three siblings (`phase_mismatch`,
  // `program_not_found`, `no_rule`): mark the criteria unverified rather than
  // marking each concrete criterion failed. The compat client never throws, so
  // this arrives through the NORMAL return and the `catch` below never sees it.
  it("treats an unreadable gate state as structural, not as a failed criterion", async () => {
    evaluateGateMock.mockResolvedValue({
      pass: false,
      failedChecks: [
        {
          check: "gate_state_unreadable",
          reason: "This gate could not be evaluated: reading ... failed.",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const criteria = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
    );

    expect(criteria[0]).toMatchObject({ verified: false, completed: false });
  });

  it("still marks a named criterion failed when the state WAS read", async () => {
    // The complement: the structural list must not swallow a real failure.
    evaluateGateMock.mockResolvedValue({
      pass: false,
      failedChecks: [
        {
          check: "charter_signed_off",
          reason: "No charter is signed off.",
          severity: "hard",
        },
      ],
      requiresApproval: false,
      approverRole: null,
    });

    const criteria = await buildGateCriteria(
      { clientId: "client-1", userId: "user-1" },
      "move-1",
      1,
    );

    expect(criteria[0]).toMatchObject({ verified: true, completed: false });
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
