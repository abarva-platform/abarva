import { buildSetupDataLoadCenterModel } from "@/lib/admin/setup-data-load-center";

describe("setup data load center read model", () => {
  it("builds the Apex pilot data-plane foundation from existing registries and manifests", () => {
    const model = buildSetupDataLoadCenterModel({
      clientId: "client-apex",
      clientKey: "apexretail",
      tenantName: "Apex Retail Group",
    });

    expect(model.tenant).toMatchObject({
      clientId: "client-apex",
      clientKey: "apexretail",
      tenantName: "Apex Retail Group",
      vertical: "Retail",
    });
    expect(model.metrics.rehearsalGates).toBe(7);
    expect(model.metrics.setupSegments).toBe(14);
    expect(model.metrics.contextRegistryTemplates).toBeGreaterThanOrEqual(18);
    expect(model.metrics.dayOneWorkbooks).toBe(15);
    expect(model.tenantManifest).toMatchObject({
      tenantKey: "apexretail",
      workbookCount: 15,
      version: "2026.05.day-one.v1",
    });
    expect(model.dimensionReadiness).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dimension: "Application portfolio",
          completenessPercent: 72,
          currentGate: "Template validation",
        }),
        expect.objectContaining({
          dimension: "Vendor contracts",
          completenessPercent: 100,
          currentGate: "Committed",
        }),
      ]),
    );
    expect(model.workQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Answer application owner gaps",
          severity: "blocked",
        }),
      ]),
    );
    expect(model.workflowControls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Load CSV context",
          apiPath: "/api/admin/context-layer/csv-upload",
          status: "ready",
        }),
        expect.objectContaining({
          label: "Review quarantine",
          href: "/platform/admin/quarantine",
          status: "needs_configuration",
        }),
        expect.objectContaining({
          label: "Commit or roll back",
          apiPath: "src/lib/admin/pilot-ingestion-ledger.ts",
          status: "monitored",
        }),
      ]),
    );
  });

  it("runs deterministic queue, upload guard, and validation probes", () => {
    const model = buildSetupDataLoadCenterModel({
      clientId: "client-meridian",
      clientKey: "meridian",
      tenantName: "Meridian Health",
    });

    expect(model.privateDataPlane).toEqual({
      queueSchema: "abarva.ingestion.v1",
      sampleSegment: "enterprise_profile",
      sampleMessageAccepted: true,
      uploadGuardDecision: "allow",
      validationProbeFindings: expect.any(Number),
    });
    expect(model.privateDataPlane.validationProbeFindings).toBeGreaterThan(0);
  });

  it("keeps unsupported Day One tenants from leaking another manifest", () => {
    const model = buildSetupDataLoadCenterModel({
      clientId: "client-skyharbor",
      clientKey: "skyharbor",
      tenantName: "SkyHarbor Air",
    });

    expect(model.tenantManifest).toBeNull();
    expect(model.metrics.dayOneWorkbooks).toBe(15);
    expect(model.manifestCoverage.map((tenant) => tenant.tenantKey)).toEqual([
      "meridian",
      "apexretail",
      "arcturus",
    ]);
  });

  it("exposes registry and Day One workbook templates in a single explorer model", () => {
    const model = buildSetupDataLoadCenterModel({
      clientId: "client-apex",
      clientKey: "apexretail",
      tenantName: "Apex Retail Group",
    });

    expect(model.templateRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          family: "Context registry",
          title: "CMDB / application portfolio",
          dimension: "application_portfolio",
        }),
        expect.objectContaining({
          family: "Day One workbook",
          title: "CMDB Applications + Services",
          dimension: "cmdb",
        }),
      ]),
    );
  });
});
