import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { postgresClientOptions } from './postgres-client-options';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

interface Options {
  databaseUrl: string;
  tenantKey: string;
  dryRun: boolean;
  commitFixture: boolean;
}

interface MutationAttempt {
  action: 'update' | 'delete';
  role: string;
  visibleRows: number | null;
  status: 'blocked' | 'failed';
  reason: string;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    databaseUrl: process.env.DATABASE_URL ?? '',
    tenantKey: 'apex-retail',
    dryRun: false,
    commitFixture: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split('=', 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case '--database-url':
        options.databaseUrl = nextValue;
        if (consume) index += 1;
        break;
      case '--tenant-key':
        options.tenantKey = nextValue;
        if (consume) index += 1;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--commit-fixture':
        options.commitFixture = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  if (!options.dryRun && !options.databaseUrl) {
    throw new Error('Missing DATABASE_URL or --database-url. Use --dry-run to inspect the assertion plan.');
  }
  if (!options.tenantKey.trim()) {
    throw new Error('Missing --tenant-key.');
  }

  return options;
}

async function tableExists(client: Client): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `
      select exists (
        select 1
          from information_schema.tables
         where table_schema = 'public'
           and table_name = 'sensitive_upload_audit'
      ) as exists
    `,
  );
  return result.rows[0]?.exists === true;
}

async function insertFixture(client: Client, tenantKey: string): Promise<string> {
  const filename = `l10-immutability-${Date.now()}.txt`;
  const result = await client.query<{ id: string }>(
    `
      insert into sensitive_upload_audit (
        tenant_client_key,
        ingestion_tier,
        uploader_user_id,
        filename,
        mime_type,
        size_bytes,
        sha256,
        pattern_decision,
        purview_reached,
        purview_labels,
        final_decision,
        reason_codes,
        metadata
      )
      values (
        $1,
        'tier2_blob',
        'l10-immutability-runner',
        $2,
        'text/plain',
        1,
        $3,
        'quarantine',
        false,
        '[]'::jsonb,
        'quarantine',
        array['l10_immutability_probe'],
        $4::jsonb
      )
      returning id::text
    `,
    [
      tenantKey,
      filename,
      `sha256-${filename}`,
      JSON.stringify({ l10Probe: true, generatedBy: 'assert-sensitive-upload-audit-immutability' }),
    ],
  );

  const id = result.rows[0]?.id;
  if (!id) throw new Error('Fixture insert did not return an id.');
  return id;
}

async function applyAuthenticatedContext(client: Client, tenantKey: string, role: string): Promise<void> {
  await client.query('select set_config($1, $2, true)', [
    'request.jwt.claims',
    JSON.stringify({
      tenant_key: tenantKey,
      role,
      sub: 'l10-immutability-runner',
    }),
  ]);
  await client.query('set local role authenticated');
}

