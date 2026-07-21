# 2026-07-21-moves-typecheck-gate-fix — Fix broken full-project typecheck gate

## Release ID

`2026-07-21-moves-typecheck-gate-fix`

## Status

`candidate` — PR open, not yet merged.

## Plain-English Summary

`main`'s full-project TypeScript typecheck was broken, blocking merge for every PR in the
repo regardless of what that PR touched — including unrelated Source work
([#5192](https://github.com/abarva-platform/abarva/pull/5192)) that hit this same gate.
Root cause: `MovesPhaseStandaloneClient.test.tsx` declared `const mockUseFeature =
jest.fn(() => false)` — a zero-argument implementation — which TypeScript used to infer the
mock's call signature as accepting zero arguments. Every later call site in the same file
(`mockUseFeature(key)`, `mockUseFeature.mockImplementation((key: string) => ...)`) then failed
type checking against that inferred zero-arg signature. Fixed by declaring the mock's argument
type explicitly via `jest.fn<boolean, [string]>(() => false)` instead of letting it infer from
the implementation body — no behavior change, purely a type-level fix.

## Layer Impact

- `global-control-lane`: one test file's mock declaration. No production code, no schema, no
  API route touched.

## Client Applicability

- All clients: yes, indirectly — this unblocks the merge gate for every PR, not just Moves.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: one-line
  change to `mockUseFeature`'s declaration (line 45).
- This release record.

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
tsconfig.json` — full project, 0 errors (previously 3 errors, all in this file).
- `pass` — `npx eslint` on the changed file — 0 errors, 0 warnings.
- `pass` — `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 28/28 passed, no regressions (same test count and outcomes as before the fix).

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. Test-only change with no runtime
surface — no migration, no flag, no deploy-visible behavior change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: N/A — no production code changed.
- ACA runtime invariant: N/A.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: no — test-only change, nothing to observe at runtime.

## Rollback Plan

Revert the merge commit. Reverting restores the broken typecheck gate — not safe to do
without also reverting whatever caused the reintroduction, since it re-blocks all merges.

## Audit Evidence

- PR: to be added once opened.
- Typecheck/lint/test logs: see QA / Validation.

## Known Gaps

None known. This is a narrow, mechanical type-level fix with no behavior change.
