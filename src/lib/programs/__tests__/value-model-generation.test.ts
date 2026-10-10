import { loadValueGenerationForMove } from "@/lib/programs/value-model-generation";
import { phaseCaptureModuleKey } from "@/lib/programs/phase-capture-contract";
import type { CostBasis } from "@/lib/programs/value-engine/cost-basis";
import { emptyRomEstimate, romInputsFingerprint, serializeRomEstimate } from "@/lib/programs/rom-estimate";

const getModuleState = jest.fn();
const listAssumptions = jest.fn();
const loadCostBasis = jest.fn();

jest.mock("@/lib/programs/queries", () => ({
  getModuleState: (...args: unknown[]) => getModuleState(...args),
}));
jest.mock("@/lib/programs/assumption-register/store", () => ({
  listAssumptions: (...args: unknown[]) => listAssumptions(...args),
}));
jest.mock("@/lib/programs/value-engine/cost-basis", () => ({
  ...jest.requireActual("@/lib/programs/value-engine/cost-basis"),
  loadCostBasis: (...args: unknown[]) => loadCostBasis(...args),
}));

const lit = (value: number) => ({ kind: "literal", value, source: "fictional workshop" });
function capture(deliveryModel?: "internal" | "vendor", register = false) {
  return JSON.stringify({
    kind: "value_model",
    version: 1,
    ...(deliveryModel ? { deliveryModel } : {}),
    case: {
      horizonYears: 2,
      discountRate: lit(0.08),
      cost: { kind: "estimate", baseCents: 100_000 },
      levers: [{
        id: "L1",
        name: "Fictional cost reduction",
        conversion: "cost_reduction",
        driver: {
          name: "spend reduction",
          unit: "share",
          direction: "increase",
          baseline: lit(0),
          target: register ? { kind: "register", registerId: "V3" } : lit(0.1),
        },
        terms: [
          { role: "base", label: "fictional spend", ref: lit(10_000) },
          { role: "driver_delta" },
        ],
        attribution: lit(0.5),
        probability: lit(1),
        timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
      }],
    },
  });
}

const COST: CostBasis = {
  status: "resolved",
  basis: "estimate_model",
  source: "estimate_model:internal",
  deliveryModel: "internal",
  cents: { low: 100_000, base: 100_000, high: 100_000 },
  planningBenchmark: null,
};

function modules(value: string) {
  return [
    { moduleKey: phaseCaptureModuleKey(4, "value_plan"), state: { value } },
    { moduleKey: phaseCaptureModuleKey(4, "estimates_capacity"), state: { value: "reviewed estimate" } },
  ];
}

function approvedRomCapture(stale = false, version = 1): string {
  const record = emptyRomEstimate();
  record.approval = {
    version,
    approvedBy: "fictional reviewer",
    approvedAt: "2026-01-01T00:00:00.000Z",
    inputsFingerprint: stale ? "stale" : romInputsFingerprint(record),
    unitHours: {},
    releases: [],
    foundation: null,
    combined: { hours: 20, weeks: 1, lowCents: 80_000, planCents: 100_000, highCents: 120_000 },
  };
  return serializeRomEstimate(record);
}

