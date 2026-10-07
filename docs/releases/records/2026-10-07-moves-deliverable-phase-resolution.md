# 2026-10-07-moves-deliverable-phase-resolution — a deliverable's phase resolves from either spelling of its key

## Release ID

`2026-10-07-moves-deliverable-phase-resolution`

## Status

`candidate`

## Plain-English Summary

Every per-phase Moves deliverable has two names for the same document: the
registry key the product holds (`handoff_package`) and the orchestrator
`deliverableType` the generation path maps it onto (`handoff_pack`). For fifteen
of the twenty canonical deliverables the two names are identical. For five they
are not — the operating-model design, the execution roadmap, the financial model,
the metrics plan, and the handoff package. Four of those five sit in the last two
phases.

The helper that answers "which phase does this deliverable belong to" compared
the key it was given against the orchestrator name only. Hand it a registry key
for one of those five and it matched no deliverable at all, so the set of
candidate phases came back empty, and the "not exactly one phase" branch returned
nothing — the same answer the helper gives for a genuinely ambiguous key. Its own
documentation said it accepted "a registry or orchestrator key". It accepted one
of the two.

That answer is a hard stop at both of the places that ask. The generation API
refuses the request outright with a 422. The queue worker completes the run as
`blocked`. Both report the same code — the phase could not be resolved — so the
deliverable does not generate and the reader is told nothing about why the two
spellings mattered.

This change makes the lookup match a deliverable when *either* of its two names
is the one asked about. Measured over every key the registry can produce — 27
distinct names, deprecated entries included — the widened rule resolves all 27
and creates no case where two phases compete. It is a strict superset: every
answer that was already a phase is the same phase, and the five that were nothing
become the phase they are declared in.

**What this change does not claim.** Neither caller is reachable with a registry
key today, and that is stated rather than glossed: all three paths that enqueue a
generation run set the phase on the job payload explicitly, so the worker's
fallback is not currently entered; and the one component that posts to the
generation API is mounted by nothing. The protection was incidental, not
structural — it rested on three call sites each remembering to pass a field, and
on a component staying unmounted. The natural thing for a caller to hold is the
registry key: both the phase-generation route and the documents panel start from
`spec.deliverableTypeKey` and translate it themselves. This removes the trap
rather than a live outage, and the measurement is the point of the release.

## Layer Impact

**Release lane: `global-control-lane`.** The lookup is shared control-plane
behaviour for all clients and is not feature-gated, not client-scoped, and not an
internal-admin or demo path.

- **Layer 4 — products.** The Moves phase-deliverable generation path. The
  resolution a deliverable key receives is widened; nothing about how a
  deliverable is generated, briefed, or rendered changed.
- Layers 1–3 untouched. No intake, adapter, canonical-model, schema, migration,
  projection, or tenant-data change. The new module reads no tenant data: it is
  given the deliverable specs, a normalizer, and the alias resolver as arguments.

## Client Applicability

- All clients: the lookup is widened for every client. No client sees a behaviour
  change today, because neither consumer is reachable with the keys that were
  failing (see Plain-English Summary).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The old answer for these five keys was a refusal, not a
  behaviour worth preserving behind a flag.

## Changes Included

- **Added** `src/lib/programs/deliverable-phase-resolution.ts` —
  `canonicalPhaseForDeliverableKey`. Parameterised on the specs, the normalizer,
  and the alias resolver rather than importing them, so the rule can be exercised
  against a constructed registry. That is not decoration: the case that must keep
  returning nothing — two deliverables disagreeing about the phase — does not
  exist in the shipped registry and cannot be written without a constructed one.
- **Modified** `src/lib/programs/orchestrated-deliverable-map.ts` —
  `phaseForOrchestratorDeliverableType` now delegates to that module. The body is
  the delegation and nothing else, so there is no second copy of the rule. Its
  doc comment now states which spellings it accepts and what a caller gets when
  the answer is nothing, because the previous comment promised both and delivered
  one.
