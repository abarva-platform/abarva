import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalClientDisplayName,
  getClientOption,
  type ClientKey,
} from "@/lib/client-config";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";

export interface V6HomeAskInput {
  tenantKey: string;
  tenantDisplayName?: string | null;
  question: string;
  includeTrace?: boolean;
  userId?: string | null;
}

export interface V6HomeTable {
  headers: string[];
  rows: string[][];
}

export interface V6HomeCitation {
  label: string;
  sourceKey: string;
  count: number;
}

export interface V6HomeGap {
  label: string;
  impact: string;
  remediation?: string;
}

export type V6HomeAnswerability =
  | "answerable_from_loaded_context"
  | "answerable_with_caveat"
  | "planning_grade_only"
  | "requires_tower"
  | "requires_intelligence"
  | "requires_source"
  | "requires_moves"
  | "data_thin"
  | "blocked_wrong_tenant"
  | "unsupported";

export interface V6HomeContextQualityDimension {
  dimensionName: string;
  coverageScore: number;
  freshnessScore: number;
  confidenceScore: number;
  relationshipScore: number;
  citationScore: number;
  gapCount: number;
  dataThinCount: number;
  loadedFactCount: number;
  assumptionCount: number;
  clientSignoffRequiredCount: number;
  supportedAnswerTypes: string[];
  blockedAnswerTypes: string[];
  handoffSurface: "home" | "intelligence" | "tower" | "source" | "moves" | null;
}

export interface V6HomeContextQuality {
  answerability: V6HomeAnswerability;
  overall: "strong" | "medium" | "thin" | "blocked";
  summary: string;
  strongDimensions: string[];
  mediumDimensions: string[];
  thinDimensions: string[];
  recommendedHandoff: {
    target: "intelligence" | "tower" | "source" | "moves" | null;
    label: string;
    reason: string;
  } | null;
  dimensions: V6HomeContextQualityDimension[];
}

export interface V6HomeAnswer {
  mode: "home_know";
  answerSource: "v6_dataset_contract";
  directAnswer: string;
  answerParagraphs: string[];
  artifactPlan: string[];
  citations: V6HomeCitation[];
  gaps: V6HomeGap[];
  table: V6HomeTable | null;
  branchOptions: Array<{
    label: string;
    summary: string;
    dimensionKey: string;
  }>;
  followUpQuestion: string | null;
  answerability: V6HomeAnswerability;
  contextQuality: V6HomeContextQuality;
  answerBoundary: {
    canAnswer: string[];
    cannotAnswer: string[];
    handoffTarget: string | null;
    handoffReason?: string;
  };
  primaryDimension: string;
  relatedDimensions: string[];
  sourceFamiliesIncluded: string[];
}

export interface V6HomeAskResult {
  ok: true;
  endpoint: "/api/home/know/ask";
  tenant: {
    appClientKey: ClientKey;
    canonicalKey: string;
    displayName: string;
    datasetDir: string;
  };
  user: { signedIn: boolean };
  answer: V6HomeAnswer;
  proof: {
    source: "v6_dataset_pack";
    oldSemanticLayersSunset: true;
    semantic2Loaded: false;
    dossierAttached: false;
    composerUsed: "home-v6-dataset-answer";
    fallbackUsed: false;
    model: "deterministic-v6-contract";
    auditId: string;
    promptVersion: "home-v6-dataset-contract-v1";
    answerPromptVersion: "home-v6-dataset-contract-v1";
    datasetDir: string;
    generatedAt: string;
    questionIntent: string;
    selectedFiles: string[];
    selectedRows: number;
    selectedFacts: number;
    gapCount: number;
    citationCount: number;
    answerability: V6HomeAnswerability;
    contextQuality: V6HomeContextQuality;
    qualityGate: {
      passed: boolean;
      issues: string[];
      visibleAnswerContract: { passed: boolean; issues: string[] };
    };
    answerSource: {
      answerSource: "v6_dataset_contract";
      claudeInvoked: false;
      claudeSelected: false;
      fallbackUsed: false;
      fallbackReason: null;
      hardValidationFailures: string[];
      softValidationWarnings: string[];
      sanitizerChanges: string[];
      rawClaudePreserved: false;
    };
  };
  trace?: {
    traceVersion: "home-v6-answer-trace-v1";
    route: "/api/home/know/ask";
    surface: "home";
    timestamp: string;
    session: {
      tenant: V6HomeAskResult["tenant"];
      user: { signedIn: boolean; id?: string | null };
      question: string;
    };
    router: {
      selectedEndpoint: "/api/home/know/ask";
      surface: "home";
      intent: string;
      primaryDimension: string;
      secondaryDimensions: string[];
      answerMode: "home_v6_dataset";
      fallbackEligibility: false;
    };
    evidenceSelection: {
      selectedDatasetDir: string;
      selectedFiles: string[];
      selectedFacts: Array<Record<string, string>>;
      selectedGaps: V6HomeGap[];
      selectedCitations: V6HomeCitation[];
      answerability: V6HomeAnswerability;
      contextQuality: V6HomeContextQuality;
      artifactPlan: string[];
    };
    modelCall: {
      provider: "none";
      model: "deterministic-v6-contract";
      promptVersion: "home-v6-dataset-contract-v1";
      finalPrompt: string;
      rawResponse: null;
      fallbackUsed: false;
      fallbackReason: null;
    };
    apiPayload: {
      ok: true;
      endpoint: "/api/home/know/ask";
      answer: V6HomeAnswer;
    };
  };
}

interface V6GeneratedManifest {
  tenantKey: string;
  clientDisplayName: string;
  datasetVersion: string;
  generatedAt: string;
  contractVersion: string;
  files: Array<{
    file: string;
    businessObjectFamily: string;
    columns: number;
    rows: number;
    dataThinCells: number;
  }>;
  totals: { files: number; rows: number; dataThinCells: number };
}

interface V6Dataset {
  appClientKey: ClientKey;
  displayName: string;
  datasetDir: string;
  manifest: V6GeneratedManifest;
  files: Record<string, Array<Record<string, string>>>;
}

interface TopicConfig {
  intent: string;
  primaryDimension: string;
  relatedDimensions: string[];
  files: string[];
  tableHeaders: string[];
  tableColumns: string[];
  handoffTarget?: string | null;
  handoffReason?: string;
}

const V6_DATASET_BY_CLIENT: Record<ClientKey, string> = {
  apexretail: "apex-retail-synthetic-v6",
  arcturus: "first-capital-financial-synthetic-v6",
  firstcapital: "first-capital-financial-synthetic-v6",
  meridian: "meridian-health-synthetic-v6",
  northstar: "northstar-clinical-tech-synthetic-v1",
  skyharbor: "skyharbor-air-synthetic-v6",
  lakeshore: "lakeshore-holdings-synthetic-v6",
};

