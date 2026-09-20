# 2026-09-20-brand-c4-declared-not-asserted — A retirement credited to a wave that never did it

## Release ID

`2026-09-20-brand-c4-declared-not-asserted`

## Status

`candidate`

## Plain-English Summary

A brand-enforcement check reported `src/components/chrome/TopBar.tsx` as **"correctly
absent — retired in Wave 29 SHELL8"**, status `pass`.

Re-measured with `git log origin/main --diff-filter=AD`, **no commit on this history has
ever added or removed that path.** No wave retired it. The attribution had nothing behind
it, and the file's absence was being read as a completed piece of work rather than as a
question nobody had answered.

The check now takes its answer from `BRAND_PATH_REGISTER`, like the ten paths beside it,
and the path is declared **`undecided` with an owning item** — not `retired`. There is no
commit to name, and inventing one is the defect, not the fix for it.

## Layer Impact

- `global-control-lane`. One QA module and one QA suite. No product surface, tenant data,
  schema, projection, migration, or runtime behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes — QA reporting
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/qa/logo-usage-enforcement.ts` — `src/components/chrome/TopBar.tsx` declared
  `undecided` in `BRAND_PATH_REGISTER`; `BRAND2-C4` resolves through `resolvePathStatus`
  instead of a hand-written sentence.
- `src/__tests__/integration/qa/shell8-legacy-retirement.test.ts` — the two downstream
  assertions that held the invented attribution in place are replaced by three that check
  what was measured.

## QA / Validation

| What | Result |
|---|---|
| The two affected suites | **24 passed, 4 failed** — the same 4 failing before this change |
| Quarantine checker | clean at 3 of 39; each excluded suite still fails for its recorded reason (T-502, T-504) |
| `tsc --noEmit` | exit 0 |
| `eslint` | exit 0 |
| Mutation harness, two directions | **5 mutations, 5 caught, 0 survived** |

Baseline measured before the change, not assumed: **4 pre-existing failures** across the two
suites. After the change, the same 4. Net **+1 passing case**, no new failures.

Direction 1 brings the invented attribution back: restoring the hand-written SHELL8 sentence,
and disabling the register entry so the path resolves as undeclared. Direction 2 hollows out
the replacement: stripping the owner, hardcoding a `pass`, and dropping the resolver's detail.

### The downstream assertions were part of the defect

`shell8-legacy-retirement` asserted `BRAND2-C4.description` contains `SHELL8` and that its
status is `pass`. Those cases are why the false claim was stable: the check printed the
attribution, and the suite checked that it kept printing it. They are replaced by three
cases that assert the opposite where the opposite is true — the description must **not**
credit SHELL8, the detail must say no commit added or removed the path and must name the
owning item, and a third that contrasts the two dispositions.

### A case I wrote wrong, and corrected rather than forced

The third case first asserted that the path returning would be a **failure** — which is what
a `retired` entry does. It is not what `undecided` does, and the case failed. The
expectation was wrong, not the code: `retired` asserts the file should be gone, so its
return is a contradiction; `undecided` asserts only that nobody has ruled, so the file
appearing is simply a file appearing. Claiming otherwise would have reintroduced invented
certainty in the opposite direction. The case now states that distinction and checks it
against a genuinely retired path in the same register, so it is a claim about the two
dispositions rather than about one entry.

### A harness correction

The harness asserted a baseline of 4 failures and aborted: this suite alone carries **2**;
the other two are in the sibling suite. The count was wrong in the harness, not in the tree.
Scoring against a baseline that was never checked is how a total masking once read as
"nothing catches it", so the assertion stays.

## Rollout Plan

Merge to `main`. No runtime rollout.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. No data, migration, or runtime state. Reverting restores a check that credits
a wave with a retirement it cannot be shown to have performed.

## Audit Evidence

- The PR diff.
- `git log origin/main --diff-filter=AD -- src/components/chrome/TopBar.tsx` returning nothing.
- The five mutation results and the before/after failure counts.

## Known Gaps

- **Whether a chrome TopBar should exist is still open**, which is the honest state and the
  reason the disposition is `undecided`. It is a shell question, not a brand one, and the
  register names the item that owns it.
- **Four failures remain in these two suites and are left red.** Two belong to the brand-asset
  item that owns the quarantine entry; two are SHELL8 rows that were failing before this
  change and are outside its subject. Neither was weakened to make anything green.
- The path sits in neither `RETIRED_ROOT_LOGO_ASSETS` nor `RETIRED_TOPBAR_VARIANTS`, so no
  brand decision covers it. That is unchanged here.
