// Wiring proof for `approved-gate-phases`: the two generation readers that used
// to ask only `engagements.gates_passed` now ask the authoritative record too.
//
// This lives in `src/lib/programs/__tests__` rather than beside its subject
// because this directory is swept by a REQUIRED check, and the consumer's own
// suite directory is swept only by a non-required job. A correct module that no
// caller reaches would otherwise pass every gate.

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@/lib/agent/stream", () => ({ streamAgentTurn: jest.fn() }));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: jest.fn() },
}));

jest.mock("@/lib/programs/queries", () => ({
  getModuleState: jest.fn(),
  getPhaseSnapshots: jest.fn(),
  getProgramById: jest.fn(),
}));

jest.mock("@/lib/programs/programs-broker-adapter", () => ({
  buildProgramsContextBundleAsync: jest.fn().mockResolvedValue({}),
  formatProgramsBrokerBundleForPrompt: jest.fn().mockReturnValue(""),
}));

jest.mock("@/lib/programs/evidence-context", () => ({
  listProgramEvidenceForPrompt: jest.fn().mockResolvedValue([]),
  formatProgramEvidenceForPrompt: jest.fn().mockReturnValue(""),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/prompt-context", () => ({
  loadStageReadinessPromptContext: jest.fn().mockResolvedValue(null),
  formatStageReadinessPromptContext: jest.fn().mockReturnValue(""),
}));

import {
  getModuleState,
  getPhaseSnapshots,
  getProgramById,
} from "@/lib/programs/queries";
import { createMovesGenerateArtifactDeps } from "@/lib/deliverables/moves-generate-deps";

const mockGetModuleState = getModuleState as jest.Mock;
const mockGetPhaseSnapshots = getPhaseSnapshots as jest.Mock;
const mockGetProgramById = getProgramById as jest.Mock;

const CTX = {
  clientId: "client-1",
  clientKey: "demo-tenant",
  userId: "user-1",
  role: "program_user",
} as Parameters<typeof createMovesGenerateArtifactDeps>[0];

// A Move seeded past P0/P1 and then walked through the product: its P2 gate
// approval exists as an approved phase snapshot, and `gates_passed` was never
// appended to, because no reachable control appends P1-P4 to it.
const SEEDED_GATES_PASSED = [
  { phase: 0, status: "approved", signed_at: "2026-09-26T00:00:00.000Z" },
  { phase: 1, status: "approved", signed_at: "2026-09-30T00:00:00.000Z" },
];

const P2_CAPTURE_MODULE = {
  phaseNumber: 2,
  status: "completed",
  moduleKey: "p2_current_state_findings",
  moduleName: "Current state findings",
  state: {
    value: "Intake is split across four queues with no single owner.",
    capture_section_key: "current_state_findings",
    label: "Current state findings",
  },
};

const P3_CAPTURE_MODULE = {
  phaseNumber: 3,
  status: "in_progress",
  moduleKey: "p3_solution_approach",
  moduleName: "Solution approach",
  state: {
    value: "Consolidate intake behind one governed queue.",
    capture_section_key: "solution_approach",
    label: "Solution approach",
  },
};

function programWithSeededGates() {
  return { id: "move-1", gatesPassed: SEEDED_GATES_PASSED };
}

describe("loadPhaseCapture inherits a phase approved only by a snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProgramById.mockResolvedValue(programWithSeededGates());
    mockGetModuleState.mockResolvedValue([P2_CAPTURE_MODULE, P3_CAPTURE_MODULE]);
  });

  it("carries P2 capture into P3 when the P2 gate is approved in the snapshots", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([
      { phaseNumber: 2, approvalStatus: "approved" },
    ]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    const digest = await deps.contextSources!.loadPhaseCapture!("move-1", 3);

    expect(digest).not.toBeNull();
    expect(digest!.currentState).toContain("P2 approved capture");
    expect(digest!.currentState).toContain("four queues with no single owner");
  });

  it("does NOT carry P2 capture when neither record approves the P2 gate", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([
      { phaseNumber: 2, approvalStatus: "pending" },
    ]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    const digest = await deps.contextSources!.loadPhaseCapture!("move-1", 3);

    expect(digest).not.toBeNull();
    // The current phase's own capture still reaches the digest...
    expect(digest!.currentState).toContain("Consolidate intake");
    // ...but nothing is inherited from the un-approved phase.
    expect(digest!.currentState).not.toContain("P2 approved capture");
  });

  it("reads the whole Move's snapshots, not one phase's", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    await deps.contextSources!.loadPhaseCapture!("move-1", 3);

    expect(mockGetPhaseSnapshots).toHaveBeenCalledWith(CTX, "move-1");
  });
});

describe("loadDecisions reports gates approved only by a snapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProgramById.mockResolvedValue(programWithSeededGates());
    mockGetModuleState.mockResolvedValue([]);
  });

  it("includes a product-approved phase the denormalized array omits", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([
      { phaseNumber: 2, approvalStatus: "approved" },
      { phaseNumber: 3, approvalStatus: "approved" },
    ]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    const decisions = await deps.contextSources!.loadDecisions!("move-1");

    expect(decisions.map((d) => d.phase).sort()).toEqual([0, 1, 2, 3]);
  });

  it("still reports the seeded phases when no snapshot exists", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    const decisions = await deps.contextSources!.loadDecisions!("move-1");

    expect(decisions.map((d) => d.phase).sort()).toEqual([0, 1]);
  });

  it("reports no decision for a phase whose snapshot is not approved", async () => {
    mockGetPhaseSnapshots.mockResolvedValue([
      { phaseNumber: 4, approvalStatus: "rejected" },
    ]);
    const deps = createMovesGenerateArtifactDeps(CTX);

    const decisions = await deps.contextSources!.loadDecisions!("move-1");

    expect(decisions.map((d) => d.phase)).not.toContain(4);
  });
});
