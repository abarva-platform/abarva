# 2026-07-15-global-nav-native-anchors — Global Nav Native Anchors

## Release ID

`2026-07-15-global-nav-native-anchors`

## Status

`candidate`

## Plain-English Summary

The global Nexus product navigation now uses normal browser anchors for top-level module switches. This fixes a live issue where clicking Knowledge from Tower, Source, or Intelligence showed the correct `/home` link target but did not leave the current page because the client-side route transition was prevented or aborted.

## Layer Impact

- `global-control-lane`: Shared top navigation behavior changes for shell-native product routes. No tenant data, module answer logic, or runtime data layer behavior changes.

## Client Applicability

- All clients: Yes, signed-in users on shell-native product surfaces receive the more reliable global nav behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/navigation/NexusTopNav.tsx`
- `src/components/navigation/__tests__/NexusTopNav.test.tsx`

## QA / Validation

- Pass: reproduced the live issue before the fix. The Knowledge anchor on `/tower` had `href="/home"`, but after click the URL remained `/tower`.
- Pass: confirmed the same shared-nav click issue affected `/source` and `/intelligence`, so the fix belongs in global navigation rather than Tower-only code.
- Pass: `npx jest src/components/navigation/__tests__/NexusTopNav.test.tsx --runInBand` passed 11 tests after the patch. Jest also reported existing duplicate manual mock warnings unrelated to this change.
- Pass: `npx eslint src/components/navigation/NexusTopNav.tsx src/components/navigation/__tests__/NexusTopNav.test.tsx`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pending: signed-in browser proof from Tower to Knowledge after deploy.

## Rollout Plan

Merge to `main` through PR, deploy through the repo-owned Azure Container Apps main workflow, then verify `https://app.abarva.ai/tower` signed-in navigation to Knowledge.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by standard deploy proof.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. The rollback restores the previous Next.js Link-based global product navigation.

## Audit Evidence

- PR URL: Pending.
- CI/release validation: Local focused Jest, ESLint, release check, and whitespace check passed.
- Live browser proof: Pending.

## Known Gaps

The pre-deploy browser proof can only validate the currently deployed defect. The patched native-anchor behavior still needs the standard post-deploy signed-in proof on `app.abarva.ai` before this release is called live-proven.
