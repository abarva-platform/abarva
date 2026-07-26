import JSZip from "jszip";

import {
  parseRoadmapStructuredBlock,
  roadmapStructuredOutputInstruction,
  ROADMAP_SO_OPEN,
  ROADMAP_SO_CLOSE,
  ROADMAP_STRUCTURED_OUTPUT_VERSION,
} from "../roadmap-structured-output";
import { checkProseStructureConsistency } from "../roadmap-prose-structure-consistency";
import { buildGovernedRoadmapArtifact } from "../build-governed-roadmap-artifact";

const NOW = "2026-07-25T00:00:00.000Z";
const LINEAGE = {
  moveId: "move-mer-1",
  tenantKey: "meridian",
  architectureRef: "arch-1",
};

function validOutput(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    executiveConclusion:
      "A four-stage transition builds trusted data first, proves value in one function, then scales only after controls are established.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights.",
    lifecycleStateRef: "review_draft",
    horizonOutcomes: {
      Mobilize: "Sponsorship, funding and decision rights established.",
      "Establish Foundation": "Trusted data and control loop operational.",
      "Deliver Priority Outcomes":
        "Priority outcome proven with measurable value.",
      "Scale and Optimize": "Repeatable operating model extends value.",
    },
    cells: [
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "Canonical data model live",
        dependency: "ITSM text + taxonomy access",
        decisionOrGate: "Funding authorized",
        evidenceStatus: "recommended",
      },
      {
        workstream: "Governance & Controls",
        horizon: "Mobilize",
        outcome: "Decision rights agreed",
        decisionOrGate: "Control approval",
        evidenceStatus: "recommended",
      },
      {
        workstream: "AI / Automation",
        horizon: "Deliver Priority Outcomes",
        outcome: "First automation in production",
        evidenceStatus: "illustrative",
      },
      {
        workstream: "Business & Process",
        horizon: "Scale and Optimize",
        outcome: "Operating model extended",
        evidenceStatus: "illustrative",
      },
    ],
    decisionGates: [
      {
        name: "Funding authorized",
        betweenHorizons: "Mobilize → Establish Foundation",
      },
      { name: "Control approval", criteria: "Governance controls established" },
    ],
    valueMilestones: [
      {
        name: "First measurable result demonstrated",
        horizon: "Deliver Priority Outcomes",
      },
    ],
    criticalDependencies: [
      { item: "Data platform access", evidenceStatus: "evidence_required" },
    ],
    risks: ["Data quality of ticket text"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    appendix: ["Full workstream detail."],
    sourceLineageRefs: ["accepted P3 architecture", "signed charter"],
    ...overrides,
  };
}

function wrap(
  output: unknown,
  narrative = "Narrative prose about a four-stage transition.",
): string {
  return `${narrative}\n\n${ROADMAP_SO_OPEN}\n${JSON.stringify(output)}\n${ROADMAP_SO_CLOSE}\n`;
}

describe("the prompt instruction", () => {
  it("names the delimiters and the schema version", () => {
    const i = roadmapStructuredOutputInstruction();
    expect(i).toContain(ROADMAP_SO_OPEN);
    expect(i).toContain(ROADMAP_SO_CLOSE);
    expect(i).toContain(ROADMAP_STRUCTURED_OUTPUT_VERSION);
    expect(i).toMatch(/evidence_required/);
  });
});

describe("parseRoadmapStructuredBlock — honest parsing", () => {
  it("valid structured block parses into an input", () => {
    const r = parseRoadmapStructuredBlock(wrap(validOutput()));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.input.cells.length).toBeGreaterThanOrEqual(2);
  });

  it("absent block → invalid, no input", () => {
    const r = parseRoadmapStructuredBlock("Just prose, no block.");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("roadmap_structured_output_invalid");
  });

  it("malformed JSON → invalid", () => {
    const r = parseRoadmapStructuredBlock(
      `${ROADMAP_SO_OPEN}\n{ not json ,,, }\n${ROADMAP_SO_CLOSE}`,
    );
    expect(r.ok).toBe(false);
  });

  it("unknown field → rejected by strict schema", () => {
    const r = parseRoadmapStructuredBlock(wrap(validOutput({ sneaky: "x" })));
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.reason).toMatch(/schema validation|Unrecognized|unknown/i);
  });

  it("missing horizon outcome → blocked, never defaulted", () => {
    const out = validOutput({ horizonOutcomes: { Mobilize: "only this one" } });
    const r = parseRoadmapStructuredBlock(wrap(out));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/horizonOutcomes|missing outcome/i);
  });
});

