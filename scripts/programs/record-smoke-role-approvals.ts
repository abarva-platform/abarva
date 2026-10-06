import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";
import {
  requiredApprovalRolesFor,
  type ApprovalRole,
} from "../../src/lib/programs/deliverable-role-approval-policy";

type RoleApprovalDecision = {
  role: ApprovalRole;
  approverUserId: string;
  approverName: string;
  outstandingConditions?: string | null;
};

type DeliverableRow = {
  id: string;
  engagement_id: string;
  deliverable_type_key: string;
  status: string | null;
  current_version: number | null;
  signed_off_version: number | null;
};

const VALID_ROLES = new Set<ApprovalRole>([
  "business",
  "technology",
  "finance",
  "risk_security",
]);

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

function parseDecisions(raw: string): RoleApprovalDecision[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("ROLE_APPROVAL_DECISIONS_JSON must be a non-empty array");
  }

  const seenRoles = new Set<string>();
  const seenApprovers = new Set<string>();
  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Decision ${index + 1} must be an object`);
    }
    const candidate = entry as Partial<RoleApprovalDecision>;
    if (!candidate.role || !VALID_ROLES.has(candidate.role)) {
      throw new Error(`Decision ${index + 1} has an invalid role`);
    }
    if (!candidate.approverUserId?.trim()) {
      throw new Error(`Decision ${index + 1} is missing approverUserId`);
    }
    if (!candidate.approverName?.trim()) {
      throw new Error(`Decision ${index + 1} is missing approverName`);
    }
    if (seenRoles.has(candidate.role)) {
      throw new Error(`Duplicate decision for role ${candidate.role}`);
    }
    if (seenApprovers.has(candidate.approverUserId)) {
      throw new Error(
        `Approver ${candidate.approverUserId} is assigned to multiple roles`,
      );
    }
    seenRoles.add(candidate.role);
    seenApprovers.add(candidate.approverUserId);
    return {
      role: candidate.role,
      approverUserId: candidate.approverUserId.trim(),
      approverName: candidate.approverName.trim(),
      outstandingConditions: candidate.outstandingConditions ?? null,
    };
  });
}

async function main() {
  const apply = process.env.APPLY === "1";
  const moveId = requiredEnv("MOVE_ID");
  const deliverableId = requiredEnv("DELIVERABLE_ID");
  const decisions = parseDecisions(requiredEnv("ROLE_APPROVAL_DECISIONS_JSON"));

  assertUuid("MOVE_ID", moveId);
  assertUuid("DELIVERABLE_ID", deliverableId);
  if (!apply) {
    throw new Error(
      "Refusing to write without APPLY=1. This script is for approved smoke support only.",
    );
  }

  const client = new Client(
    postgresClientOptions(databaseUrl(), "moves-smoke-role-approval-operator"),
  );
  await client.connect();
  try {
    await client.query("begin");
    const deliverableResult = await client.query<DeliverableRow>(
      `select id, engagement_id, deliverable_type_key, status, current_version, signed_off_version
         from deliverables_v2
        where id = $1
          and engagement_id = $2
        for update`,
      [deliverableId, moveId],
    );
    const deliverable = deliverableResult.rows[0];
    if (!deliverable) {
      throw new Error("deliverable not found for supplied Move");
    }
    if (deliverable.status !== "signed_off") {
      throw new Error(
        `deliverable must be signed_off before role approval; got ${deliverable.status ?? "null"}`,
      );
    }

    const requiredRoles = requiredApprovalRolesFor(
      deliverable.deliverable_type_key,
    );
    const decisionRoles = decisions.map((decision) => decision.role);
    for (const role of decisionRoles) {
      if (!requiredRoles.includes(role)) {
        throw new Error(
          `role ${role} is not required for ${deliverable.deliverable_type_key}`,
        );
      }
    }
    for (const role of requiredRoles) {
      if (!decisionRoles.includes(role)) {
        throw new Error(
          `missing required role ${role} for ${deliverable.deliverable_type_key}`,
        );
      }
    }

    const version =
      deliverable.signed_off_version ?? deliverable.current_version ?? 1;
    const decidedAt = new Date().toISOString();

    for (const decision of decisions) {
      await client.query(
        `insert into deliverable_role_approvals
           (deliverable_id, role, status, version, approver_user_id, approver_name,
            outstanding_conditions, decided_at, updated_at)
         values ($1, $2, 'approved', $3, $4, $5, $6, $7, $7)
         on conflict (deliverable_id, role, version)
         do update set
           status = excluded.status,
           approver_user_id = excluded.approver_user_id,
           approver_name = excluded.approver_name,
           outstanding_conditions = excluded.outstanding_conditions,
           decided_at = excluded.decided_at,
           updated_at = excluded.updated_at`,
        [
          deliverableId,
          decision.role,
          version,
          decision.approverUserId,
          decision.approverName,
          decision.outstandingConditions,
          decidedAt,
        ],
      );
    }

    const readback = await client.query(
      `select role, status, version, approver_user_id, approver_name, decided_at
         from deliverable_role_approvals
        where deliverable_id = $1
          and version = $2
        order by role`,
      [deliverableId, version],
    );
    const approvedRequiredRoles = new Set(
      readback.rows
        .filter((row) => row.status === "approved")
        .map((row) => row.role as ApprovalRole),
    );
    const allRequiredApproved = requiredRoles.every((role) =>
      approvedRequiredRoles.has(role),
    );
    if (!allRequiredApproved) {
      throw new Error("readback did not show every required role approved");
    }

    await client.query("commit");
    console.log(
      JSON.stringify(
        {
          ok: true,
          moveId,
          deliverableId,
          deliverableTypeKey: deliverable.deliverable_type_key,
          version,
          requiredRoles,
          approvedRoles: [...approvedRequiredRoles].sort(),
          rows: readback.rows,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
