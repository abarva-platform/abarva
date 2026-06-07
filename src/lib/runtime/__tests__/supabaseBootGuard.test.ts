import {
  assertNoSupabaseRuntime,
  evaluateSupabaseBootGuard,
} from "../supabaseBootGuard";

const ORIGINAL_ENV = process.env;

describe("supabaseBootGuard", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  it("allows an Azure Postgres runtime without Supabase env vars", () => {
    const result = evaluateSupabaseBootGuard({
      ...process.env,
      DATABASE_URL:
        "postgresql://pg-abarva-context-lab-001.postgres.database.azure.com/postgres",
    });

    expect(result).toEqual({ ok: true, violations: [] });
  });

  it("blocks Supabase env vars and Supabase-hosted database URLs", () => {
    const result = evaluateSupabaseBootGuard({
      ...process.env,
      DATABASE_URL: "postgresql://aws-1-us-east-2.pooler.supabase.com/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "redacted",
      SUPABASE_SERVICE_ROLE_KEY: "redacted",
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      "forbidden env var present: NEXT_PUBLIC_SUPABASE_URL",
      "forbidden env var present: NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "forbidden env var present: SUPABASE_SERVICE_ROLE_KEY",
      "DATABASE_URL points at a Supabase host",
    ]);
  });

  it("throws only for production Azure Postgres runtime violations", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      ABARVA_DATA_PLANE: "azure-postgres",
      DATABASE_URL: "postgresql://pooler.supabase.com/postgres",
    };

    expect(() => assertNoSupabaseRuntime()).toThrow(
      "Supabase runtime configuration is forbidden for Azure Postgres production.",
    );
  });

  it("does not run outside the Azure Postgres production runtime", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      ABARVA_DATA_PLANE: "azure-postgres",
      DATABASE_URL: "postgresql://pooler.supabase.com/postgres",
    };

    expect(() => assertNoSupabaseRuntime()).not.toThrow();
  });
});
