# 2026-09-26-catalog-deferred-claim-surface-join — Every control-catalog claim now names its join

## Release ID

`2026-09-26-catalog-deferred-claim-surface-join`

## Status

`candidate`

## Plain-English Summary

`docs/security/ai-surface-control-catalog.json` is the machine-readable answer to "which AI
control is proven on which surface". Each row of `catalogClaimCoverage` is a claim taken from a
legal catalog, and `surfaceId` is the field that joins that claim to a catalogued surface.

`surfaceId` was required of `covered` rows and of nothing else. Measured rather than sampled: of
the 37 rows, **18 are `covered` and all 18 carry `surfaceId`; 19 are `deferred` and 0 of 19 carry
it.** The field was present on exactly the rows that did not need it. Any validator walking
`surfaceId` to join a claim to its surface silently skipped every deferral — and a deferral is
precisely the row that should be re-checked. Several deferral reasons say the deferral exists
because a component *was retired* and the surface *needs re-cataloguing*, so the moment a
replacement surface is pinned, nothing connected it back to the row waiting for it. An exemption
that cannot go stale outlives the defect it was written for.

The obvious repair — give each deferred row a `surfaceId` — was measured first and does not work.
**Zero of the 19 resolve to exactly one catalogued surface.** A resolved-or-retired split would
therefore have been a fiction, and would have buried the case that is actually work. Resolving
each row's declared code paths against `controls[]` and against the tree gives three states:

| state | rows | what it means |
|---|---|---|
| `retired` | 4 | No declared code path is in the tree. The surface is gone; this is history. |
| `uncatalogued` | 13 | A declared code path **is** in the tree and no `controls[]` entry names it. The surface is live and nobody catalogued it. This is work. |
| `ambiguous` | 2 | More than one `controls[]` entry names the row's code paths, so naming one would be false precision. Both are listed. |

Every row now names a join: a `surfaceId` present in `controls[]`, or a `surfaceJoin` whose state
is **re-measured against the repository on every CI run**. Restore a retired component and
`retired` goes red. Catalogue a live one in `controls[]` and `uncatalogued` goes red naming the
`surfaceId` the row must now carry. The exemption has to keep asserting that its own defect still
exists.

The resolver is not invented for the deferrals. Run over the 18 `covered` rows it reproduces all
18 hand-written joins — 18 agree, 0 disagree, 0 unmatched — which is why it is trusted to judge
the other 19. That check runs in the suite, so it cannot quietly stop being true.

## Layer Impact

Release lane: `internal-admin`. This is an AbarVa-only audit document and the CI gate that reads
it; no client-visible behaviour ships with it.

- **Layer 4 — Products:** none. No route, component, product surface or tenant read path changes.
- **Governance/control plane:** the CI gate `npm run audit:ai-surface-controls` gains a per-row
  join rule, and the catalog document gains a `surfaceJoin` field on the 19 unbound rows.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — an audit document and the CI gate that reads it
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/security/ai-surface-control-catalog.json` — `surfaceJoin` added to the 19 deferred rows
  (4 `retired`, 13 `uncatalogued`, 2 `ambiguous` with both candidates listed). No `covered` row
  changed.
- `scripts/audit/ai-surface-control-catalog.mjs` — the legal-catalog claim parser now carries the
  `Code path` column through as `codePaths`; `resolveClaimJoin` measures the join from
  `controls[]` and the tree; `validateClaimJoin` requires every row to name one and checks a
  declared `surfaceJoin` against that measurement. A `surfaceId` must also now be one of the
  `controls[]` entries naming the claim's code paths — true of 18 of 18 today.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — per-row assertions over the real file
  and eight red/green cases against the gate.

The suite's old assertion *"permits an unbound legal claim only while it remains explicitly
deferred"* was the permission that let 19 rows omit the join indefinitely. It is replaced, not
deleted: deferral is still allowed, omitting the join is not.

## QA / Validation

**Red first, measured in a separate clean detached worktree at `origin/main`, not by stashing.**
Baseline worktree at `2e91a64ec`; the suite alone, with only the test file added and no fix:
**46 failed / 24 passed of 70.** After the fix: **72 passed / 0 failed of 72.** The count differs
because an `it.each` over the ambiguous rows had an empty table before the repair.

**Twelve mutations, one at a time, each proven to change the file by `sha256` before and after.**
Ten were caught on the first attempt. **Two survived, and both were real holes in the suite rather
than noise** — they are recorded here rather than smoothed over:

- *never detect the `resolved` state* survived because the test asserted only that the surviving
  control id appeared somewhere in the output, and a generic state-mismatch message names it too
  in its evidence clause. The assertion now names the rule that must fire, not just an id that
  happens to appear. A redundant-looking pass was a second guard absorbing the mutation.
- *allow `candidateSurfaceIds` on a non-ambiguous join* survived because nothing proved that rule
  at all. A case was added. After both repairs: **12 of 12 caught, 0 surviving.**

One further edit was attempted and correctly reported as **NO-OP-DIGEST** — the harness refuses to
score a mutation whose bytes did not change, because a no-op reads exactly like a catch.

**The self-invalidation direction, which is the whole point, proven by execution rather than
argued.** `src/components/intelligence/SynthesisOutput.tsx` was recreated in the tree and the gate
went red on its own row:

```
- generated-ui|Intelligence|Atlas synthesis answer|citation: surfaceJoin.state says retired;
  the repository says uncatalogued (code paths src/components/intelligence/SynthesisOutput.tsx;
  in the tree: src/components/intelligence/SynthesisOutput.tsx; controls[] entries naming them: none)
