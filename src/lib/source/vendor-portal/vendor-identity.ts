// Source vendor portal — which governed supplier a portal invitation is for.
//
// The portal used to identify a competing supplier by a free-text name. Two
// solicitations meant two unconnected rows with two spellings, and no join back
// to `source.vendor`. This module is the only way a portal record learns which
// supplier it belongs to, and it will not answer from a name.
//
// The identity is not invented here. Accepting a supplier onto an event's
// candidate panel already writes an authority row whose `vendor_id` references
// the governed record; `supplierId` on an `AcceptedEventCandidate` IS that
// `vendor_id`. This resolves to it, or refuses.
//
// Every refusal is named, because "could not resolve" on a procurement surface
// has to tell an operator which of several different problems they have.

import type { AcceptedEventCandidate } from '@/lib/source/candidate-suppliers/event-candidate-authority-repository';

export type VendorIdentityRefusal =
  /** No candidate panel has been accepted for this event yet. */
  | 'no_accepted_candidates'
  /** The request named no supplier to resolve. */
  | 'supplier_not_named'
  /**
   * The named supplier is not an accepted candidate on this event. Invitation,
   * response, recommendation and award states do not imply acceptance, so this
   * is the refusal that stops the portal inviting an entity the panel never
   * admitted.
   */
  | 'supplier_not_accepted_for_event'
  /** The authority row carries no usable canonical id. */
  | 'canonical_id_missing'
  /**
   * Two accepted rows claim the same canonical id. The panel is ambiguous and a
   * portal invitation would pick one arbitrarily.
   */
  | 'canonical_id_ambiguous';

export type VendorIdentityResolution =
  | {
      readonly ok: true;
      /** `source.vendor(tenant_key, vendor_id)`. */
      readonly vendorId: string;
      /**
       * The governed legal name at the moment of resolution, for the portal's
       * display cache. Never read back as identity.
       */
      readonly legalNameAtInvitation: string;
      readonly authorityId: string;
    }
  | { readonly ok: false; readonly refusal: VendorIdentityRefusal };

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Resolve the canonical supplier identity for one portal invitation.
 *
 * `requestedSupplierId` is matched against the accepted candidates' own
 * `supplierId`. It is deliberately NOT matched against a name: a caller holding
 * only a name has not established which supplier it means, and that is the
 * whole defect this closes.
 */
export function resolveCanonicalVendorIdentity(input: {
  readonly acceptedCandidates: readonly AcceptedEventCandidate[];
  readonly requestedSupplierId: string | null | undefined;
}): VendorIdentityResolution {
  const { acceptedCandidates } = input;
  const requested = trimmed(input.requestedSupplierId);

  if (acceptedCandidates.length === 0) {
    return { ok: false, refusal: 'no_accepted_candidates' };
  }
  if (!requested) {
    return { ok: false, refusal: 'supplier_not_named' };
  }

  const matches = acceptedCandidates.filter(
    (candidate) => trimmed(candidate.supplierId) === requested,
  );

  if (matches.length === 0) {
    return { ok: false, refusal: 'supplier_not_accepted_for_event' };
  }
  if (matches.length > 1) {
    return { ok: false, refusal: 'canonical_id_ambiguous' };
  }

  const [candidate] = matches;
  const vendorId = trimmed(candidate.supplierId);
  if (!vendorId) {
    return { ok: false, refusal: 'canonical_id_missing' };
  }

  return {
    ok: true,
    vendorId,
    legalNameAtInvitation: trimmed(candidate.legalName) || vendorId,
    authorityId: trimmed(candidate.authorityId),
  };
}

/**
 * Whether two portal rows are the same governed supplier.
 *
 * The point of the change: one supplier competing in two solicitations is ONE
 * identity. Compared on `(tenantKey, vendorId)` and never on a name, so two
 * spellings of one supplier still answer true and two suppliers that share a
 * display name still answer false.
 */
export function isSameGovernedSupplier(
  left: { readonly tenantKey: string; readonly vendorId: string | null },
  right: { readonly tenantKey: string; readonly vendorId: string | null },
): boolean {
  const leftId = trimmed(left.vendorId);
  const rightId = trimmed(right.vendorId);
  if (!leftId || !rightId) return false;
  return trimmed(left.tenantKey) === trimmed(right.tenantKey) && leftId === rightId;
}
