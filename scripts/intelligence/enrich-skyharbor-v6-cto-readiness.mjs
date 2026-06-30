#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const datasetRoot = path.join(repoRoot, 'datasets', 'skyharbor-air-synthetic-v6');
const templatesRoot = path.join(datasetRoot, 'templates');
const today = '2026-06-30';
const now = '2026-06-30T00:00:00Z';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((header) => escapeCsv(row[header] ?? '')).join(','));
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
}

function readFileRows(fileName) {
  const file = path.join(templatesRoot, fileName);
  const parsed = parseCsv(fs.readFileSync(file, 'utf8'));
  const headers = parsed[0];
  const rows = parsed.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
  return { file, headers, rows };
}

function upsertRows(fileName, records) {
  const { file, headers, rows } = readFileRows(fileName);
  const byId = new Map(rows.map((row, index) => [`${row.record_id}::${row.record_name}::${index}`, row]));
  const existingByRecordId = new Map();
  rows.forEach((row, index) => {
    if (!existingByRecordId.has(row.record_id)) existingByRecordId.set(row.record_id, index);
  });
  const output = [...rows];
  for (const record of records) {
    const complete = {};
    for (const header of headers) complete[header] = record[header] ?? defaultValue(header, fileName, record);
    if (existingByRecordId.has(complete.record_id) && String(complete.record_id).startsWith('expert-lens-')) {
      output[existingByRecordId.get(complete.record_id)] = complete;
    } else if (!Array.from(byId.values()).some((row) => row.record_id === complete.record_id && row.record_name === complete.record_name)) {
      output.push(complete);
    }
  }
  writeCsv(file, headers, output);
  return { fileName, before: rows.length, after: output.length, added: output.length - rows.length };
}

function defaultValue(header, fileName, record) {
  const family = familyByFile(fileName);
  const defaults = {
    tenant_key: 'skyharbor-air',
    client_display_name: 'SkyHarbor Air Group',
    v6_contract_version: 'v6.0',
    business_object_family: family,
    source_system: 'skyharbor_v6_cto_readiness_enrichment',
    source_owner: 'AbarVa synthetic demo data steward',
    source_basis: 'synthetic_demo_cto_readiness_enrichment',
    source_file: `datasets/skyharbor-air-synthetic-v6/templates/${fileName}`,
    source_row_number: 'cto-enrichment',
    as_of_date: today,
    period_start: '2026-01-01',
    period_end: '2026-06-30',
    refresh_frequency: 'demo_static_snapshot',
    confidence: 'medium',
    synthetic_demo_flag: 'synthetic_demo',
    data_sensitivity: 'confidential',
    required_for_surfaces: 'Intelligence|Home|Tower',
    allowed_answer_types: 'planning_grade|readiness_assessment|evidence_gap|branching_question',
    not_allowed_claims: 'board_grade_roi_without_finance_signoff|autonomous_scale_without_control_signoff|client_fact_without_evidence',
    known_gaps: 'client_signoff_required_before_board_use',
    created_at: now,
    updated_at: now,
  };
  return defaults[header] ?? record[header] ?? 'not_applicable';
}

function familyByFile(fileName) {
  if (fileName.includes('05_applications')) return 'application_system';
  if (fileName.includes('06_data')) return 'data_asset_integration';
  if (fileName.includes('08_spend')) return 'spend_value';
  if (fileName.includes('09_programs')) return 'program_initiative';
  if (fileName.includes('10_ai')) return 'ai_initiative';
  if (fileName.includes('11_operations')) return 'operations_risk_control';
  if (fileName.includes('12_relationships')) return 'relationship';
  if (fileName.includes('13_evidence')) return 'evidence_source';
  if (fileName.includes('16_expert')) return 'expert_lens';
  return 'unknown';
}

const evidenceIds = [
  ['SHA-EVID-CTO-001', 'OCC disruption recovery steering excerpt', 'steering_pack', 'OCC modernization pack / section 2.1', 'EVP Operations', 'Supports IROPS process ownership, recovery bottlenecks, and readiness gate.'],
  ['SHA-EVID-CTO-002', 'IROPS data readiness register', 'data_governance_register', 'Data governance register / IROPS domain', 'VP Data Platforms', 'Supports data owner, freshness, lineage, and certification gaps.'],
  ['SHA-EVID-CTO-003', 'Crew legality control evidence', 'control_register', 'Crew Ops control register / legality controls', 'VP Crew Operations', 'Supports crew legality feed readiness and human-in-loop controls.'],
  ['SHA-EVID-CTO-004', 'Passenger recovery product brief', 'product_brief', 'Digital recovery brief / passenger reaccommodation', 'VP Digital Products', 'Supports passenger recovery agent scope, PII sensitivity, and customer communication controls.'],
  ['SHA-EVID-CTO-005', 'Operational event streaming architecture', 'architecture_diagram', 'Architecture repository / event streaming target state', 'Chief Architect', 'Supports event store, integration, and platform dependency claims.'],
  ['SHA-EVID-CTO-006', 'AI model governance intake', 'model_risk_register', 'AI governance register / IROPS models', 'AI Governance Lead', 'Supports model-risk tier, HITL, and scale/hold/stop posture.'],
  ['SHA-EVID-CTO-007', 'Disruption cost planning baseline', 'planning_assumption', 'Finance planning model / disruption-cost placeholder', 'CFO delegate', 'Supports directional value only; Finance signoff required before board use.'],
  ['SHA-EVID-CTO-008', 'PSS/mainframe integration risk note', 'architecture_risk_note', 'Enterprise architecture review / PSS integration', 'VP Enterprise Platforms', 'Supports PSS/mainframe dependency and API modernization risk.'],
  ['SHA-EVID-CTO-009', 'Airport turn operations data note', 'operations_data_note', 'Airport ops data pack / turn events', 'VP Airport Operations', 'Supports airport turn event readiness and recovery dependency.'],
  ['SHA-EVID-CTO-010', 'Maintenance delay feed readiness note', 'operations_data_note', 'TechOps data pack / maintenance delay events', 'VP TechOps', 'Supports maintenance delay feed readiness and AI dependency.'],
  ['SHA-EVID-CTO-011', 'Customer communication compliance note', 'compliance_note', 'Legal/compliance review / disruption notifications', 'Chief Compliance Officer', 'Supports customer communication compliance control.'],
  ['SHA-EVID-CTO-012', 'CTO 90-day readiness plan draft', 'planning_artifact', 'CTO operating review / 90-day plan', 'CTO Office', 'Supports CTO action sequencing; planning-grade until owner signoff.'],
];

