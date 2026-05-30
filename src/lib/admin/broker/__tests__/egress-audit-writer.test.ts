/**
 * Egress Audit Writer contract tests · PRE-W4-PR-6
 *
 * Verifies:
 *   • Happy path: insert row with stamped metadata, return mapped record.
 *   • Throws when intendedTenantKey missing/blank.
 *   • Throws when resolvedTenantKey missing/blank.
 *   • Throws when tenantId missing/blank.
 *   • Stamps intendedTenantKey + resolvedTenantKey into request_metadata
 *     while preserving caller-set fields.
 *   • Wrapper-supplied stamp wins over caller-supplied stamp (no spoof).
 *   • Mismatch (intended ≠ resolved) fires a structured console.warn.
 *   • Match (intended === resolved) does NOT warn.
 *   • Supabase error → throws.
 */

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

import { writeEgressAudit } from '../egress-audit-writer';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

const getClientMock = getAzureWriteFluentClient as jest.MockedFunction<
  typeof getAzureWriteFluentClient
>;

type InsertCall = { row: Record<string, unknown> };

interface FakeClient {
  inserts: InsertCall[];
  fail?: string;
  // mimic supabase fluent chain
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => {
      select: (cols: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
}

function fakeClient(opts: { fail?: string } = {}): FakeClient {
  const inserts: InsertCall[] = [];
  const client: FakeClient = {
    inserts,
    fail: opts.fail,
    from(_table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ row });
          return {
            select(_cols: string) {
              return {
                async single() {
                  if (opts.fail) {
                    return { data: null, error: { message: opts.fail } };
                  }
                  return {
                    data: {
                      ...row,
                      id: 'audit-uuid-1',
                      created_at: '2026-05-30T12:00:00Z',
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return client;
}

const baseInput = () => ({
  tenantId: 'client-uuid-1',
  workflow: 'intelligence.ask',
  provider: 'anthropic' as const,
  route: 'anthropic-direct' as const,
  dataClass: 'internal' as const,
  policyDecision: 'allow' as const,
  decisionReason: 'policy allows',
});

const baseCtx = () => ({
  intendedTenantKey: 'apex-retail',
  resolvedTenantKey: 'apex-retail',
  tenantId: 'client-uuid-1',
});

describe('writeEgressAudit', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('writes a row with stamped tenant metadata and returns the mapped record', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);

    const result = await writeEgressAudit(
      { ...baseInput(), requestMetadata: { foo: 'bar' } },
      baseCtx(),
    );

    expect(client.inserts).toHaveLength(1);
    const row = client.inserts[0].row;
    expect(row.tenant_id).toBe('client-uuid-1');
    expect(row.workflow).toBe('intelligence.ask');
    expect(row.request_metadata).toEqual({
      foo: 'bar',
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'apex-retail',
    });
    expect(result.id).toBe('audit-uuid-1');
    expect(result.createdAt).toBe('2026-05-30T12:00:00Z');
  });

  it('throws when intendedTenantKey is missing', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await expect(
      writeEgressAudit(baseInput(), {
        intendedTenantKey: '',
        resolvedTenantKey: 'apex-retail',
        tenantId: 'client-uuid-1',
      }),
    ).rejects.toThrow(/intendedTenantKey is required/);
    expect(client.inserts).toHaveLength(0);
  });

  it('throws when resolvedTenantKey is missing', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await expect(
      writeEgressAudit(baseInput(), {
        intendedTenantKey: 'apex-retail',
        resolvedTenantKey: '   ',
        tenantId: 'client-uuid-1',
      }),
    ).rejects.toThrow(/resolvedTenantKey is required/);
    expect(client.inserts).toHaveLength(0);
  });

  it('throws when tenantId is missing', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await expect(
      writeEgressAudit(baseInput(), {
        intendedTenantKey: 'apex-retail',
        resolvedTenantKey: 'apex-retail',
        tenantId: '',
      }),
    ).rejects.toThrow(/tenantId is required/);
    expect(client.inserts).toHaveLength(0);
  });

  it('preserves caller request_metadata while stamping tenant fields', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await writeEgressAudit(
      {
        ...baseInput(),
        requestMetadata: { packet: 'P11', agent: 'Sentinel' },
      },
      baseCtx(),
    );
    expect(client.inserts[0].row.request_metadata).toEqual({
      packet: 'P11',
      agent: 'Sentinel',
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'apex-retail',
    });
  });

  it('overrides any caller-supplied intendedTenantKey / resolvedTenantKey (no spoof)', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await writeEgressAudit(
      {
        ...baseInput(),
        requestMetadata: {
          intendedTenantKey: 'spoof-A',
          resolvedTenantKey: 'spoof-B',
        },
      },
      {
        intendedTenantKey: 'apex-retail',
        resolvedTenantKey: 'apex-retail',
        tenantId: 'client-uuid-1',
      },
    );
    expect(client.inserts[0].row.request_metadata).toEqual({
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'apex-retail',
    });
  });

  it('emits a structured warn when intended differs from resolved', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await writeEgressAudit(baseInput(), {
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'meridian-health',
      tenantId: 'client-uuid-1',
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(payload.event).toBe('ai_egress_audit.tenant_mismatch');
    expect(payload.intended_tenant).toBe('apex-retail');
    expect(payload.resolved_tenant).toBe('meridian-health');
  });

  it('does NOT warn when intended equals resolved', async () => {
    const client = fakeClient();
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await writeEgressAudit(baseInput(), baseCtx());
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('throws when the Supabase insert returns an error', async () => {
    const client = fakeClient({ fail: 'tenant_id null constraint' });
    getClientMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await expect(writeEgressAudit(baseInput(), baseCtx())).rejects.toThrow(
      /AI egress audit write failed: tenant_id null constraint/,
    );
  });
});
