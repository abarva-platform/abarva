// Orchestrated Move business-case — full-flow regression, model stubbed.
//
// Proves at the LOGIC level (not UI text): the request binds only recorded
// facts (no fabrication), the multi-pass orchestration + quality gate run
// end-to-end with an injected stub, a grounded document renders to escaped
// HTML, and a thin/ungrounded document is BLOCKED (honest fallback) rather
// than emitted.

import {
  buildBusinessCaseRequest,
  buildMoveDeliverableRequest,
} from "../build-request";
import { runOrchestratedBusinessCase } from "../run-orchestrated-business-case";
import { runOrchestratedMoveDeliverable } from "../run-orchestrated-move-deliverable";
import { markdownToHtml } from "../render-html";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import type { ModelCaller } from "@/lib/deliverables/orchestrator/orchestrator";
import type {
  DeliverableGenerationPlan,
  DeliverableIntelligenceRequest,
  RenderableDeliverable,
  RenderableSection,
} from "@/lib/deliverables/orchestrator/types";
import type { MoveBusinessCaseInput } from "../../../move-business-case";

const FULL_CHARTER = {
  sponsor: "COO, accountable for irregular-operations recovery time.",
  stakeholders: "OCC lead, crew scheduling, customer care, IT platform owner.",
  success_metrics:
    "Cut passenger re-accommodation time; baseline recorded at intake.",
  value_range: "Preliminary value range pending finance validation.",
  scope: "Hub re-accommodation in scope; long-haul out of scope for the pilot.",
};

const FULL_MOVE: MoveBusinessCaseInput = {
  industry_code: "air_transport",
  name: "IROPS Digital AI",
  function_pack_key: "AI_OPERATIONS_DECISION_SUPPORT",
  charter: FULL_CHARTER,
  baseline_metrics: [
    {
      metric_name: "Average re-accommodation time",
      value: "recorded",
      unit: "minutes",
      as_of: "FY2026",
    },
  ],
  tenant_key: "skyharbor-air",
  tenant_name: "SkyHarbor Air",
};

