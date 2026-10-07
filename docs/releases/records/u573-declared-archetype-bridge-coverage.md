# 2026-10-07-u573-declared-archetype-bridge-coverage — a declared archetype reaches the requirement framework

## Release ID

`2026-10-07-u573-declared-archetype-bridge-coverage`

## Status

`candidate`

## Plain-English Summary

A Move declares what kind of work it is. That declaration is supposed to decide
which evidence the Move needs, which gaps count as hard, and what its readiness
score means — the operating model's first rule is that identity is declared,
never inferred.

Two different identifier spaces name the same archetypes. A person declares one
using a *discovery-blueprint* id (`governed_data_foundation`), and the
requirement framework is keyed by *registry* ids (`GOVERNED_DATA_FOUNDATION`). A
bridge between the two spaces already existed and already outranked every
guessing rule — but it held exactly **one** entry.

So of the five archetypes the declaration screen offers, one reached the
requirement framework by its declaration and four fell through to the keyword
guess. Measured, not assumed:

| Declared archetype id | Resolved to (before) | Correct? |
|---|---|---|
| `governed_data_foundation` | `GOVERNED_DATA_FOUNDATION` | yes — the one bridged entry |
| `ai_operations_customer_digital` | `AI_OPERATIONS_DECISION_SUPPORT` | yes, by coincidence |
| `general_default` | `AI_PRODUCT_DEVELOPMENT_LIFECYCLE` | yes, and it is the default |
| the contact-centre agent-assist blueprint id | `AI_PRODUCT_DEVELOPMENT_LIFECYCLE` | **no** |
| `financial_services_commercial_lending_agent_assist` | `AI_PRODUCT_DEVELOPMENT_LIFECYCLE` | **no** |

The two wrong answers have the same cause, and it is not a missing keyword: the
guessing rules spell their tokens with **spaces** (`contact center`,
`commercial lending`) and a blueprint id spells them with **underscores**. So a
Move that explicitly declared the contact-centre archetype was handed the
product-development-lifecycle requirement framework — the wrong required
evidence families, the wrong hard gaps, the wrong coverage score — in a
readiness report that rendered perfectly. The two that resolved correctly did so
because `operations` and the default happen to fall out of the same text; they
were right by incidental vocabulary, which is the condition the bridge exists to
remove.

This change completes the bridge for every archetype the declaration screen can
offer, and adds the guard that fails when a sixth is shipped without an entry.

Writing that guard surfaced a second, separate defect in the shared registry's
own lookup, which is also fixed here — see Changes Included.

## Layer Impact

**Release lane: `global-control-lane`.** Archetype resolution is shared
control-plane behaviour for every client, not feature-gated, not client-scoped,
and not a demo or internal-admin path.

- **Layer 3 — canonical model (read path).** The archetype a Move resolves to is
  what selects its required evidence families; this corrects that selection for
  two declarable identities and makes the other three independent of keyword
  matching. No canonical object, id, schema or migration changes.
- **Layer 4 — products.** Every surface that reads a Move's requirement
  framework is affected in the same direction, because all nine of them resolve
  the archetype through the single resolver this change feeds.
- Layers 1–2 untouched. No intake tab, source adapter, loader, ingestion job or
  tenant data is read or written. No migration, no worker job, no route change.

## Client Applicability

- All clients: yes. A Move that declared one of the two mis-resolved archetypes
  now gets the requirement framework it declared. Moves that declared the other
  three resolve to the same archetype as before.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The correction is unconditional, because shipping the
  right answer behind a flag would leave the declared-identity rule optional.

## Changes Included

- **Added** `src/lib/programs/archetypes/declared-archetype-bridge.ts` — the
  blueprint-id → registry-id map for all five declarable archetypes, plus
  `registryArchetypeIdForDeclaredId`. A module of its own, with string-literal
  values and no imports: the map has to be assertable against the shipped
  blueprint catalogue, which lives in the orchestrator's brief layer, and
  importing either side into the other would couple the two identifier spaces in
  the module graph — which is the separation this file exists to preserve.
- **Added** `REGISTRY_ARCHETYPES_WITH_NO_DECLARABLE_ID` in the same module: the
  two registry archetypes that no blueprint id names, each with the reason.
  Named explicitly so that adding a blueprint for one — or removing one — is a
  deliberate edit rather than silent drift in the guard's arithmetic.
- **Changed** `src/lib/programs/archetypes/registry.ts`: `archetypeForDeclaredId`
  now delegates to that module instead of holding a one-entry map inline. The
  registry-id arm still runs first and is unchanged, and a declaration naming
  nothing still returns undefined so the caller falls through to inference
  exactly as before.
- **Fixed, separately,** `getArchetype` in the same file. It indexed a plain
  object directly, so an id equal to an inherited key (`constructor`,
  `toString`) answered with a **Function typed as an archetype**. Every
  downstream read of `.id` or `.phases` on that value is `undefined`, so such a
  Move got a blank requirement framework rather than the intended fallback. The
  lookup now uses `Object.hasOwn`. This was found by a case written for the new
  module, not by inspection, and it is not reachable from the coarse archetype
  column (a database `CHECK` limits that to five values) — it is reachable from
  the declaration field, which is free-form JSON that this resolver reads
  without a catalogue check.
- **Added** `src/lib/programs/__tests__/declared-archetype-bridge.test.ts` — 18
  cases. Placed in that directory on purpose: it is swept wholesale by
  `npx jest src/lib/programs/__tests__` in
  `.github/workflows/ai-surface-control-catalog.yml`, so the suite needs no
  per-file registration and cannot be dark.
