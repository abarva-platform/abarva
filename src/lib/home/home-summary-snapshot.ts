import crypto from "node:crypto";

import type { AdminSetupControlResponse } from "@/lib/admin/setup-control";
import type {
  ModuleContextExplanation,
  ModuleContextRecord,
  ModuleContextRequestedDomain,
  ServedModuleContextPacket,
} from "@/lib/enterprise-data/contracts/module-context-apis";
import {
  formatEnterpriseEmployeeCount,
  formatEnterpriseRevenue,
  getEnterpriseProfileReadModel,
} from "@/lib/enterprise-data/enterprise-profile/enterprise-profile-read-model";
import type { HomeDataQualityModel } from "@/lib/home/home-data-quality";
import { buildHomeDataQualityModel } from "@/lib/home/home-data-quality";
import {
  buildHomeEnglishSummary,
  type HomeEnglishModuleImpact,
  type HomeEnglishSummary,
} from "@/lib/home/home-english-summary";
import type {
  HomeV6BrowserPreview,
  HomeV6ContextBrowser,
} from "@/lib/home/v6-context-browser";

export type HomeSummarySnapshotMode =
  | "active_home_context"
  | "candidate_preview";

export type HomeSummarySnapshotStatus =
  | "ready"
  | "ready_with_caveats"
  | "partial"
  | "blocked"
  | "not_available";

export interface HomeTenantProfileHeader {
  tenantId: string | null;
  tenantKey: string;
  displayName: string;
  legalName: string | null;
  industry: string | null;
  subIndustry: string | null;
  headquarters: string | null;
  revenue: string | null;
  revenueVerified: boolean;
  employees: string | null;
  employeesVerified: boolean;
  businessModel: string | null;
  businessSegments: string[];
  missionStatement: string | null;
  visionStatement: string | null;
  leadershipRoles: string[];
  strategicPriorities: string[];
  globalLocations: string[];
  sourceAsOfDate: string | null;
  sourceValidationStatus: string | null;
  knownGaps: string[];
  dataOrigin: string;
  mode: HomeSummarySnapshotMode;
  activeContextStatus: string;
  candidatePreviewStatus: string;
}

export interface HomeEnterpriseSnapshotMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
}

export interface HomeKnowledgeLayerVisualSpec {
  title: string;
  subtitle: string;
  centerLabel: string;
  centerDetail: string;
  nodes: Array<{
    id: string;
    label: string;
    detail: string;
    tone:
      | "enterprise"
      | "technology"
      | "commercial"
      | "data"
      | "delivery"
      | "risk"
      | "value";
    moduleUses: string[];
  }>;
  flow: Array<{
    label: string;
    detail: string;
  }>;
  caveat: string;
  generatedBy: "deterministic" | "claude";
}

export interface HomeContextDepthWidth {
  loadedAreas: number;
  loadedRecords: number;
  sourceCount: number;
  evidenceCount: number;
  relationshipCount: number;
  visibleGaps: number;
  contextPosture: string;
}

export interface HomeContextAreaSummary {
  areaKey: string;
  displayName: string;
  claudeExecutiveSummary?: string;
  claudeWhatAbarVaKnows?: string[];
  claudeWhyItMatters?: string;
  claudeSupportedQuestions?: string[];
  claudeUnsupportedQuestions?: string[];
  claudeNextDataAction?: string;
  claudeDataTabIntro?: string;
  claudeRelationshipsTabIntro?: string;
  claudeGapsTabIntro?: string;
  claudeEvidenceTabIntro?: string;
  executiveSummaryInputs: string[];
  loadedCount: number;
  mappedCount: number;
  sourceCount: number;
  evidenceCount: number;
  relationshipCount: number;
  examples: string[];
  topGaps: Array<{
    label: string;
    count: number;
    whyItMatters: string | null;
  }>;
  evidencePosture: string;
  relationshipDepth: string;
  answerability: string;
  safeQuestions: string[];
  unsupportedQuestions: string[];
  decisionsSupported: string[];
  decisionsNotReady: string[];
  nextDataActions: string[];
  caveats: string[];
}

export interface HomeDataQualitySummary {
  sourceCoverage: string;
  candidateCoverage: string;
  evidenceStrength: string;
  relationshipCoverage: string;
  manifestCompleteness: string;
  homeAvaRepresentationWarnings: string[];
  promotionBlockers: string[];
  answerabilityPosture: string;
}

export interface HomeAvaScope {
  canAnswer: string[];
  shouldCaveat: string[];
  mustRefuseOrMarkUnsupported: string[];
  suggestedPrompts: string[];
  sourceSnapshotReference: string;
}

export interface HomeSummaryLineage {
  generatedAt: string;
  generatedBy: "home_summary_engine";
  inputFingerprint: string;
  tenantDataVersionId: string | null;
  candidateVersionId: string | null;
  sourceSnapshotIds: string[];
  dataQualitySnapshotId: string | null;
  manifestProjectionSnapshotId: string | null;
  answerabilitySnapshotId: string | null;
  mode: HomeSummarySnapshotMode;
  status: HomeSummarySnapshotStatus;
}

export interface HomeExecutiveProfile {
  claudeExecutiveSummary?: string;
  knowledgeLayerVisual?: HomeKnowledgeLayerVisualSpec;
  companySummaryFacts: string[];
  businessModelSignals: string[];
  strategicPrioritySignals: string[];
  enterpriseSnapshotMetrics: HomeEnterpriseSnapshotMetric[];
  contextDepthWidth: HomeContextDepthWidth;
  whatAbarVaKnows: string[];
  whatIsMissing: string[];
  safeToAsk: string[];
  doNotRelyYet: string[];
  recommendedNextDataActions: string[];
  moduleImpact: HomeEnglishModuleImpact[];
}

export interface HomeSummarySnapshot {
  contractVersion: "home_summary_snapshot.v1";
  tenantProfileHeader: HomeTenantProfileHeader;
  executiveProfile: HomeExecutiveProfile;
  contextAreas: HomeContextAreaSummary[];
  moduleContextSummary?: HomeModuleContextSummary;
  dataQualitySummary: HomeDataQualitySummary;
  avaScope: HomeAvaScope;
  caveats: string[];
  guardrails: {
    deterministicBuilder: true;
    callsClaude: boolean;
    productionTenantDataWritten: false;
    activeTenantAccessLayerUpdated: false;
    candidatePromoted: false;
    moduleRuntimeConsumptionChanged: false;
    candidateReadByDefault: false;
    uploadsFiles: false;
    validatesFiles: false;
    createsCandidates: false;
  };
  lineage: HomeSummaryLineage;
}

