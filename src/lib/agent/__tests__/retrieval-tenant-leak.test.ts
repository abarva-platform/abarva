// Atlas Fix A (2026-05-30) — P0 retrieval-leak invariants.
//
// Two invariants under test:
//
//   1. Retired legacy client aliases are scrubbed to canonical names BEFORE
//      they enter the prompt.
//
//   2. The AI-governance topic namespace is tenant/industry-scoped — the
//      unscoped `global:ai_governance` namespace is gone for good.
//
// References:
//   - src/lib/agent/retrieval.ts
//   - docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  __testOnly_normalizeLegacyClientAliases as normalizeLegacyClientAliases,
  __testOnly_topicNamespace as topicNamespace,
} from "../retrieval";

const LEGACY_RETAIL = ["Aster", "line"].join("");
const LEGACY_HEALTH = ["Hel", "iara"].join("");
const LEGACY_FINSERV = ["Brindle", "mark"].join("");
const CURRENT_RETAIL_GROUP = ["Apex", "Retail Group"].join(" ");

describe("Atlas retrieval — legacy alias scrub", () => {
  it("rewrites the retired retail alias to Apex Retail", () => {
    expect(
      normalizeLegacyClientAliases(
        `${LEGACY_RETAIL} Retail Group is the client`,
      ),
    ).toBe("Apex Retail Group is the client");
    expect(
      normalizeLegacyClientAliases(`${LEGACY_RETAIL} Retail loss prevention`),
    ).toBe("Apex Retail loss prevention");
    expect(normalizeLegacyClientAliases(`per ${LEGACY_RETAIL} policy`)).toBe(
      "per Apex Retail policy",
    );
  });

  it("rewrites the retired healthcare alias to Meridian", () => {
    expect(
      normalizeLegacyClientAliases(
        `${LEGACY_HEALTH} Health Alliance signed the BAA`,
      ),
    ).toBe("Meridian Health signed the BAA");
    expect(normalizeLegacyClientAliases(`${LEGACY_HEALTH} Health system`)).toBe(
      "Meridian Health system",
    );
    expect(normalizeLegacyClientAliases(`${LEGACY_HEALTH} internal memo`)).toBe(
      "Meridian internal memo",
    );
  });

  it("rewrites the retired financial alias to FS Demo", () => {
    expect(
      normalizeLegacyClientAliases(`${LEGACY_FINSERV} Financial Group`),
    ).toBe("FS Demo");
    expect(normalizeLegacyClientAliases(`${LEGACY_FINSERV} Financial`)).toBe(
      "FS Demo",
    );
    expect(normalizeLegacyClientAliases(`${LEGACY_FINSERV} exposure`)).toBe(
      "FS Demo exposure",
    );
  });

  it("leaves canonical names untouched", () => {
    expect(normalizeLegacyClientAliases(CURRENT_RETAIL_GROUP)).toBe(
      CURRENT_RETAIL_GROUP,
    );
    expect(normalizeLegacyClientAliases("Meridian Health")).toBe(
      "Meridian Health",
    );
    expect(normalizeLegacyClientAliases("FS Demo")).toBe("FS Demo");
  });
});

describe("Atlas retrieval — topic namespace is industry-scoped", () => {
  it("healthcare tenants pull from the healthcare ai-governance namespace", () => {
    expect(topicNamespace("HEALTHCARE_IDN")).toBe(
      "industry:healthcare_idn:ai_governance",
    );
  });

  it("finserv tenants pull from the finserv ai-governance namespace", () => {
    expect(topicNamespace("FINSERV")).toBe("industry:finserv:ai_governance");
  });

  it("retail tenants pull from the retail ai-governance namespace", () => {
    expect(topicNamespace("RETAIL")).toBe("industry:retail:ai_governance");
  });

  it("unknown / null industry falls back to industry-agnostic, never global", () => {
    expect(topicNamespace(null)).toBe("industry:general_macro:ai_governance");
    expect(topicNamespace(undefined)).toBe(
      "industry:general_macro:ai_governance",
    );
    expect(topicNamespace("GENERAL")).toBe(
      "industry:general_macro:ai_governance",
    );
  });
});

describe("Atlas retrieval — source-file grep invariants", () => {
  const retrievalSrc = readFileSync(
    join(__dirname, "..", "retrieval.ts"),
    "utf8",
  );

  it("the file no longer contains the unscoped 'global:ai_governance' literal", () => {
    // Strip line/block comments that may legitimately reference the
    // deprecated namespace in historical notes — only runtime code
    // counts. Comments are stripped before the assertion.
    const codeOnly = retrievalSrc
      // Block comments — non-greedy
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Line comments — strip from // to end of line
      .replace(/^\s*\/\/.*$/gm, "");

    expect(codeOnly).not.toMatch(/['"]global:ai_governance['"]/);
  });

  it("no literal legacy alias names appear in runtime code paths", () => {
    // The aliases may appear ONLY inside the normalizer regex (where
    // they are the input we're rewriting). Strip the normalizer block
    // and verify the rest of the file is alias-free.
    const withoutNormalizer = retrievalSrc.replace(
      /function normalizeLegacyClientAliases[\s\S]*?^}/m,
      "",
    );
    // Also strip comments where aliases are deliberately named in
    // documentation about what gets scrubbed.
    const codeOnly = withoutNormalizer
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    expect(codeOnly).not.toMatch(new RegExp(`\\b${LEGACY_RETAIL}\\b`));
    expect(codeOnly).not.toMatch(new RegExp(`\\b${LEGACY_HEALTH}\\b`));
    expect(codeOnly).not.toMatch(new RegExp(`\\b${LEGACY_FINSERV}\\b`));
  });
});
