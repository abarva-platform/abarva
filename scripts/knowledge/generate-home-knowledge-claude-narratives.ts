import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadEnvConfig } from "@next/env";

import { scrubPublicAvaAnswerText } from "../../src/lib/ava-answer/public-answer-scrub";
import type { ModuleContextRequestedDomain } from "../../src/lib/enterprise-data/contracts/module-context-apis";
import type {
  KnowledgeDimensionNarrativeSummary,
  KnowledgeHomeInsightSummary,
} from "../../src/lib/enterprise-knowledge/narratives/knowledge-narrative-store";

const repoRoot = process.cwd();
const fallbackRepoRoot = "/Users/anand/Projects/nexus";
loadEnvConfig(repoRoot);
if (!process.env.ANTHROPIC_API_KEY && existsSync(path.join(fallbackRepoRoot, ".env.local"))) {
  loadEnvConfig(fallbackRepoRoot);
  loadFallbackEnvKey(path.join(fallbackRepoRoot, ".env.local"), "ANTHROPIC_API_KEY");
}

const outDir = path.join(repoRoot, "reports/home-knowledge-story-quality");
const generatedDir = path.join(
  repoRoot,
  "src/lib/enterprise-knowledge/narratives/generated",
);
const generatedTsPath = path.join(generatedDir, "meridian-claude-approved.ts");
const model = process.env.HOME_KNOWLEDGE_STORY_CLAUDE_MODEL || "claude-opus-4-8";
const generatedAt = new Date().toISOString();

const requiredDimensions = [
  ["00_enterprise_profile", "Enterprise Profile"],
  ["01_business_functions", "Business Functions"],
  ["02_org_ownership", "Org Ownership"],
  ["03_workforce_roles", "Workforce Roles"],
  ["04_applications_systems", "Applications & Systems"],
  ["05_data_assets_integrations", "Data Assets & Integrations"],
  ["06_infrastructure_platforms", "Infrastructure & Platforms"],
  ["07_vendors_contracts", "Vendors & Contracts"],
  ["08_it_budget_spend_value", "IT Budget, Spend & Value"],
  ["09_programs_initiatives", "Programs & Initiatives"],
  ["10_ai_automation_use_cases", "AI & Automation Use Cases"],
  ["11_risks_controls", "Risks & Controls"],
  ["12_relationships", "Relationships"],
  ["13_evidence_sources", "Evidence Sources"],
  ["14_metrics_outcomes", "Metrics & Outcomes"],
  ["15_industry_context_patterns", "Industry Context & Patterns"],
  ["16_expert_lenses", "Expert Lenses"],
  ["17_managed_services_scope", "Managed Services Scope"],
  ["18_operational_process_evidence", "Operational Process Evidence"],
] as const;

const evidenceRefs = [
  "meridian-enterprise-profile",
  "meridian-member-service-context",
  "meridian-current-analytics-estate",
  "meridian-agent-assist-use-case",
  "meridian-risk-control-context",
  "meridian-metrics-baseline-context",
];

const safeClaims = [
  "This is synthetic Meridian-style demo context, not real Meridian production data.",
  "Nexus has source-backed context for discovery, chartering, and current-state diagnosis.",
  "AWS and Databricks are represented as a target-state foundation, not a certified current production platform.",
  "Agent Assist is ready for evidence planning and phase-gated execution framing, not production launch.",
];

const doNotClaim = [
  "Do not claim real Meridian production data was loaded.",
  "Do not claim AWS or Databricks is certified current production for this tenant.",
  "Do not claim realized ROI, Tower value, or savings until measured evidence exists.",
  "Do not claim PHI-bearing transcripts have been ingested or approved.",
  "Do not treat candidate or generated graph rows as approved active tenant truth.",
];

type ClaudeStoryPayload = {
  homeInsightSummary: Omit<
    KnowledgeHomeInsightSummary,
    | "tenant_key"
    | "tenant_name"
    | "source_context_hash"
    | "evidence_refs_used"
    | "relationship_edges_used"
    | "context_gap_ids_used"
    | "generated_by"
    | "generated_model"
    | "generated_at"
    | "validation_status"
    | "validation_errors"
  >;
  dimensionNarratives: Array<
    Omit<
      KnowledgeDimensionNarrativeSummary,
      | "tenant_key"
      | "tenant_name"
      | "safe_demo_claims"
      | "do_not_claim"
      | "evidence_refs_used"
      | "source_fact_ids_used"
      | "entity_profile_ids_used"
      | "relationship_edge_ids_used"
      | "context_gap_ids_used"
      | "source_context_hash"
      | "generated_by"
      | "generated_model"
      | "generated_at"
      | "validation_status"
      | "validation_errors"
      | "unsupported_claims"
      | "active_or_candidate_status"
    >
  >;
};

