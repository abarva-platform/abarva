import { buildAdminStructuredContextPromotionPlan } from "../admin-structured-context-promotion";
import { getTemplateById } from "../template-registry";
import type { AdminStructuredContextPromotionInput } from "../admin-structured-context-promotion";

const baseInput = {
  clientId: "49fc8aee-3d39-48c5-82ac-1313c31470c7",
  tenantKey: "lakeshore-holdings",
  uploadedBy: "user_123",
  uploadedAt: "2026-06-08T13:37:57.117Z",
  uploadId: "csv:lakeshore-holdings:test:hash:20260608T133757",
  sourceFileHash: "f".repeat(64),
};

describe("admin structured context promotion", () => {
  it("promotes org-role rows into records and atomic facts with row provenance", () => {
    const template = getTemplateById("org-roles", {
      tenantKey: "lakeshore-holdings",
    });
    expect(template).toBeTruthy();

    const plan = buildAdminStructuredContextPromotionPlan({
      ...baseInput,
      fileName: "data/lakeshore-org-roles.csv",
      template: template!,
      mapping: {
        templateId: "org-roles",
        dimension: "org_roles_teams",
        sourceRecordIdColumn: "person_id",
        titleColumn: "name",
        textColumns: ["name", "role", "manager_id", "function_name"],
        fieldMappings: {},
      },
      rows: [
        {
          person_id: "P-LSH-CIO",
          name: "Meera Rao",
          role: "Chief Information Officer",
          manager_id: "P-LSH-CEO",
          function_name: "IT",
          source_system: "Workday HCM",
          source_owner: "CHRO",
          last_validated_date: "2026-06-08",
          confidence: "0.88",
        },
      ],
    });

    expect(plan.records).toHaveLength(1);
    expect(plan.records[0]).toEqual(
      expect.objectContaining({
        tenant_key: "lakeshore-holdings",
        canonical_record_id:
          "admin-upload:lakeshore-holdings:data-lakeshore-org-roles-csv:p-lsh-cio",
        record_type: "org_role",
        record_subtype: "org-roles",
        title: "Meera Rao",
        source_file: "data/lakeshore-org-roles.csv",
        source_row_number: 2,
        evidence_pointer:
          "csv-upload://lakeshore-holdings/data%2Flakeshore-org-roles.csv#row=2".replace(
            "Lakeshore",
            "lakeshore",
          ),
      }),
    );
    expect(plan.records[0]?.payload._abarva).toEqual(
      expect.objectContaining({
        source_state: "synthetic_admin_loader_backed",
        template_id: "org-roles",
        promoted_dimension: "org_roles_teams",
      }),
    );
    expect(plan.source.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(plan.sourceFile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(plan.sourceFile.source_id).toBe(plan.source.id);
    expect(plan.sourceFile.file_hash).toBe("f".repeat(64));
    expect(plan.factDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fact_type: "org_role.role",
          fact_text: "Meera Rao — role: Chief Information Officer",
        }),
        expect.objectContaining({
          fact_type: "org_role.manager_id",
          fact_value: expect.objectContaining({ value: "P-LSH-CEO" }),
        }),
      ]),
    );
  });

  it("recovers the true infrastructure dimension when the production package uses a compatibility template", () => {
    const template = getTemplateById("application-portfolio", {
      tenantKey: "lakeshore-holdings",
    });
    expect(template).toBeTruthy();

    const plan = buildAdminStructuredContextPromotionPlan({
      ...baseInput,
      fileName: "data/lakeshore-infrastructure-estate.csv",
      template: template!,
      mapping: {
        templateId: "application-portfolio",
        dimension: "application_portfolio",
        sourceRecordIdColumn: "asset_id",
        titleColumn: "asset_name",
        textColumns: ["asset_name", "asset_class", "make_model"],
        fieldMappings: {},
      },
      rows: [
        {
          asset_id: "INF-DC-CHI",
          asset_name: "Chicago Primary Datacenter",
          asset_class: "datacenter",
          make_model: "Owned datacenter",
          location: "Chicago, IL",
          confidence: "0.88",
        },
        {
          asset_id: "INF-CMP-DELL-01",
          asset_name: "Holdco Private Cloud Compute",
          asset_class: "compute",
          make_model: "Dell PowerEdge R760",
          virtualization: "VMware vSphere 8",
          confidence: "0.88",
        },
      ],
    });

    expect(plan.records.map((record) => record.record_type)).toEqual([
      "facility",
      "configuration_item",
    ]);
    expect(plan.records[0]?.payload._abarva).toEqual(
      expect.objectContaining({
        declared_dimension: "application_portfolio",
        promoted_dimension: "infrastructure_estate",
      }),
    );
    expect(plan.factDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fact_type: "configuration_item.virtualization",
          fact_text:
            "Holdco Private Cloud Compute — virtualization: VMware vSphere 8",
        }),
      ]),
    );
  });

  it("uses stable canonical ids so reruns update records instead of creating duplicate structured facts", () => {
    const template = getTemplateById("vendor-contracts", {
      tenantKey: "lakeshore-holdings",
    });
    expect(template).toBeTruthy();

    const input: AdminStructuredContextPromotionInput = {
      ...baseInput,
      fileName: "data/lakeshore-vendor-contracts.csv",
      template: template!,
      mapping: {
        templateId: "vendor-contracts",
        dimension: "vendor_contracts",
        sourceRecordIdColumn: "contract_id",
        titleColumn: "vendor_name",
        textColumns: ["vendor_name", "annual_value_usd", "renewal_date"],
        fieldMappings: {},
      },
      rows: [
        {
          vendor_id: "V-KYRIBA",
          vendor_name: "Kyriba",
          annual_value_usd: "2200000",
          renewal_date: "2027-03-31",
          contract_id: "CON-LSH-KYRIBA-2026",
        },
      ],
    };

    const first = buildAdminStructuredContextPromotionPlan(input);
    const second = buildAdminStructuredContextPromotionPlan(input);

    expect(second.records[0]?.canonical_record_id).toBe(
      first.records[0]?.canonical_record_id,
    );
    expect(second.factDrafts.map((fact) => fact.fact_key)).toEqual(
      first.factDrafts.map((fact) => fact.fact_key),
    );
    expect(first.factDrafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fact_type: "contract.annual_value_usd",
          fact_value: expect.objectContaining({ value: 2200000 }),
        }),
      ]),
    );
  });

  it("disambiguates repeated record-id column values within one structured upload", () => {
    const template = getTemplateById("dora-baseline", {
      tenantKey: "skyharbor-air",
    });
    expect(template).toBeTruthy();

    const input: AdminStructuredContextPromotionInput = {
      ...baseInput,
      clientId: "client-skyharbor",
      tenantKey: "skyharbor-air",
      fileName: "dora_productivity_baseline.csv",
      template: template!,
      mapping: {
        templateId: "dora-baseline",
        dimension: "delivery_dora_devex",
        sourceRecordIdColumn: "scorecard_id",
        titleColumn: "metric",
        textColumns: ["domain", "metric", "lead_time_for_change_hours"],
        fieldMappings: {
          team_id: "scorecard_id",
          measured_at: "last_updated",
          deploy_freq_per_week: "deploy_frequency_per_week",
          lead_time_hours: "lead_time_for_change_hours",
        },
      },
      rows: [
        {
          scorecard_id: "SKYH-DORA-PRODUCT",
          domain: "Product engineering",
          metric: "Lead time",
          lead_time_for_change_hours: "36",
          deploy_frequency_per_week: "7",
          last_updated: "2026-06-01",
        },
        {
          scorecard_id: "SKYH-DORA-PRODUCT",
          domain: "Product engineering",
          metric: "Deployment frequency",
          lead_time_for_change_hours: "36",
          deploy_frequency_per_week: "7",
          last_updated: "2026-06-01",
        },
      ],
    };

    const first = buildAdminStructuredContextPromotionPlan(input);
    const second = buildAdminStructuredContextPromotionPlan(input);
    const canonicalRecordIds = first.records.map(
      (record) => record.canonical_record_id,
    );

    expect(new Set(canonicalRecordIds).size).toBe(first.records.length);
    expect(canonicalRecordIds).toEqual([
      "admin-upload:skyharbor-air:dora-productivity-baseline-csv:skyh-dora-product-row-2",
      "admin-upload:skyharbor-air:dora-productivity-baseline-csv:skyh-dora-product-row-3",
    ]);
    expect(second.records.map((record) => record.canonical_record_id)).toEqual(
      canonicalRecordIds,
    );
    expect(first.records.map((record) => record.source_record_id)).toEqual([
      "admin-upload:skyharbor-air:dora-productivity-baseline-csv:SKYH-DORA-PRODUCT-row-2",
      "admin-upload:skyharbor-air:dora-productivity-baseline-csv:SKYH-DORA-PRODUCT-row-3",
    ]);
  });
});