/** A stub ModelCaller that returns a plan + document derived from the real brief. */
function passingStub(): ModelCaller {
  return async (prompt, req: DeliverableIntelligenceRequest) => {
    const brief = getArtifactBrief(req);
    if (prompt.pass === "architect") {
      const baselineSections = brief.requiredSections.map((key) => ({
        key,
        title: key,
        groundingMode: "mixed" as const,
        evidenceCitations: [1],
        assumptionsUsed: [],
        placeholders: [],
        rationale:
          "Derived from the brief structure and the governed evidence.",
      }));
      const minimumSections =
        req.deliverableType === "target_architecture" ? 10 : 9;
      const extraSections = [
        "Strategic Options Considered",
        "Operating Implications",
        "Evidence Gaps And Open Inputs",
        "Governance And Decision Path",
      ].map((title) => ({
        key: title.toLowerCase().replace(/[^a-z]+/g, "_"),
        title,
        groundingMode: "mixed" as const,
        evidenceCitations: [1],
        assumptionsUsed: [],
        placeholders: [],
        rationale:
          "Adds board-grade decision depth while staying grounded in evidence.",
      }));
      const plan: DeliverableGenerationPlan = {
        sectionPlan: [...baselineSections, ...extraSections].slice(
          0,
          Math.max(minimumSections, baselineSections.length),
        ),
        evidenceMapping: [
          {
            citationNumber: 1,
            usedInSections: brief.requiredSections,
            supportsClaim: "baseline grounding",
          },
        ],
        missingEvidenceHandling: req.missingEvidence.map((m) => ({
          evidenceFamily: m.evidenceFamily,
          handledAs: "client_to_complete",
          note: "Surfaced in the client-to-complete checklist.",
        })),
        artifactEnhancementSuggestions: [
          {
            suggestion: "Add a decision matrix exhibit",
            addsSectionOrExhibit: "decision_matrix",
            rationale: "Sharpens the ask.",
          },
        ],
        tableAndExhibitPlan: [
          {
            key: "risk_table",
            title: "Risk, Issues & Dependencies",
            kind: "table",
            targetFormat: "html",
            groundingMode: "mixed",
          },
        ],
        clientCompletePlan: [],
        outputPackagePlan: [{ format: "html", contents: "main document" }],
      };
      return { text: "```json\n" + JSON.stringify(plan) + "\n```" };
    }
    if (prompt.pass === "section_draft") {
      const para = [
        "The recorded charter and baseline establish the starting point for this initiative, and the governed evidence anchors the case [1]. " +
          "This section synthesises the operational reality the sponsor confirmed, draws the implication for the recovery workflow, and frames the decision the board must take. " +
          "It avoids generic filler and commits to a position grounded in what the organisation has actually recorded [1]. " +
          "The operating model implication is made explicit so leadership can see how the change lands in the relevant teams and where ownership sits. " +
          "Dependencies on adjacent systems are named, the sequencing is laid out, and the trade-offs are stated plainly rather than smoothed over. " +
          "Where the recorded evidence is thin, the gap is labelled for the client to complete rather than papered over with an invented figure. " +
          "The narrative ties each claim back to the source register so a reviewer can trace every assertion to what was actually captured [1].",
        "The case for change is not treated as a slogan: it names the operating tension, the decision required, the likely implementation friction, and the evidence that still needs sponsor confirmation. " +
          "Options considered include holding current operations, piloting the workflow at one hub, or funding a broader rollout after the decision gate [1]. " +
          "The recommended path is deliberately bounded so the executive team can approve learning without pretending the entire enterprise rollout has already been proven. " +
          "The section also names what would change the answer, which keeps the artifact useful as a governance instrument rather than a polished narrative.",
        "The practical implication is that leadership can separate facts already captured from judgments still pending. " +
          "The drafted decision therefore stays evidence-led: it does not add a financial claim, performance promise, or implementation dependency unless that item is carried as cited evidence, an explicit assumption, or a client-to-complete input. " +
          "That discipline is what makes the artifact safe to project into HTML now and into document formats later without changing the underlying source.",
      ].join(" ");
      const title =
        prompt.user.match(/WRITE ONLY THIS SECTION:\s*"([^"]+)"/)?.[1]?.trim() ??
        "Executive Summary";
      const section: RenderableSection = {
        key: title.toLowerCase().replace(/[^a-z]+/g, "_"),
        title,
        bodyMarkdown:
          /recommendation|decision/i.test(title)
            ? `We recommend the board approve a scoped pilot; the decision ask is explicit and the kill condition is named. ${para}`
            : `${para} Options considered include holding current operations, piloting the workflow at one hub, or funding a broader rollout after the decision gate [1]. The case for change is explicit because the recovery workflow is where the current operating tension lands.`,
        groundingMode: "mixed" as const,
        citationsUsed: [1],
      };
      return { text: JSON.stringify(section) };
    }
    if (prompt.pass === "synthesis") {
      const synth: Partial<RenderableDeliverable> = {
        title: "Costed Business-Case Pack",
        subtitle: "Board-grade, governed",
        tables: [
          {
            key: "risk_table",
            title: "Risk, Issues & Dependencies",
            columns: ["Risk", "Likelihood", "Mitigation"],
            rows: [
              ["Adoption lag", "Medium", "Phased rollout with OCC co-design"],
            ],
            targetFormat: "html",
          },
        ],
        exhibits: [],
        sourceRegister: req.sourceRegister,
        assumptions: [],
        clientCompleteChecklist: req.missingEvidence.map((m) => ({
          key: m.evidenceFamily,
          label: m.label,
          owner: "program_leadership",
          reason: "client_judgment",
          placeholderText: m.completionPath,
        })),
        recommendation:
          "Approve a scoped IROPS pilot at the primary hub, funded for one quarter, with an explicit kill condition on adoption.",
        nextActions: [
          "Confirm finance validation of the value range",
          "Stand up the OCC co-design workshop",
        ],
      };
      return { text: JSON.stringify(synth) };
    }
    // Legacy monolithic passes — threaded text only when older paths exercise them.
    return { text: `pass ${prompt.pass} output` };
  };
}