const TOPICS: Record<string, TopicConfig> = {
  loaded_context: topic(
    "loaded_context",
    "enterprise_profile",
    ["evidence_sources"],
    ["V6_01_enterprise_profile.csv", "V6_13_evidence_sources.csv"],
    ["Record", "Industry/model", "Priority/context"],
    ["company_name", "industry", "strategic_priorities"],
  ),
  business_areas: topic(
    "business_areas",
    "business_functions",
    ["org_ownership"],
    ["V6_02_business_functions.csv"],
    ["Business area", "Executive owner", "Critical processes"],
    ["function_name", "executive_owner", "critical_processes"],
  ),
  it_org: topic(
    "it_org",
    "org_ownership",
    ["business_functions"],
    ["V6_03_org_ownership.csv"],
    ["IT/domain area", "Leader role", "Decision rights"],
    ["org_unit_name", "leader_role", "decision_rights"],
  ),
  technology_leaders: topic(
    "technology_leaders",
    "org_ownership",
    ["business_functions"],
    ["V6_03_org_ownership.csv"],
    ["Technology domain", "Leader role", "Supported ownership"],
    ["org_unit_name", "leader_role", "owned_systems"],
  ),
  apps_systems: topic(
    "apps_systems",
    "applications_systems",
    ["relationships", "data_assets_integrations"],
    ["V6_05_applications_systems.csv"],
    ["System", "Owner", "Criticality", "Lifecycle"],
    ["system_name", "system_owner", "criticality", "lifecycle_status"],
  ),
  data_estate: topic(
    "data_estate",
    "data_assets_integrations",
    ["applications_systems"],
    ["V6_06_data_assets_integrations.csv"],
    ["Data asset", "Owner", "Quality", "Governance"],
    ["data_asset_name", "data_owner", "quality_score", "governance_status"],
  ),
  integrations: topic(
    "integrations",
    "data_assets_integrations",
    ["relationships"],
    ["V6_06_data_assets_integrations.csv", "V6_12_relationships.csv"],
    ["Object", "System/relationship", "Evidence/confidence"],
    ["data_asset_name", "system_of_record", "relationship_confidence"],
  ),
  vendors_contracts: topic(
    "vendors_contracts",
    "vendors_contracts",
    ["applications_systems", "spend_value"],
    ["V6_07_vendors_contracts.csv"],
    ["Vendor", "Service", "Renewal", "Contract risk"],
    ["vendor_name", "service", "renewal_date", "contract_risk"],
  ),
  budget_spend: topic(
    "budget_spend",
    "spend_value",
    ["enterprise_profile"],
    ["V6_08_spend_value.csv", "V6_01_enterprise_profile.csv"],
    ["Spend record", "Amount", "Type", "Owner"],
    ["spend_id", "amount_usd", "amount_type", "owner"],
  ),
  ai_footprint: topic(
    "ai_footprint",
    "ai_initiatives",
    ["programs_initiatives"],
    ["V6_10_ai_initiatives.csv"],
    ["Use case/tool", "Users", "Adoption", "Readiness"],
    ["use_case", "licensed_users", "active_users", "data_readiness"],
  ),
  ai_initiatives: topic(
    "ai_initiatives",
    "ai_initiatives",
    ["programs_initiatives"],
    ["V6_10_ai_initiatives.csv", "V6_09_programs_initiatives.csv"],
    ["Initiative/use case", "Measured value", "Status", "Decision"],
    ["use_case", "measured_value_usd", "production_status", "decision_needed"],
  ),
  operations_service: topic(
    "operations_service",
    "operations_risk_controls",
    ["applications_systems"],
    ["V6_11_operations_risk_controls.csv"],
    ["Process/control", "Severity/status", "Affected systems", "Impact"],
    ["process", "severity", "affected_systems", "business_impact"],
  ),
  risk_controls: topic(
    "risk_controls",
    "operations_risk_controls",
    ["ai_initiatives"],
    ["V6_11_operations_risk_controls.csv", "V6_10_ai_initiatives.csv"],
    ["Risk/control", "Status", "Systems/readiness", "Boundary"],
    ["process", "status", "affected_systems", "data_readiness"],
  ),
  governance_policy: topic(
    "governance_policy",
    "metric_definitions",
    ["operations_risk_controls"],
    ["V6_14_metric_definitions.csv", "V6_10_ai_initiatives.csv"],
    ["Metric/governance item", "Owner", "Claim level", "Forbidden claim"],
    ["metric_name", "metric_owner", "metric_claim_level", "not_allowed_claims"],
  ),
  metrics_outcomes: topic(
    "metrics_outcomes",
    "metric_definitions",
    ["ai_initiatives"],
    ["V6_14_metric_definitions.csv", "V6_10_ai_initiatives.csv"],
    ["Metric/outcome", "Definition", "Owner", "Claim level"],
    ["metric_name", "metric_definition", "metric_owner", "metric_claim_level"],
  ),
  relationships: topic(
    "relationships",
    "relationships",
    ["applications_systems", "vendors_contracts"],
    ["V6_12_relationships.csv"],
    ["From", "Relationship", "To", "Confidence"],
    [
      "from_object_family",
      "relationship_type",
      "to_object_family",
      "relationship_confidence",
    ],
  ),
  evidence_gaps: topic(
    "evidence_gaps",
    "evidence_gaps",
    ["all_v6_files"],
    allCoreFiles(),
    ["Area/file", "Known gap", "Count"],
    ["business_object_family", "known_gaps", "confidence"],
  ),
  data_thin: topic(
    "data_thin",
    "data_thin",
    ["all_v6_files"],
    allCoreFiles(),
    ["Area/file", "Known gap", "Count"],
    ["business_object_family", "known_gaps", "confidence"],
  ),
  readiness: topic(
    "readiness",
    "readiness",
    ["evidence_sources"],
    [
      "V6_01_enterprise_profile.csv",
      "V6_13_evidence_sources.csv",
      "V6_14_metric_definitions.csv",
    ],
    ["Area", "Readiness signal", "Boundary"],
    ["business_object_family", "confidence", "not_allowed_claims"],
  ),
  source_trail: topic(
    "source_trail",
    "evidence_sources",
    ["relationships"],
    ["V6_13_evidence_sources.csv"],
    ["Evidence title", "Type", "Location", "Confidence"],
    [
      "evidence_title",
      "evidence_type",
      "source_location",
      "evidence_confidence",
    ],
  ),
  board_summary: topic(
    "board_summary",
    "board_summary",
    ["enterprise_profile", "ai_initiatives", "industry_patterns"],
    [
      "V6_01_enterprise_profile.csv",
      "V6_10_ai_initiatives.csv",
      "V6_15_industry_corpus_patterns.csv",
    ],
    ["Area", "Supported signal", "Boundary"],
    ["business_object_family", "record_name", "not_allowed_claims"],
  ),
  handoff_intelligence: topic(
    "handoff_intelligence",
    "ai_initiatives",
    ["industry_patterns", "expert_lenses"],
    [
      "V6_10_ai_initiatives.csv",
      "V6_15_industry_corpus_patterns.csv",
      "V6_16_expert_lenses.csv",
    ],
    ["Context", "Pattern/lens", "How Intelligence should use it"],
    ["use_case", "pattern_name", "recommended_actions"],
    "intelligence",
    "Intelligence owns advisory synthesis, options, and pattern-backed leadership recommendations.",
  ),
  handoff_tower: topic(
    "handoff_tower",
    "ai_initiatives",
    ["spend_value", "operations_risk_controls"],
    [
      "V6_08_spend_value.csv",
      "V6_10_ai_initiatives.csv",
      "V6_11_operations_risk_controls.csv",
    ],
    ["Context", "Status/readiness", "Tower use"],
    ["use_case", "scale_hold_stop", "data_readiness"],
    "tower",
    "Tower owns portfolio execution, spend, adoption, readiness, and value tracking.",
  ),
  sourcing_relevance: topic(
    "sourcing_relevance",
    "vendors_contracts",
    ["evidence_sources"],
    ["V6_07_vendors_contracts.csv", "V6_13_evidence_sources.csv"],
    ["Vendor/evidence", "Renewal/type", "Sourcing relevance"],
    ["vendor_name", "renewal_date", "contract_risk"],
    "source",
    "Source owns sourcing events, vendor evidence, renewal decisions, and partner tradeoffs.",
  ),
  move_relevance: topic(
    "move_relevance",
    "programs_initiatives",
    ["relationships", "industry_patterns"],
    [
      "V6_09_programs_initiatives.csv",
      "V6_12_relationships.csv",
      "V6_15_industry_corpus_patterns.csv",
    ],
    ["Program/pattern", "Phase/relationship", "Move relevance"],
    ["record_name", "phase", "relationship_type"],
    "moves",
    "Moves owns governed change framing, ownership, sequencing, and mobilization.",
  ),
};

