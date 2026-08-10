import "server-only";

// Loader for the Source Approvals ledger — resolves real Clerk display
// names and real DB rows, then delegates composition to the pure model in
// approval-ledger-model.ts. Kept separate so UI code/tests can import the
// pure model without pulling in server-only Clerk/DB dependencies.

import { clerkClient } from "@clerk/nextjs/server";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildApprovalLedger,
  type ApprovalLedgerStageLike,
  type ApprovalLedgerRow,
  type ApprovalRowLike,
} from "@/lib/source/approval-ledger-model";

export type { ApprovalLedgerRow } from "@/lib/source/approval-ledger-model";

interface ClerkUserLite {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: ReadonlyArray<{ emailAddress?: string | null }>;
  firstName?: string | null;
  lastName?: string | null;
}

function nameFromClerkUser(user: ClerkUserLite | null): string | null {
  if (!user) return null;
  const parts = [user.firstName ?? "", user.lastName ?? ""].filter(
    (s) => s.length > 0,
  );
  if (parts.length > 0) return parts.join(" ");
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress;
  return email ?? null;
}

/** Resolve real display names for a set of Clerk user ids. Never throws. */
async function resolveApproverNames(
  userIds: readonly string[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = Array.from(new Set(userIds));
  const clerk = await clerkClient().catch(() => null);
  if (!clerk) return names;
  await Promise.all(
    unique.map(async (userId) => {
      try {
        const user = (await clerk.users.getUser(userId)) as ClerkUserLite;
        const name = nameFromClerkUser(user);
        if (name) names.set(userId, name);
      } catch (err) {
        console.error(
          "[approval-ledger] failed to resolve approver from Clerk",
          {
            userId,
            err: err instanceof Error ? err.message : String(err),
          },
        );
      }
    }),
  );
  return names;
}

/** Load the full ledger for one event via the existing read seam. */
export async function loadApprovalLedger(
  eventId: string,
  currentStageKey: string | null,
  stages?: readonly ApprovalLedgerStageLike[],
  db = getAzureWriteFluentClient(),
): Promise<ApprovalLedgerRow[]> {
  const { data, error } = await db
    .from("source_event_approvals")
    .select("stage_key, approved_by_user_id, action, created_at, notes")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const approvalRows: ApprovalRowLike[] =
    !error && Array.isArray(data) ? (data as ApprovalRowLike[]) : [];

  const approverNames = await resolveApproverNames(
    approvalRows.map((r) => r.approved_by_user_id),
  );

  return buildApprovalLedger({
    currentStageKey,
    approvalRows,
    approverNames,
    stages,
  });
}
