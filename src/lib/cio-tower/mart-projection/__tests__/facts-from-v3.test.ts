import {
  factsFromV3Budget,
  factsFromV3Programs,
  factsFromV3Benefits,
  projectV3ToFacts,
  programKeyFromCode,
  type CsvRow,
} from "../facts-from-v3";
import {
  readCanonicalIdentity,
  SOURCE_PRIORITY,
  type CioTowerTenantIdentity,
} from "../facts-schema";

const ID: CioTowerTenantIdentity = {
  tenantKey: "meridian-health",
  clientId: null,
  tenantName: "Healthcare Demo",
};

describe("factsFromV3Budget", () => {
  const rows: CsvRow[] = [
    {
      budget_row_level: "atomic_budget_fact",
      budget_amount_usd: "58000000",
      run_budget_usd: "58000000",
      change_budget_usd: "0",
    },
    {
      budget_row_level: "atomic_budget_fact",
      budget_amount_usd: "42000000",
      run_budget_usd: "30000000",
      change_budget_usd: "12000000",
    },
    {
      budget_row_level: "narrative_not_budget_fact",
      budget_amount_usd: "999",
      run_budget_usd: "999",
      change_budget_usd: "999",
    },
  ];

  it("sums only atomic budget facts into total/run/change, ignoring narrative rows", () => {
    const facts = factsFromV3Budget(rows, ID);
    const byMetric = new Map(
      facts.map((f) => [readCanonicalIdentity(f)!.metric_key, f.value_numeric]),
    );
    expect(byMetric.get("it_budget_total_usd")).toBe(100_000_000);
    expect(byMetric.get("it_budget_run_usd")).toBe(88_000_000);
    expect(byMetric.get("it_budget_change_usd")).toBe(12_000_000);
  });

  it("marks budget facts as v3_template priority so real extracts can win", () => {
    const facts = factsFromV3Budget(rows, ID);
    for (const f of facts) {
      expect(f.value_source).toBe("synthetic");
      expect(readCanonicalIdentity(f)!.source_priority).toBe(
        SOURCE_PRIORITY.v3_template,
      );
    }
  });

  it("emits nothing when there are no atomic budget rows (no fabricated zero)", () => {
    expect(
      factsFromV3Budget(
        [{ budget_row_level: "narrative_not_budget_fact" }],
        ID,
      ),
    ).toEqual([]);
  });
});

describe("factsFromV3Programs", () => {
  const rows: CsvRow[] = [
    {
      program_code: "PROG-DEV-PRODUCTIVITY",
      business_name: "Developer Productivity AI / SDLC Automation",
      approved_funding_usd: "2900000",
      planned_value_usd: "0",
      executive_owner: "VP Eng",
      record_id: "r1",
    },
    {
      program_code: "PROG-DATA",
      business_name: "Data Foundation",
      approved_funding_usd: "42500000",
      planned_value_usd: "0",
      record_id: "r2",
    },
    {
      program_code: "PROG-NOFUND",
      business_name: "Unfunded idea",
      approved_funding_usd: "0",
      record_id: "r3",
    },
    {
      program_code: "",
      business_name: "no code",
      approved_funding_usd: "500",
      record_id: "r4",
    },
  ];

  it("emits an approved-funding fact per funded program with a deterministic canonical key", () => {
    const facts = factsFromV3Programs(rows, ID);
    const funding = facts.filter(
      (f) =>
        readCanonicalIdentity(f)!.metric_key === "program_approved_funding_usd",
    );
    expect(funding).toHaveLength(2); // PROG-NOFUND and blank-code excluded
    const dev = funding.find(
      (f) => readCanonicalIdentity(f)!.program_code === "PROG-DEV-PRODUCTIVITY",
    );
    expect(dev?.value_numeric).toBe(2_900_000);
    expect(readCanonicalIdentity(dev!)!.canonical_program_key).toBe(
      programKeyFromCode("PROG-DEV-PRODUCTIVITY"),
    );
  });
});

describe("factsFromV3Benefits", () => {
  const rows: CsvRow[] = [
    {
      ai_program_id: "AIP-DEV",
      program_name: "Developer Productivity AI",
      promised_value_usd: "4500000",
      finance_validated_value_usd: "500000",
      finance_validation_status: "partial_validated",
      source_record_id: "b1",
    },
    {
      ai_program_id: "AIP-SNOW",
      program_name: "ServiceNow AI",
      promised_value_usd: "6000000",
      finance_validated_value_usd: "0",
      finance_validation_status: "not_validated",
      source_record_id: "b2",
    },
  ];

  it("emits promised + finance-validated facts, keyed to the mapped program code", () => {
    const facts = factsFromV3Benefits(rows, ID, {
      "AIP-DEV": "PROG-DEV-PRODUCTIVITY",
    });
    const dev = facts.filter(
      (f) => readCanonicalIdentity(f)!.program_code === "PROG-DEV-PRODUCTIVITY",
    );
    expect(dev.map((f) => readCanonicalIdentity(f)!.metric_key).sort()).toEqual(
      ["program_finance_validated_value_usd", "program_promised_value_usd"],
    );
  });

  it("never emits a finance-validated fact when status is not_validated", () => {
    const facts = factsFromV3Benefits(rows, ID);
    const snow = facts.filter(
      (f) => readCanonicalIdentity(f)!.program_code === "AIP-SNOW",
    );
    expect(
      snow.some(
        (f) =>
          readCanonicalIdentity(f)!.metric_key ===
          "program_finance_validated_value_usd",
      ),
    ).toBe(false);
  });
});

describe("projectV3ToFacts", () => {
  it("combines budget + programs + benefits into one flat array", () => {
    const facts = projectV3ToFacts(
      {
        budget: [
          {
            budget_row_level: "atomic_budget_fact",
            budget_amount_usd: "100",
            run_budget_usd: "60",
            change_budget_usd: "40",
          },
        ],
        programs: [
          {
            program_code: "P1",
            business_name: "P1",
            approved_funding_usd: "1000",
            record_id: "r",
          },
        ],
        benefits: [
          {
            ai_program_id: "P1",
            program_name: "P1",
            promised_value_usd: "500",
            source_record_id: "b",
          },
        ],
      },
      ID,
    );
    // 3 budget + 1 funding + 1 benefit-promised
    expect(facts.length).toBe(5);
  });
});
