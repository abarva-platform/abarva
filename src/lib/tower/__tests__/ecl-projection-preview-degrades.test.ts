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

import * as fs from "node:fs";
import * as path from "node:path";

import { azureRead } from "@/lib/data-plane/azureRead";
import { readTowerEclProjectionPreview } from "../eclProjectionPreview";

const mockQuery = azureRead.query as jest.MockedFunction<typeof azureRead.query>;

beforeEach(() => {
  mockQuery.mockReset();
});

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
    mockQuery.mockResolvedValue([
      {
        payload_json: {
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
        },
      },
    ] as never);

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
  const routePath = path.resolve(
    __dirname,
    "../../../app/(maestro)/tower/page.tsx",
  );

  it("wraps readTowerEclProjectionPreview so a read failure cannot fail the route", () => {
    const source = fs.readFileSync(routePath, "utf-8");
    const callSite = source.slice(
      source.indexOf("readTowerEclProjectionPreview("),
    );
    expect(callSite.slice(0, 200)).toMatch(/\.catch\(\(\) => null\)/);
  });
});
