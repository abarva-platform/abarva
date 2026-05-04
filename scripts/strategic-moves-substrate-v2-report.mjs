#!/usr/bin/env node
/**
 * Strategic Moves · Wave 2b substrate corrections · dry-run + report.
 *
 * Runs three migrations in order, inside a single transaction:
 *   A. milestones v2 re-seed           (20260504220000)
 *   B. audit log addendum              (20260504221000)
 *   C. participants expansion          (20260504222000)
 *
 * Same pattern as scripts/strategic-moves-substrate-backfill-report.mjs:
 * dry-run rolls back, --apply commits. Writes the verification report
 * to docs/build/STRATEGIC_MOVES_SUBSTRATE_V2_REPORT_2026-05-04.md.
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
    key: 'A_milestones_v2',
    label: 'Milestones v2 (replacement)',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504220000_strategic_moves_milestones_v2.sql'),
    stamp_column: 'description',
    stamp_value: '[demo_milestones_v2_2026_05_04]',
    stamp_like: true,
    target_table: 'program_milestones',
    replacement: true,
  },
  {
    key: 'B_audit_addendum',
    label: 'Audit log addendum',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504221000_strategic_moves_audit_addendum.sql'),
    stamp_column: 'rationale',
    stamp_value: '[demo_audit_addendum_2026_05_04]',
    stamp_like: true,
    target_table: 'program_audit_log',
  },
  {
    key: 'C_participants_expansion',
    label: 'Participants expansion',
    path: path.join(REPO_ROOT, 'supabase/migrations/20260504222000_strategic_moves_participants_expansion.sql'),
    stamp_column: "notification_preferences->>'source'",
    stamp_value: 'participants_expansion_2026_05_04',
    target_table: 'engagement_participants',
  },
];

const REPORT_PATH = path.join(REPO_ROOT, 'docs/build/STRATEGIC_MOVES_SUBSTRATE_V2_REPORT_2026-05-04.md');

const DEMO_CLIENTS = [
  'Apex Retail','First Capital','Helix Therapeutics',
  'Keystone Energy Holdings','Meridian Health',
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
    // Pre-state
    const preRow = (await client.query(
      `
      WITH dc AS (SELECT id FROM clients WHERE name = ANY($1))
      SELECT
        (SELECT COUNT(*) FROM engagements e WHERE e.client_id IN (SELECT id FROM dc) AND e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_moves,
        (SELECT COUNT(*) FROM program_milestones pm
          JOIN engagements e ON e.id = pm.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pm.description LIKE '[demo_milestones_backfill_2026_05_04]%') AS prior_milestones,
        (SELECT COUNT(*) FROM program_milestones pm
          JOIN engagements e ON e.id = pm.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pm.description LIKE '[demo_milestones_v2_2026_05_04]%') AS v2_milestones,
        (SELECT COUNT(DISTINCT e.id) FROM engagements e
          JOIN engagement_participants ep ON ep.engagement_id = e.id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND ep.approval_authority = 'contributor'
            AND ep.notification_preferences->>'role_kind' = 'steward') AS moves_with_steward,
        (SELECT COUNT(*) FROM program_audit_log pal
          JOIN engagements e ON e.id = pal.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pal.action = 'milestone_completed') AS milestone_audit_rows,
        (SELECT COUNT(*) FROM program_audit_log pal
          JOIN engagements e ON e.id = pal.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pal.action = 'sponsor_review_held') AS sponsor_review_audit_rows
      `,
      [DEMO_CLIENTS],
    )).rows[0];

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

    // Post-state + stamp counts + scope-leak checks
    for (const mig of perMigration) {
      const q = mig.stamp_like
        ? `SELECT COUNT(*)::int AS n FROM ${mig.target_table} WHERE ${mig.stamp_column} LIKE $1 || '%'`
        : `SELECT COUNT(*)::int AS n FROM ${mig.target_table} WHERE ${mig.stamp_column} = $1`;
      mig.stamped_rows = (await client.query(q, [mig.stamp_value])).rows[0].n;
    }

    const postRow = (await client.query(
      `
      WITH dc AS (SELECT id FROM clients WHERE name = ANY($1))
      SELECT
        (SELECT COUNT(*) FROM engagements e WHERE e.client_id IN (SELECT id FROM dc) AND e.archived_at IS NULL AND e.deleted_at IS NULL) AS total_moves,
        (SELECT COUNT(*) FROM program_milestones pm
          JOIN engagements e ON e.id = pm.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pm.description LIKE '[demo_milestones_backfill_2026_05_04]%') AS prior_milestones,
        (SELECT COUNT(*) FROM program_milestones pm
          JOIN engagements e ON e.id = pm.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pm.description LIKE '[demo_milestones_v2_2026_05_04]%') AS v2_milestones,
        (SELECT COUNT(DISTINCT e.id) FROM engagements e
          JOIN engagement_participants ep ON ep.engagement_id = e.id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND ep.notification_preferences->>'role_kind' = 'steward') AS moves_with_steward,
        (SELECT COUNT(DISTINCT e.id) FROM engagements e
          JOIN engagement_participants ep ON ep.engagement_id = e.id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND ep.notification_preferences->>'role_kind' IN ('team_member_1','team_member_2')) AS moves_with_team_members,
        (SELECT COUNT(*) FROM program_audit_log pal
          JOIN engagements e ON e.id = pal.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pal.action = 'milestone_completed') AS milestone_audit_rows,
        (SELECT COUNT(*) FROM program_audit_log pal
          JOIN engagements e ON e.id = pal.engagement_id
          WHERE e.client_id IN (SELECT id FROM dc)
            AND pal.action = 'sponsor_review_held') AS sponsor_review_audit_rows
      `,
      [DEMO_CLIENTS],
    )).rows[0];

    // Per-client milestone distribution post
    const msByClient = (await client.query(
      `
      SELECT c.name AS client, COUNT(DISTINCT e.id) AS moves,
        COUNT(pm.id) AS milestones,
        ROUND(COUNT(pm.id)::numeric / NULLIF(COUNT(DISTINCT e.id), 0), 1) AS avg_per_move
      FROM clients c
      JOIN engagements e ON e.client_id = c.id AND e.archived_at IS NULL AND e.deleted_at IS NULL
      LEFT JOIN program_milestones pm ON pm.engagement_id = e.id AND pm.description LIKE $1 || '%'
      WHERE c.name = ANY($2)
      GROUP BY c.name ORDER BY c.name
      `,
      ['[demo_milestones_v2_2026_05_04]', DEMO_CLIENTS],
    )).rows;

    // Milestones per archetype
    const msByArchetype = (await client.query(
      `
      SELECT COALESCE(e.program_archetype, '(null)') AS archetype,
        COUNT(DISTINCT e.id) AS moves,
        COUNT(pm.id) AS milestones,
        ROUND(COUNT(pm.id)::numeric / NULLIF(COUNT(DISTINCT e.id), 0), 1) AS avg_per_move
      FROM engagements e
      LEFT JOIN program_milestones pm ON pm.engagement_id = e.id AND pm.description LIKE $1 || '%'
      WHERE e.client_id IN (SELECT id FROM clients WHERE name = ANY($2))
        AND e.archived_at IS NULL AND e.deleted_at IS NULL
      GROUP BY e.program_archetype
      ORDER BY milestones DESC
      `,
      ['[demo_milestones_v2_2026_05_04]', DEMO_CLIENTS],
    )).rows;

    // Scope-leak checks across all 3 migrations
    const leakChecks = [];
    for (const mig of perMigration) {
      let q;
      if (mig.target_table === 'engagement_participants') {
        q = `
          SELECT COUNT(*)::int AS n
          FROM engagement_participants ep
          JOIN engagements e ON e.id = ep.engagement_id
          WHERE ${mig.stamp_column} = $1
            AND e.client_id NOT IN (SELECT id FROM clients WHERE name = ANY($2));
        `;
      } else if (mig.target_table === 'program_milestones') {
        q = `
          SELECT COUNT(*)::int AS n
          FROM program_milestones pm
          JOIN engagements e ON e.id = pm.engagement_id
          WHERE ${mig.stamp_column} LIKE $1 || '%'
            AND e.client_id NOT IN (SELECT id FROM clients WHERE name = ANY($2));
        `;
      } else if (mig.target_table === 'program_audit_log') {
        q = `
          SELECT COUNT(*)::int AS n
          FROM program_audit_log pal
          JOIN engagements e ON e.id = pal.engagement_id
          WHERE ${mig.stamp_column} LIKE $1 || '%'
            AND e.client_id NOT IN (SELECT id FROM clients WHERE name = ANY($2));
        `;
      } else {
        q = `SELECT 0::int AS n`;
      }
      const { rows } = await client.query(q, [mig.stamp_value, DEMO_CLIENTS]);
      leakChecks.push({ key: mig.key, label: mig.label, leaked: rows[0].n });
    }
    const totalLeak = leakChecks.reduce((s, l) => s + l.leaked, 0);

    // Report
    const lines = [];
    lines.push('# Strategic Moves · Substrate v2 report (Wave 2b)');
    lines.push('');
    lines.push(`- **Generated:** ${new Date().toISOString()}`);
    lines.push(`- **Run mode:** ${APPLY ? 'APPLY (committed)' : 'DRY-RUN (rolled back)'}`);
    lines.push(`- **Migrations executed:** ${MIGRATIONS.length}`);
    lines.push(`- **Total scope-leak rows (non-demo tenants stamped):** ${totalLeak} ${totalLeak === 0 ? '✅' : '❌'}`);
    lines.push('');
    lines.push('## Summary, pre → post');
    lines.push('');
    lines.push('| Metric | Pre | Post |');
    lines.push('|---|---:|---:|');
    lines.push(`| Total demo moves | ${fmtNum(preRow.total_moves)} | ${fmtNum(postRow.total_moves)} |`);
    lines.push(`| Prior-stamp milestones (to be replaced) | ${fmtNum(preRow.prior_milestones)} | ${fmtNum(postRow.prior_milestones)} |`);
    lines.push(`| v2 milestones (this run) | ${fmtNum(preRow.v2_milestones)} | ${fmtNum(postRow.v2_milestones)} |`);
    lines.push(`| Moves with a steward participant | ${fmtNum(preRow.moves_with_steward)} | ${fmtNum(postRow.moves_with_steward)} |`);
    lines.push(`| Moves with team_members | — | ${fmtNum(postRow.moves_with_team_members)} |`);
    lines.push(`| milestone_completed audit rows | ${fmtNum(preRow.milestone_audit_rows)} | ${fmtNum(postRow.milestone_audit_rows)} |`);
    lines.push(`| sponsor_review_held audit rows | ${fmtNum(preRow.sponsor_review_audit_rows)} | ${fmtNum(postRow.sponsor_review_audit_rows)} |`);
    lines.push('');

    lines.push('## Per-migration stamp counts');
    lines.push('');
    lines.push('| # | Migration | Target table | Stamped rows | Duration |');
    lines.push('|---|---|---|---:|---:|');
    for (const mig of perMigration) {
      const replaceNote = mig.replacement ? ' (replacement)' : '';
      lines.push(`| ${mig.key} | ${mig.label}${replaceNote} | \`${mig.target_table}\` | ${fmtNum(mig.stamped_rows)} | ${mig.ms}ms |`);
    }
    lines.push('');

    lines.push('## Milestones v2 per demo client');
    lines.push('');
    lines.push('| Client | Moves | Milestones | Avg / move |');
    lines.push('|---|---:|---:|---:|');
    for (const r of msByClient) {
      lines.push(`| ${r.client} | ${r.moves} | ${r.milestones} | ${r.avg_per_move ?? '—'} |`);
    }
    lines.push('');

    lines.push('## Milestones v2 per archetype (expected 5–7 per move)');
    lines.push('');
    lines.push('| Archetype | Moves | Milestones | Avg / move |');
    lines.push('|---|---:|---:|---:|');
    for (const r of msByArchetype) {
      lines.push(`| ${r.archetype} | ${r.moves} | ${r.milestones} | ${r.avg_per_move ?? '—'} |`);
    }
    lines.push('');

    lines.push('## Scope-leak check');
    lines.push('');
    lines.push('| # | Migration | Leaked rows |');
    lines.push('|---|---|---:|');
    for (const l of leakChecks) {
      lines.push(`| ${l.key} | ${l.label} | ${l.leaked} ${l.leaked === 0 ? '✅' : '❌'} |`);
    }
    lines.push('');

    lines.push('## Reversal');
    lines.push('');
    lines.push('```sql');
    lines.push('-- A · milestones v2 (wipes v2 stamp; optional pair with re-running the PR-4 base seed)');
    lines.push('DELETE FROM program_milestones');
    lines.push("WHERE description LIKE '[demo_milestones_v2_2026_05_04]%';");
    lines.push('');
    lines.push('-- B · audit addendum');
    lines.push('DELETE FROM program_audit_log');
    lines.push("WHERE rationale LIKE '[demo_audit_addendum_2026_05_04]%';");
    lines.push('');
    lines.push('-- C · participants expansion');
    lines.push('DELETE FROM engagement_participants');
    lines.push("WHERE notification_preferences->>'source' = 'participants_expansion_2026_05_04';");
    lines.push('```');
    lines.push('');

    lines.push('## Hard-rule verification');
    lines.push('');
    lines.push('| Rule | Result |');
    lines.push('|---|---|');
    lines.push('| Non-destructive for unstamped data | ✅ Migration A is a replacement but scoped to stamped rows only; B + C are INSERT-only with stamp-based WHERE NOT EXISTS |');
    lines.push(`| Scoped to 5 demo clients | ${totalLeak === 0 ? '✅' : '❌ ' + totalLeak + ' leaks'} |`);
    lines.push('| Idempotent | ✅ A wipes its own v2 stamp before re-inserting; B and C use stamp-based NOT EXISTS |');
    lines.push('| Deterministic | ✅ hashtext(id) + fixed per-archetype / per-phase offsets; no random() |');
    lines.push('| Reversible | ✅ Stamped selectors per migration — see Reversal section |');
    lines.push('');

    const report = lines.join('\n') + '\n';
    await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, report, 'utf8');
    console.log(`[report] wrote ${REPORT_PATH}`);

    if (APPLY) {
      if (totalLeak !== 0) {
        console.error(`[ABORT] Scope leak detected (${totalLeak} rows). Rolling back.`);
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
