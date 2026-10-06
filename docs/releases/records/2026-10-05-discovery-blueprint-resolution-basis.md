# 2026-10-05-discovery-blueprint-resolution-basis — Report what decided a Move's discovery archetype

## Release ID

`2026-10-05-discovery-blueprint-resolution-basis`

## Status

`candidate`

## Plain-English Summary

A Move's discovery archetype decides which evidence families the Discover
readiness pack grades that Move against, and therefore which gaps it tells an
operator to close. Until now the pack reported *which* archetype it used but
never *how that archetype was chosen* — and there are two very different
answers. Either a person declared it, or nobody did and keyword matching on the
Move's own text picked one.

The silent case is the one that mattered. When a Move declares an archetype key
the catalog does not recognise — a typo, or a key from an older vocabulary — the
declaration is discarded and selection falls through to keyword matching. The
discarded key is itself the first token of the text keyword matching reads, so
it can still steer the match to a specific archetype. The pack then presented
that archetype's gap register exactly as it presents a declared one. An operator
reading it had no way to tell that nothing they chose was being applied.

This change adds `resolveDiscoveryBlueprintWithBasis`, which returns the same
archetype the existing resolver already returned plus two facts about it: the
basis (`declared`, `declared_via_use_case`, `inferred`, `default`) and the
declaration that was supplied and discarded, if there was one. The readiness
pack now carries both. Nothing rendered changes yet and no selection changes;
this is the missing fact, made available to the surfaces that will show it and
to the setup UI still to be built.

## Layer Impact

Release lane: `global-control-lane`. Shared app behaviour for all clients, and
it is inert on arrival.

- **Layer 3 — canonical model:** no schema, table, or stored object changed. The
  archetype selected for any given input is byte-identical to before; the
  selection rules now have one implementation instead of being inlined in the
  convenience wrapper.
- **Layer 4 — products (Moves):** the Discover readiness pack type gains two
  reported fields. No route, component, copy, or rendered output changed, so no
  product surface behaves differently on this commit.

## Client Applicability

- All clients: no behaviour change. The resolver returns the same archetype for
  the same input, and no surface renders the new fields yet.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is additive and inert, so it needs no flag
  seat — which also keeps it clear of the flag-registry conflicts the sibling
  Moves PRs are holding.

## Changes Included

- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts` — adds
  `DiscoveryBlueprintBasis`, `DiscoveryBlueprintResolution`, and
  `resolveDiscoveryBlueprintWithBasis`. The keyword fallback moves into a named
  private `inferDiscoveryBlueprint` with its body unchanged.
  `getDiscoveryBlueprint` keeps its exact signature and behaviour and is now a
  one-line wrapper over the new resolver, so every existing caller runs the same
  code path and none of it is reachable only from a test.
- `src/lib/programs/discovery/evidence-readiness.ts` — `DiscoveryEvidenceReadiness`
  gains `blueprintBasis` and `unknownDeclaredArchetype`;
  `evaluateDiscoveryEvidenceReadiness` accepts them as optional arguments and
  defaults a caller that supplies neither to `inferred`, which is the only thing
  such a caller can honestly claim; `loadDiscoveryEvidenceReadiness` resolves
  through the new resolver and passes both through.
- `src/lib/deliverables/orchestrator/__tests__/discovery-blueprint-basis.test.ts`
  (new, 8 cases) — pins each basis, pins that a discarded declaration survives,
  and pins that the new resolver selects the same archetype
  `getDiscoveryBlueprint` already selected across eight inputs.
- `src/lib/programs/discovery/__tests__/evidence-readiness-blueprint-basis.test.ts`
  (new, 6 cases) — pins the pack's reported basis, including the
  discarded-declaration case, and reads the loader source to pin its own call
  site (see QA below for why).
- Five existing test fixtures that build a readiness pack as a literal gained
  the two new fields. The fields are required rather than optional on purpose:
  a future producer of a readiness pack should not be able to omit provenance
  silently.
- `docs/architecture/test-ci-coverage-census.json`,
  `docs/security/tenancy-fence-coverage.json` — regenerated.

## QA / Validation

Lane: `global-control-lane`. All commands run in an isolated worktree off
`origin/main` at `05896d1a2f`.

- **PASS** `npx tsc -p tsconfig.json --noEmit` — exit 0, no output. The first
  run failed with 7 errors in 5 files, all of them fixtures missing the two new
  required fields; adding the fields cleared it.
- **PASS** `npx jest src/lib/deliverables/orchestrator/__tests__ src/lib/programs/discovery src/lib/programs/evidence-readiness src/lib/programs/stage-readiness-workbooks` — 63 suites, 640 tests, all passing. The whole of each affected directory was run, not just the suites named above.
- **PASS** `npx eslint` over all 9 changed and added files — exit 0.
- **PASS** Mutation check, 6 mutations, each applied alone against a byte-compared
  backup and with the anchor count asserted at 1: collapsing
  `declared_via_use_case` into `declared` (killed, 1 failure); forcing the
  discarded declaration to `null` (killed, 3); collapsing `default` into
  `inferred` (killed, 2); flipping the pack's no-basis default to `declared`
  (killed, 1); dropping the discarded declaration at the pack (killed, 1);
  deleting the two lines by which the loader passes the basis through
  (**survived on the first attempt**, killed after the fix below). Baseline
  restored and re-run green.
- **PASS** `npm run audit:test-ci-coverage` after regenerating — no drift. The
  census delta is the proof the two new suites are swept: `coveredTestFiles`
  2547 → 2551 with `uncoveredTestFiles` unchanged at 164.
- **NOT RUN** Signed-in walk. Nothing rendered changed on this commit, so there
  is nothing a walk could observe. This record does not claim `live-proven`.

**On the surviving mutation.** `loadDiscoveryEvidenceReadiness` is `server-only`
over two live reads, so the behavioural cases resolve-and-pass by hand rather
than calling it. That left the one line of real wiring — the line that makes
this reach a product surface at all — pinned by nothing: deleting it kept every
test green while the live pack would report *every* Move as inferred, declared
ones included. The fix reads the loader's source and asserts both arguments
appear inside its `evaluateDiscoveryEvidenceReadiness(` call, bounded to the
argument list rather than matched loosely across the file. This is the same
shape as the migration-reading test already in the orchestrator suite, and for
the same reason: a stubbed-database test cannot see a wiring mistake that only
production hits.

## Rollout Plan

Merge to `main` by squash. No migration, no image build, no flag, no deploy step
is required for this change to be correct — it ships with the next ordinary ACA
main deploy and changes nothing when it arrives.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No `az` command of any kind was run.
- Approved image digest: unchanged; this change pins no new digest and requires
  no runtime update.
- ACA runtime invariant: untouched. No template image, revision weight, or
  traffic split was read or written.
- Worker image invariant: untouched. No worker job changed.
- Feature/env flag update path: not applicable — no flag, no env var.
- Live signed-in proof required: no. No rendered surface changed.

## Rollback Plan

Revert the squash commit. Nothing persists state and nothing is read back from
storage, so a revert is complete on merge with no data step. The only
cross-cutting edge is the two required fields on `DiscoveryEvidenceReadiness`:
a revert removes them, which type-breaks any *later* producer of a pack literal
written against them. There are none today beyond the five fixtures this change
updated, all of which revert in the same commit.

## Audit Evidence

- PR: `feat/discovery-blueprint-resolution-basis` → `main` (URL in the PR body).
- CI: the PR's own check run.
- Commands and results: the QA section above, each with its outcome.
- Mutation matrix: the six mutations above, with the kill count for each and the
  one survivor named along with the test added to kill it.
- Census delta: `docs/architecture/test-ci-coverage-census.json` in this diff.

## Known Gaps

- **No surface shows it yet.** Nothing renders `blueprintBasis` or
  `unknownDeclaredArchetype`. An operator still cannot see that a Move is being
  graded against an archetype nobody declared; they can only now be told. The
  readiness surface and the setup UI are where that belongs, and neither is in
  this change.
- **The discarded declaration is reported, not rejected.** Selection still falls
  through to keyword matching when a declaration does not resolve. Whether an
  unresolvable declaration should instead force the general-case archetype, or
  refuse to produce a pack at all, is a product call this change deliberately
  does not make — it makes the case visible first.
- **`suggestDiscoveryArchetypes` is still reached only by its own test.** It was
  built for the setup UI that does not exist, and this change does not wire it.
- **The committed census was stale by two files on `origin/main`.** Regenerating
  moved `testFiles` 2711 → 2715 while this change adds two test files. The other
  two are a sibling's, landed without a census refresh. The drift guard runs on
  branches only, so main can carry this; it is worth a separate look, not a fix
  smuggled into this diff.
