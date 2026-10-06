# 2026-10-06-moves-declared-archetype-reaches-readiness — A declared Move archetype decides what its gate asks for

## Release ID

`2026-10-06-moves-declared-archetype-reaches-readiness`

## Status

`candidate`

## Plain-English Summary

A Move can declare what kind of work it is. Until this change, that declaration never
reached the part of the product that decides which evidence the Move's phase-2 gate
requires, so the gate asked for a different kind of work's evidence.

The requirement framework is keyed by a registry of strategic-move archetypes. There was
no entry in that registry for a data-governance / platform-readiness Move, and the
resolver answers with a default archetype whenever nothing matches. A Move that declared
the governed data-foundation archetype was therefore graded against an archetype it had
not declared — one whose phase-2 hard requirements are engineering-delivery and
IT-estate instruments (an engineering delivery baseline, an IT systems landscape, an IT
org structure). Two of those read tenant-wide tables; none of them is evidence this kind
of Move collects, and none shares a key with the eleven evidence families the declared
archetype actually asks for.

The consequence is a dead end rather than a wrong label. The capture screen counts
`currentStateReadiness.hardGaps` into the blocker that disables Approve & Build at phase
2, so the phase could be held open by gaps that the Move's own evidence can never close —
while the eleven families it does collect and get approved were graded by nothing at all.

Two things change. First, a `GOVERNED_DATA_FOUNDATION` archetype is registered, with its
evidence families keyed exactly as the discovery blueprint keys them, so an approved
upload joins the instrument it satisfies. Second, a declared archetype id is now passed to
the resolver and outranks every keyword rule — identity is declared, never inferred. A
Move that declares nothing resolves exactly as it did before.

Why the inference could not be left to improve: a data-foundation Move must name the
systems it governs and the identities it resolves, and that vocabulary belongs to other
archetypes. The more faithfully the archetype describes the data it governs, the more
certainly it was misread. Measured on this archetype's own family labels, a competing
archetype's vocabulary outscored every other pattern five hits to one. This is the
declared-identity version of a fix the registry already carries as a keyword rule, added
after a founder-reported case of engineering-delivery metrics appearing on an operations
Move.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated, reachable only by an explicit per-Move declaration.

- **Layer 3 — canonical model.** A new archetype is added to the strategic-move archetype
  registry, and the registry's resolver gains a declared-identity input. No schema change,
  no migration, no stored data is read or written differently.
- **Layer 4 — products (Moves).** Phase-2 current-state readiness, and therefore the
  Approve & Build blocker, now resolve from the declared archetype for a Move that has
  one. Eleven call sites share the helper that was changed (the phase workspace page and
  ten API routes), so the correction is uniform rather than per-surface.

No product owns this: the archetype declares the requirement, the readiness resolver
projects it, and the capture surface renders the projection.

## Client Applicability

- All clients: yes, as a mechanism — a declared archetype now wins over inference for
  every Move, in every tenant.
- Specific clients: none. Only one archetype id is bridged today, so only a Move that
  declares that id changes archetype. No Move in any tenant declares it at the time of
  writing.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is additive and reachable only by an explicit
  declaration, so a Move that declares nothing is byte-for-byte unaffected. A flag would
  gate a correction that cannot alter an undeclared Move.

## Changes Included

- `src/lib/programs/archetypes/governed-data-foundation.ts` — **new.** Twelve evidence
  families and the per-phase requirements. Family keys are the discovery blueprint's
  family ids verbatim; every family is move-scoped documentary evidence with no backing
  table. Eleven are hard at `diagnose`, mirroring the blueprint's own `required` flag; the
  optional change/adoption owner is soft. Nothing is `estateScoped`, so the estate axis
  never prunes a family.
- `src/lib/programs/archetypes/registry.ts` — registers the archetype, adds the
  declared-id → registry-id bridge (`DECLARED_ARCHETYPE_ALIASES`,
  `archetypeForDeclaredId`), and honors a new optional `declaredArchetypeId` on
  `resolveProgramArchetype` ahead of the exact-id and keyword paths. No existing rule is
  changed or reordered.
- `src/lib/programs/move-archetype-resolution.ts` — reads the declared id from the two
  places a declaration is written (`functionPackKey`, and
  `charter.classification.archetype` — the field the declaration job writes and guards)
  and passes it to the resolver. It deliberately does not read the coarse legacy
  `program.archetype` column, which names no registry archetype.
- `src/lib/programs/__tests__/governed-data-foundation-archetype.test.ts` — **new**, 17
  cases.
