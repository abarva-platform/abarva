# 2026-10-07-moves-declared-archetype-field-precedence — a function-pack key no longer shadows a declared archetype

## Release ID

`2026-10-07-moves-declared-archetype-field-precedence`

## Status

`candidate`

## Plain-English Summary

A Move can say what kind of work it is. That declaration decides which evidence
framework the product asks for, which readiness it reports, and which
deliverables it generates — so reading it correctly is the difference between
asking a client for the right evidence and asking for someone else's.

Two fields on a Move can carry that declaration, and they hold two different
kinds of identifier. One holds an archetype id. The other holds a *function
pack* key — a different naming scheme, for a different purpose, whose values are
things like a member-services pack or a legal-operations pack. Only one shipped
pack key happens to also be a valid archetype id.

The resolver read the pack-key field first and trusted it unconditionally. So
whenever a Move carried a function pack AND a declared archetype, the pack key
won, named no archetype, and the declaration was silently discarded. Resolution
then fell back to guessing the Move's kind from its wording — and guessing on
this kind of Move lands on the wrong framework, because the guess rules spell
their keywords with spaces while these identifiers use underscores. The Move
then rendered a complete, confident readiness report against a framework nobody
declared.

This change makes the resolver prefer whichever field actually names a known
archetype, instead of trusting field order. A declaration now wins regardless of
which field carries it. When neither field names an archetype the behaviour is
unchanged, and when the pack-key field names one it still wins — so the only
case that moves is the one that was losing a declaration.

Measured: of the 13 function-pack keys that appear on Moves in this repository,
every one of them shadowed a declared archetype before this change, and all 13
resolved to the same wrong framework. None of them shadows it now.

This is the same rule the sibling resolver in the discovery/evidence-readiness
layer already applies, in a comment that names this exact hazard. The two had
drifted: this one copied the field ORDER and dropped the rule that made the
order safe.

## Layer Impact

- `global-control-lane`. The resolver is shared app behaviour and is not
  feature-flagged.
- Layer 3 (canonical model) read path only. This changes which declared
  identifier is READ off a Move. It writes nothing, adds no column, no
  migration, and no canonical field, and it does not change any stored value.
- Layer 4 (products): Moves. The archetype answer feeds the per-phase evidence
  requirement framework and the readiness/deliverable surfaces that resolve
  through this one helper.

## Client Applicability

- All clients: yes — the resolver is not flag-gated. The behaviour change is
  confined to Moves that carry a function-pack key AND a declared archetype
  whose values disagree in the way described above; every other Move resolves
  byte-for-byte as before.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A declaration being read correctly is a correctness fix,
  not a capability, so gating it would leave the defect live by default.

## Changes Included

- **Added** `src/lib/programs/archetypes/declared-archetype-precedence.ts` —
  `resolveDeclaredArchetypeId` (which of the two fields is read) and
  `charterDeclaredArchetypeId` (reading the charter field defensively). A module
  of its own so the rule is assertable as a pure function: its only caller is
  `server-only` and reachable solely with the data layer mocked, so a rule living
  inside it could be tested only through that mock.
- **Changed** `src/lib/programs/move-archetype-resolution.ts` — the private
  `declaredArchetypeId` now delegates to that rule. The doc comment's claim to
  mirror `resolveDeclaredProgramArchetypeId` is now true in substance rather
  than only in field order.
- **Added** `src/lib/programs/__tests__/declared-archetype-precedence.test.ts` —
  25 cases on the rule.
- **Changed** `src/lib/programs/__tests__/move-archetype-declared-wiring.test.ts`
  — 3 cases appended, pinning the fix at the CALLER rather than only at the rule.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`. See QA.

No route, schema, migration, prompt, deploy workflow, image, flag, or
environment variable changed.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/declared-archetype-precedence.test.ts`
  — 25 of 25.
- **PASS** `npx jest src/lib/programs/__tests__/move-archetype-declared-wiring.test.ts`
  — 10 of 10 (7 before this branch).
- **PASS** `npx jest src/lib/programs/` — 334 suites, 4,756 tests. The whole
  directory, not only the suites named above, because the resolver is read
  across it.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over the four changed files — exit 0.
- **PASS** `npm run release:check -- --base origin/main --head HEAD` — 11 of 11.
- **NOT RUN** live signed-in proof. This branch is code only; see Deployment
  Authority.

**The defect was unpinned in BOTH directions before these cases.** Measured, not
assumed: with the fix reverted and the new cases withheld, the three suites that
own this area pass 38 of 38. Every pre-existing case in the wiring suite sets the
pack-key field to null and exercises one declaration field at a time, so no case
asserted the broken behaviour and none asserted the correct one either. With the
fix reverted and the new cases present, 16 of 35 fail. A fix whose own tests pass
on the unfixed code would be proving nothing, so this measurement is the point of
the exercise.

**Mutation testing: 6 of 7 killed, and the survivor is diagnosed, not
outstanding.**