const systems = [
  ['SHA-SYS-CTO-001', 'Operations Control Center Platform', 'Operations Control Center / IROPS', 'VP OCC Technology', 'critical', 'production', 'NAVBLUE', '8200000', 'flight status feed|weather event feed|crew legality feed|aircraft tail assignment', 'flight status|crew legality|tail assignment|weather|gate events', 'Core command surface for day-of-ops disruption triage and network recovery.'],
  ['SHA-SYS-CTO-002', 'Disruption Management Application', 'Operations Control Center / IROPS', 'VP OCC Technology', 'critical', 'modernizing', 'Lufthansa Systems', '6400000', 'OCC platform|PSS|crew recovery optimizer|customer notification platform', 'PNR events|recovery decisions|customer notifications', 'Coordinates recovery options across aircraft, crew, passenger, and station constraints.'],
  ['SHA-SYS-CTO-003', 'Crew Legality System', 'Crew Operations', 'VP Crew Systems', 'critical', 'production', 'Jeppesen', '5200000', 'crew availability feed|crew pairing roster|crew hotel transport', 'crew legality|crew availability|duty rules', 'Validates legal crew assignments and hard-stops autonomous recovery recommendations.'],
  ['SHA-SYS-CTO-004', 'Crew Recovery Optimizer', 'Crew Operations', 'VP Crew Systems', 'critical', 'pilot', 'CAE', '3900000', 'crew legality system|OCC platform|reserve crew roster', 'crew availability|reserve assignment|duty constraints', 'Optimizes crew recovery scenarios but requires certified legality and availability freshness.'],
  ['SHA-SYS-CTO-005', 'Passenger Service System Mainframe Gateway', 'Passenger Service / Reservations', 'VP Enterprise Platforms', 'critical', 'legacy_wrapped', 'Amadeus', '11500000', 'PNR event|ticket coupon status|customer profile|reaccommodation rules', 'PNR|ticketing|reservation events', 'Mainframe-adjacent gateway for passenger recovery and reaccommodation eligibility.'],
  ['SHA-SYS-CTO-006', 'Passenger Reaccommodation Platform', 'Customer Experience', 'VP Digital Products', 'critical', 'modernizing', 'PROS', '4800000', 'PSS gateway|seat inventory|customer notification event|loyalty profile', 'PNR|inventory|loyalty|notification consent', 'Builds passenger recovery offers during disruption events.'],
  ['SHA-SYS-CTO-007', 'Operational Event Store', 'Data & AI', 'VP Data Platforms', 'critical', 'pilot', 'Confluent', '7100000', 'flight status|baggage scan|gate turn|maintenance delay|weather event', 'event streams|lineage|freshness|audit trail', 'Target event backbone for IROPS AI features and audit-grade recovery history.'],
  ['SHA-SYS-CTO-008', 'Airport Turn Management System', 'Airport Operations', 'VP Airport Operations Technology', 'high', 'production', 'AeroCloud', '3600000', 'gate event|ramp event|baggage scan event|deicing event', 'gate events|turn milestones|ramp status', 'Provides turn-risk signals that affect recovery sequencing.'],
  ['SHA-SYS-CTO-009', 'Maintenance Operations Feed Hub', 'TechOps', 'VP TechOps Systems', 'high', 'production', 'AMOS', '4300000', 'maintenance delay feed|MEL/CDL status|aircraft tail assignment', 'maintenance status|aircraft availability|delay reason', 'Feeds aircraft availability constraints into recovery decisions.'],
  ['SHA-SYS-CTO-010', 'Customer Notification Platform', 'Customer Experience', 'VP Digital Products', 'high', 'production', 'Salesforce Marketing Cloud', '2900000', 'passenger reaccommodation platform|consent store|customer profile', 'notification consent|channel preference|recovery offer', 'Sends customer disruption updates and requires compliance guardrails.'],
  ['SHA-SYS-CTO-011', 'Flight Planning Dispatch Platform', 'Flight Operations', 'VP Flight Operations Technology', 'critical', 'production', 'Sabre', '6100000', 'weather event feed|aircraft tail assignment|OCC platform', 'flight plan|weather|aircraft availability', 'Dispatch planning source for recovery feasibility during disruption events.'],
  ['SHA-SYS-CTO-012', 'Baggage Event Platform', 'Airport Operations', 'VP Airport Operations Technology', 'medium', 'production', 'SITA', '2500000', 'baggage scan event|airport turn event|customer notification platform', 'bag scan|misconnect risk|station events', 'Provides baggage exception signals for passenger recovery prioritization.'],
].map(([record_id, record_name, business_capability, system_owner, criticality, lifecycle_status, vendor_id, annual_cost_usd, integrations, data_dependencies, ai_relevance]) => ({
  record_id,
  record_name,
  system_id: record_id,
  system_name: record_name,
  business_capability,
  system_owner,
  criticality,
  lifecycle_status,
  vendor_id,
  annual_cost_usd,
  integrations,
  data_dependencies,
  ai_relevance,
  confidence: 'high',
  known_gaps: 'client_signoff_required_before_board_use',
}));

