# 2026-06-04-source-artifact-operations — Source Artifact Operations Matrix

## Release ID

`2026-06-04-source-artifact-operations`

## Status

`candidate`

## Plain-English Summary

Source Setup now explains how the 33 canonical Source artifacts become real operational records: where each document comes from, how it is loaded, what formats are accepted, how it is parsed/stored, how agents may use it, what a best-in-class artifact should contain, what responsible-AI control applies, and whether the capability is wired, partial, or planned.

## Layer Impact

- `global-control-lane`: updates the shared Source setup/control surface and deterministic Source read-model for all clients. No schema, migration, tenant data, or live upload behavior changes are included.

## Client Applicability

- All clients: yes, the Source setup page and artifact operations contract are shared across tenant users with Source access.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: follows the existing Source route access and IA behavior.

## Changes Included

- Adds `src/lib/source/artifact-operations.ts` as the artifact operations contract.
- Rebuilds `/source/setup` as the Artifact Operations surface.
- Adds Setup to the IA v2 Source sub-navigation.
- Adds focused tests for the artifact operations contract and updates Source sub-nav tests.

## QA / Validation

- `npx jest src/lib/source/__tests__/artifact-operations.test.ts tests/unit/source-subnav-active-state.test.ts --runInBand` — passed.
- `./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck` — passed.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production pipeline. The change is read-only UI/read-model code; no migration or manual data operation is required.

## Rollback Plan

Revert the PR. Rollback restores the previous lightweight Source setup checklist and removes the Setup tab from IA v2 navigation.

## Audit Evidence

- PR and CI checks for this release candidate.
- Source files listed in the change set.
- Focused Jest and TypeScript command output from local validation.

## Known Gaps

- The page intentionally reports partial/planned capability for vendor response intake, Q&A/email drafting, complete parser coverage, all-artifact generation, and full visible action logging. Those are not solved by this release; they are made explicit as the next build backlog.
