# 2026-07-02-cxo-artifact-storytelling-contract — CXO Artifact Storytelling Contract

## Release ID

`2026-07-02-cxo-artifact-storytelling-contract`

## Status

`candidate`

## Plain-English Summary

Adds a shared CXO artifact storytelling standard and typed contract so AbarVa
client artifacts do more than present evidence. The standard requires executive
message, value movement, why-it-happened explanation, action timeline,
opportunity map, do-nothing scenario, business-impact mapping and evidence
caveats. It also registers the next Source backlog item to turn contract
optimization into a consulting-grade advisory story pack.

## Layer Impact

- `global-control-lane`: adds shared artifact standards and a typed validation
  helper for future generators across Source, Moves, Intelligence and Tower.
- `public-demo`: improves the doctrine for externally reviewed client artifacts,
  but does not change runtime UI by itself.

## Client Applicability

- All clients: applies as a standard for future CXO/client artifact generators.
- Specific clients: none.
- Internal only: backlog and standards are internal implementation guidance until
  a runtime slice consumes them.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `docs/strategy/CXO-ARTIFACT-STORYTELLING-CONTRACT.md`.
- Updated `docs/strategy/CXO-ARTIFACT-EXCELLENCE-FRAMEWORK.md`.
- Updated `docs/strategy/SOURCE-BOARD-GRADE-DELIVERABLE-BLUEPRINT.md`.
- Updated `docs/strategy/MOVES-ARTIFACT-GOLD-STANDARD.md`.
- Added `src/lib/artifacts/cxo-storytelling-contract.ts`.
- Added `src/lib/artifacts/__tests__/cxo-storytelling-contract.test.ts`.
- Added Source backlog item `SRC46 — Contract optimization advisory story pack`.

## QA / Validation

- PASS: Targeted Jest for the typed CXO storytelling contract.
- PASS: Scoped ESLint for the new typed contract and test.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to `main`. No ACA deployment is required for the standard alone because it
does not change current runtime rendering. Runtime consumption will occur through
future Source/Moves artifact slices.

## Deployment Authority

- Repo-owned deploy workflow: not required for this documentation/typed-contract candidate.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this standards-only slice.

## Rollback Plan

Revert the PR. No migration, runtime data, feature flag or environment rollback
is required.

## Audit Evidence

- PR diff.
- Jest, ESLint, TypeScript and release-check output.

## Known Gaps

This locks the standard and backlog. It does not yet rebuild the Source contract
optimization PDF/DOCX renderer into the full five-page advisory story pack; that
is tracked as `SRC46`.