const dataAssets = [
  ['SHA-DATA-CTO-001', 'Flight Status Feed', 'VP OCC Technology', 'Operations Control Center Platform', 'OCC Platform', 'Operational Event Store|IROPS Decision Assistant', '5 minutes', 'observed 7-12 minutes during disruption peaks', 'partial_lineage', '82', 'needs_certification', 'critical input to autonomous recovery sequencing'],
  ['SHA-DATA-CTO-002', 'Aircraft Tail Assignment', 'VP Flight Operations Technology', 'Flight Planning Dispatch Platform', 'Dispatch Platform', 'OCC Platform|Crew Recovery Optimizer|Maintenance Feed Hub', '10 minutes', 'observed 15 minutes after aircraft swaps', 'documented_lineage', '86', 'steward_named', 'must be certified before aircraft recovery recommendations'],
  ['SHA-DATA-CTO-003', 'Crew Legality Feed', 'VP Crew Operations', 'Crew Legality System', 'Crew Legality System', 'Crew Recovery Optimizer|IROPS Decision Assistant', 'near real time', 'observed batch exceptions after reserve swaps', 'partial_lineage', '78', 'control_review_required', 'hard gate for autonomous crew recovery'],
  ['SHA-DATA-CTO-004', 'Crew Availability Feed', 'VP Crew Operations', 'Crew Legality System', 'Crew Legality System', 'Crew Recovery Optimizer', '15 minutes', 'observed 20-30 minutes during hub disruptions', 'partial_lineage', '74', 'needs_certification', 'limits confidence in reserve assignment automation'],
  ['SHA-DATA-CTO-005', 'Passenger Itinerary Data', 'VP Enterprise Platforms', 'Passenger Service System Mainframe Gateway', 'PSS Gateway', 'Passenger Reaccommodation Platform|Customer Notification Platform', '15 minutes', 'mainframe event lag not certified', 'legacy_lineage', '76', 'steward_named', 'required for reaccommodation and misconnect prioritization'],
  ['SHA-DATA-CTO-006', 'PNR Reservation Event', 'VP Enterprise Platforms', 'Passenger Service System Mainframe Gateway', 'PSS Gateway', 'Operational Event Store|Passenger Reaccommodation Platform', 'near real time', 'not certified under disruption load', 'legacy_lineage', '72', 'needs_certification', 'must be governed before AI-driven passenger offers'],
  ['SHA-DATA-CTO-007', 'Baggage Scan Event', 'VP Airport Operations Technology', 'Baggage Event Platform', 'Baggage Event Platform', 'Passenger Reaccommodation Platform|Customer Notification Platform', '10 minutes', 'station variance observed', 'documented_lineage', '80', 'steward_named', 'supports bag-risk-aware passenger recovery'],
  ['SHA-DATA-CTO-008', 'Airport Gate Turn Event', 'VP Airport Operations Technology', 'Airport Turn Management System', 'Airport Turn Management System', 'OCC Platform|Airport Turn Risk Predictor', '5 minutes', 'manual station updates create variance', 'partial_lineage', '73', 'needs_certification', 'drives turn-risk prediction and recovery sequencing'],
  ['SHA-DATA-CTO-009', 'Maintenance Delay Feed', 'VP TechOps Systems', 'Maintenance Operations Feed Hub', 'Maintenance Feed Hub', 'OCC Platform|Maintenance Delay Prediction', '15 minutes', 'MEL/CDL status updates not fully evented', 'partial_lineage', '77', 'control_review_required', 'needed to separate maintenance root cause from crew/airport causes'],
  ['SHA-DATA-CTO-010', 'Weather Event Feed', 'VP Flight Operations Technology', 'Flight Planning Dispatch Platform', 'Weather Provider', 'OCC Platform|Flight Delay Root-Cause Assistant', '5 minutes', 'external feed SLA available', 'documented_lineage', '91', 'certified', 'supports disruption prediction and weather playbooks'],
  ['SHA-DATA-CTO-011', 'Ground Operations Event', 'VP Airport Operations Technology', 'Airport Turn Management System', 'Airport Turn Management System', 'OCC Platform|Airport Turn Risk Predictor', '10 minutes', 'not all hubs automated', 'partial_lineage', '69', 'needs_stewardship', 'limits station-level recovery confidence'],
  ['SHA-DATA-CTO-012', 'Customer Notification Event', 'VP Digital Products', 'Customer Notification Platform', 'Customer Notification Platform', 'Passenger Reaccommodation Agent|Compliance Review', 'near real time', 'consent-status dependency not certified', 'documented_lineage', '84', 'privacy_review_required', 'must respect consent and communication compliance'],
  ['SHA-DATA-CTO-013', 'Irregular Operations Event Store', 'VP Data Platforms', 'Operational Event Store', 'Operational Event Store', 'IROPS Decision Assistant|Recovery Decision History', 'near real time', 'pilot coverage only', 'partial_lineage', '70', 'pilot_not_enterprise_certified', 'central readiness gate for agentic IROPS'],
  ['SHA-DATA-CTO-014', 'Recovery Decision History', 'VP OCC Technology', 'Disruption Management Application', 'Operational Event Store', 'AI Governance|IROPS Decision Assistant', 'daily', 'audit trail incomplete for manual overrides', 'partial_lineage', '67', 'audit_gap', 'needed to validate model recommendations against human decisions'],
  ['SHA-DATA-CTO-015', 'Disruption Cost Baseline', 'Finance Transformation Lead', 'Finance Planning Model', 'Finance Planning Model', 'IROPS Business Case|CTO Funding Decision', 'monthly', 'planning assumption; not finance approved', 'planning_model', '60', 'finance_signoff_required', 'enables directional value sizing only'],
  ['SHA-DATA-CTO-016', 'Reaccommodation Rules Catalog', 'VP Digital Products', 'Passenger Reaccommodation Platform', 'Rules Engine', 'Passenger Reaccommodation Agent|Compliance Review', 'weekly', 'exception rules need legal review', 'documented_lineage', '79', 'legal_review_required', 'required before customer-facing autonomous offers'],
].map(([record_id, record_name, data_owner, system_of_record, producer, consumers, freshnessSla, actualFreshness, lineage, quality_score, governance_status, implication]) => ({
  record_id,
  record_name,
  data_asset_id: record_id,
  data_asset_name: record_name,
  data_owner,
  system_of_record,
  lineage: `${producer} -> ${consumers}; freshness SLA ${freshnessSla}; actual ${actualFreshness}; lineage ${lineage}`,
  consumers,
  quality_score,
  governance_status,
  data_sensitivity: record_name.includes('Passenger') || record_name.includes('PNR') ? 'restricted' : 'confidential',
  known_gaps: governance_status.includes('certified') ? 'client_signoff_required_before_board_use' : `missing_evidence:${governance_status}|ai_readiness_implication:${implication}`,
  confidence: governance_status === 'certified' ? 'high' : 'medium',
}));

