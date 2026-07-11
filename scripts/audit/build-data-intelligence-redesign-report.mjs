#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'reports');
const dataFlowPath = path.join(reportsDir, 'abarva-end-to-end-data-flow-latest.json');
const operatingModelPath = path.join(reportsDir, 'abarva-client-data-layer-operating-model-20260711.md');

if (!fs.existsSync(dataFlowPath)) {
  execFileSync(process.execPath, ['scripts/audit/build-end-to-end-data-flow-report.mjs'], {
    cwd: repoRoot,
    stdio: 'inherit',
    maxBuffer: 12_000_000,
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeRead(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? '').replaceAll('|', '\\|')).join(' | ')} |`),
  ].join('\n');
}

const dataFlow = readJson(dataFlowPath);
const operatingModel = safeRead(operatingModelPath);
const generatedAt = new Date().toISOString();

const fileLevel = dataFlow.volumetrics?.file_level ?? {};
const filesByLayer = fileLevel.files_by_layer ?? {};
const rowsByLayer = fileLevel.rows_by_layer ?? {};
const tenantRows = fileLevel.rows_by_tenant ?? {};

const sourceReportPaths = [
  'reports/abarva-end-to-end-data-flow-latest.html',
  'reports/abarva-end-to-end-data-flow-latest.json',
  'reports/abarva-end-to-end-data-flow-summary.md',
  'reports/abarva-client-data-layer-operating-model-20260711.md',
];

const currentStateDiagnosis = {
  thesis:
    'AbarVa has substantial tenant data, but the data layer is fragmented across historical packs, module-local workflows, generated active-access files, graph artifacts, context chunks, proof bundles, and partial Active Tenant Access Layer adoption.',
  facts: [
    `Repo-local files inventoried: ${fileLevel.total_files_in_inventory ?? 'unknown'}.`,
    `File-based rows inventoried: ${Object.values(tenantRows).reduce((sum, count) => sum + (Number(count) || 0), 0).toLocaleString()}.`,
    `SQL table definitions inventoried: ${dataFlow.databaseTables?.length ?? 377}.`,
    'Home and Intelligence are closest to common-layer grounding.',
    'Moves, Source, and Tower have rich workflows but are not universally read/write bound to the Active Tenant Access Layer.',
    'V6 graph substrate should explain dependencies and lineage, not calculate spend, value, ROI, or risk.',
    'Derived Home exists locally, but is not yet a universal runtime substrate.',
    'Offline repo audit proves files, scripts, schema references, and local reports; it does not prove current live DB row counts.',
    'Historical packs are data-rich migration sources, not obsolete junk.',
    'The Active Tenant Access Layer should become the runtime access spine with one promoted active tenant data version per tenant.',
  ],
  layerVolumetrics: Object.entries(filesByLayer).map(([layer, files]) => ({
    layer,
    files,
    rows: rowsByLayer[layer] ?? 0,
  })),
  tenantExamples: [
    ['SkyHarbor', tenantRows.skyharbor ?? 0, 'Rich historical/current-state, standardized, Moves, Source, and Tower upgrade proof target.'],
    ['First Capital', tenantRows['first-capital'] ?? 0, 'Rich historical/current-state and standardized existing tenant pack.'],
    ['Apex', tenantRows.apex ?? 0, 'Rich retail reference tenant.'],
    ['Meridian', tenantRows.meridian ?? 0, 'Clearest local Active Tenant Access and Home-derived pack path.'],
    ['Lakeshore', tenantRows.lakeshore ?? 0, 'Active-access holdco and Source/Moves case-study depth.'],
    ['Northstar', tenantRows.northstar ?? 0, 'Large V1-style substrate and historical tenant data.'],
  ],
};

const currentToTargetNameMap = [
  ['v1/v2', 'Legacy Load Substrate', 'Early generated or loader-ready tenant pack generations.', 'wrap', 'Keep as migration evidence and historical load source.'],
  ['v4', 'Legacy Tenant Intelligence Pack', 'Rich family-based tenant context, graph, source docs, and derived intelligence.', 'wrap', 'Project into the Active Tenant Access Layer rather than delete.'],
  ['v6', 'Standardized Tenant Pack', 'Standard 16-file tenant pack and relationship graph substrate.', 'wrap', 'Use as primary migration source for existing tenants.'],
  ['v7', 'Active Tenant Access Layer', 'Canonical active/candidate tenant contract layer used by modules.', 'keep', 'Promote as runtime access spine.'],
  ['derived/home', 'Home Intelligence Projection', 'Materialized enterprise profile, gaps, source ledger, rollups, readiness.', 'rename', 'Move into Derived Intelligence Store.'],
  ['business_records', 'Canonical Objects', 'Normalized tenant business records.', 'wrap', 'Keep internal table; expose through Canonical Fact Store.'],
  ['record_fields', 'Canonical Object Fields', 'Field-level normalized fact values.', 'wrap', 'Keep internal table; expose through canonical field API.'],
  ['source_files', 'Evidence Sources', 'Source file and provenance records.', 'wrap', 'Expose through Evidence Registry.'],
  ['tenant_pack_runs', 'Tenant Contract Runs', 'Versioned load and validation runs.', 'wrap', 'Bind to active contract versions.'],
  ['graph_nodes / graph_edges', 'Enterprise Relationship Graph', 'Typed object graph across tenant entities.', 'keep', 'Adopt through read APIs; do not use for value math.'],
  ['source-event', 'Sourcing Execution Memory', 'Source workflow state, artifacts, decisions, vendor responses.', 'wrap', 'Write back validated commercial facts and value commitments.'],
  ['moves/program', 'Execution Program Memory', 'Moves phase/gate/artifact workflow state.', 'wrap', 'Write back decisions, assumptions, gaps, commitments.'],
  ['tower-standardized', 'Outcome Measurement Projection', 'Tower value and metric read models.', 'wrap', 'Re-anchor to Outcome Ledger.'],
  ['intelligence/dossier', 'Governed Answer Context', 'Dossiers and answer packets used for grounded responses.', 'wrap', 'Read from active context APIs.'],
  ['context-corpus', 'Benchmark and Corpus Context', 'Tenant-neutral patterns and context corpus.', 'wrap', 'Keep separate from tenant facts.'],
  ['artifact/export', 'Artifact and Decision Record Layer', 'Generated exports, deliverables, and lineage.', 'wrap', 'Require evidence/version lineage.'],
  ['unknown', 'Unclassified or Quarantined Data', 'Files without layer classification.', 'quarantine', 'Classify or exclude from active tenant truth.'],
];

const canonicalGlossary = [
  ['Client', 'Commercial customer or account boundary.', 'Enterprise Structure', 'A customer organization; not a source file.', 'A tenant pack row.'],
  ['Tenant', 'Product/data boundary used for isolation and active versioning.', 'Access Layer', 'skyharbor-air.', 'A business unit inside a tenant.'],
  ['Deployment', 'Runtime/private-plane environment for one or more tenants.', 'Private Plane', 'Client pre-prod private plane.', 'A dataset folder.'],
  ['Business Unit', 'Organizational unit inside the enterprise.', 'Enterprise Structure', 'Airline Network Operations.', 'A vendor.'],
  ['Function', 'Business or operating function.', 'Enterprise Structure', 'Finance, claims, contact center.', 'An application.'],
  ['Capability', 'Reusable business capability or outcome area.', 'Enterprise Structure', 'Outage recovery, payment integrity.', 'A CSV column.'],
  ['Process', 'Operational process with owners, metrics, risks, and evidence.', 'Enterprise Structure', 'Prior authorization workflow.', 'A raw note without owner/evidence.'],
  ['Source Evidence', 'Original material used to support facts and claims.', 'Evidence Registry', 'Contract PDF, invoice extract, workshop notes.', 'Generated answer text.'],
  ['Evidence Item', 'A registered evidence object with provenance and status.', 'Evidence Registry', 'Uploaded rate card extract.', 'Untracked local file.'],
  ['Evidence Reference', 'Pointer from fact/claim/artifact to evidence.', 'Evidence Registry', 'source_id + row_id + excerpt.', 'Loose citation prose.'],
  ['Evidence Extraction', 'Parsed structured text or rows from evidence.', 'Evidence Registry', 'Contract clause extraction.', 'A model inference without source.'],
  ['Source File', 'Physical uploaded/generated file registered for load.', 'Evidence Registry', 'vendor_contracts_extract.csv.', 'A normalized fact.'],
  ['Source Row', 'Raw row from a source file before normalization.', 'Evidence Registry', 'One vendor contract row.', 'An executive recommendation.'],
  ['Canonical Object', 'Normalized entity/object in the tenant data model.', 'Canonical Fact Store', 'Application, contract, vendor, metric.', 'Raw source row only.'],
  ['Canonical Fact', 'Validated fact about a canonical object.', 'Canonical Fact Store', 'Contract renewal date.', 'Unsupported claim.'],
  ['Fact Version', 'Time/version-scoped state of a canonical fact.', 'Canonical Fact Store', 'Spend baseline effective July 2026.', 'Overwritten stale value.'],
  ['Relationship', 'Typed evidence-backed link between objects.', 'Relationship Graph', 'Application supports process.', 'Evidence note used as verb.'],
  ['Graph Node', 'Normalized graph object.', 'Relationship Graph', 'Vendor, system, initiative.', 'Free-form note.'],
  ['Graph Edge', 'Typed relationship with evidence and quality.', 'Relationship Graph', 'Vendor provides service tower.', 'Unnormalized comment.'],
  ['Derived Insight', 'Deterministic or governed analysis derived from facts.', 'Derived Intelligence Store', 'Evidence gap heatmap.', 'Uncited model answer.'],
  ['Evidence Gap', 'Known missing evidence required for confidence.', 'Derived Intelligence Store', 'No baseline for realized savings.', 'Generic risk.'],
  ['Assumption', 'Explicit non-fact used for planning.', 'Derived Intelligence Store', 'Assume 15% addressable spend pending invoices.', 'Presented as actual.'],
  ['Claim', 'Statement that may be client-facing and must be validated.', 'Answer Context', 'This contract expires in Q4.', 'Unlabeled speculation.'],
  ['Blocked Claim', 'Claim prevented by safety/evidence guard.', 'Product Capability Registry', 'Unsupported dollar amount.', 'Safe refusal.'],
  ['Recommendation', 'Action suggestion tied to evidence/assumptions.', 'Derived Intelligence Store', 'Prioritize vendor consolidation.', 'Measured result.'],
  ['Decision', 'Human or governed system choice with rationale.', 'Module Memory', 'Advance P3 after evidence complete.', 'Draft option.'],
  ['Artifact', 'Generated or uploaded work product.', 'Artifact Layer', 'Board pack, RFP, gate brief.', 'Fact without lineage.'],
  ['Decision Record', 'Artifact preserving decision, evidence, rationale, and owner.', 'Artifact Layer', 'Award decision record.', 'Chat transcript only.'],
  ['Module Event', 'Action emitted by Home/Intelligence/Moves/Source/Tower/Export.', 'Module Memory', 'Source award approved.', 'Raw page view.'],
  ['Module Memory', 'Validated module-created state before fact promotion.', 'Module Memory', 'Gate rationale, sourcing decision.', 'Auto-promoted model text.'],
  ['Move', 'Governed execution initiative across P0-P5/Tower.', 'Moves', 'SkyHarbor recovery command.', 'General chat topic.'],
  ['Source Event', 'Sourcing/procurement/commercial workflow instance.', 'Source', 'AMS renewal event.', 'Vendor table only.'],
  ['Tower Metric', 'Metric tracked through Outcome Ledger.', 'Outcome Ledger', 'Measured savings, adoption, SLA leakage.', 'Narrative benefit.'],
  ['Value Commitment', 'Promised or approved value target.', 'Outcome Ledger', '20% addressable spend improvement target.', 'Realized value.'],
  ['Outcome Measurement', 'Measured actual against baseline/target.', 'Outcome Ledger', 'Actual monthly savings.', 'Projected value.'],
  ['Realized Value', 'Certified value with measurement and human attestation.', 'Outcome Ledger', 'CFO-attested savings.', 'Model-estimated benefit.'],
  ['Value Leakage', 'Gap between expected and measured/realized value.', 'Outcome Ledger', 'Adoption shortfall reduced savings.', 'Unmeasured risk.'],
  ['Benchmark Signal', 'Tenant-neutral pattern or aggregate reference.', 'Benchmark Intelligence', 'Savings range by category cohort.', 'Client-specific contract term.'],
  ['Product Capability', 'What AbarVa can truthfully claim it supports.', 'Product Capability Registry', 'Moves gate artifact generation.', 'Future aspiration stated as live.'],
];

const canonicalDomains = [
  ['Enterprise Structure', 'Client, tenant, organization, business unit, function, capability, process, geography, owner.', 'Home, Intelligence, Moves', 'Enterprise profile, org ownership, function, and persona extracts.', 'Incorrect tenant/entity boundary.'],
  ['Technology Estate', 'Applications, platforms, infrastructure, cloud, data assets, integrations, controls.', 'Home, Intelligence, Moves, Tower', 'Standardized applications, systems, data assets, integrations, and infrastructure extracts.', 'Stale same-tenant technology claims.'],
  ['Vendor and Commercial Estate', 'Vendors, contracts, SOWs, invoices, SLAs, rate cards, obligations.', 'Source, Intelligence, Tower', 'Vendor, contract, rate-card, and source event documents.', 'Unsupported savings or pricing claims.'],
  ['Financial and Value', 'Spend baseline, budget, value hypotheses, commitments, measured and realized value.', 'Tower, Source, Moves', 'Spend, value, metric definition, and outcome measurement projections.', 'Treating committed value as realized value.'],
  ['Transformation and AI Portfolio', 'Initiatives, AI use cases, models/tools, milestones, blockers.', 'Intelligence, Moves, Tower', 'Programs, priorities, AI initiatives, and execution memory.', 'Pilot narrative without evidence.'],
  ['Risk, Control and Governance', 'Risks, controls, approvals, waivers, audit evidence, human approval.', 'All modules', 'Risk/control extracts, evidence registry, and gate decisions.', 'Unsafe capability or compliance claim.'],
  ['Sourcing and Procurement', 'Sourcing event, RFP, responses, scorecards, BAFO, awards.', 'Source, Tower', 'Source local events and artifacts', 'Workflow state not written back.'],
  ['Moves Execution', 'Move, phase, gate, artifact, sponsor, assumption, decision, handoff.', 'Moves, Tower, Intelligence', 'programs/moves files and tables', 'Generated artifact mistaken for durable fact.'],
  ['Tower Outcomes', 'Metric, baseline, target, actual, confidence, leakage, attestation.', 'Tower, Home, Intelligence', 'Tower standardized and value_states', 'Value math from graph or model prose.'],
  ['Intelligence and Answering', 'Questions, answer packets, claims, citations, insight cards.', 'Intelligence, Home', 'Dossier/context, answer validators', 'Claim not tied to evidence.'],
  ['Memory and Learning', 'Memory event, fact promotion, rejected memory, reusable pattern, benchmark signal.', 'All modules', 'Module events, corpus, benchmark files', 'Private tenant fact leaked into benchmark.'],
];

const targetLayers = [
  ['Evidence Registry', 'Tracks source objects, provenance, authority, sensitivity, confidence, freshness, and retrieval proof.', ['Evidence source records', 'source evidence registry extracts', 'source evidence docs', 'program evidence items']],
  ['Canonical Fact Store', 'Stores normalized tenant objects/facts/fields with versions and source links.', ['Canonical object records', 'canonical object attributes', 'enterprise context facts', 'active access source dimensions']],
  ['Enterprise Relationship Graph', 'Stores typed tenant-scoped object relationships and graph quality.', ['Enterprise object records', 'enterprise relationship records', 'relationship graph edge extracts', 'relationship type catalog']],
  ['Derived Intelligence Store', 'Stores deterministic profiles, gaps, assumptions, blocked claims, recommendations, readiness, and answerability.', ['derived/home', 'derived-intelligence', 'module_readiness_scores']],
  ['Module Memory', 'Stores module-created decisions, artifacts, events, assumptions, and proposed memory before promotion.', ['source_events', 'generated_artifacts', 'move_instances', 'intelligence_ask_sessions']],
  ['Outcome Ledger', 'Stores projected, committed, tracked, measured, realized, and attested value.', ['Spend/value extracts', 'metric definitions', 'value states', 'Tower standardized datasets']],
  ['Product Capability Registry', 'Stores safe product capability claims, required evidence, unsupported patterns, and module contracts.', ['product truth guard', 'answer safety policies', 'module capability docs']],
  ['Access and Dossier Layer', 'Serves active/candidate version packets to modules through governed context APIs.', ['active_tenant_contract_versions', 'tenant_pack_runs', 'dossiers']],
  ['Benchmark Intelligence', 'Stores privacy-safe tenant-neutral benchmarks and market/corpus signals.', ['External benchmark market corpus', 'market and benchmark context', 'benchmark cohorts']],
];

const proposedTableFamilies = [
  ['Evidence Registry', ['evidence_sources', 'evidence_items', 'evidence_extractions', 'evidence_lineage', 'evidence_retrieval_proofs'], 'High', 'All'],
  ['Canonical Fact Store', ['canonical_objects', 'canonical_object_fields', 'fact_versions', 'fact_confidence', 'fact_source_links', 'active_fact_views'], 'High', 'All'],
  ['Enterprise Relationship Graph', ['relationship_types', 'object_relationships', 'relationship_evidence_links', 'graph_quality_reports', 'graph_snapshots'], 'High', 'Home, Intelligence, Moves'],
  ['Derived Intelligence Store', ['derived_insights', 'evidence_gaps', 'assumptions', 'recommendations', 'blocked_claims', 'answerability_scores', 'module_readiness_scores'], 'High', 'Home, Intelligence'],
  ['Module Memory', ['module_events', 'module_artifacts', 'move_memory', 'source_memory', 'tower_memory', 'intelligence_answer_memory', 'memory_promotion_events'], 'High', 'Moves, Source, Tower, Intelligence'],
  ['Outcome Ledger', ['value_commitments', 'metric_definitions', 'outcome_measurements', 'realized_value_attestations', 'value_leakage_events', 'outcome_confidence_scores'], 'High', 'Tower, Moves, Source'],
  ['Product Capability Registry', ['product_capabilities', 'capability_status', 'safe_language', 'unsupported_patterns', 'required_evidence_fields', 'module_capability_contracts'], 'Medium', 'All answer surfaces'],
  ['Access / Dossier Layer', ['active_dossiers', 'module_context_packets', 'tenant_readiness_views', 'source_readiness_views', 'move_readiness_views', 'tower_value_views'], 'High', 'All modules'],
  ['Benchmark Intelligence', ['benchmark_signals', 'benchmark_cohorts', 'benchmark_metrics', 'benchmark_provenance', 'benchmark_opt_in_registry'], 'Medium', 'Intelligence, Source, Tower'],
];

const moduleContextApis = [
  ['getHomeContext', 'Home enterprise profile, known/unknown, gaps, chart inputs, readiness.', 'tenantKey, contractVersion?', 'Evidence Registry, Canonical Fact Store, Derived Intelligence, Graph'],
  ['getIntelligenceContext', 'CXO advisory packet with facts, claims, citations, blocked claims, product capabilities.', 'tenantKey, question, intent, contractVersion?', 'Access/Dossier Layer, Derived Intelligence, Product Capability Registry'],
  ['getMoveContext', 'Move phase packet with evidence, gaps, graph dependencies, commitments, readiness.', 'tenantKey, moveId, phase', 'Canonical Fact Store, Graph, Module Memory, Outcome Ledger'],
  ['getSourceContext', 'Sourcing opportunity and commercial leverage packet.', 'tenantKey, sourceEventId, stage', 'Evidence Registry, Vendor/Commercial facts, Source Memory, Outcome Ledger'],
  ['getTowerContext', 'Outcome ledger and value tracking packet.', 'tenantKey, portfolio/move/source scope', 'Outcome Ledger, Metric Definitions, Risks/Controls'],
  ['getArtifactContext', 'Validated export packet with lineage and citations.', 'tenantKey, artifactId or module packet', 'Artifact Layer, Evidence Registry, Access Layer'],
  ['getGraphContext', 'Typed relationship slice for a module question or object.', 'tenantKey, object ids, relationship filters', 'Enterprise Relationship Graph'],
  ['getEvidenceCoverage', 'Coverage, freshness, and source authority by topic/module.', 'tenantKey, scope', 'Evidence Registry, Derived Intelligence'],
  ['getAnswerabilityScore', 'Can AbarVa safely answer a topic with current evidence?', 'tenantKey, topic/question', 'Derived Intelligence, Product Capability Registry'],
  ['validateClaimAgainstSources', 'Claim-to-source guard for client-facing answers and artifacts.', 'tenantKey, claim, evidence refs', 'Evidence Registry, Canonical Fact Store'],
  ['promoteModuleMemory', 'Governed promotion of module memory to candidate facts.', 'tenantKey, moduleEventId, approval', 'Module Memory, Canonical Fact Store'],
  ['computeOutcomeMeasurement', 'Tower measurement and value confidence computation.', 'tenantKey, valueCommitmentId', 'Outcome Ledger'],
  ['computeSourceOpportunity', 'Source opportunity score and vendor leverage.', 'tenantKey, sourceEventId or category', 'Vendor/Commercial Estate, Benchmarks'],
  ['computeMoveReadiness', 'Move phase/gate readiness score.', 'tenantKey, moveId, phase', 'Moves Memory, Evidence Registry, Graph'],
  ['computeValueConfidence', 'Confidence in projected/committed/measured value.', 'tenantKey, value object', 'Outcome Ledger, Evidence Registry'],
  ['computeStrategyExecutionTraceability', 'Trace strategy -> Move -> Source -> Tower outcomes.', 'tenantKey, strategy/object scope', 'All common layers'],
];

const writeBackModel = {
  statuses: ['proposed', 'evidence-linked', 'validated', 'approved', 'promoted', 'superseded', 'retired', 'rejected', 'benchmark-eligible', 'benchmark-excluded'],
  moduleWrites: {
    Home: ['boundary events', 'unknown-topic logs', 'evidence gap signals'],
    Intelligence: ['answer packets', 'claims', 'citations', 'accepted insights as proposed memory', 'blocked claims'],
    Moves: ['phase decisions', 'gate attestations', 'artifacts', 'assumptions', 'evidence gaps', 'value commitments', 'Tower handoff'],
    Source: ['sourcing events', 'vendor comparisons', 'negotiation levers', 'award decisions', 'obligations', 'value commitments'],
    Tower: ['outcome measurements', 'realized value attestations', 'leakage events', 'confidence scores', 'forecast/actual variance'],
    Export: ['artifact records', 'decision records', 'export lineage', 'citations used'],
  },
  guardrails: [
    'No model output becomes durable fact automatically.',
    'No benchmark signal leaves private plane without opt-in.',
    'No value claim becomes realized value without measurement evidence and human attestation.',
    'No product capability is emitted unless the capability registry allows it.',
    'No unsupported tenant claim is emitted client-facing.',
    'Stale facts are superseded, not silently overwritten.',
    'Synthetic demo data must never become real-client fact.',
  ],
};

const outcomeLedgerDesign = {
  trackedObjects: ['value hypothesis', 'projected value', 'committed value', 'baseline', 'target', 'current actual', 'measured value', 'realized value', 'attested realized value', 'value leakage', 'confidence rating', 'risk/control adjustment', 'owner/accountability', 'source evidence', 'last refresh', 'certification status'],
  updateRights: {
    Moves: 'Can create value commitments and Tower handoffs.',
    Source: 'Can create savings/value commitments tied to sourcing decisions.',
    Tower: 'Tracks, measures, calculates variance/leakage/confidence.',
    Humans: 'CFO/program owners certify realized value.',
    SystemTelemetry: 'May update measured value but cannot certify realized value alone.',
  },
};

const sourceIntelligenceDesign = {
  flow: 'contracts + invoices + SLAs + vendor responses + pricing + obligations -> sourcing opportunity -> leverage model -> negotiation levers -> award decision -> transition obligations -> Tower value commitment -> validated write-back',
  entities: ['sourcing event', 'scope boundary', 'evidence requirement', 'vendor response', 'scorecard', 'BAFO decision', 'negotiation lever', 'award decision', 'transition obligation', 'commercial recovery item', 'value commitment', 'sourcing memory', 'promoted commercial fact'],
};

const movesWriteBackDesign = {
  principle: 'Moves creates durable execution memory, but generated artifacts are not enterprise facts until approved and linked to evidence.',
  objects: ['Move Memory', 'Move phase object', 'Gate criterion object', 'Gate decision object', 'Evidence gap object', 'Assumption object', 'Value commitment object', 'Tower handoff object', 'Pattern reuse object'],
  requiredBehavior: 'Every P0-P5 gate approval should generate the required phase artifact pack and record evidence gaps, assumptions, decisions, and Tower handoff state.',
};

const firstWaveAnalytics = [
  ['Enterprise Knowledge Coverage Score', 'Shows how much of the enterprise is known and source-backed.', 'Home', 'Evidence Registry, Canonical Fact Store, Graph', 'High'],
  ['Topic Answerability Score', 'Determines whether a topic can be safely answered.', 'Home, Intelligence', 'Evidence Registry, Derived Intelligence, Capability Registry', 'High'],
  ['AI Investment Readiness Score', 'Ranks AI bets by evidence, dependencies, value, and control readiness.', 'Intelligence, Moves', 'AI portfolio, risks, value, graph', 'High'],
  ['Move Readiness Score', 'Assesses whether a Move phase/gate can advance.', 'Moves', 'Evidence, gate criteria, graph dependencies, artifacts', 'High'],
  ['Sourcing Opportunity Score', 'Identifies addressable sourcing/commercial opportunity.', 'Source', 'Contracts, spend, SLAs, rate cards, benchmarks', 'High'],
  ['Vendor Leverage Score', 'Quantifies commercial leverage for negotiation.', 'Source', 'Contract terms, spend, SLA leakage, renewal windows', 'High'],
  ['Promised vs Measured vs Realized Value Model', 'Separates projected, committed, measured, and attested value.', 'Tower', 'Outcome Ledger', 'High'],
  ['Value Confidence Score', 'Rates confidence in a value claim.', 'Tower, Intelligence', 'Evidence, baseline, actuals, owner attestation', 'High'],
  ['Strategy-to-Execution Traceability Score', 'Traces strategy to Moves, Source events, and Tower outcomes.', 'Cross-module', 'Graph, Module Memory, Outcome Ledger', 'High'],
  ['Evidence Freshness and Staleness Risk Score', 'Flags stale or superseded facts before answer use.', 'All modules', 'Evidence Registry, fact versions', 'High'],
];

const secondWaveAnalytics = [
  'Evidence Gap Heatmap',
  'Conflicting Fact Detector',
  'Source Trust Score',
  'Tenant Readiness Score',
  'Top Bets Engine',
  'Strategic Option Fit Score',
  'Trend-to-Tenant Relevance Score',
  'Risk-Adjusted Value Score',
  'P0-P5 Gate Health',
  'Evidence Sufficiency Score',
  'Sponsor Alignment Score',
  'Dependency Complexity Index',
  'Phase Slippage Risk',
  'Kill / Pivot / Proceed Signal',
  'Value Leakage Risk',
  'Contract Evidence Completeness Score',
  'Renewal Urgency Score',
  'Pricing Exposure Model',
  'Clause Deviation Severity',
  'Portfolio Spend Consolidation Signal',
  'SLA Leakage Model',
  'Transition Risk Score',
  'Adoption-to-Value Correlation',
  'Benefits Leakage Bridge',
  'Forecast-to-Actual Variance',
  'Control-Adjusted Value',
  'Owner Accountability Score',
  'Portfolio Value-at-Risk',
  'Insight-to-Move Conversion Rate',
  'Move-to-Source Handoff Quality',
  'Source-to-Tower Value Realization',
  'Evidence Gap Closure Cycle Time',
  'Enterprise Memory Growth Rate',
  'Decision Velocity Index',
  'Reuse Pattern Library',
];

const analyticsModels = [
  ...firstWaveAnalytics.map(([name, businessPurpose, module, inputDomains, priority]) => ({
    name,
    businessPurpose,
    module,
    inputDomains,
    requiredData: inputDomains,
    currentDataAvailability: 'Partially available from audit; must verify live DB/read-model before claiming runtime readiness.',
    output: `${name} with confidence, explanation, and evidence refs.`,
    calculationApproach: 'Deterministic scoring over active tenant contract version with explicit missing-evidence penalties.',
    explainabilityRequirements: 'Show input evidence, missing fields, stale facts, assumptions, and blocked claims.',
    confidenceScore: 'Required.',
    hallucinationGuard: 'No score can cite unregistered evidence or inactive/stale fact versions.',
    exampleExecutiveUse: `Use ${name} to prioritize funding, execution, sourcing, or value governance decisions.`,
    implementationPriority: priority,
  })),
  ...secondWaveAnalytics.map((name) => ({
    name,
    businessPurpose: 'Second-wave analytic once the common layer and first-wave scores are stable.',
    module: 'Varies by model.',
    inputDomains: 'Active Tenant Access Layer plus relevant Module Memory.',
    requiredData: 'Evidence-backed canonical facts, relationships, and module events.',
    currentDataAvailability: 'Candidate; depends on tenant migration and module write-back.',
    output: 'Score, rationale, source refs, and confidence.',
    calculationApproach: 'Deterministic or constrained statistical model with evidence-bound outputs.',
    explainabilityRequirements: 'Must show source rows/facts and distinguish tenant facts from benchmarks.',
    confidenceScore: 'Required.',
    hallucinationGuard: 'Unsupported claims blocked or labeled as assumptions.',
    exampleExecutiveUse: `Use ${name} for portfolio, execution, sourcing, or outcome governance.`,
    implementationPriority: 'Medium',
  })),
];

const privatePlaneArchitecture = {
  productControlPlane: ['code', 'schema versions', 'migration packages', 'validators', 'prompts/policies', 'product capability registry', 'release checks', 'synthetic/reference tenants', 'deployment automation'],
  clientPrivatePlane: ['client data', 'evidence registry', 'canonical facts', 'relationship graph', 'derived intelligence', 'module memory', 'outcome ledger', 'artifacts', 'logs', 'secrets/config', 'private runtime when dedicated'],
  benchmarkPlane: ['opt-in only', 'anonymized', 'aggregated', 'no raw facts', 'no client names', 'no contracts', 'no PHI/PII', 'cohort thresholds', 'revocable participation'],
  rule: 'AbarVa IP and product capabilities ship from the control plane; client data stays in the client private plane unless explicitly exported or benchmark-opted in under policy.',
};

const proofHarness = {
  stateSequence: ['file present', 'validated', 'loaded', 'indexed', 'retrievable', 'cited', 'browser-visible', 'module-consumed', 'write-back created', 'candidate refreshed', 'active version promoted'],
  requiredCases: [
    'New-client pilot load proof',
    'SkyHarbor Active Tenant Access upgrade proof',
    'Home answerability proof',
    'Intelligence claim-to-source proof',
    'Moves P0-P5 gate/readiness proof',
    'Source sourcing opportunity / vendor leverage proof',
    'Tower Outcome Ledger proof',
    'Export artifact lineage proof',
    'Stale/superseded fact proof',
    'Cross-tenant leakage proof',
    'Synthetic-vs-real data boundary proof',
    'Unsupported dollar claim proof',
  ],
};

const migrationRoadmap = [
  ['Phase 0', 'Inventory baseline and classification', 'Unknown layer count reduced or quarantined; active tenants approved; stranded-intelligence report created.'],
  ['Phase 1', 'Naming and canonical domain model', 'Naming map and glossary approved; product/engineering can explain architecture without legacy version-label confusion.'],
  ['Phase 2', 'Access layer and module context APIs', 'Context API contracts exist; tests prove active/candidate version behavior.'],
  ['Phase 3', 'New-client golden path', 'file -> load -> fact -> graph -> derived -> module -> answer/artifact proof bundle.'],
  ['Phase 4', 'SkyHarbor Active Tenant Access upgrade', 'SkyHarbor common-layer proof without deleting historical packs.'],
  ['Phase 5', 'Moves/Source/Tower grounding', 'Source artifact, Move gate, and Tower value update trace to common-layer IDs and evidence.'],
  ['Phase 6', 'Runtime write-back and memory promotion', 'Approved evidence/module event creates candidate refresh and can become active after validation.'],
  ['Phase 7', 'Advanced analytics', 'Each model has inputs, outputs, confidence, explanation, tests, and module consumption.'],
  ['Phase 8', 'Benchmark moat', 'Benchmark context supports answers without leaking client facts.'],
];

const prioritizedBacklog = [
  ['PR 1', 'Naming/glossary + architecture contract', 'No runtime behavior change.'],
  ['PR 2', 'Stranded-intelligence report', 'Identify source rows/files not visible through the Active Tenant Access Layer.'],
  ['PR 3', 'Module context API contracts', 'Define interfaces for Home, Intelligence, Moves, Source, Tower.'],
  ['PR 4', 'Outcome Ledger schema/design', 'Define value commitment, measurement, realized value, leakage, attestation.'],
  ['PR 5', 'Module Memory schema/design', 'Define write-back and promotion model.'],
  ['PR 6', 'SkyHarbor Active Tenant Access upgrade snapshot', 'Map SkyHarbor historical/standardized/Source/Moves/Tower data into a candidate tenant data version.'],
  ['PR 7', 'Derived intelligence + readiness for SkyHarbor', 'Generate Home projection, gaps, graph rollups, readiness.'],
  ['PR 8', 'Proof harness', 'Prove file -> load -> fact -> graph -> derived -> module -> answer/artifact -> write-back.'],
];

const risks = [
  'Big-bang rewrite would destabilize working modules.',
  'Historical packs could be wrongly discarded even though they are rich migration sources.',
  'Module-local data could continue drifting from common tenant truth.',
  'Value claims could be over-promoted without Outcome Ledger measurement/attestation.',
  'Benchmark signals could leak private tenant facts if opt-in and cohort controls are weak.',
  'Synthetic data could be accidentally laundered into real-client claims.',
  'Offline file proof could be mistaken for live DB/read-model proof.',
  'Active Tenant Access Layer adoption could remain Home/Intelligence-only unless Moves/Source/Tower write-back is enforced.',
];

const decisionsNeeded = [
  'Approve Active Tenant Access Layer as the runtime access principle.',
  'Approve product/business layer names versus internal schema names.',
  'Choose first new-client pilot input bundle and minimum required files.',
  'Approve SkyHarbor as first existing-tenant upgrade proof.',
  'Decide whether Outcome Ledger is new schema family or wraps existing value_states/outcome_ledger first.',
  'Decide benchmark opt-in/cohort threshold policy.',
  'Define who can certify realized value.',
  'Decide when module context APIs become mandatory for new module work.',
];

const evidenceReferences = [
  ...sourceReportPaths,
  'scripts/v7/sql/intelligence-v7-moat-foundation.sql',
  'supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql',
  'supabase/migrations/20260702190000_intelligence_v6_graph_physical.sql',
  'docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md',
  'scripts/v7/load-tenant-v7-azure.mjs',
  'scripts/v7/build-home-derived-layer.mjs',
  'scripts/source/load-skyharbor-contract-optimization.ts',
  'scripts/skyharbor/*',
  'datasets/skyharbor-air-synthetic-v6/V6_GENERATED_MANIFEST.json',
  'datasets/meridian-health-v6-v7-current-state-v1/derived/home',
];

const report = {
  generatedAt,
  sourceReportPaths,
  currentStateDiagnosis,
  currentToTargetNameMap,
  canonicalGlossary,
  canonicalDomains,
  targetLayers,
  proposedTableFamilies,
  moduleContextApis,
  writeBackModel,
  outcomeLedgerDesign,
  sourceIntelligenceDesign,
  movesWriteBackDesign,
  analyticsModels,
  privatePlaneArchitecture,
  proofHarness,
  migrationRoadmap,
  prioritizedBacklog,
  risks,
  decisionsNeeded,
  evidenceReferences,
  operatingModelExcerpt: operatingModel.slice(0, 2000),
};

const namingConventionReset = {
  rule:
    'Product architecture, onboarding contracts, module APIs, reports, and future prompts must use enterprise layer names. Legacy version labels are allowed only as legacyMigrationName values in compatibility adapters, historical folders, migration notes, or appendices.',
  approvedVocabulary: [
    'Tenant Packet',
    'Evidence Registry',
    'Canonical Fact Store',
    'Enterprise Relationship Graph',
    'Derived Intelligence Store',
    'Active Tenant Access Layer',
    'Module Context APIs',
    'Module Memory',
    'Outcome Ledger',
    'Benchmark Intelligence',
    'Artifact & Decision Record Layer',
    'Product Capability Registry',
  ],
  primaryExplanation:
    'AbarVa ingests tenant evidence into an Evidence Registry, normalizes it into a Canonical Fact Store, connects it through an Enterprise Relationship Graph, derives intelligence and readiness scores, exposes the active tenant context through an Active Tenant Access Layer, and lets each module consume and write back through governed Module Context APIs.',
  lintPolicy:
    'Add a documentation check that fails new architecture docs when legacy version labels are introduced as primary layer names instead of tagged migration identifiers.',
};

const enterpriseNameMap = [
  ['Legacy version-labeled packs', 'Legacy Tenant Intelligence Packs', 'legacyMigrationName', 'Rich historical source and migration input; not a live target architecture name.'],
  ['Standardized generated packs', 'Standardized Tenant Packs / Relationship Graph Substrate', 'legacyMigrationName', 'Reusable source packet shape and relationship input; not a direct database contract.'],
  ['Active access-shaped layer', 'Active Tenant Access Layer', 'targetName', 'Runtime access contract for active/candidate tenant data.'],
  ['derived/home', 'Derived Intelligence Projection', 'targetName', 'Materialized projection for Home and answerability.'],
  ['business_records', 'Canonical Objects', 'internalCompatibilityName', 'Keep as physical/internal table until wrapped by Canonical Fact Store APIs.'],
  ['record_fields', 'Canonical Object Attributes', 'internalCompatibilityName', 'Field-level canonical attributes.'],
  ['source_files', 'Evidence Sources', 'internalCompatibilityName', 'Evidence Registry source object records.'],
  ['tenant_pack_runs', 'Tenant Load Runs', 'internalCompatibilityName', 'Load run history and provenance.'],
  ['contract_versions', 'Tenant Data Versions', 'targetName', 'Candidate, active, rollback data versions.'],
  ['active_tenant_contract_versions', 'Active Tenant Data Versions', 'internalCompatibilityName', 'Compatibility table for active tenant data version pointer.'],
  ['graph_nodes', 'Enterprise Objects', 'internalCompatibilityName', 'Graph object compatibility name.'],
  ['graph_edges', 'Enterprise Relationships', 'internalCompatibilityName', 'Graph relationship compatibility name.'],
  ['relationship_types', 'Relationship Type Catalog', 'internalCompatibilityName', 'Relationship type dictionary.'],
  ['graph_quality_reports', 'Relationship Quality Reports', 'internalCompatibilityName', 'Relationship quality gates.'],
  ['source-event', 'Sourcing Execution Memory', 'targetName', 'Source workflow and commercial decision memory.'],
  ['moves/program', 'Execution Program Memory', 'targetName', 'Move execution state and decision memory.'],
  ['tower-standardized', 'Outcome Measurement Projection', 'targetName', 'Tower read projection over Outcome Ledger.'],
  ['intelligence/dossier', 'Governed Answer Context', 'targetName', 'Answer/dossier context exposed through module APIs.'],
  ['context-corpus', 'Market & Benchmark Context', 'targetName', 'Tenant-neutral corpus and benchmark context.'],
  ['artifact/export', 'Artifact & Decision Record Layer', 'targetName', 'Exports, generated artifacts, decision records, and lineage.'],
  ['templates', 'Input Packet Templates / Source Mapping Templates', 'targetName', 'Onboarding and mapping helpers, not persistence schema.'],
  ['unknown', 'Unclassified Data Assets', 'quarantine', 'Classify or quarantine before use in active tenant truth.'],
];

const tenantPacketContract = {
  principle: 'A Tenant Packet is an input contract, not a database representation.',
  requiredManifestFields: [
    'tenant identity / cover name',
    'packet contract version',
    'source classification',
    'real/synthetic status',
    'sensitivity classification',
    'source owner',
    'effective/as-of date',
    'intended domains',
    'intended modules',
    'file inventory',
    'source authority',
    'parser/mapping profile',
    'required quality rules',
    'optional extensions',
  ],
  supportedInputs: [
    'canonical AbarVa templates',
    'client-specific CSV/XLSX extracts',
    'JSON',
    'documents',
    'API/system extracts',
    'historical AbarVa packs',
    'Source documents',
    'Moves artifacts',
    'Tower metrics',
  ],
  minimumBundle: [
    ['enterprise profile', 'mandatory'],
    ['organizational/functions map', 'mandatory'],
    ['applications/systems', 'mandatory'],
    ['data assets/integrations', 'mandatory'],
    ['vendors/contracts', 'mandatory for Source/commercial use cases'],
    ['spend/value', 'mandatory for Tower/value claims'],
    ['programs/priorities', 'mandatory for Moves/AI portfolio use cases'],
    ['risks/controls', 'mandatory for governed recommendations'],
    ['metric definitions', 'mandatory for Tower'],
    ['evidence registry', 'mandatory'],
  ],
};

const sourceAdapterFramework = {
  principle: 'Source adapters parse source shapes into the Canonical Ingestion Contract; they never write directly to product tables.',
  adapters: [
    'CSV adapter',
    'Excel adapter',
    'JSON adapter',
    'document extraction adapter',
    'ServiceNow adapter',
    'SAP/Oracle/Workday adapter',
    'legacy AbarVa pack adapter',
    'Source-event adapter',
    'Moves-memory adapter',
    'Tower-metric adapter',
  ],
  requiredAdapterFields: [
    'accepted source shape',
    'parser version',
    'mapping specification',
    'validation rules',
    'source identity handling',
    'error/quarantine handling',
    'evidence lineage',
    'idempotency behavior',
    'test fixtures',
  ],
};

const canonicalIngestionContract = {
  principle:
    'The canonical ingestion contract is a stable intermediate representation between source data and target persistence. It is independent of physical table names, schema names, database-generated IDs, module-local IDs, historical file names, and storage technology.',
  typescriptShape: `interface CanonicalIngestionRecord {
  tenantKey: string;
  deploymentKey?: string;
  packetVersion: string;
  domain: CanonicalDomain;
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  attributes: Record<string, CanonicalValue>;
  relationships: CanonicalRelationship[];
  evidenceReferences: EvidenceReference[];
  sourceAuthority: SourceAuthority;
  effectiveDate?: string;
  observedAt?: string;
  confidence?: number;
  sensitivity: DataClassification;
  dataStatus: "real" | "synthetic" | "curated" | "benchmark";
  qualityStatus: "valid" | "warning" | "quarantined";
  lineage: TransformationLineage[];
}`,
  representedConcepts: [
    'tenant/deployment identity',
    'canonical domain',
    'canonical object type',
    'source object identifier',
    'attributes',
    'typed relationships',
    'evidence references',
    'source authority',
    'confidence',
    'effective date',
    'freshness',
    'sensitivity',
    'real/synthetic status',
    'quality status',
    'transformation lineage',
  ],
};

const mappingRegistry = {
  maps: 'source profile + source field -> canonical domain -> canonical object -> canonical attribute/relationship -> transformation rule -> validation rule',
  capabilities: [
    'reusable AbarVa mappings',
    'tenant-specific mapping overlays',
    'versioned mappings',
    'deprecated mappings',
    'mapping test fixtures',
    'unmapped-field reporting',
    'mapping coverage score',
    'mapping-change impact analysis',
  ],
  rule: 'Tenant-specific mappings extend the canonical mapping model rather than forking the loader.',
};

const schemaContractRegistry = {
  tracks: [
    'tenant packet contract versions',
    'source adapter versions',
    'canonical ingestion contract versions',
    'canonical domain model versions',
    'target persistence model versions',
    'analytics feature versions',
    'module context API versions',
  ],
  compatibilityRules: [
    'Every tenant load records the exact versions used.',
    'Packet version N can be parsed by adapter versions X-Y.',
    'Canonical contract version N can be written by target writer version Z.',
    'Older packets can be upgraded through migration adapters.',
    'Newer database models do not invalidate existing source packets.',
  ],
};

const targetDataLayerWriter = {
  principle:
    'The target writer converts canonical ingestion records into Evidence Registry, Canonical Fact Store, Enterprise Relationship Graph, Derived Intelligence Store, Module Memory, and Outcome Ledger records. Source adapters never own database IDs, foreign keys, upserts, fact versioning, supersession, deduplication, relationship resolution, source linkage, or candidate tenant data version creation.',
  owns: [
    'database IDs',
    'foreign keys',
    'upsert behavior',
    'fact versioning',
    'supersession',
    'deduplication',
    'relationship resolution',
    'source linkage',
    'candidate tenant data version creation',
  ],
};

const loadStates = [
  'packet_received',
  'manifest_validated',
  'sources_parsed',
  'mapping_complete',
  'evidence_registered',
  'canonical_facts_loaded',
  'relationships_resolved',
  'retrieval_indexed',
  'derived_intelligence_built',
  'analytics_computed',
  'home_ready',
  'intelligence_ready',
  'moves_ready',
  'source_ready',
  'tower_ready',
  'candidate_version_created',
  'proof_passed',
  'active_version_promoted',
];

const onboardingWorkflow = [
  'Inspect packet',
  'Validate manifest',
  'Classify real/synthetic/sensitive data',
  'Resolve packet contract version',
  'Select adapters and mapping profiles',
  'Parse source inputs',
  'Generate canonical ingestion objects',
  'Validate canonical objects',
  'Report unmapped and quarantined records',
  'Load Evidence Registry',
  'Load Canonical Fact Store',
  'Resolve graph relationships',
  'Generate candidate tenant data version',
  'Build Derived Intelligence',
  'Calculate first-wave analytics',
  'Calculate module readiness',
  'Run safety and tenant-isolation tests',
  'Generate proof bundle',
  'Require promotion approval',
  'Promote candidate to active version',
  'Verify Home, Intelligence, Moves, Source, and Tower consumption',
];

const idempotencyAndEvolution = {
  stableIdentity: ['tenant key', 'source system', 'source object ID', 'canonical object type', 'effective date/version', 'content fingerprint'],
  refreshBehavior: [
    'detect unchanged inputs',
    'detect changed facts',
    'create new fact versions',
    'mark superseded facts',
    'preserve historical evidence',
    'recompute affected relationships, insights, and analytics where possible',
    'require proof before active-version promotion',
  ],
  evolutionRule:
    'Physical database redesign should primarily change the canonical-to-target writer, migration logic, and views/context APIs. It must not require every tenant template and source parser to be rewritten.',
};

const enterpriseProofHarness = {
  stateSequence: [
    'file present',
    'manifest valid',
    'parsed',
    'mapped',
    'validated',
    'evidence registered',
    'canonical fact loaded',
    'relationship resolved',
    'indexed',
    'retrievable',
    'cited',
    'derived intelligence built',
    'analytics computed',
    'module-ready',
    'browser-visible',
    'module-consumed',
    'write-back created',
    'candidate refreshed',
    'active version promoted',
  ],
  requiredCases: [
    ...proofHarness.requiredCases,
    'Idempotent reload proof',
    'Mapping coverage proof',
    'Unmapped/quarantined record proof',
  ],
  proofBundleContents: [
    'manifest validation report',
    'source inventory',
    'parser/adapter versions',
    'mapping coverage report',
    'unmapped fields',
    'quarantined records',
    'evidence counts',
    'canonical object/fact counts',
    'graph object/relationship counts',
    'unresolved relationship counts',
    'derived insight counts',
    'analytics results',
    'module readiness',
    'tenant isolation test',
    'claim-to-source test',
    'UI/runtime proof',
    'promotion record',
  ],
};

const enterpriseRoadmap = [
  ['Phase 0', 'Inventory baseline and naming freeze', 'Unknown layer count reduced or quarantined; active tenants approved; stranded-intelligence report created; no new primary legacy version naming.'],
  ['Phase 1', 'Architecture contract and glossary', 'Architecture contract merged; product/engineering can explain architecture without legacy version confusion.'],
  ['Phase 2', 'Tenant Packet and canonical ingestion contract', 'New Tenant Packet can be validated without direct table knowledge.'],
  ['Phase 3', 'Target writer and access layer contracts', 'Context API contracts exist; tests prove active/candidate version behavior.'],
  ['Phase 4', 'New-client golden path', 'file -> parser -> canonical object -> fact -> relationship -> derived intelligence -> module context -> answer/artifact proof bundle.'],
  ['Phase 5', 'SkyHarbor upgrade', 'SkyHarbor common-layer proof without deleting historical packs.'],
  ['Phase 6', 'Moves/Source/Tower grounding', 'Source artifact, Move gate, and Tower value update trace to common-layer IDs and evidence.'],
  ['Phase 7', 'Runtime write-back and memory promotion', 'Approved evidence/module event creates candidate refresh and can become active after validation.'],
  ['Phase 8', 'Advanced analytics', 'Each first-wave model has inputs, outputs, confidence, explanation, tests, and module consumption.'],
  ['Phase 9', 'Benchmark moat', 'Benchmark context supports answers without leaking client facts.'],
];

const enterpriseBacklog = [
  ['PR 1', 'Naming convention reset + architecture contract', 'No runtime behavior change; glossary, mapping, and legacy-name rule.'],
  ['PR 2', 'Tenant Packet contract', 'Manifest, source classes, real/synthetic/sensitive status, intended domains/modules, load states.'],
  ['PR 3', 'Canonical Ingestion Contract + Source Adapter Interface', 'Neutral ingestion object and pluggable adapter interface.'],
  ['PR 4', 'Mapping Registry', 'Source-to-canonical mappings, tenant overlays, coverage, unmapped-field reporting.'],
  ['PR 5', 'Target Data-Layer Writer contract', 'Canonical ingestion writes to evidence, facts, graph, derived intelligence, memory, and outcomes.'],
  ['PR 6', 'Module Context API contracts', 'getHomeContext, getIntelligenceContext, getMoveContext, getSourceContext, getTowerContext, validation and promotion APIs.'],
  ['PR 7', 'Outcome Ledger schema/design', 'Value commitment, measured value, realized value, leakage, attestation, owner accountability.'],
  ['PR 8', 'Module Memory schema/design', 'Decisions, assumptions, gate approvals, Source awards, artifacts, accepted insights, promotion status.'],
  ['PR 9', 'Stranded Intelligence Report', 'Find source rows/files not visible through Active Tenant Access Layer.'],
  ['PR 10', 'SkyHarbor compatibility adapter and upgrade snapshot', 'Map historical/standardized/Source/Moves/Tower data into candidate active access layer.'],
  ['PR 11', 'Proof harness', 'Prove file -> parser -> canonical object -> fact -> graph -> derived -> module -> answer/artifact -> write-back -> active promotion.'],
  ['PR 12', 'New-client golden path proof', 'Validate a new Tenant Packet through the decoupled architecture.'],
];

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AbarVa Data & Intelligence Redesign</title>
  <style>
    :root { --ink:#151515; --muted:#66615b; --line:#ded9d2; --paper:#f7f5f1; --panel:#fffefa; --teal:#117b73; --navy:#07152f; --amber:#9a6116; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:var(--paper); line-height:1.5; }
    header { background:#11110f; color:white; padding:34px 48px 30px; border-bottom:4px solid #48d6d0; }
    header p { max-width:1040px; color:#d8d4cc; font-size:18px; margin:10px 0 0; }
    h1 { margin:0; font-family: Georgia, serif; font-size:42px; letter-spacing:0; }
    h2 { margin:0 0 14px; font-family: Georgia, serif; font-size:28px; }
    h3 { margin:18px 0 8px; font-size:16px; text-transform:uppercase; letter-spacing:.08em; color:var(--teal); }
    main { padding:28px 48px 64px; max-width:1500px; margin:0 auto; }
    section { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:24px; margin:18px 0; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .metric { border:1px solid var(--line); border-radius:8px; background:white; padding:16px; }
    .metric b { display:block; font-family:Georgia,serif; font-size:30px; }
    .metric span { color:var(--muted); font-size:13px; }
    table { width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; background:white; }
    th, td { border-bottom:1px solid var(--line); text-align:left; vertical-align:top; padding:9px 10px; }
    th { color:#514d47; text-transform:uppercase; letter-spacing:.07em; font-size:11px; background:#f1eee8; }
    code { background:#f0eee8; border:1px solid #ded8ce; padding:1px 5px; border-radius:5px; }
    .callout { border-left:5px solid var(--teal); background:#effaf8; padding:14px 16px; margin:14px 0; }
    .twocol { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    .pill { display:inline-block; border:1px solid var(--line); border-radius:999px; padding:4px 9px; margin:3px; background:white; font-size:12px; }
    .small { color:var(--muted); font-size:13px; }
    @media (max-width: 900px) { .grid, .twocol { grid-template-columns:1fr; } header, main { padding-left:20px; padding-right:20px; } }
  </style>
</head>
<body>
  <header>
    <h1>AbarVa Data & Intelligence Architecture Redesign</h1>
    <p>Implementation-ready architecture package grounded in the data-flow audit and client data layer operating model. Generated ${escapeHtml(generatedAt)}.</p>
  </header>
  <main>
    <section>
      <h2>Executive Summary</h2>
      <div class="callout"><b>Strategic decision:</b> V7 becomes the active tenant access layer. Historical packs and module-local records become source inputs, migration sources, module memory, or proof artifacts - not competing live truths.</div>
      ${list(currentStateDiagnosis.facts)}
      <div class="grid">
        <div class="metric"><b>${fileLevel.total_files_in_inventory ?? 'n/a'}</b><span>repo-local files inventoried</span></div>
        <div class="metric"><b>${Object.values(tenantRows).reduce((sum, count) => sum + (Number(count) || 0), 0).toLocaleString()}</b><span>file-based rows across inventory</span></div>
        <div class="metric"><b>${dataFlow.databaseTables?.length ?? 377}</b><span>SQL table definitions found</span></div>
        <div class="metric"><b>${dataFlow.v7Dimensions?.length ?? 25}</b><span>V7 dimensions in audit</span></div>
      </div>
    </section>

    <section>
      <h2>Layer Volumetrics</h2>
      ${table(['Layer', 'Files', 'Rows'], currentStateDiagnosis.layerVolumetrics.map((r) => [r.layer, r.files, r.rows]))}
    </section>

    <section>
      <h2>Enterprise Naming Redesign</h2>
      ${table(['Current name', 'Enterprise name', 'Definition', 'Disposition', 'Migration impact'], currentToTargetNameMap)}
    </section>

    <section>
      <h2>Canonical Object Glossary</h2>
      ${table(['Object', 'Definition', 'Layer', 'Example', 'Anti-example'], canonicalGlossary)}
    </section>

    <section>
      <h2>Canonical Data Domains</h2>
      ${table(['Domain', 'Key objects', 'Module consumers', 'Current source layers', 'Quality risk'], canonicalDomains)}
    </section>

    <section>
      <h2>Target Layer Architecture</h2>
      ${table(['Layer', 'Purpose', 'Current mappings'], targetLayers.map(([name, purpose, mappings]) => [name, purpose, mappings.join('; ')]))}
    </section>

    <section>
      <h2>Target Table Families</h2>
      ${table(['Family', 'Candidate tables', 'Priority', 'Consumers'], proposedTableFamilies.map(([family, tables, priority, consumers]) => [family, tables.join(', '), priority, consumers]))}
    </section>

    <section>
      <h2>Module Context APIs</h2>
      ${table(['API', 'Purpose', 'Inputs', 'Target layers/views'], moduleContextApis)}
    </section>

    <section>
      <h2>Write-Back And Memory Promotion</h2>
      <div class="twocol">
        <div>${table(['Module', 'Writes'], Object.entries(writeBackModel.moduleWrites).map(([module, writes]) => [module, writes.join(', ')]))}</div>
        <div><h3>Guardrails</h3>${list(writeBackModel.guardrails)}<h3>Statuses</h3>${writeBackModel.statuses.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</div>
      </div>
    </section>

    <section>
      <h2>Outcome Ledger</h2>
      <p>Tracked objects: ${outcomeLedgerDesign.trackedObjects.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p>
      ${table(['Actor', 'Update rights'], Object.entries(outcomeLedgerDesign.updateRights))}
    </section>

    <section>
      <h2>Source Intelligence Producer Design</h2>
      <p>${escapeHtml(sourceIntelligenceDesign.flow)}</p>
      <p>${sourceIntelligenceDesign.entities.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p>
    </section>

    <section>
      <h2>Moves Write-Back Design</h2>
      <p>${escapeHtml(movesWriteBackDesign.principle)}</p>
      <p>${movesWriteBackDesign.objects.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p>
    </section>

    <section>
      <h2>Advanced Analytics Model Catalog</h2>
      ${table(['Model', 'Purpose', 'Module', 'Inputs', 'Priority'], analyticsModels.map((m) => [m.name, m.businessPurpose, m.module, m.inputDomains, m.implementationPriority]))}
    </section>

    <section>
      <h2>Private Client Plane Architecture</h2>
      <div class="twocol">
        <div><h3>Product Control Plane</h3>${list(privatePlaneArchitecture.productControlPlane)}</div>
        <div><h3>Client Private Plane</h3>${list(privatePlaneArchitecture.clientPrivatePlane)}</div>
      </div>
      <h3>Benchmark Plane</h3>${list(privatePlaneArchitecture.benchmarkPlane)}
      <p class="small">${escapeHtml(privatePlaneArchitecture.rule)}</p>
    </section>

    <section>
      <h2>Proof Harness</h2>
      <p>${proofHarness.stateSequence.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p>
      ${list(proofHarness.requiredCases)}
    </section>

    <section>
      <h2>Migration Roadmap</h2>
      ${table(['Phase', 'Work', 'Acceptance'], migrationRoadmap)}
    </section>

    <section>
      <h2>First Implementation Backlog</h2>
      ${table(['PR', 'Scope', 'Acceptance'], prioritizedBacklog)}
    </section>

    <section>
      <h2>Risks And Decisions</h2>
      <div class="twocol">
        <div><h3>Risks</h3>${list(risks)}</div>
        <div><h3>Decisions Needed</h3>${list(decisionsNeeded)}</div>
      </div>
    </section>

    <section>
      <h2>Evidence Paths</h2>
      ${list(evidenceReferences)}
    </section>
  </main>
</body>
</html>
`;

const markdown = `# AbarVa Data & Intelligence Redesign Summary

Generated: ${generatedAt}

## Top 10 Current-State Findings

${currentStateDiagnosis.facts.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Top 10 Naming Changes

${mdTable(['Current', 'Target', 'Disposition'], currentToTargetNameMap.slice(0, 10).map(([current, target, _definition, disposition]) => [current, target, disposition]))}

## Top 10 Target Architecture Changes

${targetLayers.slice(0, 10).map(([name, purpose], index) => `${index + 1}. ${name}: ${purpose}`).join('\n')}

## First 10 Analytics Models

${firstWaveAnalytics.map(([name, purpose], index) => `${index + 1}. ${name}: ${purpose}`).join('\n')}

## First 8 Implementation PRs

${prioritizedBacklog.map(([pr, scope, acceptance]) => `${pr}. ${scope}: ${acceptance}`).join('\n')}

## Key Risks

${risks.map((risk) => `- ${risk}`).join('\n')}

## Open Decisions

${decisionsNeeded.map((decision) => `- ${decision}`).join('\n')}

## Proof Standard

${proofHarness.stateSequence.join(' -> ')}

## Evidence Paths

${evidenceReferences.map((ref) => `- ${ref}`).join('\n')}
`;

fs.writeFileSync(path.join(reportsDir, 'abarva-data-intelligence-redesign-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(reportsDir, 'abarva-data-intelligence-redesign-latest.html'), html);
fs.writeFileSync(path.join(reportsDir, 'abarva-data-intelligence-redesign-summary.md'), markdown);

console.log('Wrote reports/abarva-data-intelligence-redesign-latest.html');
console.log('Wrote reports/abarva-data-intelligence-redesign-latest.json');
console.log('Wrote reports/abarva-data-intelligence-redesign-summary.md');

const enterpriseCurrentStateDiagnosis = {
  ...currentStateDiagnosis,
  thesis:
    'AbarVa already has rich tenant data. The data-layer problem is fragmentation across historical packs, generated files, Source events, Moves artifacts, Tower data, graph files, proof bundles, and module-local state.',
  facts: [
    `Repo-local files inventoried: ${fileLevel.total_files_in_inventory ?? 'unknown'}.`,
    `File-based rows inventoried: ${Object.values(tenantRows).reduce((sum, count) => sum + (Number(count) || 0), 0).toLocaleString()}.`,
    `SQL table definitions inventoried: ${dataFlow.databaseTables?.length ?? 377}.`,
    'Rich tenant data exists across SkyHarbor, First Capital, Apex, Meridian, Lakeshore, Northstar, and others.',
    'The problem is inconsistent normalization, fragmented historical layers, module-local data, weak universal write-back, and inconsistent consumption.',
    'Home and Intelligence are closest to common-layer grounding.',
    'Moves, Source, and Tower have rich local workflows but are not universally read/write bound to the Active Tenant Access Layer.',
    'The relationship graph substrate should explain relationships, not calculate spend/value/ROI.',
    'Derived Intelligence Projection exists locally but is not a universal runtime substrate.',
    'Offline repo audit cannot prove live DB row counts; keep repo/file/schema evidence separate from live DB/read-model evidence.',
  ],
};

const targetArchitectureSpine = [
  'Client evidence inputs',
  'Tenant Packet',
  'Evidence Registry',
  'Canonical Fact Store',
  'Enterprise Relationship Graph',
  'Derived Intelligence Store',
  'Active Tenant Access Layer',
  'Module Context APIs',
  'Home / Intelligence / Moves / Source / Tower / Export',
  'Module Memory + Outcome Ledger',
  'Validated Write-Back',
  'Candidate Tenant Data Version',
  'Active Tenant Data Version',
];

const enterpriseReport = {
  generatedAt,
  sourceReportPaths: [
    ...sourceReportPaths,
    'reports/abarva-data-intelligence-redesign-latest.html',
    'reports/abarva-data-intelligence-redesign-latest.json',
    'reports/abarva-data-intelligence-redesign-summary.md',
  ],
  currentStateDiagnosis: enterpriseCurrentStateDiagnosis,
  namingConventionReset,
  currentToTargetNameMap: enterpriseNameMap,
  targetArchitectureSpine,
  tenantPacketContract,
  sourceAdapterFramework,
  canonicalIngestionContract,
  mappingRegistry,
  schemaContractRegistry,
  targetDataLayerWriter,
  loadStates,
  onboardingWorkflow,
  idempotencyAndEvolution,
  canonicalGlossary,
  canonicalDomains,
  targetLayers,
  proposedTableFamilies,
  moduleContextApis,
  writeBackModel,
  outcomeLedgerDesign,
  sourceIntelligenceDesign,
  movesWriteBackDesign,
  analyticsModels,
  privatePlaneArchitecture,
  proofHarness: enterpriseProofHarness,
  migrationRoadmap: enterpriseRoadmap,
  prioritizedBacklog: enterpriseBacklog,
  risks,
  decisionsNeeded: [
    ...decisionsNeeded,
    'Approve Tenant Packet as the only new-client input contract language.',
    'Approve canonical ingestion as the stable contract between source adapters and target persistence.',
    'Approve source/data-layer decoupling as non-negotiable for private client scale.',
  ],
  evidenceReferences,
};

const enterpriseHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AbarVa Enterprise Data Architecture</title>
  <style>
    :root { --ink:#151515; --muted:#625d55; --line:#ded8cf; --paper:#f7f5f1; --panel:#fffefa; --teal:#117b73; --navy:#08142c; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:var(--paper); line-height:1.5; }
    header { background:#10100e; color:white; padding:34px 48px 30px; border-bottom:4px solid #45d6cf; }
    header p { max-width:1120px; color:#d8d4cc; font-size:18px; margin:10px 0 0; }
    h1 { margin:0; font-family:Georgia, serif; font-size:42px; letter-spacing:0; }
    h2 { margin:0 0 14px; font-family:Georgia, serif; font-size:28px; }
    h3 { margin:18px 0 8px; font-size:16px; text-transform:uppercase; letter-spacing:.08em; color:var(--teal); }
    main { padding:28px 48px 64px; max-width:1540px; margin:0 auto; }
    section { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:24px; margin:18px 0; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    table { width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; background:white; }
    th, td { border-bottom:1px solid var(--line); text-align:left; vertical-align:top; padding:9px 10px; }
    th { color:#514d47; text-transform:uppercase; letter-spacing:.07em; font-size:11px; background:#f1eee8; }
    .grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
    .twocol { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    .metric { border:1px solid var(--line); border-radius:8px; background:white; padding:16px; }
    .metric b { display:block; font-family:Georgia,serif; font-size:30px; }
    .metric span { color:var(--muted); font-size:13px; }
    .callout { border-left:5px solid var(--teal); background:#effaf8; padding:14px 16px; margin:14px 0; }
    .pill { display:inline-block; border:1px solid var(--line); border-radius:999px; padding:4px 9px; margin:3px; background:white; font-size:12px; }
    pre { white-space:pre-wrap; background:#111; color:#f4f4f0; padding:16px; border-radius:8px; overflow:auto; }
    code { background:#f0eee8; border:1px solid #ded8ce; padding:1px 5px; border-radius:5px; }
    @media (max-width:900px) { .grid, .twocol { grid-template-columns:1fr; } header, main { padding-left:20px; padding-right:20px; } }
  </style>
</head>
<body>
  <header>
    <h1>AbarVa Enterprise Data Layer, Naming, Onboarding, and Intelligence Architecture</h1>
    <p>Generated ${escapeHtml(generatedAt)}. This report makes enterprise naming, Tenant Packet onboarding, canonical ingestion, active tenant access, module write-back, analytics, and proof explicit.</p>
  </header>
  <main>
    <section><h2>Executive Summary</h2><div class="callout"><b>Core thesis:</b> ${escapeHtml(enterpriseCurrentStateDiagnosis.thesis)}</div>${list(enterpriseCurrentStateDiagnosis.facts)}<div class="grid"><div class="metric"><b>${fileLevel.total_files_in_inventory ?? 'n/a'}</b><span>files inventoried</span></div><div class="metric"><b>${Object.values(tenantRows).reduce((sum, count) => sum + (Number(count) || 0), 0).toLocaleString()}</b><span>file-based rows</span></div><div class="metric"><b>${dataFlow.databaseTables?.length ?? 377}</b><span>SQL table definitions</span></div><div class="metric"><b>${analyticsModels.length}</b><span>analytics models cataloged</span></div></div></section>
    <section><h2>Mandatory Naming Convention Reset</h2><p>${escapeHtml(namingConventionReset.primaryExplanation)}</p><h3>Approved Vocabulary</h3><p>${namingConventionReset.approvedVocabulary.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}</p><h3>Rule</h3><p>${escapeHtml(namingConventionReset.rule)}</p><h3>Lint Policy</h3><p>${escapeHtml(namingConventionReset.lintPolicy)}</p></section>
    <section><h2>Current-To-Target Naming Map</h2>${table(['Current / legacy name', 'Enterprise name', 'Use', 'Guidance'], enterpriseNameMap)}</section>
    <section><h2>Target Architecture Spine</h2><p>${targetArchitectureSpine.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}</p></section>
    <section><h2>New-Tenant Onboarding And Source/Data-Layer Decoupling</h2><p>${escapeHtml(tenantPacketContract.principle)}</p><div class="twocol"><div><h3>Workflow</h3>${list(onboardingWorkflow)}</div><div><h3>Load States</h3>${list(loadStates)}</div></div></section>
    <section><h2>Tenant Packet Contract</h2><div class="twocol"><div><h3>Manifest Fields</h3>${list(tenantPacketContract.requiredManifestFields)}</div><div><h3>Supported Inputs</h3>${list(tenantPacketContract.supportedInputs)}</div></div><h3>Minimum Bundle</h3>${table(['Input', 'Classification'], tenantPacketContract.minimumBundle)}</section>
    <section><h2>Canonical Ingestion Contract</h2><p>${escapeHtml(canonicalIngestionContract.principle)}</p><pre>${escapeHtml(canonicalIngestionContract.typescriptShape)}</pre><h3>Represented Concepts</h3>${list(canonicalIngestionContract.representedConcepts)}</section>
    <section><h2>Source Adapter Framework</h2><p>${escapeHtml(sourceAdapterFramework.principle)}</p><div class="twocol"><div><h3>Adapters</h3>${list(sourceAdapterFramework.adapters)}</div><div><h3>Required Adapter Fields</h3>${list(sourceAdapterFramework.requiredAdapterFields)}</div></div></section>
    <section><h2>Mapping And Schema Registries</h2><div class="twocol"><div><h3>Mapping Registry</h3><p>${escapeHtml(mappingRegistry.maps)}</p>${list(mappingRegistry.capabilities)}</div><div><h3>Schema/Contract Registry</h3>${list(schemaContractRegistry.tracks)}<h3>Compatibility Rules</h3>${list(schemaContractRegistry.compatibilityRules)}</div></div></section>
    <section><h2>Target Data-Layer Writer</h2><p>${escapeHtml(targetDataLayerWriter.principle)}</p>${list(targetDataLayerWriter.owns)}</section>
    <section><h2>Canonical Object Glossary</h2>${table(['Object', 'Definition', 'Layer', 'Example', 'Anti-example'], canonicalGlossary)}</section>
    <section><h2>Canonical Data Domains</h2>${table(['Domain', 'Key objects', 'Module consumers', 'Current source layers', 'Quality risk'], canonicalDomains)}</section>
    <section><h2>Target Table And Layer Architecture</h2>${table(['Layer', 'Purpose', 'Current mappings'], targetLayers.map(([name, purpose, mappings]) => [name, purpose, mappings.join('; ')]))}${table(['Family', 'Candidate tables', 'Priority', 'Consumers'], proposedTableFamilies.map(([family, tables, priority, consumers]) => [family, tables.join(', '), priority, consumers]))}</section>
    <section><h2>Module Context API Design</h2>${table(['API', 'Purpose', 'Inputs', 'Target layers/views'], moduleContextApis)}</section>
    <section><h2>Write-Back And Memory Promotion</h2><div class="twocol"><div>${table(['Module', 'Writes'], Object.entries(writeBackModel.moduleWrites).map(([module, writes]) => [module, writes.join(', ')]))}</div><div><h3>Guardrails</h3>${list(writeBackModel.guardrails)}<h3>Statuses</h3>${writeBackModel.statuses.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</div></div></section>
    <section><h2>Outcome Ledger Design</h2><p>${outcomeLedgerDesign.trackedObjects.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p>${table(['Actor', 'Update rights'], Object.entries(outcomeLedgerDesign.updateRights))}</section>
    <section><h2>Source Intelligence Producer Design</h2><p>${escapeHtml(sourceIntelligenceDesign.flow)}</p>${list(sourceIntelligenceDesign.entities)}</section>
    <section><h2>Moves Write-Back Design</h2><p>${escapeHtml(movesWriteBackDesign.principle)}</p>${list(movesWriteBackDesign.objects)}</section>
    <section><h2>Advanced Analytics Catalog</h2>${table(['Model', 'Purpose', 'Module', 'Inputs', 'Priority'], analyticsModels.map((m) => [m.name, m.businessPurpose, m.module, m.inputDomains, m.implementationPriority]))}</section>
    <section><h2>Private Client Plane Architecture</h2><div class="twocol"><div><h3>Product Control Plane</h3>${list(privatePlaneArchitecture.productControlPlane)}</div><div><h3>Client Private Plane</h3>${list(privatePlaneArchitecture.clientPrivatePlane)}</div></div><h3>Benchmark Intelligence Plane</h3>${list(privatePlaneArchitecture.benchmarkPlane)}</section>
    <section><h2>Proof Harness Design</h2><p>${enterpriseProofHarness.stateSequence.map((s) => `<span class="pill">${escapeHtml(s)}</span>`).join('')}</p><div class="twocol"><div><h3>Required Cases</h3>${list(enterpriseProofHarness.requiredCases)}</div><div><h3>Proof Bundle Contents</h3>${list(enterpriseProofHarness.proofBundleContents)}</div></div></section>
    <section><h2>Migration Roadmap</h2>${table(['Phase', 'Work', 'Acceptance'], enterpriseRoadmap)}</section>
    <section><h2>First Implementation Backlog</h2>${table(['PR', 'Scope', 'Acceptance'], enterpriseBacklog)}</section>
    <section><h2>Risks And Open Decisions</h2><div class="twocol"><div><h3>Risks</h3>${list(risks)}</div><div><h3>Decisions Needed</h3>${list(enterpriseReport.decisionsNeeded)}</div></div></section>
    <section><h2>Evidence Paths</h2>${list(evidenceReferences)}</section>
  </main>
</body>
</html>`;

const enterpriseMarkdown = `# AbarVa Enterprise Data Architecture Summary

Generated: ${generatedAt}

## Top 10 Current-State Findings

${enterpriseCurrentStateDiagnosis.facts.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Top 10 Naming Changes

${mdTable(['Current / legacy', 'Enterprise name', 'Use'], enterpriseNameMap.slice(0, 10).map(([current, target, use]) => [current, target, use]))}

## Target Architecture In One Page

${targetArchitectureSpine.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## New Tenant Onboarding Model

Tenant Packet -> manifest -> source adapters/parsers -> Canonical Ingestion Contract -> mapping and normalization -> validation/reconciliation -> target data-layer writer -> candidate tenant data version -> Derived Intelligence -> analytics -> module readiness -> proof -> active version promotion.

Required load states:
${loadStates.map((state) => `- ${state}`).join('\n')}

## First 10 Analytics Models

${firstWaveAnalytics.map(([name, purpose], index) => `${index + 1}. ${name}: ${purpose}`).join('\n')}

## First 8 Implementation PRs

${enterpriseBacklog.slice(0, 8).map(([pr, scope, acceptance]) => `${pr}. ${scope}: ${acceptance}`).join('\n')}

## Key Risks

${risks.map((risk) => `- ${risk}`).join('\n')}

## Open Decisions

${enterpriseReport.decisionsNeeded.map((decision) => `- ${decision}`).join('\n')}
`;

const docs = {
  'enterprise-data-layer.md': `# Enterprise Data Layer\n\nStatus: official architecture baseline.\n\n${namingConventionReset.primaryExplanation}\n\n## Architecture Spine\n\n${targetArchitectureSpine.map((item) => `- ${item}`).join('\n')}\n\n## Target Layers\n\n${mdTable(['Layer', 'Purpose'], targetLayers.map(([name, purpose]) => [name, purpose]))}\n`,
  'naming-conventions.md': `# Enterprise Data Naming Conventions\n\nStatus: official architecture baseline.\n\n${namingConventionReset.rule}\n\n## Approved Vocabulary\n\n${namingConventionReset.approvedVocabulary.map((item) => `- ${item}`).join('\n')}\n\n## Current-To-Target Map\n\n${mdTable(['Current / legacy', 'Enterprise name', 'Use', 'Guidance'], enterpriseNameMap)}\n`,
  'tenant-packet-contract.md': `# Tenant Packet Contract\n\nStatus: official architecture baseline.\n\n${tenantPacketContract.principle}\n\n## Manifest Fields\n\n${tenantPacketContract.requiredManifestFields.map((item) => `- ${item}`).join('\n')}\n\n## Minimum Bundle\n\n${mdTable(['Input', 'Classification'], tenantPacketContract.minimumBundle)}\n\n## Onboarding Workflow\n\n${onboardingWorkflow.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n`,
  'module-context-apis.md': `# Module Context APIs\n\nStatus: official architecture baseline.\n\nModules consume tenant intelligence through governed APIs, not random local tables.\n\n${mdTable(['API', 'Purpose', 'Inputs', 'Target layers/views'], moduleContextApis)}\n`,
  'outcome-ledger.md': `# Outcome Ledger\n\nStatus: official architecture baseline.\n\nTower is the product surface over Outcome Ledger, not a separate silo.\n\n## Tracked Objects\n\n${outcomeLedgerDesign.trackedObjects.map((item) => `- ${item}`).join('\n')}\n\n## Update Rights\n\n${mdTable(['Actor', 'Update rights'], Object.entries(outcomeLedgerDesign.updateRights))}\n`,
  'module-memory.md': `# Module Memory\n\nStatus: official architecture baseline.\n\nModule Memory stores module-created state before promotion. No model output becomes durable fact automatically.\n\n## Write Statuses\n\n${writeBackModel.statuses.map((item) => `- ${item}`).join('\n')}\n\n## Module Writes\n\n${mdTable(['Module', 'Writes'], Object.entries(writeBackModel.moduleWrites).map(([module, writes]) => [module, writes.join(', ')]))}\n`,
  'proof-harness.md': `# Enterprise Data Proof Harness\n\nStatus: official architecture baseline.\n\nDo not allow a test to pass just because a file exists.\n\n## State Sequence\n\n${enterpriseProofHarness.stateSequence.map((item) => `- ${item}`).join('\n')}\n\n## Required Cases\n\n${enterpriseProofHarness.requiredCases.map((item) => `- ${item}`).join('\n')}\n\n## Proof Bundle Contents\n\n${enterpriseProofHarness.proofBundleContents.map((item) => `- ${item}`).join('\n')}\n`,
};

fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-architecture-latest.json'), `${JSON.stringify(enterpriseReport, null, 2)}\n`);
fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-architecture-latest.html'), enterpriseHtml);
fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-architecture-summary.md'), enterpriseMarkdown);

const architectureDir = path.join(repoRoot, 'docs', 'architecture');
fs.mkdirSync(architectureDir, { recursive: true });
for (const [fileName, content] of Object.entries(docs)) {
  fs.writeFileSync(path.join(architectureDir, fileName), content);
}

console.log('Wrote reports/abarva-enterprise-data-architecture-latest.html');
console.log('Wrote reports/abarva-enterprise-data-architecture-latest.json');
console.log('Wrote reports/abarva-enterprise-data-architecture-summary.md');
console.log('Updated docs/architecture enterprise data architecture documents');