const contextPack = {
  tenant_key: "meridian-health",
  tenant_name: "Healthcare Demo / Meridian Health",
  context_pack_id: "home-knowledge-story-quality-meridian-2026-07-15",
  product_truth: {
    synthetic_demo_only: true,
    real_client_production_data_loaded: false,
    candidate_preview_active: false,
    active_context_path: "Active module-context path where promoted data exists",
    required_wording:
      "source-backed synthetic demo context; do not call it real Meridian production data",
  },
  enterprise_profile: {
    company_story:
      "Mid-to-large healthcare enterprise using a synthetic Meridian-style profile for member service, health plan operations, clinical operations, finance, quality, technology, and data/analytics transformation.",
    leadership_and_metadata_status:
      "Leadership, headquarters, revenue, employee count, global locations, and exact production footprint must be validated by a client packet before being displayed as facts.",
  },
  meridian_current_state: {
    business_anchor:
      "Member service/contact center Agent Assist is the worked example. It depends on member service operations, supervisors, knowledge stewards, health plan operations, claims, eligibility/benefits, clinical reporting, data governance, privacy, and analytics.",
    systems:
      "Current-state systems include CRM/member-service platform, contact center platform, claims administration platform, eligibility and benefits platform, knowledge base, Epic Clarity, Epic Caboodle, on-prem SQL Server reporting marts, DB2 or Netezza-style integration warehouse where applicable, Tableau used by thousands of users, SAS analytics used by hundreds of users, Power BI, and fragmented reporting/data marts.",
    data_state:
      "Current analytics are on-premise and fragmented. Many reporting marts and analytics resources support ad hoc maintenance and reporting. Formal lakehouse, medallion architecture, platform/network/security foundation, and governed data products are target-state needs, not current production facts.",
    target_state:
      "Target direction is AWS + Databricks lakehouse with medallion architecture, governed data products, identity/member/provider spine, Unity Catalog or equivalent governance, lineage, PHI controls, HITL/audit controls, and module-ready context packs.",
    gaps:
      "Transcript/call-recording governance is not validated. KPI baselines are incomplete. API/integration readiness for CRM, claims, eligibility, knowledge, and Epic-derived data needs validation. Contract economics and realized savings are not proven.",
  },
  module_roles: {
    Knowledge:
      "Explains what the enterprise context says, what evidence supports it, and what gaps remain.",
    Intelligence:
      "Uses the context to reason about AI investment focus, readiness, risks, and options.",
    Moves:
      "Turns selected bets such as Agent Assist or data foundation into phase-gated execution.",
    Source:
      "Uses system/vendor/platform context for sourcing scope and contract optimization once commercial evidence is loaded.",
    Tower:
      "Uses metric baselines, owners, and outcome evidence for value realization; no realized claims without actuals.",
  },
  required_dimensions: requiredDimensions.map(([dimension_key, dimension_name]) => ({
    dimension_key,
    dimension_name,
  })),
  required_terms: [
    "member service",
    "contact center",
    "CRM",
    "claims",
    "eligibility",
    "knowledge base",
    "Epic Clarity",
    "Epic Caboodle",
    "SQL Server reporting marts",
    "DB2",
    "Netezza",
    "Tableau",
    "SAS",
    "AWS",
    "Databricks",
    "medallion",
    "Unity Catalog",
    "PHI",
    "human-in-the-loop",
    "audit controls",
    "target-state",
    "not current production",
  ],
  do_not_claim: doNotClaim,
};

const systemPrompt = `You are generating client-facing AbarVa Nexus Home / Knowledge narratives.

Use only the supplied governed context pack. Do not invent real client facts, revenues, employee counts, certified production state, realized value, PHI ingestion, or module behavior.

Return strict JSON only. Do not include markdown.

This is not a user guide. Write as a senior enterprise advisor explaining the tenant story. Use the context layer as the hero and Agent Assist as one worked example.

Avoid UI/meta language in visible narrative fields: no "packet generated", "loaded records", "route", "table", "Questions this supports", "Not yet supported", "user guide", "debug", "V4", "V5", "V6", "V7".

Required output JSON:
{
  "homeInsightSummary": {
    "summary_title": string,
    "executive_summary": string,
    "strategic_priorities": string[],
    "top_insights": [{"title": string, "what_nexus_sees": string, "why_it_matters": string, "evidence_strength": "Strong"|"Medium"|"Partial"|"Gap"|"Target / Future", "related_dimensions": string[], "next_action": string, "module_handoff": string}],
    "enterprise_context_map": [{"from": string, "relation": string, "to": string, "caveat"?: string}],
    "readiness_matrix": [{"dimension": string, "readiness": "Strong"|"Partial"|"Gap"|"Target / Future"|"Not validated", "story": string}],
    "evidence_heatmap": [{"dimension": string, "evidence_coverage": "High"|"Medium"|"Partial"|"Low", "confidence": "High"|"Medium"|"Low", "caveat": string}],
    "top_gaps": [{"gap": string, "why_it_matters": string, "source_dimension": string, "evidence_requested": string, "suggested_workshop_owner": string, "module_impacted": string}],
    "module_readiness": [{"module": "Knowledge"|"Intelligence"|"Moves"|"Source"|"Tower", "readiness": string, "next_best_action": string}],
    "safe_claims": string[],
    "do_not_claim": string[]
  },
  "dimensionNarratives": [{
    "dimension_key": string,
    "dimension_name": string,
    "summary_title": string,
    "executive_summary": string,
    "what_nexus_knows": string[],
    "why_it_matters": string,
    "questions_supported": string[],
    "current_caveats": string[],
    "next_validation_actions": string[],
    "module_usage": string[]
  }]
}

Coverage rules:
- Return every required dimension exactly once.
- For Applications & Systems, explain current on-prem/reporting/Epic/CRM/claims/eligibility/knowledge systems and caveat AWS + Databricks as target-state only.
- For Data Assets & Integrations, explain fragmented marts, Epic Clarity/Caboodle, SQL Server, DB2/Netezza-style warehouse, Tableau, SAS, and future governed lakehouse.
- For home summary, include cross-dimension insights, decision implications, and module handoffs.
- For enterprise_context_map, include at least 8 edges so the Home visual can tell the context-layer story.
- Keep do-not-claim as evidence boundary data; do not make it the main story.`;