describe("buildBusinessCaseRequest — binds only recorded facts", () => {
  it("maps every present charter field + baseline metric to governed evidence, none fabricated", () => {
    const { request, evidenceCount } = buildBusinessCaseRequest(FULL_MOVE);
    expect(evidenceCount).toBe(6); // 5 charter fields + 1 baseline metric
    expect(request.missingEvidence).toHaveLength(0);
    // statements equal the recorded input — nothing invented
    const sponsor = request.governedEvidenceBundle.find(
      (e) => e.evidenceFamily === "charter_sponsor",
    );
    expect(sponsor?.statement).toBe(FULL_CHARTER.sponsor);
    // source register parallels the evidence bundle
    expect(request.sourceRegister).toHaveLength(6);
    expect(request.clientDisplayName).toBe("SkyHarbor Air");
    expect(request.initiativeDisplayName).toBe("IROPS Digital AI");
  });

  it("records absent charter fields as missing evidence (gap, not fabrication)", () => {
    const thin: MoveBusinessCaseInput = {
      ...FULL_MOVE,
      charter: { sponsor: FULL_CHARTER.sponsor },
      baseline_metrics: null,
    };
    const { request, evidenceCount } = buildBusinessCaseRequest(thin);
    expect(evidenceCount).toBe(1);
    expect(request.missingEvidence.map((m) => m.evidenceFamily)).toEqual(
      expect.arrayContaining([
        "charter_stakeholders",
        "charter_success_metrics",
        "charter_value_range",
        "charter_scope",
      ]),
    );
  });

  it("records UUID-backed committed evidence as lineage and ignores non-UUID provenance", () => {
    const evidenceId = "00000000-0000-4000-8000-000000000201";
    const { request, citedInputIds } = buildBusinessCaseRequest({
      ...FULL_MOVE,
      governed_evidence_items: [
        {
          id: evidenceId,
          title: "IROPS baseline workbook",
          summary: "Average recovery time and exception backlog were approved.",
          evidence_type: "baseline_workbook",
          confidence: 0.91,
          created_at: "2026-06-11T12:00:00Z",
        },
        {
          id: "not-a-uuid",
          title: "Charter JSON field",
          summary: "This is real provenance but not a UUID row id.",
          evidence_type: "charter_scope",
          confidence: 0.9,
        },
      ],
    });

    expect(citedInputIds).toEqual([evidenceId]);
    expect(
      request.governedEvidenceBundle.some(
        (e) => e.provenanceRef === evidenceId,
      ),
    ).toBe(true);
    expect(
      request.governedEvidenceBundle.some(
        (e) => e.provenanceRef === "not-a-uuid",
      ),
    ).toBe(false);
  });
});

