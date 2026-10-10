import 'server-only';

// Source vendor portal — what a vendor may do, right now.
//
// Pure decision function. Every gate in the portal reads from here so that the
// rule lives in one place and is enforced on the SERVER against stored
// timestamps — never by hiding a button. A hidden button is a UI preference; a
// procurement deadline is a commitment.

export type InvitationState =
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'withdrawn';

export interface VendorAccessInput {
  invitationState: InvitationState;
  acceptBy: Date;
  respondBy: Date;
  now?: Date;
}

export type DenialReason =
  | 'not_acknowledged'
  | 'invitation_expired'
  | 'declined'
  | 'withdrawn'
  | 'response_window_closed';

export interface VendorAccessDecision {
  /** Read the RFP context and browse sections. */
  canViewRfp: boolean;
  /** Accept or decline. Closes once `accept_by` passes. */
  canAcknowledge: boolean;
  /** Download the issued package. Gated on acceptance. */
  canDownloadPackage: boolean;
  /** Upload response documents. Needs acceptance AND an open response window. */
  canUploadResponse: boolean;
  /** Ask a question. Same window as upload. */
  canSubmitQuestion: boolean;
  /** Why the most consequential action is unavailable, for an honest message. */
  denial: DenialReason | null;
}

export function resolveVendorAccess(input: VendorAccessInput): VendorAccessDecision {
  const now = input.now ?? new Date();
  const acceptWindowOpen = now.getTime() <= input.acceptBy.getTime();
  const responseWindowOpen = now.getTime() <= input.respondBy.getTime();
  const state = input.invitationState;

  // A vendor who declined or was withdrawn loses everything immediately. They
  // keep no read access: the package is competitive material.
  if (state === 'declined' || state === 'withdrawn') {
    return {
      canViewRfp: false,
      canAcknowledge: false,
      canDownloadPackage: false,
      canUploadResponse: false,
      canSubmitQuestion: false,
      denial: state === 'declined' ? 'declined' : 'withdrawn',
    };
  }

  const accepted = state === 'accepted';

  // An invited-but-not-yet-accepted vendor can READ the overview — they need
  // enough context to decide whether to compete. They cannot take the package.
  if (!accepted) {
    const expired = state === 'expired' || !acceptWindowOpen;
    return {
      canViewRfp: true,
      canAcknowledge: !expired,
      canDownloadPackage: false,
      canUploadResponse: false,
      canSubmitQuestion: false,
      denial: expired ? 'invitation_expired' : 'not_acknowledged',
    };
  }

  return {
    canViewRfp: true,
    canAcknowledge: false, // already answered
    canDownloadPackage: true,
    canUploadResponse: responseWindowOpen,
    canSubmitQuestion: responseWindowOpen,
    denial: responseWindowOpen ? null : 'response_window_closed',
  };
}

/** Human-readable, vendor-facing. States the rule, never blames the reader. */
export function denialMessage(reason: DenialReason, respondBy: Date, acceptBy: Date): string {
  switch (reason) {
    case 'not_acknowledged':
      return `Confirm your intent to respond to download the RFP package. Acceptance closes ${acceptBy.toUTCString()}.`;
    case 'invitation_expired':
      return `The window to accept this invitation closed ${acceptBy.toUTCString()}. Contact the procurement lead if you believe this is in error.`;
    case 'declined':
      return 'Your organisation declined this invitation. Contact the procurement lead to reopen it.';
    case 'withdrawn':
      return 'Access to this solicitation has been withdrawn. Contact the procurement lead.';
    case 'response_window_closed':
      return `The response window closed ${respondBy.toUTCString()}. Submissions are no longer accepted.`;
  }
}
