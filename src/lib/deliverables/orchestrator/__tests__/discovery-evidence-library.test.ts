import {
  DISCOVERY_BLUEPRINT_CATALOG,
  SHARED_EVIDENCE_FAMILIES,
  composeDiscoveryBlueprint,
  composeEvidenceFamilies,
  discoveryCatalogSharedFamilyDrift,
  isEvidenceFamilyRef,
  sharedEvidenceFamilyDrift,
  type EvidenceFamily,
  type EvidenceFamilySpec,
  type InterviewRole,
} from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

const ROSTER: InterviewRole[] = [
  {
    role: "Operations lead",
    side: "business",
    objectives: "Confirm the baseline the Move is measured against",
    questions: ["Which number moves if this works?"],
  },
];

describe("shared evidence family library", () => {
  it("keys every entry by its own family id", () => {
    for (const [key, family] of Object.entries(SHARED_EVIDENCE_FAMILIES)) {
      expect(family.id).toBe(key);
    }
  });

  it("holds the nine canonical families the catalog composes against", () => {
    expect(Object.keys(SHARED_EVIDENCE_FAMILIES).sort()).toEqual([
      "change_adoption_owner",
      "cost_baseline",
      "current_state_process",
      "finance_baseline_value_plan",
      "it_systems_landscape",
      "kpi_baseline",
      "measurement_owner_cadence",
      "model_risk_responsible_ai_controls",
      "org_workforce",
    ]);
  });
});

describe("isEvidenceFamilyRef", () => {
  it("reads a spec carrying ref as a reference", () => {
    expect(isEvidenceFamilyRef({ ref: "cost_baseline" })).toBe(true);
  });

  it("reads a fully written family as not a reference", () => {
    const inline: EvidenceFamily = {
      id: "cost_baseline",
      label: "Cost baseline",
      grounds: "Business Case",
      required: true,
      likelySource: "Finance",
      format: "CSV",
    };
    expect(isEvidenceFamilyRef(inline)).toBe(false);
  });
});

describe("composeEvidenceFamilies", () => {
  it("resolves a bare reference to the canonical family verbatim", () => {
    const { families, errors } = composeEvidenceFamilies([
      { ref: "kpi_baseline" },
    ]);
    expect(errors).toEqual([]);
    expect(families).toEqual([SHARED_EVIDENCE_FAMILIES.kpi_baseline]);
  });

  it("restates only the overridden fields and keeps the rest canonical", () => {
    const canonical = SHARED_EVIDENCE_FAMILIES.finance_baseline_value_plan;
    const { families, errors } = composeEvidenceFamilies([
      {
        ref: "finance_baseline_value_plan",
        likelySource: "Finance / FP&A / Lending Operations",
      },
    ]);
    expect(errors).toEqual([]);
    expect(families).toHaveLength(1);
    expect(families[0].id).toBe("finance_baseline_value_plan");
    expect(families[0].likelySource).toBe(
      "Finance / FP&A / Lending Operations",
    );
    expect(families[0].label).toBe(canonical.label);
    expect(families[0].grounds).toBe(canonical.grounds);
    expect(families[0].required).toBe(canonical.required);
    expect(families[0].format).toBe(canonical.format);
  });

  it("lets a reference override required to false", () => {
    const canonical = SHARED_EVIDENCE_FAMILIES.kpi_baseline;
    expect(canonical.required).toBe(true);
    const { families } = composeEvidenceFamilies([
      { ref: "kpi_baseline", required: false },
    ]);
    expect(families[0].required).toBe(false);
  });

  it("ignores an override explicitly set to undefined", () => {
    const canonical = SHARED_EVIDENCE_FAMILIES.cost_baseline;
    const { families } = composeEvidenceFamilies([
      { ref: "cost_baseline", label: undefined },
    ]);
    expect(families[0].label).toBe(canonical.label);
  });

  it("passes a fully written family through unchanged", () => {
    const inline: EvidenceFamily = {
      id: "loan_document_intake",
      label: "Document intake quality",
      grounds: "Current-State Assessment",
      required: true,
      likelySource: "Lending Operations",
      format: "CSV",
    };
    const { families, errors } = composeEvidenceFamilies([inline]);
    expect(errors).toEqual([]);
    expect(families).toEqual([inline]);
  });

  it("keeps the referenced id when a configured source smuggles its own", () => {
    // A JSON/DB source is not type-checked: a reference arriving with a stray
    // `id` must still resolve to the family its `ref` names, or a deployer
    // could silently rename a shared family and split it in two.
    const smuggled = {
      ref: "cost_baseline",
      id: "renamed_cost_baseline",
      label: "Cost baseline, renamed",
    } as unknown as EvidenceFamilySpec;
    const { families, errors } = composeEvidenceFamilies([smuggled]);
    expect(errors).toEqual([]);
    expect(families).toHaveLength(1);
    expect(families[0].id).toBe("cost_baseline");
    expect(families[0].label).toBe("Cost baseline, renamed");
  });

  it("does not alias the library entry it resolved", () => {
    const { families } = composeEvidenceFamilies([{ ref: "org_workforce" }]);
    expect(families[0]).not.toBe(SHARED_EVIDENCE_FAMILIES.org_workforce);
  });

  it("names an unknown reference and keeps the specs around it in order", () => {
    const { families, errors } = composeEvidenceFamilies([
      { ref: "cost_baseline" },
      { ref: "no_such_family" },
      { ref: "kpi_baseline" },
    ]);
    expect(errors).toEqual([
      'evidenceFamilies[1]: unknown shared family "no_such_family"',
    ]);
    expect(families.map((family) => family.id)).toEqual([
      "cost_baseline",
      "kpi_baseline",
    ]);
  });

  it("rejects a second spec that resolves to an id already composed", () => {
    const { families, errors } = composeEvidenceFamilies([
      { ref: "cost_baseline" },
      {
        id: "cost_baseline",
        label: "Cost baseline, again",
        grounds: "Business Case",
        required: true,
        likelySource: "Finance",
        format: "CSV",
      },
    ]);
    expect(errors).toEqual([
      'evidenceFamilies[1]: duplicate family id "cost_baseline"',
    ]);
    expect(families).toHaveLength(1);
    expect(families[0].label).toBe(
      SHARED_EVIDENCE_FAMILIES.cost_baseline.label,
    );
  });

  it("resolves against a caller-supplied library instead of the shared one", () => {
    const own: Record<string, EvidenceFamily> = {
      berth_turn_times: {
        id: "berth_turn_times",
        label: "Berth turn times",
        grounds: "Current-State Assessment",
        required: true,
        likelySource: "Port operations",
        format: "CSV",
      },
    };
    const { families, errors } = composeEvidenceFamilies(
      [{ ref: "berth_turn_times" }],
      own,
    );
    expect(errors).toEqual([]);
    expect(families[0].label).toBe("Berth turn times");

    const shared = composeEvidenceFamilies([{ ref: "cost_baseline" }], own);
    expect(shared.errors).toEqual([
      'evidenceFamilies[0]: unknown shared family "cost_baseline"',
    ]);
  });
});

