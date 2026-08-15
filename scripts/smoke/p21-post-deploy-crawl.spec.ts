import assert from "node:assert/strict";
import fs from "node:fs";
import {
  compareCrawlToBaseline,
  isAuthAutomationBlockMessage,
  summarizeComparison,
  type CrawlRun,
} from "../../src/lib/crawl/baseline-compare";
import { AGENT_CLIENT_LOGINS } from "../../src/lib/auth/agent-client-logins";
import {
  CRAWL_PERSONAS,
  PHS_MERIDIAN_HARD_QUESTIONS,
  PRIMARY_CRAWL_SURFACES,
  POST_DEPLOY_HARD_QUESTIONS,
  resolveCrawlQuestions,
  resolveCrawlPersonas,
  resolveCrawlSurfaces,
} from "../../src/lib/crawl/persona-switcher";
import { SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE } from "../../src/lib/enterprise-data/candidate-preview-enablement/skyharbor-preview-package";

assert.equal(CRAWL_PERSONAS.length, 2);
assert.deepEqual(
  CRAWL_PERSONAS.map((persona) => persona.key),
  ["agent-meridian", "agent-skyharbor"],
);
assert.equal(
  CRAWL_PERSONAS.some((persona) => persona.key === "agent-northstar"),
  false,
);
assert.equal(
  CRAWL_PERSONAS.some((persona) => persona.key === "agent-apexretail"),
  false,
);
assert.equal(
  CRAWL_PERSONAS.some((persona) => persona.key === "agent-firstcapital"),
  false,
);
assert.equal(
  CRAWL_PERSONAS.some((persona) => persona.key === "agent-lakeshore"),
  false,
);
assert.equal(
  resolveCrawlPersonas("agent-meridian")[0]?.tenantName,
  "Meridian Health",
);
assert.equal(
  resolveCrawlPersonas("agent-skyharbor")[0]?.tenantName,
  "SkyHarbor Global",
);
assert.ok(PRIMARY_CRAWL_SURFACES.length >= 22);
assert.equal(POST_DEPLOY_HARD_QUESTIONS.length, 10);
assert.equal(PHS_MERIDIAN_HARD_QUESTIONS.length, 50);
assert.equal(resolveCrawlQuestions("phs-meridian").length, 50);
assert.equal(resolveCrawlQuestions("unknown").length, 10);
assert.deepEqual(
  resolveCrawlPersonas("agent-apexretail").map((persona) => persona.key),
  [],
);
assert.equal(
  resolveCrawlSurfaces().some((surface) => surface.id === "context-demo"),
  false,
);
assert.deepEqual(resolveCrawlSurfaces("context-demo"), []);
assert.deepEqual(
  resolveCrawlPersonas("agent-meridian").map((persona) => persona.email),
  ["meridian-agent@abarva.example.com"],
);
assert.deepEqual(
  resolveCrawlPersonas("agent-skyharbor").map((persona) => persona.email),
  ["skyharbor-agent@abarva.example.com"],
);
const postDeployWorkflow = fs.readFileSync(
  ".github/workflows/post-deploy-crawl.yml",
  "utf8",
);
const postDeployHarness = fs.readFileSync(
  "scripts/crawl/post-deploy-harness.ts",
  "utf8",
);
const atlasGauntletHarness = fs.readFileSync(
  "scripts/qa/atlas-prod-comprehensive-surface.ts",
  "utf8",
);
const personaSwitcher = fs.readFileSync(
  "src/lib/crawl/persona-switcher.ts",
  "utf8",
);
assert.match(postDeployWorkflow, /CLERK_SECRET_KEY:/);
assert.match(postDeployWorkflow, /AZURE_LAB_CLERK_SECRET_KEY/);
assert.match(postDeployWorkflow, /CLERK_TESTING_TOKEN_SECRET_KEY:/);
assert.doesNotMatch(postDeployWorkflow, /Run candidate preview focused crawl/);
assert.doesNotMatch(postDeployWorkflow, /candidate-preview-crawl/);
assert.match(postDeployHarness, /runCandidatePreviewProof/);
assert.match(postDeployHarness, /candidatePreview/);
assert.match(postDeployHarness, /includeCandidatePreview/);
assert.match(postDeployHarness, /isAuthAutomationBlockMessage/);
assert.match(postDeployHarness, /candidate-preview-auth-bootstrap/);
assert.match(atlasGauntletHarness, /agentLoginForClientKey/);
assert.match(atlasGauntletHarness, /installClerkTestingTokenInterceptor/);
assert.match(atlasGauntletHarness, /atlasClientRequest: 'apexretail'/);
assert.match(atlasGauntletHarness, /atlasClientRequest: 'meridian'/);
assert.match(atlasGauntletHarness, /atlasClientRequest: 'skyharbor'/);
assert.doesNotMatch(atlasGauntletHarness, /clientId: '[0-9a-f-]{36}'/);
assert.match(atlasGauntletHarness, /Too Many Requests\|rate limit\|HTTP 429/);
assert.doesNotMatch(atlasGauntletHarness, /cio@apex-retail\.example\.com/);
assert.doesNotMatch(atlasGauntletHarness, /cdio@meridian-health\.example\.com/);
assert.doesNotMatch(atlasGauntletHarness, /cto@skyharbor-air\.example\.com/);
assert.match(personaSwitcher, /createClerkTestingTokenForCrawl/);
assert.match(personaSwitcher, /installClerkTestingTokenInterceptor/);
assert.deepEqual(
  AGENT_CLIENT_LOGINS.map((login) => login.slug),
  ["agent-apexretail", "agent-meridian", "agent-skyharbor"],
);
assert.equal(SKYHARBOR_CANDIDATE_PREVIEW_PACKAGE.tenantKey, "skyharbor_global");
assert.equal(
  isAuthAutomationBlockMessage("page.evaluate: e: You have been banned."),
  true,
);
assert.equal(
  isAuthAutomationBlockMessage("Candidate preview page did not render."),
  false,
);