- **Regenerated** `docs/architecture/test-ci-coverage-census.json`.
- **Added** this release record.

## QA / Validation

**PASS** — `npx jest src/lib/programs/__tests__ src/lib/programs/archetypes/__tests__ src/lib/programs/discovery/__tests__ src/lib/deliverables/orchestrator/__tests__ --runInBand`

| Scope | Result |
|---|---|
| Clean base, before any edit | 217 suites / 2,583 tests, 0 failing |
| Source fix applied, new suite withheld | 217 suites / **2,583** tests, 0 failing |
| Full change | 218 suites / 2,601 tests, 0 failing |

The middle row is the honest and uncomfortable one: **the correction changes no
existing test's result in either direction.** No suite asserted the broken
resolution and none asserted the correct one — the behaviour was unpinned, which
is why a one-entry bridge could sit beside a five-entry declaration screen. The
new suite is the only thing that can now fail.

**PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`: **exit 0**,
no diagnostics. Judged on the exit code, not on a grep of the output: a bare run
can exit 134 on a V8 out-of-memory and emit no diagnostics, which a
`grep "error TS"` reports as clean.

**PASS** — `npx eslint` over the three changed/added source files: exit 0, no output.

**PASS — the suite can fail.** Eight mutations, each applied by a patcher that
refuses unless its pattern occurs exactly once in the target file, so a mutation
that silently edits nothing cannot be mistaken for a survivor. Every mutation
was reverted from a backup and the baseline re-verified green (18/18) afterwards.

| # | Mutation | Result |
|---|---|---|
| 1 | Drop the contact-centre bridge entry | **6 of 18 failed** |
| 2 | Drop the default-blueprint bridge entry | **5 of 18 failed** |
| 3 | Bridge lookup stops lower-casing the declared token | **1 of 18 failed** |
| 4 | Bridge lookup stops trimming the declared token | **1 of 18 failed** |
| 5 | Bridge lookup indexes the map directly instead of `Object.hasOwn` | **1 of 18 failed** |
| 6 | `getArchetype` indexes the registry directly (the pre-fix code) | **1 of 18 failed** |
| 7 | `archetypeForDeclaredId` stops consulting the bridge | **8 of 18 failed** |
| 8 | Remove one entry from the deliberately-undeclarable list | **1 of 18 failed** |

8 of 8 killed. Mutations 3–6 and 8 each kill exactly the one case written for
them, so no case is passing on a neighbour's assertion.

**Census.** `testFiles` 2808 → 2809, `coveredTestFiles` 2644 → 2645,
`pullRequestCoveredTestFiles` 2643 → 2644, and `uncoveredTestFiles` unchanged at
164. The covered count moving with the total while the uncovered count stays
flat is the proof that the suite is wired to a CI job rather than merely present.
`npm run audit:test-ci-coverage:write` then reports "committed census matches
this run". The tenancy-fence census needed no change: this release adds no route,
no handler and no tenant-scoped read.

## Rollout Plan

Merge to `main` via squash, auto-merge armed. The repo-owned ACA deploy workflow
builds and deploys the merge commit as it does every merge. No flag to enable,
no env var, no migration, no worker job, no data build. The behaviour change is
live when the merge commit is serving.

## Deployment Authority

Not required — this release cannot affect deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment
promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image or template change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof: **not claimed.** This record says `merged` and
  `deployed`; it does not say `live-proven`. Proving the corrected framework on a
  signed-in Move needs a declared Move to walk, which is a human-in-the-loop step
  outside this lane — see Known Gaps.

## Rollback Plan

Revert the merge commit. The change is two added source files, one added suite,
one added record, a regenerated census, and a self-contained edit to two
functions in the registry — no migration, no data, no runtime state, no flag to
unwind. Reverting restores the one-entry bridge and the bare-index lookups, so
the two mis-resolutions return; there is no partial-rollback hazard and no
ordering constraint against any other release.

## Audit Evidence

- `src/lib/programs/archetypes/declared-archetype-bridge.ts` — the map, with the
  measurement that motivated it recorded in the file header.
- `src/lib/programs/__tests__/declared-archetype-bridge.test.ts` — each case
  names what it pins. The first two are the guard: every id the declaration
  surface offers must be bridged, and every bridged id must name a real registry
  archetype.
- The mutation table above. Reproducible: apply the listed mutation and rerun
  `npx jest --runTestsByPath <the suite>`.
- The required CI checks on the pull request, including the job that sweeps
  `src/lib/programs/__tests__`.

## Known Gaps

- **A configured archetype still cannot be bridged.** The engine lets a
  deploying firm author archetypes of its own, and such an archetype gets a
  blueprint id that no shipped map can contain. It is offered by the declaration
  screen and resolves for generation, but it reaches the *requirement framework*
  only through the keyword guess — the same gap this release closes for the five
  shipped ids. Closing it properly means deriving the bridge from the effective
  catalogue rather than from a literal map, which is configurable-engine work and
  is deliberately not started here.
- **The two mis-resolutions are corrected but not walked.** No signed-in Move
  declaring either archetype was taken through its phases to observe the
  corrected requirement framework on screen. That needs an authorized user and a
  declared Move, which this lane does not create or advance.
- The guard asserts the shipped catalogue with no configured source declared. A
  firm-authored source that *replaces* a shipped archetype keeps the shipped id,
  so the guard still passes for it — correct, but it means the guard measures id
  coverage, not label or evidence-family agreement.
- `getArchetype`'s inherited-key defect is fixed at the lookup. The resolver that
  reads the declaration field still does not validate that field against the
  catalogue before passing it on; it now fails closed instead of answering with a
  Function, which is a containment rather than a validation.
