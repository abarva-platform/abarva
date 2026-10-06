# 2026-10-06-moves-archetype-config-preflight — an operator can see which configured archetypes actually take effect

## Release ID

`2026-10-06-moves-archetype-config-preflight`

## Status

`candidate`

## Plain-English Summary

A deploying firm can configure the discovery archetypes the Moves engine uses
by declaring a JSON source, without shipping code. The loader already tells the
operator that the source validated and lists the archetype ids it `applied`.
That list is not enough to act on, because three different things look
identical in it:

1. **An override and an addition are one typo apart.** A configured entry whose
   id matches a built-in archetype replaces it. An entry whose id does not match
   adds a new one. `applied` names both the same way — so a source written to
   override a built-in archetype, with a single character wrong, adds a second
   archetype instead and still reports as applied.
2. **An added archetype is inert.** It joins the effective catalog, but archetype
   resolution runs against the built-in catalog and a configured source is
   applied as an override only. Nothing can declare an added archetype, so it
   collects no evidence and shapes no deliverable. `applied` reports it exactly
   as it reports one that is live.
3. **The same id twice in one source is accepted.** The later entry silently
   replaces the earlier one, and `applied` lists the id twice.

Each of those is a declaration that validated and then did not do what its
author meant, with nothing anywhere saying so.

This release adds a read-only preflight that says so, and an operator command
that prints it. For each entry in a declared source it reports whether the entry
**overrides** a built-in archetype, **adds** one that nothing can declare yet, or
is **replaced** by a later entry with the same id — and for an addition, the
built-in id it nearly matches, when one is within two characters, so a typo is
visible as a typo. A single verdict is exported for a deploy step to gate on.

Nothing about generation changes. The preflight reads the same source the
generation path reads and reports on it; it writes nothing, touches no tenant
data, needs no credentials, and no product surface consumes it yet.

The report is derived entirely from the loader's own output — the effective
catalog and `applied`, in the loader's own order — so it cannot drift from the
behaviour it describes. It parses nothing itself and opens no file the loader
did not already open.

**The reachability claim is checked, not asserted.** The suite does not merely
state that an added archetype is unreachable; for each of the three outcomes it
runs the real resolver (`resolveConfiguredDiscoveryBlueprint`) and asserts what
comes back. If a later change makes an added archetype reachable by declaration,
those cases fail and force this report to be corrected with it, rather than
leaving a stale warning in front of an operator.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated. The lane is global because the module ships for every deployment;
the behaviour it reports on is inert for every deployment that declares no
configured source, which is all of them today.

- **Layer 4 — Products (Moves).** One new pure reporting module and one
  read-only operator command. No product route, page, component, or API response
  changes. No generated artifact changes.
- **Layers 1–3 — unaffected.** No intake tab, source adapter, schema, migration,
  loader, or canonical record is touched. No metric, fact, or stored number is
  read or written.

## Client Applicability

- **All clients: no visible change.** The preflight is an operator tool. It is
  not reachable from any signed-in surface and no client-facing output passes
  through it.
- **Deployments that declare no configured archetype source: no change at all.**
  The new module short-circuits before any filesystem call when the environment
  variable is absent, exactly as the loader it wraps already does. Every
  deployment is in this state today.
- **A deployment that later declares a source:** the preflight is the thing that
  tells the operator whether that source does what they meant, before they rely
  on it.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-config-preflight.ts` —
  new. `preflightArchetypeConfig`, `archetypeConfigPreflightPasses`,
  `formatArchetypeConfigPreflight`, `nearestShippedArchetypeId`.
- `scripts/moves/archetype-config-preflight.ts` — new. Read-only operator
  command; prints the report and exits non-zero on a source that does not do
  what it looks like it does.
- `package.json` — new script `moves:archetype-config-preflight`.
- `src/lib/deliverables/orchestrator/__tests__/archetype-config-preflight.test.ts`
  — new, 27 cases, in a directory already named by
  `.github/workflows/unit-suites.yml`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No existing source file is modified. In particular no file touched by an open
pull request in this lane is modified, so this release adds no conflict surface.

## QA / Validation

Lane: `global-control-lane`. All runs local, on this branch, off `origin/main`
at `91d90ad59f`.

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__/archetype-config-preflight.test.ts`:
  27 of 27 cases.
- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__` (the whole
  CI-wired directory, which is the scope a change inside this module can affect):
  53 suites, 684 tests, 0 failures.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit code 0.
- **PASS** — `npx eslint` on all three new files, exit code 0.
- **PASS** — `npm run audit:lib-orphans`: "No change against the baseline". The
  new module is reached by an operator entry point, so it is classified as
  operator tooling rather than as a module only its own test reaches.
- **PASS** — mutation testing, 12 mutations, 12 killed, each run over the whole
  `__tests__` directory. Classifying against the effective catalog instead of
  the built-in one (4 failures), removing the duplicate detection (2), reporting
  an addition as reachable (3), reporting the first duplicate as the winner (2),
  attaching a near-miss to an override (1), dropping each of the three verdict
  conjuncts (1 each), dropping the carried errors (1), and printing an
  undeclared source the same as a rejected one (1).
- **PASS** — the near-miss threshold is pinned at its own boundary, after a first
  pass where it was not. Loosening it from two to eight initially killed nothing,
  because the built-in ids are separated by sixteen edits and any threshold below
  that behaves identically on them. The corpus headroom was the wrong thing to
  test. A case now asserts that two characters of damage still matches and three
  does not, which kills loosening to either three or eight.
- **PASS** — operator command executed against three hand-written sources: none
  declared (exit 0), a declared source mixing a one-character typo with a
  duplicated id (exit 1, both named in the output), and a declared path that does
  not exist (rejected, exit 1).
- **NOT RUN** — live signed-in walk. Nothing here renders on a signed-in surface,
  so no walk could prove or disprove it.
- **NOT RUN** — `npm run docs:nexus-manual`. No flag registry entry is added,
  removed, or re-scoped.

**Census attribution.** The committed census moves `testFiles` 2724 → 2726 and
`coveredTestFiles` 2560 → 2562, which is more than the one test file this release
adds. Measured rather than assumed: regenerating with this release's test file
temporarily removed yields 2725 / 2561, so one of each is this release's and one
of each is drift from other merges that the committed census had not yet picked
up — the drift guard runs on branches only.

## Rollout Plan

- Merge to `main` by squash merge once required checks pass. No staged rollout,
  no flag, no tenant enrolment.
- The behaviour is available from the moment it merges, and does nothing until an
  operator runs the command or a deploy step calls the verdict.
- No data build, no migration, no backfill, and no job run is part of this
  release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This
  release requests no out-of-band deploy.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift,
  no revision weight change, and no Container App template edit is part of this
  release.
- Approved image digest: not applicable — no runtime image is pinned, replaced,
  or promoted by this release.
- ACA runtime invariant: unchanged. The invariant is neither asserted nor altered
  here; the next main deploy proves it as usual.
- Worker image invariant: unchanged. No worker job image, schedule, or argument
  is touched.
- Feature/env flag update path: not applicable. No flag registry entry and no
  environment variable is added, removed, or re-scoped. The environment variable
  the preflight reads is the one an earlier release already shipped; this release
  only reads it.
- Live signed-in proof required: no, for this release. The change is not visible
  on any signed-in surface, so no walk can prove or disprove it.

## Rollback Plan

- **Revert the squash commit.** The release is four new files plus one
  `package.json` line and the regenerated census. Nothing imports the new module
  except the new operator command, so reverting removes it cleanly with no
  dangling reference.
- **No data rollback is possible or needed.** Nothing is written: no row, no
  blob, no file, no cache entry, no stored number.
- **No runtime action.** No revision, traffic weight, image, flag, or environment
  variable has to be changed to roll this back.
- **Partial rollback, if the operator command is the problem and the report is
  not:** delete `scripts/moves/archetype-config-preflight.ts` and its
  `package.json` line. The module remains correct and tested, but it would then
  be reached by no entry point, so `audit:lib-orphans` would report a new orphan
  — expect that, and either re-point it at another caller or revert the whole
  release instead.

## Audit Evidence

- Branch: `moves/archetype-config-preflight-20261006`, off `origin/main` at
  `91d90ad59f`.
- Test suite: `src/lib/deliverables/orchestrator/__tests__/archetype-config-preflight.test.ts`,
  27 cases, in a directory `.github/workflows/unit-suites.yml` already names.
- `npm run release:check -- --base origin/main --head HEAD` run locally before
  the pull request was opened.
- The three outcomes are each pinned against `resolveConfiguredDiscoveryBlueprint`,
  so the report's claims are checked against the resolver rather than restated.

## Known Gaps

- **The addition is still inert; this release only says so.** Making a
  configured archetype reachable by declaration means changing declared matching
  to run against the effective catalog, which lives in the one module that is
  the shared edit surface of several open pull requests in this lane. It is left
  for a slice that can take that file without a four-way conflict. The artifact
  pack half of the engine already resolves against whichever catalog it is
  handed, so only the discovery half carries this gap.
- **The duplicate is still accepted, not refused.** The artifact pack contract
  refuses a duplicate id inside one configured source at the array level. The
  discovery contract does not, and adding the refusal means editing the same
  shared module. Until then the preflight reports the collision instead.
- **The near-miss detector is a heuristic.** It fires within two edits of a
  built-in id and nowhere else. Measured against the five built-in ids, the
  closest pair of them is sixteen edits apart and the three plausible new names
  tested are twenty or more from the nearest, so there is wide headroom today —
  but a deployment that adds many archetypes with similar names would narrow it,
  and the threshold would then want revisiting rather than loosening.
- **The verdict has no caller in CI.** `archetypeConfigPreflightPasses` is
  exported and tested, and the operator command exits on it, but no workflow
  gates on it, because no deployment declares a configured source yet. Wiring it
  into a deploy step is the natural follow-on once one does.
- **The report covers the discovery half only.** The artifact pack half has its
  own declared path and its own effective catalog, landing in a separate open
  pull request in this lane. A preflight that reports both halves in one view is
  the follow-on once that is on `main`.
- **Not memoised.** The preflight re-reads the declared source on each call, as
  the loader it wraps does. For a command run by hand that is correct; a caller
  on a hot path would need a staleness story first.

