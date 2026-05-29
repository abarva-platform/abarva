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

  it('keeps the default runtime pool tiny for Azure session-mode Postgres', () => {
    expect(resolveAzurePoolMax({} as NodeJS.ProcessEnv)).toBe(1);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '3' } as unknown as NodeJS.ProcessEnv)).toBe(3);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: '99' } as unknown as NodeJS.ProcessEnv)).toBe(5);
    expect(resolveAzurePoolMax({ ABARVA_PG_POOL_MAX: 'nope' } as unknown as NodeJS.ProcessEnv)).toBe(1);
  });
});
