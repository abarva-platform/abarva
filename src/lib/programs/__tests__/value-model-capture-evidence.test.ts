import { evaluateValueCase } from "@/lib/programs/value-engine";
import type { ValueCase, ValueCaseResult } from "@/lib/programs/value-engine/types";
import type { CostBasis } from "@/lib/programs/value-engine/cost-basis";
import {
  formatValueModelForPrompt,
  valueCurrency,
  valueGenerationSnapshot,
  valueModelReviewDetail,
} from "@/lib/programs/value-model-capture-evidence";
import { validateValueModelFigures } from "@/lib/deliverables/orchestrator/value-model-figures";
import { validatePublicSourceCitations } from "@/lib/deliverables/orchestrator/public-source-citations";
import { amsRfpRequest, goodDocument } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import { buildDeliverableRequest } from "@/lib/deliverables/orchestrator/build-request";
import { buildPassPrompt } from "@/lib/deliverables/orchestrator/prompt-builder";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";

const literal = (value: number) => ({ kind: "literal" as const, value, source: "fictional workshop" });
const COST: CostBasis = {
  status: "resolved",
  basis: "estimate_model",
  source: "estimate_model:internal",
  deliveryModel: "internal",
  cents: { low: 100_000, base: 100_000, high: 100_000 },
  planningBenchmark: null,
};

function model(): ValueCase {
  return {
    horizonYears: 2,
    discountRate: literal(0.08),
    cost: { kind: "estimate", baseCents: 100_000 },
    levers: [{
      id: "L1",
      name: "Fictional cost reduction",
      conversion: "cost_reduction",
      driver: {
        name: "share no longer bought",
        unit: "share",
        direction: "increase",
        baseline: literal(0),
        target: literal(0.1),
      },
      terms: [
        { role: "base", label: "fictional spend", ref: literal(10_000) },
        { role: "driver_delta" },
      ],
      attribution: literal(0.5),
      probability: literal(1),
      timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
    }],
  };
}

function doc(sentence: string): RenderableDeliverable {
  const original = goodDocument();
  return {
    ...original,
    title: "Value case",
    subtitle: "",
    generatedSections: [{
      ...original.generatedSections[0],
      bodyMarkdown: sentence,
      rawBodyMarkdown: sentence,
    }],
    tables: [],
    exhibits: [],
    deckSlides: [],
    recommendation: "",
    nextActions: [],
    assumptions: [],
    clientCompleteChecklist: [],
  };
}

