// Source vendor portal — what the vendor's page shows.
//
// Pure view model, no I/O, so the rules about what a vendor may SEE are testable
// without a database and cannot drift from the rules about what they may DO
// (`access.ts`, which this composes).
//
// Shape follows the brief: enough context to decide whether to compete, sections
// to browse, an explicit expectation that the package is DOWNLOADED rather than
// completed in-page, and a visible record of the vendor's own activity.

import {
  resolveVendorAccess,
  denialMessage,
  type InvitationState,
  type VendorAccessDecision,
} from './access';

export interface RfpSection {
  key: string;
  ordinal: number;
  title: string;
  /** Short orienting summary. The full content lives in the downloadable package. */
  summary: string;
  /** True when this section carries an obligation the vendor must action. */
  requiresAction?: boolean;
}

export type VendorActivityType =
  | 'invited'
  | 'invitation_resent'
  | 'invitation_viewed'
  | 'signed_in'
  | 'acknowledged'
  | 'declined'
  | 'section_viewed'
  | 'package_downloaded'
  | 'document_downloaded'
  | 'question_submitted'
  | 'addendum_viewed'
  | 'submission_uploaded'
  | 'submission_superseded'
  | 'submission_finalised'
  | 'credential_rotated'
  | 'access_withdrawn';

export interface VendorActivityEvent {
  type: VendorActivityType;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

export interface PortalViewInput {
  eventName: string;
  buyerDisplayName: string;
  vendorDisplayName: string;
  invitationState: InvitationState;
  acceptBy: Date;
  respondBy: Date;
  sections: RfpSection[];
  activity: VendorActivityEvent[];
  submissionCount: number;
  now?: Date;
}

export interface PortalDeadline {
  label: string;
  at: Date;
  /** Negative once passed. */
  hoursRemaining: number;
  passed: boolean;
  /** The one the vendor must act on next. */
  isNext: boolean;
}

export interface PortalView {
  heading: string;
  issuedBy: string;
  /** The single thing to do next, in one sentence. Never more than one. */
  primaryCallToAction: string;
  access: VendorAccessDecision;
  blockedReason: string | null;
  deadlines: PortalDeadline[];
  sections: RfpSection[];
  /** Stated plainly so nobody tries to write their response into the page. */
  packageExpectation: string;
  activity: Array<{ at: Date; label: string }>;
  submissionCount: number;
}

const ACTIVITY_LABELS: Record<VendorActivityType, string> = {
  invited: 'Invitation issued',
  invitation_resent: 'Invitation resent',
  invitation_viewed: 'Invitation opened',
  signed_in: 'Signed in',
  acknowledged: 'Intent to respond confirmed',
  declined: 'Declined to respond',
  section_viewed: 'Section viewed',
  package_downloaded: 'RFP package downloaded',
  document_downloaded: 'Document downloaded',
  question_submitted: 'Question submitted',
  addendum_viewed: 'Addendum viewed',
  submission_uploaded: 'Response document uploaded',
  submission_superseded: 'Response document replaced',
  submission_finalised: 'Response finalised',
  credential_rotated: 'Access credential reissued',
  access_withdrawn: 'Access withdrawn',
};

function hoursBetween(from: Date, to: Date): number {
  return Math.round(((to.getTime() - from.getTime()) / 3_600_000) * 10) / 10;
}

export function buildPortalView(input: PortalViewInput): PortalView {
  const now = input.now ?? new Date();
  const access = resolveVendorAccess({
    invitationState: input.invitationState,
    acceptBy: input.acceptBy,
    respondBy: input.respondBy,
    now,
  });

  const acceptPassed = now.getTime() > input.acceptBy.getTime();
  const respondPassed = now.getTime() > input.respondBy.getTime();

  const deadlines: PortalDeadline[] = [
    {
      label: 'Confirm intent to respond',
      at: input.acceptBy,
      hoursRemaining: hoursBetween(now, input.acceptBy),
      passed: acceptPassed,
      isNext: !acceptPassed && input.invitationState === 'invited',
    },
    {
      label: 'Submit your response',
      at: input.respondBy,
      hoursRemaining: hoursBetween(now, input.respondBy),
      passed: respondPassed,
      isNext: input.invitationState === 'accepted' && !respondPassed,
    },
  ];

  // Exactly one instruction. A portal that lists five things a vendor "can" do
  // is how a bid team misses the one with a deadline attached.
  let primaryCallToAction: string;
  if (access.canAcknowledge) {
    primaryCallToAction =
      'Confirm whether your organisation intends to respond. The RFP package unlocks once you do.';
  } else if (access.canUploadResponse && input.submissionCount === 0) {
    primaryCallToAction =
      'Download the RFP package, prepare your response offline, then upload your documents here.';
  } else if (access.canUploadResponse) {
    primaryCallToAction =
      'Upload any remaining documents, then finalise your response before the deadline.';
  } else if (access.denial) {
    primaryCallToAction = denialMessage(access.denial, input.respondBy, input.acceptBy);
  } else {
    primaryCallToAction = 'No action is outstanding.';
  }

  return {
    heading: input.eventName,
    issuedBy: input.buyerDisplayName,
    primaryCallToAction,
    access,
    blockedReason: access.denial
      ? denialMessage(access.denial, input.respondBy, input.acceptBy)
      : null,
    deadlines,
    // Sections are for orientation on screen; ordering is ours, not the vendor's.
    sections: [...input.sections].sort((a, b) => a.ordinal - b.ordinal),
    packageExpectation:
      'These sections summarise the solicitation. Download the full RFP package to prepare your response — responses are prepared offline and uploaded here, not completed in this page.',
    activity: [...input.activity]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .map((e) => ({ at: e.occurredAt, label: ACTIVITY_LABELS[e.type] })),
    submissionCount: input.submissionCount,
  };
}
