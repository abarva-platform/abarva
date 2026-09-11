import { Client } from "pg";

import { decideEvidenceReview } from "../../src/lib/programs/current-state-doc-ingest";
import type { TenancyCtx } from "../../src/lib/programs/types.db";
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

    const ctx: TenancyCtx = {
      clientId: engagement.client_id,
      clientKey: tenantKey,
      userId: reviewerUserId,
      clerkUserId: reviewerUserId,
      role: "client",
      tenantRole: "client_admin",
      email: reviewerEmail,
    };
    const decision = await decideEvidenceReview(ctx, {
      moveId,
      evidenceId,
      decision: "approved",
      rationale,
    });
    if (!decision.ok || decision.decision !== "approved") {
      throw new Error(
        `Evidence review did not approve: ${JSON.stringify(decision)}`,
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

    console.log(
      JSON.stringify(
        {
          ok: true,
          moveId,
          evidenceId,
          tenantKey,
          familyKey: after.family_key,
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
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
