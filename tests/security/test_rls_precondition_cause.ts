/**
 * C-632 — the L4 isolation precondition must report what it observed, and tell
 * `absent` apart from `invisible`.
 *
 * WHY THIS NEEDS A REAL DATABASE AND NOT A STRING ASSERTION
 *
 * `tests/security/rls-regression-contract.test.ts` already asserts that the
 * precondition's sentence appears in the SQL. That is the gate shape this
 * backlog exists against: it proves a token is present, not that the check can
 * tell two causes apart. The only way to prove the discrimination is to build
 * two databases that the connecting role cannot distinguish by looking — one
 * where the canonical rows are absent, one where they are present and filtered
 * away by row-level security — and require the raised message to name the right
 * one.
 *
 * WHAT WAS MEASURED BEFORE THIS TEST WAS WRITTEN, because it decided the fixture
 *
 * `public.clients` carries one policy, `FOR ALL TO service_role`
 * (supabase/migrations/20260516093000_clients_service_role_policy.sql). Policy
 * role matching is inheritance-aware, so on Postgres 18:
 *
 *   • a role GRANTed service_role with inheritance sees every row, because the
 *     policy applies to it through that membership — it never reaches the
 *     precondition at all;
 *   • a role with no service_role membership sees zero rows AND is refused
 *     `SET ROLE service_role`, so it has no privileged vantage to compare
 *     against;
 *   • a role GRANTed service_role NOINHERIT sees zero rows and may still
 *     borrow the role on demand.
 *
 * So the vantage the acceptance prefers is reachable in exactly one of the three
 * role shapes, and the suite has to say so rather than guess when it is not.
 * That third shape is what the `absent`/`invisible` pair below connects as: the
 * two cases differ ONLY in whether the row is there, never in the vantage.
 *
 * Run: node --import tsx --test tests/security/test_rls_precondition_cause.ts
 * with RLS_PRECONDITION_TEST_DATABASE_URL pointing at a DISPOSABLE Postgres.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { Client } from 'pg';

const ADMIN_URL = process.env.RLS_PRECONDITION_TEST_DATABASE_URL;
if (!ADMIN_URL) {
  throw new Error(
    'RLS_PRECONDITION_TEST_DATABASE_URL is required. This test builds and drops roles, ' +
      'a table and policies, so it must point at a disposable Postgres — never at a shared ' +
      'control database.',
  );
}

// Refuse anything that is not plainly local, for the same reason the ECL
// admission tests do: this file issues DDL and DELETEs.
{
  const parsed = new URL(ADMIN_URL);
  const host = parsed.hostname;
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    throw new Error(
      `Refusing to run destructive fixture DDL against host "${host}". ` +
        'This test is only valid against a disposable local Postgres.',
    );
  }
}

// Neutral fixture keys on purpose. The suite resolves CANONICAL_TENANT_KEYS in
// production; here the keys only need to NOT resolve, so they carry no tenant
// name -- this repository is public, and a habit is easier to keep than to
// acquire once real engagements exist.
const CANONICAL_FIXTURE_KEYS = ['fixture-tenant-alpha', 'fixture-tenant-beta'];

/**
 * The region of the shipped suite that is under test, read out of the suite
 * itself so this test cannot drift into proving a copy. Spans the canonical
 * tenant resolution and the precondition that classifies an unresolved key.
 */
