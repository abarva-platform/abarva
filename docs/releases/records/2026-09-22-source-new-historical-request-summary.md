# 2026-09-22-source-new-historical-request-summary — Historical Request Summary

## Release ID

`2026-09-22-source-new-historical-request-summary`

## Status

`candidate`

## Plain-English Summary

Source New now shows the facts recorded during the Request phase when an operator reviews that phase later in the event. Need, scope, category, and decision owner come from the governed event. A ServiceNow request number, requester, archetype, and mapping decision appear only when the event is linked to a governed intake request and the mapping has a named human decision. Older events without that authority are not described as ServiceNow requests, and an automated mapping proposal is never presented as an accepted decision.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 canonical model: no canonical record is created or changed. The existing tenant-scoped intake request, mapping-decision, and event-link authorities remain the only basis for request origin and mapping details.

Layer 4 product projection: the historical Request phase renders a compact read-only summary from existing governed event and intake authorities while preserving the current-work action.

## Client Applicability

- All clients: yes, wherever Source New and the governed intake request registry are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/historical-request-summary.ts` builds the fail-closed read-only Request summary.
- `src/lib/source/intake/servicenow-sourcing-request-repository.ts` retains the requester identity already recorded in the normalized request.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` associates an intake request only through its governed event link.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` mounts the summary only on the historical Request phase.
- Focused projection, repository, and mounted behavior tests cover the authority boundary.

## QA / Validation

- Red-first tests: the projection suite initially failed because the summary module did not exist, and the intake-reader suite failed because the requester identity was discarded.
- Mounted red-first tests: the historical Request region was absent before the workspace mount, and both the governed-origin and no-origin cases failed until the summary was mounted.
- Mutation proof: allowing generic requester and reviewer identities, reversing the source-version equality guard, and mounting the summary on Define instead of Request were each caught by the focused suites; every guard was restored.
- Focused Jest: 4 suites and 71 tests passed, covering the authority projection, intake repository, mounted workspace, and signed-in route composition boundary.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- Scoped ESLint passed for every changed TypeScript and TSX file.
- Release control and test-census validation are required again after the final rebase onto `main` and before the pull request opens.

## Rollout Plan

Merge through a pull request. The change becomes active only after the normal repo-owned Azure Container Apps main deployment. No migration, tenant import, or data-build job is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none in this pull request.
- Approved image digest: not assigned until the repo-owned deploy builds from main.
- ACA runtime invariant: required after deployment before any live claim.
- Worker image invariant: required after deployment before any live claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming the historical summary is visible in the authenticated product.

## Rollback Plan

Revert the pull request before deployment, or merge a revert and redeploy through the repo-owned ACA workflow after deployment. No data rollback is required because this release is read-only.

## Audit Evidence

- Pull request URL after opening.
- Focused Jest and mutation output listed above.
- Typecheck, scoped ESLint, release-check, and test-census output from the pull request.
- Post-deploy ACA runtime invariant and signed-in Source New Request-phase proof before any live-proven claim.

## Known Gaps

- Events without a governed intake event-link intentionally show no ServiceNow origin or mapping authority.
- This release does not create or change intake requests, mapping decisions, or event links.