const aiInitiatives = [
  ['SHA-AI-CTO-001', 'IROPS Decision Assistant', 'disruption recovery recommendation', 'Claude-assisted optimizer with rules guardrails', 'OCC recovery advisor', 'IROPS duty managers', '340', '68', 'active pilot usage in two hubs', 'reduce recovery decision latency and missed constraint handoffs', 'planning_value_only', 'pilot', 'control_review_required', 'tier_1_operational_decision_support', 'medium; blocked by crew legality and event-store certification', 'fund readiness gate before autonomous scale', 'hold_autonomous_scale_fund_readiness'],
  ['SHA-AI-CTO-002', 'Crew Recovery Copilot', 'crew legality and reserve assignment triage', 'constraint optimizer', 'Crew recovery copilot', 'crew schedulers', '930', '214', 'pilot users in crew operations', 'reduce manual crew recovery cycle time and legality rework', 'planning_value_only', 'pilot', 'model_risk_review_required', 'tier_1_operational_decision_support', 'medium-low; legality feed not certified under disruption load', 'certify legality and availability feeds', 'hold_until_data_certified'],
  ['SHA-AI-CTO-003', 'Passenger Reaccommodation Agent', 'passenger recovery offer generation', 'rules-grounded agent', 'Passenger recovery agent', 'digital recovery product team', '360', '74', 'limited internal pilot', 'reduce call volume and improve proactive reaccommodation', 'planning_value_only', 'pilot', 'privacy_review_required', 'tier_2_customer_decision_support', 'medium; PNR and consent dependencies require legal/privacy review', 'validate PNR, consent, and DOT communication controls', 'hold_customer_facing_autonomy'],
  ['SHA-AI-CTO-004', 'Baggage Recovery Prediction', 'bag misconnect and exception prediction', 'gradient-boosted risk model', 'Bag recovery predictor', 'airport ops analysts', '220', '51', 'experiment', 'prioritize bags at risk during passenger recovery', 'not_measured', 'experiment', 'approved_for_internal_triage', 'tier_3_operational_analytics', 'medium; baggage event quality varies by station', 'scale internal triage after station coverage review', 'scale_limited_internal'],
  ['SHA-AI-CTO-005', 'Airport Turn Risk Predictor', 'turnaround delay early warning', 'ML risk model', 'Turn risk predictor', 'ramp supervisors', '4200', '380', 'pilot at eight stations', 'detect turn risk before departure cascade', 'planning_value_only', 'pilot', 'approved_for_internal_triage', 'tier_3_operational_analytics', 'medium; ground event automation incomplete', 'fund station event automation for top hubs', 'scale_with_station_gate'],
  ['SHA-AI-CTO-006', 'Flight Delay Root-Cause Assistant', 'delay root-cause synthesis', 'retrieval assistant', 'Delay root-cause assistant', 'dispatch and OCC analysts', '620', '97', 'production internal use', 'speed root-cause classification and post-event learning', 'not_measured', 'production', 'approved', 'tier_3_internal_assistant', 'medium-high; uses weather and delay-code evidence', 'measure analyst adoption and correction rate', 'scale_with_measurement'],
  ['SHA-AI-CTO-007', 'Customer Disruption Communication Agent', 'draft customer disruption messages', 'LLM drafting assistant', 'Disruption comms agent', 'contact center agents', '6200', '540', 'pilot', 'faster consistent disruption communications', 'planning_value_only', 'pilot', 'compliance_review_required', 'tier_2_customer_communication', 'medium; consent and legal wording controls open', 'approve compliance templates and HITL workflow', 'hold_external_send'],
  ['SHA-AI-CTO-008', 'Maintenance Delay Prediction', 'maintenance delay risk forecast', 'predictive model', 'Maintenance delay predictor', 'maintenance controllers', '880', '116', 'experiment', 'surface likely technical delays earlier in recovery planning', 'not_measured', 'experiment', 'model_validation_required', 'tier_2_operational_prediction', 'medium-low; maintenance feed completeness open', 'certify MEL/CDL feed and validate model precision', 'hold_until_validation'],
].map(([record_id, record_name, business_process, tool_or_model, agent_or_copilot_name, user_group, licensed_users, active_users, adoption_metric, value_hypothesis, measured_value_usd, production_status, risk_status, model_risk_tier, data_readiness, decision_needed, scale_hold_stop]) => ({
  record_id,
  record_name,
  ai_initiative_id: record_id,
  use_case: record_name,
  business_process,
  tool_or_model,
  agent_or_copilot_name,
  user_group,
  licensed_users,
  active_users,
  adoption_metric,
  value_hypothesis,
  measured_value_usd,
  production_status,
  risk_status,
  model_risk_tier,
  data_readiness,
  decision_needed,
  scale_hold_stop,
  known_gaps: String(measured_value_usd).includes('planning') || measured_value_usd === 'not_measured' ? 'client_signoff_required_before_board_use|finance_value_evidence_missing' : 'client_signoff_required_before_board_use',
}));

