# 2026-07-29-knowledge-preview-qa-containment — Knowledge Preview QA Containment

## Release ID

`2026-07-29-knowledge-preview-qa-containment`

## Status

`candidate`

## Plain-English Summary

The governed Knowledge foundation canary proved the baseline/API path, but the same URL also exposed an operator preview shell as if it were a client-ready Knowledge page. This change separates those states. The technical canary now requires an explicit query switch, and the ordinary preview URL blocks client review until the approved Knowledge UI/content acceptance work is complete.

## Layer Impact

- `global-control-lane`: contains the Knowledge preview route so raw projection inventory, internal domain keys, parser sample rows, and disabled advisor diagnostics are not presented as the client Knowledge experience.
- `internal-admin`: updates the foundation proof script to use the explicit canary switch for baseline/API verification.

## Client Applicability

- All clients: No.
- Specific clients: Foundation preview tenants only.
- Internal only: Yes, operator preview and proof route behavior.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/knowledge-preview/page.tsx`
- `src/components/knowledge/vnext/KnowledgePreviewApp.tsx`
- `src/components/knowledge/vnext/knowledge-vnext.css`
- `scripts/auth/prime-foundation-preview-session.ts`

## QA / Validation

- `pass`: `NODE_OPTIONS=--max-old-space-size=8192 node_modules/.bin/tsc --noEmit`.
- `pass`: `node_modules/.bin/eslint src/app/'(maestro)'/knowledge-preview/page.tsx src/components/knowledge/vnext/KnowledgePreviewApp.tsx scripts/auth/prime-foundation-preview-session.ts`.
- `pass`: `npm run release:check`.
- `pass`: `git diff` confirms the foundation proof script now appends `canary=1` to the explicit operator proof URL.
- `pending`: ACA deploy and live browser check after merge.

## Rollout Plan

Merge through PR, deploy through the approved Azure Container Apps main lane, then verify the default Knowledge preview URL no longer renders the operator shell. Run the explicit canary proof URL for baseline/API evidence.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the ACA main lane. The rollback would re-expose the operator preview on the ordinary URL, so use only if the explicit canary proof path breaks.

## Audit Evidence

- PR URL: Pending.
- CI/check output: Pending.
- Runtime proof: Pending.

## Known Gaps

This is containment, not the final client Knowledge UI. The approved design implementation, content QA, aVa behavior, and module migration certification remain separate acceptance gates.
