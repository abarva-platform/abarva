#!/usr/bin/env node
// Deterministic contradiction QA: compares known facts derived from a
// dimension's own full_rows (or other deterministic data) against phrases
// in its Claude-authored narrative/gaps/relationship/evidence text. No
// model call -- pure rule matching. A dimension whose narrative claims are
// contradicted by its own deterministic data fails and must not publish.
//
// Usage: node validate-dimension-contradictions.mjs <fixture.json> [dimensionKey]

import fs from "node:fs";

const RULES = [
  {
    id: "owner_coverage_vs_unassigned_claim",
    appliesWhen: (facts) => facts.ownerCoveragePct != null && facts.ownerCoveragePct > 0,
    check: (facts, text) => {
      const claimsUniversallyUnassigned =
        /ownership[^.]{0,80}\b(is|remains|stays)\b[^.]{0,40}\bunassigned\b/i.test(text) &&
        !/\d+\s*(of|\/)\s*\d+/.test(text.match(/ownership[^.]{0,120}/i)?.[0] ?? "");
      if (claimsUniversallyUnassigned) {
        return `Narrative claims ownership is universally unassigned, but ${facts.ownerCoveragePct}% (${facts.ownedCount} of ${facts.totalCount}) of applications have a named owner on file. Must state partial coverage (e.g. "${facts.ownedCount} of ${facts.totalCount}") not blanket absence.`;
      }
      return null;
    },
  },
  {
    id: "owner_gap_node_vs_coverage",
    appliesWhen: (facts) => facts.ownerCoveragePct != null && facts.ownerCoveragePct >= 50,
    check: (facts, text, dimension) => {
      const ownerNodes = (dimension.relationship_tab?.graph_nodes ?? []).filter(
        (n) => /owner/i.test(n.group ?? "") ,
      );
      const onlyGapNode =
        ownerNodes.length > 0 &&
        ownerNodes.every((n) => n.classification === "missing_evidence");
      if (onlyGapNode) {
        return `relationship_tab shows only a "missing evidence" Owners node, but ${facts.ownerCoveragePct}% of applications have a named owner. Must include a node reflecting known ownership, plus a separate node for the genuinely unresolved remainder.`;
      }
      return null;
    },
  },
  {
    id: "budget_unavailable_vs_real_data",
    appliesWhen: (facts) => facts.totalBudgetUsd != null && facts.totalBudgetUsd > 0,
    check: (facts, text) => {
      if (/budget[^.]{0,60}(unavailable|not available|unknown|no data)/i.test(text)) {
        return `Narrative claims budget is unavailable, but real budget data exists ($${facts.totalBudgetUsd.toLocaleString()}). Must qualify with what's actually missing (e.g. reconciliation, attestation), not claim total absence.`;
      }
      return null;
    },
  },
  {
    id: "vendor_landscape_unknown_vs_real_data",
    appliesWhen: (facts) => facts.vendorCount != null && facts.vendorCount > 0,
    check: (facts, text) => {
      if (/vendor landscape[^.]{0,40}(unknown|not captured|unavailable)/i.test(text)) {
        return `Narrative claims the vendor landscape is unknown, but ${facts.vendorCount} distinct vendors are present in source data.`;
      }
      return null;
    },
  },
];

function computeFactsFromFullRows(fullRows) {
  if (!Array.isArray(fullRows) || fullRows.length === 0) return {};
  const totalCount = fullRows.length;
  const ownedCount = fullRows.filter((r) => r.owner).length;
  const ownerCoveragePct = Math.round((ownedCount / totalCount) * 100);
  const totalBudgetUsd = fullRows.reduce((sum, r) => sum + (r.annual_run_cost_usd ?? 0), 0);
  const vendorCount = new Set(fullRows.map((r) => r.vendor).filter(Boolean)).size;
  return { totalCount, ownedCount, ownerCoveragePct, totalBudgetUsd, vendorCount };
}

function allNarrativeText(dimension) {
  const parts = [
    dimension.summary_tab?.executive_read,
    ...(dimension.gaps_tab?.decision_gaps ?? []),
    dimension.gaps_tab?.why_it_matters,
    dimension.relationship_tab?.headline,
    dimension.evidence_tab?.what_it_proves,
    dimension.evidence_tab?.what_it_does_not_prove,
    dimension.primary_visual?.annotation,
  ];
  return parts.filter(Boolean).join("\n");
}

export function validateDimension(dimension) {
  const facts = computeFactsFromFullRows(dimension.data_tab?.full_rows);
  const text = allNarrativeText(dimension);
  const failures = [];
  for (const rule of RULES) {
    if (!rule.appliesWhen(facts)) continue;
    const failure = rule.check(facts, text, dimension);
    if (failure) failures.push({ rule: rule.id, detail: failure });
  }
  return { dimensionKey: dimension.dimension_key, facts, failures, passed: failures.length === 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , fixturePath, dimensionKeyArg] = process.argv;
  if (!fixturePath) {
    console.error("Usage: node validate-dimension-contradictions.mjs <fixture.json> [dimensionKey]");
    process.exit(2);
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const dimensions = dimensionKeyArg
    ? fixture.dimensions.filter((d) => d.dimension_key === dimensionKeyArg)
    : fixture.dimensions;

  let anyFailed = false;
  for (const dimension of dimensions) {
    const result = validateDimension(dimension);
    console.log(`\n=== ${result.dimensionKey} ===`);
    console.log("facts:", JSON.stringify(result.facts));
    if (result.passed) {
      console.log("PASS");
    } else {
      anyFailed = true;
      console.log(`FAIL (${result.failures.length} contradiction(s)):`);
      for (const f of result.failures) {
        console.log(`  [${f.rule}] ${f.detail}`);
      }
    }
  }
  process.exit(anyFailed ? 1 : 0);
}