const programs = [
  ['SHA-PROG-CTO-001', 'OCC Modernization', 'EVP Operations', 'CTO', 'COO', 'build', '42000000', '12800000', 'planning_value_only', 'not_finance_approved', 'reduce recovery decision latency and improve command-center resilience', 'in_flight', '2026-09-30', 'event store certification; OCC workflow adoption', 'medium', 'approve readiness gate before scaling autonomy'],
  ['SHA-PROG-CTO-002', 'IROPS Data Foundation', 'VP Data Platforms', 'VP Data Platforms', 'CTO', 'mobilize', '28000000', '7400000', 'planning_value_only', 'not_finance_approved', 'certify IROPS data products and lineage', 'in_flight', '2026-08-31', 'data owner signoff; freshness observability', 'high', 'fund as prerequisite to agentic IROPS scale'],
  ['SHA-PROG-CTO-003', 'Crew Recovery Modernization', 'VP Crew Operations', 'VP Crew Systems', 'EVP Operations', 'pilot', '18000000', '4200000', 'planning_value_only', 'not_finance_approved', 'reduce crew recovery cycle time and legality rework', 'pilot', '2026-10-15', 'crew legality certification', 'high', 'gate expansion on certified legality feed'],
  ['SHA-PROG-CTO-004', 'Passenger Recovery Platform', 'VP Digital Products', 'VP Digital Products', 'Chief Customer Officer', 'design', '22000000', '5300000', 'planning_value_only', 'not_finance_approved', 'reduce disruption call volume and improve proactive reaccommodation', 'in_flight', '2026-11-15', 'PNR gateway and consent controls', 'medium', 'hold customer-facing autonomy until legal controls pass'],
  ['SHA-PROG-CTO-005', 'Operational Event Streaming', 'VP Data Platforms', 'Chief Architect', 'CTO', 'build', '31000000', '9600000', 'planning_value_only', 'not_finance_approved', 'create audit-grade operational event backbone', 'in_flight', '2026-09-15', 'hub event coverage and lineage instrumentation', 'high', 'fund first wave for top hubs and OCC domains'],
  ['SHA-PROG-CTO-006', 'PSS/Mainframe Integration Modernization', 'VP Enterprise Platforms', 'VP Enterprise Platforms', 'CTO', 'mobilize', '36000000', '8800000', 'planning_value_only', 'not_finance_approved', 'reduce PNR event latency and legacy coupling', 'at_risk', '2026-12-31', 'mainframe API wrapper throughput and event certification', 'high', 'sequence before broad passenger recovery autonomy'],
  ['SHA-PROG-CTO-007', 'Airport Operations Data Program', 'VP Airport Operations Technology', 'VP Airport Operations Technology', 'COO', 'pilot', '14000000', '3100000', 'planning_value_only', 'not_finance_approved', 'standardize gate, ramp, and turn events across hubs', 'pilot', '2026-10-01', 'station adoption and event automation', 'medium', 'fund top-hub automation before network rollout'],
  ['SHA-PROG-CTO-008', 'AI Governance Readiness Program', 'AI Governance Lead', 'CDAO', 'CTO', 'mobilize', '9000000', '1800000', 'planning_value_only', 'not_finance_approved', 'define model-risk tiers, HITL controls, and audit evidence for operational AI', 'in_flight', '2026-08-15', 'model inventory completeness and control owner signoff', 'high', 'make mandatory gate for agentic IROPS'],
].map(([record_id, record_name, business_owner, technology_owner, executive_sponsor, phase, budget_usd, spend_to_date_usd, expected_value_usd, realized_value_usd, value_basis, status, target_date, dependencies, risks, decision_needed]) => ({
  record_id,
  record_name,
  program_id: record_id,
  business_owner,
  technology_owner,
  executive_sponsor,
  phase,
  budget_usd,
  spend_to_date_usd,
  expected_value_usd,
  realized_value_usd,
  value_basis,
  status,
  target_date,
  dependencies,
  risks,
  decision_needed,
  confidence: 'medium',
  known_gaps: 'expected_value_requires_finance_signoff|realized_value_not_yet_board_grade',
}));

const spendRows = programs.map((program, index) => ({
  record_id: `SHA-SPEND-CTO-${String(index + 1).padStart(3, '0')}`,
  record_name: `${program.record_name} funding line`,
  spend_id: `SHA-SPEND-CTO-${String(index + 1).padStart(3, '0')}`,
  amount_usd: program.budget_usd,
  amount_type: 'planning_budget',
  owner: program.business_owner,
  program_id: program.program_id,
  vendor_id: index % 2 === 0 ? 'multi_vendor' : 'internal_plus_platform_vendor',
  system_id: index === 1 ? 'SHA-SYS-CTO-007' : index === 5 ? 'SHA-SYS-CTO-005' : 'portfolio_multiple_systems',
  committed_vs_discretionary: 'planning_discretionary',
  renewal_or_gate_date: program.target_date,
  value_linkage: program.value_basis,
  unit_economics: 'planning-grade funding bucket; Finance signoff required',
  known_gaps: 'finance_signoff_required_before_board_use',
}));

