import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  createTxSession,
  type SqlRunner,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";

import type {
  SourceAuthorityApproval,
  SourceAuthorityApprovalRole,
  SourceAuthorityCurrentVersion,
  SourceAuthorityDecision,
  SourceAuthorityKind,
  JsonValue,
} from "./source-version-authority";
import { planSourceAuthorityVersion } from "./source-version-authority";

/**
 * The persistence path for request and strategy authority versions.
 *
 * `source-version-authority.ts` holds the whole contract — canonical payload
 * hashing, version planning, and the approval-state resolvers — and until now
 * nothing connected it to the tables that hold the data. The tables exist
 * (`20260919152000_source_event_authority_versions.sql`), the logic exists, and
 * the two had no path between them: `planSourceAuthorityVersion` had no caller
 * outside its own module, and the only reference to the table was a test
 * asserting the migration file's SQL text.
 *
 * This is the read half of that path.
 *
 * FAILS CLOSED, deliberately, and for two separate reasons. That migration is
 * still behind the separate apply gate, so in a deployed environment these
 * tables may not exist yet; and a row that does not satisfy the table's own
 * CHECK constraints must never be rendered as authority. Both return
 * `unavailable` rather than a partial answer — the same shape
 * `readSourceEventAuthority` already uses, so a surface reading both handles
 * one state, not two.
 */
export type SourceAuthorityVersionState =
  | {
      kind: "available";
      /** Null when the event has no version of this kind yet — not an error. */
      currentVersion: SourceAuthorityCurrentVersion | null;
      approvals: SourceAuthorityApproval[];
    }
  | { kind: "unavailable" };

export interface PersistSourceAuthorityVersionInput {
  eventId: string;
  clientKey: string;
  authorityKind: SourceAuthorityKind;
  payload: JsonValue;
  createdByUserId: string;
}

export interface PersistSourceAuthorityVersionResult {
  action: "create_version" | "reuse_current";
  versionId: string;
  versionNumber: number;
  contentHash: string;
}

interface VersionRow {
  id: unknown;
  event_id: unknown;
  client_key: unknown;
  authority_kind: unknown;
  version_number: unknown;
  content_hash: unknown;
}

interface CurrentVersionRow {
  id: unknown;
  version_number: unknown;
  content_hash: unknown;
}

interface ApprovalRow {
  version_id: unknown;
  client_key: unknown;
  role: unknown;
  decision: unknown;
  actor_user_id: unknown;
}

/**
 * Mirrors `source_event_authority_versions_hash_check`. A hash that the
 * database would have refused is not read back as if it had been accepted:
 * these tables are new and may be written by more than one path.
 */
const CONTENT_HASH_RE = /^[a-f0-9]{64}$/;

const APPROVAL_ROLES: readonly SourceAuthorityApprovalRole[] = [
  "request_acceptor",
  "business_owner",
  "procurement_lead",
];

const DECISIONS: readonly SourceAuthorityDecision[] = [
  "approved",
  "changes_requested",
];

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRole(value: unknown): value is SourceAuthorityApprovalRole {
  return APPROVAL_ROLES.includes(value as SourceAuthorityApprovalRole);
}

function isDecision(value: unknown): value is SourceAuthorityDecision {
  return DECISIONS.includes(value as SourceAuthorityDecision);
}

function resolveVersion(
  row: VersionRow,
  eventId: string,
  clientKey: string,
  authorityKind: SourceAuthorityKind,
): SourceAuthorityCurrentVersion | null {
  // Defence in depth. The query is already scoped by event, tenant and kind;
  // re-checking here means a future change to the predicate cannot silently
  // widen what this returns.
  if (
    text(row.event_id) !== eventId ||
    text(row.client_key) !== clientKey ||
    row.authority_kind !== authorityKind
  ) {
    return null;
  }

  const id = text(row.id);
  const contentHash = text(row.content_hash);
  const versionNumber = row.version_number;
  if (!id || !contentHash || !CONTENT_HASH_RE.test(contentHash)) return null;
  if (typeof versionNumber !== "number" || !Number.isInteger(versionNumber)) {
    return null;
  }
  // Mirrors source_event_authority_versions_version_number_check.
  if (versionNumber <= 0) return null;

  return { id, versionNumber, contentHash };
}

