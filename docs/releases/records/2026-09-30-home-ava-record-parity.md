# 2026-09-30-home-ava-record-parity - Home Advisor Record Parity

## Release ID

`2026-09-30-home-ava-record-parity`

## Status

`candidate`

## Plain-English Summary

The Home advisor and full walkthrough export now use the same record source the reader opened. If the underlying record changes, the advisor asks the reader to refresh and the export refuses the stale version instead of silently switching to another record.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Home presentation and read routing) only. This changes no intake, canonical object, serving row, or tenant data.

## Client Applicability

- All clients: Authorized Home users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing provider override policy remains unchanged.

## Changes Included

The Home page passes its provider selection and rendered record marker to the advisor. The ask route applies the same provider resolver and refuses questions when the current record marker differs. The chat shows a refresh message for this mismatch. The full export link follows the page provider and includes an equality marker checked by the export route.

## QA / Validation

Route tests covering served, reviewed, fallback, and changed-content states: pass. Component tests for marker transmission and refresh message: pass. Export parity and tenancy tests: pass. TypeScript and touched-file lint: pass. Home ratchet: pass with 12 pre-existing failing suites and no movement. Release validation: pass. CI: not run yet; it must pass before merge.

## Rollout Plan

Squash-merge a green PR to protected `main`, then deploy through the repository-owned ACA main workflow. No data build or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolved and recorded by the workflow.
- ACA runtime invariant: Web template and 100% traffic revision must use the approved digest.
- Worker image invariant: Required workers must use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Verify normal ask and record-source state; the changed-context branch has regression proof.

## Rollback Plan

Use the repo-owned ACA workflow to redeploy the prior approved main image if the ask route regresses. No data rollback is needed.

## Audit Evidence

PR checks, ACA deploy run, digest readback, signed-in Home check, and the route/component regressions.

## Known Gaps

This does not reconcile a newer served record with an older reviewed narrative. The advisor's coherence gate remains in force until that evidence is reviewed. Direct export API calls without a page context marker still export the latest authorized record.