function readPreconditionRegion(): string {
  const sqlPath = path.resolve(process.cwd(), 'tests/security/rls-regression.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  const start = sql.indexOf('CREATE TEMP TABLE rls_regression_tenants');
  assert.notEqual(start, -1, 'rls-regression.sql no longer creates rls_regression_tenants');
  const endMarker = '$verify_tenants$;';
  const end = sql.indexOf(endMarker, start);
  assert.notEqual(end, -1, 'rls-regression.sql no longer closes the $verify_tenants$ block');
  const region = sql.slice(start, end + endMarker.length);
  // Guard the extraction itself: if the region stops containing the resolution
  // or the raise, the slice is wrong and every case below would pass vacuously.
  assert.match(region, /LEFT JOIN public\.clients/, 'extracted region lost the client resolution');
  // Deliberately NOT asserting /RAISE EXCEPTION/ here. It was, and it made the
  // relax-into-a-warning mutation fail at import — which looks like a catch but
  // proves only that the file still contains a word. The refusal is a behaviour,
  // so the cases below prove it by driving the block and requiring a raise.
  assert.match(region, /rls-regression precondition:/, 'extracted region lost the precondition');
  return region;
}

const PRECONDITION_SQL = readPreconditionRegion();

/** Roles and table the fixture owns. Dropped and rebuilt on every run. */
const FIXTURE_ROLES = [
  'c632_probe_noinherit',
  'c632_probe_nosvc',
  'c632_probe_inherit',
  'c632_table_owner',
];

let admin: Client;

async function connectAs(role: string): Promise<Client> {
  const url = new URL(ADMIN_URL!);
  url.username = role;
  url.password = role;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  return client;
}

/**
 * Drive the shipped precondition as `role`, with the canonical keys supplied the
 * way scripts/run-rls-regression.ts supplies them. Returns the raised message,
 * or null when the precondition passed.
 */
async function runPrecondition(role: string): Promise<string | null> {
  const client = await connectAs(role);
  try {
    await client.query('BEGIN');
    await client.query(
      'CREATE TEMP TABLE rls_regression_expected_tenants (tenant_key TEXT PRIMARY KEY) ON COMMIT DROP',
    );
    for (const key of CANONICAL_FIXTURE_KEYS) {
      await client.query('INSERT INTO rls_regression_expected_tenants (tenant_key) VALUES ($1)', [key]);
    }
    await client.query(PRECONDITION_SQL);
    await client.query('COMMIT');
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  } finally {
    await client.end().catch(() => {});
  }
}

async function setCanonicalRowsPresent(present: boolean): Promise<void> {
  if (present) {
    for (const key of CANONICAL_FIXTURE_KEYS) {
      await admin.query(
        'INSERT INTO public.clients (tenant_key) VALUES ($1) ON CONFLICT (tenant_key) DO NOTHING',
        [key],
      );
    }
  } else {
    await admin.query('DELETE FROM public.clients WHERE tenant_key = ANY($1)', [
      CANONICAL_FIXTURE_KEYS,
    ]);
  }
}

before(async () => {
  admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();

  await admin.query('DROP TABLE IF EXISTS public.clients CASCADE');
  // Re-runnable: a role holding any granted privilege cannot be dropped, so
  // shed what each fixture role owns and was granted first. Without this a
  // second run collapses in this hook, and a collapsed suite reads exactly
  // like a caught mutation.
  for (const role of FIXTURE_ROLES) {
    await admin.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN ` +
        `EXECUTE 'DROP OWNED BY ${role} CASCADE'; END IF; END $$`,
    );
    await admin.query(`DROP ROLE IF EXISTS ${role}`);
  }
  for (const role of ['service_role', 'authenticated']) {
    await admin.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role} NOLOGIN; END IF; END $$`,
    );
  }

  await admin.query('CREATE ROLE c632_table_owner NOLOGIN');
  await admin.query('GRANT CREATE, USAGE ON SCHEMA public TO c632_table_owner');

  // The table is owned by a role NONE of the probe roles belong to, because a
  // table owner bypasses row security unless FORCE is set — an owner-connected
  // suite could never observe the `invisible` state at all.
  await admin.query('SET ROLE c632_table_owner');
  await admin.query(
    'CREATE TABLE public.clients (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_key TEXT UNIQUE NOT NULL)',
  );
  // Mirrors supabase/migrations/20260516093000_clients_service_role_policy.sql.
  await admin.query('ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY');
  await admin.query(
    'CREATE POLICY service_role_all_clients ON public.clients FOR ALL TO service_role USING (true) WITH CHECK (true)',
  );
  await admin.query('GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO service_role');
  await admin.query('RESET ROLE');

  // Three connecting-role shapes, each one a vantage the real suite could have.
  await admin.query("CREATE ROLE c632_probe_noinherit LOGIN NOINHERIT PASSWORD 'c632_probe_noinherit'");
  await admin.query('GRANT service_role TO c632_probe_noinherit');
  await admin.query("CREATE ROLE c632_probe_nosvc LOGIN PASSWORD 'c632_probe_nosvc'");
  await admin.query("CREATE ROLE c632_probe_inherit LOGIN PASSWORD 'c632_probe_inherit'");
  await admin.query('GRANT service_role TO c632_probe_inherit');

  for (const role of ['c632_probe_noinherit', 'c632_probe_nosvc', 'c632_probe_inherit']) {
    await admin.query(`GRANT USAGE, CREATE ON SCHEMA public TO ${role}`);
    await admin.query(`GRANT SELECT ON public.clients TO ${role}`);
  }
  await admin.query('GRANT USAGE ON SCHEMA public TO service_role');
});

