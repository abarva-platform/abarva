# 2026-09-20-retire-the-int2-pattern-action-canvas — a feature that left its test and its library behind

## Release ID

`2026-09-20-retire-the-int2-pattern-action-canvas`

## Status

`candidate`

## Plain-English Summary

The INT2 pattern action canvas was sunset months ago with the other legacy
Intelligence surfaces. Two pieces of it were left on the tree: its integration
suite and its view library.

Both are removed, and the deleted page is recorded in the shared path register
so the next reader can see the removal was deliberate.

**Fail-to-collect suites under `src/` are now zero.**

## Why this is a retirement and not a repair

The suite was the last remaining suite under `src/` that failed to **collect**.
Repairing it was considered first and rejected on the evidence:

- the page it reads, `IntelligencePatternDetailPage.tsx`, does not exist under
  any name;
- **no component anywhere renders `ActionCanvasSection`**;
- **no intelligence pattern route exists** under `src/app`;
- and the view library it also tests — which does still exist — is imported by
  **nothing except that dead suite**, checked by exported symbol rather than by
  path.

So repairing the suite would have manufactured coverage over code no
production path reaches. The feature is gone; only its leftovers were not.

## The evidence that this removed nothing of value

| | unmodified `main` | with this change |
|---|---|---|
| suites in the two affected trees | 26 | **25** |
| tests failed | 63 | **63** |
| tests passed | 574 | **574** |

**One fewer suite; the test counts identical.** That is exactly what retiring a
zero-assertion suite should look like, and it is the measurement rather than
the argument: a suite that fails to collect contributes no assertions, so its
removal cannot move a test count. If either number had moved, the premise was
wrong.

The baseline was taken by stashing the change and re-running, not recalled.

## What the register entry is for

`src/components/intelligence/IntelligencePatternDetailPage.tsx` is now in the
shared path register as retired by `0c6a86c51` — the same legacy-surface sunset
that the register already cites for its sibling components, so this joins an
existing group rather than inventing a category.

`replacement` is `null`, because nothing replaced it. The entry exists so that
a future reader finding the gap concludes "sunset, deliberately" instead of
"deleted by accident, restore it" — which is the failure the register was built
to prevent.

## Layer Impact

- `global-control-lane`. One dead test, one unimported library, one register
  entry. No product surface, tenant data, schema, projection, migration, flag,
  or runtime behaviour: nothing imported the library, and the suite executed
  no assertions.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/__tests__/integration/intelligence/intelligence-int2-pattern-action-canvas.test.ts` — deleted.
- `src/lib/intelligence/pattern-action-canvas-view.ts` — deleted.
- `src/lib/qa/path-disposition.ts` — the sunset page registered as retired.

## QA / Validation

Measured on base `1dbee2e27`.

| What | Result |
|---|---|
| Suites failing to collect under `src/` | **1 → 0** |
| Affected trees | 26 → 25 suites, **test counts unchanged** |
| Importers of the deleted library | **none**, checked by exported symbol |
| `tsc` (exit code) | 0 |
| `release-check` | passed |

### On the deletion count in this diff

This change deletes two files, so the usual deletion check reports two. That is
the intent here rather than the accident it usually signals — the distinction
being that these two were named, verified unreachable, and measured as
contributing zero assertions before removal.

## Rollout Plan

Merge to `main`. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. That restores a suite that runs no assertions and a library
nothing imports, so a rollback would be restoring the leftovers rather than the
feature.

## Audit Evidence

- The four-way orphan check: page, renderer, route, and importers by symbol.
- The before/after suite and test counts, taken by stashing.

## Known Gaps

- **The feature is not restored and nothing here proposes restoring it.** If
  the pattern action canvas is wanted again it needs a page, a route and a
  reason, and the register entry says plainly that nothing replaced it.
- **Git history keeps both files.** Retirement removes them from the tree, not
  from the past.
- **Nothing prevents the next orphan.** A library whose only importer is a
  failing test is invisible to an importer count that excludes tests and
  invisible to a coverage census that counts the suite as a covered file.
