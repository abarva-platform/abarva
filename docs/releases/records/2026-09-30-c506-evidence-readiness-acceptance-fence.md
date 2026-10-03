# 2026-09-30-c506-evidence-readiness-acceptance-fence — Evidence-readiness answers cite accepted versions only

## Release ID

`2026-09-30-c506-evidence-readiness-acceptance-fence`

## Status

`candidate`

## Plain-English Summary

When a user asks the Source assistant which of an event's files are stored, parsed, search-ready
or blocked, the answer shows a readiness chart and table and attaches citations to the files it is
speaking from. Until now it cited every file registered to the event for that tenant, whether or
not anyone had accepted it. A file superseded by a newer accepted version was cited like the
current one, and so was a file whose content had drifted from what was accepted.

This change is the second answer mode routed through the acceptance-bound event-context fence
(the first was artifact quality). A file is quotable only when an acceptance record names the
version being shown as the authoritative one and its content is recorded as current. The
readiness report is unchanged — every stored file is still counted in the chart, the table and the
totals, because that view quotes nothing. When files are excluded from citation the answer says
so in plain language and says what makes them quotable.

The existing render gate is kept exactly as it was: if the corpus policy refuses every one of the
event's files (for example because they are restricted), the answer is still blocked and shows
nothing. That gate deliberately runs over the event's files, not over the fence's survivors,
because an unaccepted restricted file is refused by the fence first and would otherwise never
reach it — the suite's existing restricted-file case failed until this was kept.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 4 — Products (Source).** The evidence-readiness answer's citation path. The readiness
  projection, chart and table are untouched.
- **Layer 3 — Canonical model.** No schema, migration or write. Acceptances are read through the
  existing repository function.

## Client Applicability

- All clients: yes — every tenant asking an evidence-readiness or stage-completion question on a
  Source event.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is fail-closed on the citation path and leaves the deterministic
  answer intact.

## Changes Included

- `src/lib/source/ava/evidence-readiness-governed-answer.ts` — reads the latest acceptance for
  every listed file, builds `acceptedArtifactVersions` from `authoritative_version_id` through the
  shared `acceptedArtifactVersionsFor`, and hands every listed file to
  `buildGovernedEventContextBundle`. New exported `eventContextCandidatesForEvidenceReadiness`
  canonicalises a file listed under one of the event's aliases (row id or event code) to the asked
  event; a file naming another event keeps its own id and is refused by the fence's rule. Citations
  come from what the fence admits. Adds a plain-language gap when this event's files are excluded.
- `src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts` — the cases below,
  plus two existing cases given explicit acceptances so their citation assertions stay meaningful
  under the fail-closed default (one of them would otherwise have passed vacuously).

No route changed; the two route suites that reach this mode mock it.

## QA / Validation

- `npx jest src/lib/source/ava` on a clean `origin/main` worktree —
  **before: 26 suites, 396 tests, 0 failing. after: 26 suites, 402 tests, 0 failing** (+6 tests).
  `src/lib/source/ava` plus the Source nexus route suites: 29 suites, 420 tests, 0 failing after.
- Red first, tests added and mode unwired: **5 failed, 14 passed.** An unaccepted file, a
  superseded version and a drifted file were each cited, the other-tenant/other-event lookup case
  failed, and the new candidate mapper did not exist. After wiring: **19 passed, 0 failed.**
- Mutations, each applied alone, suite run, reverted:
  - accepted-version map built from the file's own id → **1 fails** (superseded case).
  - event-alias canonicalisation removed → **2 fail**; applied to every file → **2 fail**.
  - acceptances looked up for the filtered files only → **1 fails**.
  - citations taken from the render gate instead of the fence (the mode unwired) → **3 fail**.
  - render gate removed → **1 fails** (restricted-file case).
  - exclusion gap counting every refusal, not only this event's own files → **1 fails**.
  - Declared rather than counted: handing the fence only the pre-filtered files is
    output-equivalent — both paths drop the other tenant's and other event's file and nothing the
    answer exposes distinguishes them. The fence's tenant and event rules are proved at the fence
    boundary by a case asserting refusal codes `opposite_tenant`, `cross_event` and
    `unreviewed_evidence`.
- A tenant canonicalisation step was written and then **removed as redundant**: its mutation
  survived, and a sweep of all 816 alias spellings (three casings) over 36 tenant keys showed every
  alias of a governed tenant already resolves to its governed key upstream.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**.
- `npx eslint` on both changed files — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the image. No
migration, no flag, no worker job, no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the PR after the deploy run completes.
- ACA runtime invariant: to be proven after deploy — template image digest equal to the
  100%-traffic revision's digest.
- Worker image invariant: the delivery worker jobs are checked against the same digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is owed, not claimed.** The item requires a
  signed-in check on the deployed SHA for each wired mode; an unattended run cannot perform one.

## Rollback Plan

Revert the PR and redeploy through the same workflow. The change is read-only and confined to one
module, so a revert restores the previous citation behavior with no data consequence.

## Audit Evidence

- PR and CI run: on the PR.
- Test output before and after, and each mutation and its revert, quoted above.
- The fence module and its suite, unchanged, as the contract this mode now obeys.

## Known Gaps

- **Signed-in acceptance for this mode is owed.** Nothing here may be read as live-proven.
- Eight event answer modes still build evidence without the fence. Each is a separate change.
- A tenant with no acceptance records sees no citations on this answer, and sees the exclusion
  gap instead. That is the intended fail-closed direction; whether the readiness answer still
  reads as useful is what the signed-in check must judge.
- The exclusion gap counts every refusal of this event's own files, including an accepted file the
  corpus policy refuses; the gap's wording ("not bound to an accepted, current version") is exact
  only for the acceptance refusals. This matches the first wired mode.