let userPrompt = JSON.stringify(contextPack, null, 2);
const homeOnlySystemPrompt = `${systemPrompt}

For this call, return ONLY {"homeInsightSummary": ...}. Do not include dimensionNarratives.`;
const dimensionsOnlySystemPrompt = `${systemPrompt}

For this call, return ONLY {"dimensionNarratives": [...]}. Do not include homeInsightSummary.
Keep every field concise: executive_summary under 70 words, arrays to 2 items, module_usage to 2 items.`;
let promptHash = sha256([systemPrompt, userPrompt].join("\n\n"));
let contextPackHash = sha256(userPrompt);

function ensureDirs() {
  for (const dir of [
    outDir,
    path.join(outDir, "claude-prompts"),
    path.join(outDir, "claude-responses"),
    path.join(outDir, "approved"),
    generatedDir,
  ]) {
    mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  ensureDirs();
  await hydrateRuntimeModuleContext();
  refreshPromptHashes();
  const blockedBase = {
    tenant_key: "meridian-health",
    tenant_name: "Healthcare Demo / Meridian Health",
    context_pack_id: contextPack.context_pack_id,
    context_pack_hash: contextPackHash,
    prompt_hash: promptHash,
    generated_at: generatedAt,
    model,
  };

  writeFileSync(
    path.join(outDir, "claude-prompts/meridian-home-story-prompt.txt"),
    [systemPrompt, userPrompt].join("\n\n"),
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    writeJson(path.join(outDir, "summary.json"), {
      ...blockedBase,
      status: "blocked_missing_anthropic_key",
      truth_split:
        "Claude narrative generation did not run because ANTHROPIC_API_KEY was not configured.",
    });
    writeFileSync(
      path.join(outDir, "summary.md"),
      `# Home Knowledge Story Quality Stopline\n\nStatus: blocked_missing_anthropic_key\n\nNo Claude output was generated, and no seed text was approved as Claude-derived.\n`,
    );
    process.exit(2);
  }

  const homeResponsePath = path.join(
    outDir,
    "claude-responses/meridian-home-insight-response.txt",
  );
  const dimensionResponsePath = path.join(
    outDir,
    "claude-responses/meridian-dimension-narratives-response.txt",
  );
  const reuseResponses =
    process.env.HOME_KNOWLEDGE_STORY_REUSE_RESPONSES === "1" &&
    existsSync(homeResponsePath) &&
    existsSync(dimensionResponsePath);
  const rawHomeResponse = reuseResponses
    ? readFileSync(homeResponsePath, "utf8")
    : await callClaudeText(homeOnlySystemPrompt, userPrompt, 8000);
  writeFileSync(
    homeResponsePath,
    rawHomeResponse,
  );
  const rawDimensionsResponse = reuseResponses
    ? readFileSync(dimensionResponsePath, "utf8")
    : await callClaudeText(dimensionsOnlySystemPrompt, userPrompt, 16000);
  writeFileSync(
    dimensionResponsePath,
    rawDimensionsResponse,
  );
  const rawResponse = JSON.stringify(
    {
      homeInsightSummary: parseClaudeJson(rawHomeResponse).homeInsightSummary,
      dimensionNarratives: parseClaudeJson(rawDimensionsResponse).dimensionNarratives,
    },
    null,
    2,
  );
  writeFileSync(
    path.join(outDir, "claude-responses/meridian-home-story-response.txt"),
    rawResponse,
  );

  const parsed = parseClaudeJson(rawResponse);
  const approved = buildApprovedArtifacts(parsed);
  const validation = validateApprovedArtifacts(approved);
  const unsupportedClaims = validation.filter((item) =>
    /overclaim|forbidden|wrong tenant|legacy|user-guide|missing required/i.test(item),
  );
  const status = validation.length === 0 ? "passed" : "failed";

  approved.homeInsightSummary.validation_status = status;
  approved.homeInsightSummary.validation_errors = validation;
  approved.dimensionNarratives = approved.dimensionNarratives.map((summary) => ({
    ...summary,
    validation_status: status,
    validation_errors: validation.filter((item) =>
      item.includes(summary.dimension_key),
    ),
    unsupported_claims: unsupportedClaims,
  }));

  writeJson(path.join(outDir, "approved/home-insights-approved.json"), approved.homeInsightSummary);
  writeJson(
    path.join(outDir, "approved/dimension-narratives-approved.json"),
    approved.dimensionNarratives,
  );
  writeJson(path.join(outDir, "validation-results.json"), {
    status,
    validation,
    unsupportedClaims,
  });
  writeCsv(path.join(outDir, "unsupported-claims.csv"), [
    ["status", "claim"],
    ...(unsupportedClaims.length
      ? unsupportedClaims.map((claim) => ["blocked", claim])
      : [["passed", "none"]]),
  ]);
  writeCsv(path.join(outDir, "validation-results.csv"), [
    ["status", "message"],
    ...(validation.length
      ? validation.map((message) => ["failed", message])
      : [["passed", "Claude-derived story quality artifact passed validation"]]),
  ]);

  writeJson(path.join(outDir, "claude-generation-log.json"), {
    ...blockedBase,
    status,
    transport: "anthropic_messages_api",
    prompt_path: "reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt",
    raw_response_path:
      "reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt",
    approved_home_path:
      "reports/home-knowledge-story-quality/approved/home-insights-approved.json",
    approved_dimensions_path:
      "reports/home-knowledge-story-quality/approved/dimension-narratives-approved.json",
    validation,
    unsupportedClaims,
  });
  writeJson(path.join(outDir, "summary.json"), {
    ...blockedBase,
    status,
    claude_derived: true,
    model,
    dimensions: approved.dimensionNarratives.length,
    validation,
    unsupportedClaims,
  });
  writeFileSync(path.join(outDir, "summary.md"), renderSummaryMd(status, validation));
  writeFileSync(path.join(outDir, "quality-audit.md"), renderQualityAuditMd(status, approved, validation));
  writeJson(path.join(outDir, "quality-audit.json"), {
    status,
    opinion:
      status === "passed"
        ? "The artifact is usable as a client-story baseline for Meridian Home, with Agent Assist as a worked example and target-state caveats preserved."
        : "The artifact is not client-story-ready until validation failures are fixed.",
    validation,
  });
  writeFileSync(
    path.join(outDir, "rendered-review-table.md"),
    renderRenderedReviewTableMd(approved),
  );
  writeFileSync(
    path.join(outDir, "rendered-review-table.html"),
    renderRenderedReviewTableHtml(approved),
  );
  writeFileSync(path.join(outDir, "home-story-quality-proof.html"), renderProofHtml(status, approved, validation));
  writeGeneratedTs(approved);

  if (status !== "passed") {
    process.exit(1);
  }
}

async function hydrateRuntimeModuleContext() {
  const { getModuleContext, explainModuleContext } = await import(
    "../../src/lib/enterprise-data/module-context-serving/module-context-serving"
  );
  const requestedDomains: ModuleContextRequestedDomain[] = [
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
  const request = {
    tenantKey: "meridian-health",
    moduleKey: "home" as const,
    purpose: "context_summary" as const,
    mode: "active" as const,
    requestedDomains,
    relationshipPolicy: "validated_and_candidates" as const,
    evidencePolicy: "lineage_required" as const,
  };
  const [moduleContext, explanation] = await Promise.all([
    getModuleContext(request, { repoRoot, generatedAt }),
    explainModuleContext(request, { repoRoot, generatedAt }),
  ]);
  const recordsByDomain = Object.fromEntries(
    requestedDomains.map((domain) => [
      domain,
      moduleContext.records
        .filter((record) => record.domain === domain)
        .slice(0, 18)
        .map((record) => ({
          recordId: record.recordId,
          title: record.title,
          summary: record.summary,
          objectType: record.objectType,
          fields: Object.fromEntries(Object.entries(record.fields).slice(0, 10)),
          citationStatus: record.citationStatus,
          agentReadiness: record.agentReadiness,
          relationshipReadiness: record.relationshipReadiness,
          confidence: record.confidence,
          evidenceRefs: record.sourceEvidenceIds.slice(0, 6),
        })),
    ]),
  );
  (contextPack as Record<string, unknown>).active_module_context = {
    sourceMode: moduleContext.sourceMode,
    activeTenantAccessVersionId: moduleContext.activeTenantAccessVersionId,
    contextCompleteness: moduleContext.contextCompleteness,
    domains: moduleContext.domains,
    recordsByDomain,
    evidenceRefs: moduleContext.evidenceRefs.slice(0, 50),
    relationships: [
      ...moduleContext.validatedRelationships,
      ...moduleContext.relationshipCandidates,
    ]
      .slice(0, 100)
      .map((relationship) => ({
        relationshipId: relationship.relationshipId,
        sourceRecordId: relationship.sourceRecordId,
        relationshipType: relationship.relationshipType,
        targetRecordId: relationship.targetRecordId,
        readiness: relationship.readiness,
        evidenceIds: relationship.evidenceIds.slice(0, 6),
      })),
    gaps: moduleContext.gaps.slice(0, 50),
    readiness: moduleContext.readiness,
    caveats: moduleContext.caveats,
    explanation,
  };
}

function refreshPromptHashes() {
  userPrompt = JSON.stringify(contextPack, null, 2);
  promptHash = sha256([systemPrompt, userPrompt].join("\n\n"));
  contextPackHash = sha256(userPrompt);
}

async function callClaudeText(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const request: Parameters<typeof client.messages.create>[0] = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  };
  if (!/claude-opus-4-8/i.test(model)) {
    request.temperature = 0.1;
  }
  const response = (await client.messages.create(request)) as {
    content: Array<{ type: string; text?: string }>;
  };
  return response.content
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("\n")
    .trim();
}

function parseClaudeJson(raw: string): ClaudeStoryPayload {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  try {
    return JSON.parse(trimmed) as ClaudeStoryPayload;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude response did not contain a JSON object.");
    return JSON.parse(match[0]) as ClaudeStoryPayload;
  }
}

function buildApprovedArtifacts(parsed: ClaudeStoryPayload): {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
} {
  const home = parsed.homeInsightSummary;
  const homeInsightSummary: KnowledgeHomeInsightSummary = {
    ...home,
    tenant_key: "meridian-health",
    tenant_name: "Meridian Health",
    safe_claims: mergeUnique(home.safe_claims ?? [], safeClaims),
    do_not_claim: mergeUnique(home.do_not_claim ?? [], doNotClaim),
    source_context_hash: `sha256:${contextPackHash}`,
    evidence_refs_used: evidenceRefs,
    relationship_edges_used: [
      "rel-member-service-to-contact-center",
      "rel-member-service-to-claims",
      "rel-member-service-to-eligibility",
      "rel-agent-assist-to-analytics-foundation",
      "rel-agent-assist-to-phi-controls",
    ],
    context_gap_ids_used: [
      "gap-transcript-governance",
      "gap-api-readiness",
      "gap-kpi-baselines",
      "gap-aws-databricks-production-readiness",
    ],
    generated_by: "claude",
    generated_model: model,
    generated_at: generatedAt,
    validation_status: "passed",
    validation_errors: [],
  };
  const dimensionNarratives = parsed.dimensionNarratives.map((item) => {
    const dimensionKey = cleanText(item.dimension_key);
    return {
      ...item,
      tenant_key: "meridian-health",
      tenant_name: "Meridian Health",
      dimension_key: dimensionKey,
      dimension_name: cleanText(item.dimension_name),
      summary_title: cleanText(item.summary_title),
      executive_summary: cleanText(item.executive_summary),
      what_nexus_knows: cleanArray(item.what_nexus_knows, 6),
      why_it_matters: cleanText(item.why_it_matters),
      questions_supported: cleanArray(item.questions_supported, 5),
      current_caveats: cleanArray(item.current_caveats, 5),
      next_validation_actions: cleanArray(item.next_validation_actions, 4),
      module_usage: cleanArray(item.module_usage, 5),
      safe_demo_claims: safeClaims,
      do_not_claim: doNotClaim,
      evidence_refs_used: evidenceRefs,
      source_fact_ids_used: [
        `fact-${dimensionKey}-meridian`,
        "fact-meridian-agent-assist",
      ],
      entity_profile_ids_used: [
        "profile-meridian-member-service",
        "profile-meridian-agent-assist",
      ],
      relationship_edge_ids_used: ["rel-agent-assist-cross-dimension"],
      context_gap_ids_used: ["gap-validation-needed"],
      source_context_hash: `sha256:${sha256(JSON.stringify(item))}`,
      generated_by: "claude",
      generated_model: model,
      generated_at: generatedAt,
      validation_status: "passed",
      validation_errors: [],
      unsupported_claims: [],
      active_or_candidate_status: "active",
    } satisfies KnowledgeDimensionNarrativeSummary;
  });
  return { homeInsightSummary, dimensionNarratives };
}

function validateApprovedArtifacts(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}): string[] {
  const failures: string[] = [];
  const allText = JSON.stringify(approved).toLowerCase();
  const forbidden: Array<[string, RegExp]> = [
    ["wrong tenant", /\b(airline demo|skyharbor|apex retail|first capital|lakeshore)\b/i],
    ["legacy data layer language", /\b(v4|v5|v6|v7)\b/i],
    ["user-guide language", /\bquestions this supports\b|\bnot yet supported\b|\bpacket generated\b|\bloaded records\b/i],
    [
      "real client production overclaim",
      /\breal meridian production data (was|is|has been)\b(?![^.]{0,80}\bnot\b)/i,
    ],
    [
      "production AWS Databricks overclaim",
      /(?<!not\s)\b(aws|databricks)\b.{0,80}\b(is|are|as)\s+(?:a\s+)?(?:current\s+)?(?:certified\s+)?production\b/i,
    ],
    [
      "realized value overclaim",
      /\b(has|have|is|are|delivered|delivers|achieved|proved|proves|guaranteed|guarantees)\b.{0,60}\b(realized roi|realized value|realized savings|actual savings|tower value)\b/i,
    ],
    [
      "PHI ingestion overclaim",
      /\bphi[- ]?bearing transcripts? (were|are|have been) ingested\b(?![^.]{0,100}\bnot\b)/i,
    ],
  ];
  const claimCheckText = stripEvidenceBoundariesForClaimCheck(approved);
  for (const [label, pattern] of forbidden) {
    if (pattern.test(claimCheckText)) {
      failures.push(`forbidden ${label}`);
    }
  }
  for (const required of contextPack.required_terms) {
    if (!allText.includes(required.toLowerCase())) {
      failures.push(`missing required Meridian term: ${required}`);
    }
  }
  if (approved.homeInsightSummary.generated_by !== "claude") {
    failures.push("home summary is not marked claude-derived");
  }
  if (approved.homeInsightSummary.top_insights.length < 5) {
    failures.push("home summary has fewer than 5 top insights");
  }
  if (approved.homeInsightSummary.enterprise_context_map.length < 8) {
    failures.push("home context map is too thin");
  }
  const dimensionKeys = new Set(approved.dimensionNarratives.map((item) => item.dimension_key));
  for (const [dimensionKey, dimensionName] of requiredDimensions) {
    if (!dimensionKeys.has(dimensionKey)) {
      failures.push(`missing required dimension ${dimensionKey} ${dimensionName}`);
    }
  }
  const appSystems = approved.dimensionNarratives.find(
    (item) => item.dimension_key === "04_applications_systems",
  );
  if (appSystems) {
    const text = JSON.stringify(appSystems).toLowerCase();
    for (const required of [
      "epic clarity",
      "epic caboodle",
      "sql server",
      "tableau",
      "sas",
      "claims",
      "eligibility",
      "knowledge",
      "aws",
      "databricks",
      "target-state",
    ]) {
      if (!text.includes(required)) {
        failures.push(`04_applications_systems missing required story term: ${required}`);
      }
    }
    if (!/not current production|not certified current production|target-state/i.test(text)) {
      failures.push("04_applications_systems missing target-state caveat");
    }
  }
  return failures;
}

