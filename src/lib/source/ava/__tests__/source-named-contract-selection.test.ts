import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";
import {
  buildSourceWorkspaceVisualAnswer,
  canBuildSourceWorkspaceVisualAnswer,
} from "@/lib/source/ava/source-workspace-visual-answer";

const context: AskSurfaceContext = {
  module: "Source",
  activeClient: "Synthetic Tenant",
  clientKey: "synthetic_tenant",
  activeTab: "Contract 360 / Story",
  sourceV4: {
    selectedContract: {
      contractId: "CTR-101",
      vendorName: "Example Alpha",
      contractName: "Example Alpha Platform Agreement",
      annualValueUsd: 1_000_000,
      endDate: "31 Dec 2027",
    },
    contractDirectory: [
      {
        contractId: "CTR-202",
        vendorName: "Example Beta",
        contractName: "Example Beta Service Agreement",
        annualValueUsd: 2_000_000,
        endDate: "30 Jun 2028",
      },
    ],
  },
};

function withDirectory(rows: Array<Record<string, unknown>>): AskSurfaceContext {
  return {
    ...context,
    sourceV4: {
      ...(context.sourceV4 as Record<string, unknown>),
      contractDirectory: rows,
    },
  };
}

describe("Source named-contract selection with another contract open", () => {
  it("can read the other contract when its ID is explicit", () => {
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize CTR-202.",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("Example Beta Service Agreement");
    expect(answer?.citations).toContainEqual(
      expect.objectContaining({ recordId: "CTR-202" }),
    );
  });

  it.each([
    "What is the renewal date for Example Beta?",
    "Summarize Example Beta Service Agreement.",
    "Summarize example beta service agreement.",
  ])("uses the named contract's facts for %s", (query) => {
    expect(canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: context })).toBe(true);

    const answer = buildSourceWorkspaceVisualAnswer({
      query,
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("Example Beta Service Agreement");
    expect(answer?.directAnswer).not.toContain("Example Alpha Platform Agreement");
    expect(answer?.citations).toContainEqual(
      expect.objectContaining({ recordId: "CTR-202" }),
    );
  });

  it("fails closed when a vendor name matches two authorized agreements", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-202",
        vendorName: "Example Beta",
        contractName: "Example Beta Service Agreement",
      },
      {
        contractId: "CTR-203",
        vendorName: "Example Beta",
        contractName: "Example Beta Support Agreement",
      },
    ]);
    const query = "Summarize Example Beta.";

    expect(canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: scoped })).toBe(true);
    const answer = buildSourceWorkspaceVisualAnswer({ query, surfaceContext: scoped });

    expect(answer?.directAnswer).toContain("More than one contract matches");
    expect(answer?.directAnswer).not.toContain("Example Alpha Platform Agreement");
    expect(answer?.citations).toEqual([]);
  });

  it("uses an exact agreement name to disambiguate a shared vendor", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-202",
        vendorName: "Example Beta",
        contractName: "Example Beta Service Agreement",
      },
      {
        contractId: "CTR-203",
        vendorName: "Example Beta",
        contractName: "Example Beta Support Agreement",
      },
    ]);
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize Example Beta Service Agreement.",
      surfaceContext: scoped,
    });

    expect(answer?.citations).toContainEqual(
      expect.objectContaining({ recordId: "CTR-202" }),
    );
    expect(answer?.directAnswer).not.toContain("Example Beta Support Agreement");
  });

  it("does not fall back to the open contract or a foreign-scoped name match", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-303",
        vendorName: "Example Gamma",
        contractName: "Example Gamma Service Agreement",
        tenantKey: "other_tenant",
      },
    ]);
    const query = "Summarize Example Gamma Service Agreement.";

    expect(canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: scoped })).toBe(true);
    const answer = buildSourceWorkspaceVisualAnswer({ query, surfaceContext: scoped });

    expect(answer?.directAnswer).toContain("not available in the current Source contract packet");
    expect(answer?.directAnswer).not.toContain("Example Alpha Platform Agreement");
    expect(answer?.directAnswer).not.toContain("Example Gamma Service Agreement");
    expect(answer?.citations).toEqual([]);
  });

  it.each([
    "Summarize Example Gamma Service Agreement.",
    "What is the renewal date for Example Gamma?",
  ])("does not use the open contract for an unlisted named request: %s", (query) => {
    expect(canBuildSourceWorkspaceVisualAnswer({ query, surfaceContext: context })).toBe(true);
    const answer = buildSourceWorkspaceVisualAnswer({ query, surfaceContext: context });

    expect(answer?.directAnswer).toContain("not available in the current Source contract packet");
    expect(answer?.directAnswer).not.toContain("Example Alpha Platform Agreement");
    expect(answer?.citations).toEqual([]);
  });

  it("keeps a generic current-contract question on the open record", () => {
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize this contract.",
      surfaceContext: context,
    });

    expect(answer?.directAnswer).toContain("Example Alpha Platform Agreement");
  });

  it("does not treat a partial vendor identifier as the requested contract", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-202",
        vendorName: "Example Beta",
        contractName: "Example Beta Service Agreement",
      },
      {
        contractId: "CTR-303",
        vendorName: "Example Betamax",
        contractName: "Example Betamax Service Agreement",
        tenantKey: "other_tenant",
      },
    ]);
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize Example Betamax Service Agreement.",
      surfaceContext: scoped,
    });

    expect(answer?.directAnswer).toContain("not available in the current Source contract packet");
    expect(answer?.citations).toEqual([]);
  });

  it("does not resolve an explicit ID from a foreign-scoped directory row", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-303",
        vendorName: "Example Gamma",
        contractName: "Example Gamma Service Agreement",
        tenantKey: "other_tenant",
      },
    ]);
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize CTR-303.",
      surfaceContext: scoped,
    });

    expect(answer?.directAnswer).toContain("not present in the current Source aVa contract packet");
    expect(answer?.directAnswer).not.toContain("Example Gamma Service Agreement");
    expect(answer?.directAnswer).not.toContain("Example Alpha Platform Agreement");
  });

  it("treats an explicitly blank tenant key as out of scope", () => {
    const scoped = withDirectory([
      {
        contractId: "CTR-303",
        vendorName: "Example Gamma",
        contractName: "Example Gamma Service Agreement",
        tenantKey: "",
      },
    ]);
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize Example Gamma Service Agreement.",
      surfaceContext: scoped,
    });

    expect(answer?.directAnswer).toContain("not available in the current Source contract packet");
    expect(answer?.citations).toEqual([]);
  });

  it("excludes foreign-scoped opportunity rows from an authorized named contract", () => {
    const scoped: AskSurfaceContext = {
      ...context,
      sourceV4: {
        ...(context.sourceV4 as Record<string, unknown>),
        optimizationOpportunities: {
          opportunities: [
            {
              id: "CTR-202:foreign-candidate",
              contractId: "CTR-202",
              tenantKey: "other_tenant",
              label: "Foreign-scope candidate",
              amountUsd: 9_000_000,
              stageRaw: "quantified",
            },
          ],
        },
      },
    };
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize Example Beta Service Agreement.",
      surfaceContext: scoped,
    });

    expect(answer?.directAnswer).toContain("Example Beta Service Agreement");
    expect(answer?.directAnswer).not.toContain("Foreign-scope candidate");
    expect(answer?.directAnswer).not.toContain("$9.0M");
  });

  it("does not reuse open-contract posture or evidence-map details", () => {
    const scoped: AskSurfaceContext = {
      ...context,
      sourceV4: {
        ...(context.sourceV4 as Record<string, unknown>),
        commercialPosture: {
          items: [{ label: "Open-contract posture", value: "Alpha-only value" }],
        },
        optimizationSpine: {
          sourceConnections: [
            { id: "alpha-only", sourceSystem: "Alpha-only source" },
          ],
        },
      },
    };
    const answer = buildSourceWorkspaceVisualAnswer({
      query: "Summarize Example Beta Service Agreement.",
      surfaceContext: scoped,
    });

    expect(answer?.directAnswer).toContain("Example Beta Service Agreement");
    expect(answer?.directAnswer).not.toContain("Alpha-only value");
    expect(JSON.stringify(answer?.artifacts)).not.toContain("Alpha-only source");
  });
});
