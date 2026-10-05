/**
 * @jest-environment jsdom
 *
 * The explanation drawer's two gate figures each name the set they count.
 *
 * Before `explanation-gate-figures.ts` the drawer rendered a bare
 * `Gates: {met} of {total} met` headline and a bare row count under the same
 * word "Gates" — two different sets (the current stage's criteria vs every
 * criterion carried into the trace, across stages) shown as one quantity.
 *
 * The host cases render the real drawer with a stubbed `/api/reasoning/explain`
 * response, because the figures are only wrong where they are read.
 */
import { render, screen, within } from "@testing-library/react";

import { ExplainQuoteDrawer } from "@/components/_shared/ExplainQuoteDrawer";
import {
  explanationGateRowsLabel,
  explanationGateSummaryLine,
} from "@/lib/reasoning/explanation-gate-figures";
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
    gateSummary: { total: 5, met: 2, unmet: 3 },
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

describe("explanationGateSummaryLine", () => {
  it("says what it counts, and agrees the noun with the total", () => {
    expect(explanationGateSummaryLine({ total: 5, met: 2, unmet: 3 })).toBe(
      "Gates: 2 of 5 criteria met · 3 unmet",
    );
  });

  it("renders the singular for a one-criterion total", () => {
    // Reachable: the programs shape-only fallback hard-codes `total: 1`.
    expect(explanationGateSummaryLine({ total: 1, met: 0, unmet: 1 })).toBe(
      "Gates: 0 of 1 criterion met · 1 unmet",
    );
    expect(explanationGateSummaryLine({ total: 1, met: 1, unmet: 0 })).toBe(
      "Gates: 1 of 1 criterion met",
    );
  });

  it("drops the unmet clause only when nothing is unmet", () => {
    expect(explanationGateSummaryLine({ total: 4, met: 4, unmet: 0 })).toBe(
      "Gates: 4 of 4 criteria met",
    );
    expect(
      explanationGateSummaryLine({ total: 4, met: 3, unmet: 1 }),
    ).toContain("· 1 unmet");
  });
});

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

  it("renders the headline figure with its noun and the unmet clause", async () => {
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
    // One text node, asserted whole: a substring match would pass on the
    // pre-fix bare "2 of 5 met".
    expect(
      within(summary).getByText("Gates: 2 of 5 criteria met · 3 unmet"),
    ).toBeTruthy();
  });

  it("renders the singular headline on a one-criterion gate", async () => {
    stubExplain(
      payload({
        gateSummary: { total: 1, met: 1, unmet: 0 },
        gates: [group("P1", 1)],
      }),
    );
    render(
      <ExplainQuoteDrawer
        surface="programs"
        instanceId="prog-1"
        open
        onClose={() => {}}
      />,
    );

    const summary = await screen.findByTestId("explain-summary");
    expect(
      within(summary).getByText("Gates: 1 of 1 criterion met"),
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
