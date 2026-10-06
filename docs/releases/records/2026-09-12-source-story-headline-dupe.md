# 2026-09-12-source-story-headline-dupe — The Story paragraph appears once

## Release ID

`2026-09-12-source-story-headline-dupe`

## Status

`draft`

## Plain-English Summary

The Story tab printed its opening paragraph twice. A previous release in this
series tried to stop that and did not, because the test it used was wrong.

The purpose block and the governed tab narrative are written from the same
reviewed contract intelligence. The narrative's headline field carries
long-form prose, not a title, so on Story the headline and the purpose
paragraph resolve to the same sentences. The earlier attempt compared the two
combined strings with a containment test — but they share their opening
sentences and then diverge, so neither contains the other and the check passed
while the reader still saw the paragraph twice.

This compares the normalised opening instead, and drops only the repeated
headline. The narrative's own body says something the purpose block does not,
and is kept.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation only.
- **Layer 3 (Canonical model).** Unchanged.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `WorkspaceExecutiveShell.tsx` — replaces the containment check with a
  shared-opening comparison, and narrows the suppression to the headline alone
  rather than the whole narrative block.
- `__tests__/contractStoryDuplication.test.ts` — new. Pins the shape that
  defeated the earlier check: prose that shares an opening and then diverges,
  where neither string contains the other.

## QA / Validation

- Reproduced live on `6482aa1ff` after the previous attempt deployed. The
  rendered purpose paragraph and the narrative headline were byte-identical for
  their opening 170 characters; the page carried two copies.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint src/app/(maestro)/source/preview/workspace/` — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence
  src/lib/source/data-model` — 39 suites, 310 tests, passing.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On the cloud-commitment contract,
  confirm the Story tab carries the opening paragraph exactly once and that the
  governed narrative's own paragraph is still present beneath it.

## Rollback Plan

Revert and redeploy. Presentation only; no migration and no data change.

## Known Gaps

- **The headline field still carries long-form prose.** Every consumer has to
  defend against it — the contract header truncates on length, and this
  compares openings. A distinct short-form field on the intelligence record
  would remove the need for both heuristics, and is the proper fix.
- The shared-opening window is twelve words. Two genuinely different paragraphs
  that happen to open with the same twelve words would be treated as a repeat.
  No such case exists in the current data, and the alternative — leaving the
  duplicate on screen — is worse.

## Audit Evidence

- Commit on branch `claude/source-story-headline-dupe`, based on `6482aa1ff`.
- CI run for the PR, including `npm run release:check`.
- Live reproduction and local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
