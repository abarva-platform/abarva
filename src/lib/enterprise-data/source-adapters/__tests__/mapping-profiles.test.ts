import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { TenantPacketFile } from "../../contracts/tenant-packet";
import { CsvSourceAdapter } from "../csv-source-adapter";
import { getBuiltInMappingProfile } from "../mapping-profiles";

type TemplateManifest = {
  templates: Array<{ file: string; columns: string[] }>;
};

const repoRoot = path.resolve(__dirname, "../../../../..");
const manifest = JSON.parse(
  fs.readFileSync(
    path.join(
      repoRoot,
      "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json",
    ),
    "utf8",
  ),
) as TemplateManifest;

const contractAlignedProfiles = [
  {
    mappingProfile: "organization-business-functions/v1",
    templateFile: "01_business_functions.csv",
    sourceClass: "organization_functions",
    identityField: "function_name",
    identityValue: "Finance Operations",
    objectType: "business_function",
  },
  {
    mappingProfile: "organization-ownership/v1",
    templateFile: "02_org_ownership.csv",
    sourceClass: "organization_functions",
    identityField: "org_unit",
    identityValue: "Corporate Finance",
    objectType: "organization_unit",
  },
  {
    mappingProfile: "organization-workforce-roles/v1",
    templateFile: "03_workforce_roles.csv",
    sourceClass: "organization_functions",
    identityField: "persona_or_role",
    identityValue: "Finance Analyst",
    objectType: "workforce_role",
  },
  {
    mappingProfile: "vendor-contracts/v1",
    templateFile: "07_vendors_contracts.csv",
    sourceClass: "vendors_contracts",
    identityField: "vendor_name",
    identityValue: "Strategic Platform Vendor",
    objectType: "vendor_contract",
  },
  {
    mappingProfile: "spend-value/v1",
    templateFile: "08_spend_value.csv",
    sourceClass: "spend_value",
    identityField: "spend_category",
    identityValue: "Cloud Infrastructure",
    objectType: "spend_value_signal",
  },
  {
    mappingProfile: "managed-services-scope/v1",
    templateFile: "17_service_scope_managed_services.csv",
    sourceClass: "service_scope_managed_services",
    identityField: "service_name",
    identityValue: "Application Operations",
    objectType: "managed_service_scope",
  },
  {
    mappingProfile: "metrics-outcomes/v1",
    templateFile: "14_metrics_outcomes.csv",
    sourceClass: "metrics_outcomes",
    identityField: "metric_name",
    identityValue: "Run Cost Avoidance",
    objectType: "metric_outcome",
  },
  {
    mappingProfile: "data-assets-integrations/v1",
    templateFile: "05_data_assets_integrations.csv",
    sourceClass: "data_assets_integrations",
    identityField: "data_asset_name",
    identityValue: "Customer Data Product",
    objectType: "data_asset",
  },
  {
    mappingProfile: "infrastructure-platforms/v1",
    templateFile: "06_infrastructure_platforms.csv",
    sourceClass: "infrastructure_platforms",
    identityField: "platform_name",
    identityValue: "Enterprise Cloud Platform",
    objectType: "infrastructure_platform",
  },
  {
    mappingProfile: "programs-initiatives/v1",
    templateFile: "09_programs_initiatives.csv",
    sourceClass: "programs_priorities",
    identityField: "program_name",
    identityValue: "Operating Model Refresh",
    objectType: "program_initiative",
  },
  {
    mappingProfile: "ai-automation-use-cases/v1",
    templateFile: "10_ai_automation_use_cases.csv",
    sourceClass: "ai_automation_use_cases",
    identityField: "use_case_name",
    identityValue: "Claims Triage Assistant",
    objectType: "ai_use_case",
  },
  {
    mappingProfile: "risks-controls/v1",
    templateFile: "11_risks_controls.csv",
    sourceClass: "risks_controls",
    identityField: "risk_or_control_name",
    identityValue: "Model Output Review Control",
    objectType: "risk_control",
  },
  {
    mappingProfile: "operational-process-evidence/v1",
    templateFile: "18_operational_process_evidence.csv",
    sourceClass: "operational_process_evidence",
    identityField: "process_name",
    identityValue: "Exception Review Workflow",
    objectType: "operational_process",
  },
  {
    mappingProfile: "enterprise-profile-v3/v1",
    templateFile: "00_enterprise_profile.csv",
    sourceClass: "enterprise_profile",
    identityField: "entity_name",
    identityValue: "Test Enterprise",
    objectType: "enterprise_profile",
  },
  {
    mappingProfile: "applications-systems-v3/v1",
    templateFile: "04_applications_systems.csv",
    sourceClass: "applications_systems",
    identityField: "system_name",
    identityValue: "Claims Platform",
    objectType: "application_system",
  },
  {
    mappingProfile: "evidence-sources-v3/v1",
    templateFile: "13_evidence_sources.csv",
    sourceClass: "evidence_registry",
    identityField: "source_file",
    identityValue: "source-register.csv",
    objectType: "evidence_source",
  },
  {
    mappingProfile: "industry-context-patterns/v1",
    templateFile: "15_industry_context_patterns.csv",
    sourceClass: "industry_context_patterns",
    identityField: "pattern_name",
    identityValue: "Margin Pressure Pattern",
    objectType: "industry_context_pattern",
  },
  {
    mappingProfile: "expert-lenses/v1",
    templateFile: "16_expert_lenses.csv",
    sourceClass: "expert_lenses",
    identityField: "lens_name",
    identityValue: "CFO Lens",
    objectType: "expert_lens",
  },
] as const;

