import {
  runTransformationGates,
  resolveBusinessCaseMode,
  scanMachinery,
  type GateInput,
} from "../transformation-gates";
import { getDeliverableProfile } from "@/lib/deliverables/profiles/registry";

const charter = getDeliverableProfile("charter");

function base(overrides: Partial<GateInput> = {}): GateInput {
  return {
    profile: charter,
    narrativeText: "We recommend approving a focused discovery gate.",
    renderedExhibits: [
      "decision_box",
      "known_unknown_table",
      "proceed_hold_stop_gate",
      "open_inputs_required",
    ],
    ...overrides,
  };
}

describe("transformation gates (W1)", () => {
  it("passes a clean, judgment-led charter", () => {
    const r = runTransformationGates(base());
    expect(r.passed).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it("blocks machinery vocabulary leaking into the client narrative", () => {
    const r = scanMachinery(
      base({
        narrativeText:
          "Per the P2 source register, the substrate context rows indicate the initiative is not authorized to build.",
      }),
    );
    expect(r).toHaveLength(1);
    expect(r[0].severity).toBe("block");
    // catches phase label + multiple machinery terms
    expect(r[0].detail?.join(" ")).toMatch(/source register|substrate|context rows/);
  });

  it("does NOT flag phase-like tokens that are not phase labels (P10, API1)", () => {
    const r = scanMachinery(
      base({ narrativeText: "The P10 ledger and API1 endpoint are in scope." }),
    );
    expect(r).toHaveLength(0);
  });

  it("does NOT flag a phase label glued into a hyphenated id (regression 2026-07-08: FIN-BASE-P2)", () => {
    // The business_case prompt hint instructs the model to cite a finance baseline
    // id; a hyphenated compound like "FIN-BASE-P2" must not collide with the bare
    // phase-label ban — only a standalone "P2" (e.g. "as discussed in P2") should.
    const r = scanMachinery(
      base({
        narrativeText:
          "Every number in this memo is traceable to the FIN-BASE-P2 baseline approved by finance.",
      }),
    );
    expect(r).toHaveLength(0);
  });

  it("still flags a standalone phase label even next to punctuation", () => {
    const r = scanMachinery(
      base({ narrativeText: "As discussed in P2, the scope was reduced." }),
    );
    expect(r).toHaveLength(1);
  });

  it("blocks scattered missing-input placeholders, demanding one table", () => {
    const r = runTransformationGates(
      base({
        narrativeText:
          "Volume [CLIENT TO COMPLETE: ops]. Cost [CLIENT TO COMPLETE: finance]. Cycle time TBC. Discrepancy rate to be confirmed.",
      }),
    );
    expect(r.passed).toBe(false);
    expect(r.findings.some((f) => f.gate === "open_inputs")).toBe(true);
  });

  it("blocks generic consulting filler (the 'so what' test)", () => {
    const r = runTransformationGates(
      base({
        narrativeText:
          "It is important to note that in today's fast-paced digital world we must leverage best-in-class world-class holistic synergies.",
      }),
    );
    expect(r.findings.some((f) => f.gate === "filler")).toBe(true);
  });

  it("blocks a source register placed in the client body", () => {
    const r = runTransformationGates(base({ sourceRegisterInBody: true }));
    expect(r.findings.some((f) => f.gate === "evidence_place")).toBe(true);
  });

  it("blocks missing required exhibits", () => {
    const r = runTransformationGates(base({ renderedExhibits: ["decision_box"] }));
    expect(r.findings.some((f) => f.gate === "visual_complete")).toBe(true);
    expect(
      r.findings.find((f) => f.gate === "visual_complete")?.detail,
    ).toContain("open_inputs_required");
  });

  it("exempts the internal working binder from machinery/evidence gates", () => {
    const fin = getDeliverableProfile("financial_model"); // clientFacing: false
    const r = runTransformationGates({
      profile: fin,
      narrativeText: "Source register: F16, O04. Context rows per the substrate.",
      renderedExhibits: ["measurement_table"],
      sourceRegisterInBody: true,
    });
    expect(r.findings.some((f) => f.gate === "machinery")).toBe(false);
    expect(r.findings.some((f) => f.gate === "evidence_place")).toBe(false);
  });

  describe("business-case mode resolution", () => {
    it("downgrades to a readiness memo when baseline/cost/benefit are missing", () => {
      expect(
        resolveBusinessCaseMode({
          hasBaseline: false,
          hasCost: false,
          hasBenefit: false,
          hasSensitivity: false,
        }),
      ).toBe("readiness_memo");
    });

    it("is an investment thesis when value is directional", () => {
      expect(
        resolveBusinessCaseMode({
          hasBaseline: false,
          hasCost: true,
          hasBenefit: true,
          hasSensitivity: false,
        }),
      ).toBe("investment_thesis");
    });

    it("is a full business case only with finance-grade inputs", () => {
      expect(
        resolveBusinessCaseMode({
          hasBaseline: true,
          hasCost: true,
          hasBenefit: true,
          hasSensitivity: true,
        }),
      ).toBe("full_business_case");
    });

    it("blocks calling it a Business Case without the data", () => {
      const bc = getDeliverableProfile("business_case");
      const r = runTransformationGates({
        profile: bc,
        narrativeText:
          "Business Case for AI Trade Finance. We recommend funding the program.",
        renderedExhibits: ["value_tree", "decision_box", "open_inputs_required"],
        financialInputs: {
          hasBaseline: false,
          hasCost: false,
          hasBenefit: false,
          hasSensitivity: false,
        },
      });
      expect(r.findings.some((f) => f.gate === "business_mode")).toBe(true);
      expect(r.businessCaseMode).toBe("readiness_memo");
    });

    it("allows an explicitly downgraded Business Case Readiness Memo", () => {
      const bc = getDeliverableProfile("business_case");
      const r = runTransformationGates({
        profile: bc,
        narrativeText:
          "Business Case Readiness Memo for AI Trade Finance. We recommend closing finance-grade inputs before funding the program.",
        renderedExhibits: ["value_tree", "decision_box", "open_inputs_required"],
        financialInputs: {
          hasBaseline: false,
          hasCost: false,
          hasBenefit: false,
          hasSensitivity: false,
        },
      });
      expect(r.findings.some((f) => f.gate === "business_mode")).toBe(false);
      expect(r.businessCaseMode).toBe("readiness_memo");
    });
  });
});