const run: CrawlRun = {
  runId: "smoke",
  baseUrl: "https://app.abarva.ai",
  createdAt: "2026-05-24T00:00:00Z",
  observations: [
    {
      tenantKey: "apexretail",
      expectedTenantName: "Apex Retail Group",
      personaKey: "apex-cfo",
      surfaceId: "home",
      path: "/home",
      url: "https://app.abarva.ai/home",
      visibleText: "Apex Retail Group Heliara",
      consoleErrors: [],
      networkErrors: [],
      evidenceChipCount: 4,
      proofPointCount: 4,
      citationDensity: 0.1,
      hardQuestionExactFieldCitations: 2,
      watchlistTopEntries: [],
      visualCanon: {
        backgroundOk: true,
        headersOk: true,
        bodyOk: true,
        buttonsOk: true,
      },
    },
  ],
};

const comparison = compareCrawlToBaseline(run, null);
assert.equal(comparison.p0, 1);
assert.match(summarizeComparison(comparison), /1 P0/);
assert.equal(comparison.findings[0]?.dimension, "tenant-leakage");

const runWithCandidatePreview: CrawlRun = {
  ...run,
  candidatePreview: {
    routeStatus: {
      signedInNavigatedDirectlyToTarget: true,
      signedInFinalPathname: "/admin/candidate-preview",
    },
    guardrails: {
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      productionTenantDataWritten: false,
      moduleRuntimeConsumptionChanged: false,
    },
  },
};
const candidatePreview = runWithCandidatePreview.candidatePreview as {
  guardrails: { candidatePromoted: boolean };
};
assert.equal(candidatePreview.guardrails.candidatePromoted, false);

const renderedWithClerkCorsNoise: CrawlRun = {
  ...run,
  observations: [
    {
      ...run.observations[0],
      visibleText: "Apex Retail Group production readiness page rendered",
      consoleErrors: [
        "Access to fetch at 'https://boss-griffon-61.clerk.accounts.dev/v1/client?__clerk_api_version=2025-11-10' from origin 'https://app.abarva.ai' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
        "Failed to load resource: net::ERR_FAILED",
      ],
    },
  ],
};
const clerkNoiseComparison = compareCrawlToBaseline(
  renderedWithClerkCorsNoise,
  null,
);
assert.equal(clerkNoiseComparison.p0, 0);
assert.equal(clerkNoiseComparison.p2, 1);
assert.deepEqual(
  clerkNoiseComparison.findings.map((finding) => finding.dimension),
  ["third-party-console-noise"],
);

const renderedWithAppConsoleError: CrawlRun = {
  ...renderedWithClerkCorsNoise,
  observations: [
    {
      ...renderedWithClerkCorsNoise.observations[0],
      consoleErrors: ["TypeError: Cannot read properties of undefined"],
    },
  ],
};
const appErrorComparison = compareCrawlToBaseline(
  renderedWithAppConsoleError,
  null,
);
assert.equal(appErrorComparison.p0, 1);
assert.equal(appErrorComparison.findings[0]?.dimension, "console-errors");

const renderedWithBareNetworkConsoleError: CrawlRun = {
  ...renderedWithClerkCorsNoise,
  observations: [
    {
      ...renderedWithClerkCorsNoise.observations[0],
      consoleErrors: ["Failed to load resource: net::ERR_FAILED"],
    },
  ],
};
const bareNetworkConsoleComparison = compareCrawlToBaseline(
  renderedWithBareNetworkConsoleError,
  null,
);
assert.equal(bareNetworkConsoleComparison.p0, 1);
assert.equal(
  bareNetworkConsoleComparison.findings[0]?.dimension,
  "console-errors",
);

console.log(
  "P21 smoke passed: personas, surface count, hard questions, and P0 tenant-leakage comparator are deterministic.",
);
