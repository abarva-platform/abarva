jest.mock("server-only", () => ({}), { virtual: true });

const buildProgramsContextBundleAsyncMock = jest.fn();
const formatProgramsBrokerBundleForPromptMock = jest.fn();
const listProgramEvidenceForPromptMock = jest.fn();
const formatProgramEvidenceForPromptMock = jest.fn();
const loadStageReadinessPromptContextMock = jest.fn();
const formatStageReadinessPromptContextMock = jest.fn();

jest.mock("@/lib/agent/stream", () => ({
  streamAgentTurn: jest.fn(),
}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

jest.mock("@/lib/programs/queries", () => ({
  getModuleState: jest.fn(),
  getPhaseSnapshots: jest.fn(),
  getProgramById: jest.fn(),
}));

jest.mock("@/lib/programs/programs-broker-adapter", () => ({
  buildProgramsContextBundleAsync: (...args: unknown[]) =>
    buildProgramsContextBundleAsyncMock(...args),
  formatProgramsBrokerBundleForPrompt: (...args: unknown[]) =>
    formatProgramsBrokerBundleForPromptMock(...args),
}));

jest.mock("@/lib/programs/evidence-context", () => ({
  listProgramEvidenceForPrompt: (...args: unknown[]) =>
    listProgramEvidenceForPromptMock(...args),
  formatProgramEvidenceForPrompt: (...args: unknown[]) =>
    formatProgramEvidenceForPromptMock(...args),
}));

jest.mock("@/lib/programs/stage-readiness-workbooks/prompt-context", () => ({
  loadStageReadinessPromptContext: (...args: unknown[]) =>
    loadStageReadinessPromptContextMock(...args),
  formatStageReadinessPromptContext: (...args: unknown[]) =>
    formatStageReadinessPromptContextMock(...args),
}));

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  getModuleState,
  getPhaseSnapshots,
  getProgramById,
} from "@/lib/programs/queries";
import { createMovesGenerateArtifactDeps } from "../moves-generate-deps";

const mockAzureQuery = azureRead.query as jest.Mock;
const mockGetModuleState = getModuleState as jest.Mock;
const mockGetProgramById = getProgramById as jest.Mock;
const mockGetPhaseSnapshots = getPhaseSnapshots as jest.Mock;

describe("createMovesGenerateArtifactDeps", () => {
  beforeEach(() => {
    buildProgramsContextBundleAsyncMock.mockReset();
    buildProgramsContextBundleAsyncMock.mockResolvedValue({ broker: true });
    formatProgramsBrokerBundleForPromptMock.mockReset();
    formatProgramsBrokerBundleForPromptMock.mockReturnValue(
      "BROKER CURRENT STATE",
    );
    listProgramEvidenceForPromptMock.mockReset();
    listProgramEvidenceForPromptMock.mockResolvedValue([{ id: "ev-1" }]);
    formatProgramEvidenceForPromptMock.mockReset();
    formatProgramEvidenceForPromptMock.mockReturnValue(
      [
        "PROGRAM EVIDENCE LEDGER (uploaded/captured):",
        "- LSH_AP_Value_Baseline_Worksheet.xlsx",
        "  Structured signals: Average monthly invoice exceptions: 1,872. | Manual touch hours per month: 2,345. | Average resolution days: 7.4.",
      ].join("\n"),
    );
    loadStageReadinessPromptContextMock.mockReset();
    loadStageReadinessPromptContextMock.mockResolvedValue({
      context: { sourcePhase: 1, targetPhase: 2 },
      openResponseCount: 2,
      reviewOpen: true,
    });
    formatStageReadinessPromptContextMock.mockReset();
    formatStageReadinessPromptContextMock.mockReturnValue(
      "ACCEPTED STAGE READINESS WORKBOOK RESPONSES (P1 to P2)",
    );
    mockAzureQuery.mockReset();
    mockGetModuleState.mockReset();
    mockGetModuleState.mockResolvedValue([]);
    mockGetProgramById.mockReset();
    mockGetProgramById.mockResolvedValue({ gatesPassed: [] });
    // The gate readers consult the authoritative approval record as well as
    // the denormalized `gates_passed` array, so this double must resolve.
    mockGetPhaseSnapshots.mockReset();
    mockGetPhaseSnapshots.mockResolvedValue([]);
  });

  it("binds uploaded program evidence alongside broker context for artifact generation", async () => {
    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });

    const currentState = await deps.contextSources.retrieveCurrentState(
      "lakeshore",
      "current state",
      "move-1",
      2,
    );

    expect(buildProgramsContextBundleAsyncMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "lakeshore",
        programId: "move-1",
        surface: "programs",
      }),
    );
    expect(listProgramEvidenceForPromptMock).toHaveBeenCalledWith(
      {
        clientId: "client-1",
        clientKey: "lakeshore",
        userId: "user-1",
        role: "program_user",
      },
      "move-1",
      2,
    );
    expect(currentState).toContain("BROKER CURRENT STATE");
    expect(currentState).toContain("PROGRAM EVIDENCE LEDGER");
    expect(currentState).toContain("1,872");
    expect(currentState).toContain("2,345");
    expect(currentState).toContain("7.4");
  });

  it("binds accepted transition answers from a review that is still open", async () => {
    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });

    const currentState = await deps.contextSources.retrieveCurrentState(
      "lakeshore",
      "current state",
      "move-1",
      2,
    );

    expect(loadStageReadinessPromptContextMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: "lakeshore" }),
      "move-1",
      2,
    );
    expect(formatStageReadinessPromptContextMock).toHaveBeenCalledWith(
      expect.objectContaining({ openResponseCount: 2, reviewOpen: true }),
    );
    expect(currentState).toContain(
      "ACCEPTED STAGE READINESS WORKBOOK RESPONSES (P1 to P2)",
    );
  });

  it("omits the transition block when no review answers this transition", async () => {
    loadStageReadinessPromptContextMock.mockResolvedValue(null);
    formatStageReadinessPromptContextMock.mockReturnValue("");
    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });

    const currentState = await deps.contextSources.retrieveCurrentState(
      "lakeshore",
      "current state",
      "move-1",
      2,
    );

    expect(currentState).not.toContain("STAGE READINESS");
    expect(currentState).toContain("BROKER CURRENT STATE");
  });

  it("loadPriorDigests includes only the exact signed-off version", async () => {
    mockAzureQuery.mockResolvedValueOnce([
      {
        structured_data: {
          solutionContextDigest: { summary: "P2 approved digest" },
        },
        version: 2,
        created_at: "2026-07-01T00:00:00Z",
        deliverable_type_key: "discovery_report",
      },
      {
        structured_data: {
          solutionContextDigest: { summary: "P3 same-phase digest" },
        },
        version: 1,
        created_at: "2026-07-02T00:00:00Z",
        deliverable_type_key: "solution_design",
      },
      {
        structured_data: {
          solutionContextDigest: { summary: "P4 future digest" },
        },
        version: 1,
        created_at: "2026-07-03T00:00:00Z",
        deliverable_type_key: "business_case",
      },
    ]);

    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });
    const digests = await deps.contextSources.loadPriorDigests("move-1", 3);

    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("d.signed_off_version IS NOT NULL"),
      ["move-1"],
      { missingTable: "empty" },
    );
    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("d.status NOT IN ('superseded', 'rejected')"),
      ["move-1"],
      { missingTable: "empty" },
    );
    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("dv.version = d.signed_off_version"),
      ["move-1"],
      { missingTable: "empty" },
    );
    expect(digests).toEqual([{ summary: "P2 approved digest" }]);
  });

  it("carries completed prior capture and the validated route only after its gate passed", async () => {
    const assessment = {
      expectedWorkflowChange: "none",
      expectedRoleAccountabilityChange: "none",
      adoptionOwner: "Business analytics lead",
      adoptionResponsibility: "business",
      evidenceReference: "evidence-p1-1",
      validatedBy: "Business sponsor",
    };
    const routeValidation = {
      businessChangeAssessmentSnapshot: assessment,
      solutionOutput: "reports_dashboards",
      workflowChange: "none",
      roleAccountabilityChange: "none",
      evidenceReference: "evidence-p2-1",
      decision: "confirm",
      selectedRoute: "technical_product",
      correctionRationale: "",
      validatedBy: "Business sponsor",
    };
    mockGetModuleState.mockResolvedValue([
      {
        phaseNumber: 1,
        moduleKey: "phase_1_business_change_assessment",
        moduleName: "Business change assessment",
        status: "completed",
        state: {
          capture_section_key: "business_change_assessment",
          label: "Business change assessment",
          value: JSON.stringify(assessment),
        },
      },
      {
        phaseNumber: 2,
        moduleKey: "phase_2_solution_route_validation",
        moduleName: "Solution route validation",
        status: "completed",
        state: {
          capture_section_key: "solution_route_validation",
          label: "Solution route validation",
          value: JSON.stringify(routeValidation),
        },
      },
      {
        phaseNumber: 3,
        moduleKey: "phase_3_solution_approach",
        moduleName: "Solution approach",
        status: "in_progress",
        state: {
          capture_section_key: "solution_approach",
          label: "Solution approach",
          value: "Draft technical approach.",
        },
      },
    ]);
    mockGetProgramById.mockResolvedValue({ gatesPassed: [1, 2] });

    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });
    const capture = await deps.contextSources.loadPhaseCapture!("move-1", 3);

    expect(capture?.currentState).toContain(
      "P2 approved capture: Solution route validation",
    );
    expect(capture?.currentState).toContain("Confirmed route: technical_product");
    expect(capture?.currentState).toContain("Approved evidence reference: evidence-p2-1");
    expect(capture?.currentState).toContain("Draft technical approach.");
    expect(capture?.humanApprovalNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("P2 human-validated solution route"),
        expect.stringContaining("reviewer Business sponsor"),
      ]),
    );

    mockGetProgramById.mockResolvedValue({ gatesPassed: [1] });
    const unapprovedCapture = await deps.contextSources.loadPhaseCapture!(
      "move-1",
      3,
    );
    expect(unapprovedCapture?.currentState).not.toContain(
      "Confirmed route: technical_product",
    );
    expect(unapprovedCapture?.currentState).toContain("Draft technical approach.");
  });

  it("carries a P2 root-cause register into P3 as ranked text, and free text unchanged", async () => {
    const register = {
      kind: "root_cause_register",
      version: 1,
      orderConfirmedAt: "2026-10-02",
      causes: [
        { id: "RC-2", cause: "Definitions conflict", status: "accepted", evidence: ["Profile"] },
        { id: "RC-1", cause: "No ownership", status: "draft" },
        { id: "S-1", cause: "Reports disagree", status: "symptom", symptomOf: "RC-2" },
      ],
    };
    const captureRow = (value: string) => ({
      phaseNumber: 2,
      moduleKey: "phase_2_gaps_root_causes",
      moduleName: "Gaps / root causes",
      status: "completed",
      state: {
        capture_section_key: "gaps_root_causes",
        label: "Gaps / root causes",
        value,
      },
    });
    mockGetProgramById.mockResolvedValue({ gatesPassed: [1, 2] });
    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });

    mockGetModuleState.mockResolvedValue([captureRow(JSON.stringify(register))]);
    const structured = await deps.contextSources.loadPhaseCapture!("move-1", 3);
    expect(structured?.currentState).toContain(
      "1. RC-2: Definitions conflict (accepted) · evidence: Profile",
    );
    expect(structured?.currentState).toContain("2. RC-1: No ownership (draft, not yet accepted)");
    expect(structured?.currentState).not.toContain('"kind"');
    // Generation's root causes carry only settled causes, at their rank.
    expect(structured?.rootCauses).toEqual(["1. Definitions conflict · evidence: Profile"]);
    expect(structured?.gaps).toEqual(structured?.rootCauses);

    mockGetModuleState.mockResolvedValue([captureRow("Ownership is unclear.")]);
    const legacy = await deps.contextSources.loadPhaseCapture!("move-1", 3);
    expect(legacy?.currentState).toContain("Ownership is unclear.");
    expect(legacy?.rootCauses).toEqual(["Ownership is unclear."]);
  });

  it("keeps the prior approved architecture authoritative when the current version is a draft", async () => {
    mockAzureQuery.mockResolvedValueOnce([
      {
        id: "architecture-v1",
        structured_data: {
          solutionContextDigest: {
            architecture: "Approved reference architecture",
          },
        },
        content: null,
        version: 1,
        status: "draft",
        signed_off_version: 1,
        deliverable_type_key: "target_state_architecture",
      },
    ]);
    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "tenant-one",
      userId: "user-1",
      role: "program_user",
    });

    const prior = await deps.contextSources.loadPriorDeliverables!("move-1");

    expect(prior[0]).toMatchObject({
      acceptance: "accepted",
      lineageRef: "architecture-v1",
      digest: { architecture: "Approved reference architecture" },
    });
    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("dv.version = d.signed_off_version"),
      ["move-1", expect.any(Array)],
      { missingTable: "empty" },
    );
  });
});
