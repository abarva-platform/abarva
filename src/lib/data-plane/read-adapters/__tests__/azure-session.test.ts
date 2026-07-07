import {
  isAzureSessionFallbackError,
  resolveAzurePoolMax,
  resolveAzureUrlCandidates,
} from '../azureSession';

describe('Azure read adapter session fallback', () => {
  it('keeps the Azure private connection first and DATABASE_URL second', () => {
    expect(resolveAzureUrlCandidates({
      ABARVA_AZURE_DATABASE_URL: 'postgres://azure.example/abarva',
      DATABASE_URL: 'postgres://mirror.example/postgres',
    } as unknown as NodeJS.ProcessEnv)).toEqual([
      'postgres://azure.example/abarva',
      'postgres://mirror.example/postgres',
    ]);
  });

  it('deduplicates identical connection strings', () => {
    expect(resolveAzureUrlCandidates({
      ABARVA_AZURE_DATABASE_URL: 'postgres://same.example/db',
      DATABASE_URL: 'postgres://same.example/db',
    } as unknown as NodeJS.ProcessEnv)).toEqual(['postgres://same.example/db']);
  });

  it('falls back for DNS/connectivity failures but not SQL failures', () => {
    expect(isAzureSessionFallbackError(Object.assign(
      new Error('getaddrinfo ENOTFOUND pg-private.example'),
      { code: 'ENOTFOUND' },
    ))).toBe(true);
    expect(isAzureSessionFallbackError(Object.assign(
      new Error('relation "vendor_contracts" does not exist'),
      { code: '42P01' },
    ))).toBe(false);
  });

  it('keeps the default runtime pool tiny but allows higher caps for prod', () => {
    // Default stays at 1 — bare CI/preview/local without env vars
    // should never accidentally allocate large pools.
    expect(resolveAzurePoolMax({} as NodeJS.ProcessEnv)).toBe(1);
    // Operator-set values within the cap are honored exactly.
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '3' } as unknown as NodeJS.ProcessEnv)).toBe(3);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '15' } as unknown as NodeJS.ProcessEnv)).toBe(15);
    // Cap raised to 20 (was 5) on 2026-05-30 — Azure Postgres
    // Flexible Server B-tier supports 100+ concurrent connections;
    // /admin fan-out (~12 distinct queries) was being throttled by
    // the prior 5-cap. See docs/build/BROKER_THROW_DIAGNOSIS_2026-05-30.md.
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '20' } as unknown as NodeJS.ProcessEnv)).toBe(20);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '99' } as unknown as NodeJS.ProcessEnv)).toBe(20);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: 'nope' } as unknown as NodeJS.ProcessEnv)).toBe(1);
    // PGPOOL_MAX legacy alias still works.
    expect(resolveAzurePoolMax({ PGPOOL_MAX: '8' } as unknown as NodeJS.ProcessEnv)).toBe(8);
  });
});