export function answerHomeKnowFromV6(input: V6HomeAskInput): V6HomeAskResult {
  const dataset = loadV6Dataset(input.tenantKey);
  const question = input.question.trim();
  const topicKey = classifyQuestion(question);
  const config = TOPICS[topicKey] ?? TOPICS.loaded_context;
  const rows = selectRows(dataset, config);
  const gaps = buildGaps(rows, dataset, config).slice(0, 8);
  const table = buildTable(rows, config);
  const citations = buildCitations(dataset, config, rows);
  const answer = buildAnswer({
    dataset,
    config,
    topicKey,
    question,
    rows,
    gaps,
    table,
    citations,
  });
  const auditId = `home-v6-${dataset.appClientKey}-${topicKey}-${hash(question).slice(0, 8)}`;
  const tenant = {
    appClientKey: dataset.appClientKey,
    canonicalKey: dataset.appClientKey,
    displayName: input.tenantDisplayName || dataset.displayName,
    datasetDir: dataset.datasetDir,
  };
  const proof: V6HomeAskResult["proof"] = {
    source: "v6_dataset_pack",
    oldSemanticLayersSunset: true,
    semantic2Loaded: false,
    dossierAttached: false,
    composerUsed: "home-v6-dataset-answer",
    fallbackUsed: false,
    model: "deterministic-v6-contract",
    auditId,
    promptVersion: "home-v6-dataset-contract-v1",
    answerPromptVersion: "home-v6-dataset-contract-v1",
    datasetDir: dataset.datasetDir,
    generatedAt: dataset.manifest.generatedAt,
    questionIntent: config.intent,
    selectedFiles: config.files,
    selectedRows: rows.length,
    selectedFacts: countFacts(rows),
    gapCount: gaps.length,
    citationCount: citations.length,
    answerability: answer.answerability,
    contextQuality: answer.contextQuality,
    qualityGate: visibleQualityGate(answer),
    answerSource: {
      answerSource: "v6_dataset_contract",
      claudeInvoked: false,
      claudeSelected: false,
      fallbackUsed: false,
      fallbackReason: null,
      hardValidationFailures: [],
      softValidationWarnings: [],
      sanitizerChanges: [],
      rawClaudePreserved: false,
    },
  };
  const result: V6HomeAskResult = {
    ok: true,
    endpoint: "/api/home/know/ask",
    tenant,
    user: { signedIn: Boolean(input.userId) },
    answer,
    proof,
  };
  if (input.includeTrace) {
    result.trace = {
      traceVersion: "home-v6-answer-trace-v1",
      route: "/api/home/know/ask",
      surface: "home",
      timestamp: new Date().toISOString(),
      session: {
        tenant,
        user: input.userId
          ? { signedIn: true, id: input.userId }
          : { signedIn: false },
        question,
      },
      router: {
        selectedEndpoint: "/api/home/know/ask",
        surface: "home",
        intent: config.intent,
        primaryDimension: config.primaryDimension,
        secondaryDimensions: config.relatedDimensions,
        answerMode: "home_v6_dataset",
        fallbackEligibility: false,
      },
      evidenceSelection: {
        selectedDatasetDir: dataset.datasetDir,
        selectedFiles: config.files,
        selectedFacts: rows.slice(0, 20),
        selectedGaps: gaps,
        selectedCitations: citations,
        answerability: answer.answerability,
        contextQuality: answer.contextQuality,
        artifactPlan: answer.artifactPlan,
      },
      modelCall: {
        provider: "none",
        model: "deterministic-v6-contract",
        promptVersion: "home-v6-dataset-contract-v1",
        finalPrompt: `Answer from V6 dataset ${dataset.datasetDir} only. Question: ${question}`,
        rawResponse: null,
        fallbackUsed: false,
        fallbackReason: null,
      },
      apiPayload: {
        ok: true,
        endpoint: "/api/home/know/ask",
        answer,
      },
    };
  }
  return result;
}

function topic(
  intent: string,
  primaryDimension: string,
  relatedDimensions: string[],
  files: string[],
  tableHeaders: string[],
  tableColumns: string[],
  handoffTarget?: string | null,
  handoffReason?: string,
): TopicConfig {
  return {
    intent,
    primaryDimension,
    relatedDimensions,
    files,
    tableHeaders,
    tableColumns,
    handoffTarget,
    handoffReason,
  };
}

