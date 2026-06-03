jest.mock('server-only', () => ({}));

import {
  isConnectionFallbackError,
  maskConnectionString,
  resolveTenantDatabaseConnection,
  resolvePostgresPoolMax,
  resolveDatabaseUrlCandidates,
  runtimePostgresPoolConfig,
  tenantDatabaseEnvNamesForScope,
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

  it('uses a tenant-scoped projected secret when active client context is present', () => {
    const candidates = resolveDatabaseUrlCandidates({
      ABARVA_ACTIVE_CLIENT_KEY: 'meridian-health',
      ABARVA_CLIENT_DATABASE_URL_MERIDIAN_HEALTH: 'postgres://client.example/meridian',
      ABARVA_AZURE_DATABASE_URL: 'postgres://shared.example/abarva',
      DATABASE_URL: 'postgres://mirror.example/postgres',
    } as unknown as NodeJS.ProcessEnv);

    expect(candidates).toEqual(['postgres://client.example/meridian']);
  });

  it('fails closed instead of falling back to the shared database when tenant secret is missing', () => {
    const resolution = resolveTenantDatabaseConnection(
      { clientKey: 'meridian-health' },
      {
        ABARVA_AZURE_DATABASE_URL: 'postgres://shared.example/abarva',
        DATABASE_URL: 'postgres://mirror.example/postgres',
      } as unknown as NodeJS.ProcessEnv,
    );

    expect(resolution.status).toBe('unconfigured');
    expect(resolution.candidates).toEqual([]);
    expect(resolution.warnings.join(' ')).toContain('refusing shared fallback');
  });

  it('allows shared fallback only when explicitly enabled for previews', () => {
    const resolution = resolveTenantDatabaseConnection(
      { clientKey: 'meridian-health' },
      {
        ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK: 'true',
        ABARVA_AZURE_DATABASE_URL: 'postgres://shared.example/abarva',
      } as unknown as NodeJS.ProcessEnv,
    );

    expect(resolution.status).toBe('shared-fallback');
    expect(resolution.candidates).toEqual(['postgres://shared.example/abarva']);
  });

  it('normalizes client keys and ids into deterministic env names', () => {
    expect(tenantDatabaseEnvNamesForScope({
      clientKey: 'First Capital',
      clientId: 'client-123',
    })).toEqual([
      'ABARVA_CLIENT_DATABASE_URL_FIRST_CAPITAL',
      'ABARVA_TENANT_DATABASE_URL_FIRST_CAPITAL',
      'AZURE_CLIENT_DATABASE_URL_FIRST_CAPITAL',
      'ABARVA_CLIENT_DATABASE_URL_CLIENT_123',
      'ABARVA_TENANT_DATABASE_URL_CLIENT_123',
      'AZURE_CLIENT_DATABASE_URL_CLIENT_123',
    ]);
  });

  it('masks credentials in connection strings for operator reports', () => {
    expect(maskConnectionString('postgres://user:secret@db.example.com:5432/clientdb?sslmode=require'))
      .toBe('postgres://***@db.example.com:5432/clientdb');
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
