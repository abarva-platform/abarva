import { contractPurposeSummary } from "../WorkspaceExecutiveShell";
import type {
  SourceContract360Row,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";

/**
 * The defect this guards: `contractPurposeSummary` and the governed tab
 * narrative are written from the same reviewed contract intelligence, so on the
 * Story tab they resolve to the same opening paragraph. Rendering both printed
 * it twice and pushed the figures below the fold.
 *
 * The first attempt compared the two with `includes`, which missed the repeat —
 * they share their opening sentences and then diverge, so neither string
 * contains the other. That is why this asserts on the shared opening.
 */

const contract = {
  contract_id: "MER-TEST-DUP-001",
  contract_name: "Test Consumption Commitment",
  vendor_name: "Test Vendor, Inc.",
  vendor_category: "cloud_consumption_commit",
  purpose_summary:
    "Test-on-AWS consumption commitment for lakehouse, SQL warehouse, model " +
    "serving and pilot analytics workloads. The agreement buys committed " +
    "platform capacity ahead of current consumption.",
  annual_value: 1_900_000,
  end_date: "2030-10-14",
} as unknown as SourceContract360Row;

const coverage = {
  contract_id: "MER-TEST-DUP-001",
  contract_archetype: "cloud_consumption_commit",
  spend_rows: 12,
  scope_rows: 4,
} as unknown as SourceContractEvidenceCoverageRow;

/** Mirrors the rendering guard: a shared normalised opening means a repeat. */
function sharesOpening(a: string, b: string, sharedWords = 12): boolean {
  const words = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  const left = words(a);
  const right = words(b);
  if (left.length < sharedWords || right.length < sharedWords) {
    return left.join(" ") === right.join(" ");
  }
  return (
    left.slice(0, sharedWords).join(" ") ===
    right.slice(0, sharedWords).join(" ")
  );
}

describe("Story purpose and narrative overlap", () => {
  it("detects a repeat that diverges after a shared opening", () => {
    const purpose = contractPurposeSummary(contract, coverage, []);

    // The governed headline opens with the same sentences, then continues
    // differently — the exact shape seen live.
    const headline = `${contract.purpose_summary} Source treats it as a renegotiation and ramp-timing case.`;

    expect(purpose.body.length).toBeGreaterThan(0);
    expect(sharesOpening(purpose.body, headline)).toBe(true);
    // The reason the containment test failed: neither contains the other.
    expect(purpose.body.includes(headline)).toBe(false);
    expect(headline.includes(purpose.body)).toBe(false);
  });

  it("does not treat genuinely different prose as a repeat", () => {
    const purpose = contractPurposeSummary(contract, coverage, []);
    const additive =
      "The governed financial fields show committed platform capacity and " +
      "support materially ahead of observed usage.";

    expect(sharesOpening(purpose.body, additive)).toBe(false);
  });

  it("compares whole strings when either is shorter than the shared window", () => {
    expect(sharesOpening("Short text here", "Short text here")).toBe(true);
    expect(sharesOpening("Short text here", "Different short text")).toBe(
      false,
    );
  });
});