describe("prose ⇄ structure consistency", () => {
  it("flags a horizon-count mismatch", () => {
    const r = parseRoadmapStructuredBlock(wrap(validOutput()));
    if (!r.ok) throw new Error("expected ok");
    const m = checkProseStructureConsistency({
      prose: "This is a five-stage transition across five horizons.",
      input: r.input,
      lifecycleState: "review_draft",
    });
    expect(
      m.some((x) => x.code === "horizon_count_mismatch" && x.material),
    ).toBe(true);
  });

  it("flags a missing control gate when the title claims controlled scaling", () => {
    const out = validOutput({
      decisionGates: [{ name: "Funding authorized" }],
      cells: validOutput().cells.map((c: Record<string, unknown>) => ({
        ...c,
        decisionOrGate: undefined,
      })),
    });
    const r = parseRoadmapStructuredBlock(wrap(out));
    if (!r.ok) throw new Error("expected ok");
    const m = checkProseStructureConsistency({
      prose: "narrative",
      input: r.input,
      lifecycleState: "review_draft",
    });
    expect(m.some((x) => x.code === "control_gate_missing")).toBe(true);
  });

  it("flags a lifecycle/finality mismatch", () => {
    const r = parseRoadmapStructuredBlock(wrap(validOutput()));
    if (!r.ok) throw new Error("expected ok");
    const m = checkProseStructureConsistency({
      // PR14: a genuine finality CLAIM about the artifact (not the bare word
      // "final" — that no longer fires, to avoid false positives on real prose).
      prose:
        "This roadmap is board-ready and approved for release; no further approvals are needed.",
      input: r.input,
      lifecycleState: "review_draft",
    });
    expect(
      m.some((x) => x.code === "lifecycle_finality_mismatch" && x.material),
    ).toBe(true);
  });

  it("does NOT flag a NEGATED finality phrase (the AI-draft disclaimer)", () => {
    const r = parseRoadmapStructuredBlock(wrap(validOutput()));
    if (!r.ok) throw new Error("expected ok");
    const m = checkProseStructureConsistency({
      // PR15: real draft narratives carry this disclaimer verbatim — it says the
      // artifact is NOT board-ready, which is consistent with review_draft.
      prose:
        "It is not a final or board-ready artifact and does not constitute phase approval or sponsor signoff.",
      input: r.input,
      lifecycleState: "review_draft",
    });
    expect(m.some((x) => x.code === "lifecycle_finality_mismatch")).toBe(false);
  });
});

describe("buildGovernedRoadmapArtifact — end to end", () => {
  const base = {
    pipeline: "golden_bar" as const,
    lineage: LINEAGE,
    lifecycleState: "review_draft" as const,
    phase: 4,
    generatedAt: NOW,
  };

  it("valid output → contract + three synchronized renders + provenance", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(validOutput()),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.contract.contentHash).toHaveLength(32);
    expect(res.provenance.pipeline).toBe("golden_bar");
    expect(res.provenance.contentHash).toBe(res.contract.contentHash);
    // All three renders embed the same content hash → one source of truth.
    expect(res.renders.html).toContain(res.contract.contentHash);
    const dz = await JSZip.loadAsync(res.renders.docx);
    expect(await dz.files["word/document.xml"].async("string")).toContain(
      res.contract.contentHash,
    );
    const pz = await JSZip.loadAsync(res.renders.pptx);
    const slideXml = (
      await Promise.all(
        Object.keys(pz.files)
          .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
          .map((n) => pz.files[n].async("string")),
      )
    ).join("\n");
    expect(slideXml).toContain(res.contract.contentHash);
  });

  it("absent structured block → no contract, governed failure", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: "Only narrative prose, no structured block.",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("roadmap_structured_output_invalid");
  });

  // Flip the first cell of the consistent 4-horizon fixture to "approved".
  function withApprovedCell() {
    const cells = validOutput().cells.map((c: Record<string, unknown>, i) =>
      i === 0 ? { ...c, evidenceStatus: "approved" } : c,
    );
    return validOutput({ cells });
  }

  it("unsupported approved claim → blocked", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(withApprovedCell()),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/approved/i);
  });

  it("approved claim WITH authoritative evidence → allowed", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(withApprovedCell()),
      authoritativeApprovedEvidence: true,
    });
    expect(res.ok).toBe(true);
  });

  it("lifecycle mismatch (model claims final, system says review_draft) → blocked", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(
        validOutput({ lifecycleStateRef: "exit_approved_final" }),
      ),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/lifecycle/i);
  });

  it("prose/structure horizon mismatch → blocked", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(
        validOutput(),
        "This is a five-stage journey across five horizons of change.",
      ),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/horizon_count_mismatch|disagree/i);
  });

  it("preserves tenant + move lineage in provenance", async () => {
    const res = await buildGovernedRoadmapArtifact({
      ...base,
      modelText: wrap(validOutput()),
    });
    if (!res.ok) throw new Error("expected ok");
    expect(res.provenance.lineage.moveId).toBe("move-mer-1");
    expect(res.provenance.lineage.tenantKey).toBe("meridian");
    expect(res.contract.lineage.tenantKey).toBe("meridian");
  });

  it("both pipelines conform to the same schema + contract version (parity)", async () => {
    const gb = await buildGovernedRoadmapArtifact({
      ...base,
      pipeline: "golden_bar",
      modelText: wrap(validOutput()),
    });
    const orch = await buildGovernedRoadmapArtifact({
      ...base,
      pipeline: "orchestrator",
      modelText: wrap(validOutput()),
    });
    expect(gb.ok && orch.ok).toBe(true);
    if (gb.ok && orch.ok) {
      // Same content → identical hash regardless of pipeline.
      expect(gb.contract.contentHash).toBe(orch.contract.contentHash);
      expect(gb.provenance.contractVersion).toBe(
        orch.provenance.contractVersion,
      );
    }
  });
});
