# 2026-10-06-moves-phase-deliverable-quality-contract-coverage — Every deliverable a phase can generate is quality-assessed before it is served

## Release ID

`2026-10-06-moves-phase-deliverable-quality-contract-coverage`

## Status

`candidate`

## Plain-English Summary

Every client-facing document the product generates passes a quality contract before it is saved. The
contract reads the document's quality profile — who it is for, what decision it supports, which
exhibits it must carry, what it must never claim — and when the document does not clear the bar it
is held back as an internal draft instead of being served as client-ready.

The code that runs it says it always runs. It did not. The contract is run under a profile, and the
profile is found by looking the document's type up in the profile registry. When that lookup found
nothing, the whole stage was skipped: nothing was assessed, and the record was saved with its
"held back" flag false and its reason empty — which is exactly what a document that passed looks
like. So the one case the gate exists for, a document nobody checked, was indistinguishable
downstream from a document that cleared every check. The failure direction was the unsafe one.

Two of the twenty-one documents a phase can generate had no profile, and both are documents a phase
cannot be left without: one is required, together with the target architecture, to clear the design
phase's exit gate on the bounded process-change route, and the other is the design-to-outcome trace
that the same phase's traceability criterion reads. On the route where the build set is just the
architecture and the trace, half of what the phase generated was going out unassessed. Separately,
the same missing lookup meant the generation prompt was never told which exhibits the contract would
look for, so those two documents were also written without that instruction.

This change gives both documents a profile, so the contract now runs on them under the same
enforcement every other document already lives under, and the generation prompt now names the
exhibits each must carry. Neither profile requires a visual renderer: these are table-led governance
documents, and demanding rendered visuals would hold them back regardless of the enforcement
setting, which no other document of their kind is subject to. The required exhibits are taken from
each document's own declared sections — a decision exhibit and an open-inputs table for one, an
evidence-and-confidence table and an open-inputs table for the other — not invented.

It also adds the guard that was missing. The resolution the quality stage performs is now one shared
function rather than an expression inlined at the call site, and a new suite enumerates every
document key any phase can request, across every route shape the build set branches on, and fails if
any of them resolves no profile. A document type that can be generated but not assessed is now a
test failure rather than a silence.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves).** Two deliverable types gain a quality profile, so the quality
  contract and the required-exhibits instruction now cover them. No deliverable is added to or
  removed from any phase build set; no gate criterion, severity, or capture contract changes; no
  existing profile is modified.
- **Layers 1–3 — no impact.** No schema, adapter, canonical object, migration, or tenant data path
  is touched. No new query, table, or column is read or written.

## Client Applicability

- All clients: yes. The contract is tenant-agnostic and runs for every tenant.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none, and deliberately not. This brings two deliverables under an existing control
  rather than adding new behaviour, and putting the control itself behind a flag would preserve the
  unassessed path as the default. The consequence is bounded by the existing enforcement setting:
  where enforcement is off, the contract's result is recorded and nothing is held back, exactly as
  for the other nineteen deliverables; where it is on, these two can now be held back as internal
  drafts when they do not clear the bar. That is the intended effect and the main risk — see
  Rollback and Known Gaps.

## Changes Included

- `src/lib/deliverables/quality/deliverable-key-map.ts` — new exported
  `qualityContractDeliverableKey(...)`, the single definition of the registry-key-then-orchestrator-type
  resolution the quality stage performs, with the consequence of returning `undefined` stated at the
  definition. Two identity entries added to the orchestrator-type map for the two affected types,
  which is what makes the required-exhibits instruction resolve them.
- `src/lib/deliverables/profiles/types.ts` — the two keys added to the Moves deliverable key union.
- `src/lib/deliverables/profiles/registry.ts` — two profiles added, each registered and listed. Both
  derive audience, decision purpose, required exhibits, and acceptance checks from the deliverable's
  own registry specification. Neither sets a visual-renderer requirement, with the reason recorded
  above the pair.
- `src/lib/deliverables/orchestrator/persistence.ts` — the quality stage calls the shared resolver
  instead of inlining it, and the comment above it no longer claims the stage always runs: it now
  states what an unresolved key costs and names the guard that keeps the set total.
