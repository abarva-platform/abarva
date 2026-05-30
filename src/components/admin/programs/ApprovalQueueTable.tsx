// OV2-2c · Tenant-admin approval queue · queue table component
//
// Renders the pending approvals as a stacked card list (one row per
// request). Server-fetched; this component is a pure presentational
// surface. Empty state when there are no pending requests.
//
// PRE-W4-PR-4 · adds a "Pending {N}h" SLA badge per row and a
// presentational pre-sort that surfaces the longest-pending request
// first. The DB query (`getApprovalQueueForTenant`) already returns
// rows in ascending `requested_at` order; the sort here is a
// defensive belt for ad-hoc callers that pass an unsorted array.

import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { ApprovalRequest } from '@/lib/programs/approval';
import {
  safeApprovalActorLabel,
  safeApprovalPersonLabel,
} from '@/lib/programs/approval-display';

export interface ApprovalQueueTableProps {
  requests: ReadonlyArray<ApprovalRequest>;
  /** Optional resolver from userId → display name. */
  resolveUserName?: (userId: string) => string | null;
  /** Optional resolver from personId → display name. */
  resolvePersonName?: (personId: string) => string | null;
  /** Optional clock for relative-time formatting (test seam). */
  now?: Date;
}

function pickString(
  snapshot: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = snapshot[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

export interface QueuePendingMeta {
  hours: number;
  bucket: 'fresh' | 'warning' | 'breach';
  label: string;
}

/**
 * Convert an ISO submission timestamp into the SLA bookkeeping the
 * queue and the detail-page badge both use.
 *
 *   fresh   < 24h   gray
 *   warning 24–48h  amber
 *   breach  >= 48h  coral
 */
export function describePending(
  requestedAt: string,
  now: Date = new Date(),
): QueuePendingMeta {
  const t = new Date(requestedAt).getTime();
  if (Number.isNaN(t)) return { hours: 0, bucket: 'fresh', label: '—' };
  const hours = Math.max(0, Math.round((now.getTime() - t) / 3_600_000));
  const bucket: 'fresh' | 'warning' | 'breach' =
    hours >= 48 ? 'breach' : hours >= 24 ? 'warning' : 'fresh';
  return { hours, bucket, label: `Pending ${hours}h` };
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = now.getTime() - then;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 14) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 8) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function ApprovalQueueTable({
  requests,
  resolveUserName,
  resolvePersonName,
  now,
}: ApprovalQueueTableProps) {
  if (requests.length === 0) {
    return (
      <div
        data-testid="approval-queue-empty"
        style={{
          padding: SPACING.xl,
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}20`,
          borderRadius: RADIUS.lg,
          fontFamily: TYPOGRAPHY.sans,
          color: `${COLORS.ink}99`,
          fontSize: 14,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        No pending approvals. New program briefs will appear here as
        they’re submitted.
      </div>
    );
  }

  // Defensive sort — server already returns ascending, but if a caller
  // passes an unsorted array we still bubble the longest-pending row
  // to the top so the SLA-breach signal is visible at the top of the
  // page.
  const sorted = [...requests].sort((a, b) => {
    const aT = new Date(a.requestedAt).getTime();
    const bT = new Date(b.requestedAt).getTime();
    return aT - bT;
  });

  return (
    <ul
      data-testid="approval-queue-list"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {sorted.map((req) => {
        const programName =
          pickString(req.briefSnapshot, 'program_name', 'programName') ??
          'Untitled program';
        const sponsorRaw = pickString(
          req.briefSnapshot,
          'sponsor_person_id',
          'sponsor',
        );
        const sponsor =
          (sponsorRaw && resolvePersonName
            ? resolvePersonName(sponsorRaw)
            : null) ??
          safeApprovalPersonLabel(sponsorRaw, 'Selected sponsor');
        const classification = pickString(
          req.briefSnapshot,
          'classification',
        );
        const requesterDisplay =
          (resolveUserName ? resolveUserName(req.requestedByUserId) : null) ??
          safeApprovalActorLabel(req.requestedByUserId);
        const pending = describePending(req.requestedAt, now);
        const palette =
          pending.bucket === 'breach'
            ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
            : pending.bucket === 'warning'
              ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
              : { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}99` };

        return (
          <li
            key={req.id}
            data-testid="approval-queue-row"
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.ink}12`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: SPACING.md,
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 20,
                  color: COLORS.ink,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {programName}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: SPACING.md,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}99`,
                }}
              >
                <span>
                  Submitted by{' '}
                  <span style={{ color: COLORS.ink, fontWeight: 600 }}>
                    {requesterDisplay}
                  </span>
                </span>
                <span>·</span>
                <span title={req.requestedAt}>
                  {formatRelativeTime(req.requestedAt, now)}
                </span>
                {sponsor ? (
                  <>
                    <span>·</span>
                    <span>
                      Sponsor{' '}
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 12,
                          color: COLORS.ink,
                          fontWeight: 600,
                        }}
                      >
                        {sponsor}
                      </span>
                    </span>
                  </>
                ) : null}
                {classification ? (
                  <>
                    <span>·</span>
                    <span>
                      Classification{' '}
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: COLORS.ink,
                        }}
                      >
                        {classification}
                      </span>
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                data-testid="approval-queue-pending-badge"
                data-sla-bucket={pending.bucket}
                title={`Submitted ${req.requestedAt}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: RADIUS.pill,
                  background: palette.bg,
                  color: palette.fg,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                {pending.label}
              </span>
              <Link
                href={`/admin/programs/approvals/${req.id}`}
                style={{
                  padding: `${SPACING.sm} ${SPACING.lg}`,
                  background: COLORS.navy,
                  color: COLORS.cream,
                  borderRadius: RADIUS.md,
                  fontFamily: TYPOGRAPHY.sans,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Review →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