export interface HomeModuleContextSummary {
  sourceMode: ServedModuleContextPacket["sourceMode"];
  activeTenantAccessVersionId: string | null;
  candidateVersionId: string | null;
  requestedDomains: Array<{
    domain: ModuleContextRequestedDomain;
    canonicalDomain: string;
    acceptedRecords: number;
    sourceRows: number;
    readiness: string;
  }>;
  readableRecords: number;
  evidenceRefs: number;
  validatedRelationships: number;
  relationshipCandidates: number;
  contextCompleteness: ServedModuleContextPacket["contextCompleteness"];
  explanationSummary: string;
  strengths: string[];
  limitations: string[];
  supportedQuestions: string[];
  unsupportedQuestions: string[];
  nextActions: string[];
}

export interface HomeSummarySnapshotBuildOptions {
  repoRoot?: string;
  tenantId?: string | null;
  tenantKey: string | null | undefined;
  displayName?: string | null;
  industry?: string | null;
  mode?: HomeSummarySnapshotMode;
  browser?: HomeV6ContextBrowser | null;
  setupControl?: AdminSetupControlResponse | null;
  dataQuality?: HomeDataQualityModel | null;
  englishSummary?: HomeEnglishSummary | null;
  generatedAt?: string;
}

export interface HomeSummarySnapshotFromModuleContextOptions {
  tenantId?: string | null;
  tenantKey: string;
  displayName?: string | null;
  industry?: string | null;
  moduleContext: ServedModuleContextPacket;
  moduleContextExplanation: ModuleContextExplanation;
  generatedAt?: string;
  repoRoot?: string;
}

const REQUIRED_CONTEXT_AREAS = [
  ["enterprise-profile", "Enterprise Profile"],
  ["business-functions", "Business Functions"],
  ["org-ownership", "Org Ownership"],
  ["workforce-roles", "Workforce Roles"],
  ["applications-systems", "Applications & Systems"],
  ["data-assets-integrations", "Data Assets & Integrations"],
  ["infrastructure-platforms", "Infrastructure & Platforms"],
  ["vendors-contracts", "Vendors & Contracts"],
  ["it-budget-spend-value", "IT Budget, Spend & Value"],
  ["programs-initiatives", "Programs & Initiatives"],
  ["ai-automation-use-cases", "AI & Automation Use Cases"],
  ["risks-controls", "Risks & Controls"],
  ["relationships", "Relationships"],
  ["evidence-sources", "Evidence Sources"],
  ["metrics-outcomes", "Metrics & Outcomes"],
  ["industry-context-patterns", "Industry Context Patterns"],
  ["expert-lenses", "Expert Lenses"],
  ["managed-services-scope", "Managed Services Scope"],
  ["operational-process-evidence", "Operational Process Evidence"],
] as const;

const DEFAULT_KNOWLEDGE_LAYER_VISUAL: HomeKnowledgeLayerVisualSpec = {
  title: "Enterprise knowledge layer",
  subtitle:
    "AbarVa turns source evidence into governed enterprise context, then serves that context to every module with the same trust boundary.",
  centerLabel: "Enterprise Knowledge Layer",
  centerDetail:
    "Source-backed facts, gaps, caveats, and relationship candidates.",
  nodes: [
    {
      id: "functions",
      label: "Functions",
      detail: "Operating areas, owners, capabilities, and decision context.",
      tone: "enterprise",
      moduleUses: ["Intelligence", "Moves", "Tower"],
    },
    {
      id: "applications",
      label: "Applications",
      detail:
        "Systems, platforms, technology estate, and current versus target-state signals.",
      tone: "technology",
      moduleUses: ["Intelligence", "Moves", "Source", "Tower"],
    },
    {
      id: "vendors",
      label: "Vendors",
      detail:
        "Commercial context, contracts, providers, and sourcing evidence.",
      tone: "commercial",
      moduleUses: ["Source", "Intelligence", "Tower"],
    },
    {
      id: "data",
      label: "Data Assets",
      detail:
        "Marts, data products, integrations, lineage, and analytics readiness.",
      tone: "data",
      moduleUses: ["Intelligence", "Moves", "Tower"],
    },
    {
      id: "programs",
      label: "Programs",
      detail:
        "Priorities, initiatives, dependencies, and execution candidates.",
      tone: "delivery",
      moduleUses: ["Moves", "Intelligence", "Tower"],
    },
    {
      id: "risks",
      label: "Risks & Controls",
      detail: "Controls, caveats, decision risks, and governance requirements.",
      tone: "risk",
      moduleUses: ["Intelligence", "Moves", "Source", "Tower"],
    },
    {
      id: "metrics",
      label: "Metrics & Outcomes",
      detail: "Measurement definitions, baselines, and value proof boundaries.",
      tone: "value",
      moduleUses: ["Tower", "Moves", "Intelligence"],
    },
  ],
  flow: [
    {
      label: "Source evidence",
      detail: "Files, uploads, and enterprise records.",
    },
    {
      label: "Canonical context",
      detail: "Normalized facts and source lineage.",
    },
    {
      label: "Knowledge layer",
      detail: "Relationships, gaps, and caveats.",
    },
    {
      label: "Module packet",
      detail: "Active context served through one contract.",
    },
    {
      label: "Product action",
      detail: "Home, Intelligence, Moves, Source, and Tower.",
    },
  ],
  caveat:
    "Relationship depth and measured outcomes must be validated before cross-domain dependency, sourcing savings, or Tower value claims.",
  generatedBy: "deterministic",
};

const CONTEXT_AREA_DIMENSIONS: Record<string, Set<string>> = {
  "Enterprise Profile": new Set(["Enterprise Profile"]),
  "Business Functions": new Set([
    "Business & Operating Model",
    "Business Functions",
  ]),
  "Org Ownership": new Set([
    "Business & Operating Model",
    "Portfolio Company Hierarchy",
  ]),
  "Workforce Roles": new Set([
    "Workforce & Personas",
    "Capabilities & Value Streams",
  ]),
  "Applications & Systems": new Set([
    "Applications & Core Systems",
    "Applications Systems",
  ]),
  "Data Assets & Integrations": new Set([
    "Data & Analytics Estate",
    "Integrations & Interfaces",
    "Data Assets Integrations",
  ]),
  "Infrastructure & Platforms": new Set([
    "Infrastructure & Cloud",
    "Infrastructure Cloud Estate",
  ]),
  "Vendors & Contracts": new Set(["Vendors & Contracts"]),
  "IT Budget, Spend & Value": new Set([
    "IT Budget & Financials",
    "Spend Value",
    "Benefits Realization",
  ]),
  "Programs & Initiatives": new Set([
    "Initiatives & Roadmap",
    "Programs Initiatives Business Priorities",
  ]),
  "AI & Automation Use Cases": new Set([
    "AI & Automation Footprint",
    "AI Initiatives",
  ]),
  "Risks & Controls": new Set([
    "Security & Compliance",
    "Risk & RAID Log",
    "Operations & Service",
    "AI Governance & Policy",
  ]),
  Relationships: new Set(["System & Business Relationships"]),
  "Evidence Sources": new Set(["Source Documents", "Operational Evidence"]),
  "Metrics & Outcomes": new Set([
    "Business Metrics",
    "Metric Definitions",
    "Benefits Realization",
  ]),
  "Industry Context Patterns": new Set([
    "Industry Benchmarks",
    "Industry & Market Patterns",
  ]),
  "Expert Lenses": new Set(["Expert Lenses"]),
  "Managed Services Scope": new Set([
    "Service Tower Managed Services",
    "Vendors & Contracts",
  ]),
  "Operational Process Evidence": new Set([
    "Operations & Service",
    "Operational Evidence",
    "Source Documents",
  ]),
};

