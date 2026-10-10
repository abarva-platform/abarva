// Assumptions register — the Moves generation feed and the rendered register.
//
// Register rows reach a Move document only when the register governs the
// generation (`MoveBusinessCaseInput.assumptionRegister` present, set by the
// loader behind `moves_assumption_register_v1`). Absent, the request is built
// exactly as before: no assumptions, no enforcement.

import { buildMoveDeliverableRequest } from "../build-request";
import { runOrchestratedMoveDeliverable } from "../run-orchestrated-move-deliverable";
import { registerAnchorId, renderDeliverableHtml } from "../render-html";
import { goodDocument } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type { ApprovedAssumption } from "@/lib/deliverables/orchestrator/types";
import {
  REGISTER_UNAVAILABLE_DETAIL,
  approvedAssumptionsFromRegister,
  type AssumptionRecord,
} from "../../../assumption-register/model";
import type { MoveBusinessCaseInput } from "../../../move-business-case";

const MOVE: MoveBusinessCaseInput = {
  industry_code: "air_transport",
  name: "Disruption recovery",
  charter: {
    sponsor: "COO, accountable for recovery time.",
    scope: "Hub re-accommodation in scope.",
  },
  baseline_metrics: [
    { metric_name: "Re-accommodation time", value: "42", unit: "minutes" },
  ],
  tenant_key: "meridian",
};

const OPTIONS = {
  deliverableType: "business_case",
  phaseOrStage: "P4_business_case",
  artifactStandard: "moves.board_grade.costed_business_case",
  decisionContext: "Fund or hold.",
};

function row(overrides: Partial<ApprovedAssumption> = {}): ApprovedAssumption {
  return {
    key: "V3",
    statement: "Handle time falls after the change",
    basis: "Ops review",
    mustValidate: true,
    registerId: "V3",
    figure: "12%",
    ownerRole: "CFO office",
    confidence: 3,
    status: "open",
    ...overrides,
  };
}

