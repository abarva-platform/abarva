#!/usr/bin/env node
/**
 * Report the persisted Apex Retail AI corpus from Azure/Postgres.
 *
 * Usage:
 *   set -a; source .env.local; set +a
 *   node scripts/corpus/report-retail-ai-corpus.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;
const OUT_DIR = path.join(process.cwd(), 'verification/corpus-load');
const JSON_OUT = path.join(OUT_DIR, '2026-05-30-retail-ai-corpus-db-report.json');
const MD_OUT = path.join(OUT_DIR, '2026-05-30-retail-ai-corpus-db-report.md');

function loadEnv(cwd = process.cwd()) {
  for (const file of [path.join(cwd, '.env.local'), path.join(cwd, '.env')]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

function table(headers, rows) {
  const escape = (value) => String(value ?? '').replace(/\|/g, '\\|');
  return [
    `| ${headers.map(escape).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${headers.map((header) => escape(row[header])).join(' | ')} |`),
  ].join('\n');
}

async function main() {
  loadEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString });
  await client.connect();

  const predicate = `
    vertical = 'retail'
    AND code ~ '^R[0-9]+$'
    AND substring(code from 2)::int BETWEEN 20000 AND 31399
  `;
  const total = await client.query(`
    SELECT
      COUNT(*)::int AS patterns,
      COUNT(*) FILTER (WHERE COALESCE((data->>'demo_relevant')::boolean, false))::int AS demo_relevant,
      COUNT(DISTINCT data->>'sub_topic')::int AS domains,
      MIN(code) AS min_code,
      MAX(code) AS max_code,
      ROUND(AVG(confidence)::numeric, 1)::float AS avg_confidence
    FROM genome_patterns
    WHERE ${predicate}
  `);

  const byDomain = await client.query(`
    SELECT
      COALESCE(data->>'sub_topic', 'unknown') AS domain,
      COUNT(*)::int AS patterns,
      COUNT(*) FILTER (WHERE COALESCE((data->>'demo_relevant')::boolean, false))::int AS demo_relevant,
      COUNT(*) FILTER (WHERE data->>'ai_capability_type' IS NOT NULL)::int AS ai_relevant,
      COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(data->'moves_applicability', '[]'::jsonb)) > 0)::int AS moves_useful,
      COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(data->'source_applicability', '[]'::jsonb)) > 0)::int AS source_useful,
      COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(data->'tower_applicability', '[]'::jsonb)) > 0)::int AS tower_useful,
      COUNT(*) FILTER (WHERE data->>'quality_tier' = 'gold')::int AS gold,
      COUNT(*) FILTER (WHERE data->>'quality_tier' = 'silver')::int AS silver,
      MIN(code) AS min_code,
      MAX(code) AS max_code
    FROM genome_patterns
    WHERE ${predicate}
    GROUP BY 1
    ORDER BY min_code
  `);

  const tier = await client.query(`
    SELECT COALESCE(data->>'quality_tier', 'unclassified') AS quality_tier, COUNT(*)::int AS patterns
    FROM genome_patterns
    WHERE ${predicate}
    GROUP BY 1
    ORDER BY 1
  `);

  const capability = await client.query(`
    SELECT COALESCE(data->>'ai_capability_type', 'missing') AS ai_capability_type, COUNT(*)::int AS patterns
    FROM genome_patterns
    WHERE ${predicate}
    GROUP BY 1
    ORDER BY patterns DESC, ai_capability_type
  `);

  const edges = await client.query(`
    SELECT COUNT(*)::int AS edges
    FROM intelligence_graph_edges
    WHERE vertical = 'retail'
      AND source_key = 'apex-retail'
      AND from_node_id ~ '^R[0-9]+$'
      AND substring(from_node_id from 2)::int BETWEEN 20000 AND 31399
  `);

  const duplicates = await client.query(`
    SELECT code, COUNT(*)::int AS count
    FROM genome_patterns
    WHERE code ~ '^R[0-9]+$'
      AND substring(code from 2)::int BETWEEN 20000 AND 31399
    GROUP BY code
    HAVING COUNT(*) > 1
    ORDER BY code
  `);

  const crossVertical = await client.query(`
    SELECT vertical, COUNT(*)::int AS patterns
    FROM genome_patterns
    WHERE code ~ '^R[0-9]+$'
      AND substring(code from 2)::int BETWEEN 20000 AND 31399
      AND vertical <> 'retail'
    GROUP BY vertical
    ORDER BY vertical
  `);

  const contamination = await client.query(`
    SELECT COUNT(*)::int AS suspicious_terms
    FROM genome_patterns
    WHERE ${predicate}
      AND (
        lower(description) LIKE '%airline%'
        OR lower(description) LIKE '%pnr%'
        OR lower(description) LIKE '%passenger%'
        OR lower(description) LIKE '%clinical%'
        OR lower(description) LIKE '%ehr%'
        OR lower(description) LIKE '%icd-10%'
      )
  `);

  const samples = await client.query(`
    SELECT code, name, data->>'sub_topic' AS domain, data->>'ai_capability_type' AS ai_capability_type,
      data->>'governance_hook' AS governance_hook, description
    FROM genome_patterns
    WHERE vertical = 'retail'
      AND code IN ('R20000', 'R20300', 'R20900', 'R21800', 'R22550', 'R23450', 'R24200', 'R29150', 'R29600', 'R31350')
    ORDER BY code
  `);

  await client.end();

  const report = {
    generatedAt: new Date().toISOString(),
    dataPlane: 'Azure/Postgres',
    vertical: 'retail',
    sourceKey: 'apex-retail',
    codeRange: 'R20000-R31399',
    total: total.rows[0],
    graphEdges: edges.rows[0].edges,
    byDomain: byDomain.rows,
    qualityTiers: tier.rows,
    aiCapabilities: capability.rows,
    duplicateCodes: duplicates.rows,
    crossVerticalCodeLeakage: crossVertical.rows,
    suspiciousTerms: contamination.rows[0].suspicious_terms,
    samples: samples.rows,
    goNoGo: {
      totalPatternsAtLeast10000: total.rows[0].patterns >= 10000,
      domainsAtLeast75: total.rows[0].domains >= 75,
      duplicateCodesZero: duplicates.rows.length === 0,
      crossVerticalLeakageZero: crossVertical.rows.length === 0,
      suspiciousTermsZero: contamination.rows[0].suspicious_terms === 0,
    },
  };

  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`);

  const domainRows = byDomain.rows.map((row) => ({
    Domain: row.domain,
    Patterns: row.patterns,
    AI: row.ai_relevant,
    Demo: row.demo_relevant,
    Moves: row.moves_useful,
    Source: row.source_useful,
    Tower: row.tower_useful,
    Gold: row.gold,
    Silver: row.silver,
    Codes: `${row.min_code}-${row.max_code}`,
  }));
  const tierRows = tier.rows.map((row) => ({ Tier: row.quality_tier, Patterns: row.patterns }));
  const capabilityRows = capability.rows.slice(0, 20).map((row) => ({
    Capability: row.ai_capability_type,
    Patterns: row.patterns,
  }));
  const sampleRows = samples.rows.map((row) => ({
    Code: row.code,
    Pattern: row.name,
    Domain: row.domain,
    Capability: row.ai_capability_type,
    Governance: row.governance_hook,
  }));
  const md = `# Retail AI Corpus DB Report

Generated: ${report.generatedAt}
Data plane: Azure/Postgres
Vertical: retail
Source key: apex-retail
Code range: R20000-R31399

## Summary

| Metric | Value |
|---|---:|
| Patterns | ${report.total.patterns} |
| Domains | ${report.total.domains} |
| Demo-relevant patterns | ${report.total.demo_relevant} |
| Average confidence | ${report.total.avg_confidence} |
| Graph edges | ${report.graphEdges} |
| Duplicate codes | ${report.duplicateCodes.length} |
| Cross-vertical R-code leakage | ${report.crossVerticalCodeLeakage.length} |
| Suspicious non-retail term hits | ${report.suspiciousTerms} |

## Quality Tier Distribution

${table(['Tier', 'Patterns'], tierRows)}

## Domain Coverage

${table(['Domain', 'Patterns', 'AI', 'Demo', 'Moves', 'Source', 'Tower', 'Gold', 'Silver', 'Codes'], domainRows)}

## Top AI Capability Distribution

${table(['Capability', 'Patterns'], capabilityRows)}

## Sample Persisted Patterns

${table(['Code', 'Pattern', 'Domain', 'Capability', 'Governance'], sampleRows)}

## Go / No-Go

| Gate | Result |
|---|---|
| Total patterns >= 10,000 | ${report.goNoGo.totalPatternsAtLeast10000 ? 'PASS' : 'FAIL'} |
| Domains >= 75 | ${report.goNoGo.domainsAtLeast75 ? 'PASS' : 'FAIL'} |
| Duplicate codes = 0 | ${report.goNoGo.duplicateCodesZero ? 'PASS' : 'FAIL'} |
| Cross-vertical leakage = 0 | ${report.goNoGo.crossVerticalLeakageZero ? 'PASS' : 'FAIL'} |
| Suspicious non-retail term hits = 0 | ${report.goNoGo.suspiciousTermsZero ? 'PASS' : 'FAIL'} |
`;
  fs.writeFileSync(MD_OUT, md);
  console.log(JSON.stringify({
    json: path.relative(process.cwd(), JSON_OUT),
    markdown: path.relative(process.cwd(), MD_OUT),
    summary: report.total,
    graphEdges: report.graphEdges,
    goNoGo: report.goNoGo,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
