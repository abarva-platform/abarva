# u622 — The sixth sign-off criterion states its cause

## Release ID

`2026-10-08-business-case-signoff-cause`

## Status

`candidate`

## Plain-English Summary

u620 gave five HARD phase-gate criteria a sentence that names _why_ a document
sign-off refused, instead of restating the criterion. It enumerated those five
by looking for criteria whose body calls the sign-off predicate by name.

There is a sixth. The P4 business-case criterion reaches the same predicate
through an intermediate helper — a one-line asynchronous wrapper whose entire
body delegates to it — so a search for the predicate's name does not find it,
and it was left behind. Its refusal still read "Business case and value plan
approved": a restatement of the requirement, for all four of the structurally
different states the predicate collapses into one boolean.

That matters more here than the enumeration gap suggests, for two reasons.

It is HARD, and both surfaces that render a blocked gate message filter the
failed checks to hard severity before reading their reason. So this is a
sentence a signed-in user standing at the P4 boundary actually reads, and until
now the only thing it told them was the name of the thing that was missing.

And its second state is the dangerous one. When the document exists but is not
recorded as signed off, the intuitive remedy — re-running the phase build — is
the one action that cannot work: the build replaces the document with a fresh
unapproved draft and so clears the very sign-off the gate is waiting for. The
business case is in the phase-4 build set, so that hazard is live for this
criterion specifically, not theoretical. The sentence now says so explicitly.

This change is wiring, not new behaviour: the pass/fail answer is identical,
because the helper it replaces delegates to the same predicate with no added
condition. Only the sentence a blocked reader receives changes.

## Layer Impact

- `global-control-lane` — shared Moves phase-gate evaluation. The gate verdict
  (pass/fail, severity, which checks failed) is byte-for-byte unchanged; only
  the human-readable reason attached to one failing check changes.
- No canonical-model, intake, adapter, schema, or data-plane change. No
  migration. No product projection reads anything new.

## Client Applicability

- All clients: yes — the reason text is not tenant-scoped or flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The sentence replaces a restatement unconditionally.

## Changes Included

- `src/lib/programs/governance.ts` — the `business_case_approved` criterion
  resolves the sign-off verdict and derives its failure sentence from the
  verdict's cause, in place of a bare boolean call through the wrapper. The
  comment records why this one was missed and why it is the only one of the
  four remaining single-document sign-off criteria that may safely prescribe a
  rebuild.
- `src/lib/programs/deliverable-signoff-diagnosis.ts` — the module's own
  enumeration corrected from five criteria to six, and a new note recording the
  three criteria deliberately **not** wired to these sentences, with the
  measurement behind that exclusion.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — a new case
  group driving the gate evaluator at the P4 boundary across every reachable
  cause; the existing frozen five-criterion label list widened to six.
- `src/lib/programs/__tests__/deliverable-signoff-diagnosis.test.ts` — the
  registry-key list widened to six so a renamed key fails a test rather than
  quietly degrading a sentence to a humanized identifier.

### Scope deliberately not taken

Three further criteria are the same shape — one document, one sign-off call, a
reason that restates the criterion. They were measured and excluded, not
overlooked. The sentence for the "no such document" state prescribes running the
phase build, and none of the keys those three resolve appears in any phase build
set, so that build produces none of them; deliberate authorship is their only
producer. Giving them this sentence would prescribe an action their own
generation set rules out.

Their reasons are not inert, so this is owed work rather than a non-issue: both
blocked-message readers filter to hard severity and these three are soft, but
the advance route copies soft failures into the gate decision artifact as the
record of what was carried forward. They need a producer-aware variant of the
"no such document" sentence — a real derivation over the phase build sets, not
a wording change. Recorded in the module and in Known Gaps.

## QA / Validation

- `npx jest src/lib/programs/__tests__` — **PASS**, 182 suites / 2,427 tests.
- `npm run test:behaviors` — **PASS**, 208 suites / 2,163 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS** (exit 0).
- `npx eslint` on all four changed files — **PASS** (exit 0).
- Mutation testing — **PASS**, 8 mutations introduced, 8 killed:
  1. the whole change reverted to the wrapper call — 7 cases fail.
  2. document label swapped to another criterion's key — 4 fail.
  3. the recorded status dropped from the sentence input — 2 fail.
  4. the cause pinned to a constant instead of the verdict's — 5 fail.
  5. the criterion forced to pass — 8 fail.
  6. the verdict taken over an absent row instead of the found one — 8 fail.
  7. the criterion's severity softened from hard to soft — 2 fail.
  8. the "no such document" sentence stops naming the build control — 3 fail.
- Test-file census — **NOT RUN as a change**: this release adds no test file, so
  the census is untouched. A regeneration on the base commit with none of these
  changes applied reads the same +2 against the committed file, so that drift is
  inherited from main and is deliberately not carried in this diff.
- Formatting — the one formatting warning on the largest changed file is
  pre-existing at the base commit and sits ~1,400 lines away from every line
  this change adds; it is left alone rather than pulled into this diff.
- Live signed-in walk — **NOT RUN**. Owed; see Known Gaps.

## Rollout Plan

Merge to main. No runtime rollout step of its own: the change is library code
compiled into the web image and reaches the shared Product/Lab runtime on the
next repo-owned main deploy. No migration, no flag, no env var, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, the only
  workflow permitted to shift shared web traffic.
- Shared runtime mutators: none in this change. No Azure command is run by or
  for this release.
- Approved image digest: not applicable — this release pins no image and
  requests no runtime update.
- ACA runtime invariant: unchanged by this release; it must hold for whichever
  main deploy carries this commit, proven by that deploy, not here.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none required.
- Live signed-in proof required: **yes** — this changes a sentence a signed-in
  user reads at a phase boundary, and only a walk can show it rendering.

## Rollback Plan

Revert the commit. Nothing persists state, so a revert is complete and
immediate: the criterion returns to its previous pass/fail answer, which this
change never altered, and its reason returns to the criterion's restatement. No
migration to unwind, no data written, no flag to flip, no artifact to clean up.

## Audit Evidence

- The pull request and its CI run.
- The eight mutation results above, each reproducible by making the stated edit
  and re-running the named suite.
- The new case group, which drives the real gate evaluator rather than the
  sentence module alone, so a reverted wiring fails rather than passing on the
  module's own tests.

## Known Gaps

- No live signed-in walk has been performed for this change, or for the
  preceding changes in this workstream. Nothing here may be called live-proven.
- The three soft single-document sign-off criteria still restate themselves.
  They need a producer-aware "no such document" sentence before they can take
  this treatment; the measurement and the reason are recorded in the module.
- The "nothing was recorded" arm of the sentence builder remains unreachable
  from the gate evaluator, which only asks for a sentence on a failing verdict.
  It is retained defensively.
- The first blocking step of the end-to-end demo path is unchanged by this
  release and remains outside the code lane.
