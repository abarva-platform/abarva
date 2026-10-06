# 2026-10-06-moves-governed-data-foundation-evidence-guidance — The data-foundation archetype asks for its own evidence

## Release ID

`2026-10-06-moves-governed-data-foundation-evidence-guidance`

## Status

`candidate`

## Plain-English Summary

When a Move asks for evidence, each requested item carries four strings: an
example template, what the example should contain, why it matters, and what to
upload next. That guidance is authored per archetype, and selected by the
archetype the Move **declared**.

`ARCHETYPE_EXAMPLES` — the registry of those authored tables — held exactly
**one** entry. The `governed_data_foundation` archetype had none. Its coverage
reading said "4 of 12 authored", and that 4 was misleading in a specific way:
the four were precisely the four families it *shares* with other archetypes,
answered by the archetype-neutral `CROSS_ARCHETYPE_EXAMPLES` table. Every one of
the **eight families that belong to this archetype alone** resolved to
`UNAUTHORED_FAMILY_GUIDANCE`.

So a Move that correctly declared this archetype was asked, eight times over,
for the same three generic bullets — "Owner-attested source extract or document
· Period covered, source system, and freshness · Known caveats, missing fields,
and approval status" — with one generic next action. The product named the
families precisely (`semantic_layer_certification`, `data_lineage_audit_trail`,
`master_identity_resolution`, …) and then said nothing about what evidence any
of them actually wants, who would hold it, or what would make it sufficient.

This change writes that table: eight families, each with a template, three or
more content bullets, a reason tied to what a later phase does with the input,
and a next action naming a document someone could actually go and find.

The four shared families are **deliberately left out** of the new table. The
archetype-neutral reading is correct for them, and wording them a second time
would create two places to maintain and re-introduce one archetype's voice into
a shared family id. A case asserts they still resolve `cross_archetype`.

Measured with `archetypeGuidanceCoverage()`, families authored on the declared
path, before → after:

| blueprint id | families | before | after |
| --- | --- | --- | --- |
| `governed_data_foundation` | 12 | 4 | **12** |
| the contact-centre archetype | 12 | 12 | 12 |
| `general_default` | 5 | 5 | 5 |
| `financial_services_commercial_lending_agent_assist` | 8 | 1 | 1 |
| `ai_operations_customer_digital` | 12 | 1 | 1 |

No other archetype's reading moves; this adds a registry entry and changes no
resolution logic.

## Layer Impact

Release lane: `global-control-lane` — shared evidence-guidance content for all
clients, selected by declared archetype.

- `3 CANONICAL MODEL` / discovery archetype layer: no schema change, no catalog
  entry, no change to how an archetype is resolved or declared. One table is
  added and registered against an existing blueprint id.
- `4 PRODUCTS` (Moves): the evidence-needs panel, and every route that builds
  the same packets, show authored guidance for eight families that previously
  showed the neutral fallback. Family set, status, priority, blocked-artifact
  list, `guidanceBasis` mechanics, and all gate behaviour are untouched — only
  the four guidance strings per family change, and only for this archetype.

## Client Applicability

- All clients: any Move declaring this archetype gets specific evidence guidance
  instead of a generic placeholder. No client loses guidance it had — this
  change only replaces `unauthored` readings.
- Specific clients: none targeted.
- Internal only: No.
- Public/demo only: No.
- Feature flag: none. Replacing placeholder copy with authored copy has no row
  that degrades, so gating it would only keep the placeholder alive.

## Changes Included

- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts`
  — new `GOVERNED_DATA_FOUNDATION_EXAMPLES` table (eight families:
  `data_governance_ownership`, `semantic_layer_certification`,
  `data_lineage_audit_trail`, `data_quality_rules`, `source_system_data_access`,
  `platform_architecture_readiness`, `master_identity_resolution`,
  `privacy_security_controls`), registered in `ARCHETYPE_EXAMPLES` against the
  blueprint id. No logic change: `resolveFamilyGuidance`, the chain order, the
  coverage function, and the fallback are byte-for-byte as before.
- `src/lib/programs/evidence-readiness/__tests__/need-packet-archetype-guidance.test.ts`
  — the pinned coverage shape for this archetype updated 4 → 12; the
  neutral-fallback case re-pointed at an archetype that genuinely still owes
  wording (the lending archetype, which owes seven); five new cases on the new
  table. Directory is swept by the required check `AI surface control catalog`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated. **This change
  adds no test file**; the regeneration carries a pre-existing `+1` on
  `testFiles` / `coveredTestFiles` / `pullRequestCoveredTestFiles` that
  reproduces identically from a clean `origin/main` tree, so the committed
  census was one file stale before this branch. The correction rides along
  rather than being left for the next PR to trip over.

## QA / Validation

Lane: `global-control-lane`.

- `jest src/lib/programs/evidence-readiness` — **PASS**: 2 suites, 44 tests.
- `jest src/lib/programs/evidence-readiness src/lib/deliverables/orchestrator` —
  **PASS**: 57 suites, 858 tests.
- `tsc -p tsconfig.json --noEmit` — **PASS**: exit 0.
- `eslint src/lib/programs/evidence-readiness` — **PASS**: 0 errors, 0 warnings.
- **Mutation check** — 6 mutations, each asserted to match its anchor exactly
  once, **6 killed**: unregistering the table; renaming one family key;
  renaming one family entry so the archetype no longer covers it; thinning one
  entry below three content bullets; additionally authoring a *shared* family in
  this table; and pointing the registry entry at another archetype's table.
- **Measurement** — the before/after table above taken from
  `archetypeGuidanceCoverage()` on the pre-change and post-change trees.
- **Not run**: no signed-in walk (see Known Gaps); no E2E suite (no route,
  component, or data-plane change).

## Rollout Plan

Merges to `main` and ships with the next `aca-main-deploy` run. No flag, no
migration, no data-plane step, no config. Visible on the evidence-needs surface
for Moves declaring this archetype as soon as the revision serves.

## Rollback Plan

Revert the commit. The change is one table plus one registry line; reverting
returns those eight families to `UNAUTHORED_FAMILY_GUIDANCE` and restores the
prior coverage reading exactly. No data is written, so there is nothing to
unwind. The three test edits revert with it.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, env var, or secret.

## Known Gaps

- **Two archetypes still owe guidance for most of their families** — 7 of 8 and
  11 of 12 fall through to the neutral fallback. `archetypeGuidanceCoverage()`
  names each missing family id, and the suite pins the counts, so each is the
  same authoring increment this record performs for one archetype.
- **No signed-in visual proof.** This is client-visible copy on the P2
  evidence-needs panel; a walk of that panel for a Move declaring this archetype
  is owed and is not claimed here.
- **The wording is reviewed by its author only.** It asks for design and
  ownership artifacts — decision rights, definition registers, lineage paths,
  access scopes, control baselines — which is the right shape for this
  archetype, but a practitioner review of the specific asks is worth doing
  before it is put in front of a client.
- **The Move-name heuristics remain live** below the declared path for the two
  archetypes with no table. Unchanged by this release.
- **A second, differently-keyed archetype catalog still exists** in
  `src/lib/source/archetypes/registry.ts` with different family ids for the same
  archetype. Not merged, not touched here; the module comment recording the
  divergence is preserved.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `audit:test-ci-coverage`, `npm run release:check`.
- The "no other archetype moves" claim rests on the full coverage table being
  re-measured after the change, not on the single edited row.
- The eight family ids are written out as a literal in the suite and checked
  against the catalog's declared family set, so a renamed or dropped family
  fails rather than silently reducing coverage — reading the keys off the table
  under test would have let both pass.
