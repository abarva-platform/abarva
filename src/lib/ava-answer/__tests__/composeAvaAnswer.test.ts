import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";

describe("composeAvaAnswer", () => {
  it("mirrors intelligence answers into readable paragraphs without changing the canonical answer", () => {
    const directAnswer =
      "Apex Retail Group's application systems context is strong enough to answer as a current-state dossier, not a fragment lookup. Applications/systems in dossier: 170; Vendors/contracts in dossier: 100; Integrations/interfaces in dossier: 260; Data products/platform records in dossier: 125; Operational/service signals in dossier: 12. Operationally, the useful signal is how the primary binder connects to adjacent dimensions: Relationship paths are thin, so the safe answer should emphasize loaded facts and call out the missing joins. No blocking gap is visible in the assembled dossier, though final operating choices still need client validation. Home can ground the facts and boundaries, but the investment or prioritization call should move to moves.";

    const answer = composeAvaAnswer({
      surface: "intelligence",
      mode: "ANALYZE",
      tenantKey: "apex-retail",
      question: "Show this as a decision-grade table or chart.",
      intent: "chart",
      status: "answered",
      directAnswer,
      interpretation:
        "This is an advisory synthesis; cited tenant facts anchor the client-specific claims.",
      artifacts: [
        {
          artifact: "chart",
          id: "investment-action-chart",
          kind: "bar",
          title: "Investment Action View",
          data: [{ label: "Applications", value: 170 }],
          citationIds: ["c1"],
        },
      ],
      citations: [
        {
          id: "c1",
          label: "Apex Retail Group loaded context",
          sourceClass: "tenant-fact",
        },
      ],
      expertsUsed: [
        {
          id: "retail-merchandising",
          name: "Retail Merchandising & Pricing Expert",
        },
      ],
      retrievalSummary: {
        substrate: "module_read_model",
        sourceCount: 1,
        hasTenantFacts: true,
        hasExperts: true,
      },
    });

    expect(answer.directAnswer).toBe(directAnswer);
    expect(answer.prose?.split(/\n{2,}/).length).toBeGreaterThanOrEqual(3);
    expect(answer.charts).toHaveLength(1);
    expect(answer.artifacts).toHaveLength(1);
    expect(answer.contributingExperts).toHaveLength(1);
  });

  it("does not paragraph-shape Home KNOW prose", () => {
    const answer = composeAvaAnswer({
      surface: "home",
      mode: "KNOW",
      tenantKey: "apex-retail",
      question: "What is loaded?",
      intent: "lookup",
      status: "answered",
      directAnswer: "Home has source-backed coverage for the loaded tenant context.",
      citations: [
        {
          id: "c1",
          label: "Loaded Home coverage",
          sourceClass: "tenant-fact",
        },
      ],
      retrievalSummary: {
        substrate: "module_read_model",
        sourceCount: 1,
        hasTenantFacts: true,
      },
    });

    expect(answer.prose).toBe(answer.directAnswer);
    expect(answer.contributingExperts).toEqual([]);
  });
});