function allCoreFiles(): string[] {
  return [
    "V6_01_enterprise_profile.csv",
    "V6_02_business_functions.csv",
    "V6_03_org_ownership.csv",
    "V6_05_applications_systems.csv",
    "V6_06_data_assets_integrations.csv",
    "V6_07_vendors_contracts.csv",
    "V6_08_spend_value.csv",
    "V6_09_programs_initiatives.csv",
    "V6_10_ai_initiatives.csv",
    "V6_11_operations_risk_controls.csv",
    "V6_12_relationships.csv",
    "V6_13_evidence_sources.csv",
    "V6_14_metric_definitions.csv",
    "V6_15_industry_corpus_patterns.csv",
    "V6_16_expert_lenses.csv",
  ];
}

function loadV6Dataset(tenantKey: string): V6Dataset {
  const appClientKey = appClientKeyForTenant(tenantKey) ?? "apexretail";
  const option = getClientOption(appClientKey);
  const datasetDir = V6_DATASET_BY_CLIENT[appClientKey];
  const datasetRoot = path.join(process.cwd(), "datasets", datasetDir);
  const manifestPath = path.join(datasetRoot, "V6_GENERATED_MANIFEST.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `V6 dataset is not available for ${appClientKey}. Expected ${manifestPath}.`,
    );
  }
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as V6GeneratedManifest;
  const templatesRoot = path.join(datasetRoot, "templates");
  const files: V6Dataset["files"] = {};
  for (const manifestFile of manifest.files.map((item) => item.file)) {
    const file = path.basename(manifestFile);
    const sourcePath = path.join(templatesRoot, file);
    const rows = existsSync(sourcePath)
      ? parseCsv(readFileSync(sourcePath, "utf8"))
      : [];
    files[file] = rows;
    files[manifestFile] = rows;
  }
  return {
    appClientKey,
    displayName:
      canonicalClientDisplayName({
        key: appClientKey,
        name: manifest.clientDisplayName || option.name,
      }) ||
      manifest.clientDisplayName ||
      option.name,
    datasetDir,
    manifest,
    files,
  };
}

function classifyQuestion(question: string): keyof typeof TOPICS {
  const q = question.toLowerCase();
  if (/relationship|connect/.test(q)) return "relationships";
  if (/board|executive summary|board-ready/.test(q)) return "board_summary";
  if (
    /intelligence/.test(q) &&
    /(hand|instead|take over|takeover|own|evaluate)/.test(q)
  )
    return "handoff_intelligence";
  if (
    /tower/.test(q) &&
    /(hand|instead|hold|scale|evaluate|take over|takeover|own)/.test(q)
  )
    return "handoff_tower";
  if (/business context|available context|loaded context/.test(q))
    return "loaded_context";
  // Identity / orientation questions ("who is <company>", "tell me about the
  // business") must resolve to the enterprise profile before the keyword ladder
  // below — otherwise a program name that happens to contain "contract" (e.g.
  // "Legal Contract Intake") is captured by the vendor/contract rule and the
  // answer never describes the company. Home is the context browser: it orients
  // on the loaded picture. Advisory judgment ("why is X a good problem", "what
  // should we do") is Intelligence's job and is handed off below.
  if (
    /\bwho\s+(is|are)\b/.test(q) &&
    !/\b(cio|cto|ciso|cfo|cdo|cdao|caio|coo|ceo|gc|general counsel|owner|leader|head of|vp|director|sponsor|accountable|responsible|reports?\s+to)\b/.test(
      q,
    )
  )
    return "loaded_context";
  if (
    /\b(tell me about|introduce|overview of|profile of|describe the|what does .* do)\b.*\b(company|business|organi[sz]ation|enterprise|client|firm|holding|group|holdco)\b/.test(
      q,
    )
  )
    return "loaded_context";
  // Advisory / judgment phrasing ("why is X a good problem / candidate / demo",
  // "what should we do", "recommend / prioritize / worth it") belongs on
  // Intelligence, not Home. Route to the Intelligence handoff so Home answers
  // with the "Open Intelligence" boundary instead of trying to give advice.
  if (
    /\b(should we|should i|what should|worth (doing|pursuing|it)|make the case|business case for|roi of|prioriti[sz]e|recommend)\b/.test(
      q,
    ) ||
    (/\b(good|right|best|compelling|ideal|strong)\b/.test(q) &&
      /\b(demo|use\s?case|example|candidate|problem|opportunity|bet|investment|first move)\b/.test(
        q,
      ))
  )
    return "handoff_intelligence";
  if (/business areas|business functions|available business/.test(q))
    return "business_areas";
  if (/technology leaders|named .*leaders|accountability/.test(q))
    return "technology_leaders";
  if (/it organization|it org|structured today|organization structured/.test(q))
    return "it_org";
  if (/application|core systems|systems context|apps/.test(q))
    return "apps_systems";
  if (/data|analytics estate/.test(q) && !/data-thin|thin/.test(q))
    return "data_estate";
  if (/integration|interfaces/.test(q)) return "integrations";
  if (/vendor|contract|sourcing/.test(q) && /source|sourcing/.test(q))
    return "sourcing_relevance";
  if (/vendor|contract/.test(q)) return "vendors_contracts";
  if (/budget|spend|financial evidence|financial context/.test(q))
    return "budget_spend";
  if (/ai footprint|automation footprint/.test(q)) return "ai_footprint";
  if (/ai initiatives|value evidence/.test(q)) return "ai_initiatives";
  if (/operations|service management/.test(q)) return "operations_service";
  if (/security|risk|compliance/.test(q)) return "risk_controls";
  if (/governance|policy/.test(q)) return "governance_policy";
  if (/metrics|outcome/.test(q)) return "metrics_outcomes";
  if (/missing evidence|evidence areas|before intelligence/.test(q))
    return "evidence_gaps";
  if (/data-thin|thin|caveated/.test(q)) return "data_thin";
  if (/ready|readiness|advisory use/.test(q)) return "readiness";
  if (/source trail|citation|citation basis/.test(q)) return "source_trail";
  if (/moves|strategic change|move/.test(q)) return "move_relevance";
  return "loaded_context";
}

function selectRows(
  dataset: V6Dataset,
  config: TopicConfig,
): Array<Record<string, string>> {
  return config.files.flatMap((file) =>
    (dataset.files[file] ?? [])
      .map((row) => ({ ...row, __file: file }))
      .filter((row) => hasUsableRow(row, config)),
  );
}

function hasUsableRow(
  row: Record<string, string>,
  config: TopicConfig,
): boolean {
  if (config.intent === "data_thin" || config.intent === "evidence_gaps")
    return Boolean(row.known_gaps);
  return config.tableColumns.some((column) => clean(row[column]));
}

