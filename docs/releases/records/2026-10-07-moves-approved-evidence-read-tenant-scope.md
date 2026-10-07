# Approved Move evidence is read on the same tenant scope it is approved on

## Release ID

`2026-10-07-moves-approved-evidence-read-tenant-scope`

## Status

`candidate`

## Plain-English Summary

A Move's evidence is reviewed by a person and either approved or returned. Once approved, that
evidence is what the phase gate measures, what decides which phase a Move is effectively in, and
what every document the Move generates is written from.

Evidence rows for one tenant can carry more than one of **that same tenant's own** keys, because two
producers write them under different names: the product writes the application's client key, while a
data-plane load job writes the canonical substrate key. For a tenant whose two keys are different
strings, a reader scoped to a single key sees only the rows one producer wrote.

The reader that lists a phase's approved evidence for the gate already matched the tenant's whole
key set. Three other reads did not:

- the **approved-evidence snapshot**, which the gate evaluator, the effective-phase resolver, the
  phase-build route and the background generation worker all read, matched one key on all three of
  its queries; and
- the **generation prompt's evidence list**, which is what an approved document is actually written
  from, matched one key on both of its queries.

The consequence is the worst shape this kind of defect takes: it is indistinguishable from an empty
cabinet. A reviewer approves the evidence, the approval succeeds, and the snapshot still answers
*zero approved evidence* — so the gate measures nothing, the Move does not advance, and a document
that does generate is composed with none of the approved evidence and says nothing about having
missed it. No error is raised anywhere, because "no rows matched" is a perfectly ordinary answer to
a scoped query.

This change scopes all five reads to the tenant's own key set, which is the same scope the phase
evidence reader and the review-promotion path already use.

## Layer Impact

Release lane: `client-data-lane` — tenant-scoped read scope on Move evidence, applying to every
client with no feature gate.

- **Layer 3 — Canonical model:** unchanged. No schema, no migration, no new column, and no change to
  which key a NEW row is written under. Writes stay keyed to the single caller client key, so
  widening these reads cannot change what is stored.
- **Layer 4 — Products (Moves):** a Move whose evidence rows all carry the caller's own key is
  byte-for-byte unchanged. A Move whose rows carry the tenant's other key now reads as having the
  approved evidence it has.

Tenant isolation is unchanged and is asserted in both directions. The key set comes from one
tenant's own alias profile; profiles are disjoint, and that disjointness is itself an existing
invariant with its own check.

## Client Applicability

- All clients: yes — shared read scope.
- Specific clients: none. The behaviour differs only for a tenant whose stored keys differ from the
  key the caller passes, which is a property of how a tenant's rows were loaded, not of a
  per-client setting.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a no-op wherever a tenant has one key, which is why it ships
  unflagged.

## Changes Included

- `src/lib/programs/approved-move-evidence-snapshot.ts` — the approved-review query, the
  review-activity query and the evidence-item join are each scoped to the tenant's key set.
- `src/lib/programs/evidence-context.ts` — the approved-review query and the evidence-item query
  that build the generation prompt are scoped the same way, and a context with no tenant now reads
  nothing explicitly rather than relying on an empty-string key matching no row.
- `src/lib/programs/__tests__/approved-move-evidence-snapshot-tenant-scope.test.ts` — new,
  12 cases.
- `src/lib/programs/__tests__/evidence-context-tenant-scope.test.ts` — new, 8 cases.
- `src/lib/programs/__tests__/approved-move-evidence-snapshot.test.ts` — its fluent-client fake is
  repaired: the tenant scope is now a mid-chain `in(...)`, so the fake's builder has to be both
  chainable and awaitable rather than resolving from one terminal method.
- `src/lib/programs/__tests__/evidence-context.test.ts` — its context fixture named no tenant, which
  reads nothing in production; the cases are about approved-versus-pending filtering, so the fixture
  now names a tenant derived from code, and the scope it asserts is derived from the read-scope
  helper rather than restated.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

The scope helper is **reused**, not restated. It already carries the contract these reads depend on
— per-tenant, read-only, and reflexive across a tenant's keys — and a second derivation of "which
keys may this tenant's evidence read match" would drift from the first.

Deliberately **not** changed: the key a new review or evidence row is written under. Which key a row
should carry when it is created is a different question from which existing rows belong to this
tenant, and answering it is a data-repair decision, not a read scope.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__` (directory-wired into required checks):
  154 suites / 1963 tests.
- **PASS** — `npx jest src/scripts/__tests__ src/app/api/v1/programs src/app/api/v1/deliverables
  src/__tests__/integration/programs` — the consumers of both readers: 104 suites / 1835 tests
  (1 suite, 20 tests skipped, unchanged from base).
- **PASS** — `npm run test:behaviors`: 202 suites / 2102 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` over both changed modules and all four suites, exit 0.
- **PASS** — census regenerated: `coveredTestFiles` 2654 → 2656, `uncoveredTestFiles` unchanged.
  The +2 covered with uncovered unchanged is the proof both new suites are reached by a CI runner
  rather than added dark.