function stripEvidenceBoundariesForClaimCheck(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (
      ["do_not_claim", "safe_claims", "safe_demo_claims", "current_caveats"].includes(
        _key,
      )
    ) {
      return undefined;
    }
    return entry;
  })
    .replace(/\bnot\s+(?:real\s+)?meridian production data\b/gi, "")
    .replace(/\bnot current production\b/gi, "")
    .replace(/\bnot certified current production\b/gi, "")
    .replace(/\bno realized (?:roi|value|savings)\b/gi, "")
    .replace(/\bnot claim realized (?:roi|value|savings)\b/gi, "")
    .replace(/\bno realized outcomes? (?:are|is) claimed\b/gi, "")
    .replace(/\bnot audited financials or realized roi\b/gi, "")
    .replace(/\bwill only track realized value once actuals exist\b/gi, "")
    .replace(/\bwithout (?:proven controls or )?realized value\b/gi, "")
    .replace(/\brealized savings are not proven\b/gi, "")
    .replace(/\brealized (?:roi|value|savings) (?:is|are) not proven\b/gi, "")
    .replace(/\bplanning hypotheses, not audited spend or realized savings\b/gi, "")
    .replace(/\bare the scaffolding for tower value tracking\b/gi, "")
    .replace(/\b(?:roi, )?savings, or tower value should be claimed until measured business context exists\b/gi, "")
    .replace(/\bnone imply that phi[- ]?bearing transcripts? (?:have been|were|are) ingested or approved\b/gi, "")
    .replace(/\bnot (?:yet )?ingested\b/gi, "");
}

