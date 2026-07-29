import { Pool } from "pg";
import {
  createPgConsumptionQuery,
  resolveConsumptionDatabaseForTenant,
} from "../db";

describe("consumption server database resolution", () => {
  it("uses a tenant-scoped URL for governed tenant consumption reads", () => {
    const env = {
      DATABASE_URL: "postgres://shared:pass@shared.example.com:5432/control",
      ABARVA_TENANT_DATABASE_URL_AIRLINE_DEMO_NEW:
        "postgres://tenant:pass@private.example.com:5432/airline",
    } as unknown as NodeJS.ProcessEnv;

    const resolved = resolveConsumptionDatabaseForTenant(
      "airline-demo-new",
      env,
    );

    expect(String(resolved.config.connectionString)).toContain(
      "private.example.com",
    );
    expect(resolved.sourceEnvName).toBe(
      "ABARVA_TENANT_DATABASE_URL_AIRLINE_DEMO_NEW",
    );
    expect(resolved.maskedConnectionString).toContain("private.example.com");
    expect(resolved.maskedConnectionString).not.toContain("pass");
  });

  it("supports tenant-scoped passwordless Postgres host config", () => {
    const env = {
      DATABASE_URL: "postgres://shared:pass@shared.example.com:5432/control",
      ABARVA_TENANT_PGHOST_AIRLINE_DEMO_NEW:
        "pg-tenant.postgres.database.azure.com",
      ABARVA_TENANT_PGUSER_AIRLINE_DEMO_NEW: "mi-airdn-read-lab-001",
      ABARVA_TENANT_PGDATABASE_AIRLINE_DEMO_NEW:
        "abarva_airline_demo_new_knowledge_lab",
      ABARVA_TENANT_POSTGRES_AAD_CLIENT_ID_AIRLINE_DEMO_NEW: "client-id-1",
      ABARVA_TENANT_PGSSLMODE_AIRLINE_DEMO_NEW: "require",
    } as unknown as NodeJS.ProcessEnv;

    const resolved = resolveConsumptionDatabaseForTenant(
      "airline-demo-new",
      env,
    );

    expect(resolved.config.host).toBe("pg-tenant.postgres.database.azure.com");
    expect(resolved.config.user).toBe("mi-airdn-read-lab-001");
    expect(resolved.config.database).toBe(
      "abarva_airline_demo_new_knowledge_lab",
    );
    expect(resolved.sourceEnvName).toBe(
      "ABARVA_TENANT_POSTGRES_AAD_CLIENT_ID_AIRLINE_DEMO_NEW",
    );
    expect(resolved.maskedConnectionString).toContain(
      "mi-airdn-read-lab-001@pg-tenant.postgres.database.azure.com",
    );
  });

  it("refuses shared DATABASE_URL fallback for governed tenant consumption reads", () => {
    const env = {
      DATABASE_URL: "postgres://shared:pass@shared.example.com:5432/control",
    } as unknown as NodeJS.ProcessEnv;

    expect(() =>
      resolveConsumptionDatabaseForTenant("airline-demo-new", env),
    ).toThrow(
      /Tenant-scoped consumption database URL is required for airline-demo-new/,
    );
  });

  it("binds and resets app.tenant_key for tenant-scoped RLS reads", async () => {
    const calls: Array<{ sql: string; params: unknown[] | undefined }> = [];
    const release = jest.fn();
    const query = jest.fn(async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql === "SELECT 1 as value") return { rows: [{ value: 1 }] };
      return { rows: [] };
    });
    const connect = jest
      .spyOn(Pool.prototype, "connect")
      .mockResolvedValue({ query, release } as never);

    try {
      const consumptionQuery = createPgConsumptionQuery(
        { connectionString: "postgres://tenant:pass@private.example.com/db" },
        "test-tenant-rls-binding",
        { tenantKey: "airline-demo-new" },
      );

      await expect(consumptionQuery.rows("SELECT 1 as value")).resolves.toEqual(
        [{ value: 1 }],
      );
    } finally {
      connect.mockRestore();
    }

    expect(calls.map((call) => call.sql)).toEqual([
      "SET TRANSACTION READ ONLY",
      "SELECT set_config('app.tenant_key', $1, false)",
      "SELECT 1 as value",
      "RESET app.tenant_key",
    ]);
    expect(calls[1]?.params).toEqual(["airline-demo-new"]);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
