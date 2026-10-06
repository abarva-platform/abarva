import {
  getHomeReviewBundle,
  isHomePreviewTenantKey,
  HOME_PREVIEW_TENANT_KEYS,
} from "../golden-snapshot";
import { constantColumnsForRecord, fieldVaries } from "../bundle-normalization";

/**
 * The golden snapshot loader is the review-bundle side of the acceptance workflow: it must load
 * the two accepted tenants' checked-in JSON exactly, and must refuse (not crash, not fall back to
 * something else) for any tenant that isn't one of the reviewed pair -- there is no live-generation
 * fallback in this route by design.
 */
describe("isHomePreviewTenantKey", () => {
  it("accepts both accepted tenants", () => {
    for (const key of HOME_PREVIEW_TENANT_KEYS) {
      expect(isHomePreviewTenantKey(key)).toBe(true);
    }
  });

  it("rejects an unreviewed tenant key", () => {
    expect(isHomePreviewTenantKey("apex-retail")).toBe(false);
  });
});

describe("getHomeReviewBundle", () => {
  it("loads meridian-health with all eight chapters and provenance", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    expect(bundle).not.toBeNull();
    expect(bundle?.tenantKey).toBe("meridian-health");
    expect(bundle?.chapters).toHaveLength(8);
    expect(bundle?.provenance.home_synthesis_contract_version).toBe(
      "home-chapters-v1",
    );
    expect(bundle?.thesis.publishedGeneration).toBeTruthy();
    expect(bundle?.thesis.signalPacket.signals.length).toBeGreaterThan(0);
  });

  it("loads skyharbor-air with all eight chapters and provenance", () => {
    const bundle = getHomeReviewBundle("skyharbor-air");
    expect(bundle).not.toBeNull();
    expect(bundle?.tenantKey).toBe("skyharbor-air");
    expect(bundle?.chapters).toHaveLength(8);
  });

  it("returns null rather than throwing for an unreviewed tenant", () => {
    expect(getHomeReviewBundle("apex-retail")).toBeNull();
  });

  it("every chapter's evidence_ids resolve to a real signal or context item in the same bundle", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    const evidenceIds = new Set([
      ...(bundle?.thesis.signalPacket.signals.map((s) => s.id) ?? []),
      ...(bundle?.thesis.signalPacket.contextItems.map((c) => c.id) ?? []),
    ]);
    const allClaims = (bundle?.chapters ?? []).flatMap((c) => [
      ...c.key_insights,
      ...c.tensions,
      ...c.what_to_watch,
    ]);
    expect(allClaims.length).toBeGreaterThan(0);
    for (const claim of allClaims) {
      for (const evidenceId of claim.evidence_ids) {
        expect(evidenceIds.has(evidenceId)).toBe(true);
      }
    }
  });
});

describe("constant columns are computed once, at load", () => {
  it("flags a field that reads the same on every row", () => {
    // The case that prompted this: a risk register where control status reads "open" on all 44
    // rows. That is a form nobody completed, not a register where nothing is controlled -- and it
    // silently collapses any predicate built on it.
    const record = {
      columns: ["riskOrControlName", "severity", "controlStatus"],
      rows: [
        { riskOrControlName: "A", severity: "high", controlStatus: "open" },
        { riskOrControlName: "B", severity: "medium", controlStatus: "open" },
        { riskOrControlName: "C", severity: "low", controlStatus: "open" },
      ],
    };
    const constants = constantColumnsForRecord(record);
    expect(constants).toHaveLength(1);
    expect(constants[0]).toMatchObject({
      key: "controlStatus",
      label: "Control Status",
      value: "open",
      rowCount: 3,
    });
  });

  it("does not flag a field that is merely sparse", () => {
    // Sparse and constant are different facts. A column filled on some rows and blank on others
    // says something about coverage; it is not a default nobody varied.
    const constants = constantColumnsForRecord({
      columns: ["name", "tier"],
      rows: [
        { name: "A", tier: "gold" },
        { name: "B", tier: "" },
        { name: "C", tier: "gold" },
      ],
    });
    expect(constants.map((c) => c.key)).not.toContain("tier");
  });

  it("does not call one row constant", () => {
    expect(
      constantColumnsForRecord({
        columns: ["name"],
        rows: [{ name: "only" }],
      }),
    ).toEqual([]);
  });

  it("examines keys the column declaration omits", () => {
    // A field present on every row but missing from `columns` was invisible to the per-surface
    // detector this replaces, which is how an absolute filesystem path rode along unexamined.
    const constants = constantColumnsForRecord({
      columns: ["name"],
      rows: [
        { name: "A", sourceClassification: "synthetic-demo" },
        { name: "B", sourceClassification: "synthetic-demo" },
      ],
    });
    expect(constants.map((c) => c.key)).toContain("sourceClassification");
  });

  it("stamps the answer onto every record type in a bundle", () => {
    const bundle = getHomeReviewBundle("skyharbor-air");
    expect(bundle).toBeTruthy();
    const recordTypes =
      (
        bundle as unknown as {
          technologyEstate?: {
            recordTypes: Array<{ constantColumns?: unknown[] }>;
          };
        }
      ).technologyEstate?.recordTypes ?? [];
    expect(recordTypes.length).toBeGreaterThan(0);
    // Every record type carries an answer -- an empty array is an answer, `undefined` is a surface
    // left to work it out for itself.
    for (const recordType of recordTypes) {
      expect(Array.isArray(recordType.constantColumns)).toBe(true);
    }
  });
});

describe("fieldVaries", () => {
  it("is false when every present value is the same", () => {
    expect(
      fieldVaries(
        [{ status: "open" }, { status: "open" }, { status: "" }],
        "status",
      ),
    ).toBe(false);
  });

  it("is true as soon as two values differ", () => {
    expect(
      fieldVaries([{ status: "open" }, { status: "mitigated" }], "status"),
    ).toBe(true);
  });
});
