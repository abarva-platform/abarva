// SRC37 — AMS Outsourcing 2026 BAFO Tab View Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

export const AMS_BAFO_EVENT_ID = 'apex-retail-ams-outsourcing-2026';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BafoRoundStatus = 'not_started' | 'in_progress' | 'complete' | 'cancelled';
export type BafoVendorResponseStatus = 'invited' | 'submitted' | 'under_review' | 'accepted' | 'declined';

export interface BafoCommitteeMember {
  memberId: string;
  name: string;
  role: string;
  organisation: string;
}

export interface BafoVendorEntry {
  vendorId: string;
  vendorLabel: string;
  inviteDate: string;
  responseDeadline: string;
  responseStatus: BafoVendorResponseStatus;
  responseStatusLabel: string;
  keyNegotiationPoints: string[];
  pricingBandBefore: string;
  pricingBandAfter: string | null;
  outcomeNote: string;
  deterministicSeed: true;
}

export interface BafoRound {
  roundId: string;
  eventId: string;
  eventName: string;
  roundLabel: string;
  status: BafoRoundStatus;
  statusLabel: string;
  deadline: string;
  selectionCommittee: BafoCommitteeMember[];
  invitedVendors: BafoVendorEntry[];
  notInvitedVendors: Array<{
    vendorId: string;
    vendorLabel: string;
    exclusionReason: string;
  }>;
  nextSteps: string[];
  evidenceCaveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export function buildAmsBafoView(): BafoRound {
  return {
    roundId: 'bafo-apex-retail-ams-2026-r1',
    eventId: AMS_BAFO_EVENT_ID,
    eventName: 'AMS Outsourcing 2026',
    roundLabel: 'BAFO Round 1',
    status: 'in_progress',
    statusLabel: 'In Progress',
    deadline: 'May 15, 2026',
    selectionCommittee: [
      {
        memberId: 'sc-cio',
        name: 'Priya Mehta',
        role: 'CIO (Chair)',
        organisation: 'Apex Retail',
      },
      {
        memberId: 'sc-procurement',
        name: 'Marcus Chen',
        role: 'Head of Procurement',
        organisation: 'Apex Retail',
      },
      {
        memberId: 'sc-ops',
        name: 'Fiona Wallace',
        role: 'VP Technology Operations',
        organisation: 'Apex Retail',
      },
    ],
    invitedVendors: [
      {
        vendorId: 'northstar-managed-services',
        vendorLabel: 'Northstar Managed Services',
        inviteDate: 'April 28, 2026',
        responseDeadline: 'May 15, 2026',
        responseStatus: 'invited',
        responseStatusLabel: 'Invited — Awaiting Response',
        keyNegotiationPoints: [
          'Itemise tier-2 application support pricing by tower',
          'Clarify SLA scope boundary to align with Apex Retail reference definition',
          'Confirm dedicated run-team staffing by service tower',
        ],
        pricingBandBefore: 'Mid-range',
        pricingBandAfter: null,
        outcomeNote: 'BAFO response pending.',
        deterministicSeed: true,
      },
      {
        vendorId: 'arcvault-managed',
        vendorLabel: 'ArcVault Managed',
        inviteDate: 'April 28, 2026',
        responseDeadline: 'May 15, 2026',
        responseStatus: 'invited',
        responseStatusLabel: 'Invited — Awaiting Response',
        keyNegotiationPoints: [
          'Provide complete Year 1 governance framework including steering committee charter',
          'Confirm nearshore delivery capacity for Q3 CDP integration workstream',
          'Submit revised pricing with application rationalisation advisory separated from AMS base scope',
        ],
        pricingBandBefore: 'Mid-range',
        pricingBandAfter: null,
        outcomeNote: 'BAFO response pending.',
        deterministicSeed: true,
      },
    ],
    notInvitedVendors: [
      {
        vendorId: 'bluemaster-operations',
        vendorLabel: 'BlueMaster Operations',
        exclusionReason:
          'Transition plan quality insufficient for a 40+ application estate. Excluded from BAFO pending remediation submission.',
      },
      {
        vendorId: 'datapeak-services',
        vendorLabel: 'DataPeak Services',
        exclusionReason:
          'Premium pricing band and 16-week onboarding cadence create unacceptable CDP integration timeline risk. Excluded from BAFO — may be revisited for future data platform AMS scope.',
      },
    ],
    nextSteps: [
      'Receive BAFO responses from Northstar Managed Services and ArcVault Managed by May 15, 2026',
      'Normalise BAFO pricing against Apex Retail reference towers',
      'Present BAFO comparison to selection committee by May 22, 2026',
      'Award recommendation to CIO by May 30, 2026',
    ],
    evidenceCaveat:
      'BAFO round data is deterministic seed for demonstration purposes only. No live vendor BAFO response has been ingested. Dates are illustrative.',
    deterministicSeed: true,
  };
}
