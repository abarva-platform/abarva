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
    const preview = browser?.dimensions["Applications Systems"];
    expect(preview?.rowCount).toBe(200);
    expect(preview?.columns.map((column) => column.label)).toContain("System");
    expect(preview?.rows[0]).toContain("SkyOps Recovery Platform");
    expect(JSON.stringify(preview)).not.toContain("internal-key-hidden");
  });
});
