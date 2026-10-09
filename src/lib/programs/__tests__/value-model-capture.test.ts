/**
 * P4 `value_plan` as a structured value model, and its flagged completeness
 * check in the capture contract. All values are synthetic.
 */
import {
  evaluatePhaseCapture,
  getPhaseCaptureSections,
  VALUE_MODEL_SECTION_KEY,
} from "@/lib/programs/phase-capture-contract";
import {
  evaluateValueModelCapture,
  parseValueModel,
  readValueModel,
  serializeValueModel,
  type ValueModelCapture,
} from "@/lib/programs/value-model-capture";

function model(
  overrides: Partial<ValueModelCapture["case"]> = {},
): ValueModelCapture {
  return {
    kind: "value_model",
    version: 1,
    case: {
      horizonYears: 2,
      discountRate: { kind: "literal", value: 0.08, source: "synthetic" },
      cost: { kind: "estimate", baseCents: 10_000_000 },
      levers: [
        {
          id: "L1",
          name: "Premium labour",
          conversion: "cost_reduction",
          driver: {
            name: "premium labour spend reduced",
            unit: "share of spend",
            direction: "increase",
            baseline: { kind: "literal", value: 0, source: "synthetic" },
            target: {
              kind: "evidence",
              evidenceId: "ev-1",
              value: 0.1,
              unit: "fraction",
              asOf: "2026-09-30",
            },
          },
          terms: [
            {
              role: "base",
              label: "annual premium labour spend ($)",
              ref: { kind: "literal", value: 1_000_000, source: "synthetic" },
            },
            { role: "driver_delta" },
          ],
          attribution: { kind: "literal", value: 0.5, source: "synthetic" },
          probability: { kind: "literal", value: 1, source: "synthetic" },
          timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
        },
      ],
      ...overrides,
    },
  };
}

describe("value model capture · read and write", () => {
  it("round-trips a structured model", () => {
    const m = model();
    const text = serializeValueModel(m);
    expect(parseValueModel(text)).toEqual(m);
    expect(readValueModel(`  ${text}\n`)).toEqual({ kind: "model", model: m });
  });

  it("reads today's free text, and JSON that declares no value-model kind, as legacy text", () => {
    for (const text of [
      "",
      "Reduce agency spend by 10% through internal float pool.",
      "{not json",
      JSON.stringify({ kind: "estimate_model", lines: [] }),
      "[1,2]",
      "null",
    ]) {
      expect(readValueModel(text)).toEqual({ kind: "legacy_text" });
      expect(parseValueModel(text)).toBeNull();
    }
  });

  it("reads a declared but malformed model as invalid, naming the path", () => {
    const broken = { ...model(), version: 2 };
    const read = readValueModel(JSON.stringify(broken));
    expect(read.kind).toBe("invalid");
    expect(read.kind === "invalid" && read.issues.join(" ")).toContain(
      "version",
    );
    const typo = JSON.parse(serializeValueModel(model()));
    typo.case.levers[0].probabilty = typo.case.levers[0].probability;
    delete typo.case.levers[0].probability;
    const typoRead = readValueModel(JSON.stringify(typo));
    expect(typoRead.kind).toBe("invalid");
    expect(parseValueModel(JSON.stringify(typo))).toBeNull();
    const extra = JSON.parse(serializeValueModel(model()));
    extra.case.levers[0].haircut = 0.3;
    expect(readValueModel(JSON.stringify(extra)).kind).toBe("invalid");
  });
});

describe("value model capture · evaluation", () => {
  it("completes legacy text, refuses an invalid model, and evaluates a model", () => {
    expect(evaluateValueModelCapture("Free text value plan.")).toMatchObject({
      result: null,
      complete: true,
    });
    expect(
      evaluateValueModelCapture(
        JSON.stringify({ kind: "value_model", version: 1 }),
      ),
    ).toMatchObject({ result: null, complete: false });
    const evaluated = evaluateValueModelCapture(serializeValueModel(model()));
    expect(evaluated.complete).toBe(true);
    // 1,000,000 × 0.1 × 0.5 × 1 = 50,000 dollars
    expect(evaluated.result?.economics?.annualCashCents.base).toBe(5_000_000);
    expect(evaluated.result?.levers[0].terms.base[1].source).toBe(
      "literal:synthetic → evidence:ev-1",
    );
  });

  it("is incomplete when an input is a register row nobody can resolve", () => {
    const m = model();
    m.case.levers[0].attribution = { kind: "register", registerId: "V3" };
    const evaluated = evaluateValueModelCapture(serializeValueModel(m));
    expect(evaluated.complete).toBe(false);
    expect(evaluated.result?.status).toBe("blocked");
    const resolved = evaluateValueModelCapture(serializeValueModel(m), {
      resolver: () => ({
        value: 0.5,
        source: "register:V3",
        status: "confirmed",
      }),
    });
    expect(resolved.complete).toBe(true);
  });
});

describe("capture contract · P4 value plan behind moves_value_engine_v1", () => {
  const answers = (valuePlan: string) =>
    Object.fromEntries(
      getPhaseCaptureSections(4).map((section) => [
        section.key,
        section.key === VALUE_MODEL_SECTION_KEY
          ? valuePlan
          : `Answer for ${section.key}.`,
      ]),
    );
  const valuePlanStatus = (valuePlan: string, valueEngineV1?: boolean) =>
    evaluatePhaseCapture(4, answers(valuePlan), {
      valueEngineV1,
    }).sections.find((section) => section.key === VALUE_MODEL_SECTION_KEY);

  const blocked = (() => {
    const m = model();
    m.case.levers[0].attribution = { kind: "register", registerId: "V3" };
    return serializeValueModel(m);
  })();

  it("keeps the section key and its free-text definition", () => {
    const section = getPhaseCaptureSections(4).find(
      (s) => s.key === VALUE_MODEL_SECTION_KEY,
    );
    expect(section).toMatchObject({ required: true });
    expect(section?.structured).toBeUndefined();
  });

  it("with the flag off, any non-empty value completes, as today", () => {
    expect(valuePlanStatus(blocked)?.complete).toBe(true);
    expect(valuePlanStatus(blocked, false)?.complete).toBe(true);
    expect(valuePlanStatus("Free text.", false)?.complete).toBe(true);
    expect(valuePlanStatus("", false)?.complete).toBe(false);
  });

  it("with the flag on, a model completes only when the engine can evaluate it", () => {
    expect(valuePlanStatus(blocked, true)?.complete).toBe(false);
    expect(valuePlanStatus(serializeValueModel(model()), true)?.complete).toBe(
      true,
    );
    expect(valuePlanStatus("Free text.", true)?.complete).toBe(true);
    expect(valuePlanStatus("", true)?.complete).toBe(false);
    const evaluation = evaluatePhaseCapture(4, answers(blocked), {
      valueEngineV1: true,
    });
    expect(evaluation.missing).toContain("Value plan & business case");
  });
});
