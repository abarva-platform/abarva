# 2026-07-23-source-guidebook-client-overrides — Source guidebook client override resolver

## Release ID

`2026-07-23-source-guidebook-client-overrides`

## Status

`deployed-signed-in-proven`

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

- Pass — `npm test -- --runInBand src/lib/source/stage-guidebooks/__tests__/repository.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` passed after adding the tenant-label UI regression, 22/22. Same pre-existing duplicate Jest manual mock warnings observed.
- Pass — `npx eslint src/lib/source/stage-guidebooks/repository.ts src/lib/source/stage-guidebooks/__tests__/repository.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` passed.
- Pass — `npm run release:check` passed. The command rewrote legacy-purge report timestamps; those generated timestamp-only changes were reverted before commit.
- Blocked — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` was blocked by pre-existing missing optional graph packages in unrelated Home files: `@xyflow/react` and `@dagrejs/dagre`.
- Pass — PR #5426 merged as `f83eeb95f2067a0ec54da06bba53461fa58f675d`.
- Pass — PR #5426's immediate ACA main deploy run `29980182441` was canceled by the deploy queue, but the next successful main deploy run `29980215454` completed for `908a3a3139ecb7eef026778c33d6278ca877a942`, which contains `f83eeb95f2067a0ec54da06bba53461fa58f675d`.
- Pass — signed-in Lakeshore browser proof on `app.abarva.ai` at `2026-07-23T16:38:38.214Z` opened Source event `c05872d8-0465-4bc8-8eeb-ff3d42ac6761` on Strategy, clicked the Guidebook tab, and confirmed the global Strategy guidebook rendered with "Global default"; no tenant guidebook label appeared because no governed tenant-specific row exists.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and complete signed-in Source guidebook smoke proof.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: superseding main deploys contain this merge; current digest is recorded in the latest independent ACA invariant for the active revision.
- ACA runtime invariant: required after every superseding deploy before claiming current production.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Strategy Guidebook tab should still render the global guidebook; client-specific live proof requires an authored tenant row and is data-blocked until one exists.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. That restores the prior single-query tenant-or-global lookup. No migration rollback is required.

## Audit Evidence

- PR URL: #5426.
- Merge SHA: `f83eeb95f2067a0ec54da06bba53461fa58f675d`.
- ACA deploy run / digest: immediate run `29980182441` canceled; superseding successful main run `29980215454` contains the merge. Later successful main deploys also contain it.
- Signed-in browser proof: Lakeshore Source Strategy Guidebook tab rendered on `app.abarva.ai`, global default visible, tenant override absent as expected because no tenant-specific row exists.

## Known Gaps

- No tenant-specific guidebook rows are authored by this slice. Production will continue to show the global Strategy guidebook until a governed content/data change creates a published tenant override.
- Only the Strategy stage currently has authored guidebook content.
- No guidebook authoring/admin UI is added here.