const risks = [
  ['SHA-RISK-CTO-001', 'Stale crew legality feed blocks autonomous crew recovery', 'VP Crew Operations', 'P0', 'open', 'certify crew legality freshness SLA and audit trail', 'Crew Legality System|Crew Recovery Copilot', 'Autonomous crew recovery cannot scale without certified legality feed.'],
  ['SHA-RISK-CTO-002', 'IROPS event store pilot coverage is not enterprise certified', 'VP Data Platforms', 'P0', 'open', 'expand event-store lineage and hub coverage evidence', 'Operational Event Store|IROPS Decision Assistant', 'Recovery recommendations may miss station or hub events.'],
  ['SHA-RISK-CTO-003', 'PSS/mainframe event latency not certified under disruption load', 'VP Enterprise Platforms', 'P1', 'open', 'load-test PNR event gateway and certify latency envelope', 'PSS Mainframe Gateway|Passenger Reaccommodation Agent', 'Passenger recovery offers may be stale or incomplete.'],
  ['SHA-RISK-CTO-004', 'Model-risk tier not approved for operational decision support', 'AI Governance Lead', 'P0', 'open', 'assign model-risk tier and validation standard', 'IROPS Decision Assistant|Crew Recovery Copilot', 'AI cannot move beyond human-in-loop recommendations.'],
  ['SHA-RISK-CTO-005', 'Human-in-loop control workflow incomplete', 'EVP Operations', 'P0', 'in_progress', 'define accountable approver and override logging', 'OCC Platform|IROPS Decision Assistant', 'No defensible audit trail for disruption decisions.'],
  ['SHA-RISK-CTO-006', 'Finance-approved disruption cost baseline missing', 'CFO delegate', 'P1', 'open', 'approve disruption cost baseline and event categories', 'IROPS Business Case', 'Value sizing remains planning-grade.'],
  ['SHA-RISK-CTO-007', 'Customer communication compliance not approved for autonomous send', 'Chief Compliance Officer', 'P1', 'open', 'approve templates, consent checks, and legal boundaries', 'Customer Notification Platform|Disruption Communication Agent', 'Customer-facing automation must remain draft-only.'],
  ['SHA-RISK-CTO-008', 'Passenger PII and consent dependency requires privacy control', 'Privacy Officer', 'P1', 'open', 'validate PNR, loyalty, and consent data use', 'Passenger Reaccommodation Platform', 'Passenger recovery AI cannot scale externally without privacy review.'],
  ['SHA-RISK-CTO-009', 'Airport turn event automation incomplete across hubs', 'VP Airport Operations Technology', 'P2', 'in_progress', 'automate gate/ramp event capture at top hubs', 'Airport Turn Management System', 'Turn-risk predictions are uneven by station.'],
  ['SHA-RISK-CTO-010', 'Maintenance delay feed lacks MEL/CDL completeness certification', 'VP TechOps Systems', 'P2', 'open', 'certify maintenance event completeness and delay-code mapping', 'Maintenance Operations Feed Hub', 'Technical delay prediction stays advisory-only.'],
  ['SHA-RISK-CTO-011', 'Vendor concentration in recovery stack creates platform fragility', 'CTO Vendor Management', 'P2', 'open', 'map recovery systems to vendor support SLAs and exit risk', 'OCC Platform|PSS Gateway|Event Store', 'Operational resilience depends on several critical platform vendors.'],
  ['SHA-RISK-CTO-012', 'Recovery decision history lacks complete manual override evidence', 'VP OCC Technology', 'P1', 'open', 'capture override rationale and outcome labels', 'Disruption Management Application', 'Model validation lacks ground truth for recommendation quality.'],
].map(([record_id, record_name, process_owner, severity, status, control, affected_systems, business_impact]) => ({
  record_id,
  record_name,
  process: 'IROPS AI readiness',
  process_owner,
  severity,
  status,
  control,
  affected_systems,
  business_impact,
  confidence: severity === 'P0' ? 'high' : 'medium',
  known_gaps: status === 'open' ? 'client_signoff_required|evidence_required_for_board_grade' : 'client_signoff_required_before_board_use',
}));

function relationship(id, fromFamily, fromId, type, toFamily, toId, evidence) {
  return {
    record_id: `SHA-REL-CTO-${String(id).padStart(3, '0')}`,
    record_name: `${fromId} ${type} ${toId}`,
    relationship_id: `SHA-REL-CTO-${String(id).padStart(3, '0')}`,
    from_object_family: fromFamily,
    from_record_id: fromId,
    relationship_type: type,
    to_object_family: toFamily,
    to_record_id: toId,
    evidence_basis: evidence,
    relationship_confidence: 'medium',
    known_gaps: 'client_signoff_required_before_board_use',
  };
}

