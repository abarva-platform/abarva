# Source — the declared-archetype panel claims only what it shows

## Release ID

2026-10-07-archetype-panel-claims-only-what-it-shows

## Status

Open with auto-merge armed — not deployed and not live-proven by this record.

## Plain-English Summary

The Coverage view's declared-archetype panel was titled **"Archetype determines which levers are
allowed"** under the eyebrow **"Declared plays"**.

The panel renders, per archetype: its name, recorded annual value, contract count, vendor count. It
renders **no lever**. Nor is there a code path behind it that would produce one:

- The archetype playbook — the registry of archetypes and their levers — is resolved by
  `resolveArchetypeForEvent` from a sourcing **event's** classified category, and feeds deliverable
  generation prompts.
- The contract register's `archetype` column is read only for coverage counting and this
  concentration list. It is never resolved against that registry.
- The two vocabularies do not intersect. The register declares values such as
  `productivity_platform` and `crm_saas`; the registry's identifiers are of the form
  `CLOUD_FINOPS`, `AMS_MANAGED_SERVICES`. Zero overlap, so even connecting them today would
  resolve nothing.

So the title asserted a rule the product does not apply, on a panel that could not have shown it. A
reader who acted on it would ask for an archetype's allowed levers and find the surface has none to
give. The title now states what the panel does show: **"Recorded value by declared archetype"**.

A second defect in the same panel: the list is capped at six rows. The contract register carries
**seven** declared archetypes, so exactly one was dropped with nothing on screen to say so — a
coverage panel understating the taxonomy it exists to report. The panel now states how many
declared archetypes it is not listing.

A third, found by the new guard rather than by reading: a neighbouring paragraph pointed the reader
at "the declared plays below", which was both a dangling reference after the rename and a restating
of the same framing. It now points at the declared archetypes.

## Layer Impact

Release lane: **global-control-lane**.

Layer 4 (product) only — panel copy, one display helper, and the cross-reference beside it. No
schema change, no migration, no query, no change to any stored value, no change to what any figure
counts.

## Client Applicability

**All clients**, no gating and no feature flag. The panel is not flag-gated and renders wherever the
Source workspace Coverage view renders.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — the panel's eyebrow and
  title; `archetypeRowsForDisplay` and the `ARCHETYPE_ROWS_SHOWN` cap beside the rows builder; the
  omitted-count sentence; the corrected cross-reference; `CoveragePage` exported so the panel can be
  rendered under test.
- `src/app/(maestro)/source/preview/workspace/__tests__/coverageArchetypePanel.test.tsx` — new
  render suite, 4 cases.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — 7 cases for the cap arithmetic and a module-source guard on the claim.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx` —
  three existing assertions conformed to the new copy.
- `.github/workflows/ai-surface-control-catalog.yml` — the new render suite named in the required
  job's exact-path list.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| Check | Status |
|---|---|
| Workspace suite directory | PASS — 38 suites, 365 tests |
| New render suite | PASS — 4 cases |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — 0 errors, 1 pre-existing warning |
| Prettier on the changed regions | PASS — the file is not formatted on `main`, so only the changed regions were matched to Prettier's shape |
| CI census | PASS — `coveredTestFiles` +2, `uncoveredTestFiles` **unchanged**, directory `untriagedUnrunTestFiles` 1 → 0 |
| Release check | PASS |
| Signed-in acceptance | NOT RUN |

### Mutation results

| Mutation | Result |
|---|---|
| `notShown` always reports 0 | killed — 2 cases |
| cap widened 6 → 60 | killed — 3 cases |
| the old title restored | killed |
| the old eyebrow restored | killed |
| the omitted-count sentence never rendered | **survived at first**, then killed — 2 cases |

The last one is why the render suite exists. The first round of tests pinned the arithmetic and the
module source, and replacing the sentence's condition with `false` still passed all 361 tests: the
count was correct and reached dead JSX. Only a render assertion closes that, and the panel's host
had to be exported to make one possible.

### Two findings about the checks themselves

- A case-sensitive grep for `Declared plays` found three assertion sites and missed a fourth
  instance in lowercase prose. The blanket negative guard over rendered text nodes is what surfaced
  it. The sweep that matters is case-insensitive and covers both halves of a `PanelHead`, not the
  title alone.
- The required job that sweeps this directory is **AI surface control catalog**, not `Unit suites
  that pass on main`, which is in none of the 19 required contexts. The new suite is named in the
  required one, so it can fail a merge.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The panel returns to asserting that archetype selects the allowed levers, and to
dropping the seventh declared archetype silently.

## Audit Evidence

- A mutation restoring the old title fails the module-source guard, which reads the
  comment-stripped source so a comment quoting the old copy neither satisfies nor trips it.
- A mutation that disables the omitted-count sentence fails two render cases.
- A control asserts the panel stays silent when every declared archetype is listed, so the
  disclosure is not unconditional.

## Known Gaps

- **The underlying gap is unchanged and larger than the copy.** Archetype-specific levers exist in
  the registry and reach deliverable prompts for sourcing events; they do not reach a contract page
  at all. This change stops the panel claiming otherwise. It does not connect the two, and
  connecting them needs a decision about which vocabulary is canonical, since the register's and
  the registry's do not intersect.
- The cap of six is unchanged. The panel now discloses what it omits rather than showing more.
- A neighbouring surface states that a coaching guide "is selected from the declared contract
  archetype". That one was checked and is substantiated — it reads a persisted, archetype-shaped
  intelligence record and already disclaims creating a value claim — so it was left alone.
- Not deployed and not live-proven. No signed-in walk of the Coverage view has been run for this
  change.
