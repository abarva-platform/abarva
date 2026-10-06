# 2026-09-29-t773-census-ranking-reads-triage-verdicts — Stop the stale-suite ranking offering files that already have a verdict

## Release ID

`2026-09-29-t773-census-ranking-reads-triage-verdicts`

## Status

`candidate`

## Plain-English Summary

The test CI coverage census ranks directories of tests that no CI job runs.
That ranking is the list the next stale-suite triage is drawn from. Until now it
ignored the repo's own triage records (`docs/architecture/*triage*.json`). A file
that had already been judged, with a written reason and a named owning item, was
still counted as "untriaged" and still pushed its directory up the ranking. The
ninth triage draw spent 11 of its 20 rows re-judging files like that.

The census now reads every triage record. For each file it takes the **latest**
verdict by `recordedAt`, and splits the untriaged files in two:

- **held**: the latest verdict names residual work that somebody owns. The file
  is no longer offered to a draw. It is listed in the new
  `triageVerdicts.heldTestPaths` with its verdict, record and owner, so the owed
  work stays visible.
- **drawable**: the file has no verdict, or a verdict the census contradicts, or
  a verdict word the census does not recognise. Only drawable files admit a
  directory to `governedRiskRanking`. Each ranked row now names them in
  `drawableTestPaths`.

`untriagedUnrunTestFiles` does not change. A verdict is a judgement, not a
command that runs the file, so the coverage arithmetic other gates read stays
where it was.

On `8b081b6050` this holds **69 of 277** untriaged files out of the draw. The
ranking drops from **165** to **146** directories. The six governed-risk rows
T-771 re-drew (ranks 1–6: one `critical`, five `high`) are exactly the ones that
leave.

## The decision the item asked to be written down

T-773 asked whether a `repair` or `rewrite_as_behavior` verdict should take a
file out of the ranking. **It does.** A draw exists to find files nobody has
judged. Re-offering a judged file gets a second verdict, not the repair, and the
item the verdict names already tracks the repair. An owned file is not a
finished file, so held files are published with their owner rather than dropped.

Three kinds of verdict do **not** hold a file:

- **Completion verdicts** on a file that still runs nowhere: `wired`,
  `rewritten_as_behavior_and_wired`, `already_selected_no_action` and
  `deleted_and_replaced`. The record says the work is done and the tree says
  otherwise. The file stays drawable and is listed in
  `triageVerdicts.contradictedVerdicts`. There are none today.
- **Unrecognised verdict words.** They cannot remove work from the queue. They
  are listed in `unrecognisedVerdicts`. There are none today.
- **A superseded verdict.** A newer record releases or re-holds a file. A record
  with no `recordedAt` sorts before every dated one, and on equal timestamps the
  later record file wins.

This decision is about what a measuring tool counts. It is not a product
decision, and it is written into the census's `method` array and the comment
above `triageVerdicts`.

## Layer Impact

**Release lane: `global-control-lane`.** Shared repo tooling, the same for every
client's build, with no feature gate.

- **Layer 4 (Products)**: no change. No route, component, adapter, projection,
  prompt or canonical object is touched.
