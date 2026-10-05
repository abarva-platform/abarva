import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMarketCandidateResearch } from "../validate-market-candidate-research.mjs";

const header = "company_key,company_name,company_domain,archetype_id,capability_basis,source_url,checked_on,research_state,contact_policy";
const row = (overrides = {}) => {
  const values = {
    company_key: "sample_co",
    company_name: "Sample Co",
    company_domain: "sample.example",
    archetype_id: "AMS_MANAGED_SERVICES",
    capability_basis: "Application management service described by provider",
    source_url: "https://sample.example/services",
    checked_on: "2026-10-05",
    research_state: "unreviewed_market_candidate",
    contact_policy: "do_not_contact_without_buyer_authorization",
    ...overrides,
  };
  return Object.values(values).join(",");
};
const csv = (...rows) => `${header}\n${rows.join("\n")}\n`;
const archetypes = ["AMS_MANAGED_SERVICES", "CONTRACT_RENEWAL"];

test("accepts research-only evidence and contextual renewal", () => {
  const report = validateMarketCandidateResearch(csv(row()), archetypes, { minimumPerArchetype: 1 });
  assert.equal(report.status, "pass");
  assert.equal(report.renewalDisposition, "incumbent_specific");
});

test("does not equate public research with buyer approval or contact authority", () => {
  for (const mutation of [
    { research_state: "approved" },
    { contact_policy: "inbound_contact_allowed" },
    { company_name: "Sample Co test@example.invalid" },
  ]) {
    assert.equal(
      validateMarketCandidateResearch(csv(row(mutation)), archetypes, { minimumPerArchetype: 1 }).status,
      "fail",
    );
  }
});

test("rejects absent, off-domain, and duplicate evidence", () => {
  for (const mutation of [
    { source_url: "" },
    { source_url: "https://news.example/vendor" },
    { source_url: "http://sample.example/services" },
  ]) {
    assert.equal(
      validateMarketCandidateResearch(csv(row(mutation)), archetypes, { minimumPerArchetype: 1 }).status,
      "fail",
    );
  }
  assert.equal(
    validateMarketCandidateResearch(csv(row(), row()), archetypes, { minimumPerArchetype: 1 }).status,
    "fail",
  );
});

test("requires every category archetype and a stable company identity", () => {
  assert.equal(
    validateMarketCandidateResearch(csv(row()), ["AMS_MANAGED_SERVICES", "MSSP_CYBER", "CONTRACT_RENEWAL"], { minimumPerArchetype: 1 }).status,
    "fail",
  );
  assert.equal(
    validateMarketCandidateResearch(csv(row(), row({ archetype_id: "MSSP_CYBER", company_name: "Another Co" })), ["AMS_MANAGED_SERVICES", "MSSP_CYBER", "CONTRACT_RENEWAL"], { minimumPerArchetype: 1 }).status,
    "fail",
  );
});

test("the committed pack meets the complete Source archetype contract", () => {
  const input = readFileSync(new URL("../../../datasets/source/market-candidate-research-v1/candidates.csv", import.meta.url), "utf8");
  const report = validateMarketCandidateResearch(input);
  assert.deepEqual(report.errors, []);
  assert.equal(report.status, "pass");
  assert.equal(report.rows, 59);
  assert.equal(report.distinctCompanies, 50);
  assert.equal(report.coveredArchetypes, 10);
});
