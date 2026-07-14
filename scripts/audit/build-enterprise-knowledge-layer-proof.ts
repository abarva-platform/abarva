#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type {
  CanonicalFact,
  ContextGap,
  ContextPack,
  EntityProfile,
  EvidenceRef,
  HomeKnowledgePack,
  IntelligenceContextPack,
  MovesContextPack,
  ModuleContextResponse,
  SourceContextPack,
  TowerContextPack,
  RelationshipEdge,
  UnsupportedClaim,
} from "../../src/lib/enterprise-knowledge/contracts";

type SemanticReport = {
  codename: string;
  tenants: Array<{
    tenant_key: string;
    tenant_name: string;
    cluster_assessments: Array<{
      cluster: string;
      rowsMatched: number;
      painPointsPresent: number;
      evidenceItemsPresent: number;
      metricsPresent: number;
      issuesPresent: number;
      modernizationDependenciesPresent: number;
      relationshipsPresent: number;
      pass: boolean;
      painPoints: string[];
      evidenceItems: string[];
      metrics: string[];
      issues: string[];
      modernizationDependencies: string[];
    }>;
  }>;
};

type FixtureKey =
  | "meridian-finance-analytics"
  | "meridian-agent-assist"
  | "harbortrust-fraud-copilot";

type FixtureDefinition = {
  fixtureKey: FixtureKey;
  tenantKey: string;
  tenantName: string;
  clusterName: string;
  primaryFunction: string;
  useCase: string;
  systems: string[];
  dataDomains: string[];
  infrastructure: string[];
  vendorsContracts: string[];
  programs: string[];
  risks: string[];
  modulePacks: Array<"home" | "intelligence" | "moves" | "source" | "tower">;
  movesPhase?: MovesContextPack["phase"];
  towerRelevant?: boolean;
  sourceRelevant?: boolean;
};

const repoRoot = process.cwd();
const generatedAt =
  process.env.KNOWLEDGE_LAYER_PROOF_GENERATED_AT ?? "2026-07-14T00:00:00.000Z";
const outDir = path.join(repoRoot, "reports/enterprise-knowledge-layer/design-proof");
const semanticReportPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/generated/context-template-v3-semantic-depth-fix1-report.json",
);

