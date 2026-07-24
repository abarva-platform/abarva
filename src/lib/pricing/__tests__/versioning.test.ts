import { describe, expect, it } from "@jest/globals";
import {
  canonicalize,
  coalesceKeyPart,
  computeContentHash,
  decideVersionAction,
  findDuplicateKeys,
} from "../versioning";

describe("canonicalize / computeContentHash", () => {
  it("hashes identically regardless of key insertion order", () => {
    const a = { role_code: "ROL-001", name: "Transformation Partner", tags: ["a", "b"] };
    const b = { tags: ["a", "b"], name: "Transformation Partner", role_code: "ROL-001" };
    expect(computeContentHash(a)).toBe(computeContentHash(b));
  });

  it("produces a different hash when a value changes", () => {
    const a = { role_code: "ROL-001", rate: 100 };
    const b = { role_code: "ROL-001", rate: 101 };
    expect(computeContentHash(a)).not.toBe(computeContentHash(b));
  });

  it("ignores key order in nested objects too", () => {
    const a = { outer: { z: 1, a: 2 } };
    const b = { outer: { a: 2, z: 1 } };
    expect(computeContentHash(a)).toBe(computeContentHash(b));
  });

  it("drops undefined values so their presence/absence does not change the hash", () => {
    const a = { role_code: "ROL-001", note: undefined };
    const b = { role_code: "ROL-001" };
    expect(computeContentHash(a)).toBe(computeContentHash(b));
  });

  it("canonicalize sorts object keys but preserves array order", () => {
    expect(canonicalize({ b: 1, a: 2 })).toEqual({ a: 2, b: 1 });
    expect(canonicalize([3, 1, 2])).toEqual([3, 1, 2]);
  });
});

describe("decideVersionAction", () => {
  it("is a new_version at version 1 with no current row", () => {
    expect(decideVersionAction("hash-a", null)).toEqual({
      action: "new_version",
      version: 1,
      previousVersion: null,
    });
  });

  it("is a no-op when the content hash matches the current row", () => {
    expect(
      decideVersionAction("hash-a", { version: 3, contentHash: "hash-a" }),
    ).toEqual({ action: "noop", version: 3 });
  });

  it("bumps to version + 1 when the content hash differs from the current row", () => {
    expect(
      decideVersionAction("hash-b", { version: 3, contentHash: "hash-a" }),
    ).toEqual({ action: "new_version", version: 4, previousVersion: 3 });
  });
});

describe("coalesceKeyPart", () => {
  it("substitutes the sentinel for null/undefined and passes real values through", () => {
    expect(coalesceKeyPart(null, "__global__")).toBe("__global__");
    expect(coalesceKeyPart(undefined, "__global__")).toBe("__global__");
    expect(coalesceKeyPart("apex-retail", "__global__")).toBe("apex-retail");
  });
});

