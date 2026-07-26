import {
  buildRoadmapContractFromStructured,
  normalizeEvidenceStatus,
  type RoadmapStructuredInput,
} from "../roadmap-contract-extractor";
import { renderRoadmapDetailDocx } from "../roadmap-docx-renderer";
import { renderExecutiveRoadmapPptx } from "../roadmap-pptx-renderer";
import JSZip from "jszip";

function fullInput(): RoadmapStructuredInput {
  return {
    executiveConclusion:
      "A four-stage transition builds trusted data first, proves value in one function, then scales only after controls hold.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights for the first horizon.",
    horizonOutcomes: {
      Mobilize: "Sponsorship, funding and decision rights established.",
      "Establish Foundation": "Trusted data and control loop operational.",
    },
    cells: [
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "Canonical data model live",
        majorActivity: "Stand up the governed data layer",
        dependency: "ITSM text + taxonomy access",
        decisionOrGate: "Funding authorized",
        ownerRole: "Data lead",
        timing: "Early",
        successMeasure: "One trusted source of truth",
        evidenceStatus: "recommended",
      },
      {
        workstream: "Governance & Controls",
        horizon: "Mobilize",
        outcome: "Decision rights agreed",
        evidenceStatus: "approved",
      },
    ],
    decisionGates: [
      {
        name: "Funding authorized",
        betweenHorizons: "Mobilize → Establish Foundation",
      },
    ],
    valueMilestones: [
      {
        name: "First measurable result demonstrated",
        horizon: "Deliver Priority Outcomes",
      },
    ],
    risks: ["Data quality of ticket text"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    appendix: ["Full workstream detail."],
  };
}

describe("normalizeEvidenceStatus — never upgrades an unknown into a certainty", () => {
  it.each([
    ["approved", "approved", false],
    ["Recommended", "recommended", false],
    ["client decision required", "client_decision_required", false],
    ["proposed", "recommended", false],
    ["indicative", "illustrative", false],
  ])("maps %s → %s", (raw, expected) => {
    expect(normalizeEvidenceStatus(raw).status).toBe(expected);
  });

  it("defaults absent / unknown / tbd to evidence_required (flagged as defaulted)", () => {
    for (const raw of [undefined, "", "made-up", "tbd", "pending"]) {
      const r = normalizeEvidenceStatus(raw);
      expect(r.status).toBe("evidence_required");
      expect(r.defaulted).toBe(true);
    }
  });

  it("never resolves any unknown token to approved", () => {
    for (const raw of ["totally-fine", "done", "final", "signed"]) {
      expect(normalizeEvidenceStatus(raw).status).not.toBe("approved");
    }
  });
});

describe("buildRoadmapContractFromStructured", () => {
  const lineage = {
    moveId: "move-1",
    tenantKey: "meridian",
    architectureRef: "arch-1",
  };

  it("maps a full payload into a complete, hashed contract", () => {
    const { contract } = buildRoadmapContractFromStructured({
      input: fullInput(),
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    expect(contract.contractVersion).toBeTruthy();
    expect(contract.contentHash).toHaveLength(32);
    expect(contract.executiveConclusion).toContain("four-stage transition");
    expect(contract.workstreamItems).toHaveLength(2);
    expect(contract.decisionGates.map((g) => g.name)).toContain(
      "Funding authorized",
    );
    expect(contract.valueMilestones).toHaveLength(1);
    expect(contract.dependencies[0].item).toBe("ITSM text + taxonomy access");
  });

  it("orders horizons in the reference's canonical order, outcome-first", () => {
    const { contract } = buildRoadmapContractFromStructured({
      input: fullInput(),
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    // Mobilize appears before Establish Foundation even though the cell order was reversed.
    expect(contract.horizons.map((h) => h.name)).toEqual([
      "Mobilize",
      "Establish Foundation",
    ]);
    for (const h of contract.horizons)
      expect(h.outcome.length).toBeGreaterThan(0);
  });

  it("NEVER fabricates evidence status — a cell with no status becomes evidence_required + a surfaced issue", () => {
    const input = fullInput();
    input.cells.push({
      workstream: "Technology",
      horizon: "Scale and Optimize",
      outcome: "Platform hardened",
      // no evidenceStatus
    });
    const { contract, issues } = buildRoadmapContractFromStructured({
      input,
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    const added = contract.workstreamItems.find(
      (w) => w.workstream === "Technology",
    )!;
    expect(added.evidenceStatus).toBe("evidence_required");
    expect(issues.some((i) => i.code === "missing_evidence_status")).toBe(true);
  });

  it("flags a generic (non-message-led) title as a governance issue", () => {
    const input = fullInput();
    input.executiveConclusion = "Execution Roadmap";
    const { issues } = buildRoadmapContractFromStructured({
      input,
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    expect(issues.some((i) => i.code === "generic_title")).toBe(true);
  });

  it("does not flag a message-led title", () => {
    const { issues } = buildRoadmapContractFromStructured({
      input: fullInput(),
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    expect(issues.some((i) => i.code === "generic_title")).toBe(false);
  });

  it("surfaces no_decision_gates / no_value_milestones when the payload omits them (invents nothing)", () => {
    const input = fullInput();
    input.decisionGates = [];
    input.valueMilestones = [];
    // Strip the cell-level gate too so nothing backfills.
    input.cells = input.cells.map((c) => ({ ...c, decisionOrGate: undefined }));
    const { contract, issues } = buildRoadmapContractFromStructured({
      input,
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    expect(contract.decisionGates).toHaveLength(0);
    expect(contract.valueMilestones).toHaveLength(0);
    expect(issues.some((i) => i.code === "no_decision_gates")).toBe(true);
    expect(issues.some((i) => i.code === "no_value_milestones")).toBe(true);
  });

  it("produces a contract the real DOCX and PPTX renderers accept (end-to-end)", async () => {
    const { contract } = buildRoadmapContractFromStructured({
      input: fullInput(),
      lineage,
      lifecycleState: "review_draft",
      phase: 4,
    });
    const docx = await renderRoadmapDetailDocx(contract);
    const pptx = await renderExecutiveRoadmapPptx(contract);
    expect(docx.length).toBeGreaterThan(1000);
    expect(pptx.length).toBeGreaterThan(1000);
    // Both embed the same content hash the extractor produced.
    const dz = await JSZip.loadAsync(docx);
    const docXml = await dz.files["word/document.xml"].async("string");
    expect(docXml).toContain(contract.contentHash);
  });
});
