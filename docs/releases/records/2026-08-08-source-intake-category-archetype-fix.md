# 2026-08-08-source-intake-category-archetype-fix — Align Source Intake Categories With Archetype Taxonomy

## Release ID

`2026-08-08-source-intake-category-archetype-fix`

## Status

`candidate`

## Plain-English Summary

The Source new-event intake now uses the same governed category taxonomy as the archetype resolver. When a user selects a category, the create API persists that canonical category id on the Source event so downstream archetype resolution can use the preferred classifier-category path instead of relying on the older coarse event-type fallback.

## Layer Impact

Release lane: `global-control-lane`.

Products: updates the Source intake category picker and create request payload.

Canonical projection/write path: stores the selected Source category id in `source_events.classified_category` during event creation when the intake supplies one. Existing classifier fallback behavior remains for events without an explicit category.

## Client Applicability

All clients: applies to Source new-event intake wherever Source event creation is enabled.

Specific clients: none.

Internal only: none.

Public/demo only: none.

Feature flag: follows existing Source access and event-creation controls.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx`: replaces the stale local category list with the canonical Source taxonomy categories and sends `categoryId` to the create API.
- `src/app/api/v1/source/events/route.ts`: validates incoming `categoryId` against `SOURCE_CATEGORY_IDS`.
- `src/lib/source/queries.ts`: persists the selected category id into `classified_category` when provided.
- Regression tests for intake taxonomy alignment and persisted category id.

## QA / Validation

- pass: `npx eslint src/components/source/SourceOriginatePage.tsx src/app/api/v1/source/events/route.ts src/lib/source/queries.ts src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`.
- pass: `npm test -- --runTestsByPath src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`.
- pass: active intake scan found no stale local category ids or local inferred-category fields in `SourceOriginatePage.tsx`.
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass: `npm run release:check`.
- not-run: signed-in browser proof; this is a create-path classification fix and should be live-proven after deploy by creating a new event with a selected category and reading back `classified_category`.

## Rollout Plan

Merge to `main` through PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image, then shifts shared app traffic after invariant checks pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for one Source new-event intake create path before claiming live-proven.

## Rollback Plan

Revert the PR and deploy the prior image through the repo-owned ACA main workflow. No schema or data rollback is required; rows already created with a valid `classified_category` remain compatible with the resolver.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- ACA deploy run: pending.
- Live proof: pending.

## Known Gaps

The 11-stage competitive-event journey still uses the fixed document catalog and does not branch stage-gate evidence requirements by archetype. That is intentionally held for a product/design decision rather than bundled into this bug fix.
