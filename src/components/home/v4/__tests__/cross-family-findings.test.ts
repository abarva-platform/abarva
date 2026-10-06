import { chapterDepth, type EstateRecordTypes } from "../chapter-page-content";

const estate: EstateRecordTypes = {
  applications: [
    {
      systemName: "Claims Platform",
      vendor: "ClaimsCo",
      criticality: "critical",
    },
  ],
  vendors: [
    {
      vendorName: "ClaimsCo",
      riskRating: "high",
      autoRenewFlag: false,
      supportedSystems: "Claims Platform",
    },
  ],
  infrastructure: [
    {
      platformName: "SQL Server reporting marts",
      drTier: "backup restore only",
    },
  ],
  data: [
    {
      dataAssetName: "RAF suspect condition mart",
      platformName: "SQL Server reporting marts",
      regulatedDataFlag: "true",
    },
  ],
  risks: [
    {
      riskOrControlName: "Standing privileged credentials outside PAM coverage",
      severity: "high",
      controlOwner: "Chief Information Security Officer",
    },
  ],
  programs: [
    {
      programName: "Privileged Access Management Rollout",
      pctComplete: 20,
      status: "in flight",
    },
  ],
  relationships: [
    {
      fromObjectName: "Standing privileged credentials outside PAM coverage",
      relationshipType: "impacts",
      toObjectName: "Privileged Access Management Rollout",
    },
  ],
};

describe("cross-family executive findings", () => {
  it("adds relationship-backed findings to What Needs Attention", () => {
    const depth = chapterDepth("what_needs_attention", estate);
    const claims = depth.findings.map((finding) => finding.claim);

    expect(claims).toContain(
      "1 relationship-backed path crosses a rated exposure, critical system, regulated data asset, or program; 0 still carry at least one declared-only endpoint.",
    );
    expect(claims).toContain(
      "Standing privileged credentials outside PAM coverage is a high-severity risk tied to Privileged Access Management Rollout and that program is 20% complete.",
    );
    expect(claims).toContain(
      "1 regulated data asset sits on SQL Server reporting marts whose recovery is declared as backup or manual restore.",
    );
    expect(claims).toContain(
      "1 critical system is tied to vendor contracts that are high-risk or auto-renewing.",
    );
    expect(depth.tables.map((table) => table.caption)).toContain(
      "Relationship-backed exposure paths",
    );
  });

  it("does not repeat cross-family findings under descriptive chapters", () => {
    const claims = chapterDepth("technology_data", estate).findings.map(
      (finding) => finding.claim,
    );

    expect(claims).not.toContain(
      "1 critical system is tied to vendor contracts that are high-risk or auto-renewing.",
    );
  });

  it("does not invent joins for unresolved relationship endpoints", () => {
    const claims = chapterDepth("what_needs_attention", {
      ...estate,
      relationships: [
        {
          fromObjectName: "Privileged access risk",
          relationshipType: "impacts",
          toObjectName: "PAM project",
        },
      ],
    }).findings.map((finding) => finding.claim);

    expect(claims).not.toContain(
      "Standing privileged credentials outside PAM coverage is a high-severity risk tied to Privileged Access Management Rollout and that program is 20% complete.",
    );
  });
});
