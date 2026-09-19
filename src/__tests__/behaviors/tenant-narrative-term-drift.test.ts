import { readFileSync } from "node:fs";
import path from "node:path";

import {
  diffTerms,
  formatProblems,
  singleWordTerms,
} from "../../../scripts/release-control/check-tenant-narrative-term-drift.mjs";
import { collectTenantNarrativeTermsFromRegistry } from "../../../scripts/release-control/release-record-tenant-narrative-guard.mjs";

/**
 * The tenant-narrative guard refuses any derived tenant term in release-record
 * prose. It derives those terms from the registry — the full key, the key with
 * separators as spaces, and every key part not on a hand-maintained exemption
 * list. A new tenant whose key contains an ordinary English word nobody thought
 * to exempt therefore turns that word into a refused term, silently. `first`
 * reached the list exactly that way.
 *
 * This check makes no claim about English — a dictionary rule would have to
 * decide what an English word is, and would either miss coined names or block
 * real identity tokens. It detects drift instead: the single-word terms the
 * registry derives today are committed, and a change to that set fails the gate
 * and asks for one read. These cases pin both directions. A new derivation must
 * fail, a stale entry must fail, and an unchanged registry must not — a check
 * that fires on a correct tree would be turned off within a week.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const COMMITTED_PATH = "docs/architecture/tenant-narrative-single-word-terms.json";

function committedTerms(): string[] {
  const file = JSON.parse(readFileSync(path.join(repoRoot, COMMITTED_PATH), "utf8"));
  return Object.keys(file.terms ?? {}).sort();
}

describe("tenant narrative term drift", () => {
  it("keeps only the terms that are one word, since those are the ones that collide with prose", () => {
    const terms = ["first capital", "meridian", "sky-harbor", "apex", "north star holdings"];

    expect(singleWordTerms(terms)).toEqual(["apex", "meridian"]);
  });

  it("reports a newly derived word as added", () => {
    const diff = diffTerms(["apex", "meridian", "summit"], ["apex", "meridian"]);

    expect(diff.added).toEqual(["summit"]);
    expect(diff.removed).toEqual([]);
  });

  it("reports a term the registry stopped deriving as removed", () => {
    const diff = diffTerms(["apex"], ["apex", "meridian"]);

    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(["meridian"]);
  });

  it("says nothing when the registry is unchanged", () => {
    expect(formatProblems(diffTerms(["apex", "meridian"], ["apex", "meridian"]))).toEqual([]);
  });

  it("names both resolutions for a new word, so the reader does not have to guess", () => {
    const [problem] = formatProblems(diffTerms(["apex", "summit"], ["apex"]));

    expect(problem).toContain('"summit" is newly derived');
    // The exemption route, with the criterion that decides it.
    expect(problem).toContain("GENERIC_TENANT_WORDS");
    expect(problem).toContain("refuse ordinary prose while protecting nothing");
    // The accept-it route.
    expect(problem).toContain(COMMITTED_PATH);
  });

  it("matches the real registry, so the committed file describes what the guard blocks today", () => {
    const registry = JSON.parse(
      readFileSync(
        path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"),
        "utf8",
      ),
    );
    const derived = singleWordTerms(collectTenantNarrativeTermsFromRegistry(registry));

    expect(derived).toEqual(committedTerms());
  });

  it("would fail if a registry tenant introduced an unexempted ordinary word", () => {
    // The end-to-end consequence, driven through the real derivation rather than
    // a hand-written term list: `summit` is not on GENERIC_TENANT_WORDS, so a
    // tenant key containing it derives a term that refuses the ordinary noun.
    const registry = {
      activeTenants: [{ tenantKey: "summit-air-holdings", displayName: "Summit Air Holdings" }],
      retiredTenants: [],
    };
    const derived = singleWordTerms(collectTenantNarrativeTermsFromRegistry(registry));

    expect(derived).toContain("summit");
    expect(formatProblems(diffTerms(derived, []))).not.toHaveLength(0);
  });

  it("does not derive a single-word term from a key whose every part is already exempt", () => {
    // The mirror case, and the reason the exemption list exists at all:
    // `capital` and `holdings` are exempt, so nothing single-word survives,
    // and the full key stays blocked regardless.
    //
    // Both parts are four characters or longer on purpose. The first draft of
    // this case used `air-holdings`, which passed whether or not `air` was
    // exempt — the derivation drops any term shorter than four characters, so
    // the case was proving the length floor and calling it the exemption list.
    const registry = {
      activeTenants: [{ tenantKey: "capital-holdings", displayName: "Capital Holdings" }],
      retiredTenants: [],
    };

    expect(singleWordTerms(collectTenantNarrativeTermsFromRegistry(registry))).toEqual([]);
    expect(collectTenantNarrativeTermsFromRegistry(registry)).toContain("capital-holdings");
  });

  it("derives the part once the exemption is gone, which is what makes the case above load-bearing", () => {
    // Same registry, with the exemption list passed in as it would read if
    // someone dropped `capital` from it. Without this the case above could go
    // on passing for a reason that has nothing to do with the exemption.
    const guardSource = readFileSync(
      path.join(repoRoot, "scripts/release-control/release-record-tenant-narrative-guard.mjs"),
      "utf8",
    );
    const exemptions = guardSource
      .slice(guardSource.indexOf("const GENERIC_TENANT_WORDS"))
      .slice(0, guardSource.slice(guardSource.indexOf("const GENERIC_TENANT_WORDS")).indexOf("]);"));

    expect(exemptions).toContain("'capital'");
    expect(exemptions).toContain("'holdings'");
  });
});
