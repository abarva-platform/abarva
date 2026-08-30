#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts/ecl/build_home_ecl_narrative_layer.ts");
const readbackPath = path.join(repoRoot, "scripts/ecl/readback_home_ecl_narrative_layer.ts");
const thesisPath = path.join(repoRoot, "scripts/data-build/build-enterprise-thesis.ts");
const chaptersPath = path.join(repoRoot, "scripts/data-build/build-home-chapters.ts");
const packagePath = path.join(repoRoot, "package.json");

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

function extractDefaultAssessmentId(source, label) {
  const match = source.match(/const DEFAULT_ASSESSMENT_ID = "([^"]+)";/);
  assert(Boolean(match), `${label} declares DEFAULT_ASSESSMENT_ID`);
  return match?.[1] ?? "";
}

const buildDefaultAssessmentId = extractDefaultAssessmentId(script, "Home ECL narrative build job");
const readbackDefaultAssessmentId = extractDefaultAssessmentId(readback, "Home ECL narrative readback job");

assert(
  buildDefaultAssessmentId === readbackDefaultAssessmentId,
  "Home ECL narrative build/readback default assessment ids match",
);

assert(
  thesis.includes("export async function buildVerifiedEnterpriseThesisFromSignalPacket"),
  "EnterpriseThesis writer exposes an ECL-fed signal-packet seam",
);
assert(
  thesis.includes("enterprise-thesis/v1.2-source-breadth") &&
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
    script.includes("sig_ecl_application_named_examples_015") &&
    script.includes("sig_ecl_platform_named_resilience_016") &&
    script.includes("sig_ecl_source_breadth_guardrail_019"),
  "ECL narrative job expands deterministic signals across application, contract, infrastructure, data-flow, and source-breadth domains",
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
    script.includes("visibleNarrativeQualityIssues") &&
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
  thesis.includes("Do not write \"the enterprise creates value through <function>\"") &&
    thesis.includes("value is primarily created by") &&
    thesis.includes("Application count,") &&
    thesis.includes("they cannot support") &&
    thesis.includes("business value creation") &&
    thesis.includes("The current evidence does not establish the enterprise's value-creation model."),
  "EnterpriseThesis prompt blocks substituting technology footprint for business value creation",
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
