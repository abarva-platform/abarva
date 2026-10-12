const mockCanReadProgram = jest.fn();
const mockAzureSelect = jest.fn();
const mockAzureMaybeSingle = jest.fn();
const mockAzureQuery = jest.fn();
const mockBuildStrategicMove = jest.fn();

jest.mock("../transformers", () => ({
  buildStrategicMove: (...args: unknown[]) => mockBuildStrategicMove(...args),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  canReadProgram: (...args: unknown[]) => mockCanReadProgram(...args),
  loadUserProgramAccessPolicy: jest.fn(async () => ({
    canApproveGates: false,
  })),
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    select: (...args: unknown[]) => mockAzureSelect(...args),
    maybeSingle: (...args: unknown[]) => mockAzureMaybeSingle(...args),
    query: (...args: unknown[]) => mockAzureQuery(...args),
  },
}));

import { getEngagementWithPhaseData } from "../db-phase-queries";
import {
  getStrategicMoveById,
  getProgramById,
  getModuleState,
  getPhaseSnapshots,
  getOriginationRequestState,
  getProgramDeliverables,
} from "../queries";
import { createPhasePageReadSet } from "../phase-page-gate-reads";
import type { TenancyCtx, ProgramCore } from "../types.db";

describe("getEngagementWithPhaseData", () => {
  beforeEach(() => {
    mockCanReadProgram.mockReset();
    mockAzureSelect.mockReset();
    mockAzureMaybeSingle.mockReset();
    mockCanReadProgram.mockResolvedValue(true);
    mockAzureMaybeSingle.mockResolvedValue({
      id: "program-1",
      client_id: "client-1",
      name: "Apex CDP",
      status: "active",
      lifecycle_state: "in_progress",
      current_phase: 3,
      program_archetype: "ai_transformation",
      maestro_oversight_level: "standard",
      sponsor_person_id: "person-1",
      maestro_person_id: null,
      charter: { objective: "Improve loyalty" },
    });
    mockAzureSelect.mockImplementation((request: { table: string }) => {
      switch (request.table) {
        case "program_milestones":
          return Promise.resolve([
            {
              id: "milestone-1",
              name: "Gate 3",
              status: "open",
              target_date: null,
              phase_number: 3,
            },
          ]);
        case "program_risks":
          return Promise.resolve([]);
        case "persons":
          return Promise.resolve([
            { id: "person-1", name: "Priya Shah", role: "CIO" },
          ]);
        case "evidence":
          return Promise.resolve([
            {
              id: "evidence-1",
              summary: "Evidence",
              evidence_type: "note",
              confidence_level: "high",
              observed_at: null,
              created_at: "2026-05-01T00:00:00Z",
            },
          ]);
        case "engagement_phases":
          return Promise.resolve([{ id: "phase-1" }]);
        case "phase_approvals":
          return Promise.resolve([
            {
              id: "approval-1",
              action: "approved",
              actor_name: "Sponsor",
              created_at: "2026-05-01T00:00:00Z",
            },
          ]);
        case "program_modules":
        case "program_evidence_items":
        case "deliverables_v2":
        case "program_audit_log":
          return Promise.resolve([]);
        default:
          return Promise.reject(new Error(`unexpected table ${request.table}`));
      }
    });
  });

  it("assembles phase data through azureRead after RBAC", async () => {
    const result = await getEngagementWithPhaseData("program-1", "client-1", {
      clientId: "client-1",
      userId: "user-1",
    });

    expect(mockCanReadProgram).toHaveBeenCalledWith(
      { clientId: "client-1", userId: "user-1" },
      "program-1",
    );
    expect(mockAzureMaybeSingle).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "engagements",
        where: { id: "program-1", client_id: "client-1" },
      }),
    );
    expect(result?.engagement.name).toBe("Apex CDP");
    expect(result?.engagement.sponsor).toEqual({
      name: "Priya Shah",
      role: "CIO",
    });
    expect(result?.gateApprovals).toHaveLength(1);
  });

  it("returns null when RBAC denies access", async () => {
    mockCanReadProgram.mockResolvedValue(false);

    await expect(
      getEngagementWithPhaseData("program-1", "client-1", {
        clientId: "client-1",
        userId: "user-1",
      }),
    ).resolves.toBeNull();
    expect(mockAzureMaybeSingle).not.toHaveBeenCalled();
  });
});

