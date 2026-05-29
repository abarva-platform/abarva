jest.mock('server-only', () => ({}));

import {
  isConnectionFallbackError,
  resolvePostgresPoolMax,
  resolveDatabaseUrlCandidates,
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

  it('defaults Postgres compatibility pools to a serverless-safe size', () => {
    expect(resolvePostgresPoolMax({} as NodeJS.ProcessEnv)).toBe(1);
    expect(resolvePostgresPoolMax({ PGPOOL_MAX: '2' } as unknown as NodeJS.ProcessEnv)).toBe(2);
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '12' } as unknown as NodeJS.ProcessEnv)).toBe(5);
    expect(resolvePostgresPoolMax({ ABARVA_PG_POOL_MAX: '0' } as unknown as NodeJS.ProcessEnv)).toBe(1);
  });
});