| # | Mutation | Result |
|---|---|---|
| 1 | Invert the oracle (prefer the candidate that names NOTHING) | killed — 16 failed |
| 2 | Drop the prefer-named rule (return the first candidate) | killed — 15 failed |
| 3 | Drop the inference-seed fallback (return only a named candidate) | killed — 2 failed |
| 4 | Swap the two fields' order | killed — 2 failed |
| 5 | Stop trimming before matching | killed — 1 failed |
| 6 | Drop the bare-string guard on the charter field | **survived** |
| 7 | No-op control on the restored file | baseline 25 of 25 |

Mutation 6 survives **by construction, and no test should kill it.** JavaScript
boxes a primitive, so reading a named property off a bare string already answers
`undefined` and the function returns null with or without the guard. The only
input the guard changes is a function carrying that property, and the field is
read out of a JSONB column, which cannot hold one. It is kept because it states
the intent and matches the sibling resolver — not because it is reachable. This
is recorded in the module's own doc comment so the next reader does not spend the
measurement again, and a case manufacturing an impossible state to turn the
table green would be worse than the honest row.

**Census.** `testFiles` 2809 → **2811**, `coveredTestFiles` 2645 → **2647**,
`uncoveredTestFiles` unchanged at **164**. The flat uncovered count is the proof
that matters: the one suite this branch adds is executed by a CI job rather than
merely present on disk.

The delta is +2 and only +1 of it is this branch. Counting the tree directly
settles which is which: `origin/main` contains 3,055 test files and this branch
contains 3,056 — a +1, exactly the one suite added here. The second +1 is
staleness `main` already carried in its committed census against its own tree,
which regenerating absorbs.

**These figures are correct only while `main`'s committed census reads
2809/2645.** They were regenerated twice: once against the base this branch was
cut from, and again after `main` advanced mid-branch. Another pull request that
adds a test file and lands first will stale them, and the fix is another
regeneration rather than a merge of the hunk.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow then builds a
digest-pinned image and deploys it; this branch triggers no deploy itself and
mutates no shared runtime. No migration, no flag flip, no environment variable,
and no worker job change, so there is no ordered rollout step beyond the normal
image promotion.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing
  here deploys outside it.
- Shared runtime mutators: none. This branch runs no `az` command and changes no
  Container App template, revision weight, scale rule, secret, or environment
  variable.
- Approved image digest: not applicable to this branch; the digest is whatever
  the main deploy workflow publishes for the squashed commit.
- ACA runtime invariant: unchanged by this branch, and to be proven by the
  deploy workflow in the usual way before anything here is called live-proven.
- Worker image invariant: unchanged — no worker job image or payload changed.
- Feature/env flag update path: not applicable; no flag is added, enrolled, or
  read differently.
- Live signed-in proof required: **yes, and NOT done here.** This record claims
  `merged`-grade evidence only. The user-visible consequence — a Move with a
  declared archetype being asked for that archetype's evidence — is observable
  only on a signed-in walk of a Move that carries both fields, which is an
  authorized human step.

## Rollback Plan

Revert the squashed commit. The change is confined to one new module, one
delegation inside one function, and two test files; it is behaviour-only on a
read path, with no migration, no stored-value change, and no flag, so a revert
restores the prior resolution exactly with no data to unwind and no ordering
constraint.

Reverting reinstates the shadowing, so the revert is a fix only for a regression
caused by the new precedence itself — not a way to quiet an unrelated red.

## Audit Evidence

- The pull request for this branch, its CI run, and this record.
- `src/lib/programs/__tests__/declared-archetype-precedence.test.ts`, which
  carries the 13 shipped pack keys as literals, and a case asserting that none of
  them is itself a bridged archetype id — without which each pack-key case could
  pass while asserting the opposite rule.
- `src/lib/programs/__tests__/move-archetype-declared-wiring.test.ts`, for the
  caller-side proof that the rule is actually threaded through the server-only
  resolver.
- The QA section's reverted-fix measurements, which are the evidence that these
  cases bind to behaviour.

## Known Gaps

- **The resolver still does not VALIDATE a declared id against the catalogue.**
  An id that names no known archetype is passed on as the inference seed, which
  is documented intent in `resolveProgramArchetype` ("passing a declared id that
  names nothing is not an error") and is deliberately preserved here. This change
  stops such an id from *outranking* one that does name an archetype; it does not
  reject it.
- **The two resolvers now apply the same rule but consult different oracles.**
  This one asks the declared-archetype bridge; the discovery-side sibling asks
  the blueprint catalog. That is deliberate — the bridge is what the registry's
  declared arm actually consults, and importing the catalog would pull the
  discovery-blueprint module graph into a `server-only` resolver that avoids it —
  but the two could answer differently for an id present in one and absent from
  the other. No such id exists today; nothing asserts that it cannot come to.
- **Only the archetype id space is in scope.** Other readers of the pack-key
  field read it as a function-pack id, which is its correct meaning there and is
  unchanged. This was swept, not assumed.
- **The upstream origination guard remains narrower than this rule.** It
  suppresses the function-pack guess for exactly one archetype id, so for the
  other declarable archetypes a pack key can still be guessed onto a Move. That
  guess can no longer shadow the declaration, which is the consequence that
  mattered, but whether the guess should happen at all is a separate question and
  is untouched here.
- **No live signed-in proof.** Per Deployment Authority.
