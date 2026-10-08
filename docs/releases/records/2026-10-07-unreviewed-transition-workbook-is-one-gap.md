# 2026-10-07-unreviewed-transition-workbook-is-one-gap — An unreviewed transition workbook is one open item

## Release ID

`2026-10-07-unreviewed-transition-workbook-is-one-gap`

## Status

`candidate`

## Plain-English Summary

A Move cannot leave a phase until the readiness workbook for that transition has
been reviewed. That rule is unchanged. What changed is what the Move is told
while the review is outstanding.

The phase 2–4 reading reported the missing review once per required evidence
family. A Move whose evidence was fully approved — every required family
uploaded, reviewed and approved — was therefore told that eleven required
evidence items were still open, and the workbook that would actually have
cleared the phase was not named anywhere in the list. Approved evidence was also
re-labelled as only partially present, which is not what the evidence record
said.

A missing review is one missing review. It is now reported the way the phase 1
reading has always reported it: as a single named "P2 to P3 readiness workbook"
item with the action that clears it. Approved evidence keeps the status the
evidence record gives it, and nothing may still be drafted from it while the
review is outstanding.

The distinction the fix turns on is stated in the code: a workbook that HAS been
reviewed, but has no answer for one family, remains that family's own gap,
because the answer really is missing there. Only a transition with no required
review at all collapses to the single workbook item.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- Layer 4 products: the Moves phase surface, the phase gate approval route, and
  phase deliverable generation all read this projection, so all three now name
  the outstanding review instead of counting evidence families. No data changed.
- Layer 3 canonical model: unchanged. No reads or writes were added or altered.

## Client Applicability

- All clients: yes, for Moves phase transitions 2→3, 3→4 and 4→5.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This corrects an existing reading rather than adding a
  capability.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/gate-readiness.ts` — a transition
  with no required review returns one named workbook packet; the per-family
  rewrite and the absent-review rewrite now share one helper that states the one
  difference between them.
- `src/lib/programs/stage-readiness-workbooks/__tests__/gate-readiness.test.ts`
  — six added cases; one existing case re-pointed from the old mechanism to the
  intent it was written for.
- `src/app/api/v1/programs/[programId]/phase-gate-approval/__tests__/route.test.ts`
  — the consumer's refusal case now pins the named workbook in the payload.

## QA / Validation

- PASS `npx jest src/lib/programs src/app/api/v1/programs src/components/strategic-moves`
  — 388 suites, 5172 tests.
- PASS mutation check of the changed logic: 7 mutations, 7 killed. One survivor
  on the first pass (narrowing the condition from "no required review" to "no
  workbook loaded") was diagnosed as a real second route to the same defect and
  is now covered by its own case.
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- PASS `npx eslint` on both changed directories — exit 0.
- PASS the gate is not loosened: a phase with an outstanding review still
  refuses, the approval route still returns 409 and still does not advance, and
  nothing may be drafted from the affected evidence. Each is a separate case.
- NOT RUN live signed-in walk. This release does not claim live proof.

## Rollout Plan

Merge to `main`. The repository-owned ACA main deploy workflow builds the
digest-pinned image and shifts traffic. No migration, no flag, no data-plane
job, no worker change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100%
  traffic revision image and worker job images all matching the approved digest.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, before this is called live-proven — a
  signed-in phase surface showing the outstanding review named once.

## Rollback Plan

Revert the PR and redeploy the previous digest-pinned image. The change is pure
projection logic with no stored state, so a revert restores the prior reporting
immediately and cannot leave a Move in an intermediate state. No migration
rollback applies.

## Audit Evidence

The PR URL and its CI run, the test and mutation output quoted above, the
typecheck and lint exits, the main deploy workflow run and the digest it
assigned, and the post-deploy signed-in phase-surface check.

## Known Gaps

- No live signed-in proof yet, so this is `candidate`, not `released`.
- A Move whose phase declares no required evidence families still reports the
  workbook through the pre-existing zero-family branch; that branch is untouched
  here and keeps its own wording.
- Phase 5 remains outside this projection entirely, as before: there is no
  following transition to prepare for.
- The committed coverage census is one test file behind `main` as this is
  written. This release adds no test file and so neither causes nor cures that;
  one regeneration is owed once the open queue drains.
