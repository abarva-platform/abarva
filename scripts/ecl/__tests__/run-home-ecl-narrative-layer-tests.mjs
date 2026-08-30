#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts/ecl/build_home_ecl_narrative_layer.ts");
const readbackPath = path.join(repoRoot, "scripts/ecl/readback_home_ecl_narrative_layer.ts");
const thesisPath = path.join(repoRoot, "scripts/data-build/build-enterprise-thesis.ts");
const chaptersPath = path.join(repoRoot, "scripts/data-build/build-home-chapters.ts");
const packagePath = path.join(repoRoot, "package.json");
const pagePromptContractPath = path.join(
  repoRoot,
  "docs/architecture/home-v2-page-prompt-contracts-2026-08-30.json",
);

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const script = fs.readFileSync(scriptPath, "utf8");
const readback = fs.readFileSync(readbackPath, "utf8");
const thesis = fs.readFileSync(thesisPath, "utf8");
const chapters = fs.readFileSync(chaptersPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const pagePromptContract = JSON.parse(fs.readFileSync(pagePromptContractPath, "utf8"));

function promptPage(pageKey) {
  return pagePromptContract.pages.find((page) => page.page_key === pageKey);
}

function pageValues(pageKey, field) {
  const page = promptPage(pageKey);
  return Array.isArray(page?.[field]) ? page[field] : [];
}

function extractDefaultAssessmentId(source, label) {
  const match = source.match(/const DEFAULT_ASSESSMENT_ID = "([^"]+)";/);
  assert(Boolean(match), `${label} declares DEFAULT_ASSESSMENT_ID`);
  return match?.[1] ?? "";
}

const buildDefaultAssessmentId = extractDefaultAssessmentId(script, "Home ECL narrative build job");
const readbackDefaultAssessmentId = extractDefaultAssessmentId(readback, "Home ECL narrative readback job");

const expectedHomeSurfaceKeys = [
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
  "current_state_architecture",
  "current_state_data_flow",
  "applications_systems",
  "vendor_contracts",
  "infrastructure_platforms",
  "data_assets_integrations",
  "what_has_been_loaded",
  "browse_the_record",
];

