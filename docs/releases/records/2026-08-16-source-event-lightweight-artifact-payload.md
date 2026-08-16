# 2026-08-16-source-event-lightweight-artifact-payload — Source Event Lightweight Artifact Payload

## Release ID

`2026-08-16-source-event-lightweight-artifact-payload`

## Status

`candidate`

## Plain-English Summary

The Source event workflow page now sends artifact registry metadata to the browser instead of hydrating full artifact text bodies for every document in an event. This keeps the 11-stage workflow responsive while preserving visible evidence status, processing state, acceptance state, and source metadata.

## Layer Impact

- Release lane: `global-control-lane`
- PRODUCTS: Source event pages render from the same canonical event, artifact registry, evidence, and approval read models, but the browser payload no longer carries full artifact body previews by default.
- CANONICAL MODEL: No schema or data mutation. Existing source artifact and evidence rows remain authoritative.

## Client Applicability

- All clients: Yes, for the shared Source event workflow route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/__tests__/integration/source/source-event-route-payload-contract.test.ts`

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/events/[eventId]/page.tsx'` — passed.
- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.newEventJourneySmoke.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx src/__tests__/integration/source/source-event-route-payload-contract.test.ts --runInBand` — passed, 3 suites / 19 tests.
- Existing full `source-event-canvas-shell.test.ts` was attempted in a detached worktree but its seeded event lookups returned `null` before route assertions; not counted as a product pass.

## Rollout Plan

Merge through the normal PR lane. The repo-owned ACA main deploy workflow promotes the resulting main image to the shared web runtime. No database migration or operator job is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned ACA workflow after merge.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source event route should render without browser automation freeze and retain the Responses evidence-readiness table.

## Rollback Plan

Revert the PR to restore the previous artifact-body hydration behavior. No data rollback is required.

## Audit Evidence

- PR and CI evidence after publication.
- Route lint output.
- Focused SourceAnalyticsCanvas and VendorResponseFileReadinessPanel test output.
- Signed-in browser proof after deployment.

## Known Gaps

- This does not add a lazy artifact body preview endpoint. If the product later needs full document text previews inside the Files workspace, add a dedicated on-demand route rather than restoring default page-wide body hydration.
