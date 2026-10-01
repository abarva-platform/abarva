import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CsvSourceAdapter } from "../csv-source-adapter";
import { getBuiltInMappingProfile } from "../mapping-profiles";

describe("versioned business-function segment mapping", () => {
  it("preserves declared segment keys without changing the v1 function contract", async () => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "function-segment-"),
    );
    const sourcePath = path.join(directory, "01_business_functions.csv");
    fs.writeFileSync(
      sourcePath,
      "tenant_key,function_name,business_segment_key,source_file,known_gaps\n" +
        "test-tenant,Clinical Operations,hospital_acute_delivery,source.csv,Owner not declared\n" +
        "test-tenant,Shared Services,,source.csv,Segment attribution unresolved\n",
    );

    const parse = (mappingProfile: string) =>
      new CsvSourceAdapter().parse({
        tenantKey: "test-tenant",
        packetId: "candidate-packet",
        packetVersion: "candidate-v1",
        sourcePath,
        packetFile: {
          path: sourcePath,
          sourceClass: "organization_functions",
          sourceProfile: mappingProfile,
          mappingProfile,
          adapterKey: "csv",
          dataStatus: "synthetic",
          sensitivity: "internal",
          evidenceBasis: "source_file",
          required: true,
          expectedDomains: ["enterprise_structure"],
        },
        sourceProfile: mappingProfile,
        parserVersion: "csv-adapter/v1",
        mappingProfile,
        observedAt: "2026-10-01T00:00:00.000Z",
      });

    try {
      const v1 = await parse("organization-business-functions/v1");
      const v2 = await parse("organization-business-functions/v2");

      expect(v1.unmappedFields).toContain("business_segment_key");
      expect(v1.records[0].attributes.businessSegmentKey).toBeUndefined();
      expect(v2.unmappedFields).not.toContain("business_segment_key");
      expect(v2.quarantinedRecordCount).toBe(0);
      expect(v2.records[0]).toMatchObject({
        tenantKey: "test-tenant",
        objectType: "business_function",
        sourceObjectId: "clinical-operations",
        attributes: {
          businessSegmentKey: { value: "hospital-acute-delivery" },
        },
      });
      expect(v2.records[1].attributes.businessSegmentKey).toBeUndefined();
      expect(v2.records[1].attributes.knownGaps?.value).toBe(
        "Segment attribution unresolved",
      );
      expect(v2.records[0].lineage[0].mappingProfile).toBe(
        "organization-business-functions/v2",
      );
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps the new rule IDs distinct from the existing profile", () => {
    const v1 = getBuiltInMappingProfile("organization-business-functions/v1");
    const v2 = getBuiltInMappingProfile("organization-business-functions/v2");
    expect(v1).toBeDefined();
    expect(v2).toMatchObject({
      version: "2026-10-01.business-function-segment-v2",
      sourceClass: "organization_functions",
    });
    expect(
      v1?.rules.some((rule) => rule.sourceField === "business_segment_key"),
    ).toBe(false);
    expect(
      v2?.rules.some((rule) => rule.sourceField === "business_segment_key"),
    ).toBe(true);
    const v1Ids = new Set(v1?.rules.map((rule) => rule.mappingRuleId));
    expect(v2?.rules.every((rule) => !v1Ids.has(rule.mappingRuleId))).toBe(
      true,
    );
  });
});
