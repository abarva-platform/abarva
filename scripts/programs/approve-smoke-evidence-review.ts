import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type EngagementRow = {
  id: string;
  client_id: string;
  name: string | null;
};

type ReviewRow = {
  id: string;
  evidence_id: string;
  family_key: string | null;
  decision: string | null;
  tenant_key: string | null;
  program_id: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  updated_at: string | null;
};

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing database URL. Set ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

function assertUuid(label: string, value: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error(`${label} must be a UUID`);
  }
}

function ensureSyntheticSmokeName(name: string | null): void {
  const normalized = name?.toLowerCase() ?? "";
  if (!normalized.includes("synthetic") || !normalized.includes("e2e")) {
    throw new Error(
      "Refusing to approve evidence for a Move whose name is not marked synthetic E2E.",
    );
  }
}

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

async function main() {
  const apply = process.env.APPLY === "1";
  const moveId = requiredEnv("MOVE_ID");
  const evidenceId = requiredEnv("EVIDENCE_ID");
  const tenantKey = requiredEnv("TENANT_KEY");
  const reviewerUserId = requiredEnv("REVIEWER_USER_ID");
  const reviewerEmail = process.env.REVIEWER_EMAIL?.trim() || null;
  const rationale =
    process.env.RATIONALE?.trim() ||
    "Synthetic smoke evidence reviewed and approved for terminal artifact coverage.";

  assertUuid("MOVE_ID", moveId);
  assertUuid("EVIDENCE_ID", evidenceId);
  if (!apply) {
    throw new Error(
      "Refusing to write without APPLY=1. This script is for approved smoke support only.",
    );
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "moves-smoke-evidence-approval-operator"),
  );
  await client.connect();
  let transactionStarted = false;
  try {
    const engagementResult = await client.query<EngagementRow>(
      `select id, client_id, name
         from engagements
        where id = $1
          and deleted_at is null`,
      [moveId],
    );
    const engagement = engagementResult.rows[0];
    if (!engagement) {
      throw new Error("Move not found");
    }
    ensureSyntheticSmokeName(engagement.name);

    const beforeResult = await client.query<ReviewRow>(
      `select id, evidence_id, family_key, decision, tenant_key, program_id,
              reviewed_by_user_id, reviewed_at, updated_at
         from program_evidence_reviews
        where program_id = $1
          and evidence_id = $2
          and tenant_key = $3`,
      [moveId, evidenceId, tenantKey],
    );
    const before = beforeResult.rows[0];
    if (!before) {
      throw new Error("Evidence review not found for supplied Move and tenant");
    }

    await client.query("begin");
    transactionStarted = true;
    if (before.decision === "pending") {
      const now = new Date().toISOString();
      const updateResult = await client.query(
        `update program_evidence_reviews
            set decision = 'approved',
                reviewed_by_user_id = $4,
                reviewed_at = $5,
                updated_at = $5,
                rationale = $6
          where program_id = $1
            and evidence_id = $2
            and tenant_key = $3
            and decision = 'pending'`,
        [moveId, evidenceId, tenantKey, reviewerUserId, now, rationale],
      );
      if (updateResult.rowCount !== 1) {
        throw new Error("Expected to approve exactly one pending review row");
      }
      await client.query(
        `insert into program_audit_log
           (tenant_key, program_id, engagement_id, actor_id, actor_role, action,
            from_state, to_state, rationale, evidence_refs)
         values ($1, $2, $2, $3, 'client', 'current_state_doc_committed',
                 'review_required', 'committed', $4, $5)`,
        [
          tenantKey,
          moveId,
          uuidOrNull(reviewerUserId),
          rationale,
          [evidenceId],
        ],
      );
    } else if (before.decision !== "approved") {
      throw new Error(
        `Evidence review is not pending or approved; got ${before.decision ?? "null"}`,
      );
    }

    const afterResult = await client.query<ReviewRow>(
      `select id, evidence_id, family_key, decision, tenant_key, program_id,
              reviewed_by_user_id, reviewed_at, updated_at
         from program_evidence_reviews
        where program_id = $1
          and evidence_id = $2
          and tenant_key = $3`,
      [moveId, evidenceId, tenantKey],
    );
    const after = afterResult.rows[0];
    if (!after || after.decision !== "approved") {
      throw new Error("Readback did not show approved review state");
    }
    await client.query("commit");
    transactionStarted = false;

    console.log(
      JSON.stringify(
        {
          ok: true,
          moveId,
          evidenceId,
          tenantKey,
          reviewerEmail,
          familyKey: after.family_key,
          idempotent: before.decision === "approved",
          before: {
            decision: before.decision,
            reviewedAt: before.reviewed_at,
          },
          after: {
            decision: after.decision,
            reviewedByUserId: after.reviewed_by_user_id,
            reviewedAt: after.reviewed_at,
          },
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (transactionStarted) {
      await client.query("rollback").catch(() => undefined);
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