- **Added** `src/lib/programs/__tests__/deliverable-phase-resolution.test.ts` —
  22 cases. The directory is swept wholesale by `npx jest
  src/lib/programs/__tests__` in `.github/workflows/ai-surface-control-catalog.yml`,
  so the suite needs no per-file registration and is not dark.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`. See QA.
- **Added** this release record.

## QA / Validation

| Check | Result |
|---|---|
| `npx jest src/lib/programs/__tests__/deliverable-phase-resolution.test.ts` | **PASS** — 22 of 22 |
| `npx jest src/lib/programs/__tests__ src/lib/deliverables --runInBand` | **PASS** — 274 suites / 3,241 tests, 0 failing |
| `npx jest` over both consumer suites (generation route, queue worker) | **PASS** — 2 suites / 22 tests, 0 failing |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| `npx eslint` over the three touched source files | **PASS** — exit 0, no output |
| `npm run audit:tenancy-fence-coverage:write` | **PASS** — no change; the module reads no tenant data |
| Live signed-in walk | **NOT RUN** — see Deployment Authority |

The two consumer suites were run deliberately rather than assumed: both name the
lookup, and a suite pinning the old empty answer for one of the five keys would
have been the signal that the refusal was intended behaviour. Neither does.

Typecheck judged on the exit code, not on a grep for diagnostics — a bare `npx
tsc` exits 134 on this host under V8 OOM and emits nothing, which reads as clean.

**The suite can fail.** Seven mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file, so a mutation that
silently edits nothing cannot be mistaken for a survivor. Every mutation was
restored from a pristine copy and the suite re-verified at 22 of 22 afterwards.

| # | Mutation | Result |
|---|---|---|
| 1 | Drop the registry-spelling match — the defect this release fixes | **10 of 22 failed** |
| 2 | Drop the orchestrator-spelling match | **10 of 22 failed** |
| 3 | `phases.size === 1` → `>= 1`, so an ambiguous key is handed a phase | **1 of 22 failed** |
| 4 | Drop the empty-key guard | **1 of 22 failed** |
| 5 | Drop the normalizer on the registry spelling | **1 of 22 failed** |
| 6 | Drop the normalizer on the orchestrator spelling | **1 of 22 failed** |
| 7 | The delegation passes identity in place of the alias resolver | **6 of 22 failed** |

Mutation 7 is the one worth naming: it mutates the *caller* in the shared file,
not the new module, and it is what proves the production binding is wired to the
real alias resolver rather than the suite re-assembling the call itself.

Mutation 4 survived a first draft. The empty-key guard is unobservable against a
well-formed registry — no deliverable normalizes to the empty string, so the key
fails to match on its own and the answer is nothing either way. The case was
rewritten to supply a malformed spec whose key *is* empty, which is the only
state in which the guard is the thing returning nothing. A guard whose removal
changes no output is not covered by a test that would pass without it.

**Census.** `testFiles` 2803 → 2806 and `coveredTestFiles` 2639 → 2642, with
`uncoveredTestFiles` unchanged. One of the +3 is this suite; the other +2 are
inherited — `main`'s committed census was already two counts behind its own tree
when this branch was cut, which is measured here rather than absorbed. The
`uncoveredTestFiles` count holding flat is the proof the new suite is executed by
a CI job rather than merely present. Two other pull requests in flight carry a
census hunk over the same lines; if this one lands after them the committed file
is restored from `origin/main` and regenerated rather than merged by hand.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA deploy workflow builds and deploys
the merge commit as it does every merge. No flag to enrol, no env var, no
migration, no worker-job change, no staged rollout: the change is a widened pure
lookup, and the keys it newly resolves were previously refused.

## Deployment Authority

Not required. This release touches no Azure Container Apps resource, deploy
workflow, runtime image, feature flag, environment variable, worker job
definition, traffic weight, DNS record, or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable — the queue worker's *code* changes
  behaviour only on a path it does not currently enter, and its image is built by
  the same repo-owned workflow.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof: **not claimed**. This release is `candidate`, not
  `live-proven`. The change is not observable on a signed-in surface today, for
  the reason given in the Plain-English Summary, so a walk would prove nothing
  about it. The end-to-end walk the Moves workstream owes is a separate,
  human-in-the-loop step and is unaffected either way.

## Rollback Plan

Revert the merge commit. That restores the orchestrator-only comparison, which
re-introduces the empty answer for the five aliased registry keys and nothing
else — no migration to unwind, no data written, no runtime state, no flag to
unset. The new module has exactly one caller, so the revert cannot leave a
dangling consumer. There is no partial-rollback hazard.

## Audit Evidence

- `src/lib/programs/deliverable-phase-resolution.ts` — the rule, with the
  measurement that justifies widening it recorded in the header comment.
- `src/lib/programs/__tests__/deliverable-phase-resolution.test.ts` — the 22
  cases, including the one that asserts the five aliased keys *are* exactly the
  canonical keys whose two spellings differ. That case is the guard against the
  list in this record going stale: adding a sixth alias to the map without
  listing it fails the suite.
- The case that walks every canonical key under both spellings and asserts its
  declared phase, and the case that asserts no key the registry can produce is
  left unresolvable — the two measurements this record quotes, run as assertions
  rather than written down.
- The mutation table above, reproducible by applying each listed mutation and
  rerunning the suite.
- CI on the pull request: the required check that runs
  `npx jest src/lib/programs/__tests__`.

## Known Gaps

- **Neither consumer is reachable with a registry key today, so this fixes a trap
  and not an outage.** Stated in full under Plain-English Summary rather than
  implied. Nothing here makes the component that posts to the generation API
  reachable, and mounting it to make the fix observable would be the wrong move.
- **The component that posts to the generation API is mounted by nothing.**
  Whether it should be given a host or retired is a separate product question and
  is not touched here.
- **The worker's phase fallback stays a fallback.** It is entered only when a job
  payload carries no phase, and all three enqueue paths set one. The widened
  lookup makes that fallback correct if it is ever entered; it does not make the
  payload field optional, and the stronger fix — requiring the phase on the
  payload type so the fallback can be deleted — is not attempted here because it
  changes a shared payload contract three routes construct.
- **The alias map itself is unchanged.** Whether five of twenty canonical
  deliverables *should* carry a second spelling is an editorial question about
  that map, not a defect, and collapsing it would change which brief each of the
  five generates with. The suite pins the current five so a sixth cannot be added
  silently.