const fixtureDefinitions: FixtureDefinition[] = [
  {
    fixtureKey: "meridian-finance-analytics",
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    clusterName: "Finance Analytics",
    primaryFunction: "Finance Analytics",
    useCase: "Finance close and spend analytics modernization",
    systems: [
      "Oracle ERP Finance",
      "SQL Server Finance Mart",
      "Informatica Finance ETL",
      "Tableau and Power BI finance dashboards",
      "Databricks Finance Gold",
    ],
    dataDomains: ["GL", "AP", "AR", "vendor spend", "budget", "cost center"],
    infrastructure: ["SQL Server reporting estate", "Databricks on AWS target foundation"],
    vendorsContracts: ["Oracle", "Microsoft", "Informatica", "Databricks", "Tableau"],
    programs: ["Databricks Finance Gold certification", "vendor master harmonization"],
    risks: ["inconsistent vendor spend definitions", "slow close-window dashboards"],
    modulePacks: ["home", "tower", "source", "intelligence"],
    towerRelevant: true,
    sourceRelevant: true,
  },
  {
    fixtureKey: "meridian-agent-assist",
    tenantKey: "meridian-health",
    tenantName: "Meridian Health",
    clusterName: "Agent Assist / Member Service",
    primaryFunction: "Member Service and Contact Center",
    useCase: "Member service agent assist",
    systems: [
      "Genesys Cloud",
      "Salesforce Health Cloud",
      "Claims administration platform",
      "Eligibility and benefits platform",
      "Knowledge base and call transcript store",
    ],
    dataDomains: ["call transcript", "case disposition", "claims status", "eligibility", "benefits"],
    infrastructure: ["contact center integration layer", "audited Claude answer packet"],
    vendorsContracts: ["Genesys", "Salesforce", "claims platform managed services"],
    programs: ["member-service AI assist", "knowledge article cleanup"],
    risks: ["PHI handling", "human-in-the-loop approval", "stale knowledge article duplicates"],
    modulePacks: ["home", "moves", "intelligence"],
    movesPhase: "P2 Diagnose & Evidence Pressure-Test",
  },
  {
    fixtureKey: "harbortrust-fraud-copilot",
    tenantKey: "harbortrust-bank",
    tenantName: "HarborTrust Bank",
    clusterName: "Fraud Analyst Copilot",
    primaryFunction: "Fraud Operations",
    useCase: "Fraud analyst copilot",
    systems: [
      "Fraud alert platform",
      "Fraud case management",
      "AML transaction monitoring",
      "Digital onboarding KYC",
      "Fraud feature store",
    ],
    dataDomains: ["fraud alerts", "case outcomes", "AML transactions", "device risk", "model score"],
    infrastructure: ["real-time fraud decisioning", "model governance evaluation set"],
    vendorsContracts: ["KYC vendor", "device intelligence vendor", "core banking provider"],
    programs: ["fraud analyst copilot", "feature-store feedback loop"],
    risks: ["model version lineage gaps", "case outcome feedback gaps", "queue aging mixed with model quality signals"],
    modulePacks: ["home", "moves", "intelligence", "source"],
    movesPhase: "P2 Diagnose & Evidence Pressure-Test",
    sourceRelevant: true,
  },
];

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function evidenceRefs(def: FixtureDefinition, evidenceItems: string[]): EvidenceRef[] {
  return evidenceItems.map((item, index) => ({
    evidenceId: `${def.fixtureKey}-evidence-${index + 1}`,
    tenantKey: def.tenantKey,
    sourceLabel: item,
    sourceType: "generated_fixture",
    authority: "synthetic",
    truthStatus: "synthetic_review",
    sourcePath: `datasets/tenant-inputs/generated/${def.tenantKey}/standard-2026-07-v3`,
    excerpt: item,
    asOfDate: "2026-07-14",
    sourceOwner: "AbarVa synthetic fixture generator",
    sensitivity: "internal",
    confidence: 0.78,
    citationStatus: "needs_review",
  }));
}

function makeFact(
  def: FixtureDefinition,
  subjectEntityId: string,
  predicate: string,
  value: string,
  evidence: EvidenceRef[],
  index: number,
): CanonicalFact {
  return {
    factId: `${def.fixtureKey}-fact-${index + 1}`,
    tenantKey: def.tenantKey,
    domain: predicate.includes("metric") ? "metrics_outcomes" : "functions",
    subjectEntityId,
    predicate,
    value,
    valueType: "string",
    evidenceRefs: evidence.slice(index % evidence.length, (index % evidence.length) + 1),
    truthStatus: "synthetic_review",
    confidence: "medium",
    caveats: ["Synthetic review fixture; requires tenant validation before active use."],
    inferred: false,
  };
}

function makeGap(def: FixtureDefinition, description: string, index: number): ContextGap {
  return {
    gapId: `${def.fixtureKey}-gap-${index + 1}`,
    tenantKey: def.tenantKey,
    category: index % 2 === 0 ? "missing_relationship" : "missing_evidence",
    severity: index === 0 ? "blocker" : "warning",
    title: `Validate ${def.clusterName} ${index + 1}`,
    description,
    affectedEntityIds: [`${def.fixtureKey}-function`],
    requiredEvidence: [
      "owner attestation",
      "source extract date",
      "relationship validation",
      "measured baseline where metrics are used",
    ],
    truthStatus: "synthetic_review",
    evidenceRefs: [],
    blocksActivePromotion: true,
    blocksModuleAnswer: index === 0,
  };
}