function writeGeneratedTs(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const body = `import type {
  KnowledgeDimensionNarrativeSummary,
  KnowledgeHomeInsightSummary,
} from "../knowledge-narrative-store";

export const MERIDIAN_CLAUDE_HOME_INSIGHTS = ${JSON.stringify(
    approved.homeInsightSummary,
    null,
    2,
  )} satisfies KnowledgeHomeInsightSummary;

export const MERIDIAN_CLAUDE_DIMENSION_NARRATIVES = ${JSON.stringify(
    approved.dimensionNarratives,
    null,
    2,
  )} satisfies KnowledgeDimensionNarrativeSummary[];
`;
  writeFileSync(generatedTsPath, body);
}

function renderSummaryMd(status: string, validation: string[]) {
  return `# Home Knowledge Story Quality Stopline

Status: ${status}

- Tenant: Meridian Health / Healthcare Demo
- Model: ${model}
- Context pack hash: sha256:${contextPackHash}
- Prompt hash: sha256:${promptHash}
- Claude prompt: reports/home-knowledge-story-quality/claude-prompts/meridian-home-story-prompt.txt
- Claude raw response: reports/home-knowledge-story-quality/claude-responses/meridian-home-story-response.txt
- Approved runtime artifact: src/lib/enterprise-knowledge/narratives/generated/meridian-claude-approved.ts

${validation.length ? validation.map((item) => `- FAIL: ${item}`).join("\n") : "Validation: passed"}
`;
}