assert(
  pagePromptContract.contract_id === "home-v2-page-prompt-contracts-2026-08-30",
  "Home V2 page prompt contract is the expected dated contract",
);
assert(
  pagePromptContract.source_family_summaries_required === true &&
    pagePromptContract.shared_packet_sections.includes("source_family_summaries") &&
    pagePromptContract.shared_packet_sections.includes("category_summaries") &&
    pagePromptContract.shared_packet_sections.includes("leadership_voice") &&
    pagePromptContract.shared_packet_sections.includes("data_and_analytics") &&
    pagePromptContract.shared_packet_sections.includes("visual_datasets"),
  "Home V2 page prompt contract requires rich shared source, category, interview, data, and visual context",
);
assert(
  pagePromptContract.pages.length === expectedHomeSurfaceKeys.length &&
    new Set(pagePromptContract.pages.map((page) => page.page_key)).size === expectedHomeSurfaceKeys.length &&
    expectedHomeSurfaceKeys.every((pageKey) => Boolean(promptPage(pageKey))),
  "Home V2 page prompt contract enumerates all 16 Home surfaces exactly once",
);
const lensContracts = pagePromptContract.lens_contracts ?? {};
const requiredLensKeys = [
  "ceo_board_strategy_adviser",
  "business_strategy_partner",
  "corporate_strategy_value_creation_partner",
  "operating_model_adviser",
  "expert_cto_enterprise_architect",
  "data_analytics_architect",
  "cfo_value_governance_partner",
  "interview_synthesis_lead",
  "transformation_office_risk_committee_lead",
  "commercial_sourcing_cxo_partner",
  "data_steward_source_reviewer",
];
assert(
  requiredLensKeys.every((lensKey) => {
    const contract = lensContracts[lensKey];
    return (
      contract &&
      typeof contract.hat === "string" &&
      typeof contract.primary_audience === "string" &&
      typeof contract.prompt_instruction === "string" &&
      Array.isArray(contract.evidence_priority) &&
      contract.evidence_priority.length > 0 &&
      typeof contract.style === "string" &&
      Array.isArray(contract.must_not_do) &&
      contract.must_not_do.length > 0
    );
  }),
  "Home V2 page prompt contract declares complete Claude role contracts for each writer lens",
);
assert(
  lensContracts.ceo_board_strategy_adviser?.prompt_instruction.includes("Lead with business consequence") &&
    lensContracts.ceo_board_strategy_adviser?.must_not_do.includes("start with a technology inventory") &&
    lensContracts.expert_cto_enterprise_architect?.prompt_instruction.includes("Start conceptual, then logical, then physical") &&
    lensContracts.expert_cto_enterprise_architect?.must_not_do.includes("count deployments as applications") &&
    lensContracts.data_analytics_architect?.prompt_instruction.includes("Keep movements, reports, jobs, scripts, users, and TB as separate denominators") &&
    lensContracts.interview_synthesis_lead?.prompt_instruction.includes("Summarize C-suite strategic themes") &&
    lensContracts.data_steward_source_reviewer?.prompt_instruction.includes("Lead with dimensions and grain before showing rows"),
  "Claude role contracts keep board, technology, data, interview, and source-review lenses distinct",
);
assert(
  promptPage("executive_brief")?.writer_lens === "ceo_board_strategy_adviser" &&
    promptPage("executive_brief")?.voice.includes("business strategy led"),
  "Executive Brief uses a business-strategy-led CXO writer lens",
);
assert(
  promptPage("technology_data")?.writer_lens === "expert_cto_enterprise_architect" &&
    promptPage("current_state_architecture")?.writer_lens === "expert_cto_enterprise_architect" &&
    promptPage("applications_systems")?.writer_lens === "expert_cto_enterprise_architect" &&
    promptPage("infrastructure_platforms")?.writer_lens === "expert_cto_enterprise_architect",
  "Technology and architecture surfaces use the expert technologist lens",
);
assert(
  promptPage("current_state_data_flow")?.writer_lens === "data_analytics_architect" &&
    promptPage("data_assets_integrations")?.writer_lens === "data_analytics_architect",
  "Data-flow and data-asset surfaces use the data and analytics architect lens",
);
assert(
  promptPage("leadership_perspective")?.writer_lens === "interview_synthesis_lead" &&
    pageValues("leadership_perspective", "must_show").includes("C-suite themes") &&
    pageValues("leadership_perspective", "must_show").includes("director-level tactical themes") &&
    pageValues("leadership_perspective", "must_show").includes("direct excerpts") &&
    pageValues("leadership_perspective", "must_show").includes("AI ambition"),
  "Leadership Perspective is a first-class interview evidence surface",
);
assert(
  pageValues("technology_data", "forbidden").some((item) =>
    item.includes("asking to confirm ETL/jobs/users when workload summaries are loaded"),
  ) &&
    pageValues("data_assets_integrations", "forbidden").some((item) =>
      item.includes("asking to confirm ETL/jobs/reports/users/TB when workload summaries are loaded"),
    ) &&
    pageValues("data_assets_integrations", "must_show").includes("BI/report counts by tool and function") &&
    pageValues("data_assets_integrations", "must_show").includes("ETL/job/script counts by tool and function"),
  "Home prompt contract forbids fake D&A gaps when workload summaries already carry BI, ETL, user, and volume context",
);
assert(
  pageValues("browse_the_record", "must_show").includes("dataset selector") &&
    pageValues("browse_the_record", "must_show").includes("dimensions") &&
    pageValues("browse_the_record", "must_show").includes("column presets") &&
    pageValues("browse_the_record", "must_show").includes("row lineage drawer") &&
    pageValues("browse_the_record", "forbidden").includes("all columns by default"),
  "Browse The Record is specified as slice/dice first and table second",
);
assert(
  pagePromptContract.global_gates.includes("all_pages_have_source_family_summaries") &&
    pagePromptContract.global_gates.includes("rendered_claims_resolve_to_published_claim_rows") &&
    pagePromptContract.global_gates.includes("published_refused_deferred_terminal_state_required") &&
    pagePromptContract.global_gates.includes("architecture_and_data_flow_admission_above_diagrams") &&
    pagePromptContract.global_gates.includes("workload_denominators_separate") &&
    pagePromptContract.global_gates.includes("no_builder_vocabulary_on_cxo_surface"),
  "Home V2 page prompt contract records the terminal-state, source-family, admission, denominator, and vocabulary gates",
);