- `src/lib/programs/__tests__/phase-deliverable-quality-contract-coverage.test.ts` — new, 7 cases.
- `src/lib/deliverables/orchestrator/__tests__/prompt-story-spine.test.ts` — one case repointed. It
  used one of these two types as its example of a deliverable the contract does not cover; its
  subject is now an authored structure no phase key requests, which is genuinely uncovered, with the
  reason for the swap recorded in the case.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__ src/lib/programs/deliverables src/lib/deliverables`
  — 261 suites, 2988 tests, 3 snapshots.
- **PASS** — the ten other suites that name the two affected keys, the profile registry, or the
  profile map, run together with the reasoning-layer directory:
  `npx jest src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx src/__tests__/integration/programs/phase-capture-gate-routes.test.ts src/lib/agent/tools/__tests__/completeDeliverable.test.ts src/lib/reasoning/__tests__ src/lib/deliverables/__tests__/slide-contract.test.ts src/lib/deliverables/__tests__/adaptive-depth.test.ts`
  — 70 suites, 947 tests.
- **PASS** — the new suite, 7 cases: the enumeration still finds the route-only key the default
  build sets omit, which is this suite's premise; every key any phase can request resolves a
  contract key, listed by name on failure rather than counted; every such key also resolves from the
  orchestrator type, so the generation prompt can state the contract's exhibits; every resolved key
  has a profile with declared exhibits and at least one acceptance check; the resolver prefers the
  registry key's profile over the orchestrator type's; it falls back to the orchestrator type when no
  registry key is passed; and the two formerly-skipped types each resolve to themselves, carry at
  least one required exhibit, and do not require a visual renderer.
- **PASS** — baseline check: against the unfixed tree, 4 of the 5 totality cases fail and the
  failure names exactly the two types. The suite is not describing the fix it ships with.
- **PASS** — mutation check, 9 of 9 killed off a green baseline: drop either identity entry from the
  orchestrator-type map (2 failures each); drop either profile from the registry (2 each); empty
  either profile's required exhibits (1 each); collapse the suite's own route enumeration to the
  default shape (1); drop either arm of the shared resolver (1 each).
- **Diagnosed, not a gap**: dropping either resolver arm first survived. For every key the
  enumeration covers, both arms answer the same profile, so removing one changes nothing an
  enumeration over those keys can observe — a mutation with no behavioural difference rather than a
  missing assertion. Two cases that discriminate the arms directly were added, and both mutations
  then fail.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
  The key-union change compiles with no new entry required anywhere else: the three other records
  keyed by this union are all partial, each with its own declared conservative default.
- **PASS** — `npx eslint` on all six changed files, exit 0.
- **NOT RUN** — any signed-in walk, and in particular no generation of either deliverable against a
  real Move. The contract's verdict on real generated content for these two types is therefore
  unmeasured; see Known Gaps. This record is not live-proven.
- Coverage census regenerated on the merged tree: test files 2765 → 2767 and covered 2603, with
  uncovered unchanged at 164 — the evidence the new suite runs in CI rather than only locally. One
  of the two added files is this change's suite; the other arrived with a sibling merged while this
  branch was open. Measured in isolation on the unmodified base first, the regenerated counts
  matched the committed census exactly, so main was not stale before this branch — the first run in
  several where it was not. It went stale again on the merge, which is why the census was
  regenerated after merging and not before. The fence census is unchanged: no tenant-scoped file is
  added.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys the image. No migration,
no flag change, no Azure command, no data backfill, no write to any existing record. Already-persisted
documents of these two types are not re-assessed or re-labelled; the contract applies to generations
that happen after the deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: unchanged by this record; the merge deploy's own proof applies.
- Worker image invariant: unaffected — no worker job, image, or queue behaviour changes.
- Feature/env flag update path: not used. No flag, env var, or secret is added or changed.
- Live signed-in proof required: **yes** — generating each of the two deliverables on a real Move and
  observing the contract's recorded verdict, and that the design phase's exit gate still clears when
  the documents are sound. Until that walk this record is `candidate`, not `live-proven`.

## Rollback Plan

Revert the merge commit. That removes both profiles, both map entries, and the shared resolver, and
restores the previous expression at the call site, so the quality stage skips these two types again
exactly as before. Nothing is migrated and nothing is written, so no record created while this is
live becomes unreadable afterward.

The reason to revert is specific and worth naming: if enforcement is on and the contract holds back
one of these two documents, the design phase's exit gate cannot clear until the document clears the
bar, because that gate requires them to be signed off. That is the control working, not a defect —
but if it blocks a phase for a reason judged wrong, the narrower correction is to adjust the
offending profile's required exhibits rather than revert the coverage, since reverting returns both
documents to being served unassessed.

## Audit Evidence

- The PR for this branch and its CI run.
- The baseline check and the mutation table above, reproducible against the branch head.
- `docs/architecture/test-ci-coverage-census.json` — the covered/uncovered delta.
- `.github/workflows/ai-surface-control-catalog.yml`, step `Exercise the Programs unit suites` — the
  directory sweep that reaches the new suite, in a required status check.
- `.github/workflows/unit-suites.yml`, step `Run the green deliverables subtrees` — the sweep that
  reaches the profile registry's own suites. Not a required status check, which is why the new guard
  was placed in the Programs directory instead.

## Known Gaps

- **The guard proves a profile resolves, not that the contract's verdict is right.** It pins that
  every generatable deliverable reaches the contract. Whether the two new profiles' required
  exhibits and acceptance checks are the right bar for those documents is a product judgment,
  recorded in the profiles and not measured here. The first real generation of each is where that
  judgment is tested, and it has not happened.
- **The quality stage's call site is shared, not pinned.** Extracting the resolver means the guard
  exercises the same function the stage calls rather than a re-derived copy, so a change to the
  resolution reaches the guard. It does not pin that the stage still calls it: a change that stops
  calling the resolver, or re-inlines a different chain, would not fail this suite. Covering that
  needs a test over the persistence path itself, which was not taken here.
- **Nothing records that an assessment did not happen.** When no profile resolves, the saved record
  still carries a false held-back flag and an empty reason, indistinguishable from a pass. This
  change makes that state unreachable for the keys a phase can generate; it does not make the state
  self-describing for any other caller. An explicit not-assessed marker on the record would, and is
  the natural follow-on.
- **Two authored structures remain uncoverable by this guard.** Both are declared structures that no
  canonical phase key requests, so no phase can generate them and the guard's enumeration cannot
  reach them. One of them is now this change's example of a genuinely uncovered type. Whether they
  should be reachable at all is an open question carried from earlier work, unchanged here.
- **No signed-in proof.** See QA above.
