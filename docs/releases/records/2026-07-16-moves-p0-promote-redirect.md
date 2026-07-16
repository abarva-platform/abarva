# 2026-07-16-moves-p0-promote-redirect — Moves P0 Promote Redirect

## Release ID

`2026-07-16-moves-p0-promote-redirect`

## Status

`candidate`

## Plain-English Summary

Moves P0 origination no longer sends a completed seven-section brief into the old Programs detail page. Strategic Moves origination now lands on the Moves P0 phase workspace with the gate area focused, so the operator can review/approve the P0 brief and advance to P1 inside the same Moves shell.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves routing and post-origination behavior for all tenants.
- `product UX`: Removes the stale post-submit handoff into the legacy Programs detail renderer for real Move UUID routes.

## Client Applicability

- All clients: Yes, for Strategic Moves origination.
- Specific clients: Meridian Health was the reported reproduction tenant.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new feature flag.

## Changes Included

- `src/lib/programs/origination-submit.ts`: returns `/strategic-moves/{moveId}/phase/0?focus=gate` for `/strategic-moves/new` submissions, including duplicate/reused submissions.
- `src/components/strategic-moves/resolveOriginationRedirect.ts`: defensively rewrites stale `/programs/{id}` submit responses into the Moves P0 gate route.
- `src/app/programs/[id]/page.tsx`: redirects real UUID-backed legacy `/programs/{id}` requests into the Moves phase workspace instead of rendering the old page.
- Regression coverage in `StrategicMoveOriginateClient` and origination submit contract tests.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/lib/programs/__tests__/origination-submit-contract.test.ts --runInBand`.
- Pass: `npx eslint src/components/strategic-moves/resolveOriginationRedirect.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/lib/programs/origination-submit.ts src/lib/programs/__tests__/origination-submit-contract.test.ts 'src/app/programs/[id]/page.tsx'`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`.
- Pass: `git diff --check`.
- Pass: `npm run release:check`.
- Not run: signed-in browser proof on `app.abarva.ai`.

## Rollout Plan

Open a PR against `abarva-platform/abarva`, squash merge to `main`, and deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run a signed-in Meridian P0 origination proof: complete all seven sections, click Promote to P1 Charter, confirm the browser lands on `/strategic-moves/{moveId}/phase/0?focus=gate`, and confirm no old Programs detail page appears.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending main deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Local validation: Commands listed in QA / Validation passed.
- Live proof: Pending signed-in Meridian browser proof after deploy.

## Known Gaps

- This candidate does not delete the legacy fixture-backed Programs pages; it prevents real Strategic Moves UUIDs and Strategic Moves origination from landing there.
- This candidate does not auto-approve the P0 gate. Human gate approval remains required in the Moves phase workspace.
