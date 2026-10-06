# 2026-10-05-moves-need-packet-archetype-guidance — Evidence guidance follows the declared archetype

## Release ID

`2026-10-05-moves-need-packet-archetype-guidance`

## Status

`candidate`

## Plain-English Summary

When a Move asks a client for evidence, each requested item carries guidance:
an example template, what the example should contain, why it matters, and what
to upload next. That guidance is written per archetype, because what counts as
good evidence for a workflow-automation Move is not what counts as good evidence
for a data-foundation Move.

The screen was choosing which archetype's guidance to show by **keyword-matching
the Move's name**, even though the resolved archetype was already sitting in the
same input object (`readiness.blueprintId`) — the archetype the discovery
resolver had declared. Two things went wrong, and both were observable:

1. **A declared archetype could not reach its own guidance.** One archetype in
   the catalog has a full authored guidance table — twelve families, each with a
   real example and a real next action. Reaching it required the Move's *name*
   to contain one of ten tokens. A correctly-declared Move named anything else
   got the neutral fallback for **all twelve** of its families: "Evidence
   packet · Upload the source file or record a human waiver with rationale." The
   authored guidance existed and was unreachable.
2. **A Move could be handed another archetype's voice.** Four family ids belong
   to more than one archetype. Their only authored wording lived inside that one
   archetype's table and was phrased in its vocabulary. A Move declared as a
   different archetype whose *name* happened to trip those ten tokens was told
   to upload an adoption plan covering "risks specific to frontline agent
   adoption" — for a data-governance family. Confidently wrong, with nothing on
   screen saying the guidance came from somewhere else.

This change keys guidance to the declared archetype:

- Archetype tables are registered against the blueprint id and selected from
  `readiness.blueprintId`. Identity is declared, never inferred.
- The four genuinely shared family ids get an **archetype-neutral** reading in a
  new cross-archetype table, used when the declared archetype has no wording of
  its own. An archetype that *has* written its own wording for a shared family
  keeps it.
- The Move-name heuristics are kept, below the declared path, so the two
  archetypes with no table of their own behave exactly as before.
- The neutral fallback is now a named export (`UNAUTHORED_FAMILY_GUIDANCE`), so
  an unauthored reading can be told from an authored one without matching on
  display copy.
- `archetypeGuidanceCoverage()` reports, per catalog archetype, which families
  have authored guidance on the declared path and which do not. The unauthored
  lists are the honest backlog, and they are pinned in the suite.

No archetype is worse off under any Move name. Measured, families falling
through to the neutral fallback, before (under a name that trips no keyword
list) → after:

| blueprint id | families | before | after |
| --- | --- | --- | --- |
| the contact-centre archetype | 12 | 12 | **0** |
| `governed_data_foundation` | 12 | 12 | **8** |
| `financial_services_commercial_lending_agent_assist` | 8 | 8 | **7** |
| `ai_operations_customer_digital` | 12 | 11 | 11 |
| `general_default` | 5 | 0 | 0 |

After this change every row is identical under a neutral Move name and under a
name that trips a keyword list; before, three rows moved when the Move was
renamed.

## Layer Impact

Release lane: `global-control-lane` — shared evidence-guidance selection for all
clients.

- `3 CANONICAL MODEL` / discovery archetype layer: guidance selection now reads
  the declared blueprint id instead of re-deriving identity from a Move's name.
  No schema, no catalog entry, and no resolution path changes.
- `4 PRODUCTS` (Moves): the evidence-needs panel and the routes that build the
  same packets show authored guidance where they previously showed the neutral
  fallback, and no longer show one archetype's wording for another's Move. The
  packet shape, family set, status, priority, blocked-artifact list, and gate
  behaviour are untouched — only the four guidance strings per family change.

## Client Applicability

- All clients: guidance text improves for Moves whose declared archetype has an
  authored table, and stops being borrowed across archetypes. No client loses
  guidance it had: every family that was served before is still served.
- Specific clients: none targeted.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none. The change is a correctness fix to copy selection with no
  row that degrades, so gating it would only keep the wrong guidance alive.

## Changes Included

- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts`
  — `ARCHETYPE_EXAMPLES` (guidance tables keyed by blueprint id);
  `CROSS_ARCHETYPE_EXAMPLES` (archetype-neutral readings for the four shared
  family ids); `UNAUTHORED_FAMILY_GUIDANCE` (the neutral fallback, now named and
  exported); `familyGuidance` takes the declared blueprint id and prefers it over
  the Move-name heuristics; `archetypeGuidanceCoverage()`. The stale comment
  claiming the table "only needs to match the ids this pipeline receives" is
  replaced with how the table is now selected.
- `src/lib/programs/evidence-readiness/__tests__/need-packet-archetype-guidance.test.ts`
  (new) — 17 cases on a CI-run directory (`AI surface control catalog` sweeps
  `src/lib/programs/evidence-readiness/__tests__`, a required check).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Lane: `global-control-lane`.

- `jest` (new suite) — **PASS**: 17/17.
- `jest` (`src/lib/programs/evidence-readiness`, `.../discovery`,
  `.../stage-readiness-workbooks`, `.../phase-templates`,
  `phase-progress-readiness`, `src/lib/deliverables/orchestrator/__tests__`) —
  **PASS**: 75 suites, 750 tests.
- `jest` (consumer routes and components: generate-phase, phase-gate-approval,
  stage-readiness-evidence-pack, stage-readiness-workbook,
  `MovesPhaseStandaloneClient`, `phase-approve-and-build-settle`) — **PASS**:
  6 suites, 265 tests across two runs (3 suites / 225 by pattern, 3 suites / 40
  by `--runTestsByPath` for the bracketed route paths).
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0.
- `eslint` (both changed files) — **PASS**: 0 errors, 0 warnings.
- **Mutation check** — 6 mutations staged, each asserted to match exactly once;
  **5 killed**. Dropping the declared lookup from the chain (5 tests), dropping
  the shared table (3), passing an empty blueprint id at the call site (5),
  omitting the shared table from the coverage reading (3), and letting a
  Move-name match suppress the declared lookup (1 — the name-independence
  invariant itself, which loops all five archetypes across four Move names) all
  fail. The sixth, moving the declared term to the end of the `??` chain,
  **survives and is a false survivor**: every later term is already guarded by
  `!declared`, and the mutation keeps the declared term ahead of the generic
  table, so no output changes. Precedence is carried by those guards, which the
  fifth mutation targets and the suite kills.
- Before/after measurement of the fallback counts in the table above — **PASS**:
  taken by building packets for every catalog archetype under a neutral name and
  under a name that trips each keyword list, on the pre-change and post-change
  trees.
- `audit:test-ci-coverage:write` — **PASS**: `coveredTestFiles` 2550 → 2551 with
  `uncoveredTestFiles` unchanged at 164, which is what says the new suite is
  CI-registered rather than sitting in a dark directory.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- Signed-in walk — **NOT RUN**: this run is the code lane. The change alters
  guidance copy on the evidence-needs panel, so it is worth a signed-in look on
  a Move whose declared archetype has an authored table; that is recorded as a
  known gap rather than claimed.

## Rollout Plan

Merge to `main` via squash PR, auto-merge armed. Ships with the next ACA web
image via the repo-owned `aca-main-deploy` workflow. No flag, no migration, no
data change: the change is which guidance table a family's four copy strings are
read from.

## Rollback Plan

Revert the PR. The change edits one module and adds one test suite; there is no
data, migration, flag, or stored state involved, so reverting restores the prior
guidance selection exactly. Reverting reinstates both defects described above.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, env var, or secret.

## Known Gaps

- **Three archetypes still owe guidance for most of their families.** 11 of 12,
  7 of 8, and 8 of 12 families respectively fall through to the neutral
  fallback. `archetypeGuidanceCoverage()` names them. Writing that guidance is
  authoring work, not a code change, and it is per-archetype.
- **The Move-name heuristics are still live below the declared path.** They
  specialise the generic families for treasury-shaped and payables-shaped Moves,
  and no catalog archetype exists for either, so removing them would lose that
  wording. Giving each a catalog archetype and a registered table is the clean
  follow-up; until then a Move's name still influences guidance for the two
  archetypes that have no table.
- **No signed-in visual proof.** The copy change is client-visible; a walk of the
  evidence-needs panel for a Move with a declared archetype is owed.
- **A second, differently-keyed archetype catalog still exists** in
  `src/lib/source/archetypes/registry.ts` for the same archetype, with different
  family ids. The two are not merged; this change does not touch that, and the
  module comment recording the divergence is preserved.
- **The generic table sits below the name heuristics.** A family served only by
  the generic table is therefore still name-sensitive. That is the preserved
  legacy behaviour, asserted explicitly rather than left implicit.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- The no-regression claim rests on the measured before/after table plus the
  name-independence case, which asserts that guidance for every non-generic
  family of every catalog archetype is identical across four Move names.
- The cross-archetype table's membership is derived from the catalog inside the
  suite — the five family ids owned by more than one archetype — not from a
  hand-kept list, and the shared readings are asserted free of any single
  archetype's vocabulary.
