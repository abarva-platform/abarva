# 2026-10-12-home-narrative-readiness-inspection

## Release ID
`2026-10-12-home-narrative-readiness-inspection`

## Status
`candidate`

## Release Lane
`client-data-lane`

## Plain-English Summary
Add a read-only inspection mode to the existing narrative planner. Operators can see missing or withheld governed evidence without a model credential or a generation attempt.

## Layer Impact
`client-data-lane`: Layers 3 and 4 read existing projection rows, source links and readiness proofs, then report the same packet evidence gate used by the narrative planner. No canonical data, narrative, reviews or serving selection changes.

## Client Applicability
Internal only: operators, explicitly scoped to a registry-declared canonical tenant and assessment. Normal planner behavior is unchanged unless the inspection flag is supplied.

## Changes Included
Readiness-mode and explicit-scope guards, bounded read-only transaction, private report/proof output, tests and operator guidance.

## QA / Validation
PASS: 21 actual Node behavior cases in the narrative boundary runner, including every existing evidence gate; full typecheck; focused ESLint with zero errors and five existing warnings; CI coverage census without drift; release validation 11/11. PASS: the actual CLI against disposable Postgres under a SELECT-only role, including empty projection, tenant/assessment/version separation, matching source links, absent proof, missing index and citation proof, write/replay refusal, and unchanged database rows. The inspection ran without a model credential; normal generation still refused without one. NOT RUN: private runtime inspection, model generation, data apply, admission and activation. No live readiness or refresh claim is made.

## Rollout Plan
Merge the reviewed PR to main and release through `.github/workflows/aca-main-deploy.yml`. Invoke the existing plan script through the private ACA operator wrapper with the explicit inspection environment flag. No automatic data run or activation.

## Deployment Authority
The repo-owned deploy workflow `.github/workflows/aca-main-deploy.yml` alone may change shared web runtime or traffic. Preserve Premium ACR and the ACR build policy requiring Buildx GitHub Actions cache. Use the approved digest-pinned image; prove the ACA runtime invariant across the web template, 100% traffic revision and required worker images. No ad-hoc ACR builds, mutable image updates, flag changes or traffic shifts. Private inspection requires an exclusive job slot, independently verified idle restoration and captured proof. Signed-in proof is still required for any subsequent product-readiness claim.

## Rollback Plan
Omit the opt-in inspection flag to retain normal planner behavior. A code rollback must use a protected-main PR and the approved ACA workflow. No database rollback is needed because inspection writes no database rows.

## Audit Evidence
Inspect the PR diff, tests, typecheck/lint/release output, ACA run/digest evidence, private inspection archive and unchanged operator/serving state. Public artifacts must contain no client narrative or private proof bytes.

## Known Gaps
Inspection does not build an index, earn citation readiness, review sources, generate narrative, admit findings, activate Home, reconcile separate assessments, or prove visual export parity.