function makeProfile(
  def: FixtureDefinition,
  entityType: EntityProfile["entityType"],
  entityName: string,
  evidence: EvidenceRef[],
  gaps: ContextGap[],
  facts: CanonicalFact[],
): EntityProfile {
  const id = `${def.fixtureKey}-${entityType}-${slug(entityName)}`;
  return {
    profileId: id,
    tenantKey: def.tenantKey,
    entityType,
    entityName,
    businessMeaning: `${entityName} is part of the ${def.clusterName} context needed to explain ${def.useCase}.`,
    currentStateSummary: `${def.tenantName} has source-backed synthetic review evidence for ${entityName}, but the profile remains candidate-only until validated.`,
    targetStateDirection: `Use validated evidence to support ${def.useCase} decisions without flattening the context into generic rows.`,
    operatingRole: entityType === "function" ? def.primaryFunction : undefined,
    relatedFunctions: [def.primaryFunction],
    relatedSystems: def.systems,
    relatedDataDomains: def.dataDomains,
    relatedInfrastructure: def.infrastructure,
    relatedVendorsContracts: def.vendorsContracts,
    relatedSpend: def.towerRelevant ? ["budget", "vendor spend", "run/change/transform"] : [],
    relatedPrograms: def.programs,
    relatedRisksControls: def.risks,
    relatedMetricsOutcomes: [],
    relatedUseCases: [def.useCase],
    facts,
    relationships: [],
    evidenceRefs: evidence,
    confidence: 0.78,
    knownGaps: gaps,
    caveats: ["Candidate review fixture; not active tenant truth."],
    truthStatus: "synthetic_review",
    sourceLineage: [
      "PR #4802 semantic-depth proof report",
      `datasets/tenant-inputs/generated/${def.tenantKey}/standard-2026-07-v3`,
    ],
    asOfDate: "2026-07-14",
    moduleReadiness: "needs_review",
  };
}

function makeRelationships(
  def: FixtureDefinition,
  profiles: EntityProfile[],
  evidence: EvidenceRef[],
): RelationshipEdge[] {
  const functionProfile = profiles.find((profile) => profile.entityType === "function") ?? profiles[0];
  return profiles
    .filter((profile) => profile.profileId !== functionProfile.profileId)
    .map((profile, index) => ({
      relationshipId: `${def.fixtureKey}-edge-${index + 1}`,
      tenantKey: def.tenantKey,
      sourceEntityId: functionProfile.profileId,
      sourceEntityType: functionProfile.entityType,
      targetEntityId: profile.profileId,
      targetEntityType: profile.entityType,
      relationshipType: index % 3 === 0 ? "uses" : index % 3 === 1 ? "depends_on" : "measures",
      businessMeaning: `${functionProfile.entityName} ${index % 3 === 0 ? "uses" : index % 3 === 1 ? "depends on" : "measures"} ${profile.entityName} for ${def.useCase}.`,
      evidenceRefs: evidence.slice(index % evidence.length, (index % evidence.length) + 1),
      truthStatus: "synthetic_review",
      readiness: "candidate",
      confidence: 0.74,
      caveats: ["Relationship is design-fixture evidence and requires tenant validation."],
    }));
}

function unsupportedClaims(def: FixtureDefinition): UnsupportedClaim[] {
  const common: UnsupportedClaim[] = [
    {
      claimId: `${def.fixtureKey}-unsupported-active-truth`,
      description: "This fixture proves active tenant truth.",
      reason: "candidate_only",
    },
    {
      claimId: `${def.fixtureKey}-unsupported-realized-value`,
      description: "This fixture proves realized value or savings.",
      reason: "requires_measured_value",
    },
  ];
  if (def.towerRelevant) {
    common.push({
      claimId: `${def.fixtureKey}-unsupported-tower-outcome`,
      description: "Tower can report measured outcomes from this fixture.",
      reason: "requires_measured_value",
    });
  }
  return common;
}