after(async () => {
  if (!admin) return;
  await admin.query('DROP TABLE IF EXISTS public.clients CASCADE').catch(() => {});
  for (const role of FIXTURE_ROLES) {
    await admin.query(`DROP OWNED BY ${role} CASCADE`).catch(() => {});
    await admin.query(`DROP ROLE IF EXISTS ${role}`).catch(() => {});
  }
  await admin.end().catch(() => {});
});

describe('C-632 · the L4 precondition distinguishes an absent row from an invisible one', () => {
  it('states the fixture really is indistinguishable by looking, or the pair below proves nothing', async () => {
    await setCanonicalRowsPresent(true);
    const probe = await connectAs('c632_probe_noinherit');
    try {
      const visiblePresent = await probe.query('SELECT count(*)::int AS n FROM public.clients');
      assert.equal(
        visiblePresent.rows[0].n,
        0,
        'the probe role can see the rows, so the invisible case is not being exercised',
      );
    } finally {
      await probe.end();
    }

    await setCanonicalRowsPresent(false);
    const probeAbsent = await connectAs('c632_probe_noinherit');
    try {
      const visibleAbsent = await probeAbsent.query('SELECT count(*)::int AS n FROM public.clients');
      assert.equal(visibleAbsent.rows[0].n, 0, 'expected zero visible rows in the absent case too');
    } finally {
      await probeAbsent.end();
    }
    // Both halves of the pair look identical from the connecting role: zero
    // rows. Anything the suite says to tell them apart has to come from a
    // vantage, not from this count.
  });

  it('classifies rows that exist but are filtered away as invisible, and refuses the migration remedy', async () => {
    await setCanonicalRowsPresent(true);
    const message = await runPrecondition('c632_probe_noinherit');

    assert.ok(message, 'a suite that probed nothing must still refuse; it must not pass');
    assert.match(
      message,
      /cause=invisible/,
      `expected the precondition to classify this as invisible. Got: ${message}`,
    );
    // The remedy is the half that caused the harm: prescribing a canonicalization
    // migration against a control database that is already correct.
    assert.doesNotMatch(
      message,
      /Run db:migrate \+ (the )?canonicalization migration/,
      `the rows exist; the precondition must not prescribe a canonicalization migration. Got: ${message}`,
    );
  });

  it('classifies rows that are genuinely not there as absent', async () => {
    await setCanonicalRowsPresent(false);
    const message = await runPrecondition('c632_probe_noinherit');

    assert.ok(message, 'an unresolved canonical key must still refuse');
    assert.match(
      message,
      /cause=absent/,
      `expected the precondition to classify this as absent. Got: ${message}`,
    );
  });

  it('reports the observation — connecting role, whether row security is enforced against it, and the row count it can see', async () => {
    await setCanonicalRowsPresent(true);
    const message = await runPrecondition('c632_probe_noinherit');

    assert.ok(message);
    assert.match(message, /c632_probe_noinherit/, `expected the connecting role to be named. Got: ${message}`);
    assert.match(
      message,
      /enforced against this role=(t|true|yes)/i,
      `expected the message to state that row security is enforced against this role. Got: ${message}`,
    );
    assert.match(
      message,
      /rows this connection can see=0/,
      `expected the message to state the row count observed. Got: ${message}`,
    );
  });

  it('refuses to name a cause when it has no privileged vantage, instead of asserting one', async () => {
    await setCanonicalRowsPresent(true);
    const message = await runPrecondition('c632_probe_nosvc');

    assert.ok(message, 'a suite that probed nothing must still refuse');
    assert.match(
      message,
      /cause=indeterminate/,
      `a role that can neither see the rows nor borrow a vantage must report indeterminate. Got: ${message}`,
    );
    assert.doesNotMatch(
      message,
      /Run db:migrate \+ (the )?canonicalization migration/,
      `with both causes still open the precondition must not prescribe a migration. Got: ${message}`,
    );
  });

  it('stays silent when the canonical rows do resolve, so the suite still runs its probes', async () => {
    await setCanonicalRowsPresent(true);
    const message = await runPrecondition('c632_probe_inherit');

    assert.equal(
      message,
      null,
      `the policy covers this role, so the keys resolve and the precondition must not raise. Got: ${message}`,
    );
  });
});