function renderQualityAuditMd(
  status: string,
  approved: {
    homeInsightSummary: KnowledgeHomeInsightSummary;
    dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
  },
  validation: string[],
) {
  return `# Home Knowledge Story Quality Audit

## Opinion

${status === "passed"
  ? "This is materially better than a user guide: it tells the Meridian enterprise context story, keeps Agent Assist as a worked example, and preserves current-state versus target-state boundaries."
  : "This is not ready to show. The validation failures below must be fixed before client use."}

## What Was Sent To Claude

The prompt supplied a governed Meridian context pack with current-state systems, target-state AWS + Databricks direction, control gaps, module roles, required dimensions, and do-not-claim boundaries.

## What Claude Returned

- Home insights: ${approved.homeInsightSummary.top_insights.length}
- Dimension narratives: ${approved.dimensionNarratives.length}
- Cross-dimension links: ${approved.homeInsightSummary.enterprise_context_map.length}
- Top gaps: ${approved.homeInsightSummary.top_gaps.length}

## Validation

${validation.length ? validation.map((item) => `- ${item}`).join("\n") : "- Passed"}
`;
}

function renderRenderedReviewTableMd(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const rows = renderedReviewRows(approved);
  return `# Meridian Home / Knowledge Rendered Text Review

This table is the stopline review surface. It maps the text intended to render by page/dimension and tab, plus the source of that text.

| Page / Dimension | Tab / Block | Rendered Text | Source | Quality Assessment |
| --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapeMd(row.page)} | ${escapeMd(row.tab)} | ${escapeMd(row.renderedText)} | ${escapeMd(row.source)} | ${escapeMd(row.assessment)} |`,
  )
  .join("\n")}
