# 2026-10-13-moves-approval-absence-readback — Explain a missing historical approval

## Release ID

`2026-10-13-moves-approval-absence-readback`

## Status

`candidate`

## Plain-English Summary

The historical P0 approval page distinguishes a successful read with no approval record from a failed read. A missing record stays blocked and links to the existing phase history. Failed or foreign-Move readbacks retain the unavailable message. The normal signed-in walkthrough also saves accessibility rule IDs, severity and CSS selectors to locate observed failures.

## Release Lane

`experimental`

## Layer Impact

Release lane: `experimental`.

- Layer 4 Moves projection: display the canonical reader's existing `not_recorded` verdict accurately. Approval records, signed documents, saved answers, contact bindings and phase progression are unchanged.
- Internal validation: add selector-only attachments to the existing walkthrough. Visits, scores, thresholds, assertions and tenant/phase selection are unchanged.

## Client Applicability

Specific clients: registry-declared synthetic-demo scopes with the existing step-page feature flags enabled. The display is inside that existing projection; flag-off behavior is unchanged. The walkthrough remains the existing signed-in read-only synthetic validation path.

## Changes Included

`GateReadinessStep.tsx`, its existing regression suite and the existing `moves-step-pages-live-walk.spec.ts`. No new route, model, schema, identity, permission, data write, feature flag or test file is introduced.

## QA / Validation

PASS: 64 focused approval projection/reader assertions across two existing suites. Three individual UI mutations are detected and restored: suppressing known absence, accepting a foreign absence and enabling the blocked progression command. Sixteen actual component/style variants at 390 and 1440 in both themes pass contrast, labels, keyboard scrolling and overflow checks; the temporary render test is removed.

PASS: an offline browser check executes the actual modified accessibility collector and the immutable-main collector. Their scoring inputs are identical. A real accessibility violation produces its CSS selector without raw HTML or text; removing selector capture is detected in an in-memory mutation.

PASS: 234 focused/affected assertions across ten existing suites, including the 64 approval assertions and affected shared chat/formatting and offline Source planning checks. The upstream database-dependent Source fixture is excluded and no database is contacted. Official Node 24 typecheck and lint, reachability, all six corpus validators and genuinely regenerated manual/coverage/tenancy checks pass. Immutable current-main regeneration gives 2865 covered suites, matching every candidate count field; the inherited carried main artifact had 2863. This candidate adds zero test files and zero census delta.

PASS: all eleven release gates after the record's lane/applicability metadata correction. Complete exact-head CI and the fresh all-open fetched contender guard are required before merging. Local fixtures do not clear the separately observed composed-page scrolling failure.

## Rollout Plan

After exact source review and all release gates, squash the candidate through its own PR. Only the repo-owned main deployment builds and promotes its image. Verify the actual serving SHA and pinned digest, then inspect the next automatically triggered signed-in walkthrough. No workflow is dispatched or rerun for this change.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared template, traffic and worker updates remain exclusively in that workflow.
- Approved image digest: supplied by the actual main deployment and independently verified.
- Web template, sole 100-percent latest-ready healthy traffic revision and every required worker must match the approved pinned image.
- Feature flags, environment, credentials and schema are unchanged.
- Live signed-in proof remains required separately from local and deployment evidence.

## Rollback Plan

Revert the display and diagnostic changes through a governed PR and the repo-owned deployment. No stored approval, contact or capture rollback is required because this release writes none of them.

## Audit Evidence

The private owner receipt retains actual source hashes, focused results, restored mutations, real component/style renders, selector privacy/scoring checks, immutable-main census reconciliation, exact-head CI and the fresh fetched guard. Subsequent release evidence must bind the actual squash, approved image and observed per-view results.

## Known Gaps

This candidate is unpublished. The actual composed-page focus target, remaining latency, full 29-view acceptance, intake reload, contact execution and independent deck acceptance remain open. Selector capture is diagnostic evidence, not an accessibility fix or a change to acceptance criteria.