describe("getStrategicMoveById with a request-scoped canonical loader", () => {
  const ctx: TenancyCtx = { clientId: "client-1", userId: "user-1" };
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanReadProgram.mockResolvedValue(false);
    mockBuildStrategicMove.mockResolvedValue({ id: "move-1" });
  });

  it("reuses the loaded program and passes shared snapshots to its projection", async () => {
    const program = { id: "move-1", clientId: "client-1" } as ProgramCore;
    const loadProgram = jest.fn(async () => program);
    const loadPhaseSnapshots = jest.fn(async () => []);
    const options = {
      evaluateGateCriteria: false,
      loadProgram,
      loadPhaseSnapshots,
    };
    expect(await getStrategicMoveById(ctx, "move-1", options)).toEqual({
      id: "move-1",
    });
    expect(loadProgram).toHaveBeenCalledTimes(1);
    expect(loadProgram).toHaveBeenCalledWith(ctx, "move-1", options);
    expect(mockBuildStrategicMove).toHaveBeenCalledWith(ctx, program, options);
    expect(mockCanReadProgram).not.toHaveBeenCalled();
  });

  it("does not project an inaccessible program or retry an unavailable shared read", async () => {
    const absent = jest.fn(async () => null);
    expect(
      await getStrategicMoveById(ctx, "move-1", { loadProgram: absent }),
    ).toBeNull();
    const error = new Error("Move read unavailable");
    const failed = jest.fn(async () => {
      throw error;
    });
    await expect(
      getStrategicMoveById(ctx, "move-1", { loadProgram: failed }),
    ).rejects.toBe(error);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(mockBuildStrategicMove).not.toHaveBeenCalled();
  });

  it("keeps the canonical RBAC check on the default path", async () => {
    expect(await getStrategicMoveById(ctx, "move-1")).toBeNull();
    expect(mockCanReadProgram).toHaveBeenCalledWith(ctx, "move-1");
    expect(mockBuildStrategicMove).not.toHaveBeenCalled();
  });

  it("shares one canonical denial across program, module and snapshot readers", async () => {
    const readSet = createPhasePageReadSet(ctx, "move-1");
    const results = await Promise.allSettled([
      getProgramById(ctx, "move-1", { readSet }),
      getModuleState(ctx, "move-1", { readSet }),
      getPhaseSnapshots(ctx, "move-1", undefined, { readSet }),
    ]);
    expect(mockCanReadProgram).toHaveBeenCalledTimes(1);
    expect(mockCanReadProgram).toHaveBeenCalledWith(ctx, "move-1", { readSet });
    expect(results[0]).toEqual({ status: "fulfilled", value: null });
    for (const result of results.slice(1)) {
      expect(result.status).toBe("rejected");
      if (result.status === "rejected")
        expect(String(result.reason)).toContain("not accessible");
    }
  });

  it("propagates the same failed access read without treating it as a denial or retrying", async () => {
    const error = new Error("Access read unavailable");
    mockCanReadProgram.mockRejectedValue(error);
    const readSet = createPhasePageReadSet(ctx, "move-1");
    const results = await Promise.allSettled([
      getProgramById(ctx, "move-1", { readSet }),
      getModuleState(ctx, "move-1", { readSet }),
      getPhaseSnapshots(ctx, "move-1", undefined, { readSet }),
    ]);
    expect(mockCanReadProgram).toHaveBeenCalledTimes(1);
    expect(results).toEqual(
      Array.from({ length: 3 }, () => ({ status: "rejected", reason: error })),
    );
  });
});

