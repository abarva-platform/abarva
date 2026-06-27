import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  renderedLayerLeakIssues,
  shapeAvaAnswerPacket,
} from "@/lib/ava-answer/render-layer-shaper";

const baseAnswer: AvaAnswerPacket = {
  surface: "home",
  mode: "KNOW",
  tenantKey: "lakeshore",
  question: "What operational evidence is loaded?",
  intent: "browse",
  status: "answered",
  directAnswer:
    "The source-supported business objects show operations_process context.",
  factsUsed: [],
  metricsUsed: [],
  relationshipsUsed: [],
  artifacts: [
    {
      artifact: "table",
      id: "coverage",
      title: "Source coverage",
      columns: [
        { key: "dimension", label: "Dimension" },
        { key: "records", label: "Records", format: "number" },
      ],
      rows: [
        { dimension: "operations_process", records: 10 },
        { dimension: "ticket_work_items", records: 0 },
      ],
      citationIds: ["c1", "c2"],
    },
    {
      artifact: "graph",
      id: "graph",
      title: "Relationship paths",
      nodes: [{ id: "NODE-123", label: "org_team/application", kind: "org_team" }],
      edges: [
        {
          from: "NODE-123",
          to: "NODE-456",
          label: "depends_on",
          kind: "depends_on",
        },
      ],
      citationIds: ["c1"],
    },
  ],
  citations: [
    {
      id: "c1",
      label: "operational signals",
      sourceClass: "tenant-chunk",
      excerpt: "tenant excerpt",
    },
    {
      id: "c2",
      label: "operational signals",
      sourceClass: "tenant-chunk",
      excerpt: "tenant excerpt",
    },
  ],
  gaps: [],
  caveats: [],
  nextSteps: [],
  quality: {
    confidence: "high",
    evidenceStrength: "strong",
    tenantGrounding: "complete",
    answerCompleteness: "complete",
  },
  safety: {
    tenantFencePassed: true,
    rawIdsSuppressed: true,
    forbiddenLanguagePassed: true,
    unsupportedClaimsBlocked: true,
  },
};

describe("render-layer shaper", () => {
  it("removes rendered artifact leaks from prose, sources, tables, and graphs", () => {
    const shaped = shapeAvaAnswerPacket(baseAnswer);
    const text = JSON.stringify(shaped);

    expect(text).not.toMatch(/tenant excerpt/i);
    expect(text).not.toMatch(/operations_process|ticket_work_items|depends_on|org_team/i);
    expect(text).not.toMatch(/NODE-123|NODE-456/);
    expect(text).not.toMatch(/business objects|source-supported/i);
    expect(shaped.citations).toHaveLength(1);
    expect(shaped.artifacts[0]?.artifact).toBe("table");
    if (shaped.artifacts[0]?.artifact === "table") {
      expect(shaped.artifacts[0].rows).toHaveLength(1);
      expect(shaped.artifacts[0].rows[0]?.dimension).toBe("Operations & Process");
    }
    expect(renderedLayerLeakIssues(text)).toEqual([]);
  });
});
