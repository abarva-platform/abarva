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
      if (sql.includes("with record_counts") || sql.includes("from intelligence_v7.dimension_registry")) {
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

// A routing session that answers each query family. `contract` controls the
// primary required_level-contract gap query; `denylist` controls the fallback.
function routingSession(opts: {
  contract: "rows" | "empty" | "throw";
  contractGapRows?: Array<{ column_name: string; gap_count: number }>;
  denylist?: "rows" | "throw";
  denylistGapRows?: Array<{ column_name: string; gap_count: number }>;
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
      if (sql.includes("with record_counts") || sql.includes("from intelligence_v7.dimension_registry")) {
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
      // primary: required_level (Required|Recommended) contract gap query
      if (sql.includes("cr.required_level ~* '^(required|recommended)'")) {
        if (opts.contract === "throw") throw new Error("contract query failed");
        if (opts.contract === "empty") return [] as R[];
        return (opts.contractGapRows ?? []).map((r) => ({
          dimension_key: dim,
          ...r,
        })) as R[];
      }
      // fallback: provenance-denylist gap query (no required_level join)
      if (sql.includes("kv.key <> all($4::text[])")) {
        if (opts.denylist === "throw") throw new Error("denylist query failed");
        return (opts.denylistGapRows ?? []).map((r) => ({
          dimension_key: dim,
          ...r,
        })) as R[];
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

function chunkRegistrySession(): SessionRunner {
  const dim = "v7_20_chunk_retrieval_registry";
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
            row_count: 500,
            field_count: 1000,
            graph_node_count: 10,
            relationship_edge_count: 10,
            chunk_count: 500,
            loaded_at: "2026-07-03T00:00:00.000Z",
          },
        ] as R[];
      }
      if (sql.includes("with record_counts") || sql.includes("from intelligence_v7.dimension_registry")) {
        return [
          {
            dimension_key: dim,
            dimension_file: "V7_20_chunk_retrieval_registry.csv",
            // Raw authored label — this is the jargon string that must be
            // overridden for the CXO-facing display everywhere it's used.
            dimension_label: "Chunk / Retrieval Registry",
            column_count: 8,
            record_count: 500,
            source_files: 1,
          },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.column_registry")) {
        return [
          { dimension_key: dim, column_name: "source_artifact_ref", client_field: "Source artifact ref", client_instruction: "", module_use: "" },
          { dimension_key: dim, column_name: "semantic_tags", client_field: "Semantic tags", client_instruction: "", module_use: "" },
          { dimension_key: dim, column_name: "retrieval_eligibility", client_field: "Retrieval eligibility", client_instruction: "", module_use: "" },
          { dimension_key: dim, column_name: "chunk_id", client_field: "Chunk id", client_instruction: "", module_use: "" },
          { dimension_key: dim, column_name: "entity_name", client_field: "Entity name", client_instruction: "", module_use: "" },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.business_records")) {
        return [
          {
            dimension_key: dim,
            record_key: "hidden",
            record_name: null,
            source_file: "V7_20_chunk_retrieval_registry.csv",
            source_row_number: 2,
            source_artifact_name: "application-inventory.xlsx",
            source_validation_status: "validated",
            values_json: {
              source_artifact_ref: "application-inventory.xlsx",
              semantic_tags: "industrial holdco; corporate finance",
              retrieval_eligibility: "eligible",
              chunk_id: "lakeshore-industries-v2-chunk-00003",
              entity_name: "Lakeshore Holdings",
            },
          },
        ] as R[];
      }
      return [] as R[];
    });
}

describe("getHomeV7ContextBrowser — plain-English labels for CXO readability", () => {
  it("renames jargon dimension labels and column headers to plain English", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: chunkRegistrySession(),
    });

    // The dropdown/header/binding-context label is the friendly override, not
    // the raw authored "Chunk / Retrieval Registry" string.
    expect(browser?.bindingContext?.[0]?.dimension).toBe("AI Search Coverage");
    const preview = browser?.dimensions["AI Search Coverage"];
    expect(preview).toBeDefined();

    const labels = preview!.columns.map((column) => column.label);
    expect(labels).toContain("Source Document");
    expect(labels).toContain("Topics");
    expect(labels).toContain("Searchable by aVa");
    expect(labels).toContain("Company / Unit");
    // Raw jargon/DB-derived labels must not leak through.
    expect(labels).not.toContain("Source Artifact Ref");
    expect(labels).not.toContain("Semantic Tags");
    expect(labels).not.toContain("Retrieval Eligibility");
    expect(labels).not.toContain("Entity Name");
  });

  it("never surfaces a raw chunk_id (or any *_id column) as a preview column", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: chunkRegistrySession(),
    });
    const preview = browser?.dimensions["AI Search Coverage"];
    const keys = preview!.columns.map((column) => column.key);
    expect(keys).not.toContain("chunk_id");
    expect(JSON.stringify(preview)).not.toContain("lakeshore-industries-v2-chunk-00003");
  });
});

