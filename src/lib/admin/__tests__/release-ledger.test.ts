import { parseReleaseRecord } from "../release-ledger";

const SAMPLE_RECORD = `# 2026-05-24-sample — Sample Release

## Release ID

\`2026-05-24-sample\`

## Status

\`released\`

## Plain-English Summary

Adds a visible release ledger so operators can review changes without reading raw markdown.

## Layer Impact

- \`ops-release-lane\`: Adds the ledger viewer.
- \`app-control-lane\`: Adds an authenticated admin route.

## Client Applicability

- All clients: Governance applies to future releases.
- Internal only: AbarVa administrators.

## Changes Included

- \`src/app/(maestro)/admin/releases/page.tsx\`

## QA / Validation

- pass: \`npm run build\`

## Rollout Plan

Merge to main and run the Azure deploy for the admin route through Azure Container Apps.

## Rollback Plan

Revert the PR to remove the page.

## Audit Evidence

- PR URL after publication.

## Known Gaps

No live deployment telemetry is included.
`;

describe("release ledger parser", () => {
  it("extracts the audit fields needed by the admin release ledger", () => {
    const record = parseReleaseRecord("2026-05-24-sample.md", SAMPLE_RECORD);

    expect(record.releaseId).toBe("2026-05-24-sample");
    expect(record.status).toBe("released");
    expect(record.title).toBe("2026-05-24-sample — Sample Release");
    expect(record.summary).toContain("visible release ledger");
    expect(record.lanes).toEqual(["app-control-lane", "ops-release-lane"]);
    expect(record.clientApplicability).toContain(
      "All clients: Governance applies to future releases.",
    );
    expect(record.qaValidation).toContain("pass: npm run build");
    expect(record.rolloutPlan).toContain("Azure deploy");
    expect(record.rollbackPlan).toContain("Revert the PR");
    expect(record.knownGaps).toContain("No live deployment telemetry");
  });

  it("redacts legacy demo tenant names from markdown-backed release records", () => {
    const record = parseReleaseRecord(
      "2026-05-24-legacy-tenant.md",
      `# Arcturus remediation note

## Release ID

\`2026-05-24-legacy-tenant\`

## Status

\`released\`

## Plain-English Summary

Removes retired tenant copy from tenant-visible surfaces.

## Client Applicability

- Arcturus: shell-only tenant.
- Heliara Health: archived healthcare tenant.

## Known Gaps

Retired tenant references still exist in archived docs.
`,
    );

    const renderedText = [
      record.title,
      record.summary,
      ...record.clientApplicability,
      record.knownGaps,
    ].join("\n");

    expect(renderedText).toContain("Removes retired tenant copy");
    expect(renderedText).toContain("legacy financial-services workspace");
    expect(renderedText).toContain("legacy healthcare workspace");
  });

  it("removes generic tenant phrasing from tenant-visible release fields", () => {
    const record = parseReleaseRecord(
      "2026-06-05-generic-copy.md",
      `# Generic tenant wording cleanup

## Release ID

\`2026-06-05-generic-copy\`

## Status

\`released\`

## Plain-English Summary

Stops rendering generic tenant and demo tenant language in the admin release ledger.

## Client Applicability

- All clients: sample client copy no longer appears in tenant-visible release rows.
`,
    );

    const renderedText = [
      record.title,
      record.summary,
      ...record.clientApplicability,
    ].join("\n");

    expect(renderedText).toContain("general workspace");
    expect(renderedText).toContain("sample workspace");
    expect(renderedText).not.toMatch(
      /\bgeneric tenant\b|\bdemo tenant\b|\bsample client\b/i,
    );
  });

  it("redacts canonical tenant names and aliases from tenant-visible release fields", () => {
    const record = parseReleaseRecord(
      "2026-05-30-canonical-tenant.md",
      `# Apex Retail command cleanup

## Release ID

\`2026-05-30-canonical-tenant\`

## Status

\`released\`

## Plain-English Summary

Removes a command that used --client-id apexretail from the release ledger.

## Client Applicability

- Meridian Health: visible in admin route walk.
- SkyHarbor Air: same shared control plane.

## QA / Validation

- PASS: npx tsx src/scripts/tower/ingest-servicenow-cmdb.ts --client-id apexretail --dry-run
- PASS: Live DB has 5,691 Apex retail-v1 chunks.

## Known Gaps

First Capital and Northstar remain covered by the shared ledger route.
`,
    );

    const renderedText = [
      record.title,
      record.summary,
      ...record.clientApplicability,
      ...record.qaValidation,
      record.knownGaps,
    ].join("\n");

    expect(renderedText).toContain("canonical retail tenant");
    expect(renderedText).toContain("canonical healthcare tenant");
    expect(renderedText).toContain("canonical airline tenant");
    expect(renderedText).toContain("canonical financial-services tenant");
    expect(renderedText).toContain("canonical clinical-technology tenant");
    expect(renderedText).toContain("retail overlay chunks");
    expect(renderedText).not.toMatch(
      /\bApex\b|Apex Retail|apexretail|retail-v1|Meridian Health|SkyHarbor Air|First Capital|Northstar/i,
    );
  });
});