function resolveApproval(
  row: ApprovalRow,
  versionId: string,
  clientKey: string,
): SourceAuthorityApproval | null {
  if (text(row.client_key) !== clientKey) return null;
  if (text(row.version_id) !== versionId) return null;

  const actorId = text(row.actor_user_id);
  if (!actorId || !isRole(row.role) || !isDecision(row.decision)) return null;

  return { versionId, role: row.role, actorId, decision: row.decision };
}

export async function persistSourceAuthorityVersionWithRun(
  run: SqlRunner,
  input: PersistSourceAuthorityVersionInput,
): Promise<PersistSourceAuthorityVersionResult> {
  const currentRows = await run<CurrentVersionRow>(
    `SELECT id, version_number, content_hash
       FROM source_event_authority_versions
      WHERE event_id = $1::uuid
        AND client_key = $2
        AND authority_kind = $3
        AND superseded_at IS NULL
      FOR UPDATE`,
    [input.eventId, input.clientKey, input.authorityKind],
  );
  const currentRow = currentRows[0];
  const currentId = currentRow ? text(currentRow.id) : null;
  const currentHash = currentRow ? text(currentRow.content_hash) : null;
  const currentNumber = currentRow?.version_number;
  const currentVersion =
    currentId &&
    currentHash &&
    CONTENT_HASH_RE.test(currentHash) &&
    typeof currentNumber === "number" &&
    Number.isInteger(currentNumber) &&
    currentNumber > 0
      ? {
          id: currentId,
          versionNumber: currentNumber,
          contentHash: currentHash,
        }
      : null;
  if (currentRow && !currentVersion) {
    throw new Error("current Source authority version is invalid");
  }

  const plan = planSourceAuthorityVersion({ ...input, currentVersion });
  if (plan.action === "reuse_current") {
    return {
      action: plan.action,
      versionId: plan.versionId,
      versionNumber: plan.versionNumber,
      contentHash: plan.contentHash,
    };
  }

  const contentJson = JSON.stringify(plan.contentJson);
  if (!plan.supersedesVersionId) {
    const inserted = await run<{ id: string }>(
      `INSERT INTO source_event_authority_versions
         (event_id, client_key, authority_kind, version_number, content_hash,
          content_json, created_by_user_id, supersedes_version_id)
       VALUES ($1::uuid,$2,$3,$4,$5,$6::jsonb,$7,NULL)
       RETURNING id`,
      [
        input.eventId,
        input.clientKey,
        input.authorityKind,
        plan.versionNumber,
        plan.contentHash,
        contentJson,
        input.createdByUserId,
      ],
    );
    if (!inserted[0]?.id)
      throw new Error("authority version insert returned no id");
    return {
      action: plan.action,
      versionId: inserted[0].id,
      versionNumber: plan.versionNumber,
      contentHash: plan.contentHash,
    };
  }

  // The partial unique index permits only one current row. Insert the new row
  // temporarily superseded, link the old row to it, then promote the new row.
  // The enclosing transaction keeps that intermediate state invisible.
  const inserted = await run<{ id: string }>(
    `INSERT INTO source_event_authority_versions
       (event_id, client_key, authority_kind, version_number, content_hash,
        content_json, created_by_user_id, supersedes_version_id,
        superseded_at, superseded_by_version_id)
     VALUES ($1::uuid,$2,$3,$4,$5,$6::jsonb,$7,$8::uuid,now(),$8::uuid)
     RETURNING id`,
    [
      input.eventId,
      input.clientKey,
      input.authorityKind,
      plan.versionNumber,
      plan.contentHash,
      contentJson,
      input.createdByUserId,
      plan.supersedesVersionId,
    ],
  );
  const versionId = inserted[0]?.id;
  if (!versionId) throw new Error("authority version insert returned no id");

  const superseded = await run<{ id: string }>(
    `UPDATE source_event_authority_versions
        SET superseded_at = now(), superseded_by_version_id = $1::uuid
      WHERE id = $2::uuid
        AND event_id = $3::uuid
        AND client_key = $4
        AND authority_kind = $5
        AND superseded_at IS NULL
      RETURNING id`,
    [
      versionId,
      plan.supersedesVersionId,
      input.eventId,
      input.clientKey,
      input.authorityKind,
    ],
  );
  if (!superseded[0]?.id) throw new Error("current authority version changed");

  const promoted = await run<{ id: string }>(
    `UPDATE source_event_authority_versions
        SET superseded_at = NULL, superseded_by_version_id = NULL
      WHERE id = $1::uuid
        AND event_id = $2::uuid
        AND client_key = $3
        AND authority_kind = $4
      RETURNING id`,
    [versionId, input.eventId, input.clientKey, input.authorityKind],
  );
  if (!promoted[0]?.id)
    throw new Error("new authority version promotion failed");

  return {
    action: plan.action,
    versionId,
    versionNumber: plan.versionNumber,
    contentHash: plan.contentHash,
  };
}