describe("phase page independent readiness scheduling", () => {
  it("starts discovery readiness before the Move projection completes", async () => {
    jest.resetModules();
    await jest.isolateModulesAsync(async () => {
      const moveId = "00000000-0000-4000-8000-000000000001";
      const ctx = {
        clientId: "tenant-a",
        clientKey: "tenant-a",
        userId: "user-a",
      };
      const stop = new Error("End the route after the scheduling observation");
      let finish!: (error: Error) => void;
      const projection = new Promise<never>((_resolve, reject) => {
        finish = reject;
      });
      const discovery = jest.fn(async () => ({}));
      jest.doMock("@/lib/auth/server-module-access", () => ({
        requireProductModule: jest.fn(async () => {}),
      }));
      jest.doMock("@/lib/programs/strategic-moves-context", () => ({
        getStrategicMovesTenancy: jest.fn(async () => ctx),
      }));
      jest.doMock("@/lib/programs/queries", () => ({
        getProgramById: jest.fn(async () => ({ id: moveId, name: "A Move" })),
        getModuleState: jest.fn(async () => []),
        getPhaseSnapshots: jest.fn(async () => []),
        getStrategicMoveById: jest.fn(() => projection),
      }));
      jest.doMock("@/lib/programs/transformers", () => ({
        buildGateCriteria: jest.fn(async () => []),
      }));
      jest.doMock("@/lib/programs/governance", () => ({
        evaluateGate: jest.fn(),
      }));
      jest.doMock("@/lib/auth/program-access-policy", () => ({
        loadUserProgramAccessPolicy: jest.fn(async () => ({
          canApproveGates: false,
        })),
      }));
      jest.doMock("@/lib/features/is-feature-enabled", () => ({
        isFeatureEnabled: (_ctx: unknown, flag: string) =>
          [
            "moves_capture_v2",
            "moves_step_pages_v3",
            "moves_step_pages_p0p1_v1",
          ].includes(flag),
      }));
      jest.doMock("@/lib/programs/current-state-readiness", () => ({
        inferMoveProfile: jest.fn(async () => ({})),
        resolveCurrentStateReadiness: jest.fn(async () => null),
      }));
      jest.doMock("@/lib/programs/move-archetype-resolution", () => ({
        resolveMoveArchetypeForProgram: jest.fn(
          async () => "governed_data_foundation",
        ),
      }));
      jest.doMock("@/lib/programs/discovery/evidence-readiness", () => ({
        loadDiscoveryEvidenceReadiness: discovery,
      }));
      jest.doMock("@/lib/programs/deliverables/move-artifacts", () => ({
        listMoveArtifacts: jest.fn(async () => []),
      }));
      jest.doMock(
        "@/components/strategic-moves/MovesPhaseStandaloneClient",
        () => ({ MovesPhaseStandaloneClient: jest.fn() }),
      );
      jest.doMock("@/components/shell/AppShell", () => ({
        AppShell: jest.fn(),
      }));
      const { default: Page } =
        await import("@/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page");
      const result = Page({
        params: Promise.resolve({ moveId, phaseNum: "2" }),
        searchParams: Promise.resolve({ step: "p2-validate" }),
      }).catch((error) => error);
      await new Promise<void>((resolve) => setImmediate(resolve));
      try {
        expect(discovery).toHaveBeenCalledWith(
          ctx,
          moveId,
          expect.objectContaining({ parallelReadbacks: true }),
        );
      } finally {
        finish(stop);
      }
      expect(await result).toBe(stop);
    });
  });
});

