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
          label: "Load structured context",
          href: "/admin/context-layer/uploads",
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
    expect(model.dimensionCatalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Application portfolio",
          completenessPercent: 72,
          templateCount: expect.any(Number),
          formats: expect.arrayContaining(["CSV"]),
          primaryAction: {
            label: "Start load",
            href: "/admin/context-layer/uploads",
          },
        }),
        expect.objectContaining({
          label: "Vendor contracts",
          primaryAction: {
            label: "Review load",
            href: "/admin/context-layer/uploads",
          },
        }),
      ]),
    );
    expect(
      model.dimensionCatalog.find(
        (dimension) => dimension.label === "Application portfolio",
      )?.templateCount,
    ).toBeGreaterThan(0);
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

  it("surfaces pilot verifier posture and fails closed when env keys are absent", () => {
    const model = buildSetupDataLoadCenterModel(
      {
        clientId: "client-apex",
        clientKey: "apexretail",
        tenantName: "Apex Retail Group",
      },
      {},
    );

    expect(model.pilotVerifier.schema).toBe(
      "abarva.pilot-data-plane-verification.v1",
    );
    expect(model.pilotVerifier.command).toBe("npm run verify:pilot-data-plane");
    expect(model.pilotVerifier.summary).toEqual({
      liveReady: 0,
      stubFailClosed: 9,
      blocked: 0,
      exitCode: 0,
    });
    expect(model.pilotVerifier.posture).toBe("needs_configuration");
    expect(model.pilotVerifier.hops.every((hop) => hop.status === "stub_fail_closed")).toBe(
      true,
    );
  });

  it("marks the verifier live-ready from configured key names without exposing values", () => {
    const model = buildSetupDataLoadCenterModel(
      {
        clientId: "client-apex",
        clientKey: "apexretail",
        tenantName: "Apex Retail Group",
      },
      {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_secret",
        CLERK_SECRET_KEY: "secret-value",
        AZURE_BLOB_CONNECTION_STRING: "secret-value",
        AZURE_BLOB_LANDING_CONTAINER: "landing",
        AZURE_QUEUE_CONNECTION_STRING: "secret-value",
        AZURE_QUEUE_NAME: "queue",
        DATABASE_URL: "secret-value",
        AZURE_DEFENDER_SCAN_MODE: "live",
        AZURE_SEARCH_ENDPOINT: "https://example.search.windows.net",
        AZURE_SEARCH_INDEX_NAME: "tenant-context",
        RESEND_API_KEY: "secret-value",
        RESEND_FROM: "pilot@example.com",
      },
    );

    expect(model.pilotVerifier.summary.liveReady).toBe(9);
    expect(model.pilotVerifier.summary.stubFailClosed).toBe(0);
    expect(JSON.stringify(model.pilotVerifier)).not.toContain("secret-value");
  });

  it("exposes loader readiness, audit-only ledger posture, and launch affordances", () => {
    const model = buildSetupDataLoadCenterModel(
      {
        clientId: "client-apex",
        clientKey: "apexretail",
        tenantName: "Apex Retail Group",
      },
      {},
    );

    expect(model.loaderReadiness).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Admin entrypoint",
          status: "ready",
          href: "/admin/setup",
        }),
        expect.objectContaining({
          label: "Audit-only ingestion ledger",
          status: "monitored",
          detail: expect.stringContaining("11 tenant-scoped ledger tables"),
        }),
        expect.objectContaining({
          label: "Commit readiness",
          status: "needs_configuration",
          nextAction: "Clear preview approval before enabling commit.",
        }),
      ]),
    );
    expect(model.launchActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Start governed load",
          href: "/admin/context-layer/uploads",
          kind: "primary",
        }),
        expect.objectContaining({
          label: "Run verifier",
          href: "/admin/setup#pilot-verifier",
        }),
      ]),
    );
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
    expect(model.dimensionCatalog.map((dimension) => dimension.label)).toEqual([
      "Application portfolio",
      "Vendor contracts",
      "ERP landscape",
      "Org roles and teams",
    ]);
  });
});