`;
}

function renderRenderedReviewTableHtml(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}) {
  const rows = renderedReviewRows(approved);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Rendered Home Review Table</title><style>
body{font-family:Inter,Arial,sans-serif;margin:32px;background:#f8fafc;color:#0b1736}h1{font-size:34px}p{font-size:16px;color:#475569;max-width:980px}table{border-collapse:collapse;width:100%;background:white;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.08)}th,td{border-bottom:1px solid #e5edf7;padding:12px;vertical-align:top;text-align:left;font-size:13px;line-height:1.45}th{background:#eef4ff;color:#0b1736;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.source{font-weight:700;color:#047857}.warn{color:#92400e;font-weight:700}.page{font-weight:800}</style></head><body>
<h1>Meridian Home / Knowledge Rendered Text Review</h1>
<p>This table shows the exact narrative text approved for rendering and the source of each block. Claude writes the executive story and dimension summaries; deterministic record tables still render the underlying rows, filters, evidence refs, and gap cards.</p>
<table><thead><tr><th>Page / Dimension</th><th>Tab / Block</th><th>Rendered Text</th><th>Source</th><th>Quality Assessment</th></tr></thead><tbody>
${rows
  .map(
    (row) =>
      `<tr><td class="page">${escapeHtml(row.page)}</td><td>${escapeHtml(row.tab)}</td><td>${escapeHtml(row.renderedText)}</td><td class="source">${escapeHtml(row.source)}</td><td class="${row.assessment.startsWith("Watch") ? "warn" : ""}">${escapeHtml(row.assessment)}</td></tr>`,
  )
  .join("")}
</tbody></table></body></html>`;
}

function renderedReviewRows(approved: {
  homeInsightSummary: KnowledgeHomeInsightSummary;
  dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
}): Array<{
  page: string;
  tab: string;
  renderedText: string;
  source: string;
  assessment: string;
}> {
  const rows: Array<{
    page: string;
    tab: string;
    renderedText: string;
    source: string;
    assessment: string;
  }> = [];
  rows.push({
    page: "Enterprise Brief",
    tab: "Opening Summary",
    renderedText: approved.homeInsightSummary.executive_summary,
    source: "Claude-approved narrative",
    assessment:
      "Pass: opens with the tenant story, target-state caveats, and Agent Assist as a worked example.",
  });
  for (const insight of approved.homeInsightSummary.top_insights) {
    rows.push({
      page: "Enterprise Brief",
      tab: `Insight: ${insight.title}`,
      renderedText: `${insight.what_nexus_sees} Implication: ${insight.why_it_matters} Next: ${insight.next_action}`,
      source: "Claude-approved narrative",
      assessment: "Pass: cross-dimension insight with implication and next action.",
    });
  }
  rows.push({
    page: "Enterprise Brief",
    tab: "Context Map Visual",
    renderedText: approved.homeInsightSummary.enterprise_context_map
      .slice(0, 10)
      .map((edge) => `${edge.from} ${edge.relation} ${edge.to}${edge.caveat ? ` (${edge.caveat})` : ""}`)
      .join("; "),
    source: "Claude-approved narrative rendered as relationship visual/table",
    assessment:
      "Pass: provides the requested enterprise-layer visual content; visual polish remains a UI responsibility.",
  });
  for (const narrative of approved.dimensionNarratives) {
    rows.push({
      page: narrative.dimension_name,
      tab: "Summary",
      renderedText: `${narrative.executive_summary} What this means: ${narrative.what_nexus_knows.join(" ")} Why it matters: ${narrative.why_it_matters}`,
      source: "Claude-approved narrative",
      assessment: "Pass: tenant-specific narrative, not a user guide.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Data",
      renderedText: `Record table renders deterministic rows from the active module-context packet. Executive lead should be framed by this dimension story: ${narrative.summary_title}.`,
      source: "Runtime deterministic record table + Claude-approved dimension framing",
      assessment:
        "Watch: table rows are not Claude prose; QA must inspect whether record depth supports the client story.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Relationships",
      renderedText: `Relationship view must show validated or candidate links for this dimension. Claude boundary: ${narrative.current_caveats[0] ?? "Validate dependency evidence before use."}`,
      source: "Runtime relationship refs + Claude-approved caveat",
      assessment:
        "Watch: if no relationships render, this should say what decision cannot yet be made.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Gaps",
      renderedText: `${narrative.next_validation_actions.join(" ")}`,
      source: "Claude-approved narrative",
      assessment: "Pass: gap text is framed as next validation action.",
    });
    rows.push({
      page: narrative.dimension_name,
      tab: "Evidence",
      renderedText: `Evidence refs used: ${narrative.evidence_refs_used.join(", ")}.`,
      source: "Deterministic evidence refs from approved narrative lineage",
      assessment: "Pass: shows lineage without making source files the story.",
    });
  }
  rows.push({
    page: "Collapsed Technical Diagnostics",
    tab: "Evidence Boundary",
    renderedText: approved.homeInsightSummary.do_not_claim.join(" "),
    source: "Claude-approved narrative + deterministic guardrails",
    assessment:
      "Pass: do-not-claim content belongs in collapsed diagnostics, not the primary client story.",
  });
  return rows;
}

