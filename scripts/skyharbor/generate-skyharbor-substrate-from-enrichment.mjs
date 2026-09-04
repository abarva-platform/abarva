#!/usr/bin/env node
/**
 * SkyHarbor Air substrate generator — enrichment bridge.
 *
 * Purpose:
 *   Replaces generate-skyharbor-substrate.mjs (Packet 28, hardcoded synthetic
 *   content) as the canonical source of datasets/skyharbor-air-synthetic-v1/.
 *   Reads the real, governed skyharbor-air enrichment dataset —
 *   datasets/tenant-inputs/active/skyharbor-air/current/ (Universal Tenant
 *   Input Standard v3; 503 applications, 65 vendor contracts, 20 programs)
 *   and datasets/tenant-inputs/skyharbor-air/interviews/ (216 executive
 *   interview Q&As) — and transforms it into the exact file shapes
 *   scripts/seed/load-tenant-substrate.ts expects for TENANT_KEY=skyharbor.
 *
 *   This makes the enriched dataset the single source of truth for what
 *   gets loaded into pg-abarva-context-lab-001 (Home/Intelligence/Moves/
 *   Source/Tower's live substrate), instead of an independent, disconnected
 *   hand-authored generator. Regenerate this on every load, do not commit
 *   the output — datasets/skyharbor-air-synthetic-v1/ is a build artifact.
 *
 * Does NOT touch datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/
 * — that is generic (non-tenant-specific) content produced separately by
 * generate-airline-pattern-overlay.mjs and is additive to this output.
 *
 * Usage:
 *   node scripts/skyharbor/generate-skyharbor-substrate-from-enrichment.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_ROOT = path.join(REPO_ROOT, 'datasets/tenant-inputs/active/skyharbor-air/current');
const INTERVIEWS_ROOT = path.join(REPO_ROOT, 'datasets/tenant-inputs/skyharbor-air/interviews');
const TOWER_ROOT = path.join(REPO_ROOT, 'tower-standardized-v1/skyharbor-air/ai-control-tower');
const OUT_ROOT = path.join(REPO_ROOT, 'datasets/skyharbor-air-synthetic-v1');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(rel, content) {
  const file = path.join(OUT_ROOT, rel);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
}

function readCsv(absPath) {
  if (!fs.existsSync(absPath)) {
    throw new Error(`Required enrichment source missing: ${absPath}`);
  }
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors?.length) {
    const fatal = parsed.errors.filter((e) => e.type !== 'FieldMismatch');
    if (fatal.length) {
      throw new Error(`CSV parse errors in ${absPath}: ${JSON.stringify(fatal.slice(0, 3))}`);
    }
  }
  return parsed.data;
}

function csvEscape(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(',')).join('\n');
  return rows.length ? `${header}\n${body}\n` : `${header}\n`;
}

function yamlScalar(value) {
  if (value == null || value === '') return '""';
  const text = String(value).replaceAll('"', '\\"').replaceAll('\n', ' ');
  return `"${text}"`;
}

console.log('SkyHarbor Air substrate generator (enrichment bridge)');
console.log(`  source: ${SOURCE_ROOT}`);
console.log(`  output: ${OUT_ROOT}`);

// ─── Load enrichment sources ────────────────────────────────────────────────

const profileRows = readCsv(path.join(SOURCE_ROOT, '00_enterprise_profile.csv'));
const appRows = readCsv(path.join(SOURCE_ROOT, '04_applications_systems.csv'));
const vendorRows = readCsv(path.join(SOURCE_ROOT, '07_vendors_contracts.csv'));
const programRows = readCsv(path.join(SOURCE_ROOT, '09_programs_initiatives.csv'));
const interviewRows = readCsv(path.join(INTERVIEWS_ROOT, 'executive_interviews.csv'));
// T01 is Tower's AI-tagged initiative registry — a distinct object set from
// 09_programs_initiatives.csv (SHA-INIT-* AI initiatives vs PROG-* general
// enterprise programs), confirmed disjoint IDs, single 'value' view, zero
// rollup rows (is_rollup_of empty on every row) so safe to merge without
// double-counting. Folding it in surfaces Tower's AI initiative data in the
// same general initiatives view Home/Intelligence/Moves read from.
const towerInitiativeRows = readCsv(path.join(TOWER_ROOT, 'T01_initiative-registry.csv'));
// T08 spend lines join to T01 initiatives on initiative_id — real per-initiative
// budget + vendor/tool data, used below to fill committed_usd/vendors instead of
// leaving those columns as placeholders.
const towerSpendRows = readCsv(path.join(TOWER_ROOT, 'T08_spend-contracts.csv'));
// 12_relationships.csv links programs to the systems they touch ("impacts");
// joined against appRows' system->vendor mapping below to derive real vendor
// names for the 09_programs_initiatives.csv rows, which carry no vendor field
// of their own.
const relationshipRows = readCsv(path.join(SOURCE_ROOT, '12_relationships.csv'));
// Portfolio-band spend/value data — real, but at a spend_category grain that
// does not join cleanly down to individual applications (no shared key), so
// it is added as its own chunk set rather than allocated into per-app costs.
const spendValueRows = readCsv(path.join(SOURCE_ROOT, '08_spend_value.csv'));

console.log(`  loaded: ${profileRows.length} profile, ${appRows.length} apps, ${vendorRows.length} vendors, ${programRows.length} programs, ${towerInitiativeRows.length} Tower AI initiatives, ${towerSpendRows.length} Tower spend lines, ${relationshipRows.length} relationships, ${interviewRows.length} interview Q&As`);

const systemToVendor = new Map(appRows.filter((r) => r.system_name).map((r) => [r.system_name, r.vendor]));

function vendorsForProgram(programName) {
  const systems = relationshipRows
    .filter((r) => r.from_object_type === 'program' && r.from_object_name === programName && r.to_object_type === 'system')
    .map((r) => r.to_object_name);
  const vendors = new Set(systems.map((s) => systemToVendor.get(s)).filter(Boolean));
  return [...vendors].join('; ');
}

const spendByInitiative = new Map();
for (const r of towerSpendRows) {
  if (!r.initiative_id) continue;
  const bucket = spendByInitiative.get(r.initiative_id) ?? { budget: 0, vendors: new Set() };
  bucket.budget += Number(r.budget_fy26_usd || 0);
  if (r.vendor_or_tool && r.vendor_or_tool !== 'internal') bucket.vendors.add(r.vendor_or_tool);
  spendByInitiative.set(r.initiative_id, bucket);
}

const profile = profileRows[0] ?? {};

// ─── 00-profile/enterprise-profile.yaml ─────────────────────────────────────
// Simple key: value lines — matches load-tenant-substrate.ts's readProfileYaml
// (line-based regex parser, not a real YAML parser).

const strategicStory = [profile.mission, profile.vision, profile.strategic_priorities]
  .filter(Boolean)
  .join(' ');

writeFile(
  '00-profile/enterprise-profile.yaml',
  [
    `name: ${yamlScalar(profile.entity_name)}`,
    `display_name: ${yamlScalar(profile.entity_name)}`,
    `industry: ${yamlScalar(profile.industry)}`,
    `revenue_usd: ${yamlScalar(profile.revenue_usd)}`,
    `employees: ${yamlScalar(profile.employee_count)}`,
    `strategic_posture: ${yamlScalar(profile.business_model)}`,
    `strategic_story: ${yamlScalar(strategicStory)}`,
    `countries: ${yamlScalar(profile.operating_regions)}`,
    '',
  ].join('\n'),
);

// ─── 13-context/source-files/*.md ───────────────────────────────────────────
// Not load-bearing (load-tenant-substrate.ts always skips Phase 1 — see its
// own comment on the source_id FK constraint), generated for audit/doc value.

writeFile(
  '13-context/source-files/enterprise-profile.md',
  `# ${profile.entity_name ?? 'SkyHarbor Air'} — Enterprise Profile\n\n${strategicStory}\n\nKnown gaps: ${profile.known_gaps ?? 'none recorded'}\n`,
);
writeFile(
  '13-context/source-files/applications-overview.md',
  `# Application & System Portfolio\n\n${appRows.length} systems catalogued across the enterprise estate, spanning mainframe, private cloud, and public cloud (AWS/Azure) hosting models. See client-data-corpus.jsonl for per-system detail.\n`,
);
writeFile(
  '13-context/source-files/vendor-overview.md',
  `# Vendor & Contract Portfolio\n\n${vendorRows.length} active vendor contracts. See client-data-corpus.jsonl for per-vendor detail.\n`,
);
writeFile(
  '13-context/source-files/programs-overview.md',
  `# Program & Initiative Portfolio\n\n${programRows.length} active programs/initiatives. See client-data-corpus.jsonl for per-program detail.\n`,
);
writeFile(
  '13-context/source-files/executive-interviews.md',
  `# Executive Interview Corpus\n\n${interviewRows.length} executive interview Q&A pairs across CEO/COO/CFO/CIO/CTO/CDAO/CISO and 11 other stakeholder groups. See client-data-corpus.jsonl for per-response detail.\n`,
);

// ─── 13-context/client-data-corpus.jsonl ────────────────────────────────────
// The main chunk corpus — becomes enterprise_context_chunks, what Sentinel/
// aVa retrieval grounds answers in. Segment IDs must be one of the five
// canonical retrieval segments load-tenant-substrate.ts's mapChunkToSegment
// recognizes: enterprise_profile, org_structure, it_financials, it_landscape,
// program_inventory.

const chunks = [];

chunks.push({
  chunk_id: 'SHA-PROFILE-01',
  source_segment_id: 'enterprise_profile',
  source_id: 'enterprise-profile',
  title: profile.entity_name ?? 'SkyHarbor Air',
  text: [
    `${profile.entity_name} is a ${profile.sub_industry ?? profile.industry} headquartered in ${profile.headquarters}.`,
    `Revenue: $${profile.revenue_usd ? (Number(profile.revenue_usd) / 1_000_000_000).toFixed(1) + 'B' : 'not provided'}. Employees: ${profile.employee_count ?? 'not provided'}.`,
    `Operating regions: ${profile.operating_regions ?? 'not provided'}.`,
    `Business model: ${profile.business_model ?? 'not provided'}.`,
    `Customer segments: ${profile.customer_segments ?? 'not provided'}.`,
    `Mission: ${profile.mission ?? 'not provided'}`,
    `Vision: ${profile.vision ?? 'not provided'}`,
    `Strategic priorities: ${profile.strategic_priorities ?? 'not provided'}`,
    `Leadership team: ${profile.leadership_team ?? 'not provided'}`,
    `Current-state notes: ${profile.current_state_notes ?? 'not provided'}`,
    `Target-state notes: ${profile.target_state_notes ?? 'not provided'}`,
  ].join('\n'),
  industry: profile.industry,
  use_case: 'enterprise profile',
  confidence: profile.confidence,
  dataclass: 'enterprise_profile',
  tenant_applicability: 'skyharbor-air',
});

for (let i = 0; i < spendValueRows.length; i++) {
  const r = spendValueRows[i];
  if (!r.spend_category) continue;
  const text = [
    `SPEND PORTFOLIO: ${r.spend_category} — $${r.annual_spend_usd ? Number(r.annual_spend_usd).toLocaleString('en-US') : 'not provided'}/year, owned by ${r.cost_center_or_owner ?? 'not provided'}.`,
    `Run/change/transform split: ${r.run_change_transform_split ?? 'not provided'}. Vendor/internal split: ${r.vendor_internal_split ?? 'not provided'}.`,
    `Value driver: ${r.value_driver ?? 'not provided'}. Savings opportunity: $${r.savings_opportunity_usd ? Number(r.savings_opportunity_usd).toLocaleString('en-US') : 'not provided'}.`,
    `Calculation basis: ${r.calculation_basis ?? 'not provided'}`,
  ].join('\n');
  chunks.push({
    chunk_id: `SHA-SPEND-${String(i + 1).padStart(3, '0')}`,
    source_segment_id: 'it_financials',
    source_id: r.original_row_id || `spend-${i + 1}`,
    title: r.spend_category,
    text,
    industry: profile.industry,
    use_case: 'IT spend and value portfolio',
    confidence: r.confidence,
    dataclass: 'spend_value_portfolio',
    tenant_applicability: 'skyharbor-air',
  });
}

function classifyAppSegment() {
  return 'it_landscape';
}

for (let i = 0; i < appRows.length; i++) {
  const r = appRows[i];
  if (!r.system_name) continue;
  const text = [
    `SYSTEM: ${r.system_name} (${r.system_type ?? 'unspecified type'}, ${r.system_category ?? 'unspecified category'})`,
    `Business function: ${r.business_function ?? 'not provided'}. Scope: ${r.system_scope ?? 'not provided'}.`,
    `Deployment: ${r.deployment_model ?? 'not provided'} hosted at ${r.hosting_location ?? 'not provided'}. Lifecycle: ${r.lifecycle_state ?? 'not provided'}. Criticality: ${r.criticality ?? 'not provided'}.`,
    `Business owner: ${r.business_owner ?? 'not provided'}. Technology owner: ${r.technology_owner ?? 'not provided'}. Vendor: ${r.vendor ?? 'not provided'}.`,
    `Data domains: ${r.data_domains ?? 'not provided'}. Interfaces: ${r.interfaces_count ?? 'not provided'}.`,
    `Current/target state: ${r.current_state_or_target_state ?? 'not provided'}`,
    `Volumetrics: ${r.volumetric_narrative ?? 'not provided'}`,
    `Known challenges: ${r.known_challenges_narrative ?? 'not provided'}`,
    `Known upgrades/plan: ${r.known_upgrades_plan_narrative ?? 'not provided'}`,
    `Data quality notes: ${r.data_quality_notes ?? 'not provided'}`,
    `Maturity assessment: ${r.maturity_assessment_narrative ?? 'not provided'}`,
  ].join('\n');
  chunks.push({
    chunk_id: `SHA-APP-${String(i + 1).padStart(4, '0')}`,
    source_segment_id: classifyAppSegment(),
    source_id: r.original_row_id || `app-${i + 1}`,
    title: r.system_name,
    text,
    industry: profile.industry,
    use_case: 'application and system inventory',
    confidence: r.confidence,
    dataclass: 'application_system',
    tenant_applicability: 'skyharbor-air',
  });
}

for (let i = 0; i < vendorRows.length; i++) {
  const r = vendorRows[i];
  if (!r.vendor_name) continue;
  const text = [
    `VENDOR: ${r.vendor_name} — ${r.contract_name ?? 'unnamed contract'} (${r.service_category ?? 'unspecified category'})`,
    `Business owner: ${r.business_owner ?? 'not provided'}. Contract owner: ${r.contract_owner ?? 'not provided'}.`,
    `Annual spend: $${r.annual_spend_usd ? Number(r.annual_spend_usd).toLocaleString('en-US') : 'not provided'}. Commercial model: ${r.commercial_model ?? 'not provided'}.`,
    `Term: ${r.term_start ?? '?'} to ${r.term_end ?? '?'}. Renewal date: ${r.renewal_date ?? 'not provided'}.`,
    `Supported systems: ${r.supported_systems ?? 'not provided'}. Supported functions: ${r.supported_functions ?? 'not provided'}.`,
    `Risk rating: ${r.risk_rating ?? 'not provided'}.`,
  ].join('\n');
  chunks.push({
    chunk_id: `SHA-VEND-${String(i + 1).padStart(3, '0')}`,
    source_segment_id: 'it_financials',
    source_id: r.original_row_id || `vendor-${i + 1}`,
    title: `${r.vendor_name} — ${r.contract_name ?? ''}`.trim(),
    text,
    industry: profile.industry,
    use_case: 'vendor and contract portfolio',
    confidence: r.confidence,
    dataclass: 'vendor_contract',
    tenant_applicability: 'skyharbor-air',
  });
}

for (let i = 0; i < programRows.length; i++) {
  const r = programRows[i];
  if (!r.program_name) continue;
  const text = [
    `PROGRAM: ${r.program_name} — status ${r.status ?? 'not provided'}, phase ${r.phase ?? 'not provided'}.`,
    `Business sponsor: ${r.business_sponsor ?? 'not provided'}. Technology owner: ${r.technology_owner ?? 'not provided'}.`,
    `Objective: ${r.objective ?? 'not provided'}`,
    `Scope: ${r.scope ?? 'not provided'}`,
    `Target outcomes: ${r.target_outcomes ?? 'not provided'}`,
    `Dependencies: ${r.dependencies ?? 'not provided'}`,
    `Risks: ${r.risks ?? 'not provided'}`,
    `Budget: $${r.budget_usd ? Number(r.budget_usd).toLocaleString('en-US') : 'not provided'}. Expected value: $${r.expected_value_usd ? Number(r.expected_value_usd).toLocaleString('en-US') : 'not provided'}.`,
  ].join('\n');
  chunks.push({
    chunk_id: `SHA-PROG-${String(i + 1).padStart(3, '0')}`,
    source_segment_id: 'program_inventory',
    source_id: r.original_row_id || `program-${i + 1}`,
    title: r.program_name,
    text,
    industry: profile.industry,
    use_case: 'program and initiative portfolio',
    confidence: r.confidence,
    dataclass: 'program_initiative',
    tenant_applicability: 'skyharbor-air',
  });
}

for (let i = 0; i < towerInitiativeRows.length; i++) {
  const r = towerInitiativeRows[i];
  if (!r.initiative_name) continue;
  const text = [
    `AI INITIATIVE: ${r.initiative_name} — business area ${r.business_area ?? 'not provided'}, portfolio segment ${r.portfolio_segment ?? 'not provided'}.`,
    `AI classification: ${r.ai_classification ?? 'not provided'} (${r.ai_investment_share_pct ?? '?'}% AI investment share, basis: ${r.ai_tag_basis ?? 'not provided'}).`,
    `Owner: ${r.owner_role ?? 'not provided'}. Business sponsor: ${r.business_sponsor_role ?? 'not provided'}.`,
    `Stage: ${r.stage ?? 'not provided'}. Status: ${r.status ?? 'not provided'}. Scale decision: ${r.scale_decision ?? 'not provided'}.`,
    `Promised benefit: $${r.promised_benefit_usd ? Number(r.promised_benefit_usd).toLocaleString('en-US') : 'not provided'}. Measured value: $${r.measured_value_usd ? Number(r.measured_value_usd).toLocaleString('en-US') : 'not provided'} (confidence: ${r.value_confidence ?? 'not provided'}).`,
    `Evidence status: ${r.evidence_status ?? 'not provided'}. Primary blocker: ${r.primary_blocker ?? 'none recorded'}.`,
    r.notes ? `Notes: ${r.notes}` : null,
  ].filter(Boolean).join('\n');
  chunks.push({
    chunk_id: `${r.initiative_id || `SHA-TOWER-INIT-${String(i + 1).padStart(3, '0')}`}-tower`,
    source_segment_id: 'program_inventory',
    source_id: r.initiative_id || `tower-initiative-${i + 1}`,
    title: r.initiative_name,
    text,
    industry: profile.industry,
    use_case: 'AI control tower initiative registry',
    confidence: r.value_confidence,
    dataclass: 'ai_initiative',
    tenant_applicability: 'skyharbor-air',
  });
}

const EXEC_AREA_SEGMENT = {
  'CFO': 'it_financials',
  'CIO': 'it_landscape',
  'CTO': 'it_landscape',
  'CIO/CTO': 'it_landscape',
  'CDAO': 'it_landscape',
  'CISO': 'it_landscape',
};

function classifyInterviewSegment(r) {
  const role = String(r.stakeholder_role ?? '').toUpperCase();
  for (const [key, segment] of Object.entries(EXEC_AREA_SEGMENT)) {
    if (role.includes(key)) return segment;
  }
  const area = String(r.executive_area ?? '').toLowerCase();
  if (/financ|spend|budget|cost/.test(area)) return 'it_financials';
  if (/technology|infrastructure|data|platform|architecture/.test(area)) return 'it_landscape';
  if (/strategy|governance|risk|compliance|legal/.test(area)) return 'program_inventory';
  return 'org_structure';
}

for (let i = 0; i < interviewRows.length; i++) {
  const r = interviewRows[i];
  if (!r.question || !r.synthetic_answer) continue;
  const text = [
    `INTERVIEW: ${r.stakeholder_role} (${r.executive_area})`,
    `Q: ${r.question}`,
    `A: ${r.synthetic_answer}`,
    r.pain_point ? `Pain point: ${r.pain_point}` : null,
    r.known_challenge ? `Known challenge: ${r.known_challenge}` : null,
    r.key_initiative ? `Key initiative: ${r.key_initiative}` : null,
    r.system_or_vendor_mentioned ? `Systems/vendors mentioned: ${r.system_or_vendor_mentioned}` : null,
    r.risk_or_control_mentioned ? `Risk/control mentioned: ${r.risk_or_control_mentioned}` : null,
  ].filter(Boolean).join('\n');
  chunks.push({
    chunk_id: r.interview_id || `SHA-INT-${String(i + 1).padStart(3, '0')}`,
    source_segment_id: classifyInterviewSegment(r),
    source_id: r.interview_id || `interview-${i + 1}`,
    title: `${r.stakeholder_role} — ${r.question_id ?? ''}`.trim(),
    text,
    industry: profile.industry,
    use_case: 'executive interview',
    confidence: r.confidence,
    dataclass: 'executive_interview',
    tenant_applicability: 'skyharbor-air',
  });
}

writeFile(
  '13-context/client-data-corpus.jsonl',
  chunks.map((c) => JSON.stringify(c)).join('\n') + '\n',
);

// ─── 07-application-portfolio/application-portfolio.csv ────────────────────
// Columns load-tenant-substrate.ts's phase3Applications reads:
//   app_id, name, ams_vendor, stack_era, business_unit_id,
//   annual_run_cost_usd|run_cost_fy25_usd, criticality, time_classification

function mapStackEra(deploymentModel) {
  const norm = String(deploymentModel ?? '').toLowerCase();
  if (norm === 'saas') return 'saas';
  if (['aws', 'azure', 'private_cloud'].includes(norm)) return 'cloud';
  if (norm === 'hybrid') return 'hybrid';
  return 'on_prem'; // on_premise, mainframe, anything else
}

const appPortfolioRows = appRows
  .filter((r) => r.system_name)
  .map((r, i) => ({
    app_id: r.original_row_id || `SHA-APP-${String(i + 1).padStart(4, '0')}`,
    name: r.system_name,
    ams_vendor: r.vendor || 'Unknown',
    stack_era: mapStackEra(r.deployment_model),
    business_unit_id: r.business_function || '',
    annual_run_cost_usd: '',
    criticality: r.criticality || 'tier3',
    time_classification: r.lifecycle_state === 'target_state' ? 'planned' : 'current',
  }));

writeFile(
  '07-application-portfolio/application-portfolio.csv',
  toCsv(appPortfolioRows, ['app_id', 'name', 'ams_vendor', 'stack_era', 'business_unit_id', 'annual_run_cost_usd', 'criticality', 'time_classification']),
);

// ─── 10-initiatives/{initiatives-active,initiatives-closed}.csv ────────────
// Columns load-tenant-substrate.ts's phase4Initiatives reads:
//   initiative_id, title, sentinel_posture, committed_usd, projected_value_usd,
//   evidence_note, status, stage, accountable|sponsor_role, vendors

function mapSentinelPosture(status) {
  const norm = String(status ?? '').toLowerCase();
  if (norm === 'at_risk') return 'Watch';
  if (norm === 'on_track') return 'Scale';
  return 'Healthy'; // planned
}

function mapTowerSentinelPosture(scaleDecision) {
  const norm = String(scaleDecision ?? '').toLowerCase();
  if (norm === 'kill_or_reframe') return 'Kill';
  if (norm === 'hold_until_evidence') return 'Hold';
  if (norm === 'fix_controls') return 'Watch';
  return 'Scale'; // scale
}

const programInitiativeRows = programRows
  .filter((r) => r.program_name)
  .map((r, i) => ({
    initiative_id: r.original_row_id || `SHA-INIT-${String(i + 1).padStart(3, '0')}`,
    title: r.program_name,
    sentinel_posture: mapSentinelPosture(r.status),
    committed_usd: r.budget_usd || '0',
    projected_value_usd: r.expected_value_usd || '0',
    evidence_note: r.objective || '',
    status: r.status || '',
    stage: r.phase || '',
    accountable: r.business_sponsor || '',
    vendors: vendorsForProgram(r.program_name),
  }));

// T01's AI initiatives don't carry a distinct "committed cost" figure
// (promised_benefit_usd/measured_value_usd are both value-side, matching
// what T-family reports elsewhere in this repo already established: T08 is
// the AI-tagged program-spend source, not T01) — projected_value_usd uses
// measured_value_usd where evidenced, falling back to the promised target.
const towerInitiativeAsProgramRows = towerInitiativeRows
  .filter((r) => r.initiative_name)
  .map((r) => {
    const spend = spendByInitiative.get(r.initiative_id);
    return {
      initiative_id: r.initiative_id,
      title: r.initiative_name,
      sentinel_posture: mapTowerSentinelPosture(r.scale_decision),
      committed_usd: spend ? String(Math.round(spend.budget)) : '0',
      projected_value_usd: r.measured_value_usd || r.promised_benefit_usd || '0',
      evidence_note: r.notes || `${r.ai_classification ?? 'AI'} initiative; evidence status ${r.evidence_status ?? 'not provided'}.`,
      status: r.status || '',
      stage: r.stage || '',
      accountable: r.owner_role || r.business_sponsor_role || '',
      vendors: spend ? [...spend.vendors].join('; ') : '',
    };
  });

const initiativeRows = [...programInitiativeRows, ...towerInitiativeAsProgramRows];
const initiativeColumns = ['initiative_id', 'title', 'sentinel_posture', 'committed_usd', 'projected_value_usd', 'evidence_note', 'status', 'stage', 'accountable', 'vendors'];
// None of skyharbor-air's 09_programs_initiatives.csv or T01 rows carry a
// "closed" status today — all rows are active. initiatives-closed.csv is
// written header-only so the loader's file-existence check still passes.
writeFile('10-initiatives/initiatives-active.csv', toCsv(initiativeRows, initiativeColumns));
writeFile('10-initiatives/initiatives-closed.csv', toCsv([], initiativeColumns));

// ─── 09-vendors-contracts/vendor-contracts.csv ──────────────────────────────
// Columns load-tenant-substrate.ts's phase5VendorContracts reads:
//   vendor|vendor_name, vendor_id, annual_usd|annual_value_usd, type|category,
//   notes, renewal_date, ai_usage_clauses|ai_clauses, exit_terms, data_rights

const vendorContractRows = vendorRows
  .filter((r) => r.vendor_name)
  .map((r, i) => ({
    vendor_name: r.vendor_name,
    vendor_id: r.original_row_id || `SHA-VEND-${String(i + 1).padStart(3, '0')}`,
    annual_usd: r.annual_spend_usd || '0',
    category: r.service_category || 'vendor',
    notes: [r.supported_systems, r.supported_functions].filter(Boolean).join(' | '),
    renewal_date: r.renewal_date || '',
    ai_usage_clauses: '',
    exit_terms: '',
    data_rights: '',
  }));

writeFile(
  '09-vendors-contracts/vendor-contracts.csv',
  toCsv(vendorContractRows, ['vendor_name', 'vendor_id', 'annual_usd', 'category', 'notes', 'renewal_date', 'ai_usage_clauses', 'exit_terms', 'data_rights']),
);

console.log('');
console.log('Summary');
console.log(`  chunks:       ${chunks.length} (1 profile + ${spendValueRows.length} spend portfolios + ${appRows.length} apps + ${vendorRows.length} vendors + ${programRows.length} programs + ${towerInitiativeRows.length} Tower AI initiatives + ${interviewRows.length} interviews)`);
console.log(`  applications: ${appPortfolioRows.length}`);
console.log(`  initiatives:  ${initiativeRows.length} (${programInitiativeRows.length} enterprise programs + ${towerInitiativeAsProgramRows.length} Tower AI initiatives; all active — none closed in source)`);
console.log(`  vendors:      ${vendorContractRows.length}`);
console.log('Done.');
