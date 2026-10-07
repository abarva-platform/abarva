# 2026-10-06-moves-phase-build-set-refuses-unresolvable-document — A phase build refuses instead of quietly building fewer documents

## Release ID

`2026-10-06-moves-phase-build-set-refuses-unresolvable-document`

## Status

`candidate`

## Plain-English Summary

When a user runs "Approve & Build" for a phase, the product looks up the set of documents that
phase is supposed to produce. That set is declared in one place — the deliverable registry — and
at one phase it varies with the confirmed solution route.

The lookup discarded anything it could not find. If a declared document's type key no longer had a
registry entry — a rename, a removal, a route branch naming a key that had moved — the build
simply left that document out, reported success, and queued the rest. Nothing anywhere said a
document was missing.

That failure surfaces one step later and in the wrong place. The phase's exit gate goes on to ask
whether that document is signed off. It is not, because it was never built, so the gate refuses the
Move and names a document the user was never given and cannot produce — while the build that was
supposed to produce it says it worked. The user has a blocker pointing at a control that is not
there, and nothing connects it back to the build.

The lookup now reports what it could not resolve, and the build refuses up front with a message
that names the unresolvable keys, names the phase that declared them, and says plainly that nothing
was queued. The partial build no longer happens: a phase either builds the set it declared or
refuses and says why.

No document set changed and no gate got stricter. Every key the product declares today resolves —
that is asserted, for every phase and for every solution-route branch — so this refusal cannot fire
on current configuration. It exists so that a future registry drift fails loudly at the build,
where the cause is, instead of silently at the gate one phase later.

A second, narrower property is pinned at the same time: a document the build can select must carry
a non-empty section list, since an empty one yields a contentless document. Two registry entries
have no sections and are safe only because no phase selects them; the suite asserts both that no
selectable document is section-less and that those two stay unselected, so promoting one of them
fails here rather than shipping an empty gate artifact.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) only — Strategic Moves deliverable build path. No change to layers 1-3: no
intake, adapter, canonical-model, schema, migration, or dataset change. The new module is pure
(declared keys in, resolved specs plus unresolved keys out) with no data-plane access.

## Client Applicability

All clients, but behaviour-neutral on current configuration. The new refusal is reachable only when
a phase declares a deliverable type key with no registry entry, and no phase does; that is asserted
for every canonical phase and every solution-route branch. No feature flag: there is no new
capability to gate, only a silent drop replaced by a named refusal.

## Changes Included

- `src/lib/programs/phase-build-set.ts` (new) — `resolvePhaseBuildSet` returns the declared keys,
  the specs that resolved in declared order, and the keys that did not;
  `describeUnresolvedBuildSet` builds the refusal sentence. Registry and key-source are injectable
  so the drift branch is testable without a broken registry on disk.
- `src/app/api/v1/deliverables/generate-phase/route.ts` — resolves the build set through the new
  module and returns `500 phase_build_set_unresolvable` with the key list when anything is
  unresolved, replacing `.map(find).filter(Boolean)`. The existing empty-set `422 no_deliverables`
  path is unchanged.
- `src/lib/programs/__tests__/phase-build-set.test.ts` (new, 20 cases) — resolvability for every
  canonical phase and every P3 route branch, declared build order, multi-key and renamed-entry
  drift, the refusal sentence's content and pluralisation, and the generation-completeness property
  in both directions.
- `src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — one case proving the
  ROUTE refuses on a drifted key and queues nothing, not even the key that did resolve.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- PASS — `npx jest --runTestsByPath src/lib/programs/__tests__/phase-build-set.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts`: 2 suites, 43 tests.
- PASS — `npx jest src/lib/programs/__tests__ --runInBand` (the whole directory the required
  catalog job sweeps): 116 suites, 1152 tests.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`: exit 0, no
  diagnostics.
- PASS — `npx eslint` on the new module, both suites, and the route directory: no errors, no
  warnings.
- PASS — mutation battery, 8 mutations, 8 killed: route guard removed; resolver stops reporting
  unresolved keys; resolver reports only the first; refusal sentence drops the key names; refusal
  sentence drops "nothing was queued"; pluralisation collapsed; declared build order reversed;
  refusal returns a success status. Each was reverted from the index and the tree verified clean
  between runs.
- PASS — `npm run audit:test-ci-coverage:write`: delta is exactly +1 test file and +1 covered test
  file, matching the one suite added; no inherited drift absorbed.
- PASS — `npm run audit:tenancy-fence-coverage:write`: no change (the new module is pure and
  touches no tenant-scoped read).
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- NOT RUN — live signed-in walk. This change is behaviour-neutral on current configuration, so
  there is no new user-visible behaviour to walk; the refusal is unreachable until a registry drift
  exists. It does not claim `live-proven`.

## Rollout Plan

Lane: `global-control-lane`. Squash merge to `main` and ship with the next repo-owned ACA main
deploy. No flag, no migration, no data build, no ordering constraint against any other change.

## Deployment Authority

Not applicable. This release changes no Azure Container Apps configuration, deploy workflow,
runtime image, feature flag, environment variable, worker job, traffic weight, DNS record, or
environment promotion. It ships as ordinary application code through the repo-owned ACA main deploy
workflow.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime update is requested by this release.
- ACA runtime invariant: unchanged; no template, revision, or traffic mutation.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: none; no flag introduced or changed.
- Live signed-in proof required: no — behaviour-neutral on current configuration.

## Rollback Plan

Revert the squash commit. The change is four files, additive apart from the route's resolution
lines, with no migration, no data write, no flag, and no persisted state, so a revert restores the
prior behaviour exactly. Reverting reinstates the silent drop; it does not strand any record,
because the refusal path writes nothing and no build is queued when it fires.

## Audit Evidence

- The suites named under QA / Validation, both in directories CI already runs: the new suite is in
  `src/lib/programs/__tests__`, swept wholesale by the required `AI surface control catalog` job,
  and the route case is in a suite already wired by file path in `unit-suites.yml`. Neither is an
  orphan.
- The mutation battery above is the evidence that each assertion is load-bearing.
- The resolvability assertions double as the standing audit that no phase currently declares an
  unresolvable document, so the refusal's unreachability is checked on every run rather than
  asserted once here.

## Known Gaps

- The refusal is a 500 because an unresolvable declared key is a configuration fault, not user
  error. A user who hits it can do nothing but report it; the message is written for that, naming
  the keys and the phase so the report is actionable. Making it a first-class operator alert is out
  of scope.
- Generation-completeness is asserted as a registry property, not enforced in the route. A
  selectable document with an empty section list would still build (contentless) rather than
  refuse. That was deliberate: turning it into a route refusal would be a new refusal on a
  configuration the suite shows does not exist, and the empty-section entries are better fixed than
  guarded against at request time.
- Unrelated and unchanged by this release: several soft gate criteria resolve against deliverable
  type keys that no registry entry declares, so they can be satisfied only by their free-text
  fallback and never by a built, signed document. One instance is addressed by a separate change in
  review; the rest need a product decision about whether those documents should exist, and are
  reported rather than fixed here.
