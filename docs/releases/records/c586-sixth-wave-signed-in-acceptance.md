# 2026-10-04-c586-sixth-wave-signed-in-acceptance — Sixth-wave signed-in acceptance matrix

## Release ID

`2026-10-04-c586-sixth-wave-signed-in-acceptance`

## Status

`candidate`

## Plain-English Summary

Eight changes had been merged and deployed with nobody signing in to look at
them. This change records what a signed-in reader actually saw on the deployed
build, one row per surface, each marked pass, fail or blocked.

It adds no product code. It is evidence: a results matrix plus this record. The
walk was read-only — no upload, no approval, no send, no phase advanced, nothing
submitted — so nothing a client sees behaves differently because of this change.

Three surfaces passed, five are blocked, and each blocked row names the specific
action that would unblock it rather than being quietly treated as a pass. One
finding was filed as a separate backlog item: a capability shipped with a
working API and no client path to reach it.

## Layer Impact

- **Layer 4 — products**: documentation only. Two product surfaces were *read*
  (the Moves phase workspace and the Source event workspace); neither was
  modified, and no component, route or style in this change.
- **Layers 1–3**: untouched. No intake tab, adapter, canonical object, schema,
  migration or tenant dataset is read or written by this change.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: **yes** — an acceptance record and a release record, both
  internal governance artifacts.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/acceptance/signed-in-wave-acceptance-matrix.md` — new dated block,
  *2026-10-03/04 sixth wave — walked on deployed SHA `de09c6b806`*.
- `docs/releases/records/c586-sixth-wave-signed-in-acceptance.md` — this record.
- `EXECUTION_BACKLOG_20260918.md` (operator-owned, not in this repository) —
  C-586 closed with proof; `C-591` filed.

No source file, route, component, test, workflow or configuration file is
changed by this release.

## QA / Validation

The validation *is* the deliverable, so it is listed as performed rather than as
a suite that ran.

**Ancestry, re-derived rather than copied.** All eight merges C-586 names are
ancestors of the serving SHA `de09c6b8063379d3e1712220852df2f912c81a75`, each
checked with `git merge-base --is-ancestor` in this change's own worktree:
`6de543f93d` `be8bbcb2c6` `671fb591f5` `49e0ffa0a9` `f840268d25` `2dd54d1ff4`
`d9e927f3c8` `f431ae90c7`.

**Runtime bracketed, read-only, twice.** `az containerapp show` at 04:24:28Z and
again at 04:34:24Z returned the same template image
`sha256:cdc60ad95b1515eeb7ad61951f5121898196141f3ebea5403130a6ce020a2fbb` and the
same sole traffic entry `ca-abarva-web-lab-eastus--mde09c6b8` at weight 100 —
the count of `weight>0` entries is 1, not merely that one of them reads 100. The
revision is Healthy / Running, created 04:08:53Z, on an image identical to the
template. The digest was bound to its commit **in the registry**
(`az acr manifest show-metadata` → tag `main-de09c6b8`), not inferred from the
revision suffix, because a held invariant states internal consistency and never
which commit is serving.

**Walk window:** 04:27:03Z to 04:34:24Z. No deploy landed inside it.

**Verdicts:** three `pass` (the horizontal phase stepper; the explicit evidence
phase assignment, both halves; the readiness gate's permissive branch), five
`blocked`, each naming its unblocking action and who may take it. No row was
marked `pass` on a surface that was not reached.

**A negative result is recorded as one.** The walk's browser pinned the CSS
viewport at 1200 × 715 across window widths of 420, 1600, 1700 and 2200. Two
sub-claims are defined by viewport width and 1200 is on the wrong side of both,
so they are `blocked` on the width rather than folded into a pass at a width
that cannot test them.

**Static check behind one row.** The claim that a shipped capability has no
client caller was established by searching the whole of `src` for the route
path and the module specifier: the only hits are the route itself and its tests.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow will build and deploy
as it does for any merge. Nothing in this change needs to reach the runtime to
be useful — it is a record — so no flag, migration or manual step is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: **none**. This release contains no `az` command, no
  workflow change, no script that touches a Container App, job, revision,
  traffic weight, secret or environment variable.
- Approved image digest: not applicable — this release sets no image. The digest
  observed read-only during the walk was
  `sha256:cdc60ad95b1515eeb7ad61951f5121898196141f3ebea5403130a6ce020a2fbb`.
- ACA runtime invariant: read twice, read-only, unchanged across the walk; see
  QA / Validation. This release cannot alter it.
- Worker image invariant: untouched. No worker job is named, updated or read by
  this change.
- Feature/env flag update path: none.
- Live signed-in proof required: **not for this change** — it ships no product
  surface. The signed-in proof it *carries* is for eight earlier merges, and
  that proof is the content of the matrix block, not a rung owed on top of it.

## Rollback Plan

Revert the merge commit. Both files are additive documentation; reverting
removes the acceptance block and this record and restores the previous state
exactly. No migration, no data, no runtime dependency, so rollback is immediate
and has no ordering constraint.

The evidence itself would survive a revert in the operator-owned backlog and
claim register, which are outside this repository.

## Audit Evidence

- The matrix block `## 2026-10-03/04 sixth wave — walked on deployed SHA de09c6b806`
  in `docs/acceptance/signed-in-wave-acceptance-matrix.md`, which carries the
  ancestry table, both runtime reads, the verdict table and the stated limits.
- The append-only claim register entries for C-586 on branch
  `exec/queue-20261004T042206Z`, written through the repo-owned claim gate.
- The pull request and its required checks.

## Known Gaps

- **Five rows are blocked, by design of the walk's own boundary.** Two need a
  CSS viewport this session's browser cannot produce; three need a committed
  write — a charter repair cycle, a published synthetic NDA template, and a
  contact approval — which an unattended read-only walk must not perform.
- **One fence is proven on its permitted side only.** The lab-tenant fence was
  observed admitting the lab tenant; no refusal of a non-lab tenant was
  observed, and a fence is proven by its refusal.
- **`C-591` is filed, not fixed.** A capability with a working API and no client
  caller is recorded as a finding; deciding whether to mount it or retire it is
  a product call and is not taken here.
- **One observation is deliberately unattributed.** A stage-rail control did not
  respond to accessibility-reference clicks but did respond to a coordinate
  click. That is either an automation artifact or a hit-target defect; this walk
  did not separate the two and says so rather than filing a guess.