function claudeReadyContextPayload(
  def: FixtureDefinition,
  moduleKey: ContextPack["moduleKey"],
  evidence: EvidenceRef[],
  unsupported: UnsupportedClaim[],
) {
  return {
    systemInstruction:
      "Answer only from the supplied context pack. Cite evidence refs. Mark inference. Do not convert synthetic fixture data into active tenant truth.",
    contextSummary: `${def.clusterName} context for ${moduleKey}: entity profiles, relationship candidates, evidence refs, gaps, and confidence are available as a governed design fixture.`,
    evidenceRefs: evidence.map((ref) => ref.evidenceId),
    mustCiteEvidence: true,
    mustMarkInference: true,
    unsupportedClaims: unsupported.map((claim) => claim.description),
    excludesAuditOnlyDiagnostics: true,
    excludesInactiveCandidateContextUnlessRequested: true,
    excludesSourceAdapterOnlyFactsUnlessRequested: true,
  } as const;
}

function packBase(
  def: FixtureDefinition,
  moduleKey: ContextPack["moduleKey"],
  profiles: EntityProfile[],
  facts: CanonicalFact[],
  relationships: RelationshipEdge[],
  evidence: EvidenceRef[],
  gaps: ContextGap[],
): ContextPack {
  const heldBackClaims = unsupportedClaims(def);
  return {
    contextPackId: `${def.fixtureKey}-${moduleKey}-pack`,
    tenantKey: def.tenantKey,
    moduleKey,
    purpose:
      moduleKey === "tower"
        ? "measurement_context"
        : moduleKey === "source"
          ? "sourcing_context"
          : moduleKey === "moves"
            ? "phase_readiness"
            : moduleKey === "intelligence"
              ? "strategy_context"
              : "executive_orientation",
    mode: "synthetic_fixture",
    truthStatus: "synthetic_review",
    executiveSummary: `${def.clusterName} can be represented as connected entity profiles, facts, relationships, evidence, confidence, and gaps for ${moduleKey}.`,
    relevantEntityProfiles: profiles,
    facts,
    relationships: [],
    relationshipCandidates: relationships,
    metrics: facts.filter((fact) => fact.predicate.includes("metric")),
    risks: profiles.filter((profile) => profile.entityType === "risk"),
    evidence,
    gaps,
    confidenceSummary: {
      breadth: 82,
      depth: 78,
      relationshipCoverage: 64,
      evidenceCoverage: 80,
      answerability: 72,
      overall: "good",
      rationale: "The fixture has rich cluster-specific evidence, but it is not active tenant truth and relationships are candidate-only.",
    },
    caveats: ["Synthetic review data; tenant validation required before active module consumption."],
    excludedCandidateOnlyContext: [],
    unsupportedClaims: heldBackClaims,
    recommendedNextEvidence: [
      "source-owner attestation",
      "measured baseline extract",
      "validated relationship review",
      "candidate-to-active promotion decision",
    ],
    assemblyTrace: {
      assemblerVersion: "knowledge-layer-design-pr1",
      generatedAt,
      inputSources: [semanticReportPath],
      includedEntityIds: profiles.map((profile) => profile.profileId),
      excludedEntityIds: [],
      includedEvidenceIds: evidence.map((ref) => ref.evidenceId),
      excludedEvidenceIds: [],
      ruleHits: [
        "active-context-default-preserved",
        "candidate-fixture-labelled",
        "unsupported-realized-value-claims-excluded",
        "relationships-candidate-only",
      ],
    },
    truthBoundary: {
      activeTenantContextDefault: true,
      candidatePreviewExplicitlyRequested: false,
      candidateContextIncluded: false,
      sourceAdapterRowsActive: false,
      activeTenantAccessUpdated: false,
      productionTenantDataWritten: false,
      candidatePromoted: false,
      moduleRuntimeBehaviorChanged: false,
    },
    claudeReadyContextPayload: claudeReadyContextPayload(
      def,
      moduleKey,
      evidence,
      heldBackClaims,
    ),
  };
}

