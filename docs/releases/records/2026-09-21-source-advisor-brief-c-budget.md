# 2026-09-21-source-advisor-brief-c-budget - Preserve Source Advisor Recommendations

## Release ID

`2026-09-21-source-advisor-brief-c-budget`

## Status

`candidate`

## Plain-English Summary

Source advisor answers no longer use the shared paragraph and character budget to shorten governed Brief C prose. The budget could remove an interior recommendation from a multi-option shortlist, which changed the advice rather than merely shortening it.

The change is scoped to Source advisor surfaces. Shared cleanup still strips unsafe markup, stale internal brands, and raw identifiers. Setup and admin form surfaces keep the existing compact response path.

## Layer Impact

Layer 4 products only. This changes Source answer presentation after an advisor response has already been generated; it does not change intake, adapters, canonical data, read models, retrieval, migrations, or tenant data.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: Source advisor response shaping receives the fix wherever the Source surface uses the shared agent response shaper.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/response-shape.ts`: treats Source as the governed Brief C advisor surface for the shared shaper budget while preserving shared cleanup.
- `src/__tests__/integration/source-chat-shape.test.ts`: pins the full three-recommendation Source shortlist and recommendation order.
- `src/lib/agent/__tests__/response-shape.test.ts`: adds a neutral long-prose guard proving an interior recommendation paragraph cannot disappear.
- `.github/workflows/source-integration.yml`: runs the Source chat response-shaping contract by exact path.
- `scripts/quality/source-integration-quarantine.json`: removes the stale Source chat shape exclusion and lowers the swept-sibling ceiling to zero.
- `docs/architecture/test-ci-coverage-census.json`: refreshed after the exact CI owner changed coverage counts.

## QA / Validation

- Red-first: `npx jest src/__tests__/integration/source-chat-shape.test.ts --runInBand` failed 1 of 7 before the fix; the missing paragraph was the middle recommendation.
- Focused post-fix: `npx jest src/__tests__/integration/source-chat-shape.test.ts src/lib/agent/__tests__/response-shape.test.ts src/lib/answer/__tests__/shared-response-shaper.test.ts --runInBand` passed 59 of 59.
- Mutation check: temporarily removing the Source preserve flag made both the original Source chat fixture and the neutral long-prose guard fail on missing recommendation text.
- Quarantine check: `npm run check:source-integration-quarantine` passed; 8 excluded Source suites remain, 0 swept-in siblings are excluded.
- CI registration checks: `npx jest src/__tests__/behaviors/source-integration-ci-registration.test.ts src/__tests__/behaviors/integration-directory-ci-coverage.test.ts --runInBand` passed 22 of 22.
- Census refresh: `npm run audit:test-ci-coverage:write` updated the committed census and reported 550 test files with no workflow owner.

## Rollout Plan

Open a PR and squash-merge after required checks pass. The behavior becomes active through the repo-owned main deployment workflow after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable before merge/deploy.
- ACA runtime invariant: Owed only after the repo-owned deployment runs.
- Worker image invariant: Owed only after the repo-owned deployment runs.
- Feature/env flag update path: None.
- Live signed-in proof required: Owed after deployment for the affected Source answer surface; not performed in this PR.

## Rollback Plan

Revert the PR. That restores the previous shared budget behavior for Source advisor answers and reintroduces the prior failing contract, so rollback should be used only if the scoped exemption causes a higher-severity rendering issue.

## Audit Evidence

- Local red-first and post-fix Jest output for the Source chat shape contract.
- Local mutation output showing the interior recommendation tests fail when the Source preserve flag is removed.
- Local Source quarantine, CI-registration, and census-refresh outputs.
- PR checks once opened.

## Known Gaps

Live signed-in Source answer proof is owed after deployment and is not claimed here.
