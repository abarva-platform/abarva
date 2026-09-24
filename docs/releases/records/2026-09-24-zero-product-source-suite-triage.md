# 2026-09-24-zero-product-source-suite-triage — Triage of the six test directories the coverage census cannot rank

## Release ID

`2026-09-24-zero-product-source-suite-triage`

## Status

`candidate`

## Plain-English Summary

The repository keeps a census of which test suites are actually executed by a CI
job, and ranks the unexecuted ones by how much governed behaviour they touch, so
that the riskiest gaps get repaired first. That ranking is derived from the
product code a suite imports. A change merged earlier today published, for the
first time, how many product sources each unranked directory resolves — and six
of them resolve none.

This change triages those six. They are one test file each, and the reason they
resolve nothing is the same in all six cases: every one of them proves its
subject by reading that subject's **bytes** and asserting that certain strings
appear, rather than by importing and exercising it. So the six directories the
risk ranking is structurally blind to, and the six suites that assert their
subject by text, are the same six. That is the finding.

Each was executed on its own, and then its subject was deliberately broken to
see whether the suite would notice. The results:

- **One is sound.** It runs a real guard script, and breaking the standard that
  guard enforces makes it fail.
- **Two were red, and the product was right both times.** One pinned a single
  spelling of a CSS property against a hand-written list of pages; all the pages
  set the property, most of them with the other quote character. The more
  serious half of that defect is the guard beside it, which was supposed to stop
  a page sizing itself to the viewport and could not have caught it on most of
  the pages it covered. The other pinned wording that a deliberate label
  standardisation superseded in July; because it failed early in a long block,
  twenty-four assertions after it had not run since. Both are repaired here, and
  both repairs were proven by breaking them again.
- **Three are green and prove nothing about the control they name.** Two of
  those are on API routes and the control in question is the tenant fence. On
  one route the fence was inverted, so a request naming another tenant would
  pass — the suite stayed green. On the other the tenancy error response was
  removed from the path that returns it — the suite stayed green. Both suites
  assert that certain identifiers appear in the route's source file.

No product code changed. The three vacuous proofs are recorded with the exact
mutation that survived, so the work to replace them starts from a reproducible
failure rather than from a reading; they are deliberately **not** wired into CI,
because a green CI step over an assertion that cannot fail is worse than a
dark one.

## Layer Impact

Release lane: `global-control-lane` — shared control/test-governance tooling for
all clients, with no feature gate and no client-scoped data touched.

- **Layer 4 (Products):** none. No product file was edited; every subject named
  in the triage record is byte-identical to the base commit.