function responseFor(pack: ContextPack): ModuleContextResponse {
  return {
    requestId: `${pack.contextPackId}-response`,
    generatedAt,
    contextPack: pack,
    explanation: {
      summary: pack.executiveSummary,
      strengths: [
        "Cluster-specific entities are preserved.",
        "Evidence refs and gaps stay attached to the pack.",
        "Candidate-only truth boundaries are explicit.",
      ],
      limitations: pack.caveats,
      supportedQuestions: [
        "What does AbarVa know from this fixture?",
        "Which systems, data domains, risks, and metrics are connected?",
      ],
      unsupportedQuestions: pack.unsupportedClaims.map((claim) => claim.description),
      nextActions: pack.recommendedNextEvidence,
    },
    claudeReadyPayload: pack.claudeReadyContextPayload,
  };
}

function buildFixture(def: FixtureDefinition, report: SemanticReport) {
  const tenant = report.tenants.find((item) => item.tenant_key === def.tenantKey);
  const cluster = tenant?.cluster_assessments.find((item) => item.cluster === def.clusterName);
  if (!cluster || !cluster.pass) {
    throw new Error(`Missing passing semantic-depth cluster for ${def.fixtureKey}`);
  }
  const evidence = evidenceRefs(def, cluster.evidenceItems);
  const gaps = cluster.issues.map((issue, index) => makeGap(def, issue, index));
  const functionEntityId = `${def.fixtureKey}-function`;
  const facts = [
    ...cluster.painPoints.map((point, index) => makeFact(def, functionEntityId, "pain_point", point, evidence, index)),
    ...cluster.metrics.map((metric, index) => makeFact(def, functionEntityId, "metric", metric, evidence, index + 20)),
    ...cluster.modernizationDependencies.map((dependency, index) =>
      makeFact(def, functionEntityId, "modernization_dependency", dependency, evidence, index + 40),
    ),
  ];
  const profiles = [
    makeProfile(def, "function", def.primaryFunction, evidence, gaps, facts),
    ...def.systems.map((name) => makeProfile(def, "system", name, evidence, gaps, facts)),
    ...def.dataDomains.map((name) => makeProfile(def, "data_domain", name, evidence, gaps, facts)),
    ...def.infrastructure.map((name) => makeProfile(def, "infrastructure", name, evidence, gaps, facts)),
    ...def.vendorsContracts.map((name) => makeProfile(def, "vendor", name, evidence, gaps, facts)),
    ...def.programs.map((name) => makeProfile(def, "program", name, evidence, gaps, facts)),
    ...def.risks.map((name) => makeProfile(def, "risk", name, evidence, gaps, facts)),
  ];
  const relationships = makeRelationships(def, profiles, evidence);
  const packs = def.modulePacks.map((moduleKey) => {
    const base = packBase(def, moduleKey, profiles, facts, relationships, evidence, gaps);
    if (moduleKey === "home") {
      return { ...base, moduleKey, supportsDoubleClickProfiles: true } satisfies HomeKnowledgePack;
    }
    if (moduleKey === "intelligence") {
      return { ...base, moduleKey, boardQualityContextRequired: true } satisfies IntelligenceContextPack;
    }
    if (moduleKey === "moves") {
      return {
        ...base,
        moduleKey,
        phase: def.movesPhase ?? "P1 Charter & Baseline",
      } satisfies MovesContextPack;
    }
    if (moduleKey === "source") {
      return { ...base, moduleKey, sourcingScopeIncluded: true } satisfies SourceContextPack;
    }
    return {
      ...base,
      moduleKey: "tower",
      realizedValueRequiresMeasuredEvidence: true,
    } satisfies TowerContextPack;
  });
  const responses = packs.map(responseFor);
  return {
    fixtureKey: def.fixtureKey,
    tenantKey: def.tenantKey,
    tenantName: def.tenantName,
    clusterName: def.clusterName,
    semanticCluster: cluster,
    entityProfiles: profiles,
    relationshipGraph: relationships,
    packs,
    responses,
    gates: validateFixture(def, profiles, relationships, packs, responses),
  };
}

