# 2026-09-20-public-audit-and-exhibit-gates — audit cleanup and visual gate correction

## Release ID

`2026-09-20-public-audit-and-exhibit-gates`

## Status

`candidate`

## Plain-English Summary

This change removes identifying prose from public release records and access
comments, retires an Intelligence test and library that have no product or
operator importer, and makes the executive handoff test reflect the actual
visual gate. Placeholder exhibit labels are not treated as rendered visuals, so
the handoff remains an internal draft until a real visual renderer supplies the
required exhibits.

## Layer Impact

- `global-control-lane`: public documentation wording and test disposition only.
- `client-data-lane`: none. Exact email-to-client access mappings are unchanged.
- `products`: no runtime product surface is promoted or weakened.

## Client Applicability

- All clients: public disclosure wording and shared quality checks.
- Specific clients: none.
- Internal only: retired unreachable test/library paths.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed personal names, roles, and employers from public release prose and
  access comments while preserving exact allowlist behavior.
- Retired `intelligence-int2-pattern-action-canvas.test.ts` together with its
  unimported `pattern-action-canvas-view.ts` library. The retirement is recorded
  in the shared path-disposition register and the quarantine/orphan baselines
  were refreshed.
- Changed the storyline-deck test to require real rendered visuals. The test now
  expects `blocked_missing_visuals` when only exhibit identifiers and placeholder
  panels are present.

## QA / Validation

- Intelligence quarantine unit and real-tree checks: passed, 15 excluded suites.
- Orphan census: refreshed with no newly added orphan; the retired library is
  removed from the test-only baseline.
- Storyline-deck focused suite: 7 tests passed.
- Typecheck, focused ESLint, and release checks: passed on the candidate branch.
- Fixture auth contract: 6 tests passed; no production access roster or role
  mapping changed.

## Rollout Plan

Merge to `main` after required checks. No migration, data build, ACA worker, or
shared runtime mutation is included. The repo-owned ACA workflow is the only
approved deployment path if a later runtime change is added.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: none.
- ACA runtime invariant: not applicable because this release has no runtime
  image or environment change.
- Live signed-in client proof required: no; no product or access behavior changed.

## Rollback Plan

Revert the PR. Reverting restores the retired test/library and the prior public
wording; it does not change tenant data or access mappings.

## Audit Evidence

- Reachability classification measured before retirement.
- Shared path disposition names the removal commit and has no replacement claim.
- Visual gate test asserts that placeholder exhibit identifiers cannot produce a
  client-ready handoff.

## Known Gaps

- A real exhibit renderer is still required before an executive handoff can pass
  the visual-completeness gate. This change intentionally does not manufacture
  charts or diagrams from missing inputs.
- The production admin allowlist and account roles are unchanged. The stale
  fixture test was corrected to inspect the fixture membership contract rather
  than compare synthetic fixture emails with the production exact-email roster.
