/**
 * @jest-environment jsdom
 *
 * The explanation drawer's two gate figures each name the set they count.
 *
 * The drawer rendered a bare `Gates: {met} of {total} met` headline and a bare
 * row count under the same word "Gates" — two different sets (the current
 * stage's criteria vs every criterion carried into the trace, across stages)
 * shown as one quantity.
 *
 * The headline half is now `buildGateSummaryLine`, which landed on main while
 * this change waited and does strictly more for that figure. The unit cases
 * here cover only the gates-section count, which is still this module's; the
 * headline keeps one host case as a wiring proof.
 *
 * The host cases render the real drawer with a stubbed `/api/reasoning/explain`
 * response, because the figures are only wrong where they are read.
 */
import { render, screen, within } from "@testing-library/react";

import { ExplainQuoteDrawer } from "@/components/_shared/ExplainQuoteDrawer";
import { explanationGateRowsLabel } from "@/lib/reasoning/explanation-gate-figures";
import type {
  ExplanationGateRow,
  ExplanationGateStageGroup,
  ExplanationPayload,
} from "@/lib/reasoning/explanation-serializer";

function row(stageId: string, criterionId: string): ExplanationGateRow {
  return {
    criterionId,
    stageId,
    status: "unmet",
    gateType: "hard",
    description: `criterion ${criterionId}`,
    evaluationHint: "hint",
    evidence: [],
    patternRef: { patternId: "p", patternVersion: "1", section: "§ Gate" },
  };
}

function group(stageId: string, count: number): ExplanationGateStageGroup {
  return {
    stageId,
    rows: Array.from({ length: count }, (_, i) =>
      row(stageId, `${stageId}-${i}`),
    ),
  };
}

function payload(over: Partial<ExplanationPayload> = {}): ExplanationPayload {
  return {
    surface: "tower",
    instanceId: "tower",
    instanceType: "program",
    patternId: "pattern-x",
    patternVersion: "1.0",
    currentStage: "P2 Discover",
    gateSummary: { total: 5, met: 2, partial: 0, waived: 0, unmet: 3 },
    citations: [],
    gates: [group("P1", 4), group("P2", 2)],
    contradictions: [],
    failureModes: [],
    cascadeImpacts: [],
    ...over,
  };
}

function stubExplain(body: ExplanationPayload) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
}

describe("explanationGateRowsLabel", () => {
  it("counts the rows it lists and names their stage span", () => {
    expect(explanationGateRowsLabel([group("P1", 4), group("P2", 2)])).toBe(
      "6 criteria · 2 stages",
    );
  });

  it("agrees both nouns at one row in one stage", () => {
    expect(explanationGateRowsLabel([group("P1", 1)])).toBe(
      "1 criterion · 1 stage",
    );
  });

  it("ignores stages that carry no rows", () => {
    expect(explanationGateRowsLabel([group("P1", 3), group("P2", 0)])).toBe(
      "3 criteria · 1 stage",
    );
  });

  it("is a plain zero count when the trace carries nothing", () => {
    expect(explanationGateRowsLabel([])).toBe("0 criteria");
    expect(explanationGateRowsLabel([group("P1", 0)])).toBe("0 criteria");
  });

  it("does not reuse the headline total — the two sets differ", () => {
    // Tower carries only the blocked subset (rows < total); source and programs
    // carry every stage (rows > total). Neither direction may borrow the other
    // figure's denominator.
    const summary = { total: 5, met: 2, unmet: 3 };
    expect(explanationGateRowsLabel([group("P1", 2)])).not.toContain(
      String(summary.total),
    );
    expect(explanationGateRowsLabel([group("P1", 9), group("P2", 9)])).toBe(
      "18 criteria · 2 stages",
    );
  });
});

describe("ExplainQuoteDrawer gate figures (host)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the headline through the shared gate-summary line, not a local spelling", async () => {
    // The headline figure belongs to `buildGateSummaryLine`. This is a wiring
    // proof, not a second opinion on its wording: that function's own clause
    // and noun behaviour is covered in `gate-summary-line.test.ts`. Asserted
    // as one whole text node, because a substring match would also pass on a
    // drawer that had gone back to printing a bare "2 of 5 met".
    stubExplain(payload());
    render(
      <ExplainQuoteDrawer
        surface="tower"
        instanceId="tower"
        open
        onClose={() => {}}
      />,
    );

    const summary = await screen.findByTestId("explain-summary");
    expect(
      within(summary).getByText("2 of 5 gate criteria met · 3 unmet"),
    ).toBeTruthy();
  });

  it("labels the gates list by the rows it shows, not by the headline total", async () => {
    stubExplain(payload());
    render(
      <ExplainQuoteDrawer
        surface="tower"
        instanceId="tower"
        open
        onClose={() => {}}
      />,
    );

    const gates = await screen.findByTestId("explain-gates");
    expect(within(gates).getByText("6 criteria · 2 stages")).toBeTruthy();
    // The headline's 5 is not reprinted as this list's count.
    expect(within(gates).queryByText("5")).toBeNull();
  });

  it("keeps the other sections on their plain numeric counts", async () => {
    stubExplain(
      payload({
        citations: [
          {
            patternId: "p",
            patternVersion: "1",
            section: "§ Stage",
            excerpt: "e",
            relevance: "r",
          },
        ],
      }),
    );
    render(
      <ExplainQuoteDrawer
        surface="tower"
        instanceId="tower"
        open
        onClose={() => {}}
      />,
    );

    const citations = await screen.findByTestId("explain-citations");
    expect(within(citations).getByText("1")).toBeTruthy();
  });
});