function validateFixture(
  def: FixtureDefinition,
  profiles: EntityProfile[],
  relationships: RelationshipEdge[],
  packs: ContextPack[],
  responses: ModuleContextResponse[],
) {
  const failures: string[] = [];
  if (profiles.length < 8) failures.push("too few entity profiles");
  if (!relationships.length) failures.push("no relationship candidates");
  if (!packs.some((pack) => pack.moduleKey === "home")) failures.push("missing HomeKnowledgePack");
  for (const expected of def.modulePacks) {
    if (!packs.some((pack) => pack.moduleKey === expected)) failures.push(`missing ${expected} pack`);
  }
  for (const pack of packs) {
    if (!pack.evidence.length) failures.push(`${pack.contextPackId} missing evidence`);
    if (!pack.gaps.length) failures.push(`${pack.contextPackId} missing gaps`);
    if (!pack.unsupportedClaims.length) failures.push(`${pack.contextPackId} missing unsupported claims`);
    if (!pack.claudeReadyContextPayload.mustCiteEvidence) failures.push(`${pack.contextPackId} payload does not require citations`);
    if (!pack.claudeReadyContextPayload.mustMarkInference) failures.push(`${pack.contextPackId} payload does not require inference marking`);
    if (!pack.claudeReadyContextPayload.excludesAuditOnlyDiagnostics) failures.push(`${pack.contextPackId} payload includes audit-only diagnostics`);
    if (!pack.claudeReadyContextPayload.excludesInactiveCandidateContextUnlessRequested) failures.push(`${pack.contextPackId} payload can include inactive candidate context by default`);
    if (!pack.claudeReadyContextPayload.excludesSourceAdapterOnlyFactsUnlessRequested) failures.push(`${pack.contextPackId} payload can include source-adapter-only facts by default`);
    if (pack.truthBoundary.candidatePromoted) failures.push(`${pack.contextPackId} promotes candidate`);
    if (pack.truthBoundary.productionTenantDataWritten) failures.push(`${pack.contextPackId} writes production data`);
    if (pack.relationships.length > 0) failures.push(`${pack.contextPackId} treats candidate relationships as validated`);
  }
  for (const response of responses) {
    if (!response.claudeReadyPayload.mustCiteEvidence) failures.push(`${response.requestId} does not require citations`);
    if (!response.claudeReadyPayload.mustMarkInference) failures.push(`${response.requestId} does not require inference marking`);
  }
  return {
    pass: failures.length === 0,
    failures,
    profileCount: profiles.length,
    relationshipCandidateCount: relationships.length,
    packCount: packs.length,
    responseCount: responses.length,
  };
}

function renderMarkdown(fixtures: ReturnType<typeof buildFixture>[]): string {
  const lines = [
    "# Enterprise Knowledge Layer Design Proof",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Truth Split",
    "",
    "- This is an architecture and contract proof only.",
    "- No runtime module behavior changed.",
    "- No Active Tenant Access update occurred.",
    "- No production tenant data was written.",
    "- No synthetic fixture data was promoted to active tenant truth.",
    "",
    "## Fixture Results",
    "",
    "| Fixture | Tenant | Profiles | Relationship candidates | Packs | Result |",
    "| --- | --- | ---: | ---: | ---: | --- |",
    ...fixtures.map((fixture) =>
      `| ${fixture.clusterName} | ${fixture.tenantName} | ${fixture.gates.profileCount} | ${fixture.gates.relationshipCandidateCount} | ${fixture.gates.packCount} | ${fixture.gates.pass ? "PASS" : "FAIL"} |`,
    ),
    "",
    "## What Is Proved",
    "",
    "- Entity profiles can preserve business meaning, current state, target direction, evidence, confidence, caveats, and gaps.",
    "- Module packs can share one context-pack shape while supporting Home, Intelligence, Moves, Source, and Tower-specific rules.",
    "- Candidate/synthetic truth boundaries remain explicit and block active-truth overclaiming.",
    "- Claude-ready payloads can be generated from governed context packs with citation and inference requirements.",
  ];
  return `${lines.join("\n")}\n`;
}

