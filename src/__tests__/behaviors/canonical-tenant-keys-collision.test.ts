/**
 * Two modules export `CANONICAL_TENANT_KEYS`, with different contents.
 *
 * AGENTS.md is mandatory on this point: "Tenants come from code
 * (CANONICAL_TENANT_KEYS), never a hand-typed list. No tenant exceptions in any
 * scanner/validator/report/test." That rule names a symbol which resolves to
 * two different answers depending on the import path, so a caller that follows
 * it correctly may be iterating two tenants or six without knowing which.
 *
 * This test does not pick a winner — that is a product decision. It pins the
 * divergence and the consumers on each side, so the disagreement is a visible,
 * failing-on-change fact rather than something each reader rediscovers.
 *
 * When the two are reconciled, this test fails. That is the point: delete it in
 * the change that settles it.
 *
 * It lives in behaviors/ rather than unit/ because `src/__tests__/unit` is
 * named by no workflow and no npm script — twelve suites that run nowhere,
 * three of them currently failing. `src/__tests__/behaviors` is executed in CI
 * by scripts/ci/check-behavior-coverage.mjs.
 */

import { CANONICAL_TENANT_KEYS as ALIAS_KEYS } from "@/lib/tenant/aliases";
import { CANONICAL_TENANT_KEYS as CONFIG_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

describe("CANONICAL_TENANT_KEYS · two exports, two answers", () => {
  it("documents a gap: the two canonical lists disagree", () => {
    // Widened deliberately. The config export's element type is a two-member
    // literal union, so TypeScript refuses to even ask whether "apex-retail" is
    // in it — the divergence is in the type system, not only the values.
    const alias = new Set<string>(ALIAS_KEYS);
    const config = new Set<string>(CONFIG_KEYS);

    expect(alias).not.toEqual(config);

    const onlyInAliases = [...alias].filter((k) => !config.has(k)).sort();
    const onlyInConfig = [...config].filter((k) => !alias.has(k)).sort();

    // Pinned explicitly. A tenant appearing or disappearing from either list
    // without this being updated is a change nobody stated.
    expect(onlyInAliases).toEqual([
      "apex-retail",
      "first-capital",
      "lakeshore-holdings",
      "northstar-clinical",
    ]);
    expect(onlyInConfig).toEqual([]);
  });

  it("documents the consequence: the narrower list gates operator provisioning", () => {
    // src/lib/auth/operator-persona-provisioning.ts imports the config list and
    // refuses to provision a persons row or membership for anything outside it
    // — `if (!isCanonical(canonicalKey)) return null`. Fail-closed, and silent.
    //
    // The governance scripts (inventory-scan, readiness-backfill) import the
    // same narrow list, so the governance framework AGENTS.md declares
    // mandatory enumerates two tenants.
    //
    // Meanwhile the admin parallel-run-invariants route and the Tower
    // materializer import the wide list. Whether four tenants are out of scope
    // on purpose or by accident is exactly the open question.
    for (const key of ["apex-retail", "first-capital", "lakeshore-holdings"]) {
      expect(ALIAS_KEYS).toContain(key);
      expect(CONFIG_KEYS).not.toContain(key);
    }
  });
});