describe("composeDiscoveryBlueprint", () => {
  const composition = {
    blueprintId: "port_terminal_throughput",
    blueprintVersion: "2026-10-05",
    archetypeLabel: "Port terminal throughput",
    evidenceFamilies: [
      { ref: "current_state_process" },
      { ref: "kpi_baseline", likelySource: "Terminal operations" },
    ] as EvidenceFamilySpec[],
    interviewRoster: ROSTER,
  };

  it("composes an archetype a configured source expressed as references", () => {
    const { blueprint, errors } = composeDiscoveryBlueprint(composition);
    expect(errors).toEqual([]);
    expect(blueprint).not.toBeNull();
    expect(blueprint?.blueprintId).toBe("port_terminal_throughput");
    expect(blueprint?.blueprintVersion).toBe("2026-10-05");
    expect(blueprint?.archetypeLabel).toBe("Port terminal throughput");
    expect(blueprint?.interviewRoster).toEqual(ROSTER);
    expect(blueprint?.evidenceFamilies.map((family) => family.id)).toEqual([
      "current_state_process",
      "kpi_baseline",
    ]);
    expect(blueprint?.evidenceFamilies[1].likelySource).toBe(
      "Terminal operations",
    );
  });

  it("omits suggestionKeywords when the composition declared none", () => {
    const { blueprint } = composeDiscoveryBlueprint(composition);
    expect(blueprint).not.toBeNull();
    expect(blueprint && "suggestionKeywords" in blueprint).toBe(false);
  });

  it("carries suggestionKeywords through when declared", () => {
    const { blueprint } = composeDiscoveryBlueprint({
      ...composition,
      suggestionKeywords: ["berth", "terminal"],
    });
    expect(blueprint?.suggestionKeywords).toEqual(["berth", "terminal"]);
  });

  it("rejects the whole archetype when one reference does not resolve", () => {
    const { blueprint, errors } = composeDiscoveryBlueprint({
      ...composition,
      evidenceFamilies: [
        { ref: "current_state_process" },
        { ref: "no_such_family" },
      ],
    });
    expect(blueprint).toBeNull();
    expect(errors).toEqual([
      'evidenceFamilies[1]: unknown shared family "no_such_family"',
    ]);
  });

  it("rejects an archetype that requests no evidence at all", () => {
    const { blueprint, errors } = composeDiscoveryBlueprint({
      ...composition,
      evidenceFamilies: [],
    });
    expect(blueprint).toBeNull();
    expect(errors).toEqual([
      "evidenceFamilies: an archetype must request some evidence",
    ]);
  });
});

