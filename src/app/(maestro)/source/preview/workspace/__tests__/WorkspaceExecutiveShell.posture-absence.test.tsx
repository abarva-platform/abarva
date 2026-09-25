/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { EvidencePage } from "../WorkspaceExecutiveShell";
import type {
  SourceContract360Row,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";
import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

/*
 * U-522 — the "Contract-depth posture" panel must not print the digit 0 for a
 * lane nothing was loaded for.
 *
 * The item filed the mechanism as a nullable lane field defeated by `?? 0`
 * inside the sum. That mechanism is unreachable and the tests below do not
 * assert it: `SourceContractEvidenceCoverageRow` declares `spend_rows`,
 * `performance_rows` and `document_page_text_rows` as `readonly number`, and
 * the only producer of `portfolio.impact.evidenceCoverage` COALESCEs each of
 * them to 0 in SQL. A loaded lane always arrives as a number.
 *
 * The reachable absence is the absence of a coverage ROW, not a null field on
 * one: the impact read yields `evidenceCoverage: []` when it returns nothing
 * or throws, while the contract register is filled by a separate read. So the
 * register can hold contracts with nothing loaded to look in — and that is the
 * case these tests drive.
 *
 * Both directions matter and are asserted per tile, because a single
 * absent-lane case passes against a build that prints 0 for both, and a
 * panel-wide assertion is met by whichever sibling tile happens to move.
 */

const LANE_TILES = [
  { label: "Spend rows", field: "spend_rows" },
  { label: "Performance rows", field: "performance_rows" },
  { label: "Document page text", field: "document_page_text_rows" },
] as const;

function coverageRow(
  overrides: Partial<SourceContractEvidenceCoverageRow>,
): SourceContractEvidenceCoverageRow {
  return {
    tenant_key: "skyharbor_global",
    contract_id: "CONTRACT-001",
    vendor_ref: "VENDOR-001",
    vendor_name: "Synthetic Vendor",
    contract_name: "Synthetic platform agreement",
    spend_rows: 0,
    actual_spend_usd: 0,
    committed_spend_usd: 0,
    performance_rows: 0,
    breach_rows: 0,
    credit_calculated_usd: 0,
    credit_claimed_usd: 0,
    credit_recovered_usd: 0,
    unclaimed_credit_usd: 0,
    opportunity_rows: 0,
    candidate_amount_usd: 0,
    finance_confirmation_required_rows: 0,
    opportunities_with_evidence: 0,
    scope_rows: 0,
    critical_scope_rows: 0,
    document_page_text_rows: 0,
    change_order_rows: 0,
    coverage_state: "not_loaded",
    blocker_if_missing: null,
    evidence_basis_json: null,
    load_run_id: null,
    ...overrides,
  } as SourceContractEvidenceCoverageRow;
}

function portfolioWithCoverage(
  coverage: readonly SourceContractEvidenceCoverageRow[],
): SourceWorkspacePortfolioData {
  const contract = {
    tenant_key: "skyharbor_global",
    contract_id: "CONTRACT-001",
    vendor_ref: "VENDOR-001",
    vendor_name: "Synthetic Vendor",
    vendor_category: "technology",
    contract_archetype: "cloud_consumption_commit",
    contract_name: "Synthetic platform agreement",
  } as unknown as SourceContract360Row;

  return {
    contracts: [contract],
    vendors: [],
    applicationScope: [],
    initiativeDependencies: [],
    impact: {
      evidenceCoverage: coverage,
      actionCandidates: [],
      claimCards: [],
      vendorPositions: [],
      storyline: [],
      avaGroundingBundles: [],
    },
    reads: {
      contracts: "available",
      vendors: "missing",
      applicationScope: "missing",
      initiativeDependencies: "missing",
    },
  } as unknown as SourceWorkspacePortfolioData;
}

function postureTileText(label: string): string {
  const labelNode = screen.getAllByText(label).find((node) => {
    const parent = node.parentElement;
    return Boolean(parent?.classList.contains("sw-v2-fact"));
  });
  if (!labelNode?.parentElement) {
    throw new Error(`No "Contract-depth posture" tile labelled "${label}"`);
  }
  return labelNode.parentElement.querySelector("b")?.textContent ?? "";
}

function renderEvidencePage(
  coverage: readonly SourceContractEvidenceCoverageRow[],
) {
  render(
    <EvidencePage
      portfolio={portfolioWithCoverage(coverage)}
      showLineage={false}
      onToggleLineage={() => {}}
    />,
  );
}

describe("Contract-depth posture — a never-loaded lane is not the digit 0", () => {
  describe.each(LANE_TILES)("$label", ({ label, field }) => {
    it("renders a loaded lane that genuinely holds nothing as 0", () => {
      renderEvidencePage([coverageRow({ [field]: 0 })]);
      expect(postureTileText(label)).toBe("0");
    });

    it("renders its loaded total when the lane holds rows", () => {
      renderEvidencePage([coverageRow({ [field]: 7 })]);
      expect(postureTileText(label)).toBe("7");
    });

    it("does not render 0 when no coverage row was loaded at all", () => {
      renderEvidencePage([]);
      expect(postureTileText(label)).not.toBe("0");
    });

    it("renders the absence in the vocabulary the matrix already uses", () => {
      renderEvidencePage([]);
      expect(postureTileText(label)).toBe("—");
    });
  });

  it("renders every posture lane tile as a dash, not a zero, when nothing was loaded", () => {
    renderEvidencePage([]);
    expect(
      LANE_TILES.map(({ label }) => [label, postureTileText(label)]),
    ).toEqual([
      ["Spend rows", "\u2014"],
      ["Performance rows", "\u2014"],
      ["Document page text", "\u2014"],
    ]);
  });
});

/*
 * The remainder of U-522's acceptance (1) is sent to the sibling `state`
 * computation in the "Evidence lanes" table, which carries the same `?? 0` and
 * decides a word rather than a digit. It reports clean, and these cases pin
 * that rather than leaving it as prose: `.some()` over an empty coverage array
 * already returns "missing", and the table already renders a Status column
 * beside the count — which is precisely what the posture panel lacked. No
 * change was made there, so this suite locks the behaviour the audit relied on.
 */
describe("Evidence lanes table — absence is already carried by the Status column", () => {
  function laneRowStatus(name: string): string {
    const nameNode = screen
      .getAllByText(name)
      .find((node) =>
        node.parentElement?.parentElement?.classList.contains(
          "sw-v2-evidence-row",
        ),
      );
    const row = nameNode?.parentElement?.parentElement;
    if (!row) throw new Error(`No evidence-lane row named "${name}"`);
    return row.querySelectorAll("span")[3]?.textContent ?? "";
  }

  it("reports missing when no coverage row was loaded at all", () => {
    renderEvidencePage([]);
    expect(laneRowStatus("Document page text")).toBe("missing");
    expect(laneRowStatus("Change orders")).toBe("missing");
  });

  it("reports missing when the lane is loaded and genuinely empty", () => {
    renderEvidencePage([coverageRow({ document_page_text_rows: 0 })]);
    expect(laneRowStatus("Document page text")).toBe("missing");
  });

  it("reports available when the lane holds rows", () => {
    renderEvidencePage([coverageRow({ document_page_text_rows: 3 })]);
    expect(laneRowStatus("Document page text")).toBe("available");
  });
});
