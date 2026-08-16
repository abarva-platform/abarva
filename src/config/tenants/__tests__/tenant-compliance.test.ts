import {
  CANONICAL_TENANTS,
  DEFAULT_TENANT_COMPLIANCE_METADATA,
  getTenantComplianceMetadata,
  getTenantPatternOverlays,
} from "../CANONICAL_TENANTS";

describe("tenant compliance metadata", () => {
  it("defaults tenants without regulated healthcare posture to not-required compliance states", () => {
    expect(getTenantComplianceMetadata("skyharbor-air")).toEqual(
      DEFAULT_TENANT_COMPLIANCE_METADATA,
    );
    expect(getTenantComplianceMetadata("unknown-retired-tenant")).toMatchObject(
      {
        regulatedDataProfile: "none",
        baa: { status: "not_required", executionDate: null },
        hipaaRiskAssessment: { status: "not_required", assessmentDate: null },
        evidencePointer: null,
      },
    );
  });

  it("tracks Meridian as a healthcare-provider PHS placeholder without claiming BAA execution", () => {
    const meridian = CANONICAL_TENANTS.find(
      (tenant) => tenant.key === "meridian-health",
    );

    expect(meridian).toMatchObject({
      industry: "healthcare_provider",
      compliance: {
        regulatedDataProfile: "phi_possible",
        baa: { status: "not_started", executionDate: null },
        hipaaRiskAssessment: { status: "not_started", assessmentDate: null },
        owner: { role: "pilot_compliance_owner_tbd", name: null, email: null },
        evidencePointer:
          "docs/enterprise-context/synthetic/meridian/15-risk-compliance-register.csv",
      },
    });
  });

  it("does not encode executed BAA or completed HIPAA assessment claims for Meridian", () => {
    const compliance = getTenantComplianceMetadata("meridian-health");

    expect(compliance.baa.status).not.toBe("executed");
    expect(compliance.baa.executionDate).toBeNull();
    expect(compliance.hipaaRiskAssessment.status).not.toBe("completed");
    expect(compliance.hipaaRiskAssessment.assessmentDate).toBeNull();
    expect(compliance.notes).toContain("No signed BAA");
    expect(compliance.notes).toContain("completed HIPAA risk assessment");
  });

  it("declares the airline tenant as subscribed to the core and airline pattern overlays", () => {
    expect(getTenantPatternOverlays("skyharbor-air")).toEqual([
      "core",
      "airline-industry-v1",
    ]);
  });

  it("keeps every canonical tenant on the core overlay", () => {
    expect(
      CANONICAL_TENANTS.every((tenant) =>
        tenant.patternOverlays.includes("core"),
      ),
    ).toBe(true);
  });
});
