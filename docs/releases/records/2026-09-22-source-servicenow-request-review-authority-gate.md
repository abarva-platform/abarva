# 2026-09-22-source-servicenow-request-review-authority-gate — Request Review Authority Gate

## Release ID

`2026-09-22-source-servicenow-request-review-authority-gate`

## Status

`candidate`

## Plain-English Summary

Imported service requests now require a named mapping review to be written before a Source event can be created. The create-event command no longer accepts category, archetype, or rationale from the browser for imported requests; it rereads the current request version and derives routing from the persisted current-version decision.

## Layer Impact

Release lane: `global-control-lane`.

- Client intake: reads the imported request version only; it does not mutate the upstream request.
- Canonical model contract: uses the existing immutable request-version, append-only mapping-decision, and request-event-link authority tables. No schema change is included.
- Product: Source New keeps event creation disabled until the current request version has a persisted accept-or-override decision by a named user.

## Client Applicability

- All clients: Yes, for tenants with the request authority schema available and imported request versions present.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added a review-write API for imported request mapping decisions.
- Updated Source New to record the mapping review before enabling event creation.
- Updated the Source event creation route to accept only request identity and source version for imported requests.
- Added server-side rejection for stale, missing, unmapped, or non-current mapping decisions.
- Preserved idempotence by returning the existing linked event for repeated current-version create commands.

## QA / Validation

- Red-first proof: focused route tests failed before implementation because event creation still required in-request review fields and returned `400` instead of deriving persisted authority.
- Red-first proof: the Source New UI test failed before implementation because the Create action enabled before the review write.
- Focused Jest after implementation:
  - `npx jest src/app/api/v1/source/events/__tests__/route.test.ts src/app/api/v1/source/intake/servicenow/review/__tests__/route.test.ts --runInBand`
  - `npx jest src/__tests__/integration/source/source-servicenow-request-review.test.ts src/lib/source/intake/__tests__/servicenow-sourcing-request-repository.test.ts src/lib/source/intake/__tests__/servicenow-request-event-handoff.test.ts --runInBand`
- Mutation proof: the event route test sends a tampered request category in the create command and expects the event to use the persisted mapping decision instead.
- No migration was added or applied. No tenant rows were written during validation.

## Rollout Plan

Squash merge through the protected repository. Deploy by the repo-owned ACA main workflow from the exact merged main SHA. The existing request authority schema remains an operator-controlled prerequisite; when unavailable, the request queue and review path fail closed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Captured by the deploy workflow after merge.
- ACA runtime invariant: Template image and 100%-traffic revision image must match the workflow-produced digest before claiming deployed runtime.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming signed-in acceptance.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA workflow. Existing immutable request versions, mapping decisions, event links, and events remain auditable; rollback must not delete authority records.

## Audit Evidence

- Pull request URL and CI checks after publication.
- Local focused Jest output listed above.
- `npm run typecheck`, `npx eslint src/app/api/v1/source/events/route.ts src/app/api/v1/source/intake/servicenow/review/route.ts src/components/source/SourceOriginatePage.tsx src/lib/source/intake/servicenow-request-event-handoff.ts src/lib/source/intake/servicenow-sourcing-request-repository.ts`, and `npm run release:check` output.
- ACA deploy run and digest invariant after merge.
- Signed-in browser proof after deploy.

## Known Gaps

- Schema availability is a prerequisite; this release does not apply migrations.
- Data availability depends on imported request-version rows already existing.
- This release does not create live events during testing, contact suppliers, send email, approve governed content, or claim signed-in proof.
