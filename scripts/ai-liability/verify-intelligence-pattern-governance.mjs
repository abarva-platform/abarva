#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks = [];

function read(path) {
  const body = readFileSync(join(root, path), "utf8");
  checks.push({ name: `file.${path}`, status: "pass" });
  return body;
}

function requireSnippet(path, body, snippet) {
  checks.push({
    name: `snippet.${path}.${snippet}`,
    status: body.includes(snippet) ? "pass" : "fail",
  });
}

const componentPath = "src/components/intelligence/SentinelActivePatterns.tsx";
const componentTestPath =
  "src/__tests__/integration/intelligence/sentinel-active-patterns-page.test.ts";
const routePath = "src/app/api/v1/programs/originate/from-thread/route.ts";
const routeTestPath =
  "src/__tests__/integration/programs/programs-origination-routes-guards.test.ts";
const generatedCatalogPath = "docs/legal/AI_GENERATED_UI_CATALOG.md";
const actionCatalogPath = "docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md";
const buildPath = "docs/build/INTELLIGENCE_PATTERN_GOVERNANCE_2026-06-03.md";
const releasePath =
  "docs/releases/records/2026-06-03-intelligence-pattern-governance.md";

const component = read(componentPath);
const componentTest = read(componentTestPath);
const route = read(routePath);
const routeTest = read(routeTestPath);
const generatedCatalog = read(generatedCatalogPath);
const actionCatalog = read(actionCatalogPath);
const build = read(buildPath);
const release = read(releasePath);

[
  "Pattern recommendation controls",
  "AI-assisted pattern recommendation",
  "Evidence refs:",
  "human promotion gate required",
  "Sentinel does not create or advance Moves autonomously",
  "formatEvidenceRefs(detection.sourceSignalIds)",
].forEach((snippet) => requireSnippet(componentPath, component, snippet));

[
  "renders AI-assisted recommendation controls",
  "AI-assisted pattern recommendation",
  "formatEvidenceRefs(detection.sourceSignalIds)",
].forEach((snippet) => requireSnippet(componentTestPath, componentTest, snippet));

[
  "PROMOTION_RATIONALE_MIN_CHARS = 24",
  "buildPromotionGate",
  "humanPromotionRationale",
  "Pattern matches are AI-assisted decision support",
].forEach((snippet) => requireSnippet(routePath, route, snippet));

[
  "promotionGate: expect.objectContaining",
  "minimumRationaleChars: 24",
  "human owner must review evidence",
].forEach((snippet) => requireSnippet(routeTestPath, routeTest, snippet));

[
  "AI-assisted pattern recommendation",
  "evidence refs render from `detection.sourceSignalIds`",
].forEach((snippet) => requireSnippet(generatedCatalogPath, generatedCatalog, snippet));

[
  "`promotionGate` contract",
  "persist the rationale/evidence packet",
].forEach((snippet) => requireSnippet(actionCatalogPath, actionCatalog, snippet));

[
  "Backlog: T233, T234",
  "T234 remains `In progress`",
  "No database writes",
].forEach((snippet) => requireSnippet(buildPath, build, snippet));

[
  "2026-06-03-intelligence-pattern-governance",
  "global-control-lane",
  "Pass: `node scripts/ai-liability/verify-intelligence-pattern-governance.mjs`",
].forEach((snippet) => requireSnippet(releasePath, release, snippet));

const failed = checks.filter((check) => check.status === "fail");
console.log(
  JSON.stringify(
    {
      audit: "intelligence-pattern-governance",
      status: failed.length === 0 ? "pass" : "fail",
      summary: {
        pass: checks.length - failed.length,
        fail: failed.length,
      },
      checks,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}