const relationships = [
  relationship(1, 'application_system', 'SHA-SYS-CTO-001', 'supports_capability', 'business_function', 'Operations Control Center / IROPS', 'OCC steering excerpt'),
  relationship(2, 'application_system', 'SHA-SYS-CTO-002', 'supports_capability', 'business_function', 'Operations Control Center / IROPS', 'OCC modernization pack'),
  relationship(3, 'data_asset_integration', 'SHA-DATA-CTO-003', 'feeds_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-002', 'Crew legality control evidence'),
  relationship(4, 'data_asset_integration', 'SHA-DATA-CTO-013', 'feeds_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-001', 'IROPS data readiness register'),
  relationship(5, 'ai_initiative', 'SHA-AI-CTO-001', 'impacts_outcome', 'metric_definition', 'MET-0150', 'Disruption recovery time metric'),
  relationship(6, 'program_initiative', 'SHA-PROG-CTO-002', 'modernizes_system', 'application_system', 'SHA-SYS-CTO-007', 'Operational event streaming architecture'),
  relationship(7, 'operations_risk_control', 'SHA-RISK-CTO-001', 'blocks_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-002', 'Crew legality control evidence'),
  relationship(8, 'operations_risk_control', 'SHA-RISK-CTO-004', 'blocks_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-001', 'AI model governance intake'),
  relationship(9, 'operations_risk_control', 'SHA-RISK-CTO-005', 'mitigates_risk_for', 'ai_initiative', 'SHA-AI-CTO-001', 'AI model governance intake'),
  relationship(10, 'vendor_contract', 'NAVBLUE', 'supports_system', 'application_system', 'SHA-SYS-CTO-001', 'Vendor/platform mapping'),
  relationship(11, 'vendor_contract', 'Amadeus', 'supports_system', 'application_system', 'SHA-SYS-CTO-005', 'PSS/mainframe integration risk note'),
  relationship(12, 'spend_value', 'SHA-SPEND-CTO-002', 'funds_program', 'program_initiative', 'SHA-PROG-CTO-002', 'CTO 90-day readiness plan'),
  relationship(13, 'metric_definition', 'MET-0150', 'measures_outcome_for', 'ai_initiative', 'SHA-AI-CTO-001', 'Metric definition row'),
  relationship(14, 'org_ownership', 'VP Data Platforms', 'owns_data_asset', 'data_asset_integration', 'SHA-DATA-CTO-013', 'IROPS data readiness register'),
  relationship(15, 'org_ownership', 'VP Crew Operations', 'owns_control', 'operations_risk_control', 'SHA-RISK-CTO-001', 'Crew legality control evidence'),
  relationship(16, 'program_initiative', 'SHA-PROG-CTO-006', 'modernizes_system', 'application_system', 'SHA-SYS-CTO-005', 'PSS/mainframe integration risk note'),
  relationship(17, 'data_asset_integration', 'SHA-DATA-CTO-005', 'feeds_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-003', 'Passenger recovery product brief'),
  relationship(18, 'operations_risk_control', 'SHA-RISK-CTO-007', 'blocks_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-007', 'Customer communication compliance note'),
  relationship(19, 'data_asset_integration', 'SHA-DATA-CTO-010', 'feeds_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-006', 'Weather feed evidence'),
  relationship(20, 'data_asset_integration', 'SHA-DATA-CTO-009', 'feeds_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-008', 'Maintenance delay feed readiness note'),
  relationship(21, 'program_initiative', 'SHA-PROG-CTO-008', 'mitigates_risk', 'operations_risk_control', 'SHA-RISK-CTO-004', 'AI governance readiness program'),
  relationship(22, 'program_initiative', 'SHA-PROG-CTO-005', 'mitigates_risk', 'operations_risk_control', 'SHA-RISK-CTO-002', 'Operational event streaming architecture'),
  relationship(23, 'spend_value', 'SHA-SPEND-CTO-008', 'funds_program', 'program_initiative', 'SHA-PROG-CTO-008', 'CTO 90-day readiness plan'),
  relationship(24, 'application_system', 'SHA-SYS-CTO-010', 'supports_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-007', 'Customer communication compliance note'),
  relationship(25, 'application_system', 'SHA-SYS-CTO-008', 'supports_ai_initiative', 'ai_initiative', 'SHA-AI-CTO-005', 'Airport turn operations data note'),
  relationship(26, 'data_asset_integration', 'SHA-DATA-CTO-015', 'sizes_value_for', 'program_initiative', 'SHA-PROG-CTO-001', 'Disruption cost planning baseline'),
  relationship(27, 'operations_risk_control', 'SHA-RISK-CTO-006', 'blocks_board_grade_value', 'program_initiative', 'SHA-PROG-CTO-001', 'Disruption cost planning baseline'),
  relationship(28, 'application_system', 'SHA-SYS-CTO-011', 'feeds_system', 'application_system', 'SHA-SYS-CTO-001', 'Flight planning dispatch platform'),
  relationship(29, 'application_system', 'SHA-SYS-CTO-009', 'feeds_system', 'application_system', 'SHA-SYS-CTO-001', 'Maintenance operations feed readiness note'),
  relationship(30, 'application_system', 'SHA-SYS-CTO-006', 'uses_data_asset', 'data_asset_integration', 'SHA-DATA-CTO-016', 'Passenger recovery product brief'),
  relationship(31, 'operations_risk_control', 'SHA-RISK-CTO-012', 'blocks_model_validation', 'ai_initiative', 'SHA-AI-CTO-001', 'Recovery decision history evidence'),
  relationship(32, 'industry_corpus_pattern', 'sha-irops-agentic-readiness', 'informs_assessment', 'ai_initiative', 'SHA-AI-CTO-001', 'Industry pattern context; not tenant fact'),
];

const evidenceRows = evidenceIds.map(([record_id, record_name, evidence_type, source_location, evidence_owner, claim]) => ({
  record_id,
  record_name,
  evidence_id: record_id,
  evidence_title: record_name,
  evidence_type,
  source_location,
  evidence_owner,
  evidence_confidence: record_id === 'SHA-EVID-CTO-007' ? 'medium_planning_assumption' : 'medium',
  known_gaps: record_id === 'SHA-EVID-CTO-007' ? 'finance_signoff_required_before_board_use' : 'client_signoff_required_before_board_use',
  allowed_answer_types: `supports_claim:${claim}|planning_grade|readiness_assessment`,
  confidence: 'medium',
}));

const expertLenses = [
  ['expert-lens-airline-cto', 'Airline CTO Lens', 'airline architecture and operational resilience', 'Activate for CTO, IROPS, architecture, platform, integration, vendor, or modernization questions.', 'Pressure-test system dependency, owner accountability, operational resilience, data certification, and sequencing before scale.', 'Shiny AI use case funded before operational substrate is certified.', 'systems, owners, data products, freshness, controls, funding gate, vendor exposure', 'Do not recommend autonomous scale without data/control signoff.'],
  ['expert-lens-operations-control', 'Operations Control / IROPS Lens', 'OCC, disruption recovery, crew, aircraft, passenger recovery', 'Activate for IROPS, disruption, recovery, crew legality, passenger reaccommodation, or OCC questions.', 'Pressure-test recovery latency, legal constraints, manual override, DOT/customer obligations, and command-center workflow.', 'Recovery optimization fails because crew or passenger constraints arrive stale.', 'crew legality, PNR, aircraft status, gate/turn events, decision audit trail', 'Keep autonomy human-in-loop until operational controls are certified.'],
  ['expert-lens-data-readiness', 'Data Readiness Lens', 'data products, lineage, freshness, governance', 'Activate when value depends on data quality, lineage, freshness, ownership, or AI readiness.', 'Pressure-test certified owner, system of record, freshness SLA, actual freshness, consumers, and quality score.', 'AI case sounds ready but depends on uncertified event feeds.', 'data owner, system of record, lineage map, freshness SLA, quality score, governance status', 'Label value as planning-grade when data products are not certified.'],
  ['expert-lens-ai-governance', 'AI Governance / Model Risk Lens', 'model risk, HITL controls, operational AI approval', 'Activate for agentic AI, autonomous decisioning, model tiering, controls, or board readiness.', 'Pressure-test model-risk tier, validation evidence, human approval path, override log, and monitoring.', 'Operational AI moves from recommendation to action before model/control approval.', 'model inventory, risk tier, validation, human-in-loop design, control owner signoff', 'Do not call an AI use case board-grade without model-risk and control signoff.'],
  ['expert-lens-architecture-modernization', 'Architecture Modernization Lens', 'legacy modernization, APIs, event streaming, resilience', 'Activate for mainframe, PSS, integration, eventing, resilience, or modernization funding questions.', 'Pressure-test strangler path, event backbone, latency envelope, rollback, and operational blast radius.', 'Point-to-point wrappers create the illusion of modernization while recovery logic stays brittle.', 'integration map, API/event design, latency tests, service ownership, resilience evidence', 'Fund substrate before scaling dependent AI products.'],
  ['expert-lens-sourcing-commercial', 'Sourcing / Commercial Risk Lens', 'vendor exposure, contract risk, platform economics', 'Activate for vendor, platform, commercial, sourcing, renewal, or lock-in questions.', 'Pressure-test service scope, linked systems, annual cost, support SLA, exit risk, and pricing basis.', 'Critical recovery platform vendor risk is invisible because contracts are not linked to systems.', 'vendor contract, linked systems, annual cost, SLA, renewal, pricing basis, exit risk', 'Treat vendor-risk claims as hypotheses until contract-system links are signed off.'],
].map(([record_id, record_name, domain_focus, activation_conditions, lens_questions, commonFailure, requiredEvidence, boundary]) => ({
  record_id,
  record_name,
  expert_lens_id: record_id,
  expert_lens_name: record_name,
  domain_focus,
  activation_conditions,
  lens_questions: `${lens_questions} Required evidence: ${requiredEvidence}. Common failure pattern: ${commonFailure}.`,
  lens_forbidden_claims: boundary,
  known_gaps: 'client_signoff_required_before_board_use',
  confidence: 'high',
}));

