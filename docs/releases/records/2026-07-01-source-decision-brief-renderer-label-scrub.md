# 2026-07-01-source-decision-brief-renderer-label-scrub — Source Decision Brief Renderer Label Scrub

## Release ID

`2026-07-01-source-decision-brief-renderer-label-scrub`

## Status

`candidate`

## Plain-English Summary

The signed-in export proof after the D24 label scrub showed the document body and response headers were clean, but the HTML/PDF cover metadata still displayed the raw source event tenant label. This release fixes the narrative renderer handoff so exported cover/header metadata uses the sanitized payload tenant label when one is provided.

## Layer Impact

- `global-control-lane`: Updates the shared Source narrative renderer adapter used by DOCX, PDF, and HTML narrative exports.
- `public-demo`: Keeps the D24 AMS decision brief export aligned with the `Aviation Client` / `AMS RFP Decision Brief` display standard.

## Client Applicability

- All clients: Narrative Source exports now prefer explicit payload tenant metadata over the raw spec tenant key.
- Specific clients: Source P1 AMS demo path is the live proof target.
- Internal only: None.
- Public/demo only: Demo label hygiene for Source D24 exported artifacts.
- Feature flag: None.

## Changes Included

- `src/lib/source/exports/dispatch.ts`: Uses `payload.tenantName` and `payload.generatedAt` for narrative exports when present.
- `src/lib/source/exports/__tests__/dispatch.test.ts`: Adds renderer-level coverage proving the HTML cover uses the payload tenant label and does not fall back to the raw source event tenant label.

## QA / Validation

- Passed: Focused Source export Jest — `npx jest src/lib/source/exports/__tests__/dispatch.test.ts src/lib/source/exports/__tests__/decision-brief-payload.test.ts --runInBand`.
- Passed: Focused ESLint — `npx eslint src/lib/source/exports/dispatch.ts src/lib/source/exports/__tests__/dispatch.test.ts`.
- Passed: `npm run release:check`.
- Pending: Live signed-in DOCX/PDF/HTML export proof after merge and ACA deployment.

## Rollout Plan

Merge to `main`, deploy through the repo-owned `aca-main-deploy` workflow, confirm ACA revision/traffic/image digest, then rerun the signed-in Source D24 export proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: No direct ACA mutation from this branch.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Verify active revision, traffic allocation, image digest, and health after deployment.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data-plane changes or migrations are included.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Signed-in export proof bundle that caught the defect: `/Users/anand/Downloads/source-p1-board-pack-label-scrub-proof-20260701T183110Z`.

## Known Gaps

None known for the exported D24 artifact once live proof passes. The Source event page chrome is separate from exported artifact rendering.