describe("findDuplicateKeys — one test per brief §6.4 idempotency key", () => {
  it("role: UNIQUE (taxonomy_version, role_code)", () => {
    const rows = [
      { taxonomy_version: 1, role_code: "ROL-001" },
      { taxonomy_version: 1, role_code: "ROL-002" },
      { taxonomy_version: 1, role_code: "ROL-001" }, // duplicate within the same version
      { taxonomy_version: 2, role_code: "ROL-001" }, // same role_code, different version — NOT a duplicate
    ];
    const dupes = findDuplicateKeys(rows, (r) => `${r.taxonomy_version}::${r.role_code}`);
    expect(dupes).toEqual(["1::ROL-001"]);
  });

  it("role alias: UNIQUE (tenant_key, normalized_alias, provider_scope), COALESCE'd for global scope", () => {
    const key = (r: { tenant_key: string | null; alias_label: string; provider_scope: string | null }) =>
      [
        coalesceKeyPart(r.tenant_key, "__global__"),
        r.alias_label.trim().toLowerCase(),
        coalesceKeyPart(r.provider_scope, "__any_provider__"),
      ].join("::");

    const rows = [
      { tenant_key: null, alias_label: "Lead Data Engineer", provider_scope: null },
      { tenant_key: null, alias_label: "lead data engineer", provider_scope: null }, // case/whitespace-equivalent duplicate
      { tenant_key: "apex-retail", alias_label: "Lead Data Engineer", provider_scope: null }, // different tenant — NOT a duplicate
    ];
    const dupes = findDuplicateKeys(rows, key);
    expect(dupes).toEqual(["__global__::lead data engineer::__any_provider__"]);
  });

  it("rate card: UNIQUE (scope_type, tenant_key, card_code, version), tenant_key COALESCE'd for global scope", () => {
    const key = (r: { scope_type: string; tenant_key: string | null; card_code: string; version: number }) =>
      [r.scope_type, coalesceKeyPart(r.tenant_key, "__global__"), r.card_code, r.version].join("::");

    const rows = [
      { scope_type: "global", tenant_key: null, card_code: "GLOBAL-STARTER", version: 1 },
      { scope_type: "global", tenant_key: null, card_code: "GLOBAL-STARTER", version: 1 }, // duplicate
      { scope_type: "client", tenant_key: "apex-retail", card_code: "GLOBAL-STARTER", version: 1 }, // different scope — NOT a duplicate
    ];
    const dupes = findDuplicateKeys(rows, key);
    expect(dupes).toEqual(["global::__global__::GLOBAL-STARTER::1"]);
  });

  it("rate line: UNIQUE (card_version_id, role_or_band_ref, level, provider_ref, location_ref, rate_basis, unit, valid_from)", () => {
    const key = (r: {
      card_version_id: string;
      role_or_band_ref: string;
      level: string | null;
      provider_ref: string | null;
      location_ref: string | null;
      rate_basis: string;
      unit: string;
      valid_from: string;
    }) =>
      [
        r.card_version_id,
        r.role_or_band_ref,
        coalesceKeyPart(r.level, "__any_level__"),
        coalesceKeyPart(r.provider_ref, "__any_provider__"),
        coalesceKeyPart(r.location_ref, "__any_location__"),
        r.rate_basis,
        r.unit,
        r.valid_from,
      ].join("::");

    const rows = [
      {
        card_version_id: "card-1",
        role_or_band_ref: "ROL-001",
        level: "LVL-01",
        provider_ref: null,
        location_ref: null,
        rate_basis: "onshore_si_t1_benchmark",
        unit: "hour",
        valid_from: "2026-07-23",
      },
      {
        card_version_id: "card-1",
        role_or_band_ref: "ROL-001",
        level: "LVL-01",
        provider_ref: null,
        location_ref: null,
        rate_basis: "onshore_si_t1_benchmark",
        unit: "hour",
        valid_from: "2026-07-23",
      }, // duplicate
      {
        card_version_id: "card-1",
        role_or_band_ref: "ROL-001",
        level: "LVL-02", // different level — NOT a duplicate
        provider_ref: null,
        location_ref: null,
        rate_basis: "onshore_si_t1_benchmark",
        unit: "hour",
        valid_from: "2026-07-23",
      },
    ];
    const dupes = findDuplicateKeys(rows, key);
    expect(dupes).toEqual([
      "card-1::ROL-001::LVL-01::__any_provider__::__any_location__::onshore_si_t1_benchmark::hour::2026-07-23",
    ]);
  });

  it("client profile assumption: UNIQUE (tenant_key, profile_version, assumption_key)", () => {
    const key = (r: { tenant_key: string; profile_version: number; assumption_key: string }) =>
      [r.tenant_key, r.profile_version, r.assumption_key].join("::");

    const rows = [
      { tenant_key: "apex-retail", profile_version: 1, assumption_key: "offshore_ratio_default" },
      { tenant_key: "apex-retail", profile_version: 1, assumption_key: "offshore_ratio_default" }, // duplicate
      { tenant_key: "apex-retail", profile_version: 2, assumption_key: "offshore_ratio_default" }, // different version — NOT a duplicate
      { tenant_key: "meridian-health", profile_version: 1, assumption_key: "offshore_ratio_default" }, // different tenant — NOT a duplicate
    ];
    const dupes = findDuplicateKeys(rows, key);
    expect(dupes).toEqual(["apex-retail::1::offshore_ratio_default"]);
  });
});
