# 2026-09-23-integration-root-quarantine — Declare and gate the integration-root CI carve-out

## Release ID

`2026-09-23-integration-root-quarantine`

## Status

`candidate`

## Plain-English Summary

Test files that sit at the top level of `src/__tests__/integration` are listed in the CI
workflow one at a time, by exact path. That was a deliberate choice — naming the directory
instead would also drag in every red subdirectory beneath it — but it has a consequence
nobody guarded: for this one directory the default is **excluded**. A file that nobody
remembers to add to the list is simply never run, and nothing anywhere says so.

The only record of the carve-out was a comment in the workflow noting that a number of
root files "are still red and stay out of the green job". A comment that counts exclusions
cannot fail. Measured on `main` today, five root-level files were unrun and had no triage
recorded against them anywhere. All five are red: 13 failing cases out of 28.

Four are stale — they assert contracts that legitimately moved, and each now carries the
specific assertion to rewrite. **The fifth is not stale.** It is the only thing in the
repository that catches a live defect: a shared answer-shaping helper is compacting a
three-option recommendation down to the first option and one bullet, so the second and
third recommendations and the closing guidance never reach the reader. That suite was
written precisely to prevent this, states so in its own comment, and has been unable to
report anything because nothing ran it.

This change does not repair the five suites. It makes the carve-out something that can
fail. Every excluded root file is now declared with the case it fails on, a reason in
plain English, an owning backlog item and a triage verdict of `update`, `delete` or `real`,
and a check runs on every pull request that fails three ways the comment could not:

- a root-level file that no workflow runs and that nobody declared;
- a declared file that has been wired back in but left on the list;
- a declared suite that **passes** when re-run, meaning its reason has expired.

The check does not re-read the workflow command to decide what runs. It asks the existing
test-coverage census, which already resolves package scripts, jest invocations, ignore
arguments and directory-regex collisions — the last of these matters, because a jest
argument naming a directory is a regex that also selects root files whose names begin with
the same characters. Two audits asking the same question must not be able to disagree
about the answer.

## Layer Impact

Release lane: `global-control-lane` — shared repository CI tooling, applying to every
client's pull requests equally and behind no feature gate. It is not `client-data-lane`:
no tenant-scoped schema, seed, ingestion, retrieval or private data-plane behaviour is
touched.

- **Layer 4 — Products:** none. No product surface, route, component or API changes.
- **Tests, validators and CI tooling:** one new check, one new declaration file, one new
  workflow step, one new package script. The check is additive: it can newly fail a pull
  request that lets a root-level integration suite drift out of CI, and it fails today's
  tree only if someone removes an entry without wiring the file back in.

No canonical model, adapter, loader, tenant data, migration, auth, RLS or security setting
is touched.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — repository CI tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/quality/check-integration-root-quarantine.mjs` — new. Exports
  `evaluateRootQuarantine` as a pure function over plain data so the cases can drive every
  branch without a repository, a workflow file or a jest run.
- `scripts/quality/check-integration-root-quarantine.test.mjs` — new. 23 cases.
- `scripts/quality/integration-root-quarantine.json` — new. The five declarations, each
  with `suite`, `failingCase`, `reason`, `owner` and `verdict`.
- `.github/workflows/integration-suites.yml` — new step, plus a note recording why the
  comment it replaces was not a control.
- `package.json` — `check:integration-root-quarantine`, which runs the cases and then the
  check with `--rerun`, matching the sibling quarantine scripts.

The five suites themselves are **unchanged**. Repairing them is follow-on work under the
owning items, and bundling five unrelated surface rewrites into the change that declares
them is the large-diff failure this backlog exists to refuse.

## QA / Validation

Baseline and result measured over the same scope, on `origin/main` `5566a8df0`.

**The five suites, before and after this change:** 13 failing / 15 passing of 28, both
times. Nothing in this change repairs or weakens them, and the identical numbers are the
evidence for that.

**New cases:** 0 passing / 1 failing before the implementation existed (module not found),
23 passing / 0 failing after.

**Mutation — every control in the checker was broken deliberately and the cases were
re-run. All seven were caught:**

| mutation | result |
|---|---|
| drift check removed (unrun file with no entry) | 21 pass / **2 fail** |
| stale-entry check removed (entry now run by a workflow) | 21 pass / **2 fail** |
| verdict enum check removed | 22 pass / **1 fail** |
| ratchet's under-ceiling direction removed | 22 pass / **1 fail** |
| missing-file check removed | 22 pass / **1 fail** |
| blank strings accepted as filled fields | 18 pass / **5 fail** |
| duplicate-suite check removed | 22 pass / **1 fail** |

Restored: 23 pass / 0 fail.

**Proved on the real tree, not only on fixtures** — the three directions that matter were
each triggered against the actual repository and then reverted:

1. Removing one entry from the declaration: exit 1, naming the now-undeclared file, and
   separately reporting the ceiling headroom it created.
2. Adding a genuinely new unwired root-level test file — the exact defect this exists to
   catch: exit 1, naming that file.
3. Making one quarantined suite pass by correcting the magnitude it pins: exit 1 under
   `--rerun`, reporting that the entry's reason has expired.

With the tree restored, the check exits 0 and `--rerun` re-runs all five and confirms every
recorded reason is still live.

**Other gates:** `npx tsc --noEmit --pretty false` exit **0**, judged on the exit code and
with zero diagnostics emitted. `npx eslint` on both new scripts exit **0**. The coverage
census reports no drift against its committed copy. `test:integration:ci-visibility` exit
**0**.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/` changes, no image is rebuilt for
this and no Azure Container Apps revision is affected. The check becomes active on the next
pull request that runs the Integration suites workflow.

## Deployment Authority

- Repo-owned deploy workflow: not exercised by this change
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: not applicable
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and structurally rather than as a deferral —
  nothing under `src/` is modified, so no signed-in surface can observe this change

## Rollback Plan

Revert the commit. The check and its declaration are self-contained; removing them returns
the workflow to enumerating root files with no guard. No migration, no data change, no
runtime state to unwind.

## Audit Evidence

- The pull request and its CI run.
- `npm run check:integration-root-quarantine` output, which names the count of excluded
  suites and the split across verdicts.
- `scripts/quality/integration-root-quarantine.json` — the five reasons, owners and
  verdicts, each naming the specific case it is excluded for.
- The mutation table above is reproducible: break any single control in the checker and
  re-run the cases.

## Known Gaps

- **The five suites are still red and still out of CI.** That is the declared state, not an
  oversight, and the check fails the moment one of them starts passing without being wired
  back in. Four need their assertions rewritten to the contracts that actually hold; that
  work is owned by backlog item 26 and is not done here.
- **The live defect found by the fifth suite is not fixed.** It is filed as `C-502` against
  the shared answer-shaping helper, with the failing case recorded. Which commit introduced
  it is **not** established: the module's exports moved in the interim, so the suite does
  not load against either earlier copy of the helper, and no attribution is claimed.
- The check covers the **root level** of `src/__tests__/integration` only. Sibling
  directories are guarded by their own lists. The wider census still reports 435 untriaged
  unrun test files across the tree; this change closes the highest governed-risk five and
  the structural hole that let them hide, not the backlog behind them.
- The marketing-nav triage surfaced a second finding recorded in the declaration but not
  acted on here: the dropdown and mobile-section components in that file are still present
  but no prop can supply them with groups, so the hover, keyboard and dismissal behaviour
  they implement is unreachable through the exported component.