describe("runOrchestratedBusinessCase — multi-pass flow + quality gate", () => {
  it("produces grounded HTML when the document passes the gate", async () => {
    const res = await runOrchestratedBusinessCase({
      moveInput: FULL_MOVE,
      moveId: "move-1",
      tenantId: "skyharbor-air",
      generatedOn: "2026-06-11",
      modelCaller: passingStub(),
    });
    expect(res.ok).toBe(true);
    expect(res.quality?.pass).toBe(true);
    expect(res.html).toContain("Business Case Readiness Memo");
    expect(res.html).toContain("Source Register");
    expect(res.html).toContain("We recommend");
    // architect + decomposed section drafts + synthesis were exercised
    expect(res.passTrace?.map((p) => p.pass)).toEqual(
      expect.arrayContaining(["architect", "section_draft", "synthesis"]),
    );
  });

  it("blocks (no HTML) when the Move has no recorded evidence — honest fallback", async () => {
    const empty: MoveBusinessCaseInput = {
      ...FULL_MOVE,
      charter: null,
      baseline_metrics: null,
    };
    const res = await runOrchestratedBusinessCase({
      moveInput: empty,
      moveId: "move-2",
      tenantId: "skyharbor-air",
      generatedOn: "2026-06-11",
      modelCaller: passingStub(),
    });
    expect(res.ok).toBe(false);
    expect(res.html).toBeUndefined();
    expect(res.blockedReason).toMatch(/recorded evidence/i);
  });

  it("blocks when the rendered document is too thin to be board-grade", async () => {
    const thinStub: ModelCaller = async (
      prompt,
      req: DeliverableIntelligenceRequest,
    ) => {
      if (prompt.pass === "architect") {
        const brief = getArtifactBrief(req);
        const plan: DeliverableGenerationPlan = {
          sectionPlan: brief.requiredSections.map((key) => ({
            key,
            title: key,
            groundingMode: "mixed",
            evidenceCitations: [1],
            assumptionsUsed: [],
            placeholders: [],
            rationale: "x",
          })),
          evidenceMapping: [
            {
              citationNumber: 1,
              usedInSections: brief.requiredSections,
              supportsClaim: "x",
            },
          ],
          missingEvidenceHandling: [],
          artifactEnhancementSuggestions: [],
          tableAndExhibitPlan: [],
          clientCompletePlan: [],
          outputPackagePlan: [{ format: "html", contents: "main" }],
        };
        return { text: JSON.stringify(plan) };
      }
      if (prompt.pass === "render_package") {
        const doc: RenderableDeliverable = {
          title: "Thin",
          clientDisplayName: req.clientDisplayName,
          initiativeDisplayName: req.initiativeDisplayName,
          generatedSections: [
            {
              key: "s1",
              title: "S1",
              bodyMarkdown: "too short",
              groundingMode: "mixed",
              citationsUsed: [],
            },
          ],
          tables: [],
          exhibits: [],
          sourceRegister: [],
          assumptions: [],
          clientCompleteChecklist: [],
          recommendation: "",
          nextActions: [],
        };
        return { text: JSON.stringify(doc) };
      }
      return { text: "x" };
    };
    const res = await runOrchestratedBusinessCase({
      moveInput: FULL_MOVE,
      moveId: "move-3",
      tenantId: "skyharbor-air",
      generatedOn: "2026-06-11",
      modelCaller: thinStub,
    });
    expect(res.ok).toBe(false);
    expect(res.html).toBeUndefined();
    expect(res.blockedReason).toMatch(
      /quality gate|too short|sections|recommendation/i,
    );
  });

  it("runs a non-business-case Moves deliverable through the same orchestrator path", async () => {
    const res = await runOrchestratedMoveDeliverable({
      moveInput: FULL_MOVE,
      moveId: "move-arch-1",
      tenantId: "skyharbor-air",
      generatedOn: "2026-06-11",
      deliverableType: "target_architecture",
      phaseOrStage: "P3_design",
      artifactStandard: "moves.board_grade.target_architecture",
      decisionContext:
        "Approve the target architecture and implementation implications.",
      modelCaller: passingStub(),
    });

    expect(res.ok).toBe(true);
    expect(res.passTrace?.map((p) => p.pass)).toEqual(
      expect.arrayContaining(["architect", "section_draft", "synthesis"]),
    );
    expect(res.html).toContain("Source Register");
    expect(res.document?.title).toBeTruthy();
    expect(res.document?.subtitle).toContain("Board-grade");
    expect(res.document?.generatedSections.length).toBeGreaterThan(0);

    const { request } = buildMoveDeliverableRequest(FULL_MOVE, {
      deliverableType: "target_architecture",
      phaseOrStage: "P3_design",
      artifactStandard: "moves.board_grade.target_architecture",
      decisionContext: "Approve the target architecture.",
    });
    expect(getArtifactBrief(request).deliverableType).toBe(
      "target_architecture",
    );
  });
});

describe("renderDeliverableHtml / markdownToHtml — escaping & structure", () => {
  it("escapes HTML in model output (no injection)", () => {
    const html = markdownToHtml(
      "A <script>alert(1)</script> line with **bold**.",
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("renders a markdown table to a real table", () => {
    const html = markdownToHtml("| A | B |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain("<table");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });
});
