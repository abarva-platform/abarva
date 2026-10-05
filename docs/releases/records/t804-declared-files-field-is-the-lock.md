# 2026-10-05-t804-declared-files-field-is-the-lock — the pre-claim gate stops locking paths named in prose

## Release ID

`2026-10-05-t804-declared-files-field-is-the-lock`

## Status

`candidate`

## Plain-English Summary

Agents coordinate work by appending a claim line to an operator register. Each line declares a
`files:` list — the files that run intends to touch — and for three hours no other run may take
those files.

The reader that enforces this scanned the **whole line** for anything that looked like a repo
path, not just the declared list. So a claim line that *mentioned* a file in its explanatory
prose locked that file too. The effect is perverse: a run that writes down why it passed an item
over, naming the file somebody else had locked, thereby locks that file itself, under its own
name, for three hours. The more carefully a run documents a refusal, the more of the tree it
freezes.

Three such accidental locks were recorded on 2026-10-05, two of which refused a correct claim and
cost a lane its chosen row. One of them was a plain explanatory sentence — "this function is
rooted at `src`, so a test under `scripts/` is invisible to it" — which disclaims nothing at all.

This change makes the rule structural instead of interpretive: **when a line declares a `files:`
list, that list is the whole of its lock, and prose on that line locks nothing.** Nothing reads
the surrounding sentence any more. A line that declares no list is left exactly as it was.

## Layer Impact

Not a product data layer. This is platform/execution tooling (lane T): the pre-claim ownership
gate under `scripts/exec/`, which coordinates agent runs. No tenant data, no canonical model, no
product surface, no runtime code path, no migration.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — agent execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `claimedPaths` now dispatches on whether the line
  declares a `files:` list. New exported `declaredFileList(text)` returns that list (or `null`
  when there is no declaration); the previous whole-line reader is unchanged and now runs under
  the name `pathsNamedAnywhere`, reached only when no list is declared.
- `scripts/exec/register-time-authority.test.mjs` — nine cases: two known positives taken from
  the real 2026-10-05 lines, their negative controls, the last-label rule, the empty-declaration
  rule, the named residual, and both directions measured through the CLI gate rather than on the
  predicate.
- `docs/releases/records/t804-declared-files-field-is-the-lock.md` — this record.

## QA / Validation

Baseline and result over the same scope — `node scripts/exec/register-time-authority.test.mjs`:

| | result |
|---|---|
| clean `origin/main`, suite as shipped | 354 passed, 0 failed |
| new cases added, fix NOT applied | 358 passed, **5 failed** |
| new cases added, fix applied | **363 passed, 0 failed** |

So the nine cases are five discriminators and four controls, and every discriminator fails
without the fix.

**Mutation — each guard proven able to fail.** Five mutations of the shipped fix, each run
against the full suite:

| # | mutation | failures |
|---|---|---|
| 1 | remove the dispatch entirely (whole-line reading restored) | 5 |
| 2 | a declared list returns no paths | 32 |
| 3 | anchor on the FIRST `files:` label instead of the last | 1 |
| 4 | an empty declaration falls back to prose | 1 |
| 5 | declared list UNION prose | 5 |

Mutation 2 is the one that matters for the acceptance's "a path genuinely on the list must still
lock": it fails 32 cases — 4 of this item's own and 28 written by earlier items, including every
case that asserts a declared list refuses a second run.

**Sibling suites, all green under the fix** (each consumes `claimedPaths` or `heldPaths`):
`append-claim` 94/0, `build-execution-queue` 229/0, `queue-provenance` 30/0, `fossil-claims`
91/0, `register-citation-check` 22/0, `register-merge-coverage` 53/0.

**Verdict change on the live register, measured in both directions** by running the shipped
reader and the new one over every parsed line of `EXECUTION_CLAIMS.md`:

| | count |
|---|---|
| lines whose set of held paths changes | 166 |
| holds **freed** | 278 — of which 203 are `file`-kind locks, 75 `scope`-kind notes |
| holds **newly created** | **0** |

Zero in both the file and scope kinds. Every path on a declared list was already being held, so
making the field authoritative strips no line of authority it was exercising.

**Why the declaration is safe to treat as mandatory**, measured rather than assumed: of the 709
claim-shaped lines in the register that hold at least one path, **697 declare a `files:` list**
and 12 do not. The field is not optional in practice, which is what makes it safe to make it
authoritative. The 12 are named rather than waved at: they are unchanged by this release and go
on reading their prose, because a line with no declaration has nothing to be authoritative.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by the application, shipped in the
container image, or reachable from a product route. The control runs in CI
(`execution-queue-toolchain.yml`) and from agents' own checkouts.

## Deployment Authority

Not required — this release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — there is no product surface to sign in to

## Rollback Plan

Revert the commit. The control is stateless and reads documents it does not write, so reverting
restores the previous reading on the next invocation with no migration, no backfill and no
re-stamping of the register. Holds freed while the fix was live simply return.

## Audit Evidence

- The pull request and its diff.
- The CI run of `execution-queue-toolchain.yml`, which executes
  `node scripts/exec/register-time-authority.test.mjs` on every push.
- The two known positives are embedded in the suite verbatim (less their length), so the evidence
  is executable rather than narrated — a reader can run the suite and watch the defect reproduce
  by reverting the dispatch.

## Known Gaps

**A line that declares no `files:` list is unchanged, and still reads its prose.** This is
deliberate and measured: 170 path-holding lines that are not claim openings carry no
declaration, nearly all of them `AMEND` lines that extend an earlier claim by naming a file in a
sentence and mean to hold it, plus the 12 claim lines above. Freeing those would put two runs on one file — a false pass — whereas the failure this
change repairs costs one refusal that names itself. The module's standing preference is the
hold-preserving one. Closing the gap properly means requiring the field on every line that means
to hold something, which is a protocol change, not a reader change. The residual is pinned by a
test so it cannot be lost silently.

**A second, latent defect found while measuring and NOT fixed here.** A declared path containing
square brackets — Next.js dynamic segments such as
`src/app/api/v1/source/[eventId]/nda/esign/send/route.ts` — is invisible to the path tokenizer,
whose character class excludes `[` and `]`. Measured across the register, 289 declared paths are
in that shape and hold nothing today, on either the old reading or the new one. That is a false
PASS in the opposite direction from this item's, it is older than this item, and it is bigger:
two runs can already hold one dynamic route file. It wants its own item and its own measurement.
It could not be filed as one in this run because the `T-400`–`T-499` and `T-500`–`T-599` bands
both report 0 of 100 free and the `T-600`–`T-699` band belongs to the other lane — the band
decision this backlog records as owed.
