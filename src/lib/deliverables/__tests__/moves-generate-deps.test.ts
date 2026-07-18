jest.mock("server-only", () => ({}), { virtual: true });

const buildProgramsContextBundleAsyncMock = jest.fn();
const formatProgramsBrokerBundleForPromptMock = jest.fn();
const listProgramEvidenceForPromptMock = jest.fn();
const formatProgramEvidenceForPromptMock = jest.fn();

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

import { azureRead } from "@/lib/data-plane/azureRead";
import { createMovesGenerateArtifactDeps } from "../moves-generate-deps";

const mockAzureQuery = azureRead.query as jest.Mock;

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
    mockAzureQuery.mockReset();
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
      20,
    );
    expect(currentState).toContain("BROKER CURRENT STATE");
    expect(currentState).toContain("PROGRAM EVIDENCE LEDGER");
    expect(currentState).toContain("1,872");
    expect(currentState).toContain("2,345");
    expect(currentState).toContain("7.4");
  });

  it("loadPriorDigests prefers the client-approved version and dedupes to one row per deliverable type", async () => {
    // The dedup itself happens in Postgres (DISTINCT ON); this test proves
    // the query shape asks for that, and that whatever single row per type
    // comes back is correctly mapped through structuredDigest.
    mockAzureQuery.mockResolvedValueOnce([
      {
        structured_data: { solutionContextDigest: { summary: "P2 approved digest" } },
        version: 2,
        created_at: "2026-07-01T00:00:00Z",
        deliverable_type_key: "discovery_report",
      },
    ]);

    const deps = createMovesGenerateArtifactDeps({
      clientId: "client-1",
      clientKey: "lakeshore",
      userId: "user-1",
      role: "program_user",
    });
    const digests = await deps.contextSources.loadPriorDigests("move-1");

    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining("DISTINCT ON (d.deliverable_type_key)"),
      ["move-1"],
      { missingTable: "empty" },
    );
    expect(mockAzureQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "ORDER BY d.deliverable_type_key, (dv.version = d.signed_off_version) DESC, dv.version DESC",
      ),
      ["move-1"],
      { missingTable: "empty" },
    );
    expect(digests).toEqual([{ summary: "P2 approved digest" }]);
  });
});
