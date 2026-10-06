# 2026-10-05-archetype-config-reaches-generation — a configured archetype now changes what gets generated

## Release ID

`2026-10-05-archetype-config-reaches-generation`

## Status

`candidate`

## Plain-English Summary

A deploying firm can author its own Move "archetype" — the list of evidence a
discovery asks the client for, and the interview roster that goes with it — as a
JSON file instead of shipping code. The contract for that file, and the loader
that validates it and merges it over the built-in set, already existed.

Nothing supplied a file to the loader, and nothing read the merged result. Every
generation path resolved its archetype straight out of the built-in set. So an
operator could write a correct configuration, watch it validate, and watch
generation ignore it completely. "Configurable without code" was authorable and
inert.

This closes both ends of that seam:

- **Supply.** An operator declares the configuration by setting one environment
  variable to a file path. Identity is declared, never inferred: there is no
  search for a config file, no convention path, no directory scan. With the
  variable unset the code performs no filesystem access at all and the built-in
  set is returned unchanged.
- **Consumption.** Both discovery-plan brief builders — the generic one and the
  module-specific one, which resolved an archetype separately and so could each
  go un-wired on its own — now pass their resolution through the configured
  source before using it.

One rule decides what a configuration does: **a configured entry whose id
matches the archetype that resolution already chose replaces it.** That is an
override of a shipped archetype, and it needs no change to how a declared
archetype is matched. Reaching a brand-new configured archetype by declaration
is a different rule and is deliberately not included — see Known Gaps.

The change also separates two states an operator previously could not tell
apart. A configuration that is absent and a configuration that is present but
unreadable or invalid both leave the built-in set in force, so they look
identical in generated output. They are now reported distinctly
(`not_configured` vs `rejected`), because an operator who cannot tell them apart
reads a typo as "configuration does nothing".

## Layer Impact

Release lane: `global-control-lane` — shared product behaviour for all clients,
additive and inert without an operator-declared configuration.

- **Layer 4 (Products).** Code-only. The brief handed to the model for a
  discovery plan can now reflect an operator-authored archetype. With no
  configuration declared the brief is byte-identical to today's.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, read model,
  metric or fact is touched. Nothing here calculates a value.
- **Layers 1–2 (Intake, adapters).** Unchanged.

## Client Applicability

- All clients: no behavioural change. The configuration variable is unset in
  every environment, so every resolution is the built-in one it was before.
- Specific clients: none.
- Internal only: the new capability is available to an operator who declares a
  configuration path on a deployment.
- Public/demo only: no.
- Feature flag: none. The gate is the absence of the declaring environment
  variable, which is also what makes the change additive. A flag was
  deliberately not added: the registry file that holds flags is being edited by
  concurrent work, and a flag would add a merge collision while gating something
  the unset variable already gates.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/archetype-config-source.ts` — new.
  Resolves the declared configuration source, builds the effective catalog over
  the built-in set, reports its state, and applies the one override rule.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — both
  discovery-plan builders resolve through the configured source.
- `src/lib/deliverables/orchestrator/__tests__/archetype-config-source.test.ts`
  — new, 16 tests, in a CI-wired suite directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Lane: `global-control-lane` (shared product behaviour, additive and inert
without an operator-declared configuration).

- **PASS** — `npx jest src/lib/deliverables/orchestrator/__tests__` — 46 suites,
  543 tests. The whole directory was run, not only the related suites, because
  this change edits a host two builders share.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json
  --noEmit` — exit code 0.
- **PASS** — `npx eslint` on all three changed source files — exit code 0.
- **PASS** — `npm run audit:lib-orphans` — no change against the baseline. The
  new module is reached by a product entry point, not only by its own test.
- **PASS** — `npm run audit:test-ci-coverage:write` — `coveredTestFiles`
  2550 → 2551 with `uncoveredTestFiles` unchanged, which is the proof the new
  suite is actually wired into a CI job rather than sitting in a dark directory.
