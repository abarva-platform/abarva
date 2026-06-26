import {
  containsUnsafePublicText,
  sanitizeAgentAnswerForRender,
} from "@/lib/intelligence/answer/answer-safety";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";

const unsafeAnswer: AvaAnswerPacket = {
  surface: "intelligence",
  mode: "ANALYZE",
  tenantKey: "apex-retail",
  question: "What is unsafe?",
  intent: "prose",
  status: "answered",
  directAnswer:
    "Read: Read: Apex has APX-IT-004 in the evidence. Evidence: clients[c7578e7a-545a-4b75-860e-465358f5e00b] structured profile supports it.",
  expertsUsed: [
    {
      id: "xp.retail.merchandising-pricing",
      name: "Retail Merchandising & Pricing Expert",
    },
  ],
  factsUsed: [],
  metricsUsed: [],
  relationshipsUsed: [],
  artifacts: [
    {
      artifact: "table",
      id: "decision-evidence",
      title: "Decision Evidence",
      columns: [
        { key: "source", label: "Source" },
        { key: "signal", label: "Signal" },
      ],
      rows: [
        {
          source: "clients[c7578e7a-545a-4b75-860e-465358f5e00b]",
          signal:
            "client_id c7578e7a-545a-4b75-860e-465358f5e00b owns APX-IT-004.",
        },
      ],
    },
  ],
  citations: [
    {
      id: "c1",
      label: "clients[c7578e7a-545a-4b75-860e-465358f5e00b]",
      sourceClass: "tenant-fact",
      excerpt:
        "client_id c7578e7a-545a-4b75-860e-465358f5e00b owns APX-IT-004.",
    },
  ],
  gaps: [],
  caveats: [],
  nextSteps: [],
  quality: {
    confidence: "medium",
    evidenceStrength: "partial",
    tenantGrounding: "partial",
    answerCompleteness: "complete",
  },
  safety: {
    tenantFencePassed: true,
    rawIdsSuppressed: true,
    forbiddenLanguagePassed: true,
    unsupportedClaimsBlocked: true,
  },
};

describe("sanitizeAgentAnswerForRender", () => {
  it("removes duplicated consultant section labels before rendering", () => {
    const safe = sanitizeAgentAnswerForRender(unsafeAnswer);

    expect(safe.directAnswer).toContain("Apex has");
    expect(safe.directAnswer).not.toContain("Read: Read:");
    expect(safe.directAnswer).not.toContain("Read:");
  });

  it("keeps raw internal identifiers out of prose, sources, and table cells", () => {
    const safe = sanitizeAgentAnswerForRender(unsafeAnswer);
    const renderedPayload = JSON.stringify({
      directAnswer: safe.directAnswer,
      citations: safe.citations,
      artifacts: safe.artifacts,
    });

    expect(renderedPayload).not.toMatch(/clients\[/);
    expect(renderedPayload).not.toMatch(
      /c7578e7a-545a-4b75-860e-465358f5e00b/i,
    );
    expect(renderedPayload).not.toMatch(/\bAPX-IT-004\b/);
    expect(renderedPayload).not.toMatch(/\bclient_id\b/);
    expect(safe.citations[0]?.label).toBe("Tenant source support");
    const table = safe.artifacts.find(
      (artifact) => artifact.artifact === "table",
    );
    expect(table?.rows[0]?.source).toBe("tenant source support");
  });

  it("detects unsafe public text patterns without regex state drift", () => {
    expect(
      containsUnsafePublicText("clients[c7578e7a-545a-4b75-860e-465358f5e00b]"),
    ).toBe(true);
    expect(
      containsUnsafePublicText("clients[c7578e7a-545a-4b75-860e-465358f5e00b]"),
    ).toBe(true);
  });
});
