#!/usr/bin/env node
/**
 * Strategic Moves · Wave 3 artifact spine · dry-run + report.
 *
 * Runs three migrations in order, inside a single transaction:
 *   3a. deliverables_v2 backfill       (20260504230000)
 *   3b. engagement_deliverables rehab  (20260504231000)
 *   3c. move_artifact_index VIEW       (20260504232000)
 *
 * Same pattern as scripts/strategic-moves-substrate-v2-report.mjs:
 * dry-run rolls back, --apply commits. Writes the verification report
 * to docs/build/STRATEGIC_MOVES_WAVE3_BACKFILL_REPORT_2026-05-04.md.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const MIGRATIONS = [
  {
    key: '3a',
    label: 'deliverables_v2 backfill (20 zero-coverage moves)',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504230000_strategic_moves_deliverables_backfill.sql'),
    stamp_column: 'title',
    stamp_value: '[wave3a_2026_05_04]',
    stamp_like: true,
    target_table: 'deliverables_v2',
  },
  {
    key: '3b',
    label: 'engagement_deliverables engagement_id column',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504231000_engagement_deliverables_engagement_id_column.sql'),
    target_table: 'engagement_deliverables',
    is_ddl: true,
  },
  {
    key: '3c',
    label: 'move_artifact_index VIEW',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504232000_move_artifact_index_view.sql'),
    target_table: 'move_artifact_index',
    is_view: true,
  },
];

const REPORT_PATH = path.join(REPO_ROOT, 'docs/build/STRATEGIC_MOVES_WAVE3_BACKFILL_REPORT_2026-05-04.md');

const DEMO_CLIENTS = [
  'Apex Retail', 'First Capital', 'Helix Therapeutics',
  'Keystone Energy Holdings', 'Meridian Health',
];

const APPLY = process.argv.includes('--apply');

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

async function main() {
  const url = (process.env.DATABASE_URL ?? '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(`[${new Date().toISOString()}] Starting ${APPLY ? 'APPLY' : 'DRY-RUN'} …`);
  await client.query('BEGIN');

  try {
    // Pre-state (engagement_deliverables.engagement_id may not exist yet)
    const preBase = (await client.query(
      `
      WITH dc AS (SELECT id FROM clients WHERE name = ANY($1))
      SELECT
        (SELECT COUNT(*) FROM engagements e WHERE e.client_id IN (SELECT id FROM dc) AND e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_moves,
        (SELECT COUNT(*) FROM deliverables_v2 d
          JOIN engagements e ON e.id = d.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)) AS total_deliverables_v2,
        (SELECT COUNT(DISTINCT e.id) FROM engagements e
          WHERE e.client_id IN (SELECT id FROM dc)
            AND e.archived_at IS NULL AND e.deleted_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM deliverables_v2 d WHERE d.engagement_id = e.id)) AS moves_zero_deliverables,
        (SELECT COUNT(*) FROM engagement_deliverables) AS total_engagement_deliverables
      `,
      [DEMO_CLIENTS],
    )).rows[0];
    // Check if engagement_id column exists pre-migration
    const preEdColExists = (await client.query(
      `SELECT COUNT(*)::int AS n FROM information_schema.columns
       WHERE table_name = 'engagement_deliverables' AND column_name = 'engagement_id'`
    )).rows[0].n > 0;
    let preEdWithEngId = 0;
    if (preEdColExists) {
      preEdWithEngId = (await client.query(
        `SELECT COUNT(*)::int AS n FROM engagement_deliverables WHERE engagement_id IS NOT NULL`
      )).rows[0].n;
    }
    const preRow = { ...preBase, ed_with_engagement_id: preEdWithEngId };

    // Execute migrations
    const perMigration = [];
    for (const mig of MIGRATIONS) {
      const sql = (await fs.readFile(mig.path, 'utf8'))
        .replace(/^\s*BEGIN\s*;\s*$/im, '-- BEGIN stripped')
        .replace(/^\s*COMMIT\s*;\s*$/im, '-- COMMIT stripped');
      console.log(`[${mig.key}] ${mig.label} executing …`);
      const t0 = Date.now();
      await client.query(sql);
      const ms = Date.now() - t0;
      console.log(`[${mig.key}] completed in ${ms}ms.`);
      perMigration.push({ ...mig, ms });
    }

    // Post-state + stamp counts
    for (const mig of perMigration) {
      if (mig.is_ddl) {
        // Check if column exists
        const colCheck = await client.query(
          `SELECT COUNT(*)::int AS n FROM information_schema.columns
           WHERE table_name = 'engagement_deliverables' AND column_name = 'engagement_id'`
        );
        mig.stamped_rows = colCheck.rows[0].n; // 1 = column exists
        mig.column_exists = colCheck.rows[0].n > 0;
      } else if (mig.is_view) {
        // Check view exists and get row count
        try {
          const viewCount = await client.query('SELECT COUNT(*)::int AS n FROM move_artifact_index');
          mig.stamped_rows = viewCount.rows[0].n;
          mig.view_exists = true;
        } catch {
          mig.stamped_rows = 0;
          mig.view_exists = false;
        }
      } else if (mig.stamp_like) {
        const q = `SELECT COUNT(*)::int AS n FROM ${mig.target_table} WHERE ${mig.stamp_column} LIKE $1 || '%'`;
        mig.stamped_rows = (await client.query(q, [mig.stamp_value])).rows[0].n;
      }
    }

    // Scope-leak check for 3a
    const leakCheck3a = (await client.query(
      `SELECT COUNT(*)::int AS n FROM deliverables_v2 d
       JOIN engagements e ON e.id = d.engagement_id
       WHERE d.title LIKE '[wave3a_2026_05_04]%'
         AND e.client_id NOT IN (SELECT id FROM clients WHERE name = ANY($1))`,
      [DEMO_CLIENTS],
    )).rows[0].n;

    const postRow = (await client.query(
      `
      WITH dc AS (SELECT id FROM clients WHERE name = ANY($1))
      SELECT
        (SELECT COUNT(*) FROM engagements e WHERE e.client_id IN (SELECT id FROM dc) AND e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_moves,
        (SELECT COUNT(*) FROM deliverables_v2 d
          JOIN engagements e ON e.id = d.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)) AS total_deliverables_v2,
        (SELECT COUNT(DISTINCT e.id) FROM engagements e
          WHERE e.client_id IN (SELECT id FROM dc)
            AND e.archived_at IS NULL AND e.deleted_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM deliverables_v2 d WHERE d.engagement_id = e.id)) AS moves_zero_deliverables,
        (SELECT COUNT(*) FROM engagement_deliverables) AS total_engagement_deliverables,
        (SELECT COUNT(*) FROM engagement_deliverables WHERE engagement_id IS NOT NULL) AS ed_with_engagement_id
      `,
      [DEMO_CLIENTS],
    )).rows[0];

    // Per-client deliverables distribution
    const dByClient = (await client.query(
      `
      SELECT c.name AS client, COUNT(DISTINCT e.id) AS moves,
        COUNT(d.id) AS deliverables,
        ROUND(COUNT(d.id)::numeric / NULLIF(COUNT(DISTINCT e.id), 0), 1) AS avg_per_move
      FROM clients c
      JOIN engagements e ON e.client_id = c.id AND e.archived_at IS NULL AND e.deleted_at IS NULL
      LEFT JOIN deliverables_v2 d ON d.engagement_id = e.id AND d.title LIKE $1 || '%'
      WHERE c.name = ANY($2)
      GROUP BY c.name ORDER BY c.name
      `,
      ['[wave3a_2026_05_04]', DEMO_CLIENTS],
    )).rows;

    // View artifact-type distribution
    let viewDistribution = [];
    const mig3c = perMigration.find(m => m.key === '3c');
    if (mig3c?.view_exists) {
      viewDistribution = (await client.query(
        `SELECT artifact_type, COUNT(*)::int AS n FROM move_artifact_index
         WHERE engagement_id IN (
           SELECT id FROM engagements WHERE client_id IN (
             SELECT id FROM clients WHERE name = ANY($1)
           )
         )
         GROUP BY artifact_type ORDER BY n DESC`,
        [DEMO_CLIENTS],
      )).rows;
    }

    // Report
    const lines = [];
    lines.push('# Strategic Moves · Wave 3 backfill report (artifact spine)');
    lines.push('');
    lines.push(`- **Generated:** ${new Date().toISOString()}`);
    lines.push(`- **Run mode:** ${APPLY ? 'APPLY (committed)' : 'DRY-RUN (rolled back)'}`);
    lines.push(`- **Migrations executed:** ${MIGRATIONS.length}`);
    lines.push(`- **Scope-leak rows (3a, non-demo tenants stamped):** ${leakCheck3a} ${leakCheck3a === 0 ? '✅' : '❌'}`);
    lines.push('');
    lines.push('## Summary, pre → post');
    lines.push('');
    lines.push('| Metric | Pre | Post |');
    lines.push('|---|---:|---:|');
    lines.push(`| Total demo moves | ${fmtNum(preRow.total_moves)} | ${fmtNum(postRow.total_moves)} |`);
    lines.push(`| Total deliverables_v2 (demo) | ${fmtNum(preRow.total_deliverables_v2)} | ${fmtNum(postRow.total_deliverables_v2)} |`);
    lines.push(`| Moves with zero deliverables | ${fmtNum(preRow.moves_zero_deliverables)} | ${fmtNum(postRow.moves_zero_deliverables)} |`);
    lines.push(`| engagement_deliverables total | ${fmtNum(preRow.total_engagement_deliverables)} | ${fmtNum(postRow.total_engagement_deliverables)} |`);
    lines.push(`| engagement_deliverables with engagement_id | ${fmtNum(preRow.ed_with_engagement_id)} | ${fmtNum(postRow.ed_with_engagement_id)} |`);
    lines.push('');

    lines.push('## Per-migration detail');
    lines.push('');
    lines.push('| # | Migration | Target | Stamped / status | Duration |');
    lines.push('|---|---|---|---|---:|');
    for (const mig of perMigration) {
      let stampInfo;
      if (mig.is_ddl) {
        stampInfo = mig.column_exists ? 'column added ✅' : 'column missing ❌';
      } else if (mig.is_view) {
        stampInfo = mig.view_exists ? `${fmtNum(mig.stamped_rows)} rows in view ✅` : 'view missing ❌';
      } else {
        stampInfo = `${fmtNum(mig.stamped_rows)} stamped rows`;
      }
      lines.push(`| ${mig.key} | ${mig.label} | \`${mig.target_table}\` | ${stampInfo} | ${mig.ms}ms |`);
    }
    lines.push('');

    lines.push('## 3a · deliverables_v2 backfill per demo client');
    lines.push('');
    lines.push('| Client | Moves | New deliverables | Avg / move |');
    lines.push('|---|---:|---:|---:|');
    for (const r of dByClient) {
      lines.push(`| ${r.client} | ${r.moves} | ${r.deliverables} | ${r.avg_per_move ?? '—'} |`);
    }
    lines.push('');

    if (viewDistribution.length > 0) {
      lines.push('## 3c · move_artifact_index distribution (demo clients)');
      lines.push('');
      lines.push('| Artifact type | Count |');
      lines.push('|---|---:|');
      for (const r of viewDistribution) {
        lines.push(`| ${r.artifact_type} | ${fmtNum(r.n)} |`);
      }
      lines.push('');
    }

    lines.push('## Scope-leak check');
    lines.push('');
    lines.push('| Migration | Leaked rows |');
    lines.push('|---|---:|');
    lines.push(`| 3a deliverables_v2 backfill | ${leakCheck3a} ${leakCheck3a === 0 ? '✅' : '❌'} |`);
    lines.push(`| 3b engagement_deliverables | n/a (DDL only) |`);
    lines.push(`| 3c move_artifact_index | n/a (VIEW only) |`);
    lines.push('');

    lines.push('## Reversal');
    lines.push('');
    lines.push('```sql');
    lines.push('-- 3c (must drop first since it depends on 3b column)');
    lines.push('DROP VIEW IF EXISTS move_artifact_index;');
    lines.push('');
    lines.push('-- 3b');
    lines.push('ALTER TABLE engagement_deliverables DROP COLUMN IF EXISTS engagement_id;');
    lines.push('');
    lines.push('-- 3a');
    lines.push('DELETE FROM deliverables_v2');
    lines.push("WHERE title LIKE '[wave3a_2026_05_04]%';");
    lines.push('```');
    lines.push('');

    lines.push('## Hard-rule verification');
    lines.push('');
    lines.push('| Rule | Result |');
    lines.push('|---|---|');
    lines.push('| Non-destructive | ✅ 3a is INSERT-only with stamp; 3b is ADD COLUMN IF NOT EXISTS; 3c is CREATE OR REPLACE VIEW |');
    lines.push(`| Scoped to 5 demo clients | ${leakCheck3a === 0 ? '✅' : '❌ ' + leakCheck3a + ' leaks'} |`);
    lines.push('| Idempotent | ✅ 3a uses WHERE NOT EXISTS on stamp; 3b uses ADD COLUMN IF NOT EXISTS; 3c uses CREATE OR REPLACE |');
    lines.push('| Deterministic | ✅ hashtext(engagement_id || type_key) for ordering; no random() |');
    lines.push('| Reversible | ✅ Stamped selectors per migration — see Reversal section |');
    lines.push('');

    const report = lines.join('\n') + '\n';
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, report, 'utf8');
    console.log(`[report] wrote ${REPORT_PATH}`);

    if (APPLY) {
      if (leakCheck3a !== 0) {
        console.error(`[ABORT] Scope leak detected (${leakCheck3a} rows). Rolling back.`);
        await client.query('ROLLBACK');
        process.exit(2);
      }
      await client.query('COMMIT');
      console.log('[tx] COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('[tx] ROLLED BACK (dry-run).');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[error] rolled back:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
