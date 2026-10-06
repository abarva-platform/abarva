import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';

export interface ApprovalParticipant {
  user_id: string | null;
  role?: string | null;
  approval_authority: string | null;
  can_approve_source_stages: boolean | null;
}

export function soleApprovalParticipant(rows: ApprovalParticipant[]): ApprovalParticipant | null {
  const eligible = rows.filter((row) =>
    Boolean(row.user_id?.trim()) &&
    (row.can_approve_source_stages === true ||
      row.approval_authority === 'approver' ||
      row.approval_authority === 'award_approver'),
  );
  return eligible.length === 1 ? eligible[0] : null;
}

export function soleSponsorApprovalParticipant(rows: ApprovalParticipant[]): ApprovalParticipant | null {
  const eligible = rows.filter((row) =>
    Boolean(row.user_id?.trim()) &&
    row.role?.trim().toLowerCase() === 'sponsor' &&
    row.can_approve_source_stages === true,
  );
  return eligible.length === 1 ? eligible[0] : null;
}

export function isApprovedTestRecipient(email: string, configuredAllowlist: string | undefined): boolean {
  const allowed = new Set([
    ...CANONICAL_CLIENT_ADMIN_EMAILS,
    ...(configuredAllowlist ?? '').split(','),
  ].map((value) => value.trim().toLowerCase()).filter(Boolean));
  return allowed.has(email.trim().toLowerCase());
}
