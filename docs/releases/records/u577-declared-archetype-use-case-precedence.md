# U-577 — A declared archetype outranks a function-pack key in the Move request builder

## Release ID

`2026-10-07-declared-archetype-use-case-precedence`

## Status

`candidate`

## Plain-English Summary

A Move can record which use-case archetype it is: that declaration selects the evidence framework
its discovery plan prescribes and the exhibits, tables and governance note its board-grade
deliverables carry. A Move also records a *function*-pack key — a completely separate catalog
describing which business function it sits in.

The builder that assembles a Move's deliverable request read the function-pack key first and trusted
it without checking whether it named an archetype at all. Measured against the shipped catalogs:
of the 39 function-pack keys the registry declares, **none** names an archetype pack, and only six
resolve a discovery blueprint — by keyword inference off the key's own words, not by naming one. So
every Move whose function pack had been classified handed the orchestrator an archetype identifier
that selects nothing, and the declaration recorded on its charter was discarded before it was ever
read.

The visible consequence is that such a Move's discovery plan prescribed the default evidence
framework rather than the one its declared archetype defines, and its deliverables were composed
without that archetype's exhibits and tables. Both failures were silent: the generated documents
rendered perfectly and said nothing about a declaration having been dropped.

This change makes the choice between the two fields a question of which one *names a known
archetype*, rather than which field comes first.

## Layer Impact

Release lane: `global-control-lane` — shared read logic in the Move request builder, applying to
every client with no feature gate.

- **Layer 3 — Canonical model:** unchanged. No schema, no migration, no new stored field. The fix is
  purely how two already-stored fields are read.
- **Layer 4 — Products (Moves):** the P2 discovery plan and the board-grade Move deliverables now
  compose against the archetype the Move declared. For a Move that declared nothing, behaviour is
  byte-for-byte unchanged — the function-pack key is still returned as the inference seed, and still
  feeds the prompt's use-case description and the brief-registry lookup key.

## Client Applicability

- All clients: yes — this is shared control-lane read logic in the request builder.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a no-op for any Move whose charter declares no archetype, which
  is why it ships unflagged.

## Changes Included

- `src/lib/programs/deliverables/orchestrated/use-case-archetype-precedence.ts` — new. The
  precedence rule and its oracle.
- `src/lib/programs/deliverables/orchestrated/build-request.ts` — uses the rule in place of the
  field-order `??` chain; the stale doc comment describing the old derivation corrected.
- `src/lib/programs/deliverables/orchestrated/__tests__/use-case-archetype-precedence.test.ts` —
  new, 22 cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

The rule lives in its own module rather than inline because its oracle is a question about two
catalogs, and because the request builder is reachable only with a full Move input assembled. Note
that the sibling rule in `src/lib/programs/archetypes/declared-archetype-precedence.ts` could **not**
be reused: it asks whether a token names an entry in the Move archetype *registry*, whereas the
value resolved here is only ever looked up in the archetype-pack and discovery-blueprint catalogs.
Borrowing it would have gated on a condition this consumer never required.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/deliverables/orchestrated/__tests__` (the directory a step
  of the required `AI surface control catalog` check sweeps): 3 suites / 46 tests.
- **PASS** — `npx jest src/lib/programs/deliverables src/lib/deliverables/orchestrator
  src/lib/programs/discovery src/lib/programs/archetypes src/lib/programs/__tests__
  src/app/api/v1/deliverables`: 234 suites / 3057 tests, re-run after the merge.
- **PASS** — `npm run test:behaviors`: 202 suites / 2102 tests.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint src/lib/programs/deliverables/orchestrated/`, exit 0.
- **PASS** — census regenerated **after** a mid-run merge of the moving base: `testFiles`
  2816 → 2817, `coveredTestFiles` 2652 → 2653, `uncoveredTestFiles` flat at 164. The +1 covered
  with uncovered unchanged is the proof the new suite is reached by a CI runner rather than added
  dark. Worth recording why the figures were restated once: the pre-merge regeneration produced a
  census byte-identical to the one the base had meanwhile committed for a *different* added test
  file, so the merge was clean while the committed count was wrong for the combined tree. The
  figures above are from a regeneration taken after the merge.
