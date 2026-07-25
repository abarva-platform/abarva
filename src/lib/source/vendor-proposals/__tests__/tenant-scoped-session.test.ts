import { withVendorProposalFactsSession } from "../tenant-scoped-session";

const runCalls: { sql: string; params: unknown[] }[] = [];

jest.mock("@/lib/data-plane/read-adapters/azureSession", () => ({
  createTxSession: (applicationName: string) => {
    (globalThis as { __appName?: string }).__appName = applicationName;
    return async (fn: (run: unknown) => Promise<unknown>) => {
      const run = jest.fn(async (sql: string, params: unknown[] = []) => {
        runCalls.push({ sql, params });
        return [];
      });
      return fn(run);
    };
  },
}));

beforeEach(() => {
  runCalls.length = 0;
});

describe("withVendorProposalFactsSession", () => {
  it("sets request.jwt.claims to the real identity before SET LOCAL ROLE authenticated", async () => {
    await withVendorProposalFactsSession(
      { tenantKey: "meridian", role: "tenant_admin", userId: "user-42" },
      async () => "done",
    );
    expect(runCalls).toHaveLength(2);
    expect(runCalls[0]!.sql).toContain("set_config('request.jwt.claims'");
    const claims = JSON.parse(runCalls[0]!.params[0] as string);
    expect(claims).toEqual({
      tenant_key: "meridian",
      role: "tenant_admin",
      sub: "user-42",
    });
    expect(runCalls[1]!.sql).toBe("SET LOCAL ROLE authenticated");
  });

  it("returns the caller's function result", async () => {
    const result = await withVendorProposalFactsSession(
      { tenantKey: "apexretail", role: "member", userId: "u1" },
      async (run) => {
        await run("SELECT 1", []);
        return { ok: true };
      },
    );
    expect(result).toEqual({ ok: true });
    // 2 housekeeping calls + 1 caller call.
    expect(runCalls).toHaveLength(3);
  });

  it("uses a dedicated application name for connection attribution", async () => {
    await withVendorProposalFactsSession(
      { tenantKey: "apexretail", role: "member", userId: "u1" },
      async () => undefined,
    );
    expect((globalThis as { __appName?: string }).__appName).toBe(
      "source-vendor-proposal-facts",
    );
  });
});