- **PASS** — `npm run audit:tenancy-fence-coverage:write` — no change (no
  tenant-scoped data path is touched).
- **PASS** — mutation testing, 7 mutations, all killed (failures per mutation:
  1 / 1 / 1 / 1 / 4 / 1 / 2 of 16). Each wiring line removed independently;
  the override keyed on catalog membership instead of what was applied; an
  unreadable source reported as absent; the blank/undeclared short-circuit
  dropped; an invalid source reported as in effect; the override-happened flag
  forced true.
- **NOT RUN** — live signed-in walk. Not applicable: with no configuration
  declared there is nothing observable to walk, and declaring one on a shared
  runtime is out of this lane's authority.

One mutation initially survived and the test was wrong, not the code. The
override guard looked redundant because the argument is normally one of the
built-in objects, so indexing by id returns that same object. The scenario that
separates them is a blueprint assembled elsewhere that carries a built-in id:
keyed on membership, an unconfigured deployment silently replaces it with the
built-in entry. The test now asserts that case and the mutation dies.

## Rollout Plan

Merge to `main` by squash. No migration, no runtime configuration change, no
image deploy required for this to be correct — it ships inert. A deployment that
wants to use it sets the declaring environment variable to a readable JSON path
through the repo-owned deploy workflow, after which the ACA runtime invariant
and a live signed-in proof apply to that deployment, not to this merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  path that may shift shared web traffic.
- Shared runtime mutators: none in this change. No `az containerapp` command,
  no traffic weight, no template edit.
- Approved image digest: not applicable — no runtime update is part of this
  release.
- ACA runtime invariant: unchanged; this release asserts no `live-proven` claim.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: no flag added. If a deployment later declares
  the configuration variable, that env update must go through the repo-owned
  deploy workflow with the approved digest-pinned image.
- Live signed-in proof required: no, for this merge. Yes, for any deployment
  that later declares a configuration source.

## Rollback Plan

Revert the squash commit. The change is additive: one new module, two
single-expression call-site changes, one new suite, one regenerated artifact.
No migration, no data write, no stored state, so a revert is complete and
immediate. A deployment that had declared the configuration variable falls back
to the built-in set on revert, which is the same result the variable being unset
produces.

## Audit Evidence

- PR: opened against `main` in `abarva-platform/abarva` from
  `feat/archetype-config-reaches-live-brief`; CI run on the PR head.
- The suite named above, which pins the supply end, the override rule, and both
  host call sites through the registry's own entry point rather than by
  rebuilding the call sequence by hand.
- `npm run release:check -- --base origin/main --head HEAD` run locally before
  the PR was opened.
- The census delta recorded under QA, which is what proves CI runs the suite.

## Known Gaps

- **A newly ADDED archetype is not yet reachable by declaration.** A
  configuration may add an id, the loader lists it as applied, and the effective
  catalog holds it — but resolving a declared archetype still matches against
  the built-in set, so a Move declaring the new id falls through to keyword
  inference. This is pinned as a test asserting today's behaviour so the gap
  cannot be mistaken for a working path. Closing it needs declared-archetype
  matching to run against the effective catalog, which is in a file four
  concurrent branches are editing; it is the next increment once they land.
- **Nothing surfaces the reported state to a human.** `not_configured`,
  `in_effect` and `rejected`, the applied id list and the error strings are
  returned and tested but no operator surface renders them. That is the setup-UI
  item on the backlog.
- **No caching.** The configuration file is read once per brief build when one
  is declared, and not at all when none is. A deployment that declares a source
  is the first that would need a cache-invalidation story; reading per call
  keeps this slice free of a staleness question nothing can yet exercise.
- **Only the discovery half is covered.** The artifact-pack half of an archetype
  (exhibits, tables, governance note) has its own configuration contract landing
  on a separate branch and is not wired to a source here.
- **The override key needs no token normalisation, by construction**, because
  both sides guarantee the id is lower snake case. If declared-archetype
  matching is later routed through the effective catalog, it must use the shared
  identity helper rather than a second normaliser.