- **PASS** — mutation testing, 7 mutations, **6 killed**:
  1. restore field-order precedence (the original defect) — killed, 7 cases.
  2. accept keyword inference as naming an archetype — killed, 9 cases.
  3. drop the pack-catalog arm of the oracle — killed.
  4. drop the blueprint-catalog arm of the oracle — killed.
  5. return the fallback instead of the inference seed when nothing names an archetype — killed,
     3 cases.
  6. builder stops passing the charter declaration — killed, 4 cases.
  7. remove the `typeof !== "object"` guard in the charter reader — **survived, by design.** JS
     boxes a primitive, so the guarded expression already answers `undefined` without it; the only
     input it changes is a function carrying an `archetype` property, which a JSONB column cannot
     hold. Documented in the module as stated intent rather than reachable behaviour, matching the
     identical survivor already recorded in the sibling rule.
- **NOT RUN** — live signed-in walk. This change alters no route, no UI control and no stored value;
  proving it end-to-end requires a Move with a declared archetype, which is a data-lane
  precondition that is not yet met (see Known Gaps).

Mutations 3 and 4 initially survived and the suite was strengthened rather than the finding
dropped: the two catalogs overlap in exactly one id, so a single declared archetype could not
discriminate the two arms. Both arms are load-bearing — five archetypes are declared only in the
pack catalog and four only in the blueprint catalog — and the suite now derives those two sets from
the catalogs themselves, so an archetype added to either is swept without editing the test.

## Rollout Plan

Merge to `main` by squash. No migration, no flag, no env var, no worker-image change. The behaviour
becomes active for a Move the next time its deliverable request is built, which happens per
generation request; nothing is cached across the change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged by this release.
- Shared runtime mutators: none. This release contains no Azure command, no workflow edit, and no
  container-app template change.
- Approved image digest: not applicable — no runtime image is pinned or re-pinned here.
- ACA runtime invariant: not asserted by this release. It carries no deploy step, so it claims
  `merged` only, never `live-proven`.
- Worker image invariant: not applicable. The worker contract is deliberately untouched — see
  Known Gaps.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this change on its own. It is required before the Moves
  end-to-end path as a whole can be called proven, and that is gated on the data-lane
  preconditions below.

## Rollback Plan

Revert the squash commit. The change is three files, one of them generated, and adds no stored
state, so a revert restores the prior read behaviour exactly with no data to unwind. Nothing
imports the new module except the request builder, so the revert cannot orphan a caller.

## Audit Evidence

- The PR and its CI run, including the required `AI surface control catalog` check whose
  directory-wired step runs the new suite.
- The census diff in this PR, showing +1 covered test file against unchanged uncovered.
- The suite's own first `describe` block, which asserts the measurement this change rests on
  directly against the shipped catalogs: that at least one function-pack key is declared, that none
  of them names an archetype, and that keyword inference is not counted as naming one.

## Known Gaps

- **The worker-side pack selection is still open and is deliberately out of scope.** A deliverable
  queued for background generation crosses a job-payload seam that carries the archetype identifier
  as a flat field, and the worker rebuilds its request from that payload. Closing that half means
  adding a declaration field to the payload contract, which cannot be proven from the web side.
  This release fixes the path that builds its request and runs orchestration in-process — which
  includes the P2 discovery-plan generation — and leaves the queued path unchanged.
- **The archetype asset-withholding rule means the pack's exhibits do not reach every type.** That
  is existing intended behaviour, declared per type with a reason, and the suite asserts the pack
  half on a type that is not withheld rather than asserting it universally.
- **Data-lane preconditions for the Moves end-to-end goal are unchanged by this release** and remain
  the first blocking step: no archetype has been declared on the demo tenant's Move, and no
  discovery evidence has been loaded or approved. Both are outside the code lane. Until a
  declaration exists, this fix is correct but dormant for that tenant — it changes what happens
  *once* a declaration is recorded.
- The effective-catalog loaders this oracle calls are not memoised, matching their existing
  behaviour. With no configured archetype source declared they do no I/O; a deployment that
  declares one is the first that would need an invalidation story. Carried forward unchanged.