function holdcoHierarchySession(onRunParams?: (params: unknown[]) => void): SessionRunner {
  const dim = "v7_00_portfolio_entity_registry";
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => {
      if (sql.includes("from intelligence_v7.tenant_pack_runs")) {
        onRunParams?.(params);
        return [
          {
            tenant_key: params[0],
            tenant_name: "Lakeshore Holdings",
            contract_version: "v7.1.0-holdco-entity-spine-20260706",
            source_dataset: "lakeshore-holdco-v7",
            load_status: "validated",
            file_count: 25,
            row_count: 2722,
            field_count: 100000,
            graph_node_count: 1000,
            relationship_edge_count: 522,
            chunk_count: 400,
            loaded_at: "2026-07-06T00:00:00.000Z",
          },
        ] as R[];
      }
      if (sql.includes("with record_counts") || sql.includes("from intelligence_v7.dimension_registry")) {
        return [
          {
            dimension_key: dim,
            dimension_file: "V7_00_portfolio_entity_registry.csv",
            dimension_label: "Portfolio Entity Registry",
            column_count: 18,
            record_count: 8,
            source_files: 1,
          },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.column_registry")) {
        return [
          { dimension_key: dim, column_name: "entity_id", client_field: "Entity ID", client_instruction: "Stable ID", module_use: "Home" },
          { dimension_key: dim, column_name: "entity_name", client_field: "Entity name", client_instruction: "Name", module_use: "Home" },
          { dimension_key: dim, column_name: "entity_scope", client_field: "Entity scope", client_instruction: "Scope", module_use: "Home" },
          { dimension_key: dim, column_name: "parent_entity_name", client_field: "Parent entity name", client_instruction: "Parent", module_use: "Home" },
          { dimension_key: dim, column_name: "revenue_usd", client_field: "Revenue USD", client_instruction: "Revenue", module_use: "Home" },
          { dimension_key: dim, column_name: "employee_count", client_field: "Employee count", client_instruction: "Employees", module_use: "Home" },
          { dimension_key: dim, column_name: "total_direct_technology_budget_usd", client_field: "Technology budget USD", client_instruction: "Budget", module_use: "Home" },
        ] as R[];
      }
      if (sql.includes("from intelligence_v7.business_records")) {
        return [
          {
            dimension_key: dim,
            record_key: "hidden-holdco",
            record_name: "Lakeshore Holdings",
            source_file: "V7_00_portfolio_entity_registry.csv",
            source_row_number: 2,
            source_artifact_name: "V7_00_portfolio_entity_registry.csv",
            source_validation_status: "synthetic_demo",
            values_json: {
              entity_id: "LSH-HOLDCO",
              entity_name: "Lakeshore Holdings",
              entity_scope: "holdco",
              parent_entity_name: "",
              revenue_usd: "7120000000",
              employee_count: "11800",
              total_direct_technology_budget_usd: "190600000",
            },
          },
          {
            dimension_key: dim,
            record_key: "hidden-opco",
            record_name: "Northline Supply Chain",
            source_file: "V7_00_portfolio_entity_registry.csv",
            source_row_number: 3,
            source_artifact_name: "V7_00_portfolio_entity_registry.csv",
            source_validation_status: "synthetic_demo",
            values_json: {
              entity_id: "LSH-OPCO-NLS",
              entity_name: "Northline Supply Chain",
              entity_scope: "portfolio_company",
              parent_entity_name: "Lakeshore Holdings",
              revenue_usd: "1500000000",
              employee_count: "3000",
              total_direct_technology_budget_usd: "32500000",
            },
          },
        ] as R[];
      }
      return [] as R[];
    });
}