function csvValueFor(
  field: string,
  identityField: string,
  identityValue: string,
): string {
  if (field === identityField) return identityValue;
  if (field === "tenant_key") return "test-tenant";
  if (field === "source_file") return "synthetic-source.csv";
  if (field === "source_date") return "2026-08-14";
  if (field === "confidence") return "high";
  if (field.endsWith("_usd")) return "1000";
  if (field.endsWith("_count")) return "12";
  return `${field} value`;
}

describe("contract-aligned mapping profiles", () => {
  it.each(contractAlignedProfiles)(
    "uses only declared columns for $mappingProfile",
    ({ mappingProfile, templateFile, sourceClass }) => {
      const profile = getBuiltInMappingProfile(mappingProfile);
      const template = manifest.templates.find(
        (entry) => entry.file === templateFile,
      );

      expect(profile).toBeDefined();
      expect(template).toBeDefined();
      expect(profile?.sourceClass).toBe(sourceClass);
      expect(profile?.rules.map((rule) => rule.sourceField)).toEqual(
        expect.arrayContaining(
          profile!.rules
            .filter((rule) => rule.required)
            .map((rule) => rule.sourceField),
        ),
      );
      expect(
        profile?.rules.every((rule) =>
          template!.columns.includes(rule.sourceField),
        ),
      ).toBe(true);
      expect(
        profile?.rules.find((rule) => rule.required)?.sourceField,
      ).not.toBe("tenant_key");
    },
  );

  it.each(contractAlignedProfiles)(
    "parses $templateFile without quarantining the mapped row",
    async ({
      mappingProfile,
      templateFile,
      sourceClass,
      identityField,
      identityValue,
      objectType,
    }) => {
      const template = manifest.templates.find(
        (entry) => entry.file === templateFile,
      );
      expect(template).toBeDefined();
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-org-profile-"));
      const sourcePath = path.join(dir, templateFile);
      const values = template!.columns.map((field) =>
        csvValueFor(field, identityField, identityValue),
      );
      fs.writeFileSync(
        sourcePath,
        `${template!.columns.join(",")}\n${values.join(",")}\n`,
      );

      const packetFile: TenantPacketFile = {
        path: sourcePath,
        sourceClass,
        sourceProfile: "universal-standard-v3",
        mappingProfile,
        adapterKey: "csv",
        dataStatus: "synthetic",
        sensitivity: "internal",
        evidenceBasis: "source_file",
        required: true,
        expectedDomains: ["enterprise_structure"],
      };

      const result = await new CsvSourceAdapter().parse({
        tenantKey: "test-tenant",
        packetId: "test-packet",
        packetVersion: "test-version",
        sourcePath,
        packetFile,
        sourceProfile: packetFile.sourceProfile,
        parserVersion: "csv-adapter/v1",
        mappingProfile,
        observedAt: "2026-08-14T00:00:00.000Z",
      });

      expect(result.requiredFieldCount).toBeGreaterThan(0);
      expect(result.missingRequiredFieldCount).toBe(0);
      expect(result.quarantinedRecordCount).toBe(0);
      expect(result.records[0]).toMatchObject({
        objectType,
        sourceObjectId: identityValue.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        qualityStatus: "valid",
      });
    },
  );
});
