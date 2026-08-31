import { readFileSync } from "node:fs";

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(`${ROOT}/${path}`, "utf8");
}

describe("Tower runtime RLS role", () => {
  const migration = read(
    "supabase/migrations/20260831122000_tower_runtime_reader_role.sql",
  );
  const reader = read("src/lib/tower/readTowerCommandCenter.ts");
  const probe = read("scripts/ops/probe-tower-rls-enforcement.mjs");

  it("declares a no-login non-bypass Tower projection reader", () => {
    expect(migration).toContain("CREATE ROLE tower_projection_reader");
    expect(migration).toContain("NOLOGIN");
    expect(migration).toContain("NOBYPASSRLS");
    expect(migration).toContain("NOINHERIT");
    expect(migration).toContain("GRANT tower_projection_reader TO");
  });

  it("makes every Tower serving view execute as the invoker", () => {
    for (const view of [
      "tower_adoption_lens",
      "tower_ai_portfolio",
      "tower_command_center",
      "tower_cost_lens",
      "tower_decision_lanes",
      "tower_evidence",
      "tower_recommended_actions",
      "tower_risk_lens",
      "tower_value_proof",
    ]) {
      expect(migration).toContain(`'${view}'`);
    }
    expect(migration).toContain("ALTER VIEW serving.%I SET (security_invoker = true)");
    expect(migration).toContain("GRANT SELECT ON serving.%I TO tower_projection_reader");
  });

  it("runs Tower reads in a local read-only role and tenant scope", () => {
    expect(reader).toContain("BEGIN READ ONLY");
    expect(reader).toContain("SET LOCAL ROLE");
    expect(reader).toContain("tower_projection_reader");
    expect(reader).toContain("SELECT set_config('app.tenant_key', $1, true)");
    expect(reader).toContain("COMMIT");
    expect(reader).toContain("ROLLBACK");
    expect(reader).not.toContain("SELECT set_config('app.tenant_key', $1, false)");
  });

  it("probes behavior, not only declared policy state", () => {
    expect(probe).toContain("SET LOCAL ROLE");
    expect(probe).toContain("security_invoker=true");
    expect(probe).toContain("no_tenant_guc");
    expect(probe).toContain("cross_tenant_rows");
    expect(probe).toContain("TOWER_RLS_ENFORCEMENT_PROBE_OK");
  });
});
