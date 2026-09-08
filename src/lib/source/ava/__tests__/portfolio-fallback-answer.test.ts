import {
  buildSourceContract360PromptBlock,
  buildSourcePortfolioFallbackAnswer,
  isReadOnlySourcePortfolioSurface,
  readSelectedSourceContractContext,
} from "@/lib/source/ava/portfolio-fallback-answer";

const baseInput = {
  message: "What should I do next?",
  surface: "/source/preview/workspace",
  activeClientDisplayName: "Active Client",
  surfaceContext: {},
};

describe("Source portfolio/workspace aVa fallback", () => {
  it("activates only for read-only Source portfolio surfaces without a selected event", () => {
    expect(isReadOnlySourcePortfolioSurface(baseInput)).toBe(true);
    expect(
      isReadOnlySourcePortfolioSurface({
        ...baseInput,
        surfaceContext: { sourceEventId: "event-1" },
      }),
    ).toBe(false);
    expect(
      isReadOnlySourcePortfolioSurface({
        ...baseInput,
        surface: "/source/new",
        surfaceContext: { sourceIntakeMode: true },
      }),
    ).toBe(false);
    expect(
      isReadOnlySourcePortfolioSurface({
        ...baseInput,
        surface: "/tower",
      }),
    ).toBe(false);
  });

  it("refuses to state total savings without a selected event and finance evidence", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      message: "What's the total savings we'll realize from this event?",
    });

    expect(answer).toContain("no single Source event is selected");
    expect(answer).toContain("cannot state total savings");
    expect(answer).toContain("finance-approved realization evidence");
  });

  it("fences vendor pricing to selected event evidence", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      message: "Show me that vendor's pricing for this event.",
    });

    expect(answer).toContain("only discuss vendor pricing");
    expect(answer).toContain("selected event");
    expect(answer).toContain("commercial evidence");
  });

  it("blocks premature supplier recommendation from the portfolio surface", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      message: "Which vendor should we pick and why?",
    });

    expect(answer).toContain("cannot recommend a supplier");
    expect(answer).toContain("completed scoring");
    expect(answer).toContain("BAFO evidence");
  });

  it("keeps chart requests honest until bid rows are selected", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      message: "Chart the pricing comparison across vendors.",
    });

    expect(answer).toContain("pricing comparison chart");
    expect(answer).toContain("reconciled vendor-bid rows");
    expect(answer).toContain("unavailable instead of rendering filler");
  });

  it("does not intercept direct Contract 360 context before Claude receives page grounding", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      surface: "/source/vendor-portfolio/CTR-001",
      message: "What evidence is missing for this contract?",
      surfaceContext: {
        sourceContract360Mode: true,
        contractId: "CTR-001",
        contractName: "Application Services Agreement",
        vendorName: "Primary Vendor Inc.",
        annualValue: 12_400_000,
        actualAnnualSpend: 13_100_000,
        endDate: "2027-06-30",
        evidencePosture: "Scope review needed",
        nextAction: "confirm scope before action",
      },
    });

    expect(answer).toBeNull();
  });

  it("reads selected contract context from the Source Workspace sourceV4 packet", () => {
    const selected = readSelectedSourceContractContext({
      evidence: "92% source confidence",
      groundingStatus: {
        actionCandidates: 3,
        avaGroundingBundles: 6,
      },
      sourceV4: {
        executivePortfolio: {
          contracts: 2,
          annualValue: "$17.4M",
          totalCommittedValue: "$70.0M",
        },
        contextCoverage: {
          vendors: 2,
          scopeRows: 8,
          performanceRows: 4,
          invoiceLines: 12,
        },
        selectedContract: {
          contractId: "CTR-001",
          contractName: "Application Services Agreement",
          vendorName: "Primary Vendor Inc.",
          annualValueUsd: 12_400_000,
          actualAnnualSpendUsd: 13_100_000,
          endDate: "Jun 30, 2027",
        },
        contractDirectory: [
          { vendorName: "Primary Vendor Inc.", annualValueUsd: 12_400_000 },
          { vendorName: "Second Vendor Inc.", annualValueUsd: 5_000_000 },
        ],
      },
    });

    expect(selected).toMatchObject({
      contractId: "CTR-001",
      contractName: "Application Services Agreement",
      vendorName: "Primary Vendor Inc.",
      annualValue: 12_400_000,
      actualAnnualSpend: 13_100_000,
      evidencePosture: "92% source confidence",
    });
    expect(selected?.datasetSummary).toContain("2 contracts");
    expect(selected?.cubeSummary).toContain("8 scope rows");
    expect(selected?.cubeSummary).toContain("3 action candidates");
    expect(selected?.topVendorSummary).toContain("Primary Vendor Inc.");
  });

  it("builds a consultant-format prompt block from selected workspace contract context", () => {
    const block = buildSourceContract360PromptBlock(
      {
        evidence: "92% source confidence",
        sourceV4: {
          executivePortfolio: {
            contracts: 2,
            annualValue: "$17.4M",
          },
          selectedContract: {
            contractId: "CTR-001",
            contractName: "Application Services Agreement",
            vendorName: "Primary Vendor Inc.",
            annualValueUsd: 12_400_000,
            actualAnnualSpendUsd: 13_100_000,
          },
        },
      },
      "Active Client",
    );

    expect(block).toContain("Contract 360 record for CTR-001");
    expect(block).toContain("annual value $12.4M");
    expect(block).toContain("actual annual spend $13.1M");
    expect(block).toContain("Paragraph 1, Strategic read");
    expect(block).toContain("Paragraph 2, Consultant diagnosis");
    expect(block).toContain("Paragraph 3, Decision / next move");
    expect(block).toContain("Recharts-backed answer renderer");
    expect(block).toContain("Do not answer as if no contract is selected.");
  });

  it("keeps selected Contract 360 turns out of the no-event fallback even for savings questions", () => {
    const answer = buildSourcePortfolioFallbackAnswer({
      ...baseInput,
      message: "What total savings will this contract realize?",
      surfaceContext: {
        sourceV4: {
          selectedContract: {
            contractId: "CTR-001",
            contractName: "Application Services Agreement",
            vendorName: "Primary Vendor Inc.",
          },
        },
      },
    });

    expect(answer).toBeNull();
  });
});