export function buildHomeSummarySnapshot(
  options: HomeSummarySnapshotBuildOptions,
): HomeSummarySnapshot {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const mode = options.mode ?? "active_home_context";
  const dataQuality =
    options.dataQuality ??
    buildHomeDataQualityModel({
      repoRoot: options.repoRoot,
      tenantKey: options.tenantKey,
      tenantDisplayName: options.displayName,
      candidatePreviewEnabled: mode === "candidate_preview",
      setupControl: options.setupControl ?? null,
      browser: options.browser ?? null,
    });
  const englishSummary =
    options.englishSummary ?? buildHomeEnglishSummary(dataQuality);
  const dimensions = Object.values(options.browser?.dimensions ?? {});
  const profile = deriveTenantProfile({
    tenantId: options.tenantId ?? null,
    tenantKey: dataQuality.tenantKey,
    displayName: options.displayName ?? dataQuality.tenantDisplayName,
    industry: options.industry ?? null,
    mode,
    dimensions,
    dataQuality,
    setupControl: options.setupControl ?? null,
    repoRoot: options.repoRoot,
  });
  const contextAreas = buildContextAreas({
    dimensions,
    dataQuality,
    englishSummary,
  });
  const contextDepthWidth = buildContextDepthWidth({
    dimensions,
    dataQuality,
    setupControl: options.setupControl ?? null,
  });
  const dataQualitySummary = buildDataQualitySummary(dataQuality);
  const avaScope = buildAvaScope({
    tenantKey: dataQuality.tenantKey,
    englishSummary,
    dataQuality,
    mode,
  });
  const status = snapshotStatus(dataQuality);
  const lineageWithoutFingerprint = {
    generatedAt,
    generatedBy: "home_summary_engine" as const,
    inputFingerprint: "",
    tenantDataVersionId:
      options.setupControl?.activeTenantAccess.activeVersionId ?? null,
    candidateVersionId:
      mode === "candidate_preview"
        ? (options.setupControl?.candidateTenantDataVersion
            .candidateVersionId ?? null)
        : null,
    sourceSnapshotIds: deriveSourceSnapshotIds({
      browser: options.browser ?? null,
      dataQuality,
    }),
    dataQualitySnapshotId: dataQuality.generatedAt ?? null,
    manifestProjectionSnapshotId:
      "reports/data-quality/manifest-projection/latest",
    answerabilitySnapshotId: dataQuality.answerability.status,
    mode,
    status,
  };
  const snapshotWithoutFingerprint = {
    contractVersion: "home_summary_snapshot.v1" as const,
    tenantProfileHeader: profile,
    executiveProfile: {
      companySummaryFacts: deriveCompanyFacts(profile, englishSummary),
      businessModelSignals: deriveSignals(
        "business",
        profile,
        dimensions,
        englishSummary,
      ),
      strategicPrioritySignals: deriveSignals(
        "priority",
        profile,
        dimensions,
        englishSummary,
      ),
      knowledgeLayerVisual: DEFAULT_KNOWLEDGE_LAYER_VISUAL,
      enterpriseSnapshotMetrics: buildEnterpriseMetrics({
        profile,
        contextDepthWidth,
        dataQuality,
      }),
      contextDepthWidth,
      whatAbarVaKnows: [
        englishSummary.currentUnderstanding,
        englishSummary.evidencePosture,
        englishSummary.relationshipPosture,
      ],
      whatIsMissing: [
        ...englishSummary.decisionCautions,
        ...dataQuality.gaps.map((gap) => gap.detail),
      ].slice(0, 8),
      safeToAsk: englishSummary.safeToAsk,
      doNotRelyYet: englishSummary.decisionCautions,
      recommendedNextDataActions: [englishSummary.nextDataAction],
      moduleImpact: englishSummary.moduleImpact,
    },
    contextAreas,
    dataQualitySummary,
    avaScope,
    caveats: englishSummary.caveats.length
      ? englishSummary.caveats
      : dataQuality.caveats,
    guardrails: {
      deterministicBuilder: true as const,
      callsClaude: false as const,
      productionTenantDataWritten: false as const,
      activeTenantAccessLayerUpdated: false as const,
      candidatePromoted: false as const,
      moduleRuntimeConsumptionChanged: false as const,
      candidateReadByDefault: false as const,
      uploadsFiles: false as const,
      validatesFiles: false as const,
      createsCandidates: false as const,
    },
    lineage: lineageWithoutFingerprint,
  };
  const inputFingerprint = stableFingerprint(snapshotWithoutFingerprint);
  return {
    ...snapshotWithoutFingerprint,
    lineage: {
      ...lineageWithoutFingerprint,
      inputFingerprint,
    },
  };
}

