#!/usr/bin/env node
/**
 * SkyHarbor Air interview-to-dimension relationship linker.
 *
 * Purpose:
 *   executive_interviews.csv's system_or_vendor_mentioned field is fully
 *   populated (216/216 rows) but was never wired into 12_relationships.csv
 *   — the actual relationship graph everything else reads. This appends
 *   interview -> discusses -> system/vendor rows, so "why does this system
 *   matter" resolves to real interview evidence instead of nothing.
 *
 *   Matched via normalized token overlap between the free-text mention and
 *   the canonical system_name/vendor_name — NOT a guess-and-hope fuzzy
 *   match. Below-threshold candidates are left unmatched and reported, not
 *   force-linked, because a false evidence link is worse than a missing one.
 *
 *   initiative_link/metric_mentioned are NOT handled here — those use a
 *   genuinely different, unreconciled naming scheme from the canonical
 *   initiative/metric files (confirmed: near-zero token overlap even for
 *   same-theme items, e.g. "IROPS Recovery Copilot" vs "IROPS Agentic
 *   Recovery Cockpit") and need real semantic judgment, not string matching.
 *
 * Usage:
 *   node scripts/skyharbor/generate-interview-relationship-links.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_ROOT = path.join(REPO_ROOT, 'datasets/tenant-inputs/active/skyharbor-air/current');
const INTERVIEWS_PATH = path.join(REPO_ROOT, 'datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv');
const RELATIONSHIPS_PATH = path.join(SOURCE_ROOT, '12_relationships.csv');

function readCsv(absPath) {
  return Papa.parse(fs.readFileSync(absPath, 'utf8'), { header: true, skipEmptyLines: true }).data;
}

function csvEscape(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'system', 'systems',
  'platform', 'platforms', 'software', 'tool', 'tools', 'application', 'applications', 'service',
  'services', 'legacy', 'core', 'module', 'suite', '&', '-', 'dual', 'instances',
]);

function tokenize(text) {
  return (text ?? '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Token-overlap match score: fraction of the (shorter) token set that's
// present in the (longer) one, weighted toward precision over recall —
// we'd rather miss a real match than manufacture a false one.
function matchScore(mentionTokens, canonicalTokens) {
  if (mentionTokens.length === 0 || canonicalTokens.length === 0) return 0;
  const canonicalSet = new Set(canonicalTokens);
  const overlap = mentionTokens.filter((t) => canonicalSet.has(t)).length;
  const shorterLen = Math.min(mentionTokens.length, canonicalTokens.length);
  return overlap / shorterLen;
}

const MATCH_THRESHOLD = 0.6; // require most of the shorter token set to overlap

console.log('SkyHarbor Air interview relationship linker');

const interviews = readCsv(INTERVIEWS_PATH);
const apps = readCsv(path.join(SOURCE_ROOT, '04_applications_systems.csv')).filter((r) => r.system_name);
const vendors = readCsv(path.join(SOURCE_ROOT, '07_vendors_contracts.csv')).filter((r) => r.vendor_name);

const systemCatalog = apps.map((r) => ({ name: r.system_name, tokens: tokenize(r.system_name) }));
const vendorCatalog = vendors.map((r) => ({ name: r.vendor_name, tokens: tokenize(r.vendor_name) }));

console.log(`  ${interviews.length} interviews, ${systemCatalog.length} systems, ${vendorCatalog.length} vendors`);

function bestMatch(mentionText, catalog) {
  const mentionTokens = tokenize(mentionText);
  let best = null;
  for (const entry of catalog) {
    const score = matchScore(mentionTokens, entry.tokens);
    if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { name: entry.name, score };
    }
  }
  return best;
}

const newRelationshipRows = [];
let mentionsProcessed = 0;
let mentionsMatched = 0;

for (const interview of interviews) {
  const mentionField = interview.system_or_vendor_mentioned ?? '';
  const mentions = mentionField.split(';').map((m) => m.trim()).filter(Boolean);
  for (const mention of mentions) {
    mentionsProcessed++;
    const systemMatch = bestMatch(mention, systemCatalog);
    const vendorMatch = bestMatch(mention, vendorCatalog);
    // Prefer whichever scored higher; systems and vendors don't overlap in
    // this catalog so at most one should fire in practice.
    const winner = systemMatch && vendorMatch
      ? (systemMatch.score >= vendorMatch.score ? { ...systemMatch, type: 'system' } : { ...vendorMatch, type: 'vendor' })
      : systemMatch ? { ...systemMatch, type: 'system' }
      : vendorMatch ? { ...vendorMatch, type: 'vendor' }
      : null;

    if (winner) {
      mentionsMatched++;
      newRelationshipRows.push({
        tenant_key: 'skyharbor-air',
        from_object_type: 'interview',
        from_object_name: interview.interview_id,
        relationship_type: 'discusses',
        to_object_type: winner.type,
        to_object_name: winner.name,
        relationship_strength: winner.score >= 0.9 ? 'high' : 'moderate',
        evidence_basis: `Mentioned as "${mention}" by ${interview.stakeholder_role} in ${interview.interview_id}`,
        current_state_or_target_state: '',
        source_file: 'datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv',
        source_date: interview.interview_date ?? '',
        confidence: interview.confidence ?? '',
        known_gaps: winner.score < 0.9 ? 'Token-overlap match below full-confidence threshold; verify before treating as authoritative.' : '',
        record_id: '',
        evidence_id: interview.evidence_id ?? '',
        source_row_id: interview.source_row_id ?? '',
        dimension_key: '',
        dimension_name: '',
        active_candidate_status: interview.active_candidate_status ?? '',
        candidate_contract_version: interview.candidate_contract_version ?? '',
        load_run_id: interview.load_run_id ?? '',
        generated_at: interview.generated_at ?? '',
        generation_method: 'interview-relationship-linker-v1-token-match',
        source_basis: 'interview_mention_field_matched_to_canonical_name',
        truth_statement: '',
      });
    }
  }
}

console.log(`  ${mentionsProcessed} mentions parsed, ${mentionsMatched} matched (${(100 * mentionsMatched / mentionsProcessed).toFixed(1)}%)`);
console.log(`  ${mentionsProcessed - mentionsMatched} unmatched (left out — not force-linked)`);

// Append to the existing relationships file, preserving its exact column order.
const existing = readCsv(RELATIONSHIPS_PATH);
const columns = Object.keys(existing[0]);

// Fill any column present in the existing schema but not explicitly set above.
const normalizedNewRows = newRelationshipRows.map((row) => {
  const full = {};
  for (const col of columns) full[col] = row[col] ?? '';
  return full;
});

const allRows = [...existing, ...normalizedNewRows];
const csvOut = `${columns.join(',')}\n${allRows.map((row) => columns.map((c) => csvEscape(row[c])).join(',')).join('\n')}\n`;
fs.writeFileSync(RELATIONSHIPS_PATH, csvOut);

console.log(`  wrote ${allRows.length} total rows to 12_relationships.csv (${existing.length} existing + ${normalizedNewRows.length} new interview links)`);
console.log('Done.');