```

The file was removed again and the tree confirmed clean. Note what that red means: the gate is
**not** asking for the improvement to be reverted, it is refusing to let the exemption stand
unexamined once its premise changed. That is the opposite of a gate that inverts when the corpus
improves.

**Wider regression, same scope both sides.** Baseline at `2e91a64ec`: 143 suites / 1456 tests / 0
failing. After: 143 suites / 1525 tests / 0 failing. The `+69` reconciles exactly to this one
suite going from 3 tests to 72; no suite was added or removed, and no other suite's count moved.

- `node scripts/audit/ai-surface-control-catalog.mjs` — passes (21 surfaces, 40 declared controls).
  The coverage figures it prints are unchanged by this release.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit code judged.
- `npx eslint` over the changed files.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow will build and deploy as usual; nothing in
this change is reachable at runtime, so there is no behavioural rollout to stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by hand for this release.
- Approved image digest: whatever the main deploy workflow produces for the merge commit.
- ACA runtime invariant: to be verified after merge — Container App template image, the
  100%-traffic revision image, and both governed delivery worker job images must equal the same
  digest.
- Worker image invariant: as above; unchanged by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This changes an audit document, a CI gate script and a
  behavioural test. It reaches no route, no rendered component and no tenant data. The statement
  is scoped deliberately: `deployed` may be claimed once the digest matches; `live-proven` is not
  claimed and is not owed.

## Rollback Plan

Revert the single squash commit. There is no migration, no data write and no runtime state, so a
revert is complete. The only consequence of a revert is that the 19 deferrals return to being
unjoinable.

## Audit Evidence

- PR URL and CI run for this branch.
- The audit gate output on the real catalog (passing) and on each of the eight mutated fixtures
  (red, each naming the offending row's `key`), reproducible with
  `npx jest --runTestsByPath src/__tests__/behaviors/catalog-claim-binding.test.ts`.
- The before/after split recorded as an assertion — `18 covered with surfaceId / 19 deferred with
  a join / 0 unbound` — so a later change to that split is visible as a failing test rather than
  as a number nobody measured.

## Known Gaps

- **The 13 `uncatalogued` rows are the work this makes visible, not work this does.** Each names a
  live surface that `controls[]` has never catalogued. Cataloguing them means declaring
  `requiredControls`, evidence tokens and a behavioural test per surface, which is a control
  decision per surface and not a mechanical edit. This release makes each one say so in a field a
  validator can read, and makes the gate demand the `surfaceId` the moment the surface is
  catalogued. Filed as a follow-up item rather than done here.
- The 2 `ambiguous` rows stay ambiguous. Splitting the legal-catalog row "Phase advance / gate
  approval UI" into the two surfaces that implement it is a catalogue-authoring decision.
- This asserts nothing about whether any component *renders* a control. The
  `behavioralTest.status: "none"` rows on the unmounted pressure brief are untouched and are held
  by other items.
