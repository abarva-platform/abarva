import { parseReleaseRecord } from '../release-ledger';

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

Merge to main and let Vercel deploy the admin route.

## Rollback Plan

Revert the PR to remove the page.

## Audit Evidence

- PR URL after publication.

## Known Gaps

No live deployment telemetry is included.
`;

describe('release ledger parser', () => {
  it('extracts the audit fields needed by the admin release ledger', () => {
    const record = parseReleaseRecord('2026-05-24-sample.md', SAMPLE_RECORD);

    expect(record.releaseId).toBe('2026-05-24-sample');
    expect(record.status).toBe('released');
    expect(record.title).toBe('2026-05-24-sample — Sample Release');
    expect(record.summary).toContain('visible release ledger');
    expect(record.lanes).toEqual(['app-control-lane', 'ops-release-lane']);
    expect(record.clientApplicability).toContain('All clients: Governance applies to future releases.');
    expect(record.qaValidation).toContain('pass: npm run build');
    expect(record.rolloutPlan).toContain('Vercel deploy');
    expect(record.rollbackPlan).toContain('Revert the PR');
    expect(record.knownGaps).toContain('No live deployment telemetry');
  });
});
