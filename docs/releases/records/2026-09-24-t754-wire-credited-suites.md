# 2026-09-24-t754-wire-credited-suites — Wire five previously dark governed suites into a pull-request CI job

## Release ID

`2026-09-24-t754-wire-credited-suites`

## Status

`candidate`

## Plain-English Summary

Five automated test suites that check data-access and tenant-isolation behaviour were running
nowhere. They existed, they passed, and no continuous-integration job executed them, so if the code
under them broke, nothing would have said so. This change adds one job step that runs those five on
every pull request, and adds a control that fails if anyone removes or widens that step.

The item asked for eight suites. Five is the right number, and the correction is the substance of
this change rather than a footnote. Three of the eight are named in the quarantine list of a control
that already runs, `src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts`, which
asserts that no command in this workflow mentions them. The triage record that credited all eight
had not been reconciled against that control. Wiring all eight turns the older control red, and the
only way to make it green again would be to delete a quarantine so that a new step could pass —
which is the exact defect this backlog exists to prevent. So three are withheld, each with its
reason re-measured rather than repeated, and the withholding is enforced by a test instead of being
written down.

Two of those three reasons are "no code outside the test imports the module", and that was
re-measured with the coverage census's own import parser: both subject modules have zero non-test
importers today. Running them would add a number to a coverage report without covering anything a
user's request reaches. The third is withheld because its stated reason — its fixture cannot
reproduce the identity split the suite claims to cover — has not been discharged by anyone.

## Layer Impact

**Release lane: `global-control-lane`.** The change is shared continuous-integration behaviour for
all clients and is not feature-gated, but it is confined to what CI executes: it ships no runtime
code and no product behaviour, so no client sees any difference in the product.

- **Layer 4 — Products:** none. No product route, surface, read model, or rendered output changes.
- **Platform / CI tooling:** one added step in an existing pull-request job, one added behavioural
  control, one lowered ratchet constant with its reason recorded, and a refreshed coverage census
  artifact.

No canonical model, adapter, intake tab, or tenant dataset is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — continuous-integration scope only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one new step, `Run the five suites T-475 credited that no
  earlier record holds`, naming five test paths with `--runTestsByPath`. Named file by file rather
  than by directory: four of the twelve suites the triage record drew are held open by other items,
  two of them share a directory with a credited sibling, and one of those is red. A directory sweep
  would run them silently.
- `src/__tests__/behaviors/t754-credited-suite-wiring.test.ts` — new control. Reads the partition
  from the triage record at run time rather than a copied list, asserts each wired suite is named by
  its exact path in a pull-request-reachable command, asserts each withheld and each held suite is
  still reached by nothing, checks each withheld reason still holds, and measures the step's worth
  with the mutation the item names.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — the dark-product-directory
  ratchet lowered from 172 to 171 with a dated reason, which is the protocol its own header states.
  The assertion stays an equality: a new dark directory still fails it.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**The item was re-verified on current `main` before a line was written.** At `2f6cac9d5`, all twelve
paths the triage record drew are reported by the census as files no workflow runs — including the
four this change deliberately leaves alone. The five wired here were then run as one jest process,
which is what the CI step does and is not the same evidence as running them one at a time: 5 suites
/ 18 tests, 0 failures.

**Red first.** With the control written and the workflow step absent, the control failed 17 of 22
cases. The 5 that passed were the partition case and the four cases asserting the held suites are
out — which is the correct shape for a control whose negatives are already satisfied at base.

**The mutation the item names, measured in two independent places.** The control performs it itself,
against a scratch root that holds the real workflow file and nothing but the twelve subject paths,
so the number is attributable to this step and not to some other workflow that happens to reach the
same file. It refuses to believe the result unless the step matched exactly once and the replacement
actually changed the file's bytes — a no-op mutation reads exactly like a caught one. Independently,
over the real repository:

| census counts | step present | step replaced by `echo skipped` | delta |
|---|---|---|---|
| run by a workflow | 1971 | 1966 | **−5** |
| run by no workflow | 451 | 456 | +5 |
| run by no workflow, untriaged | 402 | 407 | +5 |

**Six mutations of the control, five caught and one required to stay green.** Each applied to a copy
of the workflow, with the file restored and its sha256 verified byte-identical afterwards.

| # | mutation | control result |
|---|---|---|
| M0 | the step's `run:` replaced by `echo skipped` | 11 failed / 11 passed |
| M1 | widened to a directory sweep over the two parents | 5 failed / 17 passed |
| M2 | one credited path dropped from the list | 3 failed / 19 passed |
| M3 | a withheld path added to the list | 2 failed / 20 passed |
| M4 | a held path added to the list | 2 failed / 20 passed |
| M5 | two paths reordered — **must stay green** | 22 passed |

