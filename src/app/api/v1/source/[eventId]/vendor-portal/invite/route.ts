// Invite an accepted candidate supplier into the vendor RFP portal.
//
// OPERATOR route, not a vendor route. It lives under the event API and is
// Clerk-protected and tenancy-fenced, deliberately NOT under `/api/v1/source/rfp`,
// which is on `PUBLIC_ROUTE_PATTERNS` for the competing vendors themselves.
// Issuing a credential is an act of the buying organisation.
//
// The supplier is named by its CANONICAL id and resolved against the event's
// accepted candidate panel. A name is not accepted, and a supplier the panel
// never admitted is refused: invitation, response, recommendation and award
// states do not imply candidate acceptance.
//
// The credential plaintext exists for the duration of one request. It goes into
// the invitation email body and nowhere else — not the response, not a log, not
// the provider metadata.

import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getCurrentUser } from '@/lib/auth/current-user';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { readAcceptedCandidatesForEvent } from '@/lib/source/candidate-suppliers/event-candidate-authority-repository';
import { issueCredential } from '@/lib/source/vendor-portal/credentials';
import { createEventVendor, recordVendorEvent } from '@/lib/source/vendor-portal/dao';
import { sendVendorInvitation } from '@/lib/source/vendor-portal/invitation-email';
import { resolveCanonicalVendorIdentity } from '@/lib/source/vendor-portal/vendor-identity';
import { canonicalTenantKey } from '@/lib/tenant/aliases';

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function portalUrl(eventId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://app.abarva.ai';
  return `${base.replace(/\/$/, '')}/rfp/${encodeURIComponent(eventId)}`;
}

function futureDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { eventId } = await params;
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const [activeClient, user] = await Promise.all([
    getActiveClientRow(),
    getCurrentUser().catch(() => null),
  ]);
  if (!activeClient) {
    return Response.json({ ok: false, error: 'no_client' }, { status: 403 });
  }
  if (
    canonicalTenantKey(activeClient.key) !==
    canonicalTenantKey(tenancy.clientKey)
  ) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: eventId,
  }).catch(() => null);
  if (!accessPolicy?.canApproveSourceStages) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const invitedByUserId = user?.personId?.trim() ?? '';
  const invitedByName = user?.name?.trim() ?? '';
  if (!invitedByUserId || !invitedByName) {
    return Response.json(
      {
        ok: false,
        error: 'reviewer_identity_required',
        detail: 'A named linked procurement reviewer is required.',
      },
      { status: 409 },
    );
  }

  const formData = await request.formData();
  const contactName = formText(formData, 'contactName');
  const contactEmail = formText(formData, 'contactEmail');
  if (!contactName || !contactEmail) {
    return Response.json(
      { ok: false, error: 'contact_required' },
      { status: 409 },
    );
  }

  const accepted = await readAcceptedCandidatesForEvent({
    clientKey: activeClient.key,
    eventId,
  }).catch(() => null);
  if (!accepted) {
    return Response.json(
      { ok: false, error: 'candidate_panel_unavailable' },
      { status: 503 },
    );
  }

  const identity = resolveCanonicalVendorIdentity({
    acceptedCandidates: accepted.acceptedCandidates,
    requestedSupplierId: formText(formData, 'supplierId'),
  });
  if (!identity.ok) {
    return Response.json(
      { ok: false, error: identity.refusal },
      { status: 409 },
    );
  }

  const credential = await issueCredential();
  const created = await createEventVendor({
    sourceEventId: eventId,
    tenantKey: activeClient.key,
    vendorId: identity.vendorId,
    vendorLegalName: identity.legalNameAtInvitation,
    vendorDisplayName: identity.legalNameAtInvitation,
    primaryContactName: contactName,
    primaryContactEmail: contactEmail,
    username: credential.username,
    passwordHash: credential.passwordHash,
    passwordSalt: credential.passwordSalt,
    acceptBy: futureDate(7),
    respondBy: futureDate(21),
    createdByUserId: invitedByUserId,
  });
  if (!created.ok) {
    return Response.json(
      { ok: false, error: created.reason },
      { status: created.reason === 'write_failed' ? 500 : 409 },
    );
  }

  // The row exists, so the invitation is recorded even if delivery fails. A
  // sent email that nobody recorded is the worse failure on a procurement
  // timeline: the supplier holds a credential the buyer cannot account for.
  const delivery = await sendVendorInvitation({
    vendorDisplayName: identity.legalNameAtInvitation,
    contactName,
    contactEmail,
    eventName: formText(formData, 'eventName') || eventId,
    buyerDisplayName: activeClient.name ?? activeClient.key,
    portalUrl: portalUrl(eventId),
    username: credential.username,
    password: credential.password,
    acceptBy: futureDate(7),
    respondBy: futureDate(21),
    procurementContactName: invitedByName,
    procurementContactEmail: formText(formData, 'procurementContactEmail'),
  }).catch(() => ({ ok: false as const }));

  await recordVendorEvent({
    vendorId: created.vendorRowId,
    tenantKey: activeClient.key,
    type: 'invited',
  });

  // No credential in the response. The plaintext went into the email body and
  // is now gone; a buyer who needs to re-send rotates it.
  return Response.json({
    ok: true,
    vendorId: identity.vendorId,
    authorityId: identity.authorityId,
    delivered: delivery.ok === true,
  });
}
