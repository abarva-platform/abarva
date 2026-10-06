import type { TxSessionRunner } from "../../read-adapters/azureSession";
import { createAzureDiscoveryArchetypeWriteAdapter } from "../discoveryArchetypeWriteAdapter";

describe("Azure discovery-archetype writer", () => {
  const programId = "00000000-0000-4000-8000-000000000001";
  const clientId = "tenant-client-id";

  it("merges only the declared discovery archetype under id, tenant, and legacy-field guards", async () => {
    let capturedSql = "";
    let capturedParams: unknown[] = [];
    const guardedSession: TxSessionRunner = async (fn) =>
      fn(async <R>(sql: string, params: unknown[]) => {
        capturedSql = sql;
        capturedParams = params;
        return [{ id: programId }] as R[];
      });

    const adapter = createAzureDiscoveryArchetypeWriteAdapter(guardedSession);
    const result = await adapter.setDeclaredArchetype({
      programId,
      clientId,
      expectedProgramArchetype: "ai_product_enablement",
      expectedFunctionPackKey: null,
      archetypeId: "governed_data_foundation",
    });

    expect(result).toEqual({ updated: true });
    expect(capturedSql).toContain("WHERE id = $1 AND client_id = $2");
    expect(capturedSql).toContain("program_archetype IS NOT DISTINCT FROM $3::text");
    expect(capturedSql).toContain("function_pack_key IS NOT DISTINCT FROM $4::text");
    expect(capturedSql).toContain("jsonb_set(");
    expect(capturedSql).toContain("jsonb_build_object('archetype', $5::text)");
    expect(capturedSql).toContain("RETURNING id");
    const setClause = capturedSql.split("WHERE")[0] ?? "";
    expect(setClause).not.toMatch(/(?:gates_passed|current_phase|program_archetype|function_pack_key)/i);
    expect(capturedParams).toEqual([
      programId,
      clientId,
      "ai_product_enablement",
      null,
      "governed_data_foundation",
    ]);
  });

  it("reports a failed precondition when the tenant-scoped row did not update", async () => {
    const session: TxSessionRunner = async (fn) =>
      fn(async <R>() => [] as R[]);
    const adapter = createAzureDiscoveryArchetypeWriteAdapter(session);

    await expect(
      adapter.setDeclaredArchetype({
        programId,
        clientId,
        expectedProgramArchetype: "ai_product_enablement",
        expectedFunctionPackKey: null,
        archetypeId: "governed_data_foundation",
      }),
    ).resolves.toEqual({ updated: false });
  });
});