describe("canonical origination request readback", () => {
  const ctx = { clientId: "client-a", userId: "user-a" };
  beforeEach(() => {
    mockCanReadProgram.mockReset().mockResolvedValue(true);
    mockAzureQuery.mockReset();
  });
  it("shares the existing request read across page consumers without promoting its pending status", async () => {
    mockAzureQuery.mockResolvedValue([
      {
        id: "request-a",
        program_id: "move-a",
        request_status: "pending",
        brief_snapshot: {},
      },
    ]);
    const readSet = createPhasePageReadSet(ctx, "move-a");
    const load = () =>
      readSet(ctx, "move-a", "originationApprovalRequests", () =>
        getOriginationRequestState(ctx, "move-a", { readSet }),
      );
    const [gate, page] = await Promise.all([load(), load()]);
    expect(gate).toBe(page);
    expect(page[0].requestStatus).toBe("pending");
    expect(mockAzureQuery).toHaveBeenCalledTimes(1);
    expect(mockAzureQuery.mock.calls[0][0]).toContain("WHERE program_id = $1");
    expect(mockAzureQuery.mock.calls[0][1]).toEqual(["move-a"]);
    expect(mockAzureQuery.mock.calls[0][2]).toEqual({ missingTable: "throw" });
  });
  it("refuses denied access before reading a request", async () => {
    mockCanReadProgram.mockResolvedValue(false);
    await expect(getOriginationRequestState(ctx, "move-a")).rejects.toThrow(
      "not accessible",
    );
    expect(mockAzureQuery).not.toHaveBeenCalled();
  });
  it("keeps a read failure and another Move's returned row unavailable", async () => {
    mockAzureQuery.mockRejectedValueOnce(new Error("request read unavailable"));
    await expect(getOriginationRequestState(ctx, "move-a")).rejects.toThrow(
      "request read unavailable",
    );
    mockAzureQuery.mockResolvedValueOnce([
      { id: "request-b", program_id: "move-b", request_status: "approved" },
    ]);
    await expect(getOriginationRequestState(ctx, "move-a")).rejects.toThrow(
      "scope or state unavailable",
    );
  });
});

describe("canonical deliverables read sharing", () => {
  const ctx = {
    clientId: "client-1",
    clientKey: "tenant-1",
    userId: "user-1",
  } as TenancyCtx;
  beforeEach(() => {
    mockCanReadProgram.mockReset().mockResolvedValue(true);
    mockAzureQuery.mockReset();
  });
  it("shares the exact full canonical rows while keeping version and signature columns", async () => {
    const rows = [
      {
        id: "brief-1",
        engagement_id: "program-1",
        deliverable_type_key: "origination_brief",
        signed_off_by: "user-1",
        current_version: 1,
        signed_off_version: 1,
        status: "signed_off",
      },
    ];
    mockAzureQuery.mockResolvedValue(rows);
    const readSet = createPhasePageReadSet(ctx, "program-1");
    const result = await Promise.all(
      [1, 2].map(() =>
        readSet(ctx, "program-1", "deliverables", () =>
          getProgramDeliverables(ctx, "program-1", { readSet }),
        ),
      ),
    );
    expect(result).toEqual([rows, rows]);
    expect(mockAzureQuery).toHaveBeenCalledTimes(1);
    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE engagement_id = $1"),
      ["program-1"],
      { missingTable: "throw" },
    );
  });
  it.each(["permission", "foreign", "read-failure"])(
    "does not substitute an empty deliverable set on %s",
    async (failure) => {
      if (failure === "permission") mockCanReadProgram.mockResolvedValue(false);
      if (failure === "foreign")
        mockAzureQuery.mockResolvedValue([
          { id: "brief-1", engagement_id: "other-move" },
        ]);
      if (failure === "read-failure")
        mockAzureQuery.mockRejectedValue(new Error("read unavailable"));
      await expect(
        getProgramDeliverables(ctx, "program-1"),
      ).rejects.toBeInstanceOf(Error);
      if (failure === "permission")
        expect(mockAzureQuery).not.toHaveBeenCalled();
    },
  );
});
