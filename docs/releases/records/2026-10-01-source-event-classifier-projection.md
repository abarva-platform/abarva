# 2026-10-01-source-event-classifier-projection - Preserve Source event classification

## Release ID

`2026-10-01-source-event-classifier-projection`

## Status

`candidate`

## Plain-English Summary

The Azure Source event reader selected an explicit list of columns but left out the event's governed classification. A classified event could therefore appear unclassified to downstream stage views. The reader now carries that stored classification through every scoped event read. It does not infer a category when one is absent.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Source projection) receives the existing Layer 3 event classification. Canonical records, facts and approval state are unchanged.

## Client Applicability

- All clients: Source event reads on the Azure Postgres data plane.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Include `classified_category` in the Azure Source-event column projection and row contract.
- Add a focused test covering pending, active, id and code reads, plus a foreign-client negative.
- No schema, migration, data load, approval-policy or supplier-release change.

## QA / Validation

- The focused adapter test failed before the correction because the projected row lacked its classification, then passed all 16 cases.
- Removing the selected classification deliberately failed that test again; the field was restored.
- Three focused/adjacent suites passed 44/44 tests. The wider adapter-related run passed 86 suites/699 tests; eight suites/27 tests failed. The untouched base had the same eight failing suites/27 cases (86 suites/698 tests passed), so this change introduced no new failure in that run. The failures involve seeded-event fixtures and a Playwright spec collected by Jest.
- TypeScript, scoped ESLint, release check and diff check passed.
- A post-deploy signed-in readback is required; local tests are not live acceptance.

## Rollout Plan

Squash merge through protected main. Only the repo-owned ACA main workflow builds and deploys the merge SHA. No migration or flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Only that workflow.
- Approved image digest: Record after the successful main deploy.
- ACA runtime invariant: Digest-pinned web template and sole healthy 100%-traffic revision match.
- Worker image invariant: Both required delivery-worker job templates match the web digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Reload the same event stage and verify persisted checklist decisions appear without implying included clauses or supplier issue.

## Rollback Plan

Revert through a new protected-branch PR and redeploy via the same workflow. No data rollback is needed.

## Audit Evidence

Focused red/green and mutation results, PR CI, official main deploy run, immutable digest/revision readback, and signed-in stage replay.

## Known Gaps

Checklist readback does not approve the external package. Legal clearance, reviewed Client Finals, recipient authority and stage criteria remain separate gates.
