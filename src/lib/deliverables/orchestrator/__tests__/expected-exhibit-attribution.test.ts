// The expected-exhibit shortfall must name the exhibit that is actually absent.
//
// C-514 gave the gate a COUNT (see c514-expected-exhibit-shortfall.test.ts).
// This suite covers the other half of the same warning: the list of titles it
// prints after the count. That list was decided by matching produced exhibits
// against expected ones BY KIND ALONE, greedily, in declaration order — titles
// and keys were read for the message and never for the match.
//
// Every expected exhibit of a given kind is interchangeable under that rule, so
// whichever one is declared first consumes the produced exhibit and the rest are
// reported missing. When the arrival is not the first-declared one, the warning
// names a visual that IS in the document and silently credits the one that is
// not. The count stays right, which is what made it hard to see: an operator
// reads a specific, confident title and goes looking for an exhibit already on
// the page, while the real gap keeps its "received" credit.
//
// This is not a corner: 86 of the 105 structure x archetype-pack briefs the
// registry can compose declare two or more expected exhibits of the same kind
// (the AMS pack asks for three matrices on its own), so same-kind sets are the
// normal case rather than the exception. The first test below is driven from
// the shipped catalogs so that stays true by measurement, not by assertion.
//
// What the fix may NOT change is the count. Within one kind, matching every
// expected entry against any remaining produced entry of that kind leaves a
// maximal matching either way, so `received` is still the sum over kinds of
// min(expected, produced). The attribution moves; the figure does not. Both
// halves are pinned here, because a change that improved the names and quietly
// moved the number would be a worse regression than the bug.

import { validateDeliverableQuality } from "../quality-validator";
import { getArchetypePack } from "../briefs/archetype-packs";
import { DELIVERABLE_STRUCTURES } from "../briefs/deliverable-structures";
import { ARCHETYPE_PACKS } from "../briefs/archetype-packs";
import { amsRfpRequest, goodDocument } from "../__fixtures__/ams-rfp";
import type { ExpectedExhibit, RenderableExhibit } from "../types";

function want(
  title: string,
  kind: ExpectedExhibit["kind"],
  key = title.toLowerCase().replace(/\s+/g, "_"),
): ExpectedExhibit {
  return { key, title, kind, purpose: `Show ${title}.`, preferredFormat: "pptx" };
}

function got(
  title: string,
  kind: RenderableExhibit["kind"],
  key = title.toLowerCase().replace(/\s+/g, "_"),
): RenderableExhibit {
  return {
    key,
    title,
    kind,
    description: `Rendered ${title}.`,
    targetFormat: "pptx",
    data: {
      kind: "matrix",
      axes: { x: "x", y: "y" },
      cells: [{ x: "a", y: "b", label: "c", value: "d" }],
    } as RenderableExhibit["data"],
  };
}

function shortfall(
  expectedExhibits: ExpectedExhibit[],
  exhibits: RenderableExhibit[],
) {
  const doc = goodDocument();
  doc.exhibits = exhibits;
  const res = validateDeliverableQuality(doc, amsRfpRequest(), {
    expectedExhibits,
  });
  const { receivedExpectedExhibitCount, missingExpectedExhibits } = res.metrics;
  if (
    receivedExpectedExhibitCount === undefined ||
    missingExpectedExhibits === undefined
  ) {
    // Both metrics are optional on QualityMetrics, so read them once and fail
    // loudly here: a gate that reported nothing would otherwise read as a gate
    // that reported no shortfall.
    throw new Error("the quality gate reported no expected-exhibit metrics");
  }
  return {
    received: receivedExpectedExhibitCount,
    missing: missingExpectedExhibits,
    warning: res.warnings.find((w) => w.includes("expected exhibits")),
  };
}

describe("same-kind expected exhibits are the normal case, not a corner", () => {
  it("most composable briefs declare two or more exhibits of one kind", () => {
    // Measured off the shipped catalogs rather than asserted, so this stops
    // being true the moment the catalogs stop making it true.
    let composable = 0;
    let withSameKindSet = 0;
    for (const structure of DELIVERABLE_STRUCTURES) {
      for (const pack of Object.values(ARCHETYPE_PACKS)) {
        const all = [...(structure.expectedExhibits ?? []), ...pack.exhibits];
        if (all.length === 0) continue;
        composable += 1;
        const perKind = new Map<string, number>();
        for (const e of all) perKind.set(e.kind, (perKind.get(e.kind) ?? 0) + 1);
        if ([...perKind.values()].some((n) => n > 1)) withSameKindSet += 1;
      }
    }
    expect(composable).toBeGreaterThan(50);
    expect(withSameKindSet / composable).toBeGreaterThan(0.5);
  });

  it("one shipped pack asks for three exhibits of the same kind", () => {
    const pack = getArchetypePack("AMS_IT_OUTSOURCING");
    const matrices = (pack?.exhibits ?? []).filter((e) => e.kind === "matrix");
    expect(matrices.length).toBe(3);
  });
});

