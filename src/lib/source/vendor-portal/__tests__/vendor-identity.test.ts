jest.mock('server-only', () => ({}));

import type { AcceptedEventCandidate } from '@/lib/source/candidate-suppliers/event-candidate-authority-repository';

import {
  isSameGovernedSupplier,
  resolveCanonicalVendorIdentity,
} from '../vendor-identity';

/**
 * Which governed supplier a portal invitation is for.
 *
 * The portal identified a competing supplier by two free-text name columns and
 * nothing else, so the same supplier invited to two solicitations was two
 * unconnected rows with two spellings and no join back to `source.vendor`.
 *
 * The identity is not invented in the portal. Accepting a supplier onto an
 * event's candidate panel already writes an authority row whose `vendor_id`
 * references the governed record, and `supplierId` on an accepted candidate IS
 * that `vendor_id`. These cases pin that the portal resolves to it or refuses,
 * and never answers from a name.
 */

const candidate = (
  supplierId: string,
  legalName: string,
  authorityId = `AUTH-${supplierId}`,
): AcceptedEventCandidate =>
  ({
    authorityId,
    supplierId,
    legalEntityId: supplierId,
    legalName,
    acceptedByName: 'A. Reviewer',
    acceptedAt: '2026-10-01T00:00:00Z',
    acceptanceRationale: 'Panel decision recorded.',
    evidenceReference: 'DOC-1',
  }) as AcceptedEventCandidate;

describe('resolveCanonicalVendorIdentity', () => {
  it('resolves one supplier to the same identity across two events', () => {
    /*
     * The slice's whole point, and the brief's named proof. Two solicitations,
     * two separate candidate panels, two different authority rows, and the
     * supplier's name spelled differently on each. One identity.
     */
    const eventOne = [
      candidate('VEN-NORTHWIND', 'Northwind Systems Ltd', 'AUTH-E1'),
      candidate('VEN-CONTOSO', 'Contoso Group', 'AUTH-E1-B'),
    ];
    const eventTwo = [
      candidate('VEN-NORTHWIND', 'Northwind Systems Limited', 'AUTH-E2'),
    ];

    const first = resolveCanonicalVendorIdentity({
      acceptedCandidates: eventOne,
      requestedSupplierId: 'VEN-NORTHWIND',
    });
    const second = resolveCanonicalVendorIdentity({
      acceptedCandidates: eventTwo,
      requestedSupplierId: 'VEN-NORTHWIND',
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(first.vendorId).toBe('VEN-NORTHWIND');
    expect(second.vendorId).toBe(first.vendorId);

    // The display cache differs, because each invitation shows the name it was
    // issued under. That is the point of keeping them separate from identity.
    expect(first.legalNameAtInvitation).toBe('Northwind Systems Ltd');
    expect(second.legalNameAtInvitation).toBe('Northwind Systems Limited');
    expect(first.authorityId).not.toBe(second.authorityId);
  });

  it('refuses a supplier the panel never accepted', () => {
    const result = resolveCanonicalVendorIdentity({
      acceptedCandidates: [candidate('VEN-CONTOSO', 'Contoso Group')],
      requestedSupplierId: 'VEN-NORTHWIND',
    });

    expect(result).toEqual({
      ok: false,
      refusal: 'supplier_not_accepted_for_event',
    });
  });

  it('will not resolve from a name, only from the canonical id', () => {
    /*
     * A caller holding only a name has not established which supplier it
     * means. This is the defect the slice closes, so it is asserted directly
     * rather than left to follow from the matching rule.
     */
    const result = resolveCanonicalVendorIdentity({
      acceptedCandidates: [candidate('VEN-NORTHWIND', 'Northwind Systems Ltd')],
      requestedSupplierId: 'Northwind Systems Ltd',
    });

    expect(result).toEqual({
      ok: false,
      refusal: 'supplier_not_accepted_for_event',
    });
  });

  it('refuses when no candidate panel has been accepted yet', () => {
    expect(
      resolveCanonicalVendorIdentity({
        acceptedCandidates: [],
        requestedSupplierId: 'VEN-NORTHWIND',
      }),
    ).toEqual({ ok: false, refusal: 'no_accepted_candidates' });
  });

  it('refuses when the request names no supplier', () => {
    for (const requested of ['', '   ', null, undefined]) {
      expect(
        resolveCanonicalVendorIdentity({
          acceptedCandidates: [candidate('VEN-NORTHWIND', 'Northwind')],
          requestedSupplierId: requested,
        }),
      ).toEqual({ ok: false, refusal: 'supplier_not_named' });
    }
  });

  it('refuses an ambiguous panel rather than picking one row', () => {
    const result = resolveCanonicalVendorIdentity({
      acceptedCandidates: [
        candidate('VEN-NORTHWIND', 'Northwind Systems Ltd', 'AUTH-A'),
        candidate('VEN-NORTHWIND', 'Northwind Systems', 'AUTH-B'),
      ],
      requestedSupplierId: 'VEN-NORTHWIND',
    });

    expect(result).toEqual({ ok: false, refusal: 'canonical_id_ambiguous' });
  });

  it('matches on the trimmed id, so surrounding whitespace is not a new supplier', () => {
    const result = resolveCanonicalVendorIdentity({
      acceptedCandidates: [candidate('VEN-NORTHWIND', 'Northwind')],
      requestedSupplierId: '  VEN-NORTHWIND  ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.vendorId).toBe('VEN-NORTHWIND');
  });

  it('falls back to the canonical id when the governed legal name is blank', () => {
    const result = resolveCanonicalVendorIdentity({
      acceptedCandidates: [candidate('VEN-NORTHWIND', '   ')],
      requestedSupplierId: 'VEN-NORTHWIND',
    });

    expect(result.ok).toBe(true);
    // Never an empty display name: a portal page showing nothing for the
    // supplier it is addressing reads as a broken page.
    if (result.ok) expect(result.legalNameAtInvitation).toBe('VEN-NORTHWIND');
  });
});

describe('isSameGovernedSupplier', () => {
  it('reads two spellings of one supplier as one supplier', () => {
    expect(
      isSameGovernedSupplier(
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND' },
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND' },
      ),
    ).toBe(true);
  });

  it('reads two suppliers sharing a display name as two suppliers', () => {
    expect(
      isSameGovernedSupplier(
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND' },
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND-UK' },
      ),
    ).toBe(false);
  });

  it('does not match the same id across two tenants', () => {
    expect(
      isSameGovernedSupplier(
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND' },
        { tenantKey: 'tenant-b', vendorId: 'VEN-NORTHWIND' },
      ),
    ).toBe(false);
  });

  it('answers false for an unlinked row rather than matching another unlinked row', () => {
    /*
     * Rows predating the canonical column carry a null id. Two of them are not
     * the same supplier — they are two rows nobody has identified, and
     * treating them as equal would merge unrelated suppliers.
     */
    expect(
      isSameGovernedSupplier(
        { tenantKey: 'tenant-a', vendorId: null },
        { tenantKey: 'tenant-a', vendorId: null },
      ),
    ).toBe(false);
    expect(
      isSameGovernedSupplier(
        { tenantKey: 'tenant-a', vendorId: null },
        { tenantKey: 'tenant-a', vendorId: 'VEN-NORTHWIND' },
      ),
    ).toBe(false);
  });
});