async function attemptMutation(
  client: Client,
  action: 'update' | 'delete',
  role: string,
  tenantKey: string,
  rowId: string,
): Promise<MutationAttempt> {
  const savepoint = `probe_${action}_${role.replace(/[^a-z0-9_]/gi, '_')}`;
  await client.query(`savepoint ${savepoint}`);

  let visibleRows: number | null = null;
  try {
    await applyAuthenticatedContext(client, tenantKey, role);
    const visible = await client.query<{ count: string }>(
      'select count(*)::text from sensitive_upload_audit where id = $1',
      [rowId],
    );
    visibleRows = Number(visible.rows[0]?.count ?? '0');
    if (visibleRows !== 1) {
      throw new Error(`authenticated role could not see its own fixture row; visibleRows=${visibleRows}`);
    }

    if (action === 'update') {
      const result = await client.query(
        `
          update sensitive_upload_audit
             set final_decision = 'allow',
                 metadata = metadata || '{"unexpected_mutation": true}'::jsonb
           where id = $1
        `,
        [rowId],
      );
      if ((result.rowCount ?? 0) > 0) {
        throw new Error('UPDATE mutated the original audit row');
      }
      return {
        action,
        role,
        visibleRows,
        status: 'blocked',
        reason: 'UPDATE affected zero rows under authenticated role',
      };
    }

    const result = await client.query('delete from sensitive_upload_audit where id = $1', [rowId]);
    if ((result.rowCount ?? 0) > 0) {
      throw new Error('DELETE removed the original audit row');
    }
    return {
      action,
      role,
      visibleRows,
      status: 'blocked',
      reason: 'DELETE affected zero rows under authenticated role',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const allowedBlockers = [
      'permission denied',
      'violates row-level security',
      'policy',
      'not permitted',
      'must be owner',
    ];
    if (allowedBlockers.some((fragment) => message.toLowerCase().includes(fragment))) {
      return {
        action,
        role,
        visibleRows,
        status: 'blocked',
        reason: message,
      };
    }
    return {
      action,
      role,
      visibleRows,
      status: 'failed',
      reason: message,
    };
  } finally {
    await client.query(`rollback to savepoint ${savepoint}`);
    await client.query(`release savepoint ${savepoint}`);
  }
}

async function insertLifecycleRows(client: Client, rowId: string, tenantKey: string): Promise<number> {
  await client.query('reset role');
  const result = await client.query<{ count: string }>(
    `
      with parent_row as (
        select tenant_client_key, ingestion_tier, filename, mime_type, size_bytes, sha256, storage_path
          from sensitive_upload_audit
         where id = $1
      ),
      release_row as (
        insert into sensitive_upload_audit (
          parent_id, tenant_client_key, ingestion_tier, filename, mime_type, size_bytes,
          sha256, pattern_decision, purview_reached, final_decision, released_at,
          released_by, release_note, storage_path, reason_codes
        )
        select $1::uuid, tenant_client_key, ingestion_tier, filename, mime_type, size_bytes,
               sha256, 'allow', false, 'released', now(),
               'l10-immutability-runner', 'L10 append-only release fixture',
               storage_path, array[]::text[]
          from parent_row
        returning id
      ),
      delete_row as (
        insert into sensitive_upload_audit (
          parent_id, tenant_client_key, ingestion_tier, filename, mime_type, size_bytes,
          sha256, pattern_decision, purview_reached, final_decision, released_at,
          released_by, release_note, storage_path, reason_codes
        )
        select $1::uuid, tenant_client_key, ingestion_tier, filename, mime_type, size_bytes,
               sha256, 'quarantine', false, 'hard_deleted', now(),
               'l10-immutability-runner', 'L10 append-only hard-delete fixture',
               storage_path, array['hard_deleted_by_reviewer']
          from parent_row
        returning id
      )
      select (
        (select count(*) from release_row) +
        (select count(*) from delete_row)
      )::text as count
    `,
    [rowId],
  );

  const count = Number(result.rows[0]?.count ?? '0');
  if (count !== 2) {
    throw new Error(`Expected two lifecycle rows for ${tenantKey}; inserted ${count}.`);
  }
  return count;
}

async function verifyOriginalUnchanged(client: Client, rowId: string): Promise<void> {
  await client.query('reset role');
  const result = await client.query<{ final_decision: string; child_count: string }>(
    `
      select p.final_decision,
             (select count(*)::text from sensitive_upload_audit c where c.parent_id = p.id) as child_count
        from sensitive_upload_audit p
       where p.id = $1
    `,
    [rowId],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Original fixture row disappeared.');
  if (row.final_decision !== 'quarantine') {
    throw new Error(`Original row final_decision changed to ${row.final_decision}.`);
  }
  if (Number(row.child_count) !== 2) {
    throw new Error(`Expected two lifecycle children; observed ${row.child_count}.`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.dryRun) {
    console.log(JSON.stringify({
      status: 'pass',
      dryRun: true,
      tenantKey: options.tenantKey,
      checks: [
        'insert synthetic quarantine audit row inside transaction',
        'SET LOCAL ROLE authenticated with tenant JWT claims',
        'assert UPDATE is blocked',
        'assert DELETE is blocked',
        'insert release and hard-delete lifecycle rows as append-only evidence',
        options.commitFixture ? 'commit fixture rows' : 'rollback fixture rows',
      ],
    }, null, 2));
    return;
  }

  const client = new Client(postgresClientOptions(options.databaseUrl, 'l10-sensitive-upload-immutability'));
  await client.connect();

  const attempts: MutationAttempt[] = [];
  let fixtureId: string | null = null;
  try {
    if (!await tableExists(client)) {
      throw new Error('sensitive_upload_audit table is not present.');
    }

    await client.query('begin');
    fixtureId = await insertFixture(client, options.tenantKey);

    for (const role of ['observer', 'tenant_admin']) {
      attempts.push(await attemptMutation(client, 'update', role, options.tenantKey, fixtureId));
      attempts.push(await attemptMutation(client, 'delete', role, options.tenantKey, fixtureId));
    }

    const failed = attempts.filter((attempt) => attempt.status === 'failed');
    if (failed.length > 0) {
      throw new Error(`Mutation assertion failed: ${failed.map((attempt) => `${attempt.role}/${attempt.action}: ${attempt.reason}`).join('; ')}`);
    }

    const lifecycleRows = await insertLifecycleRows(client, fixtureId, options.tenantKey);
    await verifyOriginalUnchanged(client, fixtureId);

    if (options.commitFixture) {
      await client.query('commit');
    } else {
      await client.query('rollback');
    }

    console.log(JSON.stringify({
      status: 'pass',
      tenantKey: options.tenantKey,
      fixtureId,
      fixtureCommitted: options.commitFixture,
      attempts,
      lifecycleRows,
    }, null, 2));
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
      // best-effort cleanup after failed transaction
    }
    console.error(JSON.stringify({
      status: 'fail',
      tenantKey: options.tenantKey,
      fixtureId,
      attempts,
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
