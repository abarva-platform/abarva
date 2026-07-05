# 2026-07-05-source-fresh-event-client-final — Source Fresh Event Client-Final Lineage

## Release ID

`2026-07-05-source-fresh-event-client-final`

## Status

`candidate`

## Plain-English Summary

This release fixes a Source recording-readiness gap where creating another event with the same business title could reopen or update an older event because the event code was deterministic. Browser-created Source events now carry a hidden creation request id that makes the persisted event code unique while keeping the user-facing event title clean. The same submit still retries safely, but a new browser intake creates a fresh event, so phase approvals and updated/client-final documents such as RFP revisions bind to the correct event lineage.

## Layer Impact

- `global-control-lane`: Source event creation now supports a browser creation request id for fresh event identity across all clients.
- `public-demo`: Enables reliable end-to-end Source buyer-journey recordings where the same clean event title may be used repeatedly without picking up stale artifacts or client-final state.

## Client Applicability

- All clients: Applies to Source users creating events in the browser.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx`: generates a stable per-page creation request id and sends it with the event creation payload.
- `src/app/api/v1/source/events/route.ts`: accepts the optional creation request id and passes it to the Source event creation layer.
- `src/lib/source/queries.ts`: appends a sanitized short suffix to the event code when a creation request id is provided, without changing the event name.
- `src/__tests__/integration/source/source-originate-page.test.ts`: verifies the browser payload sends the creation request id separately from the clean event title.
- `src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`: verifies fresh event instance codes are suffixed while event titles remain unchanged.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts src/__tests__/integration/source/source-originate-page.test.ts`
- Pass: `npx eslint src/lib/source/queries.ts src/app/api/v1/source/events/route.ts src/components/source/SourceOriginatePage.tsx src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts src/__tests__/integration/source/source-originate-page.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Not run yet: `npm run release:check` final rerun after this record update.
- Not run yet: PR CI, ACA deploy, and signed-in live proof of phase approval plus updated/client-final artifact upload.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the Source signed-in buyer-journey proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps image build/deploy only
- Approved image digest: Pending
- ACA runtime invariant: Pending
- Worker image invariant: Not changed
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Rollback the ACA web app to the previous healthy revision or revert this commit on `main` and redeploy. No migrations or destructive data changes are included.

## Audit Evidence

- PR URL: Pending
- CI run: Pending
- Deployment run: Pending
- Live proof bundle: Pending

## Known Gaps

None known for this narrow fix. It does not change Source artifact content, generation logic, or stage-gate policy.
