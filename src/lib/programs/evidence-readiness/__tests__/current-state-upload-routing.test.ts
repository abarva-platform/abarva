import {
  currentStateUploadDeclarationState,
  declarableCurrentStateFamilies,
  inferCurrentStateFamilies,
  resolveCurrentStateUploadFamilies,
} from "../current-state-upload-routing";
import { DISCOVERY_BLUEPRINT_CATALOG } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

type Family = {
  key: string;
  label: string;
  documentFamily?: boolean | string | null;
};

const OPEN: Family[] = [
  {
    key: "data_governance_ownership",
    label: "Data governance ownership",
    documentFamily: "data_governance_ownership",
  },
  {
    key: "master_identity_resolution",
    label: "Master / entity identity resolution",
    documentFamily: "master_identity_resolution",
  },
  {
    key: "finance_baseline_value_plan",
    label: "Finance baseline and value plan",
    documentFamily: "finance_baseline_value_plan",
  },
];

describe("declarableCurrentStateFamilies", () => {
  it("keeps the readiness map's order and drops a repeated family", () => {
    expect(
      declarableCurrentStateFamilies([
        ...OPEN,
        { key: "data_governance_ownership", label: "Duplicate" },
      ]).map((option) => option.key),
    ).toEqual([
      "data_governance_ownership",
      "master_identity_resolution",
      "finance_baseline_value_plan",
    ]);
  });

  it("skips a family with no key, which could not be declared anyway", () => {
    expect(
      declarableCurrentStateFamilies([{ key: "", label: "Unnamed" }, ...OPEN]),
    ).toHaveLength(3);
  });
});

describe("currentStateUploadDeclarationState", () => {
  // The state the P2 readiness panel was in: a readiness table naming three
  // open families, and a control beside it that rendered no picker at all.
  it("names every open family when the surface offers no picker", () => {
    expect(
      currentStateUploadDeclarationState({
        openFamilies: OPEN,
        offeredFamilyKeys: [],
      }).undeclarableOpenFamilyKeys,
    ).toEqual([
      "data_governance_ownership",
      "master_identity_resolution",
      "finance_baseline_value_plan",
    ]);
  });

  it("reports no dead end when the surface offers all of them", () => {
    const state = currentStateUploadDeclarationState({ openFamilies: OPEN });
    expect(state.options).toHaveLength(3);
    expect(state.undeclarableOpenFamilyKeys).toEqual([]);
  });

  // Parameterised on what the surface renders rather than derived from the
  // same list it checks, so the detector can answer in both directions. A
  // partial picker is the realistic regression: one family added to the
  // readiness map and not to the control.
  it("names only the open families a partial picker leaves out", () => {
    expect(
      currentStateUploadDeclarationState({
        openFamilies: OPEN,
        offeredFamilyKeys: ["data_governance_ownership"],
      }).undeclarableOpenFamilyKeys,
    ).toEqual(["master_identity_resolution", "finance_baseline_value_plan"]);
  });
});

