const mockConnect = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
  })),
}));

import {
  isLegacySupabaseCorpusUrl,
  resolveCorpusConnectionString,
  withCorpusClient,
} from '@/lib/corpus/db';

describe('corpus database connection resolution', () => {
  beforeEach(() => {
    mockConnect.mockReset();
  });

  it('prefers the Azure private Postgres URL over DATABASE_URL', () => {
    expect(resolveCorpusConnectionString({
      ABARVA_AZURE_DATABASE_URL: 'postgres://azure.example/abarva_control',
      DATABASE_URL: 'postgres://aws-1-us-east-2.pooler.supabase.com/postgres',
    } as unknown as NodeJS.ProcessEnv)).toBe('postgres://azure.example/abarva_control');
  });

  it('fails closed when only a Supabase DATABASE_URL is present', () => {
    expect(() => resolveCorpusConnectionString({
      DATABASE_URL: 'postgres://aws-1-us-east-2.pooler.supabase.com/postgres',
    } as unknown as NodeJS.ProcessEnv)).toThrow(/Refusing to use Supabase DATABASE_URL/);
  });

  it('allows a legacy Supabase corpus window only when explicitly opted in', () => {
    expect(resolveCorpusConnectionString({
      DATABASE_URL: 'postgres://aws-1-us-east-2.pooler.supabase.com/postgres',
      ALLOW_LEGACY_SUPABASE_CORPUS: '1',
    } as unknown as NodeJS.ProcessEnv)).toBe('postgres://aws-1-us-east-2.pooler.supabase.com/postgres');
  });

  it('allows non-Supabase DATABASE_URL fallback for local/dev databases', () => {
    expect(resolveCorpusConnectionString({
      DATABASE_URL: 'postgres://localhost:5432/abarva',
    } as unknown as NodeJS.ProcessEnv)).toBe('postgres://localhost:5432/abarva');
  });

  it('recognizes Supabase pooler and project hosts', () => {
    expect(isLegacySupabaseCorpusUrl('postgres://u:p@aws-1-us-east-2.pooler.supabase.com/postgres')).toBe(true);
    expect(isLegacySupabaseCorpusUrl('postgres://u:p@db.xtbymdryojmvoulaotce.supabase.co/postgres')).toBe(true);
    expect(isLegacySupabaseCorpusUrl('postgres://u:p@pg-abarva-context-lab-001.postgres.database.azure.com/abarva_control')).toBe(false);
  });

  it('redacts legacy Supabase hostnames from corpus connection errors', async () => {
    const originalAzureUrl = process.env.ABARVA_AZURE_DATABASE_URL;
    const originalDatabaseUrl = process.env.DATABASE_URL;
    try {
      process.env.ABARVA_AZURE_DATABASE_URL = 'postgres://azure.example/abarva_control';
      delete process.env.DATABASE_URL;
      mockConnect.mockRejectedValueOnce(
        new Error('getaddrinfo ENOTFOUND aws-1-us-east-2.pooler.supabase.com'),
      );

      await withCorpusClient(async () => null);
      throw new Error('Expected corpus connection to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        'getaddrinfo ENOTFOUND [redacted-legacy-supabase-host]',
      );
      expect((error as Error).message).not.toMatch(/supabase\.co|pooler\.supabase\.com/);
    } finally {
      if (originalAzureUrl === undefined) {
        delete process.env.ABARVA_AZURE_DATABASE_URL;
      } else {
        process.env.ABARVA_AZURE_DATABASE_URL = originalAzureUrl;
      }
      if (originalDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalDatabaseUrl;
      }
    }
  });
});
