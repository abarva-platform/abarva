#!/usr/bin/env node
/**
 * SkyHarbor Air ITSM ticket/SLA performance generator.
 *
 * Purpose:
 *   Adds 20_itsm_ticket_sla_performance.csv to the skyharbor-air enrichment
 *   pack — the trailing-12-month incident/SLA-performance record per
 *   application that a real ServiceNow CMDB/ITSM pull would surface. Fills
 *   a real gap: the existing 17_service_scope_managed_services.csv carries
 *   SLA *targets* (11 managed-service-level rows), not measured incident
 *   history per system.
 *
 *   Deterministic, not random-noise: incident volume, MTTR, and SLA
 *   compliance are derived from each system's own criticality, deployment
 *   model, and known_challenges_narrative (a system already flagged with a
 *   known operational issue shows correlated ticket pressure — this ties
 *   the new file to the existing enrichment instead of being disconnected
 *   filler). Seeded by system_name so re-runs are stable.
 *
 * Usage:
 *   node scripts/skyharbor/generate-itsm-ticket-sla-history.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_ROOT = path.join(REPO_ROOT, 'datasets/tenant-inputs/active/skyharbor-air/current');
const OUT_PATH = path.join(SOURCE_ROOT, '20_itsm_ticket_sla_performance.csv');
const REPORTING_PERIOD = 'trailing_12mo_ending_2026-07-31';

function readCsv(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  return Papa.parse(raw, { header: true, skipEmptyLines: true }).data;
}

function csvEscape(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

// Deterministic pseudo-random in [0, 1), seeded per system so re-runs are stable.
function seededRandom(seed, salt) {
  const hash = crypto.createHash('sha256').update(`${seed}::${salt}`).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

console.log('SkyHarbor Air ITSM ticket/SLA performance generator');

const appRows = readCsv(path.join(SOURCE_ROOT, '04_applications_systems.csv'))
  .filter((r) => r.system_name);
console.log(`  loaded: ${appRows.length} applications`);

// SLA targets by criticality, matching real-world tiering norms and the
// posture already established in 17_service_scope_managed_services.csv.
const SLA_TARGET_BY_TIER = { tier1: 99.9, tier2: 99.5, tier3: 98.0 };
const BASE_INCIDENT_VOLUME_BY_TIER = { tier1: 42, tier2: 22, tier3: 9 };
const MTTR_TARGET_HOURS_BY_TIER = { tier1: 2, tier2: 4, tier3: 8 };

// Deployment models with more operational surface area (on_premise/mainframe,
// or a documented interface-heavy footprint) run somewhat hotter than
// SaaS/vendor-hosted systems, where the vendor absorbs most incident volume.
const DEPLOYMENT_INCIDENT_MULTIPLIER = {
  saas: 0.7,
  aws: 0.85,
  azure: 0.85,
  private_cloud: 1.0,
  hybrid: 1.15,
  on_premise: 1.35,
  mainframe: 1.2,
};

const ROOT_CAUSE_CATEGORIES = [
  'integration/interface failure',
  'batch/scheduling delay',
  'capacity/performance degradation',
  'data quality/reconciliation',
  'access/authentication',
  'vendor-side outage',
  'change-related regression',
  'infrastructure/network',
];

// Every one of the 503 applications already carries real known_challenges_narrative
// text (that was the point of the earlier enrichment pass) — so presence alone
// doesn't differentiate anything. Severity has to come from what the text
// actually says. High-severity phrases mark genuinely operationally risky
// conditions (unsupported, single point of failure, governance gap); moderate
// phrases mark routine tech debt that most enterprises carry without breaching
// SLA over it.
const HIGH_SEVERITY_PHRASES = [
  'no formal support', 'no longer supported', 'unsupported', 'end of life', 'end-of-life',
  'single point of failure', 'sme', 'nearing retirement', 'outside governed',
  'not yet remediated', 'inconsistent', 'security patching', 'no material owner',
  'paper or manual fallback', 'compliance gap',
];
const MODERATE_SEVERITY_PHRASES = [
  'stale', 'batch-window', 'manual', 'backlog', 'not yet funded', 'plateaued',
  'workaround', 'has not been modernized', 'reformatting',
];

// "manual"/"backlog"/"not yet funded" etc. appear in the majority of narratives
// (confirmed: "manual" alone hits 52% of the 503 rows) — that's normal
// enterprise texture, not risk signal, so it only nudges ticket *volume*.
// Real SLA/severity risk is driven by the much rarer high-severity phrases
// only (confirmed distribution: ~73% zero hits, ~11% one hit, ~16% two-plus —
// a realistic "most systems fine, a minority genuinely at risk" shape).
function volumePressureScore(narrative) {
  const text = (narrative ?? '').toLowerCase();
  const high = HIGH_SEVERITY_PHRASES.filter((phrase) => text.includes(phrase)).length;
  const moderate = MODERATE_SEVERITY_PHRASES.filter((phrase) => text.includes(phrase)).length;
  return Math.min(4, high * 2 + moderate * 1);
}

function severityRiskScore(narrative) {
  const text = (narrative ?? '').toLowerCase();
  const high = HIGH_SEVERITY_PHRASES.filter((phrase) => text.includes(phrase)).length;
  return Math.min(3, high);
}

const rows = appRows.map((app, i) => {
  const seed = app.original_row_id || app.system_name || `app-${i}`;
  const tier = ['tier1', 'tier2', 'tier3'].includes(app.criticality) ? app.criticality : 'tier3';
  const deploymentMultiplier = DEPLOYMENT_INCIDENT_MULTIPLIER[app.deployment_model] ?? 1.0;
  const volumeScore = volumePressureScore(app.known_challenges_narrative);
  const score = severityRiskScore(app.known_challenges_narrative); // 0-3, drives SLA/MTTR
  const isElevated = score >= 2;

  // Ticket volume tracks routine texture (volumeScore); elevated-severity
  // systems add a further, smaller bump on top.
  const challengePressure = 1.0 + volumeScore * 0.1 + score * 0.12;
  const volumeNoise = 0.75 + seededRandom(seed, 'volume') * 0.5; // 0.75x-1.25x

  const totalIncidents = Math.max(
    1,
    Math.round(BASE_INCIDENT_VOLUME_BY_TIER[tier] * deploymentMultiplier * challengePressure * volumeNoise),
  );

  // Priority mix skews toward P3/P4 for lower-tier, more evenly for tier1
  // (mission-critical systems get escalated more readily).
  const p1Share = tier === 'tier1' ? 0.06 + seededRandom(seed, 'p1') * 0.05 : 0.01 + seededRandom(seed, 'p1') * 0.02;
  const p2Share = tier === 'tier1' ? 0.22 + seededRandom(seed, 'p2') * 0.08 : 0.12 + seededRandom(seed, 'p2') * 0.08;
  const p3Share = 0.35 + seededRandom(seed, 'p3') * 0.1;
  const p1 = Math.round(totalIncidents * p1Share);
  const p2 = Math.round(totalIncidents * p2Share);
  const p3 = Math.round(totalIncidents * p3Share);
  const p4 = Math.max(0, totalIncidents - p1 - p2 - p3);

  const mttrTarget = MTTR_TARGET_HOURS_BY_TIER[tier];
  // score 0 -> comfortably beats target (~0.6x); score 3 -> meaningfully over (~1.5x).
  const mttrPressure = 0.6 + score * 0.28 + seededRandom(seed, 'mttr') * 0.25;
  const avgMttrHours = round(mttrTarget * mttrPressure, 1);
  const p1MttrHours = round(avgMttrHours * (0.4 + seededRandom(seed, 'p1mttr') * 0.2), 1);

  const slaTarget = SLA_TARGET_BY_TIER[tier];
  // score 0-1 (routine, ~85% of the estate): erosion is negative on average
  // -> beats target, no breach. score 2 (moderate): borderline. score 3
  // (elevated, ~15% of the estate): erosion positive -> breaches. This keeps
  // most of the estate compliant, which is what a real enterprise ITSM pull
  // looks like — not a wall of red.
  const erosionNoise = (seededRandom(seed, 'erosion') - 0.5) * 0.3;
  const complianceErosion = (score - 1.5) * 0.25 + erosionNoise;
  const slaActual = round(Math.min(100, Math.max(90, slaTarget - complianceErosion)), 2);
  const slaBreaches = slaActual < slaTarget ? Math.max(1, Math.round((slaTarget - slaActual) * 4)) : 0;

  const changeRequests = Math.max(1, Math.round(totalIncidents * (0.15 + seededRandom(seed, 'changes') * 0.15)));
  const changeSuccessRate = round(
    isElevated ? 82 + seededRandom(seed, 'changesuccess') * 10 : 92 + seededRandom(seed, 'changesuccess') * 7,
    1,
  );

  const rootCauseIdx = Math.floor(seededRandom(seed, 'rootcause') * ROOT_CAUSE_CATEGORIES.length);
  const topRootCause = ROOT_CAUSE_CATEGORIES[rootCauseIdx];

  const escalationToVendor = app.vendor && app.vendor !== 'Unknown'
    ? Math.round(totalIncidents * (0.1 + seededRandom(seed, 'escalation') * 0.15))
    : 0;

  const narrative = isElevated
    ? `Ticket volume and SLA performance run under pressure, tracking the known operational issue already on record for this system (${(app.known_challenges_narrative ?? '').split('.')[0]}).`
    : score === 1
      ? `SLA performance is borderline for this ${tier} system — one known operational risk factor on record, not yet consistently breaching.`
      : `Ticket volume and SLA performance track normally for a ${tier} system on this deployment model; the known-issues on record for this system are routine and not operationally material.`;

  return {
    tenant_key: 'skyharbor-air',
    system_name: app.system_name,
    servicenow_ci_sys_id: `SHACMDB-${crypto.createHash('sha256').update(seed).digest('hex').slice(0, 10)}`,
    reporting_period: REPORTING_PERIOD,
    total_incidents: totalIncidents,
    p1_incidents: p1,
    p2_incidents: p2,
    p3_incidents: p3,
    p4_incidents: p4,
    avg_mttr_hours: avgMttrHours,
    p1_mttr_hours: p1MttrHours,
    sla_target_pct: slaTarget,
    sla_actual_pct: slaActual,
    sla_breach_count: slaBreaches,
    top_root_cause_category: topRootCause,
    change_requests_count: changeRequests,
    change_success_rate_pct: changeSuccessRate,
    escalation_to_vendor_count: escalationToVendor,
    service_desk_provider: 'Infosys BPM (Tier-1 Service Desk) / vendor-direct for escalations',
    notes: narrative,
    source_classification: 'synthetic-demo',
    generation_method: 'itsm-ticket-sla-history-generator-v1',
  };
});

const columns = [
  'tenant_key', 'system_name', 'servicenow_ci_sys_id', 'reporting_period',
  'total_incidents', 'p1_incidents', 'p2_incidents', 'p3_incidents', 'p4_incidents',
  'avg_mttr_hours', 'p1_mttr_hours',
  'sla_target_pct', 'sla_actual_pct', 'sla_breach_count',
  'top_root_cause_category', 'change_requests_count', 'change_success_rate_pct',
  'escalation_to_vendor_count', 'service_desk_provider', 'notes',
  'source_classification', 'generation_method',
];

fs.writeFileSync(OUT_PATH, toCsv(rows, columns));

const breachedCount = rows.filter((r) => r.sla_breach_count > 0).length;
const elevatedCount = rows.filter((r) => r.notes.startsWith('Ticket volume and SLA performance run under pressure')).length;
console.log(`  wrote ${rows.length} rows to ${path.relative(REPO_ROOT, OUT_PATH)}`);
console.log(`  ${breachedCount}/${rows.length} systems with SLA breaches (${round((breachedCount / rows.length) * 100, 1)}%); ${elevatedCount} at elevated severity`);
console.log('Done.');