describe("sharedEvidenceFamilyDrift", () => {
  it("reports nothing when an archetype takes the canonical wording", () => {
    const drift = sharedEvidenceFamilyDrift({
      clean_archetype: {
        evidenceFamilies: [SHARED_EVIDENCE_FAMILIES.cost_baseline],
      },
    });
    expect(drift).toEqual([]);
  });

  it("names each field an archetype restates", () => {
    const drift = sharedEvidenceFamilyDrift({
      restating_archetype: {
        evidenceFamilies: [
          {
            ...SHARED_EVIDENCE_FAMILIES.cost_baseline,
            label: "Cost pools by service line",
            required: false,
          },
        ],
      },
    });
    expect(drift).toEqual([
      {
        blueprintId: "restating_archetype",
        familyId: "cost_baseline",
        restatedFields: ["label", "required"],
      },
    ]);
  });

  it("says nothing about a family the library does not define", () => {
    const drift = sharedEvidenceFamilyDrift({
      own_archetype: {
        evidenceFamilies: [
          {
            id: "berth_turn_times",
            label: "Berth turn times",
            grounds: "Current-State Assessment",
            required: true,
            likelySource: "Port operations",
            format: "CSV",
          },
        ],
      },
    });
    expect(drift).toEqual([]);
  });
});

describe("discoveryCatalogSharedFamilyDrift", () => {
  it("reads the built-in seed and reports only shared family ids", () => {
    const drift = discoveryCatalogSharedFamilyDrift();
    const sharedIds = new Set(Object.keys(SHARED_EVIDENCE_FAMILIES));
    const catalogIds = new Set(Object.keys(DISCOVERY_BLUEPRINT_CATALOG));
    expect(drift.length).toBeGreaterThan(0);
    for (const row of drift) {
      expect(sharedIds.has(row.familyId)).toBe(true);
      expect(catalogIds.has(row.blueprintId)).toBe(true);
      expect(row.restatedFields.length).toBeGreaterThan(0);
    }
  });

  it("pins the drift the seed carries today", () => {
    const drift = discoveryCatalogSharedFamilyDrift()
      .map(
        (row) =>
          `${row.blueprintId}/${row.familyId}: ${row.restatedFields.join(",")}`,
      )
      .sort();
    expect(drift).toEqual(SEED_DRIFT);
  });

  it("reports no drift for the general default archetype", () => {
    const drift = discoveryCatalogSharedFamilyDrift();
    expect(
      drift.filter((row) => row.blueprintId === "general_default"),
    ).toEqual([]);
  });
});

// The seed's shared families as they stand today: nine archetype/family pairs
// restate at least one field. Pinned so a wording change to either side of the
// pair is a deliberate edit to this list, not a silent divergence.
const SEED_DRIFT: string[] = [
  "ai_operations_customer_digital/it_systems_landscape: label,grounds,likelySource,format",
  "financial_services_commercial_lending_agent_assist/finance_baseline_value_plan: likelySource",
  "governed_data_foundation/change_adoption_owner: label,grounds,likelySource,format",
  "governed_data_foundation/finance_baseline_value_plan: label,grounds,likelySource",
  "governed_data_foundation/measurement_owner_cadence: label,grounds,likelySource,format",
  "governed_data_foundation/model_risk_responsible_ai_controls: label,grounds,likelySource,format",
  "healthcare_contact_center_agent_assist/change_adoption_owner: label,likelySource",
  "healthcare_contact_center_agent_assist/measurement_owner_cadence: grounds,likelySource",
  "healthcare_contact_center_agent_assist/model_risk_responsible_ai_controls: grounds,likelySource",
];

describe("a reference resolves only to a family the library holds", () => {
  // The library is an ordinary object, so these index an inherited
  // `Object.prototype` member: truthy, and not a family. Spreading one would
  // compose a family with `id: undefined` and put evidence nobody declared
  // into a client's request list. This is the resolver's own door — the
  // configured-source contract refuses the same names before it, but
  // `composeEvidenceFamilies` is exported and callable without that contract,
  // including with a caller-supplied library.
  for (const inherited of [
    "constructor",
    "__proto__",
    "toString",
    "hasOwnProperty",
    "valueOf",
  ]) {
    it(`treats a ref of \`${inherited}\` as an unknown family`, () => {
      const { families, errors } = composeEvidenceFamilies([
        { ref: inherited },
      ]);

      expect(errors).toEqual([
        `evidenceFamilies[0]: unknown shared family "${inherited}"`,
      ]);
      expect(families).toEqual([]);
    });
  }

  it("treats an inherited member of a caller-supplied library the same way", () => {
    const own: Record<string, EvidenceFamily> = {
      berth_turn_times: {
        id: "berth_turn_times",
        label: "Berth turn times",
        grounds: "Current-State Assessment",
        required: true,
        likelySource: "Port operations",
        format: "CSV",
      },
    };

    const { families, errors } = composeEvidenceFamilies(
      [{ ref: "constructor" }],
      own,
    );

    expect(errors).toEqual([
      'evidenceFamilies[0]: unknown shared family "constructor"',
    ]);
    expect(families).toEqual([]);
  });
});
