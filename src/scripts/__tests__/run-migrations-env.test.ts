import { resolveMigrationDatabaseUrl } from '../run-migrations';

describe('run-migrations database URL resolution', () => {
  it('prefers the Azure migration URL over generic DATABASE_URL', () => {
    expect(resolveMigrationDatabaseUrl({
      ABARVA_AZURE_DATABASE_URL: 'postgres://azure-primary',
      AZURE_DATABASE_URL: 'postgres://azure-secondary',
      DATABASE_URL: 'postgres://generic',
    })).toBe('postgres://azure-primary');
  });

  it('falls back to AZURE_DATABASE_URL and then DATABASE_URL', () => {
    expect(resolveMigrationDatabaseUrl({
      AZURE_DATABASE_URL: 'postgres://azure-secondary',
      DATABASE_URL: 'postgres://generic',
    })).toBe('postgres://azure-secondary');

    expect(resolveMigrationDatabaseUrl({
      DATABASE_URL: 'postgres://generic',
    })).toBe('postgres://generic');
  });
});