function record(overrides: Partial<AssumptionRecord> = {}): AssumptionRecord {
  return {
    id: "a-1",
    tenantKey: "meridian",
    programId: "move-1",
    area: "value",
    seq: 3,
    registerId: "V3",
    statement: "Handle time falls after the change",
    whyItMatters: null,
    workingFigure: "12%",
    workingValue: 12,
    unit: "percent",
    source: "Ops review",
    confidence: 3,
    ownerRole: "CFO office",
    ownerName: "Pat Example",
    ownerPersonId: null,
    status: "open",
    origin: "team",
    answer: null,
    answerFigure: null,
    answerValue: null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: null,
    raisedPhase: 4,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "u-1",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

describe("register rows as a generation feed", () => {
  const scope = { tenantId: "client-uuid-1" };

  it("feeds only open, confirmed and corrected rows", () => {
    const statuses = [
      "proposed",
      "open",
      "confirmed",
      "corrected",
      "superseded",
      "rejected",
    ] as const;
    const fed = approvedAssumptionsFromRegister(
      statuses.map((status, i) =>
        record({
          id: `a-${i}`,
          seq: i + 1,
          registerId: `V${i + 1}`,
          status,
          answer: status === "corrected" ? "It falls 9%" : null,
          answerFigure:
            status === "confirmed" || status === "corrected" ? "9%" : null,
          answerSource:
            status === "confirmed" || status === "corrected"
              ? "Finance close"
              : null,
          answeredAt:
            status === "confirmed" || status === "corrected"
              ? "2026-10-02T00:00:00Z"
              : null,
        }),
      ),
      scope,
    );
    expect(fed.map((a) => [a.registerId, a.status, a.mustValidate])).toEqual([
      ["V2", "open", true],
      ["V3", "confirmed", false],
      ["V4", "corrected", false],
    ]);
  });

  it("uses the answer figure for confirmed and corrected rows, the working figure while open", () => {
    const fed = approvedAssumptionsFromRegister(
      [
        record(),
        record({
          id: "a-2",
          seq: 4,
          registerId: "V4",
          status: "confirmed",
          answerFigure: "10%",
          answerSource: "Finance close",
          answeredAt: "2026-10-02T00:00:00Z",
        }),
        record({
          id: "a-3",
          seq: 5,
          registerId: "V5",
          status: "corrected",
          answer: "It falls 9%",
          answerFigure: "9%",
          answerSource: "Finance close",
          answeredAt: "2026-10-02T00:00:00Z",
        }),
      ],
      scope,
    );
    expect(fed.map((a) => a.figure)).toEqual(["12%", "10%", "9%"]);
  });

  it("carries the owner role and never the owner's name", () => {
    const fed = approvedAssumptionsFromRegister([record()], scope);
    expect(fed[0].ownerRole).toBe("CFO office");
    expect(JSON.stringify(fed)).not.toContain("Pat Example");
  });

  it("drops a row the governance policy blocks", () => {
    expect(
      approvedAssumptionsFromRegister(
        [record({ tenantKey: "not-a-tenant" })],
        scope,
      ),
    ).toEqual([]);
  });
});

describe("Moves build request", () => {
  it("fills approvedAssumptions and enforces when the register is loaded", () => {
    const rows = [row(), row({ key: "D1", registerId: "D1", figure: "40" })];
    const { request } = buildMoveDeliverableRequest(
      { ...MOVE, assumptionRegister: { status: "loaded", assumptions: rows } },
      OPTIONS,
    );
    expect(request.approvedAssumptions).toEqual(rows);
    expect(request.approvedAssumptions).not.toBe(rows);
    expect(request.assumptionRegisterEnforced).toBe(true);
  });

  it("enforces with no rows when the register is loaded empty", () => {
    const { request } = buildMoveDeliverableRequest(
      { ...MOVE, assumptionRegister: { status: "loaded", assumptions: [] } },
      OPTIONS,
    );
    expect(request.approvedAssumptions).toEqual([]);
    expect(request.assumptionRegisterEnforced).toBe(true);
  });

  it("stays [] and unenforced when the register does not govern (flag off)", () => {
    const { request } = buildMoveDeliverableRequest(MOVE, OPTIONS);
    expect(request.approvedAssumptions).toEqual([]);
    expect("assumptionRegisterEnforced" in request).toBe(false);
  });

  it("enforces without rows when the register could not be read", () => {
    const { request } = buildMoveDeliverableRequest(
      { ...MOVE, assumptionRegister: { status: "unavailable" } },
      OPTIONS,
    );
    expect(request.approvedAssumptions).toEqual([]);
    expect(request.assumptionRegisterEnforced).toBe(true);
  });

  it("refuses to generate when the register could not be read, before any model call", async () => {
    const modelCaller = jest.fn();
    const result = await runOrchestratedMoveDeliverable({
      ...OPTIONS,
      moveInput: { ...MOVE, assumptionRegister: { status: "unavailable" } },
      moveId: "move-1",
      tenantId: "client-uuid-1",
      generatedOn: "2026-10-10",
      modelCaller: modelCaller as never,
    });
    expect(result.ok).toBe(false);
    expect(result.blockedReason).toBe(
      `assumption_register_unavailable: ${REGISTER_UNAVAILABLE_DETAIL}`,
    );
    expect(modelCaller).not.toHaveBeenCalled();
  });
});

describe("rendered register", () => {
  function docWithRegister() {
    const doc = goodDocument();
    return {
      ...doc,
      generatedSections: [
        ...doc.generatedSections,
        {
          key: "value",
          title: "Value",
          bodyMarkdown:
            "Handle time falls 12% [A:V3]; an unknown [A:V9] stays plain.",
          groundingMode: "mixed" as const,
          citationsUsed: [],
        },
      ],
      assumptions: [
        row(),
        row({
          key: "DL1",
          registerId: "DL1",
          statement: "Cutover <fast>",
          figure: null,
          ownerRole: "PMO",
          confidence: 5,
          status: "corrected",
          mustValidate: false,
        }),
      ],
    };
  }

  it("renders the register table with an anchored row per register ID", () => {
    const html = renderDeliverableHtml(docWithRegister(), "2026-10-10");
    expect(html).toContain(
      '<section id="assumptions"><h2>Assumptions Register</h2><table class="md"><thead><tr><th>ID</th><th>Assumption</th><th>Figure</th><th>Owner role</th><th>Confidence</th><th>Status</th></tr></thead>',
    );
    expect(html).toContain(
      '<tr id="assumption-V3"><td>[A:V3]</td><td>Handle time falls after the change</td><td>12%</td><td>CFO office</td><td>3 of 5</td><td>Open — to validate</td></tr>',
    );
    expect(html).toContain(
      '<tr id="assumption-DL1"><td>[A:DL1]</td><td>Cutover &lt;fast&gt;</td><td>—</td><td>PMO</td><td>5 of 5</td><td>Corrected</td></tr>',
    );
    expect(html).not.toContain("Assumptions to Validate");
    expect(registerAnchorId("V3")).toBe("assumption-V3");
  });

  it("links a body citation to its register row and leaves an unknown ID unlinked", () => {
    const html = renderDeliverableHtml(docWithRegister(), "2026-10-10");
    expect(html).toContain('<a href="#assumption-V3">[A:V3]</a>');
    expect(html).toContain("an unknown [A:V9] stays plain");
    expect(html).not.toContain('href="#assumption-V9"');
  });

  it("renders the legacy list when no assumption is a register row", () => {
    const doc = goodDocument();
    const html = renderDeliverableHtml(
      {
        ...doc,
        assumptions: [
          { key: "k", statement: "S", basis: "B", mustValidate: true },
        ],
      },
      "2026-10-10",
    );
    expect(html).toContain(
      '<section id="assumptions"><h2>Assumptions to Validate</h2><ul><li><strong>S</strong> — B <em>[validate]</em></li></ul></section>',
    );
    expect(html).not.toContain("assumption-");
  });
});
