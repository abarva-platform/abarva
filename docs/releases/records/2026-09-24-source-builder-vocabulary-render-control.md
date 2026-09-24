# 2026-09-24-source-builder-vocabulary-render-control — Source surfaces: a builder-vocabulary control measured over rendered output

## Release ID

`2026-09-24-source-builder-vocabulary-render-control`

## Status

`candidate`

## Plain-English Summary

Two Source screens were showing internal storage keys to the person using them.
On the renewal screen, the vendor-email draft was labelled with the raw stored
value for the recommended posture (`decline_renewal`) instead of the wording the
product already publishes for that same value ("Decline renewal"), and a
paragraph explaining what the screen was about to save named the internal record
type (`tower_watch`) in code font. Both now read in the vocabulary the rest of
the screen uses.

The more useful half of this change is the control that found them. Previous
attempts at this class of defect scanned source files, which is wrong in both
directions: a string in a file no screen reaches is not a shipped defect, and a
term assembled at runtime never appears in the source to be scanned. The posture
label was exactly the second case — it is built from a variable, so no search of
the component would ever have shown it.

So the control renders the real components, clicks through the panels an
operator can open, and reads the text the browser actually produced. One of the
two defects is only visible that way.

## Layer Impact

Release lane: `global-control-lane`. The wording change is shared app behaviour
and is not feature-gated, so every client receives it on the next deploy.

- **Products (layer 4) — Source.** Two strings on mounted Source surfaces now
  use client-facing wording. No behaviour, data, or request changes.
- No change to client intake, source adapters, or the canonical model.

## Client Applicability

- All clients: yes — the wording change applies to every tenant that opens the
  renewal cockpit. It is cosmetic and carries no data or permission change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is small enough that a flag would add more risk
  than it removes.

## Changes Included

- `src/testing/source-builder-vocabulary.ts` — new. Defines the class of
  builder vocabulary once, for use against **rendered text**. Two rules:
  identifier shape (an internal underscore — no English word or product name has
  one) and the two phrases the Source master backlog names. Stage keys carry
  their canonical label, read from `SOURCE_STAGE_LABELS` rather than re-typed.
- `src/components/source/__tests__/source-builder-vocabulary-class.test.ts` —
  new. The class definition proved in both directions.
- `src/components/source/__tests__/source-surface-builder-vocabulary.test.tsx` —
  new. The control: renders three Source surfaces, drives them, scans output.
- `src/components/source/RenewalCockpitActionBar.tsx` — the two occurrences.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

**On where the detector lives.** It was first written under `src/lib/`, and
`audit:lib-orphans` refused it: nothing in the product calls it, so it was a
`src/lib` module reachable only from a test. The gate is right, and its baseline
would have accepted an entry. Adding one would have recorded the refusal as
normal. The module moved to `src/testing/` instead, which is what it actually
is. Both suites sit in `src/components/source/__tests__`, which
`source-component-suites.yml` runs wholesale — so the control is **wired**, not
merely present. An unwired suite is indistinguishable from no suite.

## QA / Validation

**Baseline over the same scope.** The three pre-existing suites covering the
touched components: `3 suites / 12 tests passed` before the change, and
`3 suites / 12 tests passed` after. Nothing was broken and nothing was relaxed —
none of them could see either defect, which is why this item exists.

**The new control against the unmodified component from `origin/main`:**
`1 of 25 failed`. The single failing case names both occurrences in its message,
because both render on the same surface. After the fix: `25 of 25 passed`.

**Mutation proofs — seven, re-run after the relocation, each verified to have
actually changed behaviour. Counts are over `src/components/source/__tests__`,
the directory CI runs: 132 of 132 pass at baseline.**

| # | Mutation | Result |
|---|---|---|
| 1 | Put the raw posture key back on the draft label | control fails, naming `decline_renewal` |
| 2 | Put `<code>tower_watch</code>` back in the prose | control fails, naming `tower_watch` |
| 3 | Blind the detector's identifier-shape rule | 7 fail — 6 detector cases **and** 1 control case |
| 4 | Remove the detector's false-positive guards | 2 cases fail — the filename and the address, i.e. the "must NOT be caught" direction |
| 5 | Turn the derived exemption into a blanket pass | 1 control case fails |
| 6 | Add an adjudication entry for a term that no longer renders | staleness check fails, naming the stale entry |
| 7 | Make a surface return no text | vacuity guard fails |