M1 is the one that matters most: the item's acceptance warns against widening to a sweep, and M1 is
what makes that warning executable. M5 is what shows the control is about the mechanism rather than
a pinned string order.

**Scope baseline, measured on a separate worktree checked out at `origin/main` rather than
asserted**, same scope both sides, `npx jest src/__tests__/behaviors --no-coverage --ci`:

- before: 116 suites, **0 failing**, 1056 tests
- after: 117 suites, **0 failing**, 1078 tests

Two controls went red in the middle of this work and both are reported rather than folded in. The
first is the quarantine collision described above, which changed what this release does. The second
is the dark-directory ratchet, which is an equality assertion whose header says to lower it when a
directory is wired: `src/lib/source/candidate-suppliers/__tests__` went from 0 of 3 covered to 3 of
3. One, not two — `src/lib/data-plane/__tests__` was already 1 of 3 and moved out of the *partial*
set without changing the dark count, which is the same case the constant's own note already records
for an earlier change.

**Toolchain.** `tsc --noEmit --pretty false` exit 0, judged by the exit code after removing
`tsconfig.tsbuildinfo`, with zero diagnostic lines. `eslint` exit 0 on both changed source files.
`release-check` passed.

**Census refresh attribution, stated because the diff is larger than this change.** The committed
census was already stale at `2f6cac9d5`: it read 2409 test files and 1954 covered against 2421 and
1965 measured. Of the refreshed file's movement, that drift predates this change; this change
contributes +1 test file (the new control, which is itself covered) and +5 covered.

## Known Gaps

**Three of the eight suites the item named are still reached by nothing**, and this change
deliberately leaves them that way. `contract-intelligence/prompt.test.ts` and
`provenance.test.ts` cover modules with zero non-test importers, so running them would credit
coverage over code no product path reaches; `contract-evidence/read-model.test.ts` is held because
its fixture carries no register contract identity and so cannot reproduce the identity split it
reads as covering. Each is withheld against a check that fails the day its reason stops holding,
which is the most this change can honestly do about them.

**No follow-on item is filed for those three**, because the Claude Code `T-500`–`T-599` identifier
band is exhausted — 0 of 100 free — and the generated queue marks that a range decision rather than
a reading. Taking the next number would collide with one already spent. The recommendation is in the
execution pulse.

**The step names files, so it does not adopt new siblings.** A suite added to
`src/lib/data-plane/__tests__` or `src/lib/source/candidate-suppliers/__tests__` tomorrow will not
run here. That is the correct trade only while the held items are open; when they close the right
repair is to collapse the list into its parents, and the new control fails if that happens without
them.

**The census refresh absorbs drift this change did not cause.** The attribution is stated under QA,
but the committed artifact now differs from `main` by more than these five files, and a reader
comparing the diff to the claim should read that paragraph first.

**Not deployed and not live-proven at the time of writing.** The runtime invariant will be proven
from the deploy run's own artifact after merge and appended to the register, never restamped over
this record.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow runs on merge as it does for
every change. Nothing here alters a runtime image, an environment variable, a flag, or traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is run by hand for this change.
- Approved image digest: whatever the main deploy workflow builds from the merge commit.
- ACA runtime invariant: to be proven from the deploy run's own `runtime-invariant-proof.json`
  artifact after merge, and appended to the register rather than asserted here.
- Worker image invariant: same source, same artifact.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and none is claimed.** Nothing under `src/app` imports the
  changed files; they are loaded by Jest and by GitHub Actions. There is no product surface whose
  behaviour this could change, so a signed-in acceptance would be a proof with no subject.

## Rollback Plan

Revert the commit. The step and the control are additive and the ratchet constant returns to 172
with the revert. No migration, no data change, nothing to unwind in a runtime.

## Audit Evidence

- The pull request and its check run.
- `src/__tests__/behaviors/t754-credited-suite-wiring.test.ts` — the control, which performs the
  item's own acceptance mutation on every run rather than relying on this document's record of it.
- `docs/architecture/t475-stale-suite-triage.json` — the record this change reads its list from.
- `src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts` — the earlier control whose
  quarantine list is the reason three suites are withheld.
- The census before and after, reproducible with `npm run audit:test-ci-coverage`.

## Follow-on, not done here

The three withheld suites need an item of their own, and this change does not file one: the Claude
Code `T-500`–`T-599` band reads 0 of 100 free in the generated queue, which the queue itself marks
as needing a range decision rather than a careful reading. Taking the next number would collide with
one already spent. The recommendation is recorded in the execution pulse. In the meantime the
withholding is not merely narrated — two of the three reasons are asserted as measurements that go
red the day a product path imports the module, and the third is tied to the sibling control's
quarantine list, so removing it there fails here.