function buildTable(
  rows: Array<Record<string, string>>,
  config: TopicConfig,
): V6HomeTable | null {
  const selected = rows.slice(0, 8);
  if (!selected.length) return null;
  return {
    headers: config.tableHeaders,
    rows: selected.map((row) =>
      config.tableColumns.map((column) => display(row[column], column)),
    ),
  };
}

function buildCitations(
  dataset: V6Dataset,
  config: TopicConfig,
  rows: Array<Record<string, string>>,
): V6HomeCitation[] {
  return config.files
    .map((file) => ({
      label: `${dataset.datasetDir}/templates/${file}`,
      sourceKey: "v6_dataset_pack",
      count: rows.filter((row) => row.__file === file).length,
    }))
    .filter((citation) => citation.count > 0);
}

function buildGaps(
  rows: Array<Record<string, string>>,
  dataset: V6Dataset,
  config: TopicConfig,
): V6HomeGap[] {
  const gapCounts = new Map<string, number>();
  for (const row of rows) {
    for (const gap of (row.known_gaps ?? "").split("|")) {
      const value = gap.trim();
      if (value.startsWith("data_thin:"))
        gapCounts.set(
          value.replace("data_thin:", ""),
          (gapCounts.get(value.replace("data_thin:", "")) ?? 0) + 1,
        );
    }
  }
  if (config.intent === "budget_spend") {
    const amountThin = rows.some((row) =>
      String(row.amount_usd ?? "").startsWith("data_thin:"),
    );
    if (amountThin)
      gapCounts.set(
        "amount_usd_missing",
        Math.max(gapCounts.get("amount_usd_missing") ?? 0, 1),
      );
  }
  return [...gapCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label: humanize(label),
      impact: `${count} ${count === 1 ? "V6 evidence item is" : "V6 evidence items are"} explicitly marked data-thin for this evidence area.`,
      remediation: `Load client-approved ${humanize(label).toLowerCase()} evidence into the V6 Home pack.`,
    }));
}

function buildAnswer(args: {
  dataset: V6Dataset;
  config: TopicConfig;
  topicKey: string;
  question: string;
  rows: Array<Record<string, string>>;
  gaps: V6HomeGap[];
  table: V6HomeTable | null;
  citations: V6HomeCitation[];
}): V6HomeAnswer {
  const { dataset, config, topicKey, rows, gaps, table } = args;
  const displayName = dataset.displayName;
  const contextQuality = buildContextQuality({
    dataset,
    config,
    topicKey,
    rows,
    gaps,
    citations: args.citations,
  });
  const paragraphs = answerParagraphsByTopic({
    displayName,
    dataset,
    config,
    topicKey,
    rows,
    gaps,
  });
  return {
    mode: "home_know",
    answerSource: "v6_dataset_contract",
    directAnswer: paragraphs.join("\n\n"),
    answerParagraphs: paragraphs,
    artifactPlan: table ? ["prose", "table"] : ["prose"],
    citations: args.citations,
    gaps,
    table,
    branchOptions: branchOptionsFor(config),
    followUpQuestion: followUpFor(topicKey),
    answerability: contextQuality.answerability,
    contextQuality,
    answerBoundary: {
      canAnswer: [
        `Answer from the selected V6 contract pack only.`,
        "Show loaded facts, explicit gaps, source evidence, readiness, and handoff boundaries.",
      ],
      cannotAnswer: [
        "Borrow facts from retired legacy Home context layers.",
        "Use dollar amounts, leaders, systems, vendors, or statuses that are not present in the selected V6 evidence.",
      ],
      handoffTarget: config.handoffTarget ?? null,
      handoffReason: config.handoffReason,
    },
    primaryDimension: config.primaryDimension,
    relatedDimensions: config.relatedDimensions,
    sourceFamiliesIncluded: config.files,
  };
}

function buildContextQuality(args: {
  dataset: V6Dataset;
  config: TopicConfig;
  topicKey: string;
  rows: Array<Record<string, string>>;
  gaps: V6HomeGap[];
  citations: V6HomeCitation[];
}): V6HomeContextQuality {
  const { dataset, config, topicKey, rows, gaps, citations } = args;
  const selectedFiles = config.files.length;
  const filesWithRows = new Set(rows.map((row) => row.__file).filter(Boolean))
    .size;
  const populatedCells = rows.reduce(
    (sum, row) =>
      sum +
      config.tableColumns.filter((column) => Boolean(clean(row[column])))
        .length,
    0,
  );
  const expectedCells = Math.max(rows.length * config.tableColumns.length, 1);
  const dataThinCount = rows.reduce(
    (sum, row) =>
      sum +
      Object.values(row).filter((value) =>
        String(value ?? "").startsWith("data_thin:"),
      ).length,
    0,
  );
  const relationshipRows = config.files.includes("V6_12_relationships.csv")
    ? rows.filter((row) => row.__file === "V6_12_relationships.csv").length
    : (dataset.files["V6_12_relationships.csv"]?.length ?? 0);
  const signoffCount = rows.reduce(
    (sum, row) =>
      sum +
      Object.entries(row).filter(
        ([key, value]) =>
          /signoff|approval|claim_maturity|not_allowed_claims|risk|governance/i.test(
            key,
          ) &&
          /required|data_thin|planning|not allowed|pending|missing|medium|high/i.test(
            String(value ?? ""),
          ),
      ).length,
    0,
  );
  const loadedFactCount = countFacts(rows);
  const coverageScore = clampScore(
    Math.round(
      ((filesWithRows / Math.max(selectedFiles, 1)) * 2 +
        (populatedCells / expectedCells) * 3) *
        10,
    ) / 10,
  );
  const freshnessScore = dataset.manifest.generatedAt ? 4 : 2;
  const confidenceScore = clampScore(
    5 - Math.min(3.5, gaps.length * 0.6 + dataThinCount * 0.04),
  );
  const relationshipScore = clampScore(
    relationshipRows > 0
      ? 4
      : config.primaryDimension === "relationships"
        ? 2
        : 3,
  );
  const citationScore = clampScore(
    Math.min(5, citations.length + (citations.length > 0 ? 2 : 0)),
  );
  const answerability = classifyAnswerability({
    config,
    topicKey,
    rows,
    gaps,
    dataThinCount,
  });
  const overall = overallContextQuality({
    answerability,
    coverageScore,
    confidenceScore,
    citationScore,
  });
  const primaryDimension = humanize(config.primaryDimension);
  const related = config.relatedDimensions.map(humanize);
  const strongDimensions = [
    ...(coverageScore >= 4 && confidenceScore >= 3.5 ? [primaryDimension] : []),
    ...related.filter((_, index) => index < 2 && relationshipScore >= 4),
  ];
  const mediumDimensions = [
    ...(coverageScore >= 2.5 && coverageScore < 4 ? [primaryDimension] : []),
    ...related
      .filter((dimension) => !strongDimensions.includes(dimension))
      .slice(0, 2),
  ];
  const thinDimensions = [
    ...(coverageScore < 2.5 || confidenceScore < 3 ? [primaryDimension] : []),
    ...gaps.slice(0, 3).map((gap) => gap.label),
  ].filter((value, index, all) => value && all.indexOf(value) === index);
  const handoffSurface = handoffSurfaceFor(config.handoffTarget);
  const recommendedHandoff =
    handoffSurface && handoffSurface !== "home"
      ? {
          target: handoffSurface,
          label: `Open ${surfaceName(handoffSurface)}`,
          reason:
            config.handoffReason ??
            `${surfaceName(handoffSurface)} owns the next decision step.`,
        }
      : null;

  return {
    answerability,
    overall,
    summary: contextQualitySummary({
      displayName: dataset.displayName,
      overall,
      answerability,
      strongDimensions,
      mediumDimensions,
      thinDimensions,
      recommendedHandoff,
    }),
    strongDimensions,
    mediumDimensions,
    thinDimensions,
    recommendedHandoff,
    dimensions: [
      {
        dimensionName: primaryDimension,
        coverageScore,
        freshnessScore,
        confidenceScore,
        relationshipScore,
        citationScore,
        gapCount: gaps.length,
        dataThinCount,
        loadedFactCount,
        assumptionCount:
          gaps.length + (answerability === "planning_grade_only" ? 1 : 0),
        clientSignoffRequiredCount: signoffCount,
        supportedAnswerTypes: supportedAnswerTypesFor(
          answerability,
          tableIntentFor(config, topicKey),
        ),
        blockedAnswerTypes: blockedAnswerTypesFor(answerability),
        handoffSurface,
      },
    ],
  };
}

