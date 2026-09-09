import "server-only";

// Loader for the Source Approvals ledger — resolves real Clerk display
// names and real DB rows, then delegates composition to the pure model in
// approval-ledger-model.ts. Kept separate so UI code/tests can import the
// pure model without pulling in server-only Clerk/DB dependencies.

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

interface ApprovalLedgerDbRow {
  stage_key: string | null;
  approved_by_user_id: string;
  action: string;
  approved_at: string;
  notes?: string | null;
}

interface LoadApprovalLedgerOptions {
  resolveApproverNames?: boolean;
}

interface ApprovalLedgerPersonRow {
  id: string;
  name?: string | null;
  email?: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

async function resolvePersonNames(
  userIds: readonly string[],
  db: ReturnType<typeof getAzureWriteFluentClient>,
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const personIds = Array.from(new Set(userIds.filter((id) => UUID_RE.test(id))));
  if (personIds.length === 0) return names;

  try {
    const { data, error } = await db
      .from("persons")
      .select("id, name, email")
      .in("id", personIds)
      .limit(personIds.length);
    if (error || !Array.isArray(data)) return names;

    for (const row of data as ApprovalLedgerPersonRow[]) {
      const name = row.name?.trim() || row.email?.trim();
      if (name) names.set(row.id, name);
    }
  } catch (error) {
    console.error("[approval-ledger] failed to resolve approver from persons", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return names;
}

/** Resolve canonical person IDs first, then legacy Clerk identifiers. Never throws. */
async function resolveApproverNames(
  userIds: readonly string[],
  db: ReturnType<typeof getAzureWriteFluentClient>,
): Promise<Map<string, string>> {
  const names = await resolvePersonNames(userIds, db);
  const unique = Array.from(new Set(userIds));
  const unresolved = unique.filter((userId) => !names.has(userId));
  if (unresolved.length === 0) return names;

  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient().catch(() => null);
  if (!clerk) return names;
  await Promise.all(
    unresolved.map(async (userId) => {
      try {
        const clerkUserId = userId.startsWith("clerk:")
          ? userId.slice("clerk:".length)
          : userId;
        const user = (await clerk.users.getUser(clerkUserId)) as ClerkUserLite;
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
  options: LoadApprovalLedgerOptions = {},
): Promise<ApprovalLedgerRow[]> {
  const { data, error } = await db
    .from("source_event_approvals")
    .select("stage_key, approved_by_user_id, action, approved_at, notes")
    .eq("event_id", eventId)
    .order("approved_at", { ascending: true });

  const approvalRows: ApprovalRowLike[] =
    !error && Array.isArray(data)
      ? (data as ApprovalLedgerDbRow[]).map((row) => ({
          stage_key: row.stage_key,
          approved_by_user_id: row.approved_by_user_id,
          action: row.action,
          created_at: row.approved_at,
          notes: row.notes,
        }))
      : [];

  const approverNames =
    options.resolveApproverNames === false
      ? new Map<string, string>()
      : await resolveApproverNames(
          approvalRows.map((r) => r.approved_by_user_id),
          db,
        );

  return buildApprovalLedger({
    currentStageKey,
    approvalRows,
    approverNames,
    stages,
  });
}