export function buildHomeSummarySnapshotFromModuleContext(
  options: HomeSummarySnapshotFromModuleContextOptions,
): HomeSummarySnapshot {
  const generatedAt =
    options.generatedAt ??
    options.moduleContext.generatedAt ??
    new Date().toISOString();
  const base = buildHomeSummarySnapshot({
    repoRoot: options.repoRoot,
    tenantId: options.tenantId ?? null,
    tenantKey: options.tenantKey,
    displayName:
      options.displayName ??
      firstModuleField(options.moduleContext.records, [
        "clientDisplayName",
        "entityName",
        "companyName",
      ]) ??
      options.tenantKey,
    industry:
      options.industry ??
      firstModuleField(options.moduleContext.records, ["industry", "vertical"]),
    mode:
      options.moduleContext.mode === "candidate_preview"
        ? "candidate_preview"
        : "active_home_context",
    generatedAt,
  });
  const profile = deriveTenantProfileFromModuleContext({
    baseProfile: base.tenantProfileHeader,
    moduleContext: options.moduleContext,
  });
  const contextAreas = buildContextAreasFromModuleContext({
    moduleContext: options.moduleContext,
    explanation: options.moduleContextExplanation,
  });
  const contextDepthWidth = buildContextDepthWidthFromModuleContext(
    options.moduleContext,
  );
  const moduleContextSummary = buildModuleContextSummary({
    moduleContext: options.moduleContext,
    explanation: options.moduleContextExplanation,
  });
  const dataQualitySummary = buildDataQualitySummaryFromModuleContext({
    moduleContext: options.moduleContext,
    explanation: options.moduleContextExplanation,
  });
  const avaScope = buildAvaScopeFromModuleContext({
    tenantKey: options.tenantKey,
    mode:
      options.moduleContext.mode === "candidate_preview"
        ? "candidate_preview"
        : "active_home_context",
    explanation: options.moduleContextExplanation,
  });
  const caveats = uniqueNonEmpty([
    ...options.moduleContext.caveats,
    ...options.moduleContextExplanation.limitations,
  ]).slice(0, 10);
  const status = snapshotStatusFromModuleContext(options.moduleContext);
  const lineageWithoutFingerprint = {
    generatedAt,
    generatedBy: "home_summary_engine" as const,
    inputFingerprint: "",
    tenantDataVersionId:
      options.moduleContext.activeTenantAccessVersionId ??
      options.moduleContext.tenantDataVersion ??
      null,
    candidateVersionId:
      options.moduleContext.mode === "candidate_preview"
        ? options.moduleContext.candidateVersionId
        : null,
    sourceSnapshotIds: options.moduleContext.lineage.sourceSnapshotIds,
    dataQualitySnapshotId:
      options.moduleContext.lineage.sourceBuildFingerprint ?? null,
    manifestProjectionSnapshotId:
      options.moduleContext.lineage.inputFingerprint ?? null,
    answerabilitySnapshotId:
      options.moduleContext.contextCompleteness.overall.toLowerCase(),
    mode:
      options.moduleContext.mode === "candidate_preview"
        ? ("candidate_preview" as const)
        : ("active_home_context" as const),
    status,
  };
  const snapshotWithoutFingerprint = {
    contractVersion: "home_summary_snapshot.v1" as const,
    tenantProfileHeader: profile,
    executiveProfile: {
      companySummaryFacts: deriveCompanyFactsFromModuleContext({
        profile,
        explanation: options.moduleContextExplanation,
      }),
      businessModelSignals: deriveModuleRecordSignals(
        options.moduleContext.records,
        "enterprise_profile",
      ),
      strategicPrioritySignals: deriveModuleRecordSignals(
        options.moduleContext.records,
        "programs_priorities",
      ),
      knowledgeLayerVisual: DEFAULT_KNOWLEDGE_LAYER_VISUAL,
      enterpriseSnapshotMetrics: buildEnterpriseMetricsFromModuleContext({
        moduleContext: options.moduleContext,
      }),
      contextDepthWidth,
      whatAbarVaKnows: [
        options.moduleContextExplanation.summary,
        ...options.moduleContextExplanation.strengths,
      ].slice(0, 5),
      whatIsMissing: [
        ...options.moduleContext.gaps.map((gap) => gap.description),
        ...options.moduleContextExplanation.limitations,
      ].slice(0, 8),
      safeToAsk: options.moduleContextExplanation.supportedQuestions,
      doNotRelyYet: options.moduleContextExplanation.unsupportedQuestions,
      recommendedNextDataActions: options.moduleContextExplanation.nextActions,
      moduleImpact: base.executiveProfile.moduleImpact,
    },
    contextAreas,
    moduleContextSummary,
    dataQualitySummary,
    avaScope,
    caveats,
    guardrails: {
      deterministicBuilder: true as const,
      callsClaude: false as const,
      productionTenantDataWritten: false as const,
      activeTenantAccessLayerUpdated: false as const,
      candidatePromoted: false as const,
      moduleRuntimeConsumptionChanged: false as const,
      candidateReadByDefault: false as const,
      uploadsFiles: false as const,
      validatesFiles: false as const,
      createsCandidates: false as const,
    },
    lineage: lineageWithoutFingerprint,
  };
  const inputFingerprint = stableFingerprint(snapshotWithoutFingerprint);
  return {
    ...snapshotWithoutFingerprint,
    lineage: {
      ...lineageWithoutFingerprint,
      inputFingerprint,
    },
  };
}

const MODULE_DOMAIN_TO_HOME_AREA: Record<
  HomeContextAreaSummary["displayName"],
  ModuleContextRequestedDomain
> = {
  "Enterprise Profile": "enterprise_profile",
  "Business Functions": "functions",
  "Org Ownership": "functions",
  "Workforce Roles": "functions",
  "Applications & Systems": "applications_systems",
  "Data Assets & Integrations": "data_assets_integrations",
  "Infrastructure & Platforms": "applications_systems",
  "Vendors & Contracts": "vendors_contracts",
  "IT Budget, Spend & Value": "metrics_outcomes",
  "Programs & Initiatives": "programs_priorities",
  "AI & Automation Use Cases": "programs_priorities",
  "Risks & Controls": "risks_controls",
  Relationships: "relationships",
  "Evidence Sources": "evidence_sources",
  "Metrics & Outcomes": "metrics_outcomes",
  "Industry Context Patterns": "evidence_sources",
  "Expert Lenses": "evidence_sources",
  "Managed Services Scope": "vendors_contracts",
  "Operational Process Evidence": "evidence_sources",
};

function deriveTenantProfileFromModuleContext(args: {
  baseProfile: HomeTenantProfileHeader;
  moduleContext: ServedModuleContextPacket;
}): HomeTenantProfileHeader {
  const profileRecords = args.moduleContext.records.filter(
    (record) => record.domain === "enterprise_profile",
  );
  const businessSegments = parseListField(
    firstModuleField(profileRecords, ["businessSegments", "segments"]),
  );
  return {
    ...args.baseProfile,
    displayName:
      firstModuleField(profileRecords, [
        "clientDisplayName",
        "companyName",
        "entityName",
      ]) ?? args.baseProfile.displayName,
    legalName:
      firstModuleField(profileRecords, ["companyName", "entityName"]) ??
      args.baseProfile.legalName,
    industry:
      firstModuleField(profileRecords, ["industry", "vertical"]) ??
      args.baseProfile.industry,
    subIndustry:
      firstModuleField(profileRecords, ["subIndustry"]) ??
      args.baseProfile.subIndustry,
    businessModel:
      firstModuleField(profileRecords, ["businessModel"]) ??
      args.baseProfile.businessModel,
    businessSegments: businessSegments.length
      ? businessSegments
      : args.baseProfile.businessSegments,
    dataOrigin: args.moduleContext.evidenceRefs.length
      ? "Source-backed"
      : args.baseProfile.dataOrigin,
    activeContextStatus:
      args.moduleContext.sourceMode === "active_tenant_access"
        ? "Active Knowledge context"
        : "Active context unavailable",
    candidatePreviewStatus:
      args.moduleContext.mode === "candidate_preview"
        ? "Inactive candidate preview"
        : "Not active",
  };
}