describe("resolveCurrentStateUploadFamilies", () => {
  it("files a declared file under exactly the declared family", () => {
    const routing = resolveCurrentStateUploadFamilies({
      fileName: "finance-baseline.xlsx",
      declaredFamilyKey: "master_identity_resolution",
      openFamilies: OPEN,
    });
    expect(routing.basis).toBe("declared");
    expect(routing.families.map((family) => family.key)).toEqual([
      "master_identity_resolution",
    ]);
    expect(routing.refusal).toBeNull();
  });

  // The precedence claim, stated against a filename inference would place
  // elsewhere: if the declaration did not win, this file would land under
  // finance_baseline_value_plan.
  it("overrides a filename the heuristic would have placed elsewhere", () => {
    expect(
      inferCurrentStateFamilies("finance-baseline.xlsx", OPEN).map(
        (family) => family.key,
      ),
    ).toEqual(["finance_baseline_value_plan"]);
    expect(
      resolveCurrentStateUploadFamilies({
        fileName: "finance-baseline.xlsx",
        declaredFamilyKey: "master_identity_resolution",
        openFamilies: OPEN,
      }).families.map((family) => family.key),
    ).toEqual(["master_identity_resolution"]);
  });

  it("refuses a declaration naming a family that is not open, and does not re-infer", () => {
    const routing = resolveCurrentStateUploadFamilies({
      fileName: "finance-baseline.xlsx",
      declaredFamilyKey: "already_committed_family",
      openFamilies: OPEN,
    });
    expect(routing.basis).toBeNull();
    expect(routing.families).toEqual([]);
    expect(routing.refusal).toContain("already_committed_family");
    expect(routing.refusal).toContain("not an open evidence family");
  });

  it("falls back to the filename when nothing was declared", () => {
    const routing = resolveCurrentStateUploadFamilies({
      fileName: "finance-baseline.xlsx",
      openFamilies: OPEN,
    });
    expect(routing.basis).toBe("inferred");
    expect(routing.families.map((family) => family.key)).toEqual([
      "finance_baseline_value_plan",
    ]);
  });

  it("treats a blank declaration as no declaration", () => {
    expect(
      resolveCurrentStateUploadFamilies({
        fileName: "finance-baseline.xlsx",
        declaredFamilyKey: "   ",
        openFamilies: OPEN,
      }).basis,
    ).toBe("inferred");
  });

  it("refuses an undeclared file the filename places nowhere, and says to declare it", () => {
    const routing = resolveCurrentStateUploadFamilies({
      fileName: "Q3 export.xlsx",
      openFamilies: OPEN,
    });
    expect(routing.basis).toBeNull();
    expect(routing.families).toEqual([]);
    expect(routing.refusal).toContain("Declare the family this file covers");
  });

  it("places nothing when the readiness map has no open family left", () => {
    expect(
      resolveCurrentStateUploadFamilies({
        fileName: "finance-baseline.xlsx",
        openFamilies: [],
      }),
    ).toMatchObject({ basis: null, families: [] });
  });
});

// The measurement that makes the declaration the primary path rather than a
// convenience, taken against a real archetype's own evidence families.
describe("the filename heuristic over a real archetype's families", () => {
  const blueprint = DISCOVERY_BLUEPRINT_CATALOG["governed_data_foundation"];
  const families: Family[] = blueprint.evidenceFamilies.map((family) => ({
    key: family.id,
    label: family.label,
    documentFamily: family.id,
  }));

  // Names a practitioner would actually give these artifacts. The ones that
  // reach nothing are named here as literals rather than counted off the
  // catalog, so a catalog edit cannot quietly restate the claim.
  const UNPLACEABLE = [
    "mdm-golden-record.csv",
    "golden-record-dedupe.xlsx",
    "steering-deck-oct.pptx",
    "Q3 export.xlsx",
  ];

  it.each(UNPLACEABLE)(
    "refuses %s outright when the uploader cannot declare a family",
    (fileName) => {
      expect(inferCurrentStateFamilies(fileName, families)).toEqual([]);
      expect(
        resolveCurrentStateUploadFamilies({ fileName, openFamilies: families }),
      ).toMatchObject({ basis: null, families: [] });
    },
  );

  it.each(UNPLACEABLE)("places %s once it is declared", (fileName) => {
    const routing = resolveCurrentStateUploadFamilies({
      fileName,
      declaredFamilyKey: "master_identity_resolution",
      openFamilies: families,
    });
    expect(routing.basis).toBe("declared");
    expect(routing.families.map((family) => family.key)).toEqual([
      "master_identity_resolution",
    ]);
  });

  // The other failure mode: one file becomes a review item under every family
  // whose key or label shares a word with the name.
  it("fans one undeclared file out across several families, and a declared one to a single family", () => {
    const fannedOut = inferCurrentStateFamilies(
      "data-governance-ownership.xlsx",
      families,
    );
    expect(fannedOut.length).toBeGreaterThan(1);
    expect(fannedOut.map((family) => family.key)).toContain(
      "privacy_security_controls",
    );
    expect(
      resolveCurrentStateUploadFamilies({
        fileName: "data-governance-ownership.xlsx",
        declaredFamilyKey: "data_governance_ownership",
        openFamilies: families,
      }).families,
    ).toHaveLength(1);
  });

  it("can declare every family the readiness map lists as open", () => {
    expect(
      currentStateUploadDeclarationState({ openFamilies: families })
        .undeclarableOpenFamilyKeys,
    ).toEqual([]);
  });
});