- `src/lib/programs/__tests__/move-archetype-declared-wiring.test.ts` — **new**, 7 cases,
  pinning the caller.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No deliverable content, prompt, gate rule, or phase-gate criterion is changed.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__/governed-data-foundation-archetype.test.ts
  src/lib/programs/__tests__/move-archetype-declared-wiring.test.ts` — 24 passed / 24.
- **PASS** `npx jest src/lib/programs/__tests__` (the directory CI sweeps whole) — 113
  suites, 1093 tests.
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__` and the playbook route
  suite — 55 suites, 814 tests. The playbook route is the sibling that already keyed off
  this helper.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  exit 0.
- **PASS** `npx eslint` on all five changed/added source files — exit 0.
- **PASS** `npm run audit:lib-orphans` — "No change against the baseline". The new module
  is imported by the registry, so it is product-reached, not a test-only orphan.
- **PASS** 7 mutations attempted, **7 killed**: the declared short-circuit removed; the
  alias entry removed; the caller's pass-through argument dropped; a family key renamed;
  a family given a backing table; the optional family made hard; case-normalisation
  dropped from the alias lookup. The caller mutation is the one a registry-only suite
  would have missed — it leaves every other case green while making the fix inert.
- **PASS** registration proved by census delta, not asserted: `testFiles` 2738→2740 and
  `coveredTestFiles` 2574→2576, with `uncoveredTestFiles` **unchanged**. Both suites land
  in a directory a required check sweeps whole, so neither is dark.
- **NOT RUN** live signed-in walk. No Move declares this archetype yet, so there is
  nothing to walk; the behaviour change is unreachable until a declaration exists. This
  record does not claim `live-proven`.
- **NOT RUN** any database query. The blocking condition was established by reading the
  resolver, the requirement resolver and the capture surface, and by exercising the pure
  functions directly — not by inspecting tenant data.

Lane: `global-control-lane`.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys in the normal
way. No migration, no flag, no env var, no worker job, no data build. The change is inert
until a Move declares the bridged archetype id.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that
  may shift shared Product/Lab web traffic.
- Shared runtime mutators: none. No `az containerapp update`, no traffic weight change, no
  template edit, no ad-hoc `az acr build` in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this
  record.
- ACA runtime invariant: unchanged by this release and to be proved by the deploy workflow
  as usual (template image == 100% traffic revision image == approved digest).
- Worker image invariant: unchanged — no worker job is added or modified.
- Feature/env flag update path: not applicable; no flag is introduced or read.
- Live signed-in proof required: not for this change, because no Move declares the
  archetype and the code path is therefore unreachable. It **is** required before the
  demo Move's phase 2 may be called proven, once the declaration exists.

## Rollback Plan

Revert the PR. The change is additive in three parts, each independently safe to drop:
the new module is imported only by the registry; the registry's new archetype is reachable
only through the alias bridge; and the resolver's new input is optional, so a caller that
stops passing it restores the previous answer exactly. No stored data is written, so there
is nothing to migrate back. A Move that declared the archetype would, after a revert,
return to being graded against the inferred archetype — the behaviour this change
corrects, not a corrupted state.

## Audit Evidence

- The PR and its CI run.
- The two new suites, and the mutation results recorded above.
- `npm run audit:lib-orphans` output.
- The census delta in `docs/architecture/test-ci-coverage-census.json`.
- The discovery blueprint's evidence-family ids, which the new archetype's keys are pinned
  against in both directions by the first suite.

## Known Gaps

- **The phase-3 option set is still chosen by keyword inference.** Solution options are
  assembled by `assembleP3SolutionOptions`, which receives the coarse legacy
  `program.archetype` column and keys its own `ARCHETYPE_USE_CASE_PATTERNS` map — a map
  with exactly one entry. Exercised directly with this archetype's real family labels, a
  data-foundation Move is offered four options belonging to a different archetype, the
  same set that archetype itself resolves to. That is a wrong solution route rather than a
  blocked phase, so it is out of scope here; it needs a declared pattern and an option
  ladder of its own. The declared id this change threads through is the input that fix
  will want.
- **Only one archetype id is bridged.** Every other discovery-blueprint archetype still
  resolves by inference. Extending the bridge needs a registry archetype per blueprint
  archetype, which is per-archetype content, not a mechanism change.
- **`gateRequirements` are declarative.** The new archetype declares phase-gate intent,
  but nothing in the product reads `PhaseRequirements.gateRequirements` today — the phase
  gate is `src/lib/programs/governance.ts`. The declared gate text has no runtime effect
  and must not be read as a gate that exists.
- **Whether phase 2 was blocked or merely mis-graded for a given Move depends on tenant
  data this change did not inspect.** Both of the inferred archetypes reachable from this
  kind of Move's vocabulary hard-require instruments the declared archetype's evidence
  cannot close, so the gate asked for foreign evidence either way; whether it also
  *blocked* depends on whether unrelated tenant tables happened to hold rows. Stated as
  measured, not as observed live.
- Nothing in this change declares an archetype on any Move, loads evidence, or approves
  it. Those remain the data lane's and an authorized human's steps.
