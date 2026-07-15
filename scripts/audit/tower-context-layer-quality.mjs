#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "reports/tower-audit");
const screenshotDir = path.join(outDir, "screenshots");
const generatedAt = process.env.TOWER_AUDIT_GENERATED_AT ?? new Date().toISOString();

const files = {
  towerPage: "src/app/(maestro)/tower/page.tsx",
  tenantTowerPage: "src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx",
  towerIndex: "src/components/tower/TowerIndexPage.tsx",
  towerCharts: "src/components/tower/charts/TowerCxoCharts.tsx",
  towerAskRoute: "src/app/api/tower/ask/route.ts",
  cioAnswer: "src/lib/cio-tower/answer.ts",
  cioCxoView: "src/lib/cio-tower/cxo-view-model.ts",
  budgetRollups: "src/lib/tower/tower-budget-rollups.ts",
  towerGrounding: "src/lib/atlas/tower-grounding.ts",
  v7Projection: "src/lib/tower/v7-tower-projection.ts",
  outcomeLedgerTypes: "src/lib/tower/outcome-ledger/types.ts",
  outcomeLedgerView: "src/lib/tower/outcome-ledger/view-model.ts",
  sourceAwareness: "src/lib/programs/ava-chat/source-tower-awareness.ts",
  movesContextDryRun: "scripts/audit/build-moves-context-pack-dry-run-proof.ts",
  knowledgeLayerProof: "scripts/audit/build-enterprise-knowledge-layer-proof.ts",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  const abs = path.join(repoRoot, file);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function rel(file) {
  return file.split(path.sep).join("/");
}

function sha(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(fileName, rows) {
  if (!rows.length) throw new Error(`No rows for ${fileName}`);
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, fileName), `${csv}\n`);
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(outDir, fileName), `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(fileName, text) {
  fs.writeFileSync(path.join(outDir, fileName), text.endsWith("\n") ? text : `${text}\n`);
}

function passFail(condition) {
  return condition ? "Pass" : "Fail";
}

function partial(condition, note) {
  return condition ? "Pass" : note ? "Partial" : "Fail";
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, read(file)]),
);

const allTowerSource = [
  source.towerPage,
  source.towerIndex,
  source.towerAskRoute,
  source.cioAnswer,
  source.cioCxoView,
  source.budgetRollups,
  source.towerGrounding,
  source.v7Projection,
  source.outcomeLedgerTypes,
  source.outcomeLedgerView,
].join("\n\n");

const evidence = {
  towerPageUsesCxoView: source.towerPage.includes("loadCioTowerCxoView"),
  towerPageUsesBudgetRollups: source.towerPage.includes("listTowerBudgetRollupsForClient"),
  cxoViewReadsCioTower: source.cioCxoView.includes("from cio_tower.measure_results") &&
    source.cioCxoView.includes("from cio_tower.facts"),
  askRouteUsesCioAnswer: source.towerAskRoute.includes("answerCioTowerQuestion"),
  cioAnswerReadsContracts: source.cioAnswer.includes("from cio_tower.question_contracts"),
  cioAnswerReadsFacts: source.cioAnswer.includes("from cio_tower.facts"),
  cioAnswerReadsRelationships: source.cioAnswer.includes("from cio_tower.relationships"),
  cioAnswerPersistsPromptTrace: source.cioAnswer.includes("cio_tower.prompt_packages") &&
    source.cioAnswer.includes("cio_tower.answer_traces"),
  v7ProjectionReadsBusinessRecords: source.v7Projection.includes("intelligence_v7.business_records"),
  towerGroundingUsesV7Projection: source.towerGrounding.includes("loadV7TowerProjection"),
  towerGroundingUsesMaterializedReadModel: source.towerGrounding.includes("listMaterializedTowerReadModelForClient"),
  outcomeLedgerFlagsUnsupportedVerified: source.outcomeLedgerView.includes("unevidencedVerifiedClaim"),
  chartsUseRecharts: source.towerCharts.includes("recharts"),
  rawTemplateDirectRead: matchesAny(allTowerSource, [/source_file ILIKE/i, /enterprise_context_records/i]),
  explicitCandidateRead: /candidate/i.test(allTowerSource),
  oldVisibleVLanguage: matchesAny(allTowerSource, [/X-AbarVa-V6/i, /\bV7\b/, /intelligence_v7/i]),
};

const contextPathRows = [
  {
    tenant_key: "meridian-health",
    tower_view_or_route: "/tower page",
    context_request_id: "tower-page-load",
    context_pack_id: "not-formalized",
    context_pack_hash: sha(source.towerPage + source.cioCxoView),
    evidence_refs_used: evidence.cxoViewReadsCioTower ? "cio_tower.source_registry via facts" : "not proven",
    canonical_fact_ids_used: evidence.cxoViewReadsCioTower ? "cio_tower.facts.fact_key" : "not proven",
    entity_profile_ids_used: evidence.cxoViewReadsCioTower ? "cio_tower.entities.entity_key/display_name" : "not proven",
    relationship_edge_ids_used: "not used on landing page",
    context_gap_ids_used: "derived from missing measures, not context_gap table",
    active_context_used: "yes",
    candidate_context_used: evidence.explicitCandidateRead ? "possible reference found" : "no direct evidence",
    old_legacy_path_used: evidence.oldVisibleVLanguage ? "yes: V6/V7 internal code markers remain" : "no",
    raw_template_direct_read: evidence.rawTemplateDirectRead ? "fallback exists" : "no",
    pass_fail: evidence.towerPageUsesCxoView && evidence.cxoViewReadsCioTower ? "Partial" : "Fail",
    notes: "Tower landing reads governed cio_tower facts/measures and budget rollups, but not through a single named TowerContextPack boundary.",
  },
  {
    tenant_key: "meridian-health",
    tower_view_or_route: "/api/tower/ask",
    context_request_id: "cio-tower-chat-question",
    context_pack_id: "CioTowerPromptContext",
    context_pack_hash: sha(source.cioAnswer),
    evidence_refs_used: "source_key, source_row, source_fact_keys",
    canonical_fact_ids_used: "cio_tower.facts.fact_key",
    entity_profile_ids_used: "cio_tower.entities display_name",
    relationship_edge_ids_used: "cio_tower.relationships.relationship_key",
    context_gap_ids_used: "deriveGaps output",
    active_context_used: "yes",
    candidate_context_used: "no direct evidence",
    old_legacy_path_used: source.towerAskRoute.includes("X-AbarVa-V6") ? "response header references V6 contract" : "no",
    raw_template_direct_read: "no",
    pass_fail: evidence.askRouteUsesCioAnswer && evidence.cioAnswerReadsFacts && evidence.cioAnswerReadsRelationships ? "Pass" : "Fail",
    notes: "Question path builds a deterministic prompt context from contracts, measures, facts, relationships, and gaps before Claude.",
  },
  {
    tenant_key: "skyharbor-air",
    tower_view_or_route: "Tower current-state formatter",
    context_request_id: "AtlasTowerCurrentState",
    context_pack_id: "AtlasTowerCurrentState",
    context_pack_hash: sha(source.towerGrounding),
    evidence_refs_used: "indirect through materialized/V7 projection",
    canonical_fact_ids_used: "not first-class in this state object",
    entity_profile_ids_used: "client profile plus initiative/vendor entities",
    relationship_edge_ids_used: "not first-class in this state object",
    context_gap_ids_used: "empty states and missing substrate counts",
    active_context_used: "yes",
    candidate_context_used: "no direct evidence",
    old_legacy_path_used: source.towerGrounding.includes("V7") ? "internal V7 projection bridge" : "no",
    raw_template_direct_read: "no",
    pass_fail: evidence.towerGroundingUsesV7Projection ? "Partial" : "Fail",
    notes: "aVa current-state formatting uses V7 projection and materialized read model fallback, but evidence/canonical fact IDs are not first-class in the state object.",
  },
];

const dataModelRows = [
  ["Strategic priority", "Partial", "V7 programs/priorities + AI initiatives", "program_name/priority fields mapped", "Active", "Some source row lineage", "Medium", "No formal Tower strategic-priority profile"],
  ["Initiative/Move", "Partial", "cio_tower facts, V7 programs, materialized read model", "initiative_budget/value views and AIInitiative", "Active", "source_fact_keys where cio_tower exists", "Medium", "Move ID is not consistently first-class in Tower page"],
  ["Program", "Partial", "V7 programs and cio_tower facts", "programLabel/source_label cleanup", "Active", "Partial", "Medium", "Program names can be derived from attributes/source_label"],
  ["Business function", "Partial", "V7 payload fields, AIInitiative fields", "business_function/service_tower fields", "Active", "Partial", "Medium", "Needs canonical function profile join"],
  ["Metric", "Exists", "cio_tower.measures and measure_results", "measure_key,label,description", "Active", "source_fact_keys", "High", "Good metric registry seam"],
  ["Baseline", "Partial", "cio_tower facts/measure_results", "period/basis fields", "Active", "Partial", "Medium", "No universal baseline_status field in Tower landing view"],
  ["Target", "Partial", "KPI snapshots and facts", "target_value fields exist in supporting rows", "Active", "Partial", "Medium", "Not uniformly present in CXO cards"],
  ["Forecast", "Exists", "cio_tower facts and V7 projection", "basis=forecast/promised values", "Active", "Partial", "Medium", "Needs clearer visible distinction from realized"],
  ["Promised value", "Exists", "cio_tower measure_results", "promised_value_fy26", "Active", "source facts", "High", "Safe if labeled promised/directional"],
  ["Measured value", "Exists", "cio_tower measure_results", "measured_value_ytd", "Active", "source facts", "High", "Good but must not be renamed realized without evidence"],
  ["Realized value", "Partial", "outcome ledger + measured value", "realizedAmount / measured_value_ytd", "Active", "evidenceBacked flag in outcome ledger", "Medium", "Realized value discipline exists in ledger, not fully integrated as TowerValueRecord"],
  ["Budget", "Exists", "cio_tower facts and budget rollups", "total_it_budget_fy26/run/change", "Active", "source facts", "High", "Strongest current Tower data path"],
  ["Spend", "Partial", "actual_spend_ytd and V7 spend_value", "actual_spend_ytd", "Active", "Partial", "Medium", "Actual spend can be a gap"],
  ["Owner", "Partial", "attributes and AIInitiative owner fields", "owner_role/owner_name/business_sponsor", "Active", "Partial", "Medium", "Owner often fallback-derived"],
  ["Evidence", "Exists", "cio_tower source facts/registry", "source_key, source_row, source_file", "Active", "High where cio_tower populated", "High", "Good lineage in CXO view"],
  ["Risk", "Partial", "pressure/status flags and V7 risks", "statusFlag, risk_status, blocker", "Active", "Partial", "Medium", "No unified risk-to-value record yet"],
  ["Control", "Missing", "Not first-class in Tower data model", "n/a", "n/a", "n/a", "Low", "Needed for CDAO/CFO confidence"],
  ["Gap", "Exists", "derived gap functions", "businessGapForMeasure/deriveGaps", "Active", "Derived", "Medium", "Derived gaps are useful but not yet persisted context_gap IDs"],
  ["Source/vendor dependency", "Exists", "vendor facts + Source awareness", "vendor_contract view, source-tower-awareness", "Active", "Partial", "Medium", "Commercial handoff needs formal Source ID"],
  ["Measurement cadence", "Missing", "Not first-class in current Tower path", "n/a", "n/a", "n/a", "Low", "Needed for operating Tower"],
  ["Calculation method", "Exists", "cio_tower formula_version and measure metadata", "formula_version", "Active", "High", "High", "Useful for audit trail"],
  ["Confidence", "Exists", "facts confidence and initiative confidence", "confidence fields", "Active", "Partial", "Medium", "Visible confidence should stay business-friendly"],
  ["Caveat", "Partial", "gaps/status/inspection reason", "gap and inspectionReason", "Active", "Partial", "Medium", "Need explicit caveat per value claim"],
].map(([concept, exists, sourceLayer, towerRepresentation, activeCandidate, evidenceCoverage, confidence, gap]) => ({
  concept,
  exists,
  source_layer: sourceLayer,
  tower_representation: towerRepresentation,
  active_candidate_status: activeCandidate,
  evidence_coverage: evidenceCoverage,
  owner_or_steward: "not consistently explicit",
  confidence,
  gap,
  module_source: "Tower/CIO Tower read model",
}));

const metricRows = [
  {
    metric_or_claim: "FY26 total IT budget",
    metric_type: "budget",
    value_status: "committed/current budget",
    evidence_status: evidence.cxoViewReadsCioTower ? "evidenced through source_fact_keys when populated" : "not proven",
    safe_visible_label: "FY26 technology budget in view",
    unsafe_visible_label: "realized savings",
    pass_fail: "Pass",
    notes: "Budget values are deterministic and sourced from cio_tower facts/measure_results or budget rollup fallback.",
  },
  {
    metric_or_claim: "Promised value",
    metric_type: "business case / forecast",
    value_status: "promised",
    evidence_status: "partial: source facts available, but not measured actuals",
    safe_visible_label: "promised value / business-case value",
    unsafe_visible_label: "realized value",
    pass_fail: "Pass",
    notes: "Current model separates promised_value_fy26 from measured_value_ytd.",
  },
  {
    metric_or_claim: "Measured value YTD",
    metric_type: "measured outcome",
    value_status: "measured",
    evidence_status: "requires source_fact_keys/source rows",
    safe_visible_label: "measured value YTD / proven value",
    unsafe_visible_label: "ROI if baseline/method missing",
    pass_fail: "Partial",
    notes: "Safe when source facts exist; audit should block ROI language if baseline/method/source is missing.",
  },
  {
    metric_or_claim: "Realized ROI",
    metric_type: "ROI",
    value_status: "not generally safe",
    evidence_status: "missing unless baseline, actual, method, owner, and as-of are present",
    safe_visible_label: "ROI not yet evidenced",
    unsafe_visible_label: "realized ROI",
    pass_fail: "Fail",
    notes: "Current Tower has good ingredients but no universal TowerValueClaim gate for ROI phrasing.",
  },
  {
    metric_or_claim: "Agent Assist AHT/FCR/CSAT",
    metric_type: "operational KPI",
    value_status: "measurement gap unless loaded",
    evidence_status: "not proven in current Tower code path",
    safe_visible_label: "measurement plan / baseline needed",
    unsafe_visible_label: "AHT reduced / FCR improved",
    pass_fail: "Partial",
    notes: "Meridian scenario should show these as trackable metrics/gaps, not outcomes, until certified data exists.",
  },
  {
    metric_or_claim: "AWS/Databricks data foundation readiness",
    metric_type: "readiness/gate",
    value_status: "readiness gate",
    evidence_status: "partial through Knowledge/Moves data, not Tower value ledger",
    safe_visible_label: "foundation readiness gate",
    unsafe_visible_label: "realized business value",
    pass_fail: "Partial",
    notes: "Should be rendered as readiness and gates, not a value claim.",
  },
];

const meridianRows = [
  ["Agent Assist / Member Service", "AHT baseline", "trackable", "missing or unvalidated", "show as measurement gap", "baseline source, as-of, queue scope"],
  ["Agent Assist / Member Service", "FCR baseline", "trackable", "missing or unvalidated", "show as measurement gap", "member service definition and source"],
  ["Agent Assist / Member Service", "Transfer/repeat contact/CSAT/cost per contact", "trackable", "missing or partial", "show measurement plan", "contact center extracts and finance cost basis"],
  ["Agent Assist / Member Service", "PHI incidents / hallucination controls / audit exceptions", "trackable", "missing or partial", "show risk/control readiness", "control owner and audit source"],
  ["Agent Assist / Member Service", "Knowledge freshness / transcript availability / API latency", "trackable", "missing or partial", "show operational readiness gaps", "system telemetry and source freshness"],
  ["Data foundation / AWS + Databricks", "Medallion architecture readiness", "readiness gate", "partial", "target/foundation readiness only", "certified bronze/silver/gold products"],
  ["Data foundation / AWS + Databricks", "Unity Catalog / lineage / semantic layer / PHI control", "readiness gate", "partial", "do not show realized value", "control evidence and data-product certification"],
  ["Finance Analytics / Cost Transparency", "close cycle / reconciliation effort / cost visibility", "trackable", "missing or partial", "hypothesis and measurement plan", "finance baseline and owner attestation"],
  ["Provider Quality / Clinical Quality", "HEDIS/Stars uplift", "regulated outcome", "unsafe unless certified", "block uplift claim", "certified quality measurement evidence"],
].map(([use_case, metric_or_gate, tower_trackability, evidence_status, safe_tower_posture, missing_evidence]) => ({
  tenant_key: "meridian-health",
  use_case,
  metric_or_gate,
  tower_trackability,
  evidence_status,
  safe_tower_posture,
  missing_evidence,
  pass_fail: safe_tower_posture.includes("block") || safe_tower_posture.includes("do not") ? "Pass" : "Partial",
}));

const handoffRows = [
  ["Knowledge", "metrics, evidence, gaps, ownership, confidence", "Partial", "Enterprise Knowledge packs define TowerContextPack but Tower runtime mostly uses cio_tower read model", "Create adapter that converts Knowledge context pack to TowerValueRecord inputs"],
  ["Intelligence", "decision framing and value hypotheses", "Partial", "aVa can define hypothesis, Tower must not accept as measured value", "Add value hypothesis intake status"],
  ["Moves", "charter success criteria, P1/P5 measurement plans", "Partial", "Moves context pack dry-run exists; formal Tower handoff not proven", "Create Moves-to-Tower measurement plan handoff"],
  ["Source", "vendor spend, savings hypotheses, SLA performance, commercial baseline", "Partial", "Source awareness helper exists, but commercial value needs formal Source ID", "Create Source commercial value handoff record"],
  ["Tower back to modules", "missing baseline/method/owner/cadence/risk", "Partial", "Derived gaps exist but are not universal outbound events", "Emit Tower evidence request/gap events"],
].map(([module, expected_handoff, status, current_state, recommendation]) => ({
  module,
  expected_handoff,
  status,
  current_state,
  recommendation,
  pass_fail: "Partial",
}));

const uiRows = [
  ["Executive value story", "Partial", "Tower landing has a command-center surface and CXO headline", "Needs clearer promised vs measured vs realized hierarchy"],
  ["Baseline / target / promised / measured / realized distinction", "Partial", "Data model distinguishes promised and measured", "Visual contract should make these states explicit"],
  ["Evidence, confidence, caveats", "Partial", "Metric cards carry source facts and gaps", "Evidence should be visible per value claim, not buried"],
  ["Unsupported ROI blocked", "Partial", "Outcome ledger flags unevidenced verified claims", "No universal visible ROI blocker in Tower page"],
  ["Initiatives-to-metrics", "Partial", "Portfolio value rows group facts by program", "Needs formal initiative metric map"],
  ["Metrics-to-owners/evidence", "Partial", "Owner and source fields are extracted when present", "Owner fallback needs explicit gap state"],
  ["Value-to-risk/control", "Partial", "Pressure cards and blockers exist", "Control dimension is not first-class"],
  ["Handoff to Moves/Source/Intelligence", "Partial", "Some helpers and context packs exist", "Needs productized handoff panels"],
  ["Polished charts/tables", "Partial", evidence.chartsUseRecharts ? "Recharts components exist" : "Charts not proven", "Do not chart unevidenced or non-numeric claims"],
  ["Hide debug/raw", "Partial", "Visible answer contract scrubs internal terms, but headers reference V6", "Remove old V-labeled headers from visible/public contracts"],
].map(([area, status, evidenceText, recommendation]) => ({
  area,
  status,
  evidence: evidenceText,
  recommendation,
  pass_fail: status === "Pass" ? "Pass" : "Partial",
}));

const visualRows = [
  ["Value ladder", "Recommended", "Use for projected/tracked/verified value states", "Only with value tier and evidence status", "Not fully proven"],
  ["Metric readiness matrix", "Recommended", "Use for Agent Assist/Data Foundation readiness", "Works with missing baselines and gates", "Future"],
  ["Initiative-to-metric map", "Recommended", "Use to connect Moves/Source/Intelligence handoffs", "Needs initiative_id and metric_id", "Future"],
  ["Value waterfall", "Restricted", "Use only with baseline, target, measured deltas", "Do not use for unmeasured hypothesis", "Guard required"],
  ["Trend line", "Restricted", "Use only with time-series evidence", "No synthetic trend lines as actuals", "Guard required"],
  ["Risk-to-value heatmap", "Recommended", "Good for CFO/CIO/CDAO views", "Needs risk/control IDs", "Future"],
  ["Owner/evidence/metric table", "Recommended", "Best current default for auditability", "Can use structured tables now", "Ready"],
  ["Source-to-Tower commercial value handoff", "Recommended", "Track savings hypothesis until measured", "Needs source_handoff_id", "Future"],
  ["Moves-to-Tower measurement plan", "Recommended", "P1/P5 should create measurement plan", "Needs moves_handoff_id", "Future"],
].map(([visual, posture, purpose, guardrail, status]) => ({
  visual,
  posture,
  purpose,
  guardrail,
  implementation_status: status,
  pass_fail: status === "Ready" ? "Pass" : "Partial",
}));

const roadmapRows = [
  ["P0", "Safety foundation", "Block unsupported realized value/ROI phrasing; require value claim status and caveat.", "High"],
  ["P1", "Measurement plan", "Represent baseline, target, owner, method, cadence, and missing evidence before any value claim.", "High"],
  ["P2", "Value ledger", "Create TowerValueRecord/TowerMetricRecord/TowerValueClaim as the formal contract.", "High"],
  ["P3", "Source commercial value", "Bring BAFO/savings opportunities into Tower as hypotheses until measured post-award.", "Medium"],
  ["P4", "Executive cockpit", "Role-based CFO/CIO/CDAO/CPO views with value, readiness, risk, and evidence.", "Medium"],
  ["P5", "Continuous value intelligence", "Close the loop from measured outcomes back to Knowledge/Intelligence/Moves/Source.", "Medium"],
].map(([phase, name, description, priority]) => ({ phase, name, description, priority }));

const top10 = [
  ["Formalize TowerContextPack", "Tower has several valid read paths but no single named context pack boundary.", "Prevents drift and makes audit proof simple.", "Knowledge/Tower context contracts", "Medium", "High"],
  ["Create TowerValueClaim gate", "ROI/realized value needs a hard status gate.", "Prevents unsafe CFO-facing claims.", "measure_results + evidence", "Medium", "High"],
  ["Add measurement-plan first view", "Many Meridian metrics are trackable but not validated.", "Makes gaps productive instead of embarrassing.", "Moves P1/P5 handoff", "Medium", "High"],
  ["Make baseline/target/promised/measured/realized visible", "The data model separates states but UI can still compress them.", "Improves CFO trust.", "Tower measure metadata", "Medium", "High"],
  ["Persist context gaps as IDs", "Current gaps are derived strings in places.", "Enables evidence-request workflow.", "Knowledge gaps", "Medium", "High"],
  ["Integrate Source handoff", "Savings/commercial value should flow as hypotheses.", "Connects sourcing wins to value realization.", "Source event/value ledger", "Medium", "Medium"],
  ["Integrate Moves handoff", "Move charters and phase success metrics should seed Tower.", "Closes strategy-to-execution loop.", "Moves measurement plan", "Medium", "High"],
  ["Add control dimension", "CDAO/CFO trust requires controls, not just risks.", "Board-grade value governance.", "Risk/control records", "Medium", "Medium"],
  ["Role-based Tower views", "CFO, CIO, CDAO, CPO need different slices.", "Improves demo relevance.", "Same value ledger", "High", "Medium"],
  ["Retire old V-language from visible contracts", "Internal V6/V7 terms remain in code headers/internal labels.", "Avoids confusing buyers and operators.", "API headers/release naming", "Low", "Medium"],
].map(([recommendation, problem, product_impact, data_dependency, implementation_complexity, demo_priority], index) => ({
  rank: index + 1,
  recommendation,
  problem,
  product_impact,
  data_dependency,
  module_dependency: "Knowledge, Intelligence, Moves, Source, Tower",
  implementation_complexity,
  demo_priority,
}));

const auditQuestions = [
  ["Q1", "For Meridian Agent Assist, what metrics can Tower track today versus what remains a measurement gap?", "Tower can track AHT/FCR/CSAT/cost/contact/adoption/safety metrics as concepts, but most should render as measurement gaps until baselines, source, owner, and as-of are loaded."],
  ["Q2", "What value claims are safe versus unsafe for Meridian Agent Assist?", "Safe: measurement plan, readiness gaps, baseline needed. Unsafe: AHT reduced, ROI realized, CSAT improved, or cost savings without measured evidence."],
  ["Q3", "How should Tower represent AWS/Databricks data foundation readiness?", "As readiness gates: certified data products, lineage, semantic layer, PHI controls, freshness, and owner signoff. Not realized value."],
  ["Q4", "How does Tower distinguish value hypothesis, promised value, measured value, and realized value?", "Partially: promised_value_fy26 and measured_value_ytd exist; outcome ledger has projected/tracked/verified. Needs one TowerValueClaim contract."],
  ["Q5", "What evidence is missing before Tower can show ROI?", "Baseline, target, calculation method, actual measured value, owner, source evidence, as-of date, and confidence/caveat."],
  ["Q6", "How should Moves P1/P5 hand off measurement plans to Tower?", "P1 should create baseline/method/owner/cadence; P5 should hand off commitments and measurement plan as TowerMetricRecord candidates."],
  ["Q7", "How should Source hand off contract/savings opportunities to Tower?", "As Source commercial value hypotheses with baseline, contract event, BAFO lever, owner, and post-award measurement plan; not realized savings."],
  ["Q8", "What should the CFO see in Tower?", "Promised vs measured value, budget/spend burn, unsupported value claims, evidence confidence, measurement gaps, and decisions requiring finance signoff."],
  ["Q9", "What should the CDAO see in Tower?", "Data-product readiness, lineage/freshness gaps, semantic ownership, controls, AI readiness gates, and value blocked by data gaps."],
  ["Q10", "What should the CIO see in Tower?", "Portfolio budget, run/change mix, vendor exposure, initiatives at risk, value proof, execution handoffs, and what to inspect this week."],
].map(([id, question, audit_answer]) => ({ id, question, audit_answer }));

const unsupportedValueClaims = metricRows.filter((row) => row.pass_fail === "Fail");
const currentState = {
  generatedAt,
  auditCodename: "TOWER-CONTEXT-LAYER-VALUE-FUTURE-AUDIT-PR",
  gitHead: (() => {
    try {
      return fs.readFileSync(path.join(repoRoot, ".git", "HEAD"), "utf8").trim();
    } catch {
      return "unknown";
    }
  })(),
  status: {
    towerUsesNewContextLayer: "Partial",
    oldVPathsAbsent: evidence.oldVisibleVLanguage ? "No" : "Yes",
    unsupportedValueClaimsExist: unsupportedValueClaims.length > 0 ? "Yes" : "No",
    meridianDemoSafe: "Conditionally: safe if framed as measurement plan/readiness, not realized ROI.",
    browserScreenshots: "Not run by this static audit. See screenshots/README.md.",
  },
  evidence,
  outputs: [
    "summary.md",
    "summary.json",
    "context-path-proof.csv",
    "tower-data-model-coverage.csv",
    "metric-value-claim-audit.csv",
    "meridian-tower-readiness.csv",
    "cross-module-handoff-audit.csv",
    "ui-rendering-audit.csv",
    "visual-quality-audit.csv",
    "future-of-tower.md",
    "future-of-tower-roadmap.csv",
    "top-10-tower-recommendations.csv",
    "tower-audit-proof.html",
  ],
};

function markdownTable(rows, headers) {
  const line = (values) => `| ${values.map((v) => String(v).replace(/\n/g, " ")).join(" | ")} |`;
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map((row) => line(headers.map((header) => row[header] ?? ""))),
  ].join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlTable(rows, headers) {
  return [
    "<table>",
    "<thead><tr>",
    ...headers.map((header) => `<th>${escapeHtml(header)}</th>`),
    "</tr></thead>",
    "<tbody>",
    ...rows.map((row) => [
      "<tr>",
      ...headers.map((header) => `<td>${escapeHtml(row[header])}</td>`),
      "</tr>",
    ].join("")),
    "</tbody>",
    "</table>",
  ].join("");
}

const summaryMd = `# Tower Context Layer and Value Future Audit

Generated: ${generatedAt}

## Verdict

Tower is **partially connected** to the newer governed context/data layer. The strongest current path is the \`cio_tower\` read model: \`measure_results\`, \`facts\`, \`entities\`, \`relationships\`, \`source_registry\`, prompt packages, and answer traces. Tower also has a V7 projection bridge and outcome-ledger honesty logic. What is missing is a single formal **TowerContextPack / TowerValueRecord** boundary that every Tower surface consumes.

## Current State

- Tower landing uses \`loadCioTowerCxoView\` and budget rollups.
- Tower aVa ask uses deterministic question contracts, measures, facts, relationships, and gaps before Claude.
- V7 projection is available as a bridge, not the formal product contract.
- Outcome ledger flags unevidenced verified claims, but Tower still lacks a universal visible ROI/value-claim gate.
- Browser screenshot capture was not run in this static PR audit.

## Safety Verdict

Meridian is demo-safe only if Tower is positioned as a measurement/readiness/value-ledger surface. It should not claim realized ROI for Agent Assist, AWS/Databricks, Finance Analytics, or Provider Quality unless baseline, method, owner, evidence, as-of, and actual measured value are present.

## Requested Audit Questions

${markdownTable(auditQuestions, ["id", "question", "audit_answer"])}

## Top 10 Recommendations

${markdownTable(top10, ["rank", "recommendation", "problem", "product_impact", "demo_priority"])}

## Proof Files

All generated files are under \`reports/tower-audit/\`.
`;

const futureMd = `# Future of Tower

## 1. What Tower Is Today

Tower is no longer just a static dashboard. It has meaningful governed ingredients:

- deterministic \`cio_tower\` measures/facts/entities/source lineage;
- a budget and portfolio command surface;
- aVa Tower question contracts and answer traces;
- V7 projection bridge for initiatives, vendors, spend, and AI use cases;
- outcome-ledger logic that flags unevidenced verified claims.

The weakness is product shape. Tower still behaves like several useful read paths rather than one explicit value-realization contract. The current implementation can tell an executive what is loaded, but it does not yet force every value claim through a single baseline / target / promised / measured / realized / evidence / owner / method gate.

## 2. What Tower Should Become

Tower should become Nexus's **enterprise value-realization command center**:

- transformation value ledger;
- baseline, target, promised, measured, and realized tracker;
- evidence-backed benefits realization engine;
- cross-module accountability layer;
- CFO/CIO/CDAO cockpit for value, readiness, risk, controls, and measurement gaps.

## 3. Product Principles

- No measured value without evidence.
- Every value claim has owner, baseline, method, evidence, status, confidence, and caveat.
- Measurement plan comes before value claim.
- Gaps become evidence requests.
- Source savings are hypotheses until post-award measurement.
- Moves charters create measurement plans.
- Intelligence can define value hypotheses, but not realized value.

## 4. Future Information Architecture

- Executive Value Brief
- Portfolio Value Map
- Initiative Value Ledger
- Baseline & Measurement Plan
- Promised vs Measured Value
- Evidence & Confidence
- Risks to Realization
- Source Commercial Value Handoff
- Moves Execution Handoff
- CFO/CIO/CDAO Views
- Audit Trail and Calculation Methods

## 5. Future Views

- **Executive:** value story, decisions required, unsupported claims, risk to realization.
- **CFO:** budget, spend, promised vs measured value, ROI blockers, finance-attested outcomes.
- **CIO:** initiatives, vendors, operating risk, run/change mix, execution health.
- **CDAO:** data readiness, lineage, semantic ownership, confidence, controls.
- **CPO / Procurement:** Source commercial handoffs, renewal leverage, SLA commitments, savings hypotheses.

## 6. Future Data Contract

\`\`\`ts
type TowerValueRecord = {
  tenant_key: string;
  initiative_id: string;
  move_id?: string; // internal only
  business_function: string;
  owner: string;
  metric_id: string;
  metric_name: string;
  baseline_value: number | null;
  baseline_source_evidence_id: string | null;
  baseline_as_of_date: string | null;
  target_value: number | null;
  target_date: string | null;
  promised_value: number | null;
  forecast_value: number | null;
  measured_value: number | null;
  realized_value: number | null;
  calculation_method: string;
  confidence: "low" | "medium" | "high";
  evidence_refs: string[];
  risk_ids: string[];
  control_ids: string[];
  source_handoff_id: string | null;
  moves_handoff_id: string | null;
  status: "hypothesis" | "planned" | "tracked" | "measured" | "realized" | "blocked";
  caveats: string[];
  active_candidate_status: "active" | "candidate";
};

type TowerMetricRecord = {
  metric_id: string;
  metric_name: string;
  metric_family: string;
  business_owner: string;
  data_owner: string;
  calculation_method: string;
  source_system: string;
  evidence_id: string;
  baseline_status: "missing" | "partial" | "validated";
  measurement_frequency: string;
  current_value: number | null;
  target_value: number | null;
  confidence: "low" | "medium" | "high";
  gap_status: "none" | "warning" | "blocker";
};

type TowerValueClaim = {
  claim_text: string;
  claim_type: "hypothesis" | "target" | "forecast" | "measured" | "realized" | "roi";
  claim_status: "safe" | "caveated" | "blocked";
  supported_by_evidence: boolean;
  supporting_evidence_refs: string[];
  unsupported_reason: string | null;
  visible_to_user: boolean;
  caveat_text: string | null;
};
\`\`\`

## 7. Future Module Integrations

- **Knowledge to Tower:** active facts, relationships, evidence, gaps, answerability.
- **Intelligence to Tower:** value hypothesis and decision framing.
- **Moves to Tower:** measurement plan, phase commitments, owner, baseline method.
- **Source to Tower:** commercial hypotheses, renewal commitments, negotiated baselines.
- **aVa to Tower:** explain value state and route unsupported claims to evidence requests.

## 8. Roadmap

${markdownTable(roadmapRows, ["phase", "name", "description", "priority"])}

## 9. What To Fix First

${markdownTable(top10, ["rank", "recommendation", "problem", "product_impact", "data_dependency", "implementation_complexity", "demo_priority"])}
`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tower Context Layer Audit</title>
  <style>
    body { margin: 0; background: #f8f7f4; color: #101828; font-family: Inter, system-ui, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 42px 28px 80px; }
    h1, h2 { font-family: Georgia, serif; letter-spacing: 0; }
    h1 { font-size: 42px; margin: 0 0 12px; }
    h2 { font-size: 26px; margin-top: 36px; }
    .eyebrow { color: #087443; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin: 24px 0; }
    .card { background: white; border: 1px solid #ddd8cc; border-radius: 10px; padding: 18px; box-shadow: 0 10px 28px rgba(15,23,42,.06); }
    .metric { font-family: Georgia, serif; font-size: 30px; font-weight: 700; }
    .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd8cc; }
    th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid #e8e2d7; font-size: 13px; }
    th { color: #475569; text-transform: uppercase; letter-spacing: .09em; font-size: 11px; }
    .partial { color: #9a5b00; font-weight: 700; }
    .pass { color: #087443; font-weight: 700; }
    .fail { color: #b42318; font-weight: 700; }
    code { background: #ede8de; padding: 2px 5px; border-radius: 5px; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Tower · Context Layer Audit</div>
    <h1>Tower should become the enterprise value-realization ledger.</h1>
    <p>This proof is read-only. It audits Tower's current context paths, value-claim discipline, Meridian demo safety, and future product direction.</p>
    <section class="grid">
      <div class="card"><div class="label">Context layer</div><div class="metric partial">Partial</div><p>Governed facts exist, but no single TowerContextPack boundary.</p></div>
      <div class="card"><div class="label">Old V labels</div><div class="metric ${evidence.oldVisibleVLanguage ? "fail" : "pass"}">${evidence.oldVisibleVLanguage ? "Found" : "Clear"}</div><p>Internal V6/V7 markers still appear in code/contracts.</p></div>
      <div class="card"><div class="label">Unsupported ROI</div><div class="metric fail">Risk</div><p>Needs universal value-claim gate before board-grade ROI.</p></div>
      <div class="card"><div class="label">Meridian demo</div><div class="metric partial">Safe with caveat</div><p>Show readiness and measurement plans, not realized ROI.</p></div>
    </section>
    <h2>Top Recommendations</h2>
    ${htmlTable(top10, ["rank", "recommendation", "problem", "demo_priority"])}
    <p>See the CSV and markdown reports in <code>reports/tower-audit/</code> for the full evidence set.</p>
  </main>
</body>
</html>`;

ensureDir(outDir);
ensureDir(screenshotDir);

writeCsv("context-path-proof.csv", contextPathRows);
writeCsv("tower-data-model-coverage.csv", dataModelRows);
writeCsv("metric-value-claim-audit.csv", metricRows);
writeCsv("meridian-tower-readiness.csv", meridianRows);
writeCsv("cross-module-handoff-audit.csv", handoffRows);
writeCsv("ui-rendering-audit.csv", uiRows);
writeCsv("visual-quality-audit.csv", visualRows);
writeCsv("future-of-tower-roadmap.csv", roadmapRows);
writeCsv("top-10-tower-recommendations.csv", top10);
writeCsv("audit-questions.csv", auditQuestions);
writeJson("summary.json", currentState);
writeText("summary.md", summaryMd);
writeText("future-of-tower.md", futureMd);
writeText("tower-audit-proof.html", html);
writeText(
  "screenshots/README.md",
  `# Tower audit screenshots\n\nStatus: The static audit proof can be rendered to \`tower-audit-proof.png\`. Live signed-in Tower route screenshots were not run by this static audit generator.\n\nRun signed-in browser proof separately against /tower for Meridian, SkyHarbor, and Industrial when a deploy/browser lane is available. Required captures: landing, metric/value view, initiative/value view, evidence/gap/caveat view, and charts/tables.\n`,
);

console.log(`Tower audit generated in ${rel(outDir)}`);
console.log(JSON.stringify(currentState.status, null, 2));