- **Platform tooling / test governance:** two previously red test files are
  repaired, one new behavioural control runs in the CI-gated behaviours
  directory, and one triage record is added under `docs/architecture/`.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes — test governance and an audit record.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/architecture/t758-zero-product-source-triage.json` — the triage record:
  six rows, each with a verdict, a reason, the measured before/after counts and
  the mutation that was run against it.
- `src/__tests__/behaviors/zero-product-source-suite-triage.test.ts` — the
  control for that record. It recomputes the record's central claim against the
  live files rather than reading it back, refuses to let a suite recorded as
  proving nothing appear in any workflow, and pins the repaired assertion shape
  so a revert of the repair fails rather than leaving the record quietly false.
- `src/app/(maestro)/admin/context-layer/__tests__/layout-source.test.ts` —
  repaired. Matches the property in either quote style, enumerates the pages
  from the subtree instead of a written list (a page added since the list was
  written was covered by nothing), and reports every violating page together
  instead of stopping at the first.
- `src/app/(maestro)/admin/data-layer-explorer/__tests__/page-source.test.ts` —
  re-baselined against the label standardisation that superseded it, with the
  superseding commit named in the file. Each token is now its own case, so a
  string lost from the surface fails by name.

## QA / Validation

Base `bf43785b9428de499b833627fac9aafe08dc899e`.

**The six suites, same command both sides** (`npx jest --runTestsByPath` — four
of the six paths contain a parenthesised segment a bare jest pattern would read
as a regex group): **6 suites / 14 tests / 2 failed before → 6 suites / 57 tests
/ 0 failed, 0 pending after.** Counts read out of `--json` output, not typed.

**The CI-gated behaviours directory, same command both sides:** 117 suites / 0
failing / 1085 tests → **118 / 0 / 1097**. The difference is exactly this
change's twelve cases; nothing else moved.

**Mutation evidence.** Every mutation restores the subject and verifies the
restored file's sha256 equals the pre-mutation hash; the harness aborts if the
substitution is a no-op, because a no-op mutation reads exactly like a coverage
gap.

*Proving the three vacuous controls are vacuous — each had to stay green:*

| # | subject broken | suite result |
|---|---|---|
| M-A | the active-tenant guard on a chat step route, both comparisons inverted | 2 of 2 passed |
| M-B | a query route's tenancy error response no longer returned from the branch that returns it | 2 of 2 passed |
| M-C | an Admin heading's canonical branch made unreachable, every scanned literal preserved | 1 of 1 passed |

*Proving the sound one is sound, and the two repairs can fail — seven caught:*

| # | subject broken | result |
|---|---|---|
| M-D | an OpenAI key reference added to a file inside the governed reasoning path | 2 of 4 failed, including the guard-script case |
| M1 | a page's height changed to the viewport, double-quoted | 2 of 4 failed |
| M2 | the same, single-quoted | 2 of 4 failed |
| M3 | the property removed from one page | 1 of 4 failed, naming the case |
| M4 | the page enumeration collapsed to nothing | 1 of 4 failed, naming the enumeration guard |
| M5 | one asserted label renamed on the explorer surface | exactly 1 of 44 failed, by name |
| M7 | a forbidden shell import reintroduced | exactly 1 of 44 failed, by name |

M1 is the one that shows what the repair bought: the pre-image's negative guard
was `not.toContain` against one spelling, and the string
`minHeight: "100vh"` satisfies it. Checked directly, independent of any suite.

*Proving the new control can fail — seven mutations, all caught, each by the
case that names it:* a verdict outside the vocabulary; a row claiming a suite is
not a source-text scanner when it is; a published count disagreeing with its
rows; a suite recorded as vacuous named in a workflow file; the pre-image
assertion reintroduced into a repaired suite; a superseding commit the repaired
file does not cite; a row naming a file that does not exist; a duplicated row.

`tsc --noEmit` exit **0** by exit code with `tsconfig.tsbuildinfo` removed
first, 0 diagnostics. `eslint` exit 0, no output.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing under `src/app` imports any file
this change touches, and no product file changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge.
- Shared runtime mutators: none.
- Approved image digest: unchanged by this release.
- ACA runtime invariant: to be proven from the deploy run keyed to this merge.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and none is owed.** No product file
  changed and no rendered surface is affected; a signed-in lane here would be a
  proof with no subject.

## Known Gaps

Named in full under **Residuals** below, and summarised here because they are
what this release does *not* close:

- Two governed route tenant fences remain asserted only by substring presence
  and substring order. This release proves they are not tested; it does not
  replace them.
- One Admin page suite remains a source-text scanner that survives its subject's
  heading being made unreachable. It is recorded as proving nothing rather than
  repaired.
- None of the six suites is wired into a CI job by this change, so all six
  remain dark. Three of them must stay dark until their controls are re-proven.
- The scroll-frame contract is enforced for one Admin subtree only.

## Rollback Plan

Revert the merge commit. No migration, no data change, no runtime state.

## Rollback Constraints

None. The two repaired test files return to their previous (red) state on
revert, and the triage record and its control are additive.

## Audit Evidence

- `docs/architecture/t758-zero-product-source-triage.json` — per-suite verdicts,
  measured counts, and the exact mutation run against each.
- `src/__tests__/behaviors/zero-product-source-suite-triage.test.ts` — runs in
  the behaviour coverage floor job on every PR.
- The PR for this change, and its check runs.

## Residuals — named rather than folded in

1. **Two governed route tenant fences are asserted only by substring presence
   and substring order.** The mutations that survive are recorded exactly, so
   the replacement work starts from a reproducible failure. Not filed as a new
   identifier: the id band this lane files from reads 0 of 100 free, which the
   generated queue marks as a range decision rather than a reading, and taking a
   number from another band to get around that is the collision the band rule
   exists to prevent.
2. **Wiring is not taken here.** Three of the six are vacuous and must not be
   wired; the other three qualify under the existing credit-then-wire rule, but
   wiring moves the committed coverage census, and another lane holds the census
   drift check on a live claim. Sequencing, not disagreement.
3. **Five Admin pages outside this subtree size themselves to the viewport.**
   The repaired scroll-frame contract covers one subtree. Whether those five are
   defects or deliberately outside the Admin scroll frame is a product question
   this triage did not open — a repo-wide control asserting it today would be
   red on arrival.
4. **The AI surface control catalog's six uncovered required controls cannot be
   closed by writing a test.** All six sit on two surfaces whose own catalog
   entries record that no route renders them. Writing mount tests there would
   add green assertions over components no reader ever sees.
