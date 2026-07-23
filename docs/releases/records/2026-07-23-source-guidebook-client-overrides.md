# 2026-07-23-source-guidebook-client-overrides — Source guidebook client override resolver

## Release ID

`2026-07-23-source-guidebook-client-overrides`

## Status

`candidate`

## Plain-English Summary

Source stage guidebooks now resolve client-specific content explicitly and safely. When a tenant-specific published guidebook exists for the viewed stage, Source reads that exact row first. If it does not exist, Source falls back to the shared global guidebook for the stage. The lookup is deterministic by newest published version, and the UI already labels client-specific guidebooks separately from global defaults.

This is the code contract needed before authoring tenant-tailored facilitator guides. It does not create any tenant guidebook content or mutate production data.

## Layer Impact

- Release lane: `global-control-lane`.
- Source guidebook repository: replaces the combined tenant-or-global lookup with explicit exact-client lookup followed by global fallback.
- Workspace UI contract: covered by regression test for the existing `Tenant guidebook` label when a client-specific row is passed through.
- Data layer: no schema change and no data mutation. The existing `source_stage_guidebooks.client_key` column remains the source of override authority.

## Client Applicability

- All clients: yes, for Source stage guidebook rendering.
- Specific clients: none in code. Tenant-specific behavior activates only when a published row exists with that client's exact `client_key`.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/stage-guidebooks/repository.ts`: reads the exact client guidebook first, then the global default, with newest-version ordering.
- `src/lib/source/stage-guidebooks/__tests__/repository.test.ts`: proves exact-client precedence, global fallback, no broad OR filter, deterministic ordering, null degradation, malformed-section degradation, and real-error propagation.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`: proves the existing workspace badge distinguishes tenant guidebooks from global defaults.
- `docs/backlog/source-product-backlog.md`: records `SOURCE-GUIDEBOOK-004` as candidate/closed-on-merge scope.

## QA / Validation

- `npm test -- --runInBand src/lib/source/stage-guidebooks/__tests__/repository.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` — pass after adding the tenant-label UI regression, 22/22. Same pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/lib/source/stage-guidebooks/repository.ts src/lib/source/stage-guidebooks/__tests__/repository.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` — pass.
- `npm run release:check` — pass. The command rewrote legacy-purge report timestamps; those generated timestamp-only changes were reverted before commit.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by pre-existing missing optional graph packages in unrelated Home files: `@xyflow/react` and `@dagrejs/dagre`.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source guidebook smoke proof.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be recorded after ACA main deploy completes.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Strategy Guidebook tab should still render the global guidebook; client-specific live proof requires an authored tenant row and is data-blocked until one exists.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the prior single-query tenant-or-global lookup. No migration rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Merge SHA: to be added after merge.
- ACA deploy run / digest: to be added after deployment.
- Signed-in browser proof: to be added after deployment.

## Known Gaps

- No tenant-specific guidebook rows are authored by this slice. Production will continue to show the global Strategy guidebook until a governed content/data change creates a published tenant override.
- Only the Strategy stage currently has authored guidebook content.
- No guidebook authoring/admin UI is added here.