- **Platform tooling / CI**: the census script's output gains fields and its
  ranking admits fewer rows. No workflow changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repo quality tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/test-ci-coverage-census.mjs`:
  - new exported `triageVerdicts(root)`;
  - per-file `triageVerdict` and `drawable`;
  - per-row `verdictHeldUntriagedUnrunTestFiles`, `drawableUnrunTestFiles` and
    `drawableTestPaths`;
  - ranking admission on `drawableUnrunTestFiles > 0`;
  - a new top-level `triageVerdicts` block with held/drawable totals, held
    counts by verdict, held paths, contradicted and unrecognised verdicts,
    verdicts naming no walked file (9 today) and unreadable records;
  - one new `method` sentence, and one corrected sentence that said every
    unclassified row is also ranked.

  The new totals are deliberately **not** added to `counts`. The committed
  census's `counts` keys are pinned to a fresh run's.
- `scripts/quality/triage-record-census-reconciliation.mjs`: header comment
  only. It said crediting verdicts would subtract queued work from the ranking.
  It now says what the census does instead.
- `src/__tests__/behaviors/t773-census-ranking-reads-triage-verdicts.test.ts`:
  new, 14 cases (8 on a fixture repo, 6 on the real tree).

**Not changed:** `docs/architecture/test-ci-coverage-census.json`. It was held by
a concurrent change when this was written. `--check` gates only the coverage
shape, and the shape is unchanged. The new fields reach the committed file on
its next `audit:test-ci-coverage:write`.

## QA / Validation

**Red first.** The new suite failed 14 of 14 on the base and passes 14 of 14
with the fix.

**The real-tree cases resolve verdicts independently of the census.** The test
reads the records itself and requires the two readings to agree file for file.
It also requires:

- held + drawable to equal `untriagedUnrunTestFiles` exactly, with no file in
  both;
- the T-771 known positives that are still unrun to be held;
- at least one file with no verdict to stay drawable.

It does not use a fixed floor of 69. That number drops whenever a held file is
wired, and a floor would go red when the work gets done.

**Mutations.** The census file's sha was checked on every run, and the good copy
was restored and re-hashed afterwards.

| Mutation | Failing of 14 |
|---|---|
| M1: admission back to `untriagedUnrunTestFiles > 0` | 2 |
| M2: earliest `recordedAt` wins instead of latest | 4 |
| M3: `repair` removed from the holding verdicts | 5 |
| M4: a contradicted verdict treated as held | 3 |

**Before/after over the same scope, from a separate clean worktree at base
`8b081b6050`:**

- `jest src/__tests__/behaviors`: **154 suites / 1671 tests / 0 failing** before,
  **155 / 1685 / 0** after. The difference is the new suite.
- `node --test scripts/quality/*.test.mjs`: 99 of 99 passing.
- `check-source-workspace-quarantine.mjs`: current.
- `audit:test-ci-coverage:check`: the coverage shape matches the committed
  census. The count drift (+1 test file, +1 covered) is report-only.
- `tsc --noEmit` exit 0, and `eslint` on the changed files exit 0.

## Rollout Plan

Merge to `main`. There is no runtime rollout: no image content a user reaches,
no migration, flag, environment variable or traffic change. The next draw from
the census ranking reads the new admission.

## Deployment Authority

Not required. Nothing a user reaches changes. The merge triggers the normal
repo-owned deploy, and that deploy serves no different behaviour.

- Repo-owned deploy workflow: triggered by merge as usual; not otherwise invoked
- Shared runtime mutators: none
- Approved image digest: whichever digest the post-merge run produces
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the pull request. The ranking goes back to admitting every untriaged
file, and the added fields disappear. Nothing persistent depends on them.

## Audit Evidence

- The mutation table and before/after counts above.
- Measured on the real tree at the branch head:
  - 277 untriaged, 69 held, 208 drawable;
  - held by verdict: `wire_into_ci` 41, `already_verdicted_elsewhere` 10,
    `rewrite_as_behavior` 7, `update_with_reason_recorded` 4, `repair` 3,
    `vacuous_control_proof` 3, `real` 1;
  - 0 contradicted, 0 unrecognised, 9 verdict paths naming no walked file,
    0 unreadable records.

## Known Gaps

- The committed census JSON has not been regenerated here. Until the next
  `--write`, anyone reading the file on disk, instead of running the script,
  sees the old ranking.
- `unclassifiedRiskDirectories` still comes from the whole untriaged pool.
  Changing it would change the coverage shape `--check` gates. So a directory
  whose every untriaged file is held can appear there without a ranked row.
  The method text says so.
- The 9 verdicts that name no walked file are reported, not resolved. Retiring
  them is a records clean-up for whoever owns each record.
