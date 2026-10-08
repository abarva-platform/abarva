jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-plane/azureRead', () => ({ azureRead: {} }));
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

import { createEventVendor } from '../dao';

const getClient = getAzureWriteFluentClient as jest.Mock;

/**
 * Creating a portal vendor requires the canonical supplier identity.
 *
 * The portal used to identify a competing supplier by a free-text name, so the
 * same supplier in two solicitations was two unconnected rows. `vendorId` is
 * now required, and this pins that the refusal happens BEFORE any write rather
 * than being left to the database — a row that reached the insert without an
 * identity would be refused by a foreign key, but the operator would get
 * `write_failed` instead of being told what was actually missing.
 */

const input = {
  sourceEventId: '11111111-1111-4111-8111-111111111111',
  tenantKey: 'tenant-a',
  vendorId: 'VEN-NORTHWIND',
  vendorLegalName: 'Northwind Systems Ltd',
  vendorDisplayName: 'Northwind Systems Ltd',
  primaryContactName: 'A. Contact',
  primaryContactEmail: 'contact@example.invalid',
  username: 'abc23xyz',
  passwordHash: 'hash',
  passwordSalt: 'salt',
  acceptBy: new Date('2026-10-15T00:00:00Z'),
  respondBy: new Date('2026-10-29T00:00:00Z'),
  createdByUserId: 'user_1',
};

/** Captures the inserted payload so the write can be asserted, not inferred. */
function captureInsert(result: { data?: unknown; error?: unknown }) {
  const inserted: Record<string, unknown>[] = [];
  const chain = {
    select: () => chain,
    single: () => Promise.resolve({ data: result.data ?? null, error: result.error ?? null }),
  };
  getClient.mockReturnValue({
    from: () => ({
      insert: (payload: Record<string, unknown>) => {
        inserted.push(payload);
        return chain;
      },
    }),
  });
  return inserted;
}

describe('createEventVendor', () => {
  beforeEach(() => getClient.mockReset());

  it('writes the canonical identity alongside the display cache', async () => {
    const inserted = captureInsert({ data: { id: 'row-1' } });

    const result = await createEventVendor(input);

    expect(result).toEqual({ ok: true, vendorRowId: 'row-1' });
    expect(inserted).toHaveLength(1);
    expect(inserted[0].vendor_id).toBe('VEN-NORTHWIND');
    expect(inserted[0].tenant_key).toBe('tenant-a');
    // The names are written too, as the cache of what the supplier was
    // invited under — but they are no longer what says which supplier it is.
    expect(inserted[0].vendor_legal_name).toBe('Northwind Systems Ltd');
  });

  it('refuses a blank canonical id without attempting a write', async () => {
    const inserted = captureInsert({ data: { id: 'row-1' } });

    const result = await createEventVendor({ ...input, vendorId: '' });

    expect(result).toEqual({
      ok: false,
      reason: 'canonical_vendor_id_required',
    });
    // The refusal is the point; that nothing was written is the other half.
    expect(inserted).toEqual([]);
    expect(getClient).not.toHaveBeenCalled();
  });

  it('refuses a whitespace-only canonical id, which a trim would otherwise accept', async () => {
    const inserted = captureInsert({ data: { id: 'row-1' } });

    const result = await createEventVendor({ ...input, vendorId: '   ' });

    expect(result).toEqual({
      ok: false,
      reason: 'canonical_vendor_id_required',
    });
    expect(inserted).toEqual([]);
  });

  it('reports a refused duplicate as a write failure rather than claiming success', async () => {
    /*
     * The database carries a partial unique index on
     * `(source_event_id, vendor_id)`, so inviting the same governed supplier
     * twice to one event is refused there. The caller must not read that as
     * a second invitation having been recorded.
     */
    captureInsert({ error: { code: '23505', message: 'duplicate key' } });

    const result = await createEventVendor(input);

    expect(result).toEqual({ ok: false, reason: 'write_failed' });
  });

  it('does not claim success when the insert returns no row id', async () => {
    captureInsert({ data: null });

    expect(await createEventVendor(input)).toEqual({
      ok: false,
      reason: 'write_failed',
    });
  });
});
