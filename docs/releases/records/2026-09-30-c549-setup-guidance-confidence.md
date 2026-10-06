# 2026-09-30-c549-setup-guidance-confidence — the Steward setup guidance assumption disclosure, measured and catalogued

## Release ID

`2026-09-30-c549-setup-guidance-confidence`

## Status

`candidate`

## Plain-English Summary

The AI-generated UI catalog (`docs/legal/AI_GENERATED_UI_CATALOG.md`) is the
document an auditor reads. Its row for Steward setup guidance answered
"Confidence / assumption disclosure present?" with "Yes: seeded-only/live
verification separation". The row named only the setup fixture
(`src/lib/setup/shell-setup-fixture.ts`) as its code path. The control catalog
(`docs/security/ai-surface-control-catalog.json`) could not join that claim to
any surface, so it carried the claim as `deferred` / `uncatalogued`. Nothing had
measured whether the claim was true.

This change measures it by rendering. The claim splits in two:

1. **The guidance a reader sees does carry the disclosure.** The fixture's
   reconnect guidance renders at `/admin/connectors/[connectorId]/reconnect`
   (`src/components/setup/ConnectorReconnectPage.tsx`). That guidance is the
   profile summary, the numbered steps (the last one is Steward's) and, after
   the reader authorizes, Steward's success message. Beside it the page says
   "Mode: Seeded fixture · no live API call is made from this setup surface".
   The page derives that line from the connector's `dataMode`, and the route
   mounts the page.
2. **The fixture's other Steward prose reaches no reader.** No component reads
   a connector's `agentQuote` or `actions`. Nothing imports the index, users,
   audit or policies agent voices. So none of that prose can lack a disclosure
   anyone reads.

So the claim is true for the guidance that renders. This change records it
honestly rather than retracting it. The legal row now names the reconnect page
as a code path and says what was measured. The reconnect page is catalogued as
a surface with one `confidence` control, and the coverage row becomes `covered`
against it.

A seeded/live limitation is not a new use of the `confidence` kind. The
catalogued `moves-deliverable-canvas-view` surface already carries readiness and
missing-evidence text under that kind.

No product file changed.

## Layer Impact

Release lane: **`global-control-lane`**. The change is to the shared legal
catalog, the control catalog, the catalog CI job and tests. It is not gated to
any client or flag.

- **Products**: Setup/admin. Documents and tests only; no product file changed.
- **Canonical model / Client intake / Source adapters**: not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes. Legal catalog, control catalog and CI.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/setup/__tests__/ConnectorReconnectPage.assumption-disclosure.test.tsx`:
  new, 6 cases. Nothing is stubbed; the real component renders the real fixture.
  - Positive control: every reconnectable fixture connector (`anthropic`,
    `github`, `msgraph`, `sn`) renders its summary and every step, so the
    disclosure has guidance to sit beside.
  - The seeded disclosure renders exactly once on each, and the live variant
    does not.
  - A perturbation pair: the same connector with `dataMode: 'live'` renders the
    live line and not the seeded one, so the line is derived rather than
    constant.
  - After the reader clicks the authorize button, Steward's success message
    appears and the disclosure is still on the page.
  - Mounted: the only non-test importer is the reconnect route, and the
    unreachable-components baseline does not list the component.
  - The legal row names the reconnect page as a code path, and its confidence
    cell starts with `Yes`. `startsWith('Yes')` is the predicate the control
    catalog gate uses.
- `docs/legal/AI_GENERATED_UI_CATALOG.md`: the Steward setup guidance row gains
  `src/components/setup/ConnectorReconnectPage.tsx` as a code path. Its
  confidence cell keeps `Yes` and states what was measured. The next-control
  cell adds that any fixture Steward prose mounted later carries the same
  disclosure.
- `docs/security/ai-surface-control-catalog.json`:
  - `controls[]` gains `setup-steward-connector-reconnect-guidance` on the
    reconnect page, with one `confidence` control. The control is pinned to two
    evidence tokens and to the three cases above that prove the disclosure.
  - The `generated-ui|Setup|Steward setup guidance|confidence` coverage row
    moves from `deferred` / `uncatalogued` to `covered` against that surface.
- `.github/workflows/ai-surface-control-catalog.yml`: one step runs the new
  suite by exact path. The catalog gate credits a control only when this
  workflow runs its suite.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts`: two count pins move,
  with the reason in each comment:
  - the per-bucket tally moves from 21/10/4 to 22/9/4;
  - the covered-set length moves from 21 to 22.

## QA / Validation

Status: **pass** for every check below; CI on the PR is the remaining gate.

- **Red first.** Before the catalog edits (the suite alone over base
  `e8e91113ea`'s documents), the new suite failed 1 of 6: the legal-row case,
  because the row did not name the reconnect page. After the fix it passes
  6 of 6.
- **Mutations to the suite's subjects:** 5 made, 5 caught. Each was confirmed
  to change the file before the run:
  - M1: the mode label hard-coded to `Seeded fixture`. Fails the derivation
    case only.
  - M2: the disclosure line removed. Fails the three cases that read it.
  - M3: the disclosure shown only before authorize. Fails the after-authorize
    case only.
  - M4: the route imports a different module. Fails the mounted case only.
  - M5: the legal cell set back to `Partial`. Fails the legal-row case only.
- **The catalog gate is red on each half-edit.** `node
  scripts/audit/ai-surface-control-catalog.mjs` exits 1 with a finding naming
  the row:
  - Disclosure removed from the component: `missing evidence token`.
  - Legal cell set to `Partial`: `does not match a current legal catalog claim`.
  - Legal code path loses the reconnect page: `surfaceId … is not a controls[]
    entry naming this claim's code paths`.
  - Suite not run by the catalog workflow: `is never run by
    .github/workflows/ai-surface-control-catalog.yml`.
- **`uncatalogued` coverage rows:** 4 at base, 3 on the branch.
- **Setup components plus behaviors, measured in a clean worktree at base
  `d5c7986903` against the branch rebased onto it** (`npx jest
  src/components/setup src/__tests__/behaviors`):
  - At base: 163 suites and 1732 tests passed.
  - On the branch: 164 suites and 1737 tests passed. That is 6 new cases, less
    the 1 parameterized case `catalog-claim-binding` runs per deferred row,
    which left with this row. The case names were diffed to confirm it.
  - 0 failing on either side.
- **Both catalog gates pass on the branch.** `node
  scripts/audit/ai-surface-control-catalog.mjs` reports 25 surfaces and 50
  controls, and behavioural coverage of reachable controls moves from 35 of 40
  to 36 of 41. `node scripts/audit/ai-surface-control-cases.mjs` ran all three
  named cases and reported them passed.
- **CI placement:** the suite sits in `src/components/setup/__tests__`, which
  `.github/workflows/unit-suites.yml` already runs by directory. It is also
  named by path in the catalog job, which the gate requires.
- **Checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
  false` exits 0.

## Rollout Plan

This change ships on merge through the normal main deploy. No runtime behaviour
changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none added.
- Approved image digest: whatever the merge deploy produces; no runtime change.
- ACA runtime invariant: verified after merge as for any merge.
- Worker image invariant: as above.
- Feature/env flag update path: none.
- Live signed-in proof required: no. No product file changed; the claim is
  measured by rendering the component the route mounts.

## Rollback Plan

Revert the squash commit. That restores the `deferred` / `uncatalogued` row,
removes the surface and its workflow step, and removes the suite.

## Audit Evidence

- The mutation and gate results above were measured locally on the branch.
- The CI run for the PR, including the catalog job's step log for the new
  suite.

## Known Gaps

- The fixture's `agentQuote` and `actions` fields and its four agent-voice
  exports are dead data that renders nowhere. This change records that; it does
  not delete them.
- For a `live` connector the reconnect page would say "Mode: Live signal · no
  live API call is made from this setup surface". Every fixture connector is
  `seeded`, so no reader sees this today, and the second clause is still true of
  the page.
- The Steward prose on `/admin/connectors` comes from a different builder
  (`src/lib/admin/connectors-page-view.ts` through `StewardEditorial`), not from
  this fixture. It is not measured here.
- C-549 half (2) stays open with 3 `uncatalogued` rows: two decision-gated
  redirect shims, and the Source commercial summary `confidence` row. Each needs
  its own measurement.
