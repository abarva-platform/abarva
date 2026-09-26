/**
 * Regression: the ECL projection preview is an additive diagnostic panel on /tower.
 * A tenant with no projected rows — or a read that fails outright — must degrade the
 * panel to null so the base Command Center still renders. A throw here previously
 * took the whole /tower route down and served the generic error recovery page.
 */

jest.mock("server-only", () => ({}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

/*
 * Item T-484. The second describe below drives the real /tower renderer, so the
 * page's other reads and its shell components are stubbed. The ECL preview read
 * is deliberately NOT stubbed: it is the real function, made to fail through the
 * `azureRead.query` mock above, because the question is whether a genuine read
 * failure can take the route down.
 */
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-uuid",
    key: "skyharbor-air",
    name: "Test Tenant",
  })),
}));
jest.mock("@/lib/tower/readTowerCommandCenter", () => ({
  readTowerCommandCenter: jest.fn(async () => null),
}));
jest.mock("@/lib/tower/command-center/view-model", () => ({
  buildTowerCommandCenterView: jest.fn(() => ({})),
}));
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: unknown }) => children,
}));
/* The three shells render an identifiable string rather than null, so "the page
 * rendered" is something the markup can be asked instead of something inferred
 * from the absence of a throw. */
jest.mock("@/components/tower/command-center/TowerCommandCenterAvaShell", () => ({
  TowerCommandCenterAvaShell: () => "stub:command-center",
}));
jest.mock("@/components/ecl/EclDemoFindingsPanel", () => ({
  EclDemoFindingsPanel: () => "stub:demo-findings",
}));
jest.mock("@/components/ecl/EclServingSurfaceCoverage", () => ({
  EclServingSurfaceCoverage: () => "stub:serving-coverage",
}));

import { renderToStaticMarkup } from "react-dom/server";

import { renderTowerPage } from "@/app/(maestro)/tower/page";
import { azureRead } from "@/lib/data-plane/azureRead";
import { readTowerEclProjectionPreview } from "../eclProjectionPreview";

const mockQuery = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

beforeEach(() => {
  mockQuery.mockReset();
});

/**
 * One serving row, shared by the reader's positive case and by the route case
 * below so both describe the same successful read.
 */
const PREVIEW_ROW = {
  row_key: "row-1",
  page_key: "command_center",
  row_type: "claim",
  claim_gate_status: "blocked",
  claim_gate_reason_code: "missing_measure",
  claim_gate_reason_detail: null,
  next_gate: "measure",
  funded_amount_usd: "100",
  promised_value_usd: "200",
  claimable_value_usd: "0",
  blocked_value_usd: "200",
  proof_maturity_score: 1,
  risk_pressure_score: 2,
  usage_strength_score: 3,
  owner_role: "CIO",
  handoff_module: "moves",
  display_payload_json: {},
  gap_flags_json: [],
  source_refs_json: [],
};

describe("readTowerEclProjectionPreview — degrades instead of throwing", () => {
  it("returns null when the tenant has no serving.tower_command_center rows", async () => {
    mockQuery.mockResolvedValue([]);

    await expect(
      readTowerEclProjectionPreview("skyharbor-air"),
    ).resolves.toBeNull();
  });

  it("returns null when the tenant key is absent", async () => {
    await expect(readTowerEclProjectionPreview("")).resolves.toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("still returns a preview when rows are present", async () => {
    mockQuery.mockResolvedValue([{ payload_json: PREVIEW_ROW }] as never);

    const preview = await readTowerEclProjectionPreview("skyharbor-air");
    expect(preview).not.toBeNull();
    expect(preview?.rowCount).toBe(1);
    expect(preview?.assessmentId).toBe("assessment-dense-skyharbor-20260827");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ["skyharbor-air", "assessment-dense-skyharbor-20260827"],
      { missingTable: "empty" },
    );
  });
});

describe("/tower route — ECL preview call site is guarded", () => {
  const DIAGNOSTICS_SEARCH_PARAMS = { diagnostics: "ecl", provider: "ecl" };

  /*
   * Item T-484. This case used to slice `page.tsx` at the call site and match
   * `/\.catch\(\(\) => null\)/` in the next 200 characters. That is the text of
   * one guard written one way: an equivalent `try`/`catch`, a shared wrapper, or
   * `Promise.allSettled` would all fail it while being correct, and a guard
   * commented out in place would pass it. Both directions were measured against
   * mutations of `page.tsx` and are recorded in the pull request.
   *
   * What the route owes a reader is that a failed diagnostic read costs the
   * panel and not the page. So the replacement renders the real page through its
   * exported renderer, with the preview read genuinely failing, and asks for the
   * rendered markup.
   */
  it("drops the panel and still renders the page when the projection read fails", async () => {
    mockQuery.mockRejectedValue(new Error("projection read failed"));

    // The read must really reject, or this case would be asserting over a read
    // that quietly returns null and the guard would never be reached.
    await expect(
      readTowerEclProjectionPreview("skyharbor-air"),
    ).rejects.toThrow("projection read failed");

    const tree = await renderTowerPage({
      searchParams: Promise.resolve(DIAGNOSTICS_SEARCH_PARAMS),
    });
    const markup = renderToStaticMarkup(tree);

    // The page rendered, and the diagnostics block it renders is present.
    expect(markup).toContain("stub:command-center");
    expect(markup).toContain("stub:serving-coverage");
    // And the panel that depends on the failed read is absent, rather than the
    // whole route being replaced by the error recovery page.
    expect(markup).not.toContain("ECL projection read");
  });

  it("renders the panel from the preview when the read succeeds", async () => {
    mockQuery.mockResolvedValue([{ payload_json: PREVIEW_ROW }] as never);

    const tree = await renderTowerPage({
      searchParams: Promise.resolve(DIAGNOSTICS_SEARCH_PARAMS),
    });
    const markup = renderToStaticMarkup(tree);

    // Without this half, a mutation that replaced the read with a literal
    // `null` would satisfy the degradation case and lose the panel for good.
    expect(markup).toContain("ECL projection read");
    expect(markup).toContain("Tower command center projection is loaded");
  });
});
