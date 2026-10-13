# 2026-10-12 — Typed audit bindings and correction outcomes

## Release ID

`2026-10-12-moves-capture-audit-parameter-binding`

## Status

`candidate`

## Plain-English Summary

The retained-input correction records its mandatory audit with separate SQL parameters for the existing text program identifier and UUID engagement identifier. Both receive the same verified Move ID. This avoids incompatible parameter inference without changing the schema or the audit content.

When the transaction wrapper confirms that a correction was rolled back or did not start, the existing capture route reports that specific outcome. An unconfirmed commit or an error without outcome evidence remains unconfirmed. The ordinary save response is unchanged.

## Layer Impact

- Release lane: `global-control-lane`, within the existing tenant correction feature gates.
- Layer 2: adjust the owned write adapter's audit parameter bindings only.
- Layer 3: preserve the serializable transaction, row locks, mandatory audit and all stored-value and preservation checks. No migration, seed, data replay or new source object.
- Layer 4: report the recorded correction transaction outcome through the existing response. No new surface, control, layout, or theme.

## Client Applicability

- All clients: ordinary saves and existing tenancy authorization stay unchanged.
- Specific clients: only callers already eligible for the existing reviewed-input correction command.
- Internal only: no.
- Public/demo only: the existing synthetic-demo correction enrollment is unchanged.
- Feature flags: existing `moves_extended_intake_fields_v1`, `moves_step_pages_p0p1_v1`, and `moves_step_pages_v3`; no enrollment or environment change.

## Changes Included

- Use independent parameter bindings for `program_id` and `engagement_id` while retaining the same verified ID in both columns.
- Preserve tenant, actor, role, action, revisions, rationale and evidence references in the mandatory audit.
- Return confirmed rollback or not-started metadata only for the bound correction command.
- Retain commit uncertainty, typed permission/binding refusals, ordinary save errors and every correction fence.

## QA / Validation

- PASS: captured PostgreSQL diagnostic confirms `42P08`, text-versus-UUID inference for the shared parameter, and a recorded rollback. Independently comparing saved native before/after results shows preservation. This is observed preceding-release evidence, not a successful correction.
- PASS: the schema-derived audit-binding regression and two confirmed-outcome route regressions failed on preceding source and passed after the fix.
- PASS: six individually detected audit/outcome mutations, with all production source restored.
- PASS: 331 assertions across eighteen existing affected Jest suites after the genuine deck predecessor landed, including correction/route/transaction and the actual Tower/deck source changes. Six assertions in the unchanged upstream Node contract pass separately with database credentials removed. Exact owned source/test hashes preserve the six restored audit/outcome mutation receipts. Official Node 24 typecheck, changed-file lint, library/route/export reachability, all six corpus validators and regenerated manual/coverage/tenancy checks pass. All eleven release gates pass.
- PASS: actual main `75d68440`, `8cdb3d8b` and the genuine deck predecessor `2ae48d72` merged without rebasing; manual/coverage/tenancy artifacts genuinely regenerated after each. Independent immutable-main generation gives 2858 matching every candidate count field, with zero new test files and genuine delta zero. The earlier carried main artifact omitted two existing upstream Tower suites; the landed predecessor carries the regenerated count. No count was edited by hand.
- PENDING: complete exact-new-head CI and the immediately fresh fetched collision guard. The genuine predecessor has landed; its checks and guard are separate historical clearance and do not clear this candidate.
- PENDING: automatic deployment, independent runtime invariant and actual audited correction/preserved-record readback.
- Test limits: local transaction proof uses the real wrapper with an in-memory connection and schema-derived binding checks. No local PostgreSQL server or tenant database is contacted. Existing component/style source is unchanged; this release introduces no visual layout.

## Rollout Plan

Reconcile actual main without rebasing, genuinely regenerate manual/coverage/tenancy artifacts, run affected tests and required gates, and publish the exact controlled head. Require complete current-head CI and an immediately fresh actual all-open Moves/draft/shared-census collision guard before squash merging.

Only the automatically triggered repo-owned ACA main deploy may promote the image. Verify the approved digest on the web template, sole latest-ready 100-percent traffic revision and every required worker. The authorized journey owner must review a fresh normal preview and obtain the concrete action binding before any retry. Audit and independent preservation readback precede downstream progression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: pending successful automatic main deployment.
- ACA runtime invariant: matching web template and sole latest-ready 100-percent traffic revision.
- Worker image invariant: every required worker matches the same approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; normal correction, mandatory audit and stored preservation are separate from local or image proof.

## Rollback Plan

Revert through a controlled squash PR and the repo-owned deployment. Preserve signed versions, charter, source/snapshot/request bindings, capture state and immutable audit. Code rollback does not undo a separately approved committed correction.

## Audit Evidence

Private diagnostic receipt `brief-n-r5-audit-bind-20261012` contains the actual PostgreSQL error, wrapper rollback, exact HTTP response and independent comparison of saved native before/after results. The public release records the mechanism only.

Inspect the focused before/after regressions, restored mutation receipts, actual-main census reconciliation, required gates, exact current-head CI, fresh fetched guard, squash commit, deployment artifact, independent serving invariant and subsequent audited native readback.

## Known Gaps

- This candidate has no successful live correction or full journey acceptance.
- The preceding connection release is merged and deployed; that does not prove this new audit-binding repair.
- The separate approval-absence display, keyboard scrolling, reviewer attribution, speed, full 29-view walk and artifact acceptance remain open. They do not widen this critical candidate.
- No automatic retry, data replay, gate bypass or downstream clearance follows from local tests or a deployment.