export async function persistSourceAuthorityVersion(
  input: PersistSourceAuthorityVersionInput,
  session: TxSessionRunner = createTxSession("source-authority-version-write"),
): Promise<PersistSourceAuthorityVersionResult> {
  return session((run) => persistSourceAuthorityVersionWithRun(run, input));
}

/**
 * The current (not superseded) authority version for one event and kind, with
 * the approvals recorded against that version.
 *
 * Only the current version's approvals are returned. A superseded version's
 * approvals are not authority for the current one — the contract's own
 * `approvalsForCurrentVersion` filters on exactly this, and returning them
 * here would make that filter the only thing standing between a stale
 * acceptance and a surface that reports the request as accepted.
 */
export async function readSourceAuthorityVersionState(
  eventId: string,
  clientKey: string,
  authorityKind: SourceAuthorityKind,
): Promise<SourceAuthorityVersionState> {
  try {
    const client = getAzureReadFluentClient();

    const { data: versionData, error: versionError } = await client
      .from("source_event_authority_versions")
      .select(
        "id,event_id,client_key,authority_kind,version_number,content_hash",
      )
      .eq("event_id", eventId)
      .eq("client_key", clientKey)
      .eq("authority_kind", authorityKind)
      .is("superseded_at", null)
      .maybeSingle();

    // Until the migration passes its separate apply gate, this read fails closed.
    if (versionError) return { kind: "unavailable" };
    if (!versionData) {
      // No version of this kind yet. That is a real, readable state — an event
      // before its first Request draft — and is not the same as a failed read.
      return { kind: "available", currentVersion: null, approvals: [] };
    }

    const currentVersion = resolveVersion(
      versionData as VersionRow,
      eventId,
      clientKey,
      authorityKind,
    );
    if (!currentVersion) return { kind: "unavailable" };

    const { data: approvalData, error: approvalError } = await client
      .from("source_event_authority_version_approvals")
      .select("version_id,client_key,role,decision,actor_user_id")
      .eq("version_id", currentVersion.id)
      .eq("client_key", clientKey);

    if (approvalError) return { kind: "unavailable" };

    const rows = (approvalData ?? []) as ApprovalRow[];
    const approvals: SourceAuthorityApproval[] = [];
    for (const row of rows) {
      const approval = resolveApproval(row, currentVersion.id, clientKey);
      // One unreadable approval row makes the whole approval picture
      // unreliable: dropping it would under-count `changes_requested` and
      // report a version as accepted on the strength of the rows that happened
      // to parse.
      if (!approval) return { kind: "unavailable" };
      approvals.push(approval);
    }

    return { kind: "available", currentVersion, approvals };
  } catch {
    return { kind: "unavailable" };
  }
}