function buildContextDepthWidthFromModuleContext(
  moduleContext: ServedModuleContextPacket,
): HomeContextDepthWidth {
  return {
    loadedAreas: moduleContext.domains.filter(
      (domain) => domain.acceptedRecords > 0,
    ).length,
    loadedRecords: sum(
      moduleContext.domains.map((domain) => domain.acceptedRecords),
    ),
    sourceCount: moduleContext.evidenceRefs.length,
    evidenceCount: moduleContext.evidenceRefs.length,
    relationshipCount:
      moduleContext.validatedRelationships.length +
      moduleContext.relationshipCandidates.length,
    visibleGaps: moduleContext.gaps.length,
    contextPosture: moduleContext.contextCompleteness.overall,
  };
}

function buildContextAreasFromModuleContext(args: {
  moduleContext: ServedModuleContextPacket;
  explanation: ModuleContextExplanation;
}): HomeContextAreaSummary[] {
  return REQUIRED_CONTEXT_AREAS.map(([areaKey, displayName]) => {
    const requestedDomain = MODULE_DOMAIN_TO_HOME_AREA[displayName];
    const domainSummary = args.moduleContext.domains.find(
      (domain) => domain.domain === requestedDomain,
    );
    const records = args.moduleContext.records.filter(
      (record) => record.domain === requestedDomain,
    );
    const gaps = args.moduleContext.gaps
      .filter((gap) => !gap.domain || gap.domain === requestedDomain)
      .slice(0, 5);
    const relationshipCount =
      requestedDomain === "relationships"
        ? args.moduleContext.validatedRelationships.length +
          args.moduleContext.relationshipCandidates.length
        : 0;
    const loadedCount = domainSummary?.acceptedRecords ?? 0;
    const sourceCount = Math.max(
      domainSummary?.sourceRows ?? 0,
      new Set(records.flatMap((record) => record.sourceEvidenceIds)).size,
    );
    return {
      areaKey,
      displayName,
      executiveSummaryInputs: records.map((record) => record.title).slice(0, 6),
      loadedCount,
      mappedCount: loadedCount,
      sourceCount,
      evidenceCount: records.filter((record) => record.sourceEvidenceIds.length)
        .length,
      relationshipCount,
      examples: records.map((record) => record.title).slice(0, 5),
      topGaps: gaps.map((gap) => ({
        label: gap.description,
        count: 1,
        whyItMatters: gap.source ?? null,
      })),
      evidencePosture:
        loadedCount > 0
          ? `${displayName} has ${formatNumber(loadedCount)} canonical record${loadedCount === 1 ? "" : "s"} represented through the active module context contract.`
          : `${displayName} is not represented in the current active module context packet.`,
      relationshipDepth:
        relationshipCount > 0
          ? `${formatNumber(relationshipCount)} relationship candidate${relationshipCount === 1 ? "" : "s"} visible for validation.`
          : "Validated relationship depth is limited or not projected for this area.",
      answerability:
        loadedCount > 0 && !gaps.some((gap) => gap.severity === "blocker")
          ? "answerable_from_loaded_context"
          : loadedCount > 0
            ? "answerable_with_caveats"
            : "not_available_yet",
      safeQuestions: args.explanation.supportedQuestions.slice(0, 4),
      unsupportedQuestions: args.explanation.unsupportedQuestions.slice(0, 4),
      decisionsSupported:
        loadedCount > 0
          ? ["Source-backed context browsing", "Evidence inspection"]
          : [],
      decisionsNotReady:
        relationshipCount === 0
          ? [
              "Cross-domain dependency decisions without validated relationships",
            ]
          : args.explanation.unsupportedQuestions.slice(0, 2),
      nextDataActions:
        loadedCount > 0
          ? args.explanation.nextActions.slice(0, 2)
          : [`Load or promote ${displayName.toLowerCase()} context.`],
      caveats: args.moduleContext.caveats.slice(0, 3),
    };
  });
}

function buildModuleContextSummary(args: {
  moduleContext: ServedModuleContextPacket;
  explanation: ModuleContextExplanation;
}): HomeModuleContextSummary {
  return {
    sourceMode: args.moduleContext.sourceMode,
    activeTenantAccessVersionId: args.moduleContext.activeTenantAccessVersionId,
    candidateVersionId: args.moduleContext.candidateVersionId,
    requestedDomains: args.moduleContext.domains.map((domain) => ({
      domain: domain.domain,
      canonicalDomain: domain.canonicalDomain,
      acceptedRecords: domain.acceptedRecords,
      sourceRows: domain.sourceRows,
      readiness: domain.readiness,
    })),
    readableRecords: args.moduleContext.records.length,
    evidenceRefs: args.moduleContext.evidenceRefs.length,
    validatedRelationships: args.moduleContext.validatedRelationships.length,
    relationshipCandidates: args.moduleContext.relationshipCandidates.length,
    contextCompleteness: args.moduleContext.contextCompleteness,
    explanationSummary: args.explanation.summary,
    strengths: args.explanation.strengths,
    limitations: args.explanation.limitations,
    supportedQuestions: args.explanation.supportedQuestions,
    unsupportedQuestions: args.explanation.unsupportedQuestions,
    nextActions: args.explanation.nextActions,
  };
}

function buildDataQualitySummaryFromModuleContext(args: {
  moduleContext: ServedModuleContextPacket;
  explanation: ModuleContextExplanation;
}): HomeDataQualitySummary {
  const blockers = args.moduleContext.gaps.filter(
    (gap) => gap.severity === "blocker",
  );
  return {
    sourceCoverage:
      args.moduleContext.sourceMode === "active_tenant_access"
        ? "active-context-source-backed"
        : "active-context-not-available",
    candidateCoverage:
      args.moduleContext.mode === "candidate_preview"
        ? "inactive-candidate-preview"
        : "not-read-by-default",
    evidenceStrength: `${args.moduleContext.contextCompleteness.evidenceCoverage}% evidence coverage`,
    relationshipCoverage: `${args.moduleContext.contextCompleteness.relationshipCoverage}% relationship coverage`,
    manifestCompleteness: args.explanation.contextCompleteness.overall,
    homeAvaRepresentationWarnings: args.explanation.limitations.slice(0, 8),
    promotionBlockers: blockers.map((gap) => gap.description),
    answerabilityPosture: `${args.moduleContext.contextCompleteness.answerability}% answerability`,
  };
}