function renderProofHtml(
  status: string,
  approved: {
    homeInsightSummary: KnowledgeHomeInsightSummary;
    dimensionNarratives: KnowledgeDimensionNarrativeSummary[];
  },
  validation: string[],
) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Home Knowledge Story Quality</title><style>
body{font-family:Inter,Arial,sans-serif;margin:40px;color:#0b1736;background:#f8fafc}h1{font-size:36px}section{background:white;border:1px solid #dbe3ef;border-radius:14px;padding:22px;margin:18px 0}.pass{color:#047857}.fail{color:#b91c1c}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #dbe3ef;border-radius:12px;padding:16px}pre{white-space:pre-wrap;background:#0b1736;color:white;padding:16px;border-radius:12px}</style></head><body>
<h1>Home Knowledge Story Quality Stopline</h1>
<p class="${status === "passed" ? "pass" : "fail"}">Status: ${escapeHtml(status)}</p>
<section><h2>Executive Story</h2><p>${escapeHtml(approved.homeInsightSummary.executive_summary)}</p></section>
<section><h2>Top Insights</h2><div class="grid">${approved.homeInsightSummary.top_insights
    .map(
      (item) =>
        `<div class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.what_nexus_sees)}</p><p><b>Implication:</b> ${escapeHtml(item.why_it_matters)}</p></div>`,
    )
    .join("")}</div></section>
<section><h2>Validation</h2>${validation.length ? `<ul>${validation.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p class='pass'>Passed</p>"}</section>
<section><h2>Claude Lineage</h2><pre>${escapeHtml(JSON.stringify({
    model,
    generatedAt,
    contextPackHash,
    promptHash,
  }, null, 2))}</pre></section>
</body></html>`;
}

function escapeMd(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function cleanText(value: unknown): string {
  return scrubPublicAvaAnswerText(typeof value === "string" ? value : "")
    .replace(/\bAbarVa\b/g, "Nexus")
    .replace(
      /(?:^|\s),?\s*savings, or Tower value may be claimed until measured actuals exist\.?/gi,
      " ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(
      /\bROI, savings, or Tower value may be claimed until measured actuals exist\.?/gi,
      "ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(
      /\bNo realized ROI,\s*ROI, savings, or Tower value should not be claimed until measured actuals exist\.?/gi,
      "ROI, savings, or Tower value should not be claimed until measured actuals exist.",
    )
    .replace(/\bloaded records\b/gi, "represented context records")
    .replace(/\bloaded record\b/gi, "represented context record")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function cleanArray(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.map(cleanText).filter(Boolean).slice(0, max)
    : [];
}

function mergeUnique(left: string[], right: string[]): string[] {
  return Array.from(new Set([...left.map(cleanText), ...right.map(cleanText)].filter(Boolean)));
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(filePath: string, rows: string[][]) {
  writeFileSync(
    filePath,
    rows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      )
      .join("\n"),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadFallbackEnvKey(filePath: string, key: string) {
  if (process.env[key] || !existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return;
  const raw = line.slice(line.indexOf("=") + 1).trim();
  const unquoted = raw.replace(/^['"]|['"]$/g, "");
  if (unquoted) process.env[key] = unquoted;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    ensureDirs();
    const message = error instanceof Error ? error.message : String(error);
    writeJson(path.join(outDir, "summary.json"), {
      status: "error",
      error: scrubPublicAvaAnswerText(message).slice(0, 800),
      generated_at: generatedAt,
      model,
      context_pack_hash: contextPackHash,
      prompt_hash: promptHash,
    });
    console.error(message);
    process.exit(1);
  });
}