describe("P4 value-model generation evidence", () => {
  const result = evaluateValueCase(model());
  const snapshot = valueGenerationSnapshot(result, COST, [], "test-input-hash");
  const req = amsRfpRequest({ valueGeneration: snapshot });
  const annual = result.levers[0].annualCents!.base;

  it("prints engine figures, formula sources, NPV, payback, and the no-double-haircut rule", () => {
    const prompt = formatValueModelForPrompt(result, COST);
    expect(prompt).toContain(`${valueCurrency(annual)} [VE:L1]`);
    expect(prompt).toContain("fictional workshop");
    expect(prompt).toContain("[VE:NPV]");
    expect(prompt).toContain("[VE:PAYBACK]");
    expect(prompt).toContain("never apply a second haircut");
  });

  it("keeps the flag-off/free-text request shape and prompt unchanged", () => {
    const params = {
      module: "moves" as const,
      useCaseArchetype: "governed_data_foundation",
      deliverableType: "business_case",
      decisionContext: "Fund or hold a fictional programme.",
      clientDisplayName: "Demo client",
      initiativeDisplayName: "Fictional move",
    };
    const off = buildDeliverableRequest(params, [], []);
    expect(Object.hasOwn(off, "valueGeneration")).toBe(false);
    const offPrompt = buildPassPrompt("architect", {
      req: off,
      brief: getArtifactBrief(off),
      evidence: [],
    }).user;
    expect(offPrompt).not.toContain("VALUE ENGINE RESULT");
    const on = buildDeliverableRequest({ ...params, valueGeneration: snapshot }, [], []);
    const onPrompt = buildPassPrompt("architect", {
      req: on,
      brief: getArtifactBrief(on),
      evidence: [],
    }).user;
    expect(onPrompt).toContain("VALUE ENGINE RESULT");
    expect(onPrompt).toContain(`${valueCurrency(annual)} [VE:L1]`);
  });

  it("allows an exact source-marked engine figure and rejects invented or uncited money", () => {
    expect(validateValueModelFigures(doc(`Plan annual cash ${valueCurrency(annual)} [VE:L1].`), req)).toEqual([]);
    expect(validateValueModelFigures(doc("Plan annual cash $777,777 [VE:L1]."), req).join(" ")).toContain("no matching engine result");
    expect(validateValueModelFigures(doc(`Plan annual cash ${valueCurrency(annual)}.`), req).join(" ")).toContain("no matching engine result");
  });

  it("permits a cited outside benchmark without treating it as client value", () => {
    const source = {
      citationNumber: 1,
      url: "https://example.org/fictional-study",
      title: "Fictional benchmark",
      publisher: "Public source",
      publishedAt: null,
      retrievedAt: "2026-10-10T00:00:00Z",
      excerpt: "An outside benchmark reports $9,000.",
      claim: "Outside benchmark only",
    };
    const withSource = amsRfpRequest({ ...req, publicSources: [source] });
    const outside = doc("External public benchmark $9,000 [S:1] applies to the published study only.");
    expect(validatePublicSourceCitations(outside, withSource)).toEqual([]);
    expect(validateValueModelFigures(outside, withSource)).toEqual([]);
    const applied = doc("Our client baseline is $9,000 [S:1].");
    expect(validatePublicSourceCitations(applied, withSource).join(" ")).toContain("public figure is applied");
    expect(validateValueModelFigures(applied, withSource).join(" ")).toContain("no matching engine result");
  });

  it("checks value-tree figure strings against exhibit-level source markers", () => {
    const exhibit = {
      key: "value-case",
      title: "Value case",
      kind: "chart" as const,
      targetFormat: "pptx" as const,
      description: "Engine annual value [VE:L1]",
      data: { kind: "value_tree" as const, root: { label: "Annual", value: valueCurrency(annual) }, branches: [] },
    };
    expect(validateValueModelFigures({ ...doc("A case."), exhibits: [exhibit] }, req)).toEqual([]);
    const unsupported = { ...exhibit, data: { ...exhibit.data, root: { label: "Annual", value: "$777,777" } } };
    expect(validateValueModelFigures({ ...doc("A case."), exhibits: [unsupported] }, req).join(" ")).toContain("no matching engine result");
  });

  it("does not let a source marker license a wrong scenario or unrelated number", () => {
    const high = result.levers[0].annualCents!.high;
    // This synthetic case has no range, so alter the high figure solely to
    // exercise the scenario binding in the physical validator.
    const ranged = {
      ...snapshot,
      figures: snapshot.figures.map((figure) =>
        figure.sourceId === "L1" && figure.scenario === "high"
          ? { ...figure, cents: high + 10_000_000 }
          : figure,
      ),
    };
    const rangedReq = amsRfpRequest({ valueGeneration: ranged });
    expect(validateValueModelFigures(doc(`Low ${valueCurrency(annual)} · plan ${valueCurrency(annual)} · high ${valueCurrency(high + 10_000_000)} [VE:L1].`), rangedReq)).toEqual([]);
    expect(validateValueModelFigures(doc(`Low annual cash ${valueCurrency(high + 10_000_000)} [VE:L1].`), rangedReq).join(" ")).toContain("no matching engine result");
    expect(validateValueModelFigures(doc(`Low ${valueCurrency(high + 10_000_000)} · plan ${valueCurrency(annual)} · high ${valueCurrency(annual)} [VE:L1].`), rangedReq).join(" ")).toContain("no matching engine result");
    expect(validateValueModelFigures(doc(`Plan annual cash ${valueCurrency(annual)} with 777 months [VE:L1].`), req).join(" ")).toContain("numeric claim 777");
  });

  it("checks payback and breakeven quantities against their own sources", () => {
    const month = result.economics!.paybackMonth.base!;
    expect(validateValueModelFigures(doc(`Plan payback month ${month} [VE:PAYBACK].`), req)).toEqual([]);
    expect(validateValueModelFigures(doc(`Plan payback month ${month}.`), req).join(" ")).toContain("numeric claim");
    expect(validateValueModelFigures(doc(`Plan payback month ${month + 100} [VE:PAYBACK].`), req).join(" ")).toContain("numeric claim");
    const breakeven = result.breakeven.find((row) => row.leverId === "L1")!;
    expect(validateValueModelFigures(doc(`Breakeven driver delta ${breakeven.breakevenDelta} [VE:BREAKEVEN-L1].`), req)).toEqual([]);
    expect(validateValueModelFigures(doc(`Breakeven driver delta 777 [VE:BREAKEVEN-L1].`), req).join(" ")).toContain("numeric claim 777");
  });

  it("ties hours monetization to the cited non-cash lever, not another counted lever", () => {
    expect(validateValueModelFigures(doc(`Hours saved are worth ${valueCurrency(annual)} [VE:L1].`), req).join(" ")).toContain("hours saved are monetized");
    const mixed: ValueCaseResult = {
      ...result,
      levers: [
        result.levers[0],
        { ...result.levers[0], leverId: "L2", name: "Documentation hours", conversion: "non_cash", status: "zero_no_release_path" },
      ],
    };
    const mixedSnapshot = valueGenerationSnapshot(mixed, COST, [], "test-input-hash");
    const mixedReq = amsRfpRequest({ valueGeneration: mixedSnapshot });
    expect(validateValueModelFigures(doc(`Documentation hours saved are worth ${valueCurrency(annual)} [VE:L1].`), mixedReq).join(" ")).toContain("hours saved are monetized");
    const released: ValueCaseResult = {
      ...mixed,
      levers: mixed.levers.map((lever) => lever.leverId === "L2" ? { ...lever, status: "counted", inCash: true } : lever),
    };
    const releasedReq = amsRfpRequest({ valueGeneration: valueGenerationSnapshot(released, COST, [], "test-input-hash") });
    expect(validateValueModelFigures(doc(`Documentation hours saved are worth ${valueCurrency(annual)} [VE:L2].`), releasedReq)).toEqual([]);
  });

  it("names blocked levers and register rows in a review-required refusal", () => {
    const blocked: ValueCaseResult = {
      ...result,
      readyForApproval: false,
      economics: null,
      levers: [{ ...result.levers[0], status: "blocked_unresolved_input" }],
    };
    expect(valueModelReviewDetail(blocked, [{ key: "L1.term[0]", reason: "not_counted", registerId: "V3", detail: "L1 reads row V3, which is proposed." }], COST)).toContain("[A:V3]");
    expect(valueModelReviewDetail(blocked, [{ key: "L1.term[0]", reason: "not_counted", registerId: "V3", detail: "L1 reads row V3, which is proposed." }], COST)).toContain("Blocked levers: L1");
  });

  it("does not gate a ready engine result", () => {
    expect(valueModelReviewDetail(result, [], COST)).toBeNull();
  });
});
