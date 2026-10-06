# 2026-10-06 — Source NDA PDF runtime

## Release ID

`2026-10-06-source-nda-pdf-runtime`

## Status

`candidate`

## Plain-English Summary

Keep the server-side PDF parser on its native Node.js path so its worker is available when a synthetic NDA template is checked. A failed text extraction is reported separately from a readable file that lacks the required synthetic marker. Neither condition permits publication.

## Layer Impact

Release lane: `global-control-lane` for server-side PDF packaging, with a lab-only Source workflow result classification. Layer 4 Source workflow only. Canonical supplier, evidence and contract data are unchanged.

## Client Applicability

- All clients: server-side PDF parser packaging only.
- Specific clients: none.
- Internal only: none.
- Public/demo only: synthetic NDA publication remains restricted to the existing lab tenant and event authority checks.
- Feature flag: none added or changed.

## Changes Included

Next.js server package configuration, synthetic NDA publication result classification, focused tests and CI suite ownership. No migration or data load.

## QA / Validation

The packaging and extraction-classification tests failed on the prior configuration, then passed after the change. The focused NDA suite passed 21 tests; typecheck, ESLint, the CI test census and all 11 release gates passed locally. A hash-matched, visibly synthetic PDF was parsed under Node 24 and Node 25 outside the Next.js server bundle. The live signed-in publication attempt returned a refusal despite that file's marker; runtime replay after deployment is still required.

## Rollout Plan

Merge through a reviewed PR after applicable CI. Only the repo-owned ACA main workflow may deploy the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: pending official deploy.
- ACA runtime invariant: verify template, sole healthy 100%-traffic revision and worker images against the approved digest.
- Worker image invariant: verify after the main workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: retry the exact synthetic template publication and read back the version; do not infer supplier NDA coverage from template publication.

## Rollback Plan

Revert the PR and deploy through the repo-owned main workflow. No schema rollback is required.

## Audit Evidence

Focused red/green test output, PR and CI, official deploy run, digest readback, and the signed-in replay result.

## Known Gaps

The post-deploy replay is pending. This change does not create executed NDAs, grant Legal approval or contact suppliers.
