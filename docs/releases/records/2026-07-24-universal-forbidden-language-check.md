# 2026-07-24-universal-forbidden-language-check — Close the internal-language leak gap for 5 deliverable types

## Release ID

`2026-07-24-universal-forbidden-language-check`

## Status

`candidate`

## Plain-English Summary

While auditing the P4 Business Case deliverable for document quality, tracing the real quality-gate
code (`premiumGoldenBarOptionsForArtifact()` in `strategic-moves-artifact-standard.ts`) found that
only 4 of 9 declared Moves artifact types (`charter`, `discovery_report`, `target_state_architecture`,
and the `solution_design`/`operating_model_design`/`sourcing_strategy` group) get a
forbidden-internal-language check wired into their quality bar. The other 5
(`root_cause_worksheet`, `solution_approach_options`, `execution_roadmap`, `business_case`,
`handoff_package`) fell through to a bare options object with no `forbiddenLanguage` list at all —
meaning `meetsGoldenBar()` had no mechanism to catch words like "kernel", "tenant key", "debug", or
"canonical internal id" leaking into these 5 client-facing document types. This change adds the
same `STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS` list already used for charter/discovery_report to
the fallthrough branch, closing the gap for all 9 artifact types uniformly.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **Application/quality-gate layer only.** `src/lib/deliverables/strategic-moves-artifact-standard.ts`:
  the generic fallthrough branch of `premiumGoldenBarOptionsForArtifact()` now also returns
  `forbiddenLanguage`. No schema change, no change to `minimumWordCount`/`enforceMaximumWordCount`
  behavior for any artifact type — those are untouched.

## Client Applicability

- All clients: yes — shared quality-gate infrastructure, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — closes a safety gap that should never legitimately fire (no artifact
  should contain literal internal jargon in client-facing prose)

## Changes Included

- `src/lib/deliverables/strategic-moves-artifact-standard.ts` — the fallthrough branch of
  `premiumGoldenBarOptionsForArtifact()` now returns `forbiddenLanguage:
  STRATEGIC_MOVES_FORBIDDEN_ARTIFACT_TERMS` alongside the existing `maximumWordCount`/
  `enforceMaximumWordCount`
- `src/lib/deliverables/__tests__/golden-bar.test.ts` — 2 new assertions: all 5
  previously-uncovered artifact types now get a non-empty `forbiddenLanguage` list including
  `"tenant key"`; a `business_case` containing `"tenant key"` fails the bar
- `docs/backlog/moves-product-backlog.md` — new `MOVES-BUG-006` entry

## QA / Validation

- `npx eslint` on both changed files: clean
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p tsconfig.json`: no new errors (3
  pre-existing, unrelated missing-module errors in `src/components/home/*`)
- `npx jest src/lib/deliverables`: 418/424 passing. The 6 failures are all pre-existing and
  unrelated, confirmed present on a clean `origin/main` checkout before this change
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open
- Confirmed no other test in the repo asserts an exact/exhaustive shape of
  `premiumGoldenBarOptionsForArtifact()`'s return for any of the 5 affected artifact types (grep
  found none), so this additive field carries no known snapshot-breaking risk

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every future generation of the 5 affected artifact
   types immediately on deploy.
3. Live signed-in verification: this check should never fire for a normal, well-formed generation
   (the forbidden terms are internal-only implementation vocabulary); no specific live regeneration
   proof is planned beyond confirming existing generation flows for these 5 types still succeed
   post-deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (evaluated synchronously in the generation request path)
- Feature/env flag update path: none
- Live signed-in proof required: yes — confirm the 5 affected artifact types still generate
  successfully post-deploy (this check should never legitimately block a real generation)

## Rollback Plan

Revert the merge commit. The change is a single additive field on one object literal; reverting
returns to the prior (gap) behavior. No data cleanup required.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `MOVES-BUG-006` in `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts` output captured in
  this session's validation pass (27/27 passing, including both new assertions)

## Known Gaps

- Does not add `minimumWordCount` enforcement to the 5 affected artifact types —
  `business_case` in particular has no minimum-depth check at all in the real generation path
  (only an informational max ceiling). This is a separate, real gap, deliberately left open as a
  policy decision (adding a new hard minimum-word block carries real generation-blocking risk on
  live Moves) rather than fixed here.
- Does not resolve the broader architectural question (raised in `MOVES-BUG-005` for Charter) of
  whether `quality-bar-registry.ts`'s richer, per-artifact quality bars (e.g. 9 sections /
  5,000-9,500 words for `business_case`) should be wired into the real generation path instead of
  or alongside `strategic-moves-artifact-standard.ts`'s simpler bars.
- No live regeneration proof of any of the 5 affected artifact types has been captured yet
  confirming the check doesn't produce false positives against real generated content.