- **PASS** — mutation testing, **8 mutations, 8 killed**, each applied and run on its own:
  1. snapshot's approved-review query back to a single key — killed, 5 cases.
  2. snapshot's review-activity query back to a single key — killed, 1 case. This one **survived the
     first draft of the suite**: every fixture there was an approved review, and the activity query
     is decision-agnostic, so both queries returned the same rows and either scope passed. Killing
     it needed a review that was *decided but not approved* under the other key — the only fixture
     that tells the two queries' scopes apart.
  3. snapshot's evidence-item join back to a single key — killed, 7 cases. Widening the review half
     alone finds the approval and then drops the row for a missing item, which reads as no evidence
     just the same.
  4. prompt's approved-review query back to a single key — killed, 4 cases.
  5. prompt's evidence-item query back to a single key — killed, 3 cases.
  6. **mirror** — snapshot over-widened to every tenant's keys — killed, 4 cases.
  7. **mirror** — prompt over-widened to every tenant's keys — killed, 4 cases.
  8. the no-tenant guard removed — killed, 1 case.

  The two mirrors are why the first five results are not vacuous: without them, every case above
  would pass just as well for a read that matched all tenants.
- **PASS** — the fixture these cases rest on is asserted, not assumed. Both new suites derive the
  two-key tenant and a second, unrelated tenant from the canonical tenant list in code, and each
  first asserts that the derivation found a tenant whose two keys actually differ. Without that
  assertion an undefined derivation would compare a key against itself and every case would pass
  for the wrong reason.
- **NOT RUN** — live signed-in walk. This change alters no UI control and no stored schema. Observing
  it end to end needs a Move whose evidence has been human-approved, which is a data-lane and
  human-approval precondition, not this lane's (see Known Gaps).

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no env var, no worker image change — the worker
calls the same function and only its scope changes. Behaviour becomes active for the next snapshot
read after deploy.

One effect to expect rather than be surprised by: for a Move whose approved evidence was previously
invisible, the evidence revision these reads produce changes, because it is derived from the rows
read. Documents generated earlier against the empty basis will therefore read as stale and need
regenerating. That is the correct reading — they were written without evidence that had in fact been
approved — not a regression introduced here.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged by this release.
- Shared runtime mutators: none. No Azure command, no workflow edit, no change to any digest-pinned
  image reference.
- No shared Product/Lab traffic is shifted by this change.

## Rollback Plan

Revert the squash commit. The change is confined to the scope of five read queries plus test files;
there is no migration to unwind, no stored schema to reverse, and nothing written differently. A
revert restores the single-key scope and with it the earlier evidence revisions.

## Audit Evidence

- Both modules state at the point of the decision why the scope is the tenant's key set and what a
  single-key read reports instead, so the reasoning travels with the code.
- The reused scope helper's own documentation records the repair that first exposed this defect
  class, by reference rather than by narrative.
- Mutation results above, each mutation named, applied individually, and its killing cases counted,
  including the survivor that the first draft of the suite did not catch and what it took to kill.
- Census delta recorded above as the proof both new suites are CI-reached.

## Known Gaps

- **Three live single-key reads on these tables remain, and they are now named rather than
  guessed at.** Every file reading `program_evidence_reviews` or `program_evidence_items` was
  enumerated for this record. The artifact routes turn out to be **already widened** on all four of
  their reads, as are the phase evidence reader and the review-promotion path. What is left:
  - `src/lib/programs/deliverables/diagnose-intake.ts` — two reads, reachable from three routes.
  - `src/lib/programs/approved-inputs-pack-store.ts` — one read.

  These are secondary surfaces rather than the gate and generation core fixed here, and each needs
  its consumer's intent checked before widening, so they are deliberately left to their own change.
- **One module's three single-key reads are deliberately left alone because the module is an
  orphan.** `src/lib/deliverables/orchestrator/evidence-assembler.ts` reads both tables on a single
  key, and its only export has **no production caller** — it is reached by its own test suite and
  nothing else. Widening it would record a fix for code that does not run; it should be retired or
  mounted first.
- **This does not decide which key a new row should carry.** Both producers keep writing the key
  they write today, so a Move's rows can still be split across two of its tenant's keys. A widened
  read makes that harmless for these consumers; it is not a substitute for settling the storage
  question.
- **Nothing surfaces a scope miss.** A report exists that can name the stored keys a single-key
  reader would miss, and no product surface renders it. A person still cannot learn from the UI that
  evidence was found under a different key.
- **Data-lane and human-approval preconditions are unchanged.** Observing this fix end to end needs
  evidence approved by a reviewer on a Move, which is the data lane's step and a human's, not this
  lane's.
