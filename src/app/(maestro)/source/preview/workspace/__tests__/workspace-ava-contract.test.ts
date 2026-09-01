import fs from "node:fs";
import path from "node:path";

const workspaceClientSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx",
  ),
  "utf8",
);

const buildViewModelSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/buildViewModel.ts",
  ),
  "utf8",
);

const contextLensSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/lenses/ContextLens.tsx",
  ),
  "utf8",
);

const workspaceCssSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/app/(maestro)/source/preview/workspace/workspace.css",
  ),
  "utf8",
);

const surfaceRetrieverSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/intelligence/ask/retrievers/surface-context.ts",
  ),
  "utf8",
);

describe("Source Workspace aVa contract", () => {
  it("uses the rich aVa route and passes structured workspace context", () => {
    expect(workspaceClientSource).toMatch(
      /SOURCE_WORKSPACE_AGENT_API_URL\s*=\s*["']\/api\/intelligence\/ask["']/,
    );
    expect(workspaceClientSource).toMatch(/format:\s*["']rich["']/);
    expect(workspaceClientSource).toContain("richText: true");
    expect(workspaceClientSource).toContain("answerOnlyStreaming: true");
    expect(workspaceClientSource).toContain("surfaceContext: vm.avaSurfaceContext");
    expect(workspaceClientSource).not.toContain(
      "JSON.stringify(vm.avaSurfaceContext)}. The user is asking",
    );
  });

  it("preserves structured answer packets for chart table and graph rendering", () => {
    expect(workspaceClientSource).toMatch(
      /event\.type\s*===\s*["']agent-answer["']/,
    );
    expect(workspaceClientSource).toContain("agentAnswer: answerPacket");
    expect(workspaceClientSource).toContain("hasPacketArtifacts(answerPacket)");
    expect(workspaceClientSource).toContain("AskSource");
  });

  it("does not render artifact protocol envelopes as visible chat prose fallback", () => {
    expect(workspaceClientSource).toContain("stripArtifactsForDisplay");
    expect(workspaceClientSource).toContain(
      "stripGovernedArtifactPayloadsFromText",
    );
  });

  it("grounds aVa in flat Source facts instead of only nested Source V4 JSON", () => {
    expect(buildViewModelSource).toMatch(/module:\s*["']Source["']/);
    expect(buildViewModelSource).toContain("activeTab: sourceWorkspaceActiveTab");
    expect(buildViewModelSource).toContain("pageFacts: sourceWorkspacePageFacts");
    expect(buildViewModelSource).toContain("vendorFacts: sourceWorkspaceVendorFacts");
    expect(buildViewModelSource).toContain("...sourceWorkspaceOpportunityFacts");
    expect(buildViewModelSource).toContain("...sourceWorkspaceLedgerFacts");
    expect(buildViewModelSource).toContain("graphFacts: sourceWorkspaceGraphFacts");
    expect(buildViewModelSource).toContain(
      "When a user asks for a chart, table, trend, or graph",
    );
  });

  it("labels Source citations as Source instead of hardcoding Intelligence", () => {
    expect(surfaceRetrieverSource).toContain("const activeModule");
    expect(surfaceRetrieverSource).toContain("Active ${activeModule} surface");
    expect(surfaceRetrieverSource).toContain(
      "${activeClient} live ${activeModule} surface",
    );
  });

  it("keeps Source 360 navigable without the old fixed-width cockpit canvas", () => {
    expect(workspaceClientSource).not.toContain(
      'width: isVendor360Cockpit ? "min(100%, 1280px)"',
    );
    expect(workspaceClientSource).toContain("<WorkspaceExecutiveShell");
    expect(workspaceCssSource).toContain(".sw-v2-root");
    expect(workspaceCssSource).toContain("height: calc(100dvh - 73px)");
    expect(workspaceCssSource).toContain(".sw-v2-horizontal-tabs");
    expect(workspaceCssSource).toContain(".sw-v2-content-canvas");
    expect(workspaceCssSource).not.toContain(".sw-v2-frame-bar");
    expect(workspaceCssSource).not.toContain(".sw-v2-sticky-context");
    expect(workspaceCssSource).toContain("@media (max-width: 1180px)");
    expect(contextLensSource).not.toContain("width: min(100%, 1280px)");
  });
});
