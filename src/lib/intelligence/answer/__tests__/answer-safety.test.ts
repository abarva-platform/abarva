import {
  containsUnsafePublicText,
  sanitizeAgentAnswerForRender,
} from "@/lib/intelligence/answer/answer-safety";
import type { AgentAnswer } from "@/lib/intelligence/answer/agent-answer";

const unsafeAnswer: AgentAnswer = {
  engineVersion: "agent-answer/v1",
  surface: "intelligence",
  expertId: "xp.retail.merchandising-pricing",
  contributingExperts: [
    {
      id: "xp.retail.merchandising-pricing",
      name: "Retail Merchandising & Pricing Expert",
    },
  ],
  prose:
    "Read: Read: Apex has APX-IT-004 in the evidence. Evidence: clients[c7578e7a-545a-4b75-860e-465358f5e00b] structured profile supports it.",
  tables: [
    {
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
  charts: [],
  graphs: [],
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
  recommendedActions: [],
  groundingMode: "mixed",
  confidence: "medium",
  limits: [],
  crossTenantBlocked: false,
};

describe("sanitizeAgentAnswerForRender", () => {
  it("removes duplicated consultant section labels before rendering", () => {
    const safe = sanitizeAgentAnswerForRender(unsafeAnswer);

    expect(safe.prose).toContain("Read: Apex has");
    expect(safe.prose).not.toContain("Read: Read:");
  });

  it("keeps raw internal identifiers out of prose, sources, and table cells", () => {
    const safe = sanitizeAgentAnswerForRender(unsafeAnswer);
    const renderedPayload = JSON.stringify({
      prose: safe.prose,
      citations: safe.citations,
      tables: safe.tables,
    });

    expect(renderedPayload).not.toMatch(/clients\[/);
    expect(renderedPayload).not.toMatch(
      /c7578e7a-545a-4b75-860e-465358f5e00b/i,
    );
    expect(renderedPayload).not.toMatch(/\bAPX-IT-004\b/);
    expect(renderedPayload).not.toMatch(/\bclient_id\b/);
    expect(safe.citations[0]?.label).toBe("Loaded tenant evidence");
    expect(safe.tables[0]?.rows[0]?.source).toBe("loaded tenant evidence");
  });

  it("detects unsafe public text patterns without regex state drift", () => {
    expect(containsUnsafePublicText("clients[c7578e7a-545a-4b75-860e-465358f5e00b]")).toBe(true);
    expect(containsUnsafePublicText("clients[c7578e7a-545a-4b75-860e-465358f5e00b]")).toBe(true);
  });
});
