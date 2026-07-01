# 2026-07-01-source-decision-brief-title-page-polish — Source Decision Brief Title Page Polish

## Release ID

`2026-07-01-source-decision-brief-title-page-polish`

## Status

`candidate`

## Plain-English Summary

This follow-up release fixes the live PDF cover-page visual issue found during Source D24 decision-brief proof. The prior export was functionally correct, but the long title wrapped awkwardly on the PDF cover. This release replaces the implementation-shaped `Airline Demo` label with a legally safer `Aviation Client` display and shortens the cover/document title to `AMS RFP Decision Brief` so the generated DOCX/PDF presents cleanly.

## Layer Impact

- `global-control-lane`: Updates the shared Source D24 decision-brief display payload.
- `public-demo`: Improves the AMS outsourcing demo export title-page polish.

## Client Applicability

- All clients: No behavior change except for events normalized through the D24 decision-brief display helper.
- Specific clients: Demo Source AMS event only.
- Internal only: None.
- Public/demo only: Source P1 AMS demo path.
- Feature flag: None.

## Changes Included

- Replaces `Airline Demo` with `Aviation Client` for the Source D24 decision brief.
- Uses the shorter `AMS RFP Decision Brief` document title to prevent PDF title-page hyphenation.
- Updates D24 payload tests to assert the cleaner document title.

## QA / Validation

- Focused D24 payload Jest — not run yet in this branch.
- Focused ESLint — passed.
- `npm run release:check` — currently blocked until this record passes the release-control content checks.
- Live signed-in DOCX/PDF export and PDF visual proof — pending after ACA deployment.

## Rollout Plan

Merge to `main`, deploy through `aca-main-deploy`, and repeat the signed-in Source D24 export proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`.
- Shared runtime mutators: No direct ACA mutation from this branch.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Verify active revision, traffic allocation, image digest, and health after deployment.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data-plane changes are included.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Signed-in export proof bundle: pending.

## Known Gaps

Live visual proof is intentionally still open until this follow-up release is merged and deployed. The previous live proof showed correct headers/body text, but the PDF cover title wrapped awkwardly, which is the defect this release corrects.
