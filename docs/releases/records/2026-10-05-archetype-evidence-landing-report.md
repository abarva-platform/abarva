# 2026-10-05-archetype-evidence-landing-report — Measure where an archetype's evidence lands

## Release ID

`2026-10-05-archetype-evidence-landing-report`

## Status

`candidate`

## Plain-English Summary

A deliverable's structure says which of its sections assert facts about the
client. A use-case archetype says which families of evidence that kind of work
needs. Something has to connect the two — to decide which sections get told
"ground this in the client's evidence of these kinds".

Until recently that connection was guessed from how a section's key was spelled,
and the previous release let a structure name its landing sites instead. What it
could not do was say how much of the problem was left. Nothing reported, for a
given deliverable, how many of its client-fact sections actually end up grounded
in the archetype's evidence and how many do not.

This release adds that report, and uses it twice.

First, it reads the brief the product actually serves rather than the
declaration. That distinction matters: two deliverable types are built by their
own dedicated builders, which never consult the declaration at all, so a landing
site declared on one of them would have no effect and nothing would say so.

Second, the report makes one rule enforceable: a deliverable either takes an
archetype's shaping or it takes none. Taking the archetype's exhibits and tables
while grounding none of its sections is exactly the silent state the previous
release found, and a new deliverable whose section keys happen to match nothing
would land straight back in it. That is now a failing test rather than a quiet
gap.

The report then showed three deliverables still grounding only one of five to
seven client-fact sections where more of them plainly assert client facts: the
discovery report's maturity and gap findings, the traceability matrix that maps
requirements to the evidence behind them together with its open-gaps section, and
the value model's benefit pools. Those four sections are now declared landing
sites. The remaining ten deliverables that still ground exactly one section are
pinned by name in the suite, so the next slice has a list rather than a count and
closing any of them must shorten it.

No flag, no migration, no route, no component, no stored artifact, and no change
to what any existing landing site already did.

## Layer Impact

Lane: `global-control-lane` — shared product behaviour for all clients, additive
and not feature-gated.

- **Layer 4 (Products — Moves, Source):** the generation brief for three
  deliverable types now names more sections as needing the archetype's evidence
  families. This changes what the model is asked to ground, never what the
  numbers are: the deterministic read models still own every figure.
- **Layers 1–3:** untouched. No intake tab, adapter, canonical object, schema,
  migration or tenant-scoped read path is involved. `audit:tenancy-fence-coverage`
  reported no change.

## Client Applicability

- All clients: yes, for the generation brief of three deliverable types. The
  change is additive — sections that were grounded stay grounded.
- Specific clients: none.
- Internal only: the report function itself; it is read by the test suite, not
  by a product surface.
- Public/demo only: no.
- Feature flag: none. The change is additive and the shared flag registry is the
  base of several other open changes in this area.

## Changes Included

- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` —
  `archetypeEvidenceLandingReport`, appended. It takes a real request minus the
  module and deliverable type, resolves every shipped structure through
  `getArtifactBrief`, and reports per deliverable: the sections that assert
  client facts, which of them are grounded in the archetype's families, which
  are not, whether anything landed at all, and whether the archetype's exhibits
  and tables were withheld too.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — four
  `archetypeEvidenceSectionKeys` entries across three structures, each with the
  reason it is a client-fact section and not judgment.
- `src/lib/deliverables/orchestrator/__tests__/archetype-evidence-landing.test.ts`
  — 19 cases added to the existing CI-wired suite (14 → 33).

No new module and no new test file, so no catalog entry and no census change.

## QA / Validation

Lane: `global-control-lane` (shared product behaviour, additive).

| check | result |
|---|---|
| `npx jest …/__tests__/archetype-evidence-landing.test.ts` | **PASS** — 33 tests |
| `npx jest src/lib/deliverables/orchestrator/__tests__` (whole directory) | **PASS** — 46 suites, 560 tests (main: 541) |
| `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit code 0 |
| `npx eslint` on the three changed files | **PASS** — exit code 0 |
| `npx prettier --check` on the changed files | **PASS** for the registry; the other two already warned on `main` and the diff is insertions only, with no pre-existing region reformatted |
| `npm run audit:lib-orphans` | **PASS** — no change against the baseline; the report sits in a module a product entry point reaches |
| `npm run audit:test-ci-coverage:write` | **PASS** — no change ("committed census matches this run"); the cases went into a suite already wired to a CI job |
| `npm run audit:tenancy-fence-coverage:write` | **PASS** — no change |
| `npm run release:check -- --base origin/main --head HEAD` | **PASS** — 11 of 11 gates |
| live signed-in walk | **NOT RUN** — see Known Gaps |

