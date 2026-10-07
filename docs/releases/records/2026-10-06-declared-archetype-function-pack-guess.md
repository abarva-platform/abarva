# 2026-10-06-declared-archetype-function-pack-guess — origination stops guessing a business function a Move already said it spans

## Release ID

`2026-10-06-declared-archetype-function-pack-guess`

## Status

`candidate`

## Plain-English Summary

When a Move is originated, the product scores its brief text against every
curated "Domain Function Pack" for the client's industry and stores the
best-scoring one as that Move's business-function identity. It is a reasonable
default when nobody has said what the Move is.

It was also running when somebody HAD said. A person originating a Move can
declare its discovery archetype from a catalog, and one of the archetypes a
person can declare is a governed data foundation — work whose whole point is
that it spans every business function. There is no single function to guess for
it, so the guess picked whichever curated pack happened to share vocabulary with
the brief.

Measured on the base of this change, with the brief text origination actually
assembles, for a Move declaring that archetype:

Three of the four industry pack catalogs mis-bound on at least one brief a
governed-data-foundation Move legitimately carries:

| Brief | Pack it bound |
|---|---|
| a realistic data-foundation brief | a contact-centre pack, confidence 0.257 |
| the same declaration, privacy-forward wording | a risk-management pack, confidence 0.188 |
| the declaration alone, no prose | a workforce pack, confidence 0.25 |

The confidence floor is 0.18, so none of these is a near-noise match the floor
could have caught — 0.257 is a confident wrong answer. The key is persisted into
a first-class column and dual-written into the charter, and eight readers then
treat it as the Move's business function, including the solution-architecture
model behind the Design phase and the business-case model behind the Plan phase.
A contact-centre pack would have supplied the curated depth for a
data-governance Move's architecture and business case.

After this change, a Move that declares a function-spanning archetype gets no
key at all. That is the honest answer, not a degraded one: each of those readers
already renders a missing identity as an explicit unbound result with a named
reason, never as curated depth it does not have.

Nothing else changes. A Move that declares nothing still guesses, and so does a
Move that declares any of the other four archetypes — two of which are
agent-assist archetypes, for which the guessed pack is plausibly right, so
declining on "the Move declared something" would have lost a legitimate binding.

## Layer Impact

**Release lane: `global-control-lane`.** The origination path is shared app
behaviour for all clients and is not feature-gated. The behaviour change is
reached only by a Move that declares one named archetype, but the code path is
shared, so the lane describes the path rather than the reach.

- **Layer 4 — products.** Origination (Phase 0) writes one fewer field for one
  class of declared Move. Downstream Design and Plan surfaces consequently show
  an honest unbound function identity instead of a wrong bound one.
- **Layer 3 — canonical model: write shape only, no schema change.** The
  `function_pack_key` / `function_pack_confidence` columns and the charter keys
  are unchanged; for the affected class they are simply left null, which is a
  value they already take whenever no pack clears the floor.
- Layers 1–2 untouched. No intake workbook, adapter, migration, projection or
  tenant dataset is read or written.

## Client Applicability

- All clients: the shared origination path changes, but only for a Move that
  declares a function-spanning archetype at Phase 0.
- Specific clients: none singled out. No client key, tenant registry entry or
  client-scoped dataset is referenced by this change.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behaviour is keyed to a declaration a person makes,
  which is itself the gate — an undeclared Move is byte-for-byte unchanged.

## Changes Included

- **Added** `src/lib/programs/declared-archetype-function-identity.ts` — the
  declared set of archetype ids whose work spans business functions (one entry
  today) and `mayGuessFunctionPackForDeclaredArchetype`. New module rather than
  an edit to a hot shared file. It has exactly one caller, wired in the same
  commit; it is not a caller-less decision module.
- **Modified** `src/lib/programs/origination-submit.ts` — `deriveFunctionPackIdentity`
  consults the guard and returns `null` before classifying. Five added lines
  plus the import and a doc-comment correction. The declaration it reads is
  normalized earlier in `submitOriginationBrief`, before the charter is built,
  so this reads the canonical value and not raw input.
