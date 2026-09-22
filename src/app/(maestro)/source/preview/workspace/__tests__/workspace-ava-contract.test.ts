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

import { retrieveSurfaceContextSources } from "@/lib/intelligence/ask/retrievers/surface-context";

describe("Source Workspace aVa contract", () => {
  it("uses the rich aVa route and passes structured workspace context", () => {
    expect(workspaceClientSource).toMatch(
      /SOURCE_WORKSPACE_AGENT_API_URL\s*=\s*["']\/api\/intelligence\/ask["']/,
    );
    expect(workspaceClientSource).toMatch(/format:\s*["']rich["']/);
    expect(workspaceClientSource).toContain("richText: true");
    expect(workspaceClientSource).toContain("answerOnlyStreaming: true");
    expect(workspaceClientSource).toContain("surfaceContext: vm.avaSurfaceContext");
    expect(workspaceClientSource).toContain(
      "composerDisabledReason={avaComposerDisabledReason}",
    );
    expect(workspaceClientSource).toContain(
      "sourceAvaComposerDisabledReason",
    );
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

  it("passes a Source-specific claim and refusal contract to aVa", () => {
    expect(buildViewModelSource).toContain("claimContract: sourceWorkspaceClaimContract");
    expect(buildViewModelSource).toContain("capabilities: sourceWorkspaceCapabilities");
    expect(buildViewModelSource).toContain("refusalExamples: sourceWorkspaceRefusalExamples");
    expect(buildViewModelSource).toContain("groundingStatus: sourceWorkspaceGroundingStatus");
    expect(buildViewModelSource).toContain(
      "Do not claim realized savings, ROI, or total savings unless finance confirmation is explicitly loaded and confirmed.",
    );
    expect(buildViewModelSource).toContain(
      "Do not recommend a supplier award, shortlist, BAFO position, or final sourcing decision unless selected-event scoring, pricing, trap-log, and approval evidence are loaded.",
    );
    expect(buildViewModelSource).toContain(
      "Do not disclose or infer another tenant's suppliers, contracts, pricing, events, or benchmarks.",
    );
    expect(buildViewModelSource).toContain(
      "Render a structured exhibit only from loaded rows; otherwise explain the missing row family.",
    );
  });

  it("labels Source citations as Source instead of hardcoding Intelligence", () => {
    // Executable: the retriever is called and its output inspected. The
    // previous version asserted the template-literal text in the source file,
    // which a comment quoting the same string satisfied.
    const sources = retrieveSurfaceContextSources(
      {
        module: "Source",
        activeClient: "Tenant",
        activeTab: "contracts",
        pageFacts: ["Contract count: 12"],
      } as Parameters<typeof retrieveSurfaceContextSources>[0],
      "what is on this page",
    );

    expect(sources.length).toBeGreaterThan(0);
    const blob = JSON.stringify(sources);
    expect(blob).toContain("Active Source surface");
    expect(blob).toContain("Tenant live Source surface");
    // The negative half, and the reason the case exists: the label must come
    // from the caller's module, not be hardcoded to Intelligence.
    expect(blob).not.toContain("Active Intelligence surface");
  });

  it("falls back to Intelligence only when the caller names no module", () => {
    // Pins the default, so "reads the module" cannot be satisfied by a
    // function that ignores its input and happens to say Source.
    const sources = retrieveSurfaceContextSources(
      {
        activeClient: "Tenant",
        activeTab: "contracts",
        pageFacts: ["Contract count: 12"],
      } as Parameters<typeof retrieveSurfaceContextSources>[0],
      "what is on this page",
    );
    expect(JSON.stringify(sources)).toContain("Active Intelligence surface");
  });

  /**
   * SOURCE-TEXT BY NECESSITY, and named as one.
   *
   * This asserts class names and layout rules in a stylesheet. jsdom does not
   * apply CSS, so no assertion available in this harness can evaluate what
   * these rules actually do — `getComputedStyle` would return nothing and a
   * case built on it would be worse than this one, because it would look
   * behavioural while proving less.
   *
   * It is therefore an honest source-text contract, kept deliberately rather
   * than converted or deleted. A real check belongs in a browser harness; that
   * option is open and is not foreclosed here.
   */
  it("SOURCE-TEXT: keeps Source 360 navigable without the old fixed-width cockpit canvas", () => {
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