describe("getHomeV7ContextBrowser — holdco entity spine", () => {
  it("uses the latest validated tenant contract when Home is not explicitly pinned", async () => {
    let runParams: unknown[] | null = null;
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: holdcoHierarchySession((params) => {
        runParams = params;
      }),
    });

    expect(runParams?.[1]).toBeNull();
    expect(browser?.datasetDir).toBe("lakeshore-holdco-v7");
    expect(browser?.dimensions["Portfolio Company Hierarchy"]?.rowCount).toBe(8);
  });

  it("surfaces portfolio company hierarchy as a first-class Home dimension", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: holdcoHierarchySession(),
      contractVersion: "v7.1.0-holdco-entity-spine-20260706",
    });

    expect(browser?.bindingContext?.[0]?.dimension).toBe("Portfolio Company Hierarchy");
    const preview = browser?.dimensions["Portfolio Company Hierarchy"];
    expect(preview?.columns.map((column) => column.label)).toEqual([
      "Company / Unit",
      "Company Scope",
      "Parent Company",
      "Revenue USD",
      "Employee Count",
      "Technology Budget USD",
    ]);
    expect(preview?.rows.flat()).toContain("Northline Supply Chain");
    expect(preview?.rows.flat()).toContain("portfolio company");
  });
});

describe("getHomeV7ContextBrowser — evidence-gap scoping", () => {
  it("counts gaps from the Required+Recommended required_level contract query", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({
        contract: "rows",
        contractGapRows: [{ column_name: "parent_entity_name", gap_count: 5 }],
        denylistGapRows: [{ column_name: "should_not_be_used", gap_count: 99 }],
      }),
    });
    const preview = browser?.dimensions["Business Functions"];
    // Primary contract query wins (5), not the denylist's 99.
    expect(preview?.dataThinCells).toBe(5);
    expect(preview?.knownGaps.map((gap) => gap.label)).toContain("Parent Entity Name");
  });

  it("shows 0 gaps (NOT the preview sample) when the contract query returns none", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({ contract: "empty" }),
    });
    const preview = browser?.dimensions["Business Functions"];
    // Regression guard: an empty full-dimension result reads as 0, not the
    // <=12-row sample (which would count the blank parent_entity_name).
    expect(preview?.dataThinCells).toBe(0);
    expect(preview?.knownGaps).toHaveLength(0);
  });

  it("falls back to the provenance denylist when the contract query throws", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({
        contract: "throw",
        denylist: "rows",
        denylistGapRows: [{ column_name: "parent_entity_name", gap_count: 5 }],
      }),
    });
    const preview = browser?.dimensions["Business Functions"];
    expect(preview?.dataThinCells).toBe(5);
  });

  it("falls back to the preview sample only when BOTH gap queries throw", async () => {
    const browser = await getHomeV7ContextBrowser({
      tenantKey: "lakeshore",
      session: routingSession({ contract: "throw", denylist: "throw" }),
    });
    const preview = browser?.dimensions["Business Functions"];
    // Sample of the one preview row: parent_entity_name is blank → 1 gap.
    expect(preview?.dataThinCells).toBe(1);
  });
});
