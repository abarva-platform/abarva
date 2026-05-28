import {
  createAzureReadClient,
  type AzureReadSelect,
} from '../azureRead';
import type { SessionRunner } from '../read-adapters/azureSession';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

describe('azureRead', () => {
  it('runs typed SELECT queries through the injected session', async () => {
    const seen: Array<{ sql: string; params: unknown[] }> = [];
    const client = createAzureReadClient(fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [{ id: 'client-1', tenant_key: 'skyharbor-air' }];
    }));

    const rows = await client.query<{ id: string; tenant_key: string }>(
      'SELECT id, tenant_key FROM clients WHERE tenant_key = $1',
      ['skyharbor-air'],
    );

    expect(rows).toEqual([{ id: 'client-1', tenant_key: 'skyharbor-air' }]);
    expect(seen).toEqual([{
      sql: 'SELECT id, tenant_key FROM clients WHERE tenant_key = $1',
      params: ['skyharbor-air'],
    }]);
  });

  it('rejects non-read SQL before it reaches the session', async () => {
    const client = createAzureReadClient(fakeSession(() => {
      throw new Error('should not run');
    }));

    await expect(client.query('UPDATE clients SET name = $1', ['Nope'])).rejects.toThrow(
      'azure_read_query_must_be_select_only',
    );
  });

  it('builds identifier-safe SELECT statements for row reads', async () => {
    const seen: string[] = [];
    const client = createAzureReadClient(fakeSession((sql, params) => {
      seen.push(`${sql} :: ${JSON.stringify(params)}`);
      return [{ id: 'app-1', name: 'Reservations Core' }];
    }));

    const request: AzureReadSelect = {
      table: 'applications',
      columns: ['id', 'name'],
      where: {
        client_id: 'client-skyharbor',
        criticality: { op: 'in', value: ['tier1', 'tier2'] },
        retired_at: null,
      },
      orderBy: { column: 'name', direction: 'asc', nulls: 'last' },
      limit: 5,
    };

    await expect(client.select(request)).resolves.toEqual([
      { id: 'app-1', name: 'Reservations Core' },
    ]);
    expect(seen[0]).toBe(
      'SELECT "id", "name" FROM "applications" WHERE "client_id" = $1 AND "criticality" = ANY($2) AND "retired_at" IS NULL ORDER BY "name" ASC NULLS LAST LIMIT 5 :: ["client-skyharbor",["tier1","tier2"]]',
    );
  });

  it('rejects unsafe table or column identifiers', async () => {
    const client = createAzureReadClient(fakeSession(() => []));
    await expect(client.select({
      table: 'clients; DROP TABLE clients',
      where: { tenant_key: 'apex-retail' },
    })).rejects.toThrow('azure_read_invalid_identifier');
    await expect(client.select({
      table: 'clients',
      where: { 'tenant_key OR 1=1': 'apex-retail' },
    })).rejects.toThrow('azure_read_invalid_identifier');
  });

  it('returns null for maybeSingle when no rows match', async () => {
    const client = createAzureReadClient(fakeSession(() => []));
    await expect(client.maybeSingle({ table: 'clients', where: { tenant_key: 'ghost' } })).resolves.toBeNull();
  });

  it('returns zero or empty rows for missing optional tables when requested', async () => {
    const missingTable = Object.assign(new Error('relation "vendor_contracts" does not exist'), { code: '42P01' });
    const client = createAzureReadClient(fakeSession(() => {
      throw missingTable;
    }));

    await expect(client.select({
      table: 'vendor_contracts',
      missingTable: 'empty',
    })).resolves.toEqual([]);
    await expect(client.count({
      table: 'vendor_contracts',
      missingTable: 'empty',
    })).resolves.toBe(0);
  });
});