describe("the shortfall names the exhibit that did not arrive", () => {
  it("does not report a delivered exhibit as missing because a peer was declared first", () => {
    // Two matrices expected; the SECOND-declared one is the one that arrived.
    // Matching by kind in declaration order hands the arrival to "Evaluation
    // Model" and reports "Service Tower Scope Map" — which is in the document.
    const res = shortfall(
      [want("Evaluation Model", "matrix"), want("Service Tower Scope Map", "matrix")],
      [got("Service Tower Scope Map", "matrix")],
    );

    expect(res.received).toBe(1);
    expect(res.missing).toEqual(["Evaluation Model"]);
    expect(res.missing).not.toContain("Service Tower Scope Map");
    expect(res.warning).toContain("1 of 2");
    expect(res.warning).toContain('"Evaluation Model"');
  });

  it("attributes a whole same-kind set to the two that arrived", () => {
    // The AMS matrix set, with the first and last delivered. Order-blind
    // matching would report the two trailing declarations.
    const res = shortfall(
      [
        want("Service Tower Scope Map", "matrix"),
        want("Evaluation Model", "matrix"),
        want("Negotiation Levers", "matrix"),
      ],
      [got("Negotiation Levers", "matrix"), got("Service Tower Scope Map", "matrix")],
    );

    expect(res.received).toBe(2);
    expect(res.missing).toEqual(["Evaluation Model"]);
  });

  it("matches on the key when the author retitled the exhibit", () => {
    // The prompt names exhibits by title, but the author writes its own key.
    // An exhibit that kept the brief's key and reworded the title is the same
    // exhibit, and must not be credited to a same-kind peer.
    const res = shortfall(
      [want("Evaluation Model", "matrix"), want("Tower Scope Map", "matrix", "tower_scope_map")],
      [got("Scope of Services by Tower", "matrix", "tower_scope_map")],
    );

    expect(res.received).toBe(1);
    expect(res.missing).toEqual(["Evaluation Model"]);
  });

  it("reads a title through punctuation and casing differences", () => {
    const res = shortfall(
      [want("Evaluation Model", "matrix"), want("Service Tower Scope Map", "matrix")],
      [got("service-tower   SCOPE map", "matrix", "authored_key")],
    );

    expect(res.received).toBe(1);
    expect(res.missing).toEqual(["Evaluation Model"]);
  });

  it("does not credit a same-titled exhibit of a different kind", () => {
    // A timeline called "Transition Timeline" is not the matrix the brief asked
    // for. Identity alone must not override kind, or the gate starts accepting
    // the wrong visual because the heading agrees.
    const res = shortfall(
      [want("Transition Timeline", "matrix")],
      [got("Transition Timeline", "timeline")],
    );

    expect(res.received).toBe(0);
    expect(res.missing).toEqual(["Transition Timeline"]);
  });

  it("still credits an arrival whose title matches nothing", () => {
    // The pre-existing rule has to survive: an exhibit the author named freely
    // is evidence the expected visual of that kind arrived. Dropping back to
    // kind is what keeps this from becoming stricter than the old gate.
    const res = shortfall(
      [want("Service Tower Scope Map", "matrix")],
      [got("Operating Footprint", "matrix", "operating_footprint")],
    );

    expect(res.received).toBe(1);
    expect(res.missing).toEqual([]);
    expect(res.warning).toBeUndefined();
  });

  it("credits one produced exhibit to one expected exhibit, never to two", () => {
    // Pinned again from this side: an identity match must CONSUME the arrival,
    // or a single exhibit satisfies every peer that names it.
    const res = shortfall(
      [
        want("Service Tower Scope Map", "matrix"),
        want("Service Tower Scope Map", "matrix", "duplicate_declaration"),
      ],
      [got("Service Tower Scope Map", "matrix")],
    );

    expect(res.received).toBe(1);
    expect(res.missing.length).toBe(1);
  });
});

describe("the count the shortfall prints does not move", () => {
  // received must stay the sum over kinds of min(expected, produced) — the
  // figure the old rule produced. These cases fix both populations and assert
  // the arithmetic, so an attribution change that also moved the number fails.
  const cases: Array<{
    name: string;
    expected: ExpectedExhibit[];
    produced: RenderableExhibit[];
    received: number;
  }> = [
    {
      name: "fewer produced than expected, within one kind",
      expected: [want("A", "matrix"), want("B", "matrix"), want("C", "matrix")],
      produced: [got("C", "matrix")],
      received: 1,
    },
    {
      name: "more produced than expected, within one kind",
      expected: [want("A", "matrix")],
      produced: [got("Z", "matrix"), got("A", "matrix"), got("Y", "matrix")],
      received: 1,
    },
    {
      name: "two kinds, one short in each",
      expected: [
        want("A", "matrix"),
        want("B", "matrix"),
        want("C", "timeline"),
        want("D", "timeline"),
      ],
      produced: [got("B", "matrix"), got("D", "timeline")],
      received: 2,
    },
    {
      name: "an arrival of a kind nobody expected earns no credit",
      expected: [want("A", "matrix")],
      produced: [got("A", "chart"), got("Q", "heatmap")],
      received: 0,
    },
    {
      name: "every expected exhibit arrived, none named as declared",
      expected: [want("A", "matrix"), want("B", "timeline")],
      produced: [got("P", "timeline", "p"), got("Q", "matrix", "q")],
      received: 2,
    },
  ];

  it.each(cases)("$name", ({ expected, produced, received }) => {
    const perKind = new Map<string, { want: number; got: number }>();
    for (const e of expected) {
      const row = perKind.get(e.kind) ?? { want: 0, got: 0 };
      perKind.set(e.kind, { ...row, want: row.want + 1 });
    }
    for (const p of produced) {
      const row = perKind.get(p.kind) ?? { want: 0, got: 0 };
      perKind.set(p.kind, { ...row, got: row.got + 1 });
    }
    const byArithmetic = [...perKind.values()].reduce(
      (sum, row) => sum + Math.min(row.want, row.got),
      0,
    );

    const res = shortfall(expected, produced);
    expect(res.received).toBe(received);
    expect(res.received).toBe(byArithmetic);
    expect(res.received + res.missing.length).toBe(expected.length);
  });
});
