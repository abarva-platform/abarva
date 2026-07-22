# 2026-07-22-source-artifact-authority-ask-context — Scope Source aVa artifact context to authoritative artifacts

## Release ID

`2026-07-22-source-artifact-authority-ask-context`

## Status

`candidate` — focused tests, lint, and typecheck pass locally. PR, deploy, ACA invariant, and
signed-in live proof are pending.

## Plain-English Summary

Source already has a shared resolver for one authoritative artifact, but the Source `nexus/ask`
route still loaded every artifact row for an event into aVa context. That means a superseded AI
draft and a later accepted client-final artifact could both contribute chunks, facts, and primary
evidence to an answer.

This release adds the missing slot-level resolver and uses it in the Source ask route. For each
event-stage/artifact slot, only the authoritative artifact contributes substantive chunks, facts,
and primary evidence. Superseded siblings are retained only as bounded audit lineage, clearly
labeled as not authoritative.

## Layer Impact

- `global-control-lane`: shared Source artifact resolver gains an additive slot-level helper.
- `global-control-lane`: Source `nexus/ask` context loading now scopes artifact evidence before it
  reaches aVa answer generation.
- No schema, migration, permission, payload-contract, or production data mutation changes.

## Client Applicability

- All Source clients.
- Most visible when an event has both an older generated/uploaded artifact and a newer
  authoritative/client-final sibling for the same stage/artifact slot.
- Feature flag: none.

## Changes Included

- `src/lib/source/client-final-artifacts.ts`
  - Adds optional `sourceOrigin` to the authority candidate shape.
  - Treats `sourceOrigin: "generated"` as a generated-draft fallback, matching runtime rows that do
    not always carry `artifactGroup`.
  - Adds `resolveAuthoritativeArtifactSlots()` to return one winner plus ordered history per slot.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`
  - Resolves one authoritative artifact per `stage_key::artifact_kind` slot.
  - Queries chunks/facts only for authoritative artifact ids.
  - Builds primary artifact evidence only from authoritative artifacts.
  - Adds bounded `source-artifact-audit:*` lineage evidence for non-authoritative siblings.
- Tests
  - Adds shared resolver tests for `sourceOrigin` fallback and slot-history behavior.
  - Adds a Source route-level regression that asserts the route filters chunks/facts through the
    authoritative id set and that superseded same-slot draft chunks are excluded from substantive
    evidence.

## QA / Validation

- `pass` — `npx jest --runTestsByPath src/lib/source/__tests__/client-final-artifacts.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/artifact-authority-context.test.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  — 3 suites / 14 tests passed. Jest printed the repo's pre-existing duplicate manual mock warnings.
- `pass` — `npx eslint src/lib/source/client-final-artifacts.ts src/lib/source/__tests__/client-final-artifacts.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/artifact-authority-context.test.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
  — clean.
- `pass` — after installing the lockfile dependency tree in the clean worktree,
  `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`.
- `pending` — `npm run release:check`, PR checks, ACA deploy, and signed-in live proof.

## Rollout Plan

Merge through PR, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime
invariant, then run signed-in Source/aVa proof on a real event with a superseded/generated artifact
and an authoritative sibling.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: to be recorded after deploy.
- Worker image invariant: to be recorded by the deploy workflow if applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Rollback restores the prior behavior where Source `nexus/ask` can load all
artifact rows, chunks, and facts for an event regardless of per-slot artifact authority. No data
migration either direction.

## Audit Evidence

- PR: to be recorded after open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after deploy.
- Live signed-in proof: to be recorded after deploy.

## Known Gaps

- This release covers `SOURCE-ARTIFACT-AUTHORITY-001a` only: the shared slot resolver plus Source
  `nexus/ask` authority scoping.
- Files listing unification, direct download authority, Deal Pack authority, render-route
  format-mismatch honesty, and old persisted draft regeneration remain separate backlog items.