function compactFixture(fixture: ReturnType<typeof buildFixture>) {
  return {
    fixtureKey: fixture.fixtureKey,
    tenantKey: fixture.tenantKey,
    tenantName: fixture.tenantName,
    clusterName: fixture.clusterName,
    semanticCluster: {
      rowsMatched: fixture.semanticCluster.rowsMatched,
      painPointsPresent: fixture.semanticCluster.painPointsPresent,
      evidenceItemsPresent: fixture.semanticCluster.evidenceItemsPresent,
      metricsPresent: fixture.semanticCluster.metricsPresent,
      issuesPresent: fixture.semanticCluster.issuesPresent,
      modernizationDependenciesPresent:
        fixture.semanticCluster.modernizationDependenciesPresent,
      relationshipsPresent: fixture.semanticCluster.relationshipsPresent,
      pass: fixture.semanticCluster.pass,
      painPoints: fixture.semanticCluster.painPoints,
      evidenceItems: fixture.semanticCluster.evidenceItems,
      metrics: fixture.semanticCluster.metrics,
      issues: fixture.semanticCluster.issues,
      modernizationDependencies:
        fixture.semanticCluster.modernizationDependencies,
    },
    gates: fixture.gates,
    entityProfiles: fixture.entityProfiles.map((profile) => ({
      profileId: profile.profileId,
      entityType: profile.entityType,
      entityName: profile.entityName,
      businessMeaning: profile.businessMeaning,
      truthStatus: profile.truthStatus,
      confidence: profile.confidence,
      moduleReadiness: profile.moduleReadiness,
      evidenceRefCount: profile.evidenceRefs.length,
      gapCount: profile.knownGaps.length,
      relatedSystems: profile.relatedSystems,
      relatedDataDomains: profile.relatedDataDomains,
      relatedRisksControls: profile.relatedRisksControls,
    })),
    relationshipGraph: fixture.relationshipGraph.map((edge) => ({
      relationshipId: edge.relationshipId,
      sourceEntityId: edge.sourceEntityId,
      targetEntityId: edge.targetEntityId,
      relationshipType: edge.relationshipType,
      businessMeaning: edge.businessMeaning,
      readiness: edge.readiness,
      truthStatus: edge.truthStatus,
      evidenceRefCount: edge.evidenceRefs.length,
    })),
    packs: fixture.packs.map((pack) => ({
      contextPackId: pack.contextPackId,
      moduleKey: pack.moduleKey,
      purpose: pack.purpose,
      mode: pack.mode,
      truthStatus: pack.truthStatus,
      profileCount: pack.relevantEntityProfiles.length,
      factCount: pack.facts.length,
      relationshipCandidateCount: pack.relationshipCandidates.length,
      evidenceCount: pack.evidence.length,
      gapCount: pack.gaps.length,
      unsupportedClaims: pack.unsupportedClaims,
      claudeReadyContextPayload: pack.claudeReadyContextPayload,
      confidenceSummary: pack.confidenceSummary,
      truthBoundary: pack.truthBoundary,
      assemblyRuleHits: pack.assemblyTrace.ruleHits,
    })),
    responses: fixture.responses.map((response) => ({
      requestId: response.requestId,
      contextPackId: response.contextPack.contextPackId,
      summary: response.explanation.summary,
      mustCiteEvidence: response.claudeReadyPayload.mustCiteEvidence,
      mustMarkInference: response.claudeReadyPayload.mustMarkInference,
      evidenceRefCount: response.claudeReadyPayload.evidenceRefs.length,
      unsupportedClaims: response.claudeReadyPayload.unsupportedClaims,
    })),
  };
}

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    if (char === '"') return "&quot;";
    return "&#39;";
  });
}

