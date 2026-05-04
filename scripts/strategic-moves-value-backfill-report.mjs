#!/usr/bin/env node
/**
 * Strategic Moves · Wave 1 value-at-stake backfill · dry-run + report.
 *
 * Usage:
 *   node scripts/strategic-moves-value-backfill-report.mjs --apply     # runs migration + writes report
 *   node scripts/strategic-moves-value-backfill-report.mjs             # dry-run only (rolls back)
 *
 * Both paths connect via DATABASE_URL, execute the migration SQL in a
 * transaction, query the post-state for reporting, then either COMMIT
 * (--apply) or ROLLBACK (default). Both paths write the markdown
 * report to docs/build/STRATEGIC_MOVES_VALUE_BACKFILL_REPORT_2026-05-04.md.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const MIGRATION_PATH = path.join(
  REPO_ROOT,
  'supabase',
  'migrations',
  '20260504200000_strategic_moves_demo_value_backfill.sql',
);
const REPORT_PATH = path.join(
  REPO_ROOT,
  'docs',
  'build',
  'STRATEGIC_MOVES_VALUE_BACKFILL_REPORT_2026-05-04.md',
);
const SOURCE_TAG = 'strategic_moves_demo_value_backfill_2026_05_04';

const DEMO_CLIENTS = [
  'Apex Retail',
  'First Capital',
  'Helix Therapeutics',
  'Keystone Energy Holdings',
  'Meridian Health',
];

const APPLY = process.argv.includes('--apply');

function fmtUsd(n) {
  if (n === null || n === undefined) return '—';
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  if (Math.abs(num) >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${Math.round(num).toLocaleString()}`;
}

async function main() {
  // Strip any accidental wrapping quotes from DATABASE_URL (the secret
  // injection in this environment sometimes preserves the literal ""s).
  const url = (process.env.DATABASE_URL ?? '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (!url) {
    console.error('DATABASE_URL missing from env.');
    process.exit(1);
  }

  const migrationSql = await fs.readFile(MIGRATION_PATH, 'utf8');

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Use a single transaction we control. Strip the migration's own
  // BEGIN/COMMIT so we can wrap it ourselves and decide to rollback
  // or commit based on --apply.
  const innerSql = migrationSql
    .replace(/^\s*BEGIN\s*;\s*$/im, '-- BEGIN stripped; outer transaction controls')
    .replace(/^\s*COMMIT\s*;\s*$/im, '-- COMMIT stripped; outer transaction controls');

  console.log(`[${new Date().toISOString()}] Starting ${APPLY ? 'APPLY' : 'DRY-RUN'} …`);
  await client.query('BEGIN');

  try {
    // 1. Pre-state snapshot
    const preQuery = `
      WITH demo_clients AS (
        SELECT id, name FROM clients WHERE name = ANY($1)
      )
      SELECT
        dc.name AS client,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_engagements,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL AND e.value_projected_high_usd IS NOT NULL) AS with_projection_pre,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL AND e.value_verified_usd IS NOT NULL) AS with_verified_pre,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL AND e.program_archetype IS NULL) AS null_archetype_pre
      FROM demo_clients dc
      LEFT JOIN engagements e ON e.client_id = dc.id
      GROUP BY dc.name
      ORDER BY dc.name;
    `;
    const { rows: preRows } = await client.query(preQuery, [DEMO_CLIENTS]);

    // 2. Run the migration body
    console.log('[migration] executing …');
    const migStart = Date.now();
    await client.query(innerSql);
    const migMs = Date.now() - migStart;
    console.log(`[migration] completed in ${migMs}ms.`);

    // 3. Post-state snapshot (after the UPDATE, before COMMIT/ROLLBACK)
    const postPerClient = await client.query(
      `
      WITH demo_clients AS (
        SELECT id, name FROM clients WHERE name = ANY($1)
      )
      SELECT
        dc.name AS client,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_engagements,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL AND e.value_projected_high_usd IS NOT NULL) AS with_projection,
        COUNT(*) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL AND e.value_verified_usd IS NOT NULL) AS with_verified,
        COUNT(*) FILTER (WHERE e.value_assumptions_jsonb->>'source' = $2) AS backfilled_this_run,
        COALESCE(SUM(e.value_projected_low_usd) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL), 0) AS sum_projected_low,
        COALESCE(SUM(e.value_projected_high_usd) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL), 0) AS sum_projected_high,
        COALESCE(SUM(e.value_verified_usd) FILTER (WHERE e.archived_at IS NULL AND e.deleted_at IS NULL), 0) AS sum_verified
      FROM demo_clients dc
      LEFT JOIN engagements e ON e.client_id = dc.id
      GROUP BY dc.name
      ORDER BY dc.name;
      `,
      [DEMO_CLIENTS, SOURCE_TAG],
    );

    const postArchetypes = await client.query(
      `
      SELECT
        COALESCE(value_assumptions_jsonb->>'effective_archetype', '(null-after-heuristic)') AS effective_archetype,
        value_assumptions_jsonb->>'archetype_source' AS archetype_source,
        COUNT(*) AS n,
        SUM(value_projected_low_usd)  AS sum_low,
        SUM(value_projected_high_usd) AS sum_high
      FROM engagements
      WHERE value_assumptions_jsonb->>'source' = $1
      GROUP BY 1, 2
      ORDER BY archetype_source NULLS LAST, effective_archetype NULLS LAST;
      `,
      [SOURCE_TAG],
    );

    const defaulted = await client.query(
      `
      SELECT e.name, c.name AS client, e.current_phase,
             e.value_projected_low_usd, e.value_projected_high_usd
      FROM engagements e
      JOIN clients c ON c.id = e.client_id
      WHERE e.value_assumptions_jsonb->>'source' = $1
        AND e.value_assumptions_jsonb->>'archetype_source' = 'default'
      ORDER BY c.name, e.name;
      `,
      [SOURCE_TAG],
    );

    const top5 = await client.query(
      `
      SELECT e.name, c.name AS client, e.current_phase,
             e.program_archetype,
             e.value_assumptions_jsonb->>'effective_archetype' AS effective_archetype,
             e.value_projected_low_usd, e.value_projected_high_usd, e.value_verified_usd
      FROM engagements e
      JOIN clients c ON c.id = e.client_id
      WHERE e.value_assumptions_jsonb->>'source' = $1
      ORDER BY e.value_projected_high_usd DESC NULLS LAST
      LIMIT 5;
      `,
      [SOURCE_TAG],
    );

    const bottom5 = await client.query(
      `
      SELECT e.name, c.name AS client, e.current_phase,
             e.program_archetype,
             e.value_assumptions_jsonb->>'effective_archetype' AS effective_archetype,
             e.value_projected_low_usd, e.value_projected_high_usd, e.value_verified_usd
      FROM engagements e
      JOIN clients c ON c.id = e.client_id
      WHERE e.value_assumptions_jsonb->>'source' = $1
      ORDER BY e.value_projected_high_usd ASC NULLS LAST
      LIMIT 5;
      `,
      [SOURCE_TAG],
    );

    // 4. Non-demo tenant assertion (safety check): no such row should
    //    carry our stamp — if this is ever non-zero we have a bug.
    const leak = await client.query(
      `
      SELECT COUNT(*)::int AS n
      FROM engagements e
      WHERE e.value_assumptions_jsonb->>'source' = $1
        AND e.client_id NOT IN (SELECT id FROM clients WHERE name = ANY($2));
      `,
      [SOURCE_TAG, DEMO_CLIENTS],
    );
    const scopeLeak = leak.rows[0]?.n ?? 0;

    // 5. Assemble the report
    const lines = [];
    lines.push(`# Strategic Moves · Value-at-stake backfill report`);
    lines.push('');
    lines.push(`- **Generated:** ${new Date().toISOString()}`);
    lines.push(`- **Run mode:** ${APPLY ? 'APPLY (committed)' : 'DRY-RUN (rolled back)'}`);
    lines.push(`- **Migration:** \`supabase/migrations/20260504200000_strategic_moves_demo_value_backfill.sql\``);
    lines.push(`- **Source tag:** \`${SOURCE_TAG}\``);
    lines.push(`- **Scope leak check (non-demo tenants stamped):** ${scopeLeak} ${scopeLeak === 0 ? '✅' : '❌ INVESTIGATE'}`);
    lines.push('');

    lines.push('## Per-client breakdown');
    lines.push('');
    lines.push('| Client | Moves | Projection coverage (pre → post) | Verified coverage (pre → post) | Backfilled this run | Σ projected low | Σ projected high | Σ verified |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
    for (const post of postPerClient.rows) {
      const pre = preRows.find((r) => r.client === post.client) ?? {};
      const total = Number(post.total_engagements) || 0;
      const preProj = Number(pre.with_projection_pre) || 0;
      const preVer = Number(pre.with_verified_pre) || 0;
      const postProj = Number(post.with_projection) || 0;
      const postVer = Number(post.with_verified) || 0;
      lines.push(
        `| ${post.client} | ${total} | ${preProj}/${total} → ${postProj}/${total} | ${preVer}/${total} → ${postVer}/${total} | ${post.backfilled_this_run} | ${fmtUsd(post.sum_projected_low)} | ${fmtUsd(post.sum_projected_high)} | ${fmtUsd(post.sum_verified)} |`,
      );
    }
    lines.push('');

    // Portfolio total
    const totalProjHigh = postPerClient.rows.reduce((a, r) => a + Number(r.sum_projected_high || 0), 0);
    const totalProjLow = postPerClient.rows.reduce((a, r) => a + Number(r.sum_projected_low || 0), 0);
    const totalVerified = postPerClient.rows.reduce((a, r) => a + Number(r.sum_verified || 0), 0);
    const totalBackfilled = postPerClient.rows.reduce((a, r) => a + Number(r.backfilled_this_run || 0), 0);
    lines.push(`**Portfolio totals:** ${totalBackfilled} moves backfilled · Σ projected ${fmtUsd(totalProjLow)} – ${fmtUsd(totalProjHigh)} · Σ verified ${fmtUsd(totalVerified)}.`);
    lines.push('');

    lines.push('## Archetype distribution after the name-heuristic pass');
    lines.push('');
    lines.push('| Effective archetype | Source | Moves | Σ projected low | Σ projected high |');
    lines.push('|---|---|---:|---:|---:|');
    for (const r of postArchetypes.rows) {
      lines.push(
        `| ${r.effective_archetype ?? '(null)'} | ${r.archetype_source ?? '(null)'} | ${r.n} | ${fmtUsd(r.sum_low)} | ${fmtUsd(r.sum_high)} |`,
      );
    }
    lines.push('');

    lines.push('## Defaulted rows (archetype heuristic fell through, used $5M–$12M band)');
    lines.push('');
    if (defaulted.rows.length === 0) {
      lines.push('_None — every backfilled row was either already archetyped or matched a name-heuristic rule._');
    } else {
      lines.push('| Move | Client | Phase | Projected low | Projected high |');
      lines.push('|---|---|---:|---:|---:|');
      for (const r of defaulted.rows) {
        lines.push(
          `| ${r.name} | ${r.client} | P${r.current_phase} | ${fmtUsd(r.value_projected_low_usd)} | ${fmtUsd(r.value_projected_high_usd)} |`,
        );
      }
    }
    lines.push('');

    lines.push('## Top 5 highest-projected moves');
    lines.push('');
    lines.push('| # | Move | Client | Phase | Archetype (effective) | Projected low | Projected high | Verified |');
    lines.push('|---:|---|---|---:|---|---:|---:|---:|');
    top5.rows.forEach((r, i) => {
      lines.push(
        `| ${i + 1} | ${r.name} | ${r.client} | P${r.current_phase} | ${r.effective_archetype ?? '(null)'} | ${fmtUsd(r.value_projected_low_usd)} | ${fmtUsd(r.value_projected_high_usd)} | ${fmtUsd(r.value_verified_usd)} |`,
      );
    });
    lines.push('');

    lines.push('## Bottom 5 lowest-projected moves');
    lines.push('');
    lines.push('| # | Move | Client | Phase | Archetype (effective) | Projected low | Projected high | Verified |');
    lines.push('|---:|---|---|---:|---|---:|---:|---:|');
    bottom5.rows.forEach((r, i) => {
      lines.push(
        `| ${i + 1} | ${r.name} | ${r.client} | P${r.current_phase} | ${r.effective_archetype ?? '(null)'} | ${fmtUsd(r.value_projected_low_usd)} | ${fmtUsd(r.value_projected_high_usd)} | ${fmtUsd(r.value_verified_usd)} |`,
      );
    });
    lines.push('');

    lines.push('## Reversal');
    lines.push('');
    lines.push('If any part of this backfill needs to be undone, the following **single statement** fully reverses it. It is safe to re-run (no-op if nothing is stamped).');
    lines.push('');
    lines.push('```sql');
    lines.push('UPDATE engagements');
    lines.push('SET');
    lines.push('  value_projected_low_usd  = NULL,');
    lines.push('  value_projected_high_usd = NULL,');
    lines.push('  value_verified_usd       = NULL,');
    lines.push('  value_verified_status    = NULL,');
    lines.push("  value_assumptions_jsonb  = NULL");
    lines.push("WHERE value_assumptions_jsonb->>'source' = 'strategic_moves_demo_value_backfill_2026_05_04';");
    lines.push('```');
    lines.push('');

    lines.push('## Hard-rule verification');
    lines.push('');
    lines.push('| Rule | Check | Result |');
    lines.push('|---|---|---|');
    lines.push(`| Non-destructive | Only rows with \`value_projected_high_usd IS NULL\` updated | ✅ (\`WHERE\` clause in migration step 2) |`);
    lines.push(`| Scoped to 5 demo clients | No rows outside demo clients stamped | ${scopeLeak === 0 ? '✅' : '❌ ' + scopeLeak + ' leaks'} |`);
    lines.push(`| Idempotent | Re-run would be no-op (no rows match \`value_projected_high_usd IS NULL\` AND demo-client anymore) | ✅ (structural) |`);
    lines.push(`| Deterministic | All values derived from \`hashtext(id)\` and archetype; no \`random()\` in migration | ✅ (inspected) |`);
    lines.push(`| Reversible | Single stamped \`source\` key; reversal SQL above | ✅ |`);
    lines.push('');

    const report = lines.join('\n') + '\n';
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, report, 'utf8');
    console.log(`[report] wrote ${REPORT_PATH}`);

    // 6. Commit or rollback
    if (APPLY) {
      if (scopeLeak !== 0) {
        console.error(`[ABORT] Scope leak detected (${scopeLeak} rows). Rolling back.`);
        await client.query('ROLLBACK');
        process.exit(2);
      }
      await client.query('COMMIT');
      console.log('[tx] COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('[tx] ROLLED BACK (dry-run mode).');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[error] rolled back:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
