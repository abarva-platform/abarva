import type { SessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { getHomeV7ContextBrowser } from "@/lib/home/v7-context-browser";

function fakeSession(): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      if (sql.includes("from intelligence_v7.tenant_pack_runs")) {
        return [
          {
            tenant_key: params[0],
            tenant_name: "SkyHarbor Air Group",
            contract_version: "v7.0.0-synthetic-depth-v2-20260703",
            source_dataset: "/Users/anand/Downloads/abarva-v7-synthetic-client-data-v2-20260703",
            load_status: "validated",
            file_count: 24,
            row_count: 5473,
            field_count: 160560,
            graph_node_count: 3492,
            relationship_edge_count: 1500,
            chunk_count: 1000,
            loaded_at: "2026-07-03T17:53:00.675Z",
          },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.dimension_registry")) {
        return [
          {
            dimension_key: "v7_05_applications_systems",
            dimension_file: "V7_05_applications_systems.csv",
            dimension_label: "Applications Systems",
            column_count: 38,
            record_count: 200,
            source_files: 1,
          },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.column_registry")) {
        return [
          { dimension_key: "v7_05_applications_systems", column_name: "system_name", client_field: "System", client_instruction: "System name", module_use: "Loaded Facts" },
          { dimension_key: "v7_05_applications_systems", column_name: "system_category", client_field: "System category", client_instruction: "Category", module_use: "Context" },
          { dimension_key: "v7_05_applications_systems", column_name: "system_owner", client_field: "Owner", client_instruction: "Owner", module_use: "Loaded Facts" },
          { dimension_key: "v7_05_applications_systems", column_name: "criticality", client_field: "Criticality", client_instruction: "Criticality", module_use: "Loaded Facts" },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.business_records")) {
        return [
          {
            dimension_key: "v7_05_applications_systems",
            record_key: "internal-key-hidden",
            record_name: "SkyOps Recovery Platform",
            source_file: "V7_05_applications_systems.csv",
            source_row_number: 2,
            source_artifact_name: "V7_05_applications_systems.csv",
            source_validation_status: "validated",
            values_json: {
              system_name: "SkyOps Recovery Platform",
              system_category: "Operations platform",
              system_owner: "Operations Technology",
              criticality: "critical",
            },
          },
        ] as R[];
      }
      return [] as R[];
    });
}

describe("getHomeV7ContextBrowser", () => {
  it("returns a V7 canvas browser with readable fields and no raw row key", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "skyharbor",
      session: fakeSession(),
    });

    expect(browser?.contractLabel).toBe("V7");
    expect(browser?.bindingContext).toHaveLength(1);
    expect(browser?.bindingContext?.[0]?.dimension).toBe("Applications Systems");
    expect(browser?.bindingContext?.[0]?.description).not.toMatch(/V7_|\.csv|V7 uses/);
    const preview = browser?.dimensions["Applications Systems"];
    expect(preview?.rowCount).toBe(200);
    expect(preview?.title).toBe("Applications Systems loaded records");
    expect(preview?.columns.map((column) => column.label)).toContain("System");
    expect(preview?.rows[0]).toContain("SkyOps Recovery Platform");
    expect(JSON.stringify(preview)).not.toContain("internal-key-hidden");
  });
});

// A routing session that answers each query family and lets a test control the
// required-field-contract probe and which gap query "wins".
function routingSession(opts: {
  requiredLevelExists: boolean;
  requiredContractCount: number;
  requiredGapRows: Array<{ column_name: string; gap_count: number }>;
  denylistGapRows: Array<{ column_name: string; gap_count: number }>;
}): SessionRunner {
  const dim = "v7_02_business_functions";
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      if (sql.includes("from intelligence_v7.tenant_pack_runs")) {
        return [
          {
            tenant_key: params[0],
            tenant_name: "Lakeshore Holdings",
            contract_version: "v7.0.0-synthetic-depth-v2-20260703",
            source_dataset: "lakeshore",
            load_status: "validated",
            file_count: 24,
            row_count: 25,
            field_count: 800,
            graph_node_count: 10,
            relationship_edge_count: 10,
            chunk_count: 10,
            loaded_at: "2026-07-03T00:00:00.000Z",
          },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.dimension_registry")) {
        return [
          {
            dimension_key: dim,
            dimension_file: "V7_02_business_functions.csv",
            dimension_label: "Business Functions",
            column_count: 6,
            record_count: 25,
            source_files: 1,
          },
        ] as R[];
      }
      // required-field-contract probe
      if (sql.includes("count(*)::int as n")) {
        if (!opts.requiredLevelExists) {
          throw Object.assign(new Error('column "required_level" does not exist'), {
            code: "42703",
          });
        }
        return [{ n: opts.requiredContractCount }] as R[];
      }
      // required-field gap query (joins column_registry, filters required_level)
      if (sql.includes("cr.required_level ~* '^required'")) {
        return opts.requiredGapRows.map((r) => ({ dimension_key: dim, ...r })) as R[];
      }
      // provenance-denylist gap query
      if (sql.includes("kv.key <> all($4::text[])")) {
        return opts.denylistGapRows.map((r) => ({ dimension_key: dim, ...r })) as R[];
      }
      if (sql.includes("from intelligence_v7.column_registry")) {
        return [
          { dimension_key: dim, column_name: "executive_owner", client_field: "Executive owner", client_instruction: "Owner", module_use: "Loaded Facts" },
          { dimension_key: dim, column_name: "parent_entity_name", client_field: "Parent entity name", client_instruction: "Parent", module_use: "Context" },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.business_records")) {
        return [
          {
            dimension_key: dim,
            record_key: "hidden",
            record_name: "Corporate Finance",
            source_file: "V7_02_business_functions.csv",
            source_row_number: 2,
            source_artifact_name: "V7_02_business_functions.csv",
            source_validation_status: "synthetic_demo",
            values_json: { executive_owner: "CEO", parent_entity_name: "" },
          },
        ] as R[];
      }
      return [] as R[];
    });
}

describe("getHomeV7ContextBrowser — evidence-gap scoping", () => {
  it("uses the required-field contract when column_registry.required_level is populated", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({
        requiredLevelExists: true,
        requiredContractCount: 42,
        requiredGapRows: [{ column_name: "executive_owner", gap_count: 2 }],
        denylistGapRows: [{ column_name: "parent_entity_name", gap_count: 5 }],
      }),
    });
    const preview = browser?.dimensions["Business Functions"];
    // Required-field query wins: 2 real required-field gaps, NOT the denylist's 5.
    expect(preview?.dataThinCells).toBe(2);
    expect(preview?.knownGaps.map((gap) => gap.label)).toContain("Executive Owner");
    expect(preview?.knownGaps.map((gap) => gap.label)).not.toContain("Parent Entity Name");
  });

  it("falls back to the provenance denylist when required_level is absent", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({
        requiredLevelExists: false,
        requiredContractCount: 0,
        requiredGapRows: [{ column_name: "executive_owner", gap_count: 2 }],
        denylistGapRows: [{ column_name: "parent_entity_name", gap_count: 5 }],
      }),
    });
    const preview = browser?.dimensions["Business Functions"];
    // Probe threw (column absent) → denylist path used.
    expect(preview?.dataThinCells).toBe(5);
    expect(preview?.knownGaps.map((gap) => gap.label)).toContain("Parent Entity Name");
  });
});