**Mutation testing: 12 mutations, 9 killed, 3 diagnosed as false survivors.**

Killed (failing cases per mutation, against a 33-test baseline): `landsNowhere`
forced false — 3; the negation dropped from the assets-withheld reading — 1; the
fact-asserting filter removed so every section counts — 1; the report reading the
structure's own sections instead of the brief that is served — 2; the empty-pack
guard dropped so a deliverable with no pack reads as fully grounded — 1; each of
the three new declarations removed — 2, 2, 2; one of the two keys dropped from
the two-key declaration — 1.

The three survivors are one class, and they are equivalent rather than
untested: weakening "all of the archetype's families" to "any of them", reading
only the exhibits instead of the exhibits and tables, and dropping the tables
from the asset key set. They cannot be observed because the archetype's
contribution is all-or-nothing — the families are written onto a landing site as
one set, and the exhibits and tables are gated together. Rather than report that
as untested coverage, the property that makes the mutations equivalent is now
asserted directly: a case counts every partial family contribution and every
partial asset contribution across all archetypes and all shipped structures,
requires both to be zero, and requires the full cases to be non-zero so the
claim is not vacuous. If a partial contribution ever becomes possible, that case
fails and those three mutations become killable.

One earlier survivor was removed rather than defended: the assets-withheld
reading was first written as two conditions joined with `&&`, and flipping it to
`||` changed nothing because no served brief carries one kind of archetype asset
without the other. It is now a single membership test over both, which is the
same semantics with no unobservable operator in it.

## Rollout Plan

Merge to `main` by squash. No migration, no runtime configuration change, no
image deploy needed for the change to be correct. It takes effect for the next
generated artifact of the three affected deliverable types through the normal
deploy of `main`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No `az containerapp` command, no
  traffic weight, no template edit.
- Approved image digest: not applicable — no runtime update is part of this
  release.
- ACA runtime invariant: unchanged; this release asserts no `live-proven` claim.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: no flag added or changed.
- Live signed-in proof required: no for this merge — nothing renders differently
  until an artifact of one of the three types is generated. Yes before any claim
  that the richer grounding improved a generated artifact.

## Rollback Plan

Revert the squash commit. Narrower options, each safe on its own: delete any one
structure's `archetypeEvidenceSectionKeys` entry to put that deliverable back on
the spelling rule, or delete the report function and the cases that read it.
There is no migration, no data write and no stored state, so a revert is
complete and immediate.

## Audit Evidence

- PR: this change's pull request against `main`.
- CI: the required checks on that PR, including the unit-suite job that runs
  `src/lib/deliverables/orchestrator/__tests__`.
- The suite itself is the evidence for the measurement: the list of deliverables
  still grounding exactly one section is pinned by name, so the inventory is
  checked on every run rather than written down once.

## Known Gaps

- **Ten deliverables still ground exactly one client-fact section**, nine of
  them with six or seven such sections. They are pinned by name in the suite.
  Whether each remaining section should carry an archetype's baseline evidence is
  a judgment per deliverable, not a rule, which is why they were left rather
  than swept.
- **Three deliverables ground none on purpose** — an authorization instrument
  that must not pre-empt the next phase's evidence, a facilitation template, and
  the discovery plan, which is grounded from the other archetype catalog
  instead. The report states this; it does not justify it.
- **The two archetype catalogs use disjoint evidence-family vocabularies.** The
  plan builder grounds its evidence-request section in one catalog's family ids
  while the artifact packs contribute an unrelated set, and no dictionary relates
  them. Nothing validates either against a vocabulary. That is the next
  correctness item in this area and is deliberately not attempted here.
- **A landing site declared on a type served by its own builder would be inert.**
  The report exposes it and a case records it, but nothing refuses the
  declaration at authoring time.
- **No signed-in walk.** This release is not `live-proven`. The deploy queue was
  churning at run start (a deploy queued inside the same minute), which is the
  same reason the walk has been deferred on recent runs in this lane.
