import { describe, expect, it } from "@jest/globals";
import {
  buildTaggedTableRows,
  defaultReferencePackDir,
  readReferencePackDir,
} from "../../reference-pack-loader";
import { computeCoverageFromSnapshot } from "../coverage-report";
import type { PricingRateBandRow, PricingRateCardLineRow, PricingRoleRow } from "../../types";

// ---------------------------------------------------------------------------
// Real PR1/PR2 reference data — 326 roles, 908 rate bands (see manifest.json)
// — so the coverage numbers this test asserts are the REAL production
// numbers, not an approximation, per the PR3 brief's explicit "report the
// real number, don't assume" instruction.
// ---------------------------------------------------------------------------
const data = readReferencePackDir(defaultReferencePackDir());
const tagged = buildTaggedTableRows(data, 1);
const REAL_ROLES = tagged.pricing_roles as unknown as PricingRoleRow[];
const REAL_RATE_BANDS = tagged.pricing_rate_bands as unknown as PricingRateBandRow[];

function clientLine(overrides: Partial<PricingRateCardLineRow>): PricingRateCardLineRow {
  return {
    id: "line-id",
    card_version_id: "card-1",
    role_or_band_ref: "ROL-001",
    level: null,
    provider_ref: null,
    location_ref: null,
    rate_basis: "client_negotiated",
    unit: "hour",
    rate_value: 400,
    currency: "USD",
    valid_from: "2026-08-01",
    valid_to: null,
    tenant_key: "apex-retail",
    content_hash: "irrelevant",
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeCoverageFromSnapshot — against the real PR1/PR2 taxonomy (326 roles / 908 rate bands)", () => {
  it("with no client rate card at all, every role falls back to the global rate-band default (0 direct / 326 inherited / 0 missing)", () => {
    const report = computeCoverageFromSnapshot({
      tenantKey: "apex-retail",
      taxonomyVersion: 1,
      roles: REAL_ROLES,
      rateBands: REAL_RATE_BANDS,
      clientLines: [],
      globalLines: [],
    });

    expect(report.totalRoles).toBe(326);
    expect(report.direct.count).toBe(0);
    expect(report.inherited.count).toBe(326);
    expect(report.missing.count).toBe(0);
    expect(report.coveragePct).toBe(100);
    // Every real role does resolve via its default_rate_band_code today —
    // confirmed against the actual committed CSVs (see PR3 build notes).
    expect(report.inherited.roles.every((r) => r.resolvedVia === "rate_band_default")).toBe(true);
  });

  it("a client upload covering 10 roles reports ~10 direct / ~316 inherited / 0 missing", () => {
    const tenRoles = REAL_ROLES.slice(0, 10);
    const clientLines = tenRoles.map((role) => clientLine({ role_or_band_ref: role.role_code }));

    const report = computeCoverageFromSnapshot({
      tenantKey: "apex-retail",
      taxonomyVersion: 1,
      roles: REAL_ROLES,
      rateBands: REAL_RATE_BANDS,
      clientLines,
      globalLines: [],
    });

    expect(report.totalRoles).toBe(326);
    expect(report.direct.count).toBe(10);
    expect(report.inherited.count).toBe(316);
    expect(report.missing.count).toBe(0);
    expect(report.direct.roles.map((r) => r.roleCode).sort()).toEqual(
      tenRoles.map((r) => r.role_code).sort(),
    );
  });

  it("surfaces a genuinely unresolvable role explicitly in the missing bucket, never hiding it", () => {
    const rolesWithOneGap: PricingRoleRow[] = [
      ...REAL_ROLES.slice(0, 5),
      { ...REAL_ROLES[5], role_code: "ROL-TEST-GAP", default_rate_band_code: null },
    ];
    const rateBandsExcludingGap = REAL_RATE_BANDS.filter((b) => b.role_code !== REAL_ROLES[5].role_code);

    const report = computeCoverageFromSnapshot({
      tenantKey: "apex-retail",
      taxonomyVersion: 1,
      roles: rolesWithOneGap,
      rateBands: rateBandsExcludingGap,
      clientLines: [],
      globalLines: [],
    });

    expect(report.missing.count).toBe(1);
    expect(report.missing.roles[0].roleCode).toBe("ROL-TEST-GAP");
    expect(report.coveragePct).toBeLessThan(100);
  });

  it("a global-scope rate-card line also counts as inherited coverage, not missing", () => {
    const oneRole = [REAL_ROLES[0]];
    const oneBand = REAL_RATE_BANDS.filter((b) => b.role_code === REAL_ROLES[0].role_code);

    const report = computeCoverageFromSnapshot({
      tenantKey: "apex-retail",
      taxonomyVersion: 1,
      roles: oneRole,
      rateBands: oneBand,
      clientLines: [],
      globalLines: [clientLine({ role_or_band_ref: REAL_ROLES[0].role_code, tenant_key: null })],
    });

    expect(report.inherited.count).toBe(1);
    expect(report.inherited.roles[0].resolvedVia).toBe("global_rate_card_line");
  });
});