- **Added** `src/lib/programs/__tests__/declared-archetype-function-identity.test.ts`
  — 13 cases.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`.
- **Added** this release record.

### Why a declared set and not a heuristic

Five archetypes can be declared today. One is the general default, one is
`governed_data_foundation`, one is an operations/digital archetype, and two are
agent-assist archetypes whose work IS one business function — so blanket
suppression on any declaration would have removed a binding that is probably
correct. The suite names all five as literals; this record does not repeat the
two agent-assist ids because each embeds an industry word the record-prose gate
reads as a registry name. None of the five ids is itself a function-pack key — zero overlap with
the 39 keys — so there is no archetype-to-pack mapping to consult instead, and
the blueprint type carries no pack field to read. The only discriminator
available today is the archetype stating it for itself, so that is what the
module holds, with the default preserving current behaviour.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/__tests__` (whole directory, not just the new suite) | **PASS** — 123 suites / 1255 tests, 0 failing |
| `npx jest …/declared-archetype-function-identity.test.ts` | **PASS** — 13 / 13 |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint` on the three changed source files | **PASS** — exit 0, no output |
| `npm run release:check -- --base origin/main --head HEAD` | see below |
| Live signed-in walk | **NOT RUN** — see Deployment Authority |

The typecheck is judged on its exit code, not on grepping for `error TS`: this
check exits 134 on the operator host when it runs out of memory and emits no
diagnostics, so a grep over its output would report a false clean.

The whole `__tests__` directory was run rather than the related suites alone,
because the host file is imported by many of them and a host-level change can
break a sibling's suite over the region it touches.

**The suite can fail.** Seven mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file — a mutation that
silently edits nothing reads as a survivor and reports a gap that is not there.
The working tree was staged before mutating and each mutation reverted from the
index; the baseline was re-run clean at the end (13 / 13).

| # | Mutation | Result |
|---|---|---|
| 1 | The guard always allows the guess | **4 of 13 failed** |
| 2 | The guard inverted — an undeclared Move declines | **1 of 13 failed** |
| 3 | `.trim()` dropped from the declaration | **1 of 13 failed** |
| 4 | The suppressed id renamed | **6 of 13 failed** |
| 5 | An agent-assist archetype added to the suppressed set | **3 of 13 failed** |
| 6 | The caller's guard removed entirely | **1 of 13 failed** |
| 7 | The caller's guard moved below `industryKeyForCode` | **SURVIVED** |

Mutation 7 is a false survivor and is reported as one rather than as a coverage
gap. `industryKeyForCode` is pure and side-effect-free, and the guard still
precedes `classifyFunctionKey`, so moving it within that prelude changes which
pure function runs first and nothing a caller can observe. Mutation 6 — removing
the guard, the only behavioural break at that site — is killed.

Mutations 2, 3, 5 and 6 each kill exactly the case written for them, so no case
is passing on a neighbour's assertion.

The suite asserts the suppressed id as a written-out literal and names the four
still-guessing archetypes as literals too, rather than mapping over the set it is
testing — an expectation read off the declaration under test cannot see a rename,
which is what mutation 4 confirms.

**Census.** `coveredTestFiles` 2595 → 2596 with `uncoveredTestFiles` unchanged.
That delta is the proof the new suite is wired to a CI job rather than merely
present; grepping the census for the filename proves nothing either way. The
generator reports `census drift: committed census matches this run` after the
regeneration, and `audit:tenancy-fence-coverage:write` produced no change.

## Rollout Plan

Merge to `main` via squash auto-merge. The repo-owned ACA deploy workflow builds
and deploys the merge commit as it does every merge. No flag to enroll, no env
var, no migration, no worker job, no data build.

## Deployment Authority

Not required for this release to be correct, and not exercised by it.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change in this record.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof: **NOT RUN.** This record does not claim `live-proven`.
  Proving it on a served surface requires originating a Move with the
  declaration, which is a human-in-the-loop step outside this lane.

## Rollback Plan

Revert the merge commit. The change adds one module and one suite and edits one
function in one file; a revert restores the prose guess for declared
function-spanning Moves and removes 13 test cases. No migration, no data
backfill, no runtime state, no flag to unset.

Already-originated Moves are unaffected in both directions. This change alters
only what is written at origination; it does not read, rewrite or clear a
`function_pack_key` any existing Move already carries. A Move originated while
this change is in effect keeps its null key after a revert, and a Move
originated before it keeps whatever key it was given.

## Audit Evidence

- `src/lib/programs/declared-archetype-function-identity.ts` — its header records
  the measurement table above, the eight downstream readers, and why the set is
  declared rather than inferred.
- `src/lib/programs/__tests__/declared-archetype-function-identity.test.ts` —
  three cases reproduce the mis-bind itself against the real classifier, so the
  defect is pinned by an executing assertion and not only described in prose.
- The mutation table above. Reproducible: apply the listed mutation and rerun the
  suite by path.
- Required CI checks on the pull request.

## Known Gaps

- **One archetype is suppressed, and only because it is the one that is
  function-spanning by construction today.** Whether `general_default` or
  `ai_operations_customer_digital` should also decline the guess was not
  measured and is deliberately not decided here; both keep today's behaviour.
  Adding either is a one-line change to the declared set plus its own
  measurement of what the guess currently returns for them.
- **The set is hand-maintained.** A sixth archetype added to the catalog gets the
  guessing default, silently. One test asserts that every suppressed id is still
  declarable, so a removal is caught; an ADDITION that should have been
  suppressed is not caught by anything. The durable fix is for an archetype to
  carry this as a field of its own declaration, which means touching the
  blueprint type — a hot shared file this change deliberately avoided.
- **Already-originated Moves are not repaired.** Any Move that was originated
  before this change with a wrongly-guessed key still carries it. No backfill is
  attempted and none should be run without first measuring how many Moves hold a
  key that contradicts a declaration they also hold.
- The confidence floor itself is untouched. A Move that declares nothing can
  still bind at 0.188, and the floor's own calibration is a separate question
  with a separate blast radius — changing it moves which legacy Moves bind.
- No live signed-in walk. See Deployment Authority.
