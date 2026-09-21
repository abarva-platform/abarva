/**
 * T-469 — the per-client test-time data-plane boundary, re-proved by execution.
 *
 * `docs/architecture/data-plane-test-boundary.json` records, per data-plane
 * entry point, what an UNSTUBBED read does under jest: `connects` (a socket is
 * opened, which is a live tenant read anywhere a real connection string is in
 * the environment), `throws`, or `swallows` (resolves with a null a caller
 * reads back as "no rows").
 *
 * That artifact exists so the answer is looked up once instead of re-probed per
 * backlog item. This suite is what stops it becoming a document that used to be
 * true: every verdict in it is re-executed here, and a client that changes how
 * it loads its driver turns this red rather than quietly diverging.
 *
 * Every probe points at `127.0.0.1:59999`, a closed port. A `connects` verdict
 * is therefore proved by `ECONNREFUSED` — the socket attempt itself is the
 * evidence — and no database is reached by this suite on any machine, including
 * one whose environment carries a real connection string.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEAD_URL = 'postgresql://probe:probe@127.0.0.1:59999/probe';
const ALLOW_ENV = 'ABARVA_TEST_ALLOW_DATA_PLANE_CONNECT';
const BLOCKED_CODE = 'ABARVA_TEST_DATA_PLANE_CONNECT_BLOCKED';

const ARTIFACT_PATH = path.join(
  process.cwd(),
  'docs/architecture/data-plane-test-boundary.json',
);

interface EntryPoint {
  id: string;
  module: string;
  driverLoad: 'static' | 'dynamic';
  verdictConfigured: 'connects' | 'throws' | 'swallows';
  verdictUnconfigured: 'connects' | 'throws' | 'swallows';
}

const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8')) as {
  entryPoints: EntryPoint[];
};

type ProbeOutcome =
  | { kind: 'threw'; code: string; message: string }
  | { kind: 'resolved'; value: unknown };

async function run(fn: () => Promise<unknown>): Promise<ProbeOutcome> {
  try {
    return { kind: 'resolved', value: await fn() };
  } catch (error) {
    const record = error as { code?: unknown; message?: unknown };
    return {
      kind: 'threw',
      code: typeof record?.code === 'string' ? record.code : '',
      message: String(record?.message ?? error),
    };
  }
}

/**
 * One probe per artifact entry, keyed by its `id`. Keyed rather than ordered so
 * that a renamed or added entry fails the completeness case below instead of
 * silently probing the wrong client.
 */
const PROBES: Record<string, () => Promise<unknown>> = {
  'azure-session': async () => {
    const { createAzureReadClient } = await import('@/lib/data-plane/azureRead');
    return createAzureReadClient().select({ table: 'clients', limit: 1 });
  },
  'azure-postgres-read-adapter': async () => {
    const { azurePostgresReadAdapter } = await import(
      '@/lib/data-plane/read-adapters/azurePostgresReadAdapter'
    );
    return azurePostgresReadAdapter.getTenantInvariants(['meridian-health']);
  },
  'domain-pool': async () => {
    const { withCorpusClient } = await import('@/lib/corpus/db');
    return withCorpusClient(async (client) => client.query('select 1'));
  },
  'postgres-compat': async () => {
    const { getAzureReadFluentClient } = await import('@/lib/data-plane/postgresCompat');
    return getAzureReadFluentClient().from('clients').select('*').limit(1);
  },
};

const ENV_KEYS = [
  'ABARVA_AZURE_DATABASE_URL',
  'DATABASE_URL',
  'ABARVA_ACTIVE_CLIENT_KEY',
  'ABARVA_CLIENT_KEY',
  'ABARVA_ACTIVE_CLIENT_ID',
  'ABARVA_CLIENT_ID',
  'ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK',
  ALLOW_ENV,
] as const;

describe('data-plane test boundary', () => {
  const saved = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const key of ENV_KEYS) saved.set(key, process.env[key]);
    // Clear every tenant-scoped connection input first, so the only address any
    // client can resolve is the closed port below.
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.ABARVA_AZURE_DATABASE_URL = DEAD_URL;
    process.env.DATABASE_URL = DEAD_URL;
    process.env.ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK = '1';
    jest.resetModules();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    jest.resetModules();
  });

  it('records a probe for every entry point, and an entry point for every probe', () => {
    const recorded = artifact.entryPoints.map((entry) => entry.id).sort();
    expect(recorded).toEqual(Object.keys(PROBES).sort());
    expect(recorded.length).toBeGreaterThan(0);
  });

  describe.each(artifact.entryPoints.map((entry) => [entry.id, entry] as const))(
    '%s',
    (id, entry) => {
      const probe = () => PROBES[id]();

      if (entry.verdictConfigured === 'connects') {
        it('really opens a socket — the verdict is not read off the import', async () => {
          // The guard steps aside ONLY for an explicit opt-in, so this case is
          // also what proves the opt-in exists for the integration lane.
          process.env[ALLOW_ENV] = '1';
          const outcome = await run(probe);
          expect(outcome.kind).toBe('threw');
          if (outcome.kind !== 'threw') return;
          expect(outcome.code).toBe('ECONNREFUSED');
          expect(outcome.message).toContain('127.0.0.1:59999');
        }, 30_000);

        it('is refused by name rather than performing that read', async () => {
          const outcome = await run(probe);
          expect(outcome.kind).toBe('threw');
          if (outcome.kind !== 'threw') return;
          expect(outcome.code).toBe(BLOCKED_CODE);
          expect(outcome.message).toContain('data-plane test boundary');
          // The failure has to be legible enough to act on, or the next agent
          // will reach for the opt-out instead of installing a stand-in.
          expect(outcome.message).toContain('stand-in');
        }, 30_000);
      }

      if (entry.verdictConfigured === 'swallows') {
        it('opens no socket, and swallows the failure into a null result', async () => {
          const outcome = await run(probe);
          expect(outcome.kind).toBe('resolved');
          if (outcome.kind !== 'resolved') return;
          const value = outcome.value as { data: unknown; error: { message?: string } | null };
          expect(value.data).toBeNull();
          // The failure is present but in a side channel. THIS is the hazard:
          // a caller that reads `data` alone cannot tell it from an empty table.
          expect(value.error).not.toBeNull();
          expect(String(value.error?.message)).not.toContain(BLOCKED_CODE);
        }, 30_000);
      }

      it('still refuses to reach a database when nothing is configured', async () => {
        delete process.env.ABARVA_AZURE_DATABASE_URL;
        delete process.env.DATABASE_URL;
        jest.resetModules();
        const outcome = await run(probe);
        if (entry.verdictUnconfigured === 'throws') {
          expect(outcome.kind).toBe('threw');
        } else {
          expect(outcome.kind).toBe('resolved');
          expect((outcome as { value: { data: unknown } }).value.data).toBeNull();
        }
      }, 30_000);
    },
  );
});
