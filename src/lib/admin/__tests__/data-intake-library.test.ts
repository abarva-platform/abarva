import {
  ADMIN_TEMPLATE_CATALOG,
  buildAdminDataIntakeLibraryView,
} from "@/lib/admin/data-intake-library";
import { buildAdminSetupControlReadModel } from "@/lib/admin/setup-control";

describe("admin data intake library", () => {
  it("defines the requested business-facing template catalog", () => {
    expect(ADMIN_TEMPLATE_CATALOG).toHaveLength(19);
    expect(ADMIN_TEMPLATE_CATALOG.map((item) => item.name)).toEqual([
      "Enterprise Profile",
      "Business Functions",
      "Organization / Ownership",
      "Workforce & Personas",
      "Applications & Systems",
      "Data Assets & Integrations",
      "Vendors & Contracts",
      "Spend & Value",
      "Programs, Initiatives & Business Priorities",
      "AI Initiatives",
      "Risks & Controls",
      "Relationships",
      "Evidence Sources",
      "Metric Definitions",
      "Industry / Benchmark Inputs",
      "Infrastructure & Cloud Estate",
      "Source Event Pack",
      "Moves Program Pack",
      "Tower Outcome Pack",
    ]);
  });

  it("maps source evidence to template status without promoting candidate data", () => {
    const sourceFiles = [
      {
        source_doc: "04_cmdb_application_portfolio.csv",
        chunk_count: 12,
        first_loaded_at: "2026-07-12T12:00:00.000Z",
        sample_chunk_id: "chunk-1",
      },
      {
        source_doc: "vendor_contracts.csv",
        chunk_count: 8,
        first_loaded_at: "2026-07-12T12:10:00.000Z",
        sample_chunk_id: "chunk-2",
      },
    ];
    const setupControl = buildAdminSetupControlReadModel({
      tenantKey: "lakeshore",
      displayName: "Lakeshore Holdings",
      coverName: "Lakeshore Holdings",
      snapshot: null,
      sourceFiles,
    });

    const view = buildAdminDataIntakeLibraryView({
      setupControl,
      sourceFiles,
    });

    expect(view.guides).toHaveLength(6);
    expect(view.guardrails).toContain(
      "Uploading a completed template does not make it active tenant truth.",
    );
    expect(view.statusCounts.uploaded).toBeGreaterThanOrEqual(2);
    expect(view.statusCounts["candidate-ready"]).toBe(0);
    expect(view.statusCounts.active).toBe(0);

    expect(
      view.catalog.find((item) => item.id === "applications-systems"),
    ).toEqual(
      expect.objectContaining({
        status: "uploaded",
        matchedSourceFiles: ["04_cmdb_application_portfolio.csv"],
      }),
    );
    expect(view.catalog.find((item) => item.id === "source-event-pack")).toEqual(
      expect.objectContaining({
        status: "not-uploaded",
        statusDetail:
          "Template contract defined - downloadable file not yet generated.",
      }),
    );
  });
});