describe("value-model generation read", () => {
  beforeEach(() => {
    getModuleState.mockReset();
    listAssumptions.mockReset().mockResolvedValue([]);
    loadCostBasis.mockReset().mockResolvedValue(COST);
  });

  it("leaves free-text captures on the legacy path without reading cost or register", async () => {
    getModuleState.mockResolvedValue(modules("A qualitative value plan."));
    expect(await loadValueGenerationForMove({} as never, "move-1")).toEqual({ kind: "legacy" });
    expect(loadCostBasis).not.toHaveBeenCalled();
    expect(listAssumptions).not.toHaveBeenCalled();
  });

  it("requires an explicit internal/vendor funding choice", async () => {
    getModuleState.mockResolvedValue(modules(capture()));
    loadCostBasis.mockResolvedValue({
      status: "blocked",
      reason: "estimate_delivery_model_unselected",
      detail: "Choose internal or vendor delivery.",
      planningBenchmark: null,
    });
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(loadCostBasis).toHaveBeenCalledWith({
      estimateCapture: "reviewed estimate",
      deliveryModel: null,
    });
    expect(read.kind).toBe("review_required");
    expect(read.kind === "review_required" && read.detail).toContain("Choose internal or vendor");
  });

  it("evaluates a selected cost basis into a ready prompt snapshot", async () => {
    getModuleState.mockResolvedValue(modules(capture("internal")));
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(read.kind).toBe("ready");
    expect(read.kind === "ready" && read.snapshot.prompt).toContain("VALUE ENGINE RESULT");
    expect(loadCostBasis).toHaveBeenCalledWith({
      estimateCapture: "reviewed estimate",
      deliveryModel: "internal",
    });
  });

  it("uses the current approved P3 ROM ahead of the P4 estimate", async () => {
    getModuleState.mockResolvedValue([
      ...modules(capture("internal")),
      { moduleKey: phaseCaptureModuleKey(3, "rom_estimate"), state: { value: approvedRomCapture() } },
    ]);
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(read.kind).toBe("ready");
    const call = loadCostBasis.mock.calls[0][0];
    expect(await call.loadApprovedRomSnapshot()).toMatchObject({
      lowCents: 80_000, baseCents: 100_000, highCents: 120_000,
    });
  });

  it("refuses a stale P3 ROM instead of silently substituting the P4 estimate", async () => {
    getModuleState.mockResolvedValue([
      ...modules(capture("internal")),
      { moduleKey: phaseCaptureModuleKey(3, "rom_estimate"), state: { value: approvedRomCapture(true) } },
    ]);
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(read.kind).toBe("review_required");
    expect(read.kind === "review_required" && read.detail).toContain("stale");
    expect(loadCostBasis).not.toHaveBeenCalled();
  });

  it("refuses a corrupt nonempty P3 ROM record rather than falling back to an estimate", async () => {
    getModuleState.mockResolvedValue([
      ...modules(capture("internal")),
      { moduleKey: phaseCaptureModuleKey(3, "rom_estimate"), state: { value: "corrupt ROM record" } },
    ]);
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(read.kind).toBe("review_required");
    expect(read.kind === "review_required" && read.detail).toContain("cannot be read");
    expect(loadCostBasis).not.toHaveBeenCalled();
  });

  it("changes the queued basis hash when a saved capture changes", async () => {
    getModuleState.mockResolvedValueOnce(modules(capture("internal"))).mockResolvedValueOnce([
      { moduleKey: phaseCaptureModuleKey(4, "value_plan"), state: { value: capture("internal") } },
      { moduleKey: phaseCaptureModuleKey(4, "estimates_capacity"), state: { value: "changed estimate" } },
    ]);
    const first = await loadValueGenerationForMove({} as never, "move-1");
    const second = await loadValueGenerationForMove({} as never, "move-1");
    expect(first.kind).toBe("ready");
    expect(second.kind).toBe("ready");
    if (first.kind === "ready" && second.kind === "ready") {
      expect(first.snapshot.inputHash).not.toBe(second.snapshot.inputHash);
    }
  });

  it("changes the queued basis hash when the approved ROM snapshot changes", async () => {
    const withRom = (version: number) => [
      ...modules(capture("internal")),
      { moduleKey: phaseCaptureModuleKey(3, "rom_estimate"), state: { value: approvedRomCapture(false, version) } },
    ];
    getModuleState.mockResolvedValueOnce(withRom(1)).mockResolvedValueOnce(withRom(2));
    const first = await loadValueGenerationForMove({} as never, "move-1");
    const second = await loadValueGenerationForMove({} as never, "move-1");
    expect(first.kind).toBe("ready");
    expect(second.kind).toBe("ready");
    if (first.kind === "ready" && second.kind === "ready") {
      expect(first.snapshot.inputHash).not.toBe(second.snapshot.inputHash);
    }
  });

  it("names an unresolved register row and its lever before any model call", async () => {
    getModuleState.mockResolvedValue(modules(capture("internal", true)));
    const read = await loadValueGenerationForMove({} as never, "move-1");
    expect(read.kind).toBe("review_required");
    expect(read.kind === "review_required" && read.detail).toContain("Blocked levers: L1");
    expect(read.kind === "review_required" && read.detail).toContain("[A:V3]");
  });
});