function buildAvaScopeFromModuleContext(args: {
  tenantKey: string;
  mode: HomeSummarySnapshotMode;
  explanation: ModuleContextExplanation;
}): HomeAvaScope {
  return {
    canAnswer: args.explanation.supportedQuestions,
    shouldCaveat: args.explanation.limitations.slice(0, 6),
    mustRefuseOrMarkUnsupported: args.explanation.unsupportedQuestions,
    suggestedPrompts: [
      "What can Home safely answer right now?",
      "What data supports this answer?",
      "What is missing before using this for decisions?",
      "Which domains are strongest?",
    ],
    sourceSnapshotReference: `${args.tenantKey}:${args.mode}:module-context`,
  };
}

function buildEnterpriseMetricsFromModuleContext(args: {
  moduleContext: ServedModuleContextPacket;
}): HomeEnterpriseSnapshotMetric[] {
  return [
    {
      key: "context_completeness",
      label: "Context completeness",
      value: args.moduleContext.contextCompleteness.overall,
      detail: `${args.moduleContext.contextCompleteness.answerability}% answerability from the served module context packet.`,
    },
    {
      key: "evidence_refs",
      label: "Evidence references",
      value: formatNumber(args.moduleContext.evidenceRefs.length),
      detail:
        "Lineage references visible to Home through the supplier contract.",
    },
    {
      key: "represented_domains",
      label: "Represented domains",
      value: `${args.moduleContext.domains.filter((domain) => domain.acceptedRecords > 0).length}/${args.moduleContext.domains.length}`,
      detail: "Requested domains with canonical records in the packet.",
    },
    {
      key: "relationship_readiness",
      label: "Relationship readiness",
      value: `${args.moduleContext.contextCompleteness.relationshipCoverage}%`,
      detail:
        args.moduleContext.validatedRelationships.length > 0
          ? "Validated relationships are present."
          : "Relationship candidates still need validation.",
    },
  ];
}

function deriveCompanyFactsFromModuleContext(args: {
  profile: HomeTenantProfileHeader;
  explanation: ModuleContextExplanation;
}): string[] {
  return uniqueNonEmpty([
    args.profile.businessModel
      ? `${args.profile.displayName} is ${args.profile.subIndustry ?? args.profile.industry ?? "an enterprise"} with a business model spanning ${args.profile.businessModel}.`
      : `${args.profile.displayName} is ${args.profile.subIndustry ?? args.profile.industry ?? "an enterprise"} represented in the active Home context.`,
    args.explanation.summary,
  ]);
}

function deriveModuleRecordSignals(
  records: ModuleContextRecord[],
  domain: ModuleContextRequestedDomain,
): string[] {
  return uniqueNonEmpty(
    records
      .filter((record) => record.domain === domain)
      .flatMap((record) => [
        record.fields.businessModel,
        record.fields.businessSegments,
        record.fields.strategicPriority,
        record.fields.name,
        record.title,
      ])
      .map((value) => String(value ?? "").trim())
      .flatMap((value) =>
        parseListField(value).length ? parseListField(value) : [value],
      ),
  )
    .filter((value) => value.length > 0)
    .slice(0, 6);
}

function snapshotStatusFromModuleContext(
  moduleContext: ServedModuleContextPacket,
): HomeSummarySnapshotStatus {
  if (moduleContext.sourceMode === "active_not_available") return "blocked";
  if (moduleContext.contextCompleteness.overall === "Strong") return "ready";
  if (moduleContext.contextCompleteness.overall === "Good")
    return "ready_with_caveats";
  if (moduleContext.contextCompleteness.overall === "Limited") return "partial";
  return "blocked";
}

function deriveTenantProfile(args: {
  tenantId: string | null;
  tenantKey: string;
  displayName: string;
  industry: string | null;
  mode: HomeSummarySnapshotMode;
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  setupControl: AdminSetupControlResponse | null;
  repoRoot?: string;
}): HomeTenantProfileHeader {
  const enterpriseProfile = getEnterpriseProfileReadModel(args.tenantKey, {
    repoRoot: args.repoRoot,
  });
  const profileRows = args.dimensions.find((dimension) =>
    /enterprise profile|portfolio/i.test(dimension.dimension),
  );
  const values = Object.fromEntries(
    profileRows?.sourceRows
      .flatMap((row) => Object.entries(row.values))
      .map(([key, value]) => [key.toLowerCase(), value]) ?? [],
  );
  const revenue =
    formatEnterpriseRevenue(enterpriseProfile?.revenueUsd ?? null) ??
    firstValue(values, ["revenue", "revenue usd", "annual revenue"]);
  const employees =
    formatEnterpriseEmployeeCount(enterpriseProfile?.employeeCount ?? null) ??
    firstValue(values, ["employees", "employee count", "headcount"]);
  return {
    tenantId: args.tenantId,
    tenantKey: args.tenantKey,
    displayName: enterpriseProfile?.clientDisplayName ?? args.displayName,
    legalName: enterpriseProfile?.legalName ?? null,
    industry:
      enterpriseProfile?.industry ??
      args.industry ??
      firstValue(values, ["industry", "vertical", "market"]) ??
      null,
    subIndustry: enterpriseProfile?.subIndustry ?? null,
    headquarters:
      enterpriseProfile?.headquarters ??
      firstValue(values, ["headquarters", "hq", "location"]),
    revenue,
    revenueVerified: Boolean(enterpriseProfile?.revenueUsd ?? revenue),
    employees,
    employeesVerified: Boolean(enterpriseProfile?.employeeCount ?? employees),
    businessModel: enterpriseProfile?.businessModel ?? null,
    businessSegments: enterpriseProfile?.businessSegments ?? [],
    missionStatement: enterpriseProfile?.missionStatement ?? null,
    visionStatement: enterpriseProfile?.visionStatement ?? null,
    leadershipRoles: enterpriseProfile?.leadershipRoles ?? [],
    strategicPriorities: enterpriseProfile?.strategicPriorities ?? [],
    globalLocations: enterpriseProfile?.globalLocations ?? [],
    sourceAsOfDate: enterpriseProfile?.sourceAsOfDate ?? null,
    sourceValidationStatus: enterpriseProfile?.sourceValidationStatus ?? null,
    knownGaps: enterpriseProfile?.knownGaps ?? [],
    dataOrigin: args.dataQuality.caveats.some((caveat) =>
      /synthetic|generated|demo/i.test(caveat),
    )
      ? "Demo-safe"
      : "Source-backed",
    mode: args.mode,
    activeContextStatus: args.dataQuality.activeContextLabel,
    candidatePreviewStatus:
      args.mode === "candidate_preview"
        ? args.dataQuality.candidatePreview.candidateOnlyLabel
        : "Active context only",
  };
}