function classifyAnswerability(args: {
  config: TopicConfig;
  topicKey: string;
  rows: Array<Record<string, string>>;
  gaps: V6HomeGap[];
  dataThinCount: number;
}): V6HomeAnswerability {
  const { config, topicKey, rows, gaps, dataThinCount } = args;
  if (!rows.length) return "data_thin";
  if (config.handoffTarget === "tower") return "requires_tower";
  if (config.handoffTarget === "intelligence") return "requires_intelligence";
  if (config.handoffTarget === "source") return "requires_source";
  if (config.handoffTarget === "moves") return "requires_moves";
  if (topicKey === "data_thin" || topicKey === "evidence_gaps")
    return "data_thin";
  if (
    [
      "budget_spend",
      "ai_initiatives",
      "ai_footprint",
      "board_summary",
      "metrics_outcomes",
    ].includes(topicKey) &&
    (gaps.length > 0 || dataThinCount > 0)
  ) {
    return "planning_grade_only";
  }
  if (gaps.length > 0 || dataThinCount > rows.length)
    return "answerable_with_caveat";
  return "answerable_from_loaded_context";
}

function overallContextQuality(args: {
  answerability: V6HomeAnswerability;
  coverageScore: number;
  confidenceScore: number;
  citationScore: number;
}): V6HomeContextQuality["overall"] {
  if (
    args.answerability === "unsupported" ||
    args.answerability === "blocked_wrong_tenant"
  )
    return "blocked";
  if (args.answerability === "data_thin") return "thin";
  const average =
    (args.coverageScore + args.confidenceScore + args.citationScore) / 3;
  if (average >= 4 && args.answerability === "answerable_from_loaded_context")
    return "strong";
  if (average >= 2.75) return "medium";
  return "thin";
}

function contextQualitySummary(input: {
  displayName: string;
  overall: V6HomeContextQuality["overall"];
  answerability: V6HomeAnswerability;
  strongDimensions: string[];
  mediumDimensions: string[];
  thinDimensions: string[];
  recommendedHandoff: V6HomeContextQuality["recommendedHandoff"];
}): string {
  const strength = input.strongDimensions.length
    ? `strong in ${joinList(input.strongDimensions)}`
    : "not yet strong in a scored dimension";
  const caveat = input.thinDimensions.length
    ? `thin in ${joinList(input.thinDimensions)}`
    : "with no named thin dimension surfaced";
  const route = input.recommendedHandoff
    ? ` Route ${input.recommendedHandoff.target ? `to ${surfaceName(input.recommendedHandoff.target)}` : "to the right module"} for the next decision.`
    : "";
  return `${input.displayName} Home context quality is ${input.overall}: ${strength}; ${caveat}. Answerability is ${humanize(input.answerability)}.${route}`;
}

function supportedAnswerTypesFor(
  answerability: V6HomeAnswerability,
  tableIntent: string,
): string[] {
  const base = ["context summary", "gap explanation", "handoff guidance"];
  if (
    answerability === "answerable_from_loaded_context" ||
    answerability === "answerable_with_caveat"
  ) {
    base.unshift("factual lookup");
  }
  if (answerability === "planning_grade_only") {
    base.push("planning-grade framing");
  }
  if (tableIntent === "table") base.push("table");
  return base;
}

function blockedAnswerTypesFor(answerability: V6HomeAnswerability): string[] {
  if (answerability === "planning_grade_only") {
    return [
      "board-grade value claim",
      "unsupported precision",
      "scale/stop decision",
    ];
  }
  if (answerability === "data_thin") {
    return [
      "confident answer",
      "board-grade claim",
      "unsupported table or chart",
    ];
  }
  if (answerability.startsWith("requires_")) {
    return ["module-owned decision inside Home"];
  }
  return ["unsupported precision", "retired legacy context"];
}

function tableIntentFor(config: TopicConfig, topicKey: string): string {
  return config.tableHeaders.length > 0 && topicKey !== "loaded_context"
    ? "table"
    : "prose";
}

function handoffSurfaceFor(
  value: string | null | undefined,
): V6HomeContextQualityDimension["handoffSurface"] {
  if (
    value === "intelligence" ||
    value === "tower" ||
    value === "source" ||
    value === "moves"
  )
    return value;
  return null;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, Math.round(value * 10) / 10));
}