const results = [];
results.push(upsertRows('V6_05_applications_systems.csv', systems));
results.push(upsertRows('V6_06_data_assets_integrations.csv', dataAssets));
results.push(upsertRows('V6_08_spend_value.csv', spendRows));
results.push(upsertRows('V6_09_programs_initiatives.csv', programs));
results.push(upsertRows('V6_10_ai_initiatives.csv', aiInitiatives));
results.push(upsertRows('V6_11_operations_risk_controls.csv', risks));
results.push(upsertRows('V6_12_relationships.csv', relationships));
results.push(upsertRows('V6_13_evidence_sources.csv', evidenceRows));
results.push(upsertRows('V6_16_expert_lenses.csv', expertLenses));
const manifestSummary = updateManifestAndReadme();

console.log(JSON.stringify({ ok: true, datasetRoot: path.relative(repoRoot, datasetRoot), results, manifestSummary }, null, 2));

function countFile(fileName) {
  const { headers, rows } = readFileRows(fileName);
  let dataThinCells = 0;
  for (const row of rows) {
    for (const header of headers) {
      if (String(row[header] ?? '').includes('data_thin:')) dataThinCells += 1;
    }
  }
  return { columns: headers.length, rows: rows.length, dataThinCells };
}

function updateManifestAndReadme() {
  const manifestPath = path.join(datasetRoot, 'V6_GENERATED_MANIFEST.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const updatedFiles = manifest.files.map((entry) => {
    const fileName = path.basename(entry.file);
    return { ...entry, ...countFile(fileName) };
  });
  const totals = {
    files: updatedFiles.length,
    rows: updatedFiles.reduce((sum, entry) => sum + entry.rows, 0),
    dataThinCells: updatedFiles.reduce((sum, entry) => sum + entry.dataThinCells, 0),
  };
  const updated = {
    ...manifest,
    generatedAt: '2026-06-30T00:00:00.000Z',
    enrichment: {
      id: 'skyharbor-v6-cto-readiness-irops-storyline',
      generatedAt: now,
      principle: 'Advise now. Prove progressively. Upgrade to board-grade when evidence arrives.',
      scope: 'Focused CTO/IROPS storyline enrichment across existing V6 templates; no hidden prompt facts.',
    },
    files: updatedFiles,
    totals,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(updated, null, 2)}\n`);
  fs.writeFileSync(path.join(datasetRoot, 'README.md'), renderReadme(updatedFiles, totals));
  return totals;
}

function renderReadme(files, totals) {
  return `${[
    '# SkyHarbor Air Group V6 Synthetic Intelligence Pack',
    '',
    'Generated: 2026-06-30T00:00:00.000Z',
    '',
    'This pack was generated from the existing V4 tenant pack into the shared Enterprise Intelligence V6 contract and enriched with a focused CTO/IROPS readiness storyline.',
    '',
    '## Contract Rules',
    '',
    '- Every tenant has the same V6 template files.',
    '- Every V6 file has the same headers as the template pack.',
    '- Every column is documented in `V6_BUSINESS_METADATA_DICTIONARY.csv`.',
    '- Missing facts are explicit `data_thin:*` values and are also summarized in `known_gaps`.',
    '- Industry corpus and expert lenses are advisory context, not tenant fact.',
    '- The CTO/IROPS enrichment keeps facts in V6 rows; derived packets may assemble them but must not hide extra prompt-only facts.',
    '',
    '## CTO/IROPS Enrichment',
    '',
    'Principle: Advise now. Prove progressively. Upgrade to board-grade when evidence arrives.',
    '',
    'Focused additions:',
    '',
    '- 12 IROPS-critical systems',
    '- 16 IROPS data assets/integrations',
    '- 8 AI initiatives',
    '- 8 modernization programs',
    '- 8 planning spend lines',
    '- 12 risks/controls',
    '- 32 typed relationships',
    '- 12 evidence sources',
    '- populated expert lenses for airline CTO, IROPS, data readiness, AI governance, architecture modernization, and sourcing/commercial risk',
    '',
    '## Summary',
    '',
    `- Files: ${totals.files}`,
    `- Rows: ${totals.rows}`,
    `- Data-thin cells: ${totals.dataThinCells}`,
    '',
    '| File | Family | Rows | Data-Thin Cells |',
    '| --- | --- | ---: | ---: |',
    ...files.map((file) => `| \`${file.file}\` | ${file.businessObjectFamily} | ${file.rows} | ${file.dataThinCells} |`),
    '',
  ].join('\n')}\n`;
}
