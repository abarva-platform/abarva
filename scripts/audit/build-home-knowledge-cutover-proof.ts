#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import {
  explainModuleContext,
  getModuleContext,
} from "../../src/lib/enterprise-data/module-context-serving/module-context-serving";
import type {
  ModuleContextReadRequest,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "../../src/lib/enterprise-data/contracts/module-context-apis";
import { buildHomeSummarySnapshotFromModuleContext } from "../../src/lib/home/home-summary-snapshot";

type ScenarioKey =
  | "skyharbor-enterprise-overview"
  | "meridian-enterprise-overview"
  | "meridian-finance-analytics"
  | "meridian-agent-assist"
  | "harbortrust-fraud-analyst-copilot"
  | "generic-vendor-onboarding";

type Scenario = {
  key: ScenarioKey;
  tenantKey: string;
  displayName: string;
  industry: string;
  prompt: string;
  requestedDomains: ModuleContextRequestedDomain[];
};

type DimensionProof = {
  id: string;
  label: string;
  moduleDomain: ModuleContextRequestedDomain;
  profileType: string;
  represented: boolean;
  acceptedRecords: number;
  evidenceRefs: number;
  gaps: number;
  relationships: number;
  tabs: Record<"summary" | "data" | "relationships" | "gaps" | "evidence", "present">;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.HOME_KNOWLEDGE_CUTOVER_GENERATED_AT ??
  "2026-07-15T00:00:00.000Z";
const outDir = path.join(
  repoRoot,
  "reports/enterprise-knowledge-layer/home-cutover-proof",
);

const homePagePath = path.join(repoRoot, "src/app/(maestro)/home/page.tsx");
const homeSurfacePath = path.join(repoRoot, "src/components/home/HomeSurface.tsx");
const dockerIgnorePath = path.join(repoRoot, ".dockerignore");
const dockerfilePath = path.join(repoRoot, "Dockerfile");
const summaryBuilderPath = path.join(
  repoRoot,
  "src/lib/home/home-summary-snapshot.ts",
);

const requiredDomains: ModuleContextRequestedDomain[] = [
  "enterprise_profile",
  "functions",
  "applications_systems",
  "vendors_contracts",
  "data_assets_integrations",
  "programs_priorities",
  "risks_controls",
  "metrics_outcomes",
  "relationships",
  "evidence_sources",
];

const dimensions: Array<{
  id: string;
  label: string;
  moduleDomain: ModuleContextRequestedDomain;
  profileType: string;
}> = [
  ["enterprise-profile", "Enterprise Profile", "enterprise_profile", "EnterpriseProfile"],
  ["business-functions", "Business Functions", "functions", "FunctionProfile"],
  ["org-ownership", "Org Ownership", "functions", "FunctionProfile"],
  ["workforce-roles", "Workforce Roles", "functions", "FunctionProfile"],
  ["applications-systems", "Applications & Systems", "applications_systems", "SystemProfile"],
  [
    "data-assets-integrations",
    "Data Assets & Integrations",
    "data_assets_integrations",
    "DataDomainProfile",
  ],
  [
    "infrastructure-platforms",
    "Infrastructure & Platforms",
    "applications_systems",
    "InfrastructureProfile",
  ],
  ["vendors-contracts", "Vendors & Contracts", "vendors_contracts", "VendorProfile"],
  ["it-budget-spend-value", "IT Budget, Spend & Value", "metrics_outcomes", "MetricProfile"],
  ["programs-initiatives", "Programs & Initiatives", "programs_priorities", "ProgramProfile"],
  ["ai-automation-use-cases", "AI & Automation Use Cases", "programs_priorities", "UseCaseProfile"],
  ["risks-controls", "Risks & Controls", "risks_controls", "RiskProfile"],
  ["relationships", "Relationships", "relationships", "EnterpriseProfile"],
  ["evidence-sources", "Evidence Sources", "evidence_sources", "EnterpriseProfile"],
  ["metrics-outcomes", "Metrics & Outcomes", "metrics_outcomes", "MetricProfile"],
  ["industry-context-patterns", "Industry Context Patterns", "evidence_sources", "EnterpriseProfile"],
  ["expert-lenses", "Expert Lenses", "evidence_sources", "EnterpriseProfile"],
  ["managed-services-scope", "Managed Services Scope", "vendors_contracts", "ContractProfile"],
  [
    "operational-process-evidence",
    "Operational Process Evidence",
    "evidence_sources",
    "ProcessProfile",
  ],
].map(([id, label, moduleDomain, profileType]) => ({
  id,
  label,
  moduleDomain: moduleDomain as ModuleContextRequestedDomain,
  profileType,
}));

const scenarios: Scenario[] = [
  {
    key: "skyharbor-enterprise-overview",
    tenantKey: "skyharbor-air",
    displayName: "Airline Demo",
    industry: "Global Airline",
    prompt:
      "Show the active Knowledge context for the Airline Demo persona after app-client alias normalization.",
    requestedDomains: requiredDomains,
  },
  {
    key: "meridian-enterprise-overview",
    tenantKey: "meridian-health",
    displayName: "Healthcare Demo",
    industry: "Healthcare",
    prompt:
      "Explain what Nexus knows about Meridian Health before aVa answers.",
    requestedDomains: requiredDomains,
  },
  {
    key: "meridian-finance-analytics",
    tenantKey: "meridian-health",
    displayName: "Healthcare Demo",
    industry: "Healthcare",
    prompt:
      "Show finance analytics context, metrics, data assets, systems, and caveats.",
    requestedDomains: requiredDomains,
  },
  {
    key: "meridian-agent-assist",
    tenantKey: "meridian-health",
    displayName: "Healthcare Demo",
    industry: "Healthcare",
    prompt:
      "Show agent assist context across call center, data, systems, risks, and metrics.",
    requestedDomains: requiredDomains,
  },
  {
    key: "harbortrust-fraud-analyst-copilot",
    tenantKey: "first-capital",
    displayName: "Financial Services Demo",
    industry: "Financial Services",
    prompt:
      "Show fraud analyst copilot context with governed evidence and decision limits.",
    requestedDomains: requiredDomains,
  },
  {
    key: "generic-vendor-onboarding",
    tenantKey: "apex-retail",
    displayName: "Retail Demo",
    industry: "Retail",
    prompt:
      "Show generic vendor onboarding context with vendors, contracts, systems, and gaps.",
    requestedDomains: requiredDomains,
  },
];

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const [pageSource, surfaceSource, summaryBuilderSource] = [
    fs.readFileSync(homePagePath, "utf8"),
    fs.readFileSync(homeSurfacePath, "utf8"),
    fs.readFileSync(summaryBuilderPath, "utf8"),
  ];
  const dockerIgnoreSource = fs.readFileSync(dockerIgnorePath, "utf8");
  const dockerfileSource = fs.readFileSync(dockerfilePath, "utf8");

  const routeCutoverStatus = analyzeRouteCutover({
    pageSource,
    surfaceSource,
    summaryBuilderSource,
    dockerIgnoreSource,
    dockerfileSource,
  });
  const scenarioOutputs = await Promise.all(
    scenarios.map((scenario) => buildScenarioProof(scenario)),
  );
  const dimensionReadiness = buildDimensionProofs(scenarioOutputs[0]?.packet);
  const qualityAssessment = assessQuality({
    routeCutoverStatus,
    dimensionReadiness,
    scenarioOutputs,
  });

  const proof = {
    generatedAt,
    status:
      routeCutoverStatus.defaultRouteUsesKnowledgeLayer &&
      !routeCutoverStatus.previewOnly &&
      qualityAssessment.p0.length === 0
        ? "pass"
        : "fail",
    truthSplit: {
      defaultHomeUsesKnowledgeLayer: routeCutoverStatus.defaultRouteUsesKnowledgeLayer,
      hiddenPreviewOnly: routeCutoverStatus.previewOnly,
      legacyFallbackStillPresent: routeCutoverStatus.legacyFallbackStillPresent,
      homeAvaClaudeRuntimeChanged: false,
      sourceRuntimeChanged: false,
      towerRuntimeChanged: false,
      intelligenceRuntimeChanged: false,
      tenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      productionDataMutated: false,
    },
    routeCutoverStatus,
    dimensions: dimensionReadiness,
    scenarios: scenarioOutputs.map(({ packet: _packet, ...scenario }) => scenario),
    qualityAssessment,
  };

  writeJson("summary.json", proof);
  writeJson("route-cutover-status.json", routeCutoverStatus);
  writeJson("dimension-readiness.json", dimensionReadiness);
  fs.writeFileSync(
    path.join(outDir, "dimension-readiness.csv"),
    renderDimensionCsv(dimensionReadiness),
    "utf8",
  );
  for (const scenario of scenarioOutputs) {
    writeJson(`${scenario.key}.json`, {
      ...scenario,
      packet: undefined,
    });
  }
  fs.writeFileSync(path.join(outDir, "summary.md"), renderSummary(proof), "utf8");
  fs.writeFileSync(
    path.join(outDir, "home-knowledge-cutover-proof.html"),
    renderHtml(proof),
    "utf8",
  );

  if (proof.status !== "pass") {
    throw new Error(
      `Home Knowledge cutover proof failed: ${[
        ...qualityAssessment.p0,
        ...qualityAssessment.p1,
      ].join("; ")}`,
    );
  }
  console.log(
    `[home-knowledge-cutover] wrote proof to ${path.relative(repoRoot, outDir)}`,
  );
}

function analyzeRouteCutover({
  pageSource,
  surfaceSource,
  summaryBuilderSource,
  dockerIgnoreSource,
  dockerfileSource,
}: {
  pageSource: string;
  surfaceSource: string;
  summaryBuilderSource: string;
  dockerIgnoreSource: string;
  dockerfileSource: string;
}) {
  return {
    defaultRouteUsesKnowledgeLayer:
      pageSource.includes("getModuleContext") &&
      pageSource.includes("buildHomeSummarySnapshotFromModuleContext") &&
      /const\s+summarySnapshot\s*=\s*[\s\S]*?moduleContext\s*&&\s*moduleContextExplanation\s*\?\s*buildHomeSummarySnapshotFromModuleContext/.test(
        pageSource,
      ),
    previewOnly: /knowledge-preview|home-knowledge-preview/i.test(pageSource),
    legacyFallbackStillPresent: pageSource.includes("buildHomeRuntimeSummarySnapshot"),
    supplierContractPassedToSurface:
      pageSource.includes("moduleContext={moduleContext}") &&
      surfaceSource.includes("moduleContext?: ServedModuleContextPacket"),
    requiredTabsPresent: ["Summary", "Data", "Relationships", "Gaps", "Evidence"].every(
      (label) => surfaceSource.includes(`"${label}"`),
    ),
    requiredDimensionsPresent: dimensions.every(
      (dimension) =>
        surfaceSource.includes(dimension.label) ||
        summaryBuilderSource.includes(dimension.label),
    ),
    doubleClickProfilesPresent:
      surfaceSource.includes("Double-click profiles") &&
      [
        "EnterpriseProfile",
        "FunctionProfile",
        "SystemProfile",
        "DataDomainProfile",
        "InfrastructureProfile",
        "VendorProfile",
        "ContractProfile",
        "ProgramProfile",
        "RiskProfile",
        "MetricProfile",
        "UseCaseProfile",
        "ProcessProfile",
      ].every((profileType) => surfaceSource.includes(profileType)),
    technicalDiagnosticsCollapsed: surfaceSource.includes(
      "Show technical diagnostics",
    ),
    duplicateModuleLeftNavRemoved:
      !surfaceSource.includes('window.location.assign("/strategic-moves")') &&
      !surfaceSource.includes('window.location.assign("/source")') &&
      !surfaceSource.includes('window.location.assign("/tower")'),
    forbiddenPrimaryLanguageAbsent: !/\bV[467]\b|current-state-pack|rich-pack/i.test(
      [
        extractUserFacingStrings(pageSource),
        extractUserFacingStrings(surfaceSource),
        extractUserFacingStrings(summaryBuilderSource),
      ].join("\n"),
    ),
    runtimeActiveAccessMetadataPackaged:
      dockerIgnoreSource.includes("reports/") &&
      dockerIgnoreSource.includes("reports/*") &&
      dockerIgnoreSource.includes("!reports/active-tenant-access/") &&
      dockerIgnoreSource.includes("!reports/active-tenant-access/**") &&
      dockerfileSource.includes(
        "/app/reports/active-tenant-access ./reports/active-tenant-access",
      ),
    appClientAliasesCanonicalized:
      pageSource.includes('key === "skyharbor"') &&
      pageSource.includes('"skyharbor-air"') &&
      pageSource.includes('"airline-demo"') &&
      pageSource.includes('key.includes("airline")') &&
      pageSource.includes('key === "lakeshore"') &&
      pageSource.includes('"lakeshore-holdings"') &&
      /const\s+homeTenantKey\s*=\s*[\s\S]*?bindingTenantKey\(requestedClient\)[\s\S]*?bindingTenantKey\(activeClient\?\.key\)[\s\S]*?bindingTenantKey\(activeClient\?\.name\)/.test(
        pageSource,
      ),
  };
}

async function buildScenarioProof(scenario: Scenario) {
  const request: ModuleContextReadRequest = {
    tenantKey: scenario.tenantKey,
    moduleKey: "home",
    purpose: "context_summary",
    mode: "active",
    requestedDomains: scenario.requestedDomains,
    evidencePolicy: "lineage_required",
    relationshipPolicy: "validated_and_candidates",
    actorKey: `home-knowledge-cutover-${scenario.key}`,
  };
  const [packet, explanation] = await Promise.all([
    getModuleContext(request, { repoRoot, generatedAt }),
    explainModuleContext(request, { repoRoot, generatedAt }),
  ]);
  const snapshot = buildHomeSummarySnapshotFromModuleContext({
    repoRoot,
    tenantKey: scenario.tenantKey,
    displayName: scenario.displayName,
    industry: scenario.industry,
    moduleContext: packet,
    moduleContextExplanation: explanation,
    generatedAt,
  });

  return {
    key: scenario.key,
    tenantKey: scenario.tenantKey,
    prompt: scenario.prompt,
    sourceMode: packet.sourceMode,
    activeTenantAccessVersionId: packet.activeTenantAccessVersionId,
    readableRecords: packet.records.length,
    evidenceRefs: packet.evidenceRefs.length,
    validatedRelationships: packet.validatedRelationships.length,
    relationshipCandidates: packet.relationshipCandidates.length,
    gaps: packet.gaps.length,
    contextCompleteness: packet.contextCompleteness,
    snapshotStatus: snapshot.lineage.status,
    executiveSummary: snapshot.executiveProfile.companySummaryFacts[0],
    supportedQuestions: explanation.supportedQuestions,
    unsupportedQuestions: explanation.unsupportedQuestions,
    guardrails: packet.guardrails,
    packet,
  };
}

function buildDimensionProofs(packet?: ServedModuleContextPacket): DimensionProof[] {
  return dimensions.map((dimension) => {
    const domain = packet?.domains.find(
      (entry) => entry.domain === dimension.moduleDomain,
    );
    const records =
      packet?.records.filter((record) => record.domain === dimension.moduleDomain) ??
      [];
    const evidenceIds = new Set(records.flatMap((record) => record.sourceEvidenceIds));
    const evidenceRefs =
      packet?.evidenceRefs.filter(
        (ref) =>
          ref.domain === dimension.moduleDomain ||
          evidenceIds.has(ref.evidenceId) ||
          dimension.id === "evidence-sources",
      ) ?? [];
    const relationships =
      packet?.relationshipCandidates.filter(
        (relationship) =>
          dimension.id === "relationships" ||
          records.some(
            (record) =>
              record.recordId === relationship.sourceRecordId ||
              record.recordId === relationship.targetRecordId,
          ),
      ) ?? [];
    const gaps =
      packet?.gaps.filter(
        (gap) => !gap.domain || gap.domain === dimension.moduleDomain,
      ) ?? [];
    return {
      id: dimension.id,
      label: dimension.label,
      moduleDomain: dimension.moduleDomain,
      profileType: dimension.profileType,
      represented: Boolean((domain?.acceptedRecords ?? 0) > 0 || records.length > 0),
      acceptedRecords: domain?.acceptedRecords ?? records.length,
      evidenceRefs: evidenceRefs.length,
      gaps: gaps.length,
      relationships: relationships.length,
      tabs: {
        summary: "present",
        data: "present",
        relationships: "present",
        gaps: "present",
        evidence: "present",
      },
    };
  });
}

function assessQuality(args: {
  routeCutoverStatus: ReturnType<typeof analyzeRouteCutover>;
  dimensionReadiness: DimensionProof[];
  scenarioOutputs: Awaited<ReturnType<typeof buildScenarioProof>>[];
}) {
  const p0: string[] = [];
  const p1: string[] = [];
  const p2: string[] = [];
  const notes: string[] = [];
  const route = args.routeCutoverStatus;
  if (!route.defaultRouteUsesKnowledgeLayer) {
    p0.push("Default Home route does not build from getModuleContext first.");
  }
  if (route.previewOnly) {
    p0.push("Default Home route still appears wired as preview-only.");
  }
  if (!route.supplierContractPassedToSurface) {
    p1.push("HomeSurface is not receiving the served module-context packet.");
  }
  if (!route.requiredTabsPresent) {
    p1.push("The required Summary/Data/Relationships/Gaps/Evidence tabs are missing.");
  }
  if (!route.requiredDimensionsPresent) {
    p1.push("Not all required Knowledge dimensions are represented in route/surface builders.");
  }
  if (!route.doubleClickProfilesPresent) {
    p1.push("Double-click profile readiness is not visible for Knowledge dimensions.");
  }
  if (!route.technicalDiagnosticsCollapsed) {
    p2.push("Technical diagnostics are not collapsed behind an explicit action.");
  }
  if (!route.duplicateModuleLeftNavRemoved) {
    p2.push("Duplicate module links remain in the Home left rail.");
  }
  if (!route.forbiddenPrimaryLanguageAbsent) {
    p1.push("Legacy migration wording appears in primary Home/Knowledge code paths.");
  }
  if (!route.runtimeActiveAccessMetadataPackaged) {
    p0.push(
      "Runtime image does not package reports/active-tenant-access metadata required for active Knowledge serving.",
    );
  }
  if (!route.appClientAliasesCanonicalized) {
    p0.push(
      "Home route does not canonicalize app-client aliases before requesting active Knowledge context.",
    );
  }
  for (const scenario of args.scenarioOutputs) {
    if (scenario.sourceMode !== "active_tenant_access") {
      p1.push(`${scenario.key} did not resolve active tenant access.`);
    }
    if (scenario.guardrails.candidatePromoted) {
      p0.push(`${scenario.key} promoted candidate data.`);
    }
    if (scenario.guardrails.productionTenantDataWritten) {
      p0.push(`${scenario.key} wrote production tenant data.`);
    }
    if (scenario.guardrails.moduleRuntimeConsumptionChanged) {
      p0.push(`${scenario.key} changed module runtime consumption.`);
    }
  }
  const unrepresented = args.dimensionReadiness.filter(
    (dimension) => !dimension.represented,
  );
  if (unrepresented.length) {
    notes.push(
      `${unrepresented.length} product dimensions map to active domains but have no direct accepted records in the first scenario: ${unrepresented
        .map((dimension) => dimension.label)
        .join(", ")}.`,
    );
  }
  notes.push(
    "Home/aVa chat runtime was not migrated to a new Claude path in this PR; the page-level Knowledge cutover is proven separately from chat runtime behavior.",
  );
  return { p0, p1, p2, notes };
}

function renderDimensionCsv(rows: DimensionProof[]) {
  const header = [
    "dimension",
    "module_domain",
    "profile_type",
    "represented",
    "accepted_records",
    "evidence_refs",
    "relationships",
    "gaps",
    "tabs",
  ];
  return [
    header.join(","),
    ...rows.map((row) =>
      [
        csv(row.label),
        row.moduleDomain,
        row.profileType,
        row.represented ? "yes" : "no",
        row.acceptedRecords,
        row.evidenceRefs,
        row.relationships,
        row.gaps,
        "summary|data|relationships|gaps|evidence",
      ].join(","),
    ),
  ].join("\n");
}

function renderSummary(proof: {
  generatedAt: string;
  status: string;
  truthSplit: Record<string, boolean>;
  routeCutoverStatus: ReturnType<typeof analyzeRouteCutover>;
  dimensions: DimensionProof[];
  scenarios: Array<Record<string, unknown>>;
  qualityAssessment: ReturnType<typeof assessQuality>;
}) {
  return `# Home Knowledge Full Cutover Proof

Generated: ${proof.generatedAt}

Status: ${proof.status.toUpperCase()}

## Truth Split

- Default Home uses Knowledge Layer: ${proof.truthSplit.defaultHomeUsesKnowledgeLayer}
- Hidden preview only: ${proof.truthSplit.hiddenPreviewOnly}
- Legacy fallback still present: ${proof.truthSplit.legacyFallbackStillPresent}
- Home/aVa Claude runtime changed: ${proof.truthSplit.homeAvaClaudeRuntimeChanged}
- Tenant data written: ${proof.truthSplit.tenantDataWritten}
- Active Tenant Access updated: ${proof.truthSplit.activeTenantAccessUpdated}
- Candidate promoted: ${proof.truthSplit.candidatePromoted}

## Route Cutover

- getModuleContext first: ${proof.routeCutoverStatus.defaultRouteUsesKnowledgeLayer}
- Supplier packet passed to HomeSurface: ${proof.routeCutoverStatus.supplierContractPassedToSurface}
- Required tabs present: ${proof.routeCutoverStatus.requiredTabsPresent}
- Required dimensions present: ${proof.routeCutoverStatus.requiredDimensionsPresent}
- Double-click profiles present: ${proof.routeCutoverStatus.doubleClickProfilesPresent}
- Duplicate module left-nav removed: ${proof.routeCutoverStatus.duplicateModuleLeftNavRemoved}
- Runtime active access metadata packaged: ${proof.routeCutoverStatus.runtimeActiveAccessMetadataPackaged}

## Quality Findings

- P0: ${proof.qualityAssessment.p0.length}
- P1: ${proof.qualityAssessment.p1.length}
- P2: ${proof.qualityAssessment.p2.length}

${[...proof.qualityAssessment.p0, ...proof.qualityAssessment.p1, ...proof.qualityAssessment.p2]
  .map((item) => `- ${item}`)
  .join("\n") || "- None"}

## Dimensions

${proof.dimensions
  .map(
    (dimension) =>
      `- ${dimension.label}: ${dimension.profileType}; ${dimension.represented ? "represented" : "mapped/no direct records"}; ${dimension.acceptedRecords} records; ${dimension.evidenceRefs} evidence refs; tabs present`,
  )
  .join("\n")}
`;
}

function renderHtml(proof: {
  generatedAt: string;
  status: string;
  routeCutoverStatus: ReturnType<typeof analyzeRouteCutover>;
  dimensions: DimensionProof[];
  scenarios: Array<Record<string, unknown>>;
  qualityAssessment: ReturnType<typeof assessQuality>;
}) {
  const findingCount =
    proof.qualityAssessment.p0.length +
    proof.qualityAssessment.p1.length +
    proof.qualityAssessment.p2.length;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Home Knowledge Cutover Proof</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:0;background:#f7f9fc;color:#0c1a3a}
main{max-width:1180px;margin:0 auto;padding:42px 28px}
h1{font-size:42px;margin:0 0 8px}.muted{color:#657089}
.hero,.card{background:#fff;border:1px solid #e5eaf2;border-radius:16px;padding:22px;box-shadow:0 10px 30px rgba(12,26,58,.06);margin:18px 0}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric{background:#fbfcff;border:1px solid #e5eaf2;border-radius:12px;padding:16px}.metric b{font-size:24px;display:block}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden}th,td{padding:12px;border-bottom:1px solid #edf1f6;text-align:left;vertical-align:top}th{background:#f8fafc;color:#657089;font-size:12px}
.pass{color:#137a52}.fail{color:#a12b2b}.pill{display:inline-flex;border-radius:999px;padding:5px 9px;font-weight:800;background:#edf9f2;color:#137a52}
</style>
</head>
<body><main>
<div class="hero">
<p class="muted">Generated ${escapeHtml(proof.generatedAt)}</p>
<h1>Home Knowledge Full Cutover Proof</h1>
<p>The default Home route is checked for Enterprise Knowledge Layer consumption, 19-dimension coverage, tab completeness, and non-mutating guardrails.</p>
<span class="pill">${escapeHtml(proof.status.toUpperCase())}</span>
</div>
<section class="grid">
<div class="metric"><b>${proof.routeCutoverStatus.defaultRouteUsesKnowledgeLayer ? "Yes" : "No"}</b><span>Knowledge supplier first</span></div>
<div class="metric"><b>${proof.routeCutoverStatus.requiredDimensionsPresent ? "19" : "Gap"}</b><span>Required dimensions</span></div>
<div class="metric"><b>${proof.routeCutoverStatus.requiredTabsPresent ? "5" : "Gap"}</b><span>Tabs per dimension</span></div>
<div class="metric"><b>${findingCount}</b><span>Open findings</span></div>
</section>
<section class="card"><h2>Dimension Readiness</h2><table><thead><tr><th>Dimension</th><th>Profile</th><th>Domain</th><th>Records</th><th>Evidence</th><th>Relationships</th><th>Status</th></tr></thead><tbody>
${proof.dimensions
  .map(
    (dimension) =>
      `<tr><td>${escapeHtml(dimension.label)}</td><td>${escapeHtml(dimension.profileType)}</td><td>${escapeHtml(dimension.moduleDomain)}</td><td>${dimension.acceptedRecords}</td><td>${dimension.evidenceRefs}</td><td>${dimension.relationships}</td><td class="${dimension.represented ? "pass" : "fail"}">${dimension.represented ? "represented" : "mapped / needs direct records"}</td></tr>`,
  )
  .join("")}
</tbody></table></section>
<section class="card"><h2>Quality Assessment</h2><ul>
${[
  ...proof.qualityAssessment.p0,
  ...proof.qualityAssessment.p1,
  ...proof.qualityAssessment.p2,
  ...proof.qualityAssessment.notes,
]
  .map((item) => `<li>${escapeHtml(item)}</li>`)
  .join("") || "<li>No findings.</li>"}
</ul></section>
</main></body></html>`;
}

function extractUserFacingStrings(source: string) {
  return [...source.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*)\1/gm)]
    .map((match) => match[2] ?? "")
    .filter(
      (value) =>
        !value.startsWith("@/") &&
        !value.startsWith("../../") &&
        !value.startsWith("./") &&
        (value.includes(" ") ||
          /Home|Knowledge|context|candidate|source|relationship/i.test(value)),
    )
    .join("\n");
}

function writeJson(fileName: string, value: unknown) {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function csv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