Mutation 3 is the one worth reading. On the first pass the control suite passed
under it — a blinded detector and a clean product look identical from outside,
so the suite would have gone green forever. A deliberately dirty surface was
added to the suite for exactly that reason, and mutation 3 now fails it.

Mutation 4 is U-400's explicit both-directions requirement, and it is the defect
item 39 already paid for once: a guard that rejects ordinary English costs more
than the term it catches, because the cost lands on whoever writes the
client-facing copy. Eight ordinary-copy cases are asserted to pass, including
hyphenated English, currency, dates, client filenames and addresses, and the
product's own agent name.

**CI-gate regressions found and fixed in this PR, both real:**
`audit:lib-orphans` (above) and the coverage-shape census. Both now pass locally.

**The census refresh is mostly not mine, and the record should say so.** The
committed census was measured on a pristine `origin/main` worktree at the same
commit this branch forks from: it was **already stale there by +4 test files
(+4 covered)**. This change contributes the other **+2**, both covered, and
**zero** uncovered — the earlier `+1 uncovered` disappeared when the detector's
suite moved into a directory a workflow runs. Quoting the full `+6` as this
change's footprint would have been wrong.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — exit `0`, no diagnostics. Judged on the exit code, since a
bare invocation exits `134` on this machine with no output.

**Lint:** `npx eslint` over the four changed paths — exit `0`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from
the merge commit. No migration, no flag, no job, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No deploy is performed by hand for this change.
- Shared runtime mutators: none. This release changes no env var, flag, scale
  setting, secret, or Container App template field.
- Approved image digest: whatever the main deploy workflow produces for the
  merge commit; it is digest-pinned by that workflow.
- ACA runtime invariant: to be proven after merge — the Container App template
  image, the 100%-traffic revision image, and the worker job images must all
  equal the deployed digest.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** Both changed strings are asserted on
  rendered output by the control in this PR, which runs in CI on every change.
  This record does not claim `live-proven`.

## Rollback Plan

Revert the merge commit. There is no migration, no data write, and no flag, so
the revert is complete on its own and the next deploy restores prior behaviour.
The two reverted strings would then be internal keys again, which is the state
`main` is in today — a cosmetic regression, not a functional one.

## Audit Evidence

- The PR, its diff, and its CI run.
- The mutation table above — each row is reproducible from the PR's files by
  making the stated edit and running the named suite.
- `src/components/source/__tests__/source-surface-builder-vocabulary.test.tsx`
  is itself the evidence that the two strings no longer render: it asserts over
  `container.textContent`, not over the source.

## Known Gaps

Stated plainly, because this item is a class and this change closes part of it.

1. **Three surfaces are covered, not all of Source.** There are 35 mounted
   Source route roots reaching 168 `.tsx` files. The control's surface table is
   explicit and is meant to be extended; it does not currently claim coverage it
   does not have.
2. **`camelCase` is deliberately outside the class.** Every camelCase token
   found in a rendered-text position across those 168 files was the product's
   own agent name, so including the shape would have bought no true positives
   and one false positive per screen. A camelCase key assembled at runtime would
   therefore pass. Nothing found one; nothing rules one out. The gap narrows by
   covering more surfaces, not by widening the shape rule and re-acquiring item
   39's defect.
3. **The stage front's field names were adjudicated and left.** Its "Parse:"
   line lists the columns a client's own extract must carry — an operator
   preparing that export needs the exact column name, not a paraphrase. Whether
   those should ever be reworded is a product decision, and U-400 says to
   surface such cases rather than guess. The exemption is derived from the
   canonical requirement set rather than typed out, so it cannot drift from the
   spec, and a term that is *not* one of those fields still fails.
4. No live signed-in run was performed, and none is claimed.