function renderHtml(fixtures: ReturnType<typeof buildFixture>[]): string {
  const cards = fixtures
    .map(
      (fixture) => `<section class="card">
        <p class="eyebrow">${htmlEscape(fixture.tenantName)}</p>
        <h2>${htmlEscape(fixture.clusterName)}</h2>
        <div class="metrics">
          <span>${fixture.gates.profileCount} profiles</span>
          <span>${fixture.gates.relationshipCandidateCount} relationship candidates</span>
          <span>${fixture.gates.packCount} packs</span>
        </div>
        <p>${htmlEscape(fixture.packs[0]?.executiveSummary ?? "")}</p>
        <h3>Unsupported claims held back</h3>
        <ul>${fixture.packs[0]?.unsupportedClaims.map((claim) => `<li>${htmlEscape(claim.description)}</li>`).join("")}</ul>
      </section>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Enterprise Knowledge Layer Design Proof</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f7f8fb; color: #07162f; }
    main { max-width: 1180px; margin: 0 auto; padding: 48px 28px; }
    h1 { font-size: 42px; line-height: 1.05; margin: 0 0 12px; }
    h2 { margin: 0 0 12px; font-size: 24px; }
    h3 { margin: 20px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #51617a; }
    .lede { font-size: 18px; color: #40516d; max-width: 880px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 28px; }
    .card { background: white; border: 1px solid #dce4ef; border-radius: 12px; padding: 22px; box-shadow: 0 18px 45px rgba(18, 38, 63, .06); }
    .eyebrow { margin: 0 0 8px; color: #0f766e; font-weight: 700; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
    .metrics { display: flex; flex-direction: column; gap: 8px; margin: 16px 0; }
    .metrics span { background: #eef6ff; border: 1px solid #d6e8ff; border-radius: 999px; padding: 8px 10px; font-size: 13px; font-weight: 700; }
    li { margin-bottom: 8px; color: #40516d; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Knowledge Layer Design Proof</p>
    <h1>Context packs before Claude reasoning</h1>
    <p class="lede">This report proves that the PR #4802 semantic-depth clusters can become governed entity profiles, relationship candidates, evidence-backed gaps, and module-specific context packs without becoming active tenant truth.</p>
    <div class="grid">${cards}</div>
  </main>
</body>
</html>
`;
}

function main(): void {
  const report = readJson<SemanticReport>(semanticReportPath);
  ensureDir(outDir);
  const fixtures = fixtureDefinitions.map((definition) => buildFixture(definition, report));
  const failures = fixtures.flatMap((fixture) => fixture.gates.failures.map((failure) => `${fixture.fixtureKey}: ${failure}`));
  if (failures.length) {
    throw new Error(`Enterprise knowledge layer proof failed:\n${failures.join("\n")}`);
  }

  const summary = {
    codename: "KNOWLEDGE-LAYER-DESIGN-PR1",
    generatedAt,
    sourceSemanticProof: path.relative(repoRoot, semanticReportPath),
    verdict: "PASS",
    truthSplit: {
      designBaselineOnly: true,
      runtimeBehaviorChanged: false,
      productionTenantDataWritten: false,
      activeTenantAccessUpdated: false,
      candidatePromoted: false,
      deployRequired: false,
    },
    fixtures: fixtures.map((fixture) => ({
      fixtureKey: fixture.fixtureKey,
      tenantKey: fixture.tenantKey,
      clusterName: fixture.clusterName,
      gates: fixture.gates,
      packIds: fixture.packs.map((pack) => pack.contextPackId),
    })),
  };
  writeJson("summary.json", summary);
  writeJson("fixture-meridian-finance-analytics.json", compactFixture(fixtures[0]));
  writeJson("fixture-meridian-agent-assist.json", compactFixture(fixtures[1]));
  writeJson("fixture-harbortrust-fraud-copilot.json", compactFixture(fixtures[2]));
  fs.writeFileSync(path.join(outDir, "summary.md"), renderMarkdown(fixtures));
  fs.writeFileSync(path.join(outDir, "context-pack-proof.html"), renderHtml(fixtures));
  console.log(`[enterprise-knowledge-layer-proof] PASS ${path.relative(repoRoot, outDir)}`);
}

main();