function answerParagraphsByTopic(args: {
  displayName: string;
  dataset: V6Dataset;
  config: TopicConfig;
  topicKey: string;
  rows: Array<Record<string, string>>;
  gaps: V6HomeGap[];
}): string[] {
  const { displayName, dataset, config, topicKey, rows, gaps } = args;
  const countLine = `${displayName} has ${rows.length} usable V6 ${humanize(config.primaryDimension).toLowerCase()} evidence item${rows.length === 1 ? "" : "s"} loaded across ${config.files.length} governed evidence area${config.files.length === 1 ? "" : "s"}.`;
  if (topicKey === "budget_spend") {
    const amounts = rows.map((row) => clean(row.amount_usd)).filter(Boolean);
    const usableAmounts = amounts.filter((value) => /^\d/.test(value));
    const profile = firstRows(
      dataset.files["V6_01_enterprise_profile.csv"] ?? [],
      1,
    )[0];
    const strategicBudget = describeStrategicPriorities(
      profile?.strategic_priorities,
    );
    return [
      usableAmounts.length
        ? `${countLine} V6 spend records are loaded and support the listed amount fields below; each amount must stay tied to amount type, owner, and source evidence. Home should not reuse older budget figures that are not present in the selected V6 evidence.`
        : `${countLine} The V6 spend records are loaded, but the selected spend evidence marks amount, owner, program, vendor, system, value linkage, and unit economics as data-thin. Home should not reuse older budget figures or invent a spend breakout.`,
      strategicBudget
        ? `Profile-level strategic priority context available here: ${strategicBudget}. Treat that as context, not Tower-grade budget evidence.`
        : "No board-grade budget amount is supported by the selected V6 spend evidence.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "business_areas") {
    const names = rows
      .slice(0, 6)
      .map((row) => clean(row.function_name))
      .filter(Boolean);
    return [
      `${countLine} The loaded business areas include ${joinList(names)}.`,
      "Each record carries an executive-owner field and critical-process text. If a KPI field is marked data-thin, Home should say that instead of converting the business-function list into generic context categories.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "apps_systems") {
    const named = rows
      .map((row) => clean(row.system_name))
      .filter((value) => value && !/application_system record/i.test(value))
      .slice(0, 6);
    return [
      named.length
        ? `${countLine} Named systems include ${joinList(named)}. Use the table for owner, criticality, and lifecycle status.`
        : `${countLine} The V6 application evidence is present, but many items have generic system labels or data-thin ownership fields. Home can describe coverage and caveats, not a polished named application inventory.`,
      "The required V6 fields for this answer are system name, system owner, criticality, lifecycle status, integrations, data dependencies, and AI relevance. Missing or data-thin values must remain visible.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "vendors_contracts" || topicKey === "sourcing_relevance") {
    const vendors = rows
      .slice(0, 8)
      .map((row) => clean(row.vendor_name))
      .filter(Boolean);
    return [
      `${countLine} Named vendor records include ${joinList(vendors)}.`,
      "Use renewal date, service, linked systems, pricing basis, and contract risk where present. If annual cost or contract risk is data-thin, Home must not substitute older run-rate numbers.",
      config.handoffTarget === "source"
        ? "Source should take over when the user asks for sourcing decisions, vendor tradeoffs, RFP strategy, renewals, or partner recommendations."
        : gapSentence(gaps),
    ];
  }
  if (topicKey === "operations_service") {
    const processes = rows
      .slice(0, 6)
      .map((row) => clean(row.process) || clean(row.record_name))
      .filter(Boolean);
    return [
      `${countLine} Loaded process/control examples include ${joinList(processes)}.`,
      "The V6 operations answer should name process, severity, status, control, affected systems, and business impact only when those fields are populated. Data-thin control fields should remain caveated.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "technology_leaders" || topicKey === "it_org") {
    const roles = rows
      .slice(0, 8)
      .map(
        (row) => `${display(row.org_unit_name)} (${display(row.leader_role)})`,
      );
    return [
      `${countLine} The supported technology accountability view is role/domain based: ${joinList(roles)}.`,
      "Named people should not be invented. If reports-to or person-name fields are missing, Home should stay at leader-role, org-unit, decision-rights, owned-systems, and owned-process level.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "ai_footprint") {
    const uses = rows
      .slice(0, 8)
      .map((row) => {
        const useCase = clean(row.use_case) || clean(row.tool_or_model);
        const active = clean(row.active_users);
        const licensed = clean(row.licensed_users);
        return active && licensed
          ? `${useCase} (${active}/${licensed} active/licensed)`
          : useCase;
      })
      .filter(Boolean);
    return [
      `${countLine} AI/tool usage records include ${joinList(uses)}.`,
      "Scale/hold/stop conclusions require adoption, measured value, risk status, model risk tier, and data readiness. Missing fields must be shown as gaps rather than smoothed into a confident AI portfolio answer.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "source_trail") {
    const evidence = rows
      .slice(0, 6)
      .map(
        (row) =>
          `${display(row.evidence_title)} (${display(row.evidence_type)}, ${display(row.evidence_confidence)})`,
      );
    return [
      `${countLine} The source trail is explicit in V6 evidence-source records: ${joinList(evidence)}.`,
      "Home can cite the evidence title, evidence type, source location, owner, and confidence. If source location or owner is data-thin, that limitation must be shown before Intelligence or Source relies on it.",
      gapSentence(gaps),
    ];
  }
  if (topicKey === "loaded_context") {
    const profile = firstRows(
      dataset.files["V6_01_enterprise_profile.csv"] ?? [],
      1,
    )[0];
    const company = clean(profile?.company_name) || displayName;
    const industry = clean(profile?.industry);
    const subIndustry = clean(profile?.sub_industry);
    const model = clean(profile?.business_model);
    const employees = clean(profile?.employee_count);
    const employeeLine =
      employees && /^\d+$/.test(employees)
        ? `${Number(employees).toLocaleString()} employees`
        : "";
    // Drop directive / data-thin tokens ("do_not_add_...") and the employee
    // count (already stated in the identity line) so only fresh facts show.
    const rawPriorities = clean(profile?.strategic_priorities);
    const priorities = rawPriorities
      ? describeStrategicPriorities(
          rawPriorities
            .split("|")
            .filter(
              (part) => !/^\s*(do_not|data_thin|total_employees)/i.test(part),
            )
            .join("|"),
        )
      : "";
    const descriptor = industry
      ? subIndustry
        ? `${industry} — ${subIndustry}`
        : industry
      : "";
    const identitySentences: string[] = [];
    identitySentences.push(
      descriptor
        ? `${company} is a ${descriptor}${employeeLine ? `, with ${employeeLine}` : ""}.`
        : `${company} is the enterprise loaded in the V6 Home contract pack, spanning ${dataset.manifest.totals.files} governed evidence areas and ${dataset.manifest.totals.rows} business records.`,
    );
    if (model) identitySentences.push(`${model.trim().replace(/\.+$/, "")}.`);
    const identity = identitySentences.join(" ");
    const programs = (dataset.files["V6_09_programs_initiatives.csv"] ?? [])
      .map((row) => {
        const name = clean(row.record_name);
        const phase = clean(row.phase);
        return name ? (phase ? `${name} (${phase})` : name) : "";
      })
      .filter(Boolean)
      .slice(0, 4);
    return [
      identity,
      priorities
        ? `Loaded profile context: ${priorities}. Home grounds only on these V6 facts and shows data-thin fields as gaps rather than borrowing from retired legacy context layers.`
        : `${company}'s profile is loaded across ${dataset.manifest.totals.files} governed evidence areas and ${dataset.manifest.totals.rows} business records; Home answers only what those V6 facts support.`,
      programs.length
        ? `Loaded initiatives Home can orient a CXO on include ${joinList(programs)} — each carries owner, sponsor, phase, budget, value basis, and risk in the V6 evidence, which is what makes them credible demo problems rather than generic context categories.`
        : "Home can safely answer what is loaded, which facts are populated, which are data-thin, and which workspace should take over the next decision.",
      gapSentence(gaps),
    ];
  }
  return [
    countLine,
    summarizeRows(rows, config),
    config.handoffTarget
      ? `${surfaceName(config.handoffTarget)} owns ${handoffOwnership(config.handoffTarget)}. Home should only ground the loaded V6 facts and evidence gaps.`
      : gapSentence(gaps),
  ];
}

function summarizeRows(
  rows: Array<Record<string, string>>,
  config: TopicConfig,
): string {
  const samples = rows
    .slice(0, 5)
    .map((row) =>
      config.tableColumns
        .map((column) => display(row[column], column))
        .filter(
          (value) =>
            value && value !== "Data-thin" && !/ reference$/i.test(value),
        )
        .slice(0, 2)
        .join(" / "),
    )
    .filter(Boolean);
  return samples.length
    ? `Representative V6 values: ${joinList(samples)}.`
    : "The selected V6 evidence is present, but the usable fields for this question are data-thin.";
}

function branchOptionsFor(config: TopicConfig): V6HomeAnswer["branchOptions"] {
  return config.relatedDimensions.slice(0, 4).map((dimension) => ({
    label: humanize(dimension),
    summary: `Inspect the related V6 ${humanize(dimension).toLowerCase()} facts and gaps.`,
    dimensionKey: dimension,
  }));
}

function followUpFor(topicKey: string): string {
  if (topicKey === "budget_spend")
    return "Do you want the V6 spend gaps listed by missing amount, owner, value linkage, and unit-economics fields?";
  if (topicKey === "sourcing_relevance")
    return "Do you want Source to open a sourcing-readiness view using these V6 vendor and evidence items?";
  if (topicKey === "handoff_tower")
    return "Do you want Tower to evaluate adoption, spend, readiness, and value from its governed packet?";
  return "Which V6 evidence area or gap should aVa inspect next?";
}

function visibleQualityGate(
  answer: V6HomeAnswer,
): V6HomeAskResult["proof"]["qualityGate"] {
  const text = answer.directAnswer;
  const issues: string[] = [];
  if (
    /semantic2|enterprise_context_|source rows|raw facts|datasets\//i.test(text)
  )
    issues.push("raw_internal_marker");
  if (/as discussed|this session|earlier in this session/i.test(text))
    issues.push("session_dependent_answer");
  if (/\b(SHA-|APP-|Row:)\b/i.test(text)) issues.push("raw_record_id");
  return {
    passed: issues.length === 0,
    issues,
    visibleAnswerContract: { passed: issues.length === 0, issues },
  };
}

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}

function clean(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text.startsWith("data_thin:")) return "";
  if (
    /^(synthetic_demo|v4_synthetic_pack|confidential|static_snapshot)$/i.test(
      text,
    )
  )
    return "";
  return text;
}

function display(value: unknown, column?: string): string {
  const text = clean(value);
  if (!text) return "Data-thin";
  return scrubVisibleDatasetValue(text, column);
}

function describeStrategicPriorities(value: unknown): string {
  const text = clean(value);
  if (!text) return "";
  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [rawKey, ...rawValue] = part.split(":");
      const key = humanize(rawKey.trim()).toLowerCase();
      const joinedValue = rawValue.join(":").trim();
      if (!joinedValue) return humanize(part);
      if (/usd$/i.test(rawKey.trim()) && /^\d+(\.\d+)?$/.test(joinedValue)) {
        return `${key.replace(/ usd$/i, "")}: ${formatUsd(Number(joinedValue))}`;
      }
      return `${key}: ${humanize(joinedValue)}`;
    });
  return joinList(parts);
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B`;
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function firstRows(
  rows: Array<Record<string, string>>,
  count: number,
): Array<Record<string, string>> {
  return rows.slice(0, count);
}

function countFacts(rows: Array<Record<string, string>>): number {
  return rows.reduce(
    (sum, row) =>
      sum + Object.values(row).filter((value) => Boolean(clean(value))).length,
    0,
  );
}

function gapSentence(gaps: V6HomeGap[]): string {
  if (!gaps.length)
    return "No specific V6 gap is surfaced for this question, but final decisions still require client validation of source ownership and freshness.";
  return `Important V6 gap: ${gaps[0].label}. ${gaps[0].impact}`;
}

function joinList(values: string[]): string {
  const cleanValues = values.filter(Boolean).slice(0, 8);
  if (cleanValues.length === 0)
    return "no populated values in the selected V6 evidence";
  if (cleanValues.length === 1) return cleanValues[0];
  return `${cleanValues.slice(0, -1).join(", ")}, and ${cleanValues[cleanValues.length - 1]}`;
}

function humanize(value: string): string {
  if (value === "data_thin") return "Caveated Evidence";
  return value
    .replace(/^V6_\d+_/, "")
    .replace(/\.csv$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function surfaceName(value: string): string {
  if (value === "source") return "Source";
  if (value === "tower") return "Tower";
  if (value === "moves") return "Moves";
  if (value === "intelligence") return "Intelligence";
  return value;
}

function handoffOwnership(value: string): string {
  if (value === "source")
    return "sourcing events, vendor evidence, renewal decisions, and partner tradeoffs";
  if (value === "tower")
    return "portfolio execution, spend, adoption, readiness, and value tracking";
  if (value === "moves")
    return "governed change framing, ownership, sequencing, and mobilization";
  if (value === "intelligence")
    return "advisory synthesis, options, and pattern-backed leadership recommendations";
  return "the next-step decision workflow";
}

function scrubVisibleDatasetValue(value: string, column?: string): string {
  const lowerColumn = column?.toLowerCase() ?? "";
  if (/\.csv\b|datasets\//i.test(value)) return "Source evidence register";
  if (/^[A-Z]{2,}-IT-\d+$/i.test(value)) return "Technology owner reference";
  if (/^APP-\d+$/i.test(value)) return "Application reference";
  if (/^SHA-[A-Z0-9-]+$/i.test(value)) return "Source checksum";
  if (lowerColumn.includes("source_location"))
    return "Source evidence register";
  return value;
}

function hash(value: string): string {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (Math.imul(31, result) + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result).toString(16);
}
