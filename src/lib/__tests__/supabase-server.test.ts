jest.mock('server-only', () => ({}));

import {
  isConnectionFallbackError,
  resolvePostgresPoolMax,
  resolveDatabaseUrlCandidates,
  runtimePostgresPoolConfig,
} from '@/lib/supabase-server';

describe('Postgres compatibility database URL fallback', () => {
  it('prefers the Azure private lane and keeps DATABASE_URL as an ordered fallback', () => {
    const candidates = resolveDatabaseUrlCandidates({
      ABARVA_AZURE_DATABASE_URL: 'postgres://azure.example/abarva',
      DATABASE_URL: 'postgres://mirror.example/postgres',
    } as unknown as NodeJS.ProcessEnv);

    expect(candidates).toEqual([
      'postgres://azure.example/abarva',
      'postgres://mirror.example/postgres',
    ]);
  });

  it('deduplicates identical database URLs', () => {
    const candidates = resolveDatabaseUrlCandidates({
      ABARVA_AZURE_DATABASE_URL: 'postgres://same.example/db',
      DATABASE_URL: 'postgres://same.example/db',
    } as unknown as NodeJS.ProcessEnv);

    expect(candidates).toEqual(['postgres://same.example/db']);
  });

  it('falls back only for connection-level failures', () => {
    expect(isConnectionFallbackError(Object.assign(new Error('getaddrinfo ENOTFOUND pg-private.example'), {
      code: 'ENOTFOUND',
    }))).toBe(true);
    expect(isConnectionFallbackError(Object.assign(new Error('relation "enterprise_context_chunks" does not exist'), {
      code: '42P01',
    }))).toBe(false);
  });

  it('defaults Postgres compatibility pools to a serverless-safe size, with cap raised to 20', () => {
    expect(resolvePostgresPoolMax({} as NodeJS.ProcessEnv)).toBe(1);
    expect(resolvePostgresPoolMax({ PGPOOL_MAX: '2' } as unknown as NodeJS.ProcessEnv)).toBe(2);
    // Cap raised from 5 to 20 on 2026-05-30 to relieve /admin
    // fan-out throttling — see docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md.
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '12' } as unknown as NodeJS.ProcessEnv)).toBe(12);
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '20' } as unknown as NodeJS.ProcessEnv)).toBe(20);
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '99' } as unknown as NodeJS.ProcessEnv)).toBe(20);
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '0' } as unknown as NodeJS.ProcessEnv)).toBe(1);
  });

  it('builds one-connection runtime pool config with idle teardown', () => {
    const previousAbarvaPoolMax = process.env.ABARVA_PG_POOL_MAX;
    const previousPgPoolMax = process.env.PGPOOL_MAX;
    delete process.env.ABARVA_PG_POOL_MAX;
    delete process.env.PGPOOL_MAX;
    let config!: ReturnType<typeof runtimePostgresPoolConfig>;
    try {
      config = runtimePostgresPoolConfig(
        'postgres://user:pass@db.example.com:5432/app',
        'nexus-test-pool',
      );
    } finally {
      if (previousAbarvaPoolMax === undefined) delete process.env.ABARVA_PG_POOL_MAX;
      else process.env.ABARVA_PG_POOL_MAX = previousAbarvaPoolMax;
      if (previousPgPoolMax === undefined) delete process.env.PGPOOL_MAX;
      else process.env.PGPOOL_MAX = previousPgPoolMax;
    }

    expect(config).toEqual(expect.objectContaining({
      application_name: 'nexus-test-pool',
      max: 1,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
      ssl: { rejectUnauthorized: false },
    }));
  });
});
