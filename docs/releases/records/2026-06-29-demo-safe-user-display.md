# 2026-06-29-demo-safe-user-display - Demo-Safe User Display

## Release ID

`2026-06-29-demo-safe-user-display`

## Status

`candidate`

## Plain-English Summary

The authenticated top bar no longer renders Clerk `fullName` directly because some demo users can carry legacy client names in that profile field. The visible user label now prefers first and last name, strips suffix text after the separator, and runs the fallback through the demo-safe client-name scrubber.

## Layer Impact

- `global-control-lane`: Updates shared product chrome used across authenticated modules.

## Client Applicability

- All clients: Yes, for authenticated product chrome.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Especially important for demo tenants, but the change is global.
- Feature flag: None.

## Changes Included

- `src/components/shell/AppTopBar.tsx`
- `src/__tests__/integration/shell-topbar-auth.test.ts`

## QA / Validation

- Passed: `npx eslint src/components/shell/AppTopBar.tsx src/__tests__/integration/shell-topbar-auth.test.ts`
- Passed: `npx jest src/__tests__/integration/shell-topbar-auth.test.ts --runInBand`
- Passed: `npm run release:check`

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then run a signed-in browser check on `https://app.abarva.ai` to confirm the right-rail user label no longer exposes legacy tenant names.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: None outside the workflow.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: Required.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the top-bar change and redeploy through the same ACA workflow.

## Audit Evidence

- PR, CI run, ACA deploy run, and signed-in browser proof to be attached when released.

## Known Gaps

This does not ship the newer Home Context Command Center redesign. That redesign is not present on `origin/main` and needs a separate controlled PR.
