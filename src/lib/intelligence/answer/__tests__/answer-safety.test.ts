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
    expect(safe.citations[0]?.label).toBe("Tenant evidence");
    const table = safe.artifacts.find(
      (artifact) => artifact.artifact === "table",
    );
    expect(table?.rows[0]?.source).toBe("evidence");
  });

  it("preserves public Source contract references while scrubbing non-contract internal ids", () => {
    const safe = sanitizeAgentAnswerForRender({
      ...unsafeAnswer,
      directAnswer:
        "Salesforce contract CTR-090 should stay visible, but BASE-007 should not.",
      factsUsed: [
        {
          id: "selected-contract",
          label: "Selected contract",
          value: "CTR-090 Salesforce",
        },
        {
          id: "internal-record",
          label: "Internal record",
          value: "BASE-007",
        },
      ],
      artifacts: [
        {
          artifact: "graph",
          id: "contract-graph",
          title: "Contract graph",
          nodes: [
            { id: "contract", label: "CTR-090 Salesforce", kind: "contract" },
            { id: "raw", label: "BASE-007", kind: "raw" },
          ],
          edges: [],
        },
      ],
    });

    const renderedPayload = JSON.stringify(safe);

    expect(renderedPayload).toContain("CTR-090");
    expect(renderedPayload).not.toMatch(/\bBASE-007\b/);
  });

  it("scrubs data-layer and Move trace labels before server-side render", () => {
    const safe = sanitizeAgentAnswerForRender({
      ...unsafeAnswer,
      directAnswer:
        "Healthcare Demo should proceed, but the V7 substrate has candidate_move, move_id, phase_id, artifact_id, evidence_id, tenant_id, and source_record_id trace fields.",
    });

    expect(safe.directAnswer).toContain("Healthcare Demo should proceed");
    expect(safe.directAnswer).not.toMatch(
      /V7|substrate|candidate_move|move_id|phase_id|artifact_id|evidence_id|tenant_id|source_record_id/i,
    );
  });

  it("scrubs data-layer labels from final agent-answer citations and exhibits", () => {
    const safe = sanitizeAgentAnswerForRender({
      ...unsafeAnswer,
      directAnswer:
        "For Meridian agent assist, start with authorization status lookup.",
      prose:
        "For Meridian agent assist, start with authorization status lookup. Source table: Meridian Health System V7 executive business file.",
      artifacts: [
        {
          artifact: "table",
          id: "source-table",
          title: "Sources Used",
          columns: [
            { key: "source", label: "Source" },
            { key: "use", label: "How IT Supports The Answer" },
          ],
          rows: [
            {
              source: "Meridian Health System V7 executive business file",
              use: "Meridian Health System has a readback-validated V7 corpus in Azure Postgres Intelligence V7. Loaded foundation: 442 business records, 11,507 field facts, 97 graph nodes, 69 relationship edges, and 118 retrieval chunks.",
            },
            {
              source: "V7 Enterprise profile",
              use: "Revenue Basis: Not Loaded; validation: Synthetic Demo Manifest Gated.",
            },
          ],
        },
      ],
      citations: [
        {
          id: "c1",
          label: "Meridian Health System V7 executive business file",
          sourceClass: "tenant-fact",
          recordId: "meridian-health:v7.1.0-meridian-current-state-20260709",
          excerpt:
            "Meridian Health System has a readback-validated V7 corpus in Azure Postgres Intelligence V7. Loaded foundation: 442 business records, 11,507 field facts, 97 graph nodes, 69 relationship edges, and 118 retrieval chunks.",
        },
        {
          id: "c2",
          label: "V7 Enterprise profile",
          sourceClass: "tenant-fact",
          recordId: "v7_01_enterprise_profile",
          excerpt:
            "Enterprise profile from Intelligence V7 (source file). Revenue Basis: Not Loaded; Technology Budget Basis: not_loaded; validation: Synthetic Demo Manifest Gated.",
        },
      ],
    });

    const renderedPayload = JSON.stringify({
      prose: safe.prose,
      citations: safe.citations,
      artifacts: safe.artifacts,
    });

    expect(renderedPayload).not.toMatch(/\bV\d+\b/i);
    expect(renderedPayload).not.toMatch(/v7[._:-]/i);
    expect(renderedPayload).not.toMatch(/Intelligence V7/i);
    expect(renderedPayload).not.toMatch(/not_loaded|Not Loaded/i);
    expect(renderedPayload).not.toMatch(/Synthetic Demo Manifest Gated/i);
    expect(renderedPayload).not.toMatch(
      /business records|field facts|graph nodes|relationship edges|retrieval chunks/i,
    );
    expect(renderedPayload).not.toMatch(/recordId/i);
    expect(renderedPayload).toContain("available source material");
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
