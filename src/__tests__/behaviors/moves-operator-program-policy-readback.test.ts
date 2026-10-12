import { withAzureWriteTransaction } from "@/lib/data-plane/postgresCompat";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";

jest.mock("@/lib/data-plane/postgresCompat", () => {
  const actual = jest.requireActual("@/lib/data-plane/postgresCompat");
  return { ...actual, getAzureReadFluentClient: () => actual.getAzureWriteFluentClient() };
});

const actor = "00000000-0000-4000-8000-000000000101";
const client = "00000000-0000-4000-8000-000000000102";
const program = "00000000-0000-4000-8000-000000000104";
const ctx = { userId: actor, clientId: client, clientKey: "meridian", role: "client_viewer",
  syntheticE2eOperator: true, email: "proof@synthetic.invalid" };

async function readPolicy(mode: "assigned" | "empty" | "denied" | "membership-error" | "programs-error" | "participants-error") {
  const statements: Array<{ sql: string; params: unknown[] }> = [];
  const connection = { query: jest.fn(async (sql: string, params: unknown[] = []) => {
    statements.push({ sql, params });
    if (/^BEGIN|^SET LOCAL|^COMMIT|^ROLLBACK/.test(sql)) return { command: sql.startsWith("COMMIT") ? "COMMIT" : "CONTROL", rows: [] };
    if (sql.includes('FROM "person_client_memberships"')) {
      if (mode === "membership-error") throw Object.assign(new Error("unavailable"), { code: "08006" });
      return { rows: [{ role: "client_viewer", access_level: "program_member", financial_visibility: true,
        can_admin_users: false, can_create_programs: mode !== "denied", can_approve_gates: true }] };
    }
    if (sql.includes('FROM "engagements"')) {
      if (mode === "programs-error") throw new Error("unavailable");
      expect(sql).toContain('"client_id" = $1');
      expect(sql).toContain('"archived_at" IS NULL');
      expect(sql).toContain('"deleted_at" IS NULL');
      expect(params).toEqual([client]);
      return { rows: mode === "empty" ? [] : [{ id: program }] };
    }
    if (sql.includes('FROM "engagement_participants"')) {
      if (mode === "participants-error") throw new Error("unavailable");
      if (sql.includes('"engagement".')) throw new Error("embedded relationship has no SQL join");
      expect(sql).toContain('"user_id" = $1');
      expect(sql).toContain('"engagement_id" = ANY($2)');
      expect(params).toEqual([actor, [program]]);
      return { rows: [{ engagement_id: program, role: "Automated E2E Operator", approval_authority: "approver",
        program_access_level: "program_member", can_view_financial: true, can_upload: true,
        can_generate_deliverables: true, can_publish_deliverables: true, can_approve_phase_gates: true }] };
    }
    throw new Error("Unexpected SQL " + sql);
  }), release: jest.fn() };
  let result: Awaited<ReturnType<typeof loadUserProgramAccessPolicy>> | null = null;
  let error: unknown;
  try { result = await withAzureWriteTransaction("fixture-only", () => loadUserProgramAccessPolicy(ctx), {
    connect: async () => connection as unknown as Pick<import("pg").PoolClient, "query" | "release">,
  }); }
  catch (caught) { error = caught; }
  expect(statements.some(({ sql }) => /^(INSERT|UPDATE|DELETE)/.test(sql))).toBe(false);
  expect(connection.release).toHaveBeenCalledTimes(1);
  return { result, error, statements };
}

it("reads assigned scope through real Postgres predicates and no embedded relationship", async () => {
  const { result, error } = await readPolicy("assigned");
  expect(error).toBeUndefined();
  expect(result).toMatchObject({ accessLevel: "program_member", programScope: "assigned_programs_only",
    programIdsAllowed: [program], canCreatePrograms: true, canAdminUsers: false, canApproveGates: true });
});

it("allows first creation with zero active Moves and no all-program visibility", async () => {
  const { result, statements, error } = await readPolicy("empty");
  expect(error).toBeUndefined();
  expect(result).toMatchObject({ programIdsAllowed: [], canCreatePrograms: true, canAdminUsers: false });
  expect(statements.some(({ sql }) => sql.includes('FROM "engagement_participants"'))).toBe(false);
});

it("preserves a real create=false denial", async () => {
  const { result, error } = await readPolicy("denied");
  expect(error).toBeUndefined();
  expect(result?.canCreatePrograms).toBe(false);
});

it.each(["membership-error", "programs-error", "participants-error"] as const)("keeps %s unavailable instead of an empty permission result", async (mode) => {
  const { result, error } = await readPolicy(mode);
  expect(result).toBeNull();
  expect(error).toMatchObject({ code: "program_access_policy_unavailable" });
});