assert(
  buildDefaultAssessmentId === readbackDefaultAssessmentId,
  "Home ECL narrative build/readback default assessment ids match",
);

assert(
  thesis.includes("export async function buildVerifiedEnterpriseThesisFromSignalPacket"),
  "EnterpriseThesis writer exposes an ECL-fed signal-packet seam",
);
assert(
  thesis.includes("enterprise-thesis/v1.3-deterministic-claim-plan") &&
    thesis.includes("CXO-VISIBLE LANGUAGE") &&
    thesis.includes("Do not expose implementation") &&
    thesis.includes("Do not say ECL") &&
    thesis.includes("not enough verified evidence yet") &&
    thesis.includes("CLAIM TYPE DISCIPLINE") &&
    thesis.includes("Use FACT or OBSERVATION for a claim that rests on one domain") &&
    thesis.includes("Do not transform an absence of strategy") &&
    thesis.includes("These are maximums, not minimums") &&
    thesis.includes("Empty is correct when the current packet does not support a grounded claim"),
  "EnterpriseThesis prompt forbids implementation vocabulary in CXO-visible language",
);
assert(
  chapters.includes("export async function buildChapterViewsFromVerifiedThesis"),
  "Home chapter writer exposes reusable chapter assembly",
);
assert(
  chapters.includes("Writer lens: ${def.writerLens}") &&
    chapters.includes("expert CTO, enterprise architect, and data-platform leader") &&
    chapters.includes("business-strategy consultant") &&
    chapters.includes("executive-interview synthesis") &&
    chapters.includes("the lens introduce facts not present in the assigned claims"),
  "Home chapter writer passes page-specific executive lenses without weakening the evidence boundary",
);
assert(
  script.includes("buildVerifiedEnterpriseThesisFromSignalPacket") &&
    script.includes("buildChapterViewsFromVerifiedThesis"),
  "ECL narrative job reuses the existing verified writer path",
);
assert(
  script.includes("buildValidatedAgentContextBundle") &&
    script.includes("{ requireAgentReady: true }") &&
    script.includes("GovernedCandidate") &&
    script.includes("contextPolicyProof"),
  "ECL narrative job builds the executive packet through the governed agent-ready context seam",
);
assert(
  script.includes("candidateIsReady") &&
    script.includes("sourceRefIds") &&
    script.includes("source_record_id") &&
    script.includes("row.quality_state === \"passed\"") &&
    script.includes("\"warning\"") &&
    script.includes("confidenceForRow") &&
    script.includes("row.value_state === \"known\"") &&
    script.includes("row.admission_status === \"admitted\"") &&
    script.includes("sourceRefs.length > 0"),
  "ECL narrative job requires usable quality, value, admission, source refs, and source hash before a row can enter the packet",
);
assert(
  script.includes("text(ref.source_record_id)") &&
    script.includes("text(ref.sourceRecordId)") &&
    script.includes("text(ref.record_id)") &&
    script.includes("text(ref.source_file_id)") &&
    script.includes("return [...new Set(ids)]"),
  "ECL narrative job normalizes structured source_refs_json objects into citation IDs instead of treating them as missing",
);
assert(
  script.includes("Some candidate facts were withheld from executive use") &&
    script.includes("withheld from executive use") &&
    script.includes("blocked_count_by_reason") &&
    script.includes("row_readiness_counts"),
  "ECL narrative job emits safe policy-gap and readiness metadata without copying blocked payloads into model context",
);
assert(
  script.includes("readEclSourceSummaries") &&
    script.includes("ecl_source.source_file") &&
    script.includes("ecl_source.source_record") &&
    script.includes("sourceSummaries") &&
    script.includes("source_summary_count") &&
    script.includes("coverage_context_not_citable"),
  "ECL narrative job passes source-ledger breadth summaries as non-citable packet context",
);
assert(
  script.includes("Home ECL narrative refused: no governed usable evidence reached the executive packet") &&
    script.includes("contextPolicyProof.usable_count === 0") &&
    script.includes("signalPacket.signals.length === 0"),
  "ECL narrative job refuses before generation when the governed packet has zero usable evidence",
);
assert(
  script.includes("HOME_ECL_NARRATIVE_WRITE === \"true\"") &&
    script.includes("HOME_ECL_NARRATIVE_WRITE_APPROVED === \"true\""),
  "ECL narrative write path is explicitly gated",
);
assert(
  script.includes("Plan-only complete"),
  "ECL narrative job is plan-only by default",
);
assert(
  script.includes("process.env.ECL_DENSE_TENANT_KEY") &&
    script.includes("process.env.ECL_DENSE_ASSESSMENT_ID"),
  "ECL narrative job accepts operator tenant and assessment env overrides",
);
assert(
  script.includes('payloadNumber(data, "annualized_value_usd", "annual_spend_usd")') &&
    script.includes('topSpendShareRows(permittedContracts, "supplier_name", "annualized_value_usd", 8)'),
  "ECL narrative job reads permitted contract spend and supplier concentration from Home projection field names",
);
assert(
  script.includes("function buildDeterministicHomeSignals") &&
    script.includes("sig_ecl_application_function_002") &&
    script.includes("sig_ecl_contract_flexibility_006") &&
    script.includes("sig_ecl_platform_resilience_008") &&
    script.includes("sig_ecl_data_flow_convergence_009") &&
    script.includes("sig_ecl_application_function_ranking_012") &&
    script.includes("sig_ecl_application_cost_013") &&
    script.includes("sig_ecl_data_flow_total_014") &&
    script.includes("sig_ecl_data_workload_segments_017") &&
    script.includes("sig_ecl_application_named_examples_015") &&
    script.includes("sig_ecl_platform_named_resilience_016") &&
    script.includes("sig_ecl_source_breadth_guardrail_019"),
  "ECL narrative job expands deterministic signals across application, contract, infrastructure, data-flow, data-workload, and source-breadth domains",
);
assert(
  script.includes("categorySummaries: buildCategorySummaries") &&
    script.includes("data_workload_by_function") &&
    script.includes("data_workload_by_technology") &&
    script.includes("ctx_ecl_scope_data_workload_001") &&
    script.includes("must not ask leaders to confirm those counts as though the source family is absent"),
  "ECL narrative job passes deterministic category summaries and data-workload visual datasets into the Claude packet",
);
assert(
  script.includes("HOME_PAGE_PROMPT_CONTRACT_PATH") &&
    script.includes("function readHomePagePromptContracts") &&
    script.includes("pagePromptContracts: readHomePagePromptContracts()") &&
    script.includes("lens_contracts") &&
    script.includes("lensContract") &&
    script.includes("promptInstruction") &&
    thesis.includes("The packet may include pagePromptContracts") &&
    thesis.includes("page-level writer lenses") &&
    thesis.includes("must-show obligations") &&
    thesis.includes("Never cite pagePromptContracts as"),
  "ECL narrative job passes page prompt contracts into the Claude packet as page instructions, not citable evidence",
);
assert(
  chapters.includes("function chapterDefinitionForPacket") &&
    chapters.includes("pagePromptContracts") &&
    chapters.includes("Primary audience:") &&
    chapters.includes("Evidence priority:") &&
    chapters.includes("Must not do:") &&
    chapters.includes("synthesizeChapterNarrative(client, effectiveDef") &&
    chapters.includes("contract?.decisionQuestion ?? def.guidingQuestion"),
  "Home chapter writer uses the packet's page and lens contracts when building Claude prompts",
);
assert(
  script.includes("ready contracts are in the current ready contract base") &&
    script.includes("of ${permittedContracts.length.toLocaleString()} are marked auto-renewal") &&
    script.includes("of ${permittedContracts.length.toLocaleString()} require at least 180 days notice") &&
    script.includes("infrastructure or platform records are in the current platform base") &&
    script.includes("of ${permittedInfrastructure.length.toLocaleString()} carry support-end dates"),
  "ECL narrative deterministic signals state ready-contract and platform denominators explicitly",
);
assert(
  thesis.includes("NUMERIC AND COMPARATIVE EVIDENCE") &&
    thesis.includes("must appear exactly in one of that claim's cited signal") &&
    thesis.includes("context statements") &&
    thesis.includes("Named entity language follows the same rule") &&
    thesis.includes("statement for that same claim must contain that exact name") &&
    thesis.includes("Do not lift named") &&
    thesis.includes("not rename it as a total technology budget") &&
    thesis.includes("If a cited item says a movement count is an integration-record count") &&
    thesis.includes("data volume, transaction volume, or proof of analytics consumption") &&
    thesis.includes("Before returning JSON, audit every claim_type") &&
    thesis.includes("Empty arrays are acceptable for questions, tensions, watch items") &&
    thesis.includes("do not prove \"full coverage\", \"complete evidence\"") &&
    thesis.includes("Prefer fewer claims and questions"),
  "EnterpriseThesis prompt requires exact citable support for numbers, rankings, and management questions",
);
assert(
  script.includes("technologyBudget: 0") &&
    script.includes("This is recorded application annual cost, not a complete enterprise technology budget"),
  "ECL narrative packet does not expose application annual cost as a structured technology budget",
);
assert(
  script.includes("source-family summaries describe intake breadth but are not evidence for a business claim by themselves") &&
    !script.includes("Home narrative prose is allowed to use only governed facts") &&
    !script.includes("Render a precomputed ECL projection dataset"),
  "ECL narrative citable signals avoid implementation vocabulary and explicitly bound source-summary use",
);
assert(
  script.includes("function buildScopeContextItems") &&
    script.includes("ctx_ecl_scope_business_economics_001") &&
    script.includes("ctx_ecl_scope_strategy_programs_001") &&
    script.includes("ctx_ecl_scope_leadership_001") &&
    script.includes("ctx_ecl_scope_value_linkage_001") &&
    script.includes("ctx_ecl_scope_source_breadth_001"),
  "ECL narrative job supplies citable scope context for missing business, strategy, leadership, value, and source-breadth evidence",
);
assert(
  script.includes("structured_event: \"home_ecl_narrative_layer_summary\""),
  "ECL narrative job emits structured proof for the ACA operator wrapper",
);
assert(
  script.includes("structured_event: \"home_ecl_narrative_publication_gate\"") &&
    script.includes("failed_ledger_sample") &&
    script.includes("compactFailedLedger") &&
    script.includes("clean_keep_rate"),
  "ECL narrative job emits a compact publication-gate ledger before the full payload",
);
assert(
  script.includes("signal_packet_hash") &&
    script.includes("context_bundle_hash") &&
    script.includes("source_hashes") &&
    script.includes("usable_candidate_ids"),
  "ECL narrative job persists signal-packet, context-bundle, source-hash, and usable-candidate proof",
);
assert(
  script.includes("ecl_projection.home_enterprise_landscape") &&
    script.includes("ecl_projection.projection_entry"),
  "ECL narrative job writes to ECL projection tables",
);
assert(
  !script.includes("public.home_knowledge_packs"),
  "ECL narrative job does not revive the legacy Home knowledge-pack write path",
);
assert(
  script.includes("'chapter_claim'") &&
    script.includes("writer_verdict_tally") === false &&
    script.includes("verification_verdict_tally") &&
    script.includes("verification_action_tally") &&
    script.includes("publication_gate"),
  "ECL narrative job records chapter claim rows, verification actions, and a publication gate",
);
assert(
  script.includes("publicationGateIssues") &&
    script.includes("validateStructure") &&
    script.includes("thesisResult.publishedGeneration") &&
    script.includes("RAW_PUBLICATION_MAX_UNSUPPORTED") &&
    script.includes("RAW_PUBLICATION_MAX_OVERSTATED") &&
    script.includes("RAW_PUBLICATION_MIN_CLEAN_KEEP_RATE") &&
    script.includes("raw_clean_keep_rate_") &&
    script.includes("published_structural_issues_") &&
    script.includes("!row.action.startsWith(\"dropped\")") &&
    script.includes("publicationIssues.length && WRITE") &&
    script.includes("Home ECL narrative publication gate failed") &&
    script.includes("thesisResult.publicationIssues") &&
    script.includes("publicationGate: verificationSummary.publication_gate") &&
    script.includes("verificationSummary"),
  "ECL narrative job refuses writes when raw generation or published publication-gate issues remain",
);
assert(
  script.includes("CXO_FORBIDDEN_VISIBLE_PATTERNS") &&
    script.includes("FAKE_DATA_WORKLOAD_GAP_PATTERN") &&
    script.includes("visibleNarrativeQualityIssues") &&
    script.includes("dataWorkloadContextLoaded") &&
    script.includes("fake_data_workload_gap_when_loaded") &&
    script.includes("visibleNarrativeQualityIssues(thesisResult, chapters, signalPacket)") &&
    script.includes("raw_object_id") &&
    script.includes("scrubRawVisibleIds") &&
    script.includes("safeVisibleIdentifierLabel") &&
    script.includes("hasRawVisibleId(label)") &&
    script.includes("buildVisibleIdentifierLabels") &&
    script.includes("MACHINE_REFERENCE_KEYS") &&
    script.includes("normalizeChapterTerminalStates") &&
    script.includes("forbidden_visible_term") &&
    script.includes("Home ECL narrative visible-quality gate failed") &&
    script.includes("not enough verified evidence yet"),
  "ECL narrative job scrubs raw object IDs, repairs terminal chapter language, and refuses remaining visible implementation vocabulary or bland empty-state prose",
);
assert(
  thesis.includes("action: \"dropped_structural\"") &&
    thesis.includes("structural issue: ${issue.reason}") &&
    thesis.includes("claimsRequiringVerification(publishedGeneration)"),
  "EnterpriseThesis drops structurally invalid claims before semantic verification",
);
assert(
  thesis.includes("recovered explicit verdict from response") &&
    thesis.includes("verifier returned non-JSON with no recoverable verdict") &&
    thesis.includes("SUPPORTED_INFERENCE|SUPPORTED|OVERSTATED|UNSUPPORTED"),
  "EnterpriseThesis verifier recovers explicit verdicts from malformed JSON without weakening semantic gates",
);
assert(
  thesis.includes("Do not write \"the enterprise creates value through <function>\"") &&
    thesis.includes("value is primarily created by") &&
    thesis.includes("Application count,") &&
    thesis.includes("they cannot support") &&
    thesis.includes("business value creation") &&
    thesis.includes("The current evidence does not establish the enterprise's value-creation model."),
  "EnterpriseThesis prompt blocks substituting technology footprint for business value creation",
);
assert(
  thesis.includes("material_risks and what_needs_attention do not require CROSS_DOMAIN_INSIGHT or ADVISORY_INFERENCE") &&
    thesis.includes("Never return null array entries") &&
    thesis.includes("return only") &&
    thesis.includes("return []") &&
    thesis.includes("Do not explain a difference between two totals unless a cited reconciliation signal explains it") &&
    thesis.includes("Record counts can establish size and scope") &&
    thesis.includes("do not establish that the organization lacks a") &&
    thesis.includes("claimAtPath(rawGeneration, issue.path)") &&
    thesis.includes("claim_statement: claim?.statement"),
  "EnterpriseThesis narrows single-domain action sections and records structural-drop statements",
);
assert(
  thesis.includes("MANAGEMENT QUESTIONS ARE OPTIONAL AND RARE") &&
    thesis.includes("questions_for_management is not a required executive flourish") &&
    thesis.includes("When no question earns this bar, return") &&
    thesis.includes("questions_for_management: []"),
  "EnterpriseThesis prompt treats management questions as optional and refuses unsupported process premises",
);
assert(
  thesis.includes("CONTRACT FLEXIBILITY AND EXIT LANGUAGE") &&
    thesis.includes("constrained renegotiation") &&
    thesis.includes("constrained exit") &&
    thesis.includes("termination rights, transition cost") &&
    thesis.includes("review before asserting savings or flexibility"),
  "EnterpriseThesis prompt prevents renewal timing facts from overstating exit or negotiation leverage",
);
assert(
  thesis.includes("buildEvidenceScopeInstructions") &&
    thesis.includes("Apply this deterministic evidence-scope contract before deciding which sections to fill") &&
    thesis.includes("forced_empty_sections_for_this_packet") &&
    thesis.includes("If a forced-empty section conflicts with the generic schema below, the forced-empty instruction wins"),
  "EnterpriseThesis prompt includes a deterministic evidence-scope contract before the generic output schema",
);
assert(
  thesis.includes("export function buildDeterministicEnterpriseThesisFromSignalPacket") &&
    thesis.includes("storyFromClaims(storyClaims)") &&
    thesis.includes("signalClaim(signal)") &&
    thesis.includes("Strategy, leadership, and outcome sections remain deferred unless a cited source supplies those facts"),
  "EnterpriseThesis exposes a deterministic claim planner that selects governed signal statements before prose",
);
assert(
  script.includes("buildVerifiedEnterpriseThesisFromSignalPacket(signalPacket, anthropic, {") &&
    script.includes("deterministicClaimPlan: true"),
  "ECL Home narrative job uses deterministic claim planning before model prose synthesis",
);
assert(
  thesis.includes("value_creation_model.summary must lead with a limitation; primary_value_drivers must be []") &&
    thesis.includes("strategic_bets must be []") &&
    thesis.includes("leadership_consensus and leadership_disagreements must be []") &&
    thesis.includes("where_improving and where_off_track must be []") &&
    thesis.includes("do not ask process/owner/governance questions"),
  "EnterpriseThesis evidence-scope contract forces unsupported sections empty for sparse packets",
);
assert(
  script.includes("basis_summary = 'model_generated_from_ecl_projection'"),
  "Generated narrative rows carry an explicit ECL model-generated basis",
);
assert(
  packageJson.scripts["ecl:home-narrative:readback"]?.includes("readback_home_ecl_narrative_layer.ts"),
  "Home ECL narrative readback has an npm operator script",
);
assert(
  readback.includes("structured_event: \"home_ecl_narrative_readback_summary\"") &&
    readback.includes("data_mutation: false"),
  "Home ECL narrative readback emits a structured read-only proof event",
);
assert(
    readback.includes("chapter_claim_entry_drift") &&
    readback.includes("refusal_payload_drift") &&
    readback.includes("writer_publication_gate_drift") &&
    readback.includes("writer_zero_usable_context_rows") &&
    readback.includes("legacy_basis_rows") &&
    readback.includes("chapter_claim_pages"),
  "Home ECL narrative readback checks claim linkage, admission payloads, publication gate, usable context, legacy basis drift, and claim coverage",
);
assert(
  !readback.includes("chapter_claim_pages_expected_"),
  "Home ECL narrative readback reports claim page coverage without requiring every chapter to emit claim rows",
);
assert(
  readback.includes("process.env.ECL_DENSE_TENANT_KEY") &&
    readback.includes("process.env.ECL_DENSE_ASSESSMENT_ID"),
  "Home ECL narrative readback accepts operator tenant and assessment env overrides",
);

if (process.exitCode) {
  process.exit(process.exitCode);
}