function buildContextDepthWidth(args: {
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  setupControl: AdminSetupControlResponse | null;
}): HomeContextDepthWidth {
  return {
    loadedAreas: args.dimensions.length,
    loadedRecords: sum(args.dimensions.map((dimension) => dimension.rowCount)),
    sourceCount: new Set(
      args.dimensions.flatMap((dimension) => dimension.fileNames),
    ).size,
    evidenceCount:
      args.dataQuality.evidenceQuality.factsWithEvidence ??
      args.setupControl?.evidenceRegistry.evidenceItems ??
      0,
    relationshipCount:
      args.dataQuality.relationshipCoverage.knownRelationships ??
      args.setupControl?.relationshipGraph.graphRelationships ??
      0,
    visibleGaps: sum(
      args.dimensions.map((dimension) => dimension.dataThinCells),
    ),
    contextPosture: args.dataQuality.answerability.label,
  };
}

function buildContextAreas(args: {
  dimensions: HomeV6BrowserPreview[];
  dataQuality: HomeDataQualityModel;
  englishSummary: HomeEnglishSummary;
}): HomeContextAreaSummary[] {
  return REQUIRED_CONTEXT_AREAS.map(([areaKey, displayName]) => {
    const matches = args.dimensions.filter((dimension) =>
      areaMatches(displayName, dimension.dimension),
    );
    const loadedCount = sumByUniqueSourceFile(matches, "rowCount");
    const dataThinCount = sumByUniqueSourceFile(matches, "dataThinCells");
    const sourceCount = new Set(
      matches.flatMap((dimension) => dimension.fileNames),
    ).size;
    const topGaps = aggregateKnownGapsByUniqueSourceFile(matches)
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
    const examples = matches
      .flatMap((dimension) =>
        dimension.sourceRows
          .map((row) => row.label)
          .filter((label) => label && label !== "Needs evidence")
          .slice(0, 3),
      )
      .slice(0, 5);
    const gapCount = sum(topGaps.map((gap) => gap.count));
    const relationshipCount =
      /relationship|integration|application|system|vendor/i.test(displayName)
        ? args.dataQuality.relationshipCoverage.knownRelationships
        : 0;
    return {
      areaKey,
      displayName,
      executiveSummaryInputs: matches
        .map((dimension) => dimension.title)
        .slice(0, 6),
      loadedCount,
      mappedCount: loadedCount,
      sourceCount,
      evidenceCount: Math.min(
        args.dataQuality.evidenceQuality.factsWithEvidence,
        Math.max(loadedCount, 0),
      ),
      relationshipCount,
      examples,
      topGaps,
      evidencePosture:
        loadedCount > 0
          ? `${displayName} has ${formatNumber(loadedCount)} loaded record${loadedCount === 1 ? "" : "s"} from ${formatNumber(sourceCount)} source file${sourceCount === 1 ? "" : "s"}.`
          : `${displayName} is not represented in the current Home snapshot.`,
      relationshipDepth:
        relationshipCount > 0
          ? `${formatNumber(relationshipCount)} mapped relationship${relationshipCount === 1 ? "" : "s"} visible.`
          : "Relationship depth is limited or not projected for this area.",
      answerability:
        loadedCount > 0 && gapCount === 0
          ? "answerable_from_loaded_context"
          : loadedCount > 0
            ? "answerable_with_caveats"
            : "not_available_yet",
      safeQuestions: args.englishSummary.safeToAsk.slice(0, 4),
      unsupportedQuestions: args.englishSummary.decisionCautions.slice(0, 4),
      decisionsSupported:
        loadedCount > 0
          ? ["Source-backed context browsing", "Evidence inspection"]
          : [],
      decisionsNotReady:
        gapCount > 0 || relationshipCount === 0
          ? ["Broad advisory synthesis", "Cross-domain dependency decisions"]
          : ["Realized value claims without Tower evidence"],
      nextDataActions:
        loadedCount > 0
          ? [
              dataThinCount > 0 || gapCount > 0
                ? "Close visible evidence gaps for this area."
                : "Validate loaded rows with the client owner.",
            ]
          : [`Load source-backed ${displayName.toLowerCase()} evidence.`],
      caveats: args.dataQuality.caveats.slice(0, 3),
    };
  });
}

function buildDataQualitySummary(
  dataQuality: HomeDataQualityModel,
): HomeDataQualitySummary {
  return {
    sourceCoverage: dataQuality.sourceCoverage.status,
    candidateCoverage: dataQuality.candidatePreview.status,
    evidenceStrength: dataQuality.evidenceQuality.status,
    relationshipCoverage: dataQuality.relationshipCoverage.status,
    manifestCompleteness: dataQuality.sourceCoverage.sourceRichCandidateThin
      ? "Source-rich/candidate-thin"
      : "No manifest warning visible",
    homeAvaRepresentationWarnings: [
      ...dataQuality.sourceCoverage.warnings.map((warning) => warning.detail),
      ...dataQuality.relationshipCoverage.warnings.map(
        (warning) => warning.detail,
      ),
    ].slice(0, 8),
    promotionBlockers: dataQuality.candidatePreview.promotionBlockers,
    answerabilityPosture: dataQuality.answerability.rationale,
  };
}

function sumByUniqueSourceFile(
  dimensions: HomeV6BrowserPreview[],
  field: "rowCount" | "dataThinCells",
): number {
  const byFile = new Map<string, number>();
  for (const dimension of dimensions) {
    const files = dimension.fileNames.length
      ? dimension.fileNames
      : [dimension.dimension];
    const value = dimension[field];
    for (const file of files) {
      byFile.set(file, Math.max(byFile.get(file) ?? 0, value));
    }
  }
  return sum([...byFile.values()]);
}

function aggregateKnownGapsByUniqueSourceFile(
  dimensions: HomeV6BrowserPreview[],
): Array<{ label: string; count: number; whyItMatters: string | null }> {
  const byFileAndLabel = new Map<
    string,
    { label: string; count: number; whyItMatters: string | null }
  >();
  for (const dimension of dimensions) {
    const files = dimension.fileNames.length
      ? dimension.fileNames
      : [dimension.dimension];
    for (const file of files) {
      for (const gap of dimension.knownGaps) {
        const key = `${file}:${gap.label}`;
        const current = byFileAndLabel.get(key);
        if (!current || gap.count > current.count) {
          byFileAndLabel.set(key, {
            label: gap.label,
            count: gap.count,
            whyItMatters: gap.whyItMatters ?? null,
          });
        }
      }
    }
  }

  const byLabel = new Map<
    string,
    { label: string; count: number; whyItMatters: string | null }
  >();
  for (const gap of byFileAndLabel.values()) {
    const current = byLabel.get(gap.label);
    byLabel.set(gap.label, {
      label: gap.label,
      count: (current?.count ?? 0) + gap.count,
      whyItMatters: current?.whyItMatters ?? gap.whyItMatters,
    });
  }
  return [...byLabel.values()];
}

function buildAvaScope(args: {
  tenantKey: string;
  englishSummary: HomeEnglishSummary;
  dataQuality: HomeDataQualityModel;
  mode: HomeSummarySnapshotMode;
}): HomeAvaScope {
  return {
    canAnswer: args.englishSummary.safeToAsk,
    shouldCaveat: [
      args.englishSummary.completenessMeaning,
      args.englishSummary.relationshipPosture,
      ...args.dataQuality.caveats,
    ].slice(0, 6),
    mustRefuseOrMarkUnsupported: args.englishSummary.decisionCautions,
    suggestedPrompts: [
      "Explain this company in plain English.",
      "What does AbarVa know?",
      "What is missing?",
      "What can I safely ask?",
      "What should I not rely on yet?",
      "What data should we load or project next?",
    ],
    sourceSnapshotReference: `${args.tenantKey}:${args.mode}`,
  };
}

function buildEnterpriseMetrics(args: {
  profile: HomeTenantProfileHeader;
  contextDepthWidth: HomeContextDepthWidth;
  dataQuality: HomeDataQualityModel;
}): HomeEnterpriseSnapshotMetric[] {
  return [
    {
      key: "evidence_items",
      label: "Evidence items",
      value: formatNumber(args.contextDepthWidth.evidenceCount),
      detail: "Visible to the current Home context.",
    },
    {
      key: "evidence_posture",
      label: "Evidence posture",
      value: args.dataQuality.evidenceQuality.status,
      detail:
        args.dataQuality.evidenceQuality.warnings[0]?.detail ??
        "Source support is visible.",
    },
    {
      key: "relationship_depth",
      label: "Relationship depth",
      value:
        args.contextDepthWidth.relationshipCount > 0
          ? formatNumber(args.contextDepthWidth.relationshipCount)
          : "Limited",
      detail: args.dataQuality.relationshipCoverage.businessSummary,
    },
    {
      key: "next_actions",
      label: "Next best actions",
      value: formatNumber(args.dataQuality.gaps.length || 1),
      detail:
        args.dataQuality.gaps[0]?.detail ??
        "Validate and review the loaded context.",
    },
  ];
}

function deriveCompanyFacts(
  profile: HomeTenantProfileHeader,
  summary: HomeEnglishSummary,
): string[] {
  const sizeParts = [
    profile.revenue ? `${profile.revenue} revenue` : null,
    profile.employees ? `${profile.employees} employees` : null,
  ].filter(Boolean) as string[];
  const profileLead = [
    `${profile.legalName ?? profile.displayName} is ${
      profile.subIndustry ?? profile.industry ?? "an enterprise"
    }${profile.headquarters ? ` headquartered in ${profile.headquarters}` : ""}`,
    sizeParts.length ? `with ${sizeParts.join(" and ")}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const profileSummary = [
    profileLead,
    profile.businessModel ? `Its model spans ${profile.businessModel}` : null,
  ]
    .filter(Boolean)
    .join(". ");
  return [
    profileSummary || null,
    profile.missionStatement ? `Mission: ${profile.missionStatement}` : null,
    profile.visionStatement ? `Vision: ${profile.visionStatement}` : null,
    summary.currentUnderstanding,
  ].filter(Boolean) as string[];
}

function deriveSignals(
  kind: "business" | "priority",
  profile: HomeTenantProfileHeader,
  dimensions: HomeV6BrowserPreview[],
  summary: HomeEnglishSummary,
): string[] {
  if (kind === "business") {
    const fromProfile = [
      profile.businessModel,
      ...profile.businessSegments.map((segment) => `Segment: ${segment}`),
      ...profile.globalLocations
        .slice(0, 2)
        .map((location) => `Location footprint: ${location}`),
    ].filter(Boolean) as string[];
    if (fromProfile.length) return fromProfile.slice(0, 6);
  }
  if (kind === "priority" && profile.strategicPriorities.length) {
    return profile.strategicPriorities.slice(0, 6);
  }
  const pattern =
    kind === "business"
      ? /business|function|operating|profile|vendor|customer|member|passenger/i
      : /priority|program|initiative|risk|metric|outcome|ai/i;
  const derived = dimensions
    .filter((dimension) => pattern.test(dimension.dimension))
    .flatMap((dimension) => dimension.sourceRows.map((row) => row.label))
    .filter((label) => label && label !== "Needs evidence")
    .filter((label) => label !== profile.displayName)
    .slice(0, 5);
  return derived.length
    ? derived
    : kind === "business"
      ? [summary.currentUnderstanding]
      : [summary.nextDataAction];
}

function deriveSourceSnapshotIds(args: {
  browser: HomeV6ContextBrowser | null;
  dataQuality: HomeDataQualityModel;
}): string[] {
  const fileIds = Object.values(args.browser?.dimensions ?? {})
    .flatMap((dimension) => dimension.fileNames)
    .filter(Boolean);
  return [
    ...new Set(
      [
        args.browser?.datasetDir,
        ...fileIds,
        args.dataQuality.generatedAt,
      ].filter(Boolean) as string[],
    ),
  ];
}

function snapshotStatus(
  model: HomeDataQualityModel,
): HomeSummarySnapshotStatus {
  if (model.answerability.status === "answerable") return "ready";
  if (model.answerability.status === "partial") return "partial";
  if (model.answerability.status === "needs_evidence")
    return "ready_with_caveats";
  if (model.answerability.status === "candidate_preview_only") return "blocked";
  return "not_available";
}

function areaMatches(area: string, dimension: string): boolean {
  return CONTEXT_AREA_DIMENSIONS[area]?.has(dimension) ?? false;
}

function firstValue(
  values: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = String(values[key] ?? "").trim();
    if (value && value !== "Needs evidence") return value;
  }
  return null;
}

function firstModuleField(
  records: ModuleContextRecord[],
  keys: string[],
): string | null {
  const normalizedKeys = keys.map((key) => key.toLowerCase());
  for (const record of records) {
    for (const [key, value] of Object.entries(record.fields)) {
      if (!normalizedKeys.includes(key.toLowerCase())) continue;
      const stringValue = String(value ?? "").trim();
      if (stringValue && stringValue !== "Needs evidence") return stringValue;
    }
  }
  return null;
}

function parseListField(value: string | null | undefined): string[] {
  const trimmed = value?.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => String(entry ?? "").trim())
          .filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing for non-JSON list strings.
    }
  }
  return trimmed
    .split(/;|\|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function stableFingerprint(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(sortForFingerprint(value)))
    .digest("hex");
}

function sortForFingerprint(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForFingerprint);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForFingerprint(entry)]),
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value,
  );
}
