# Test Pyramid Policy

## Purpose

This policy defines where new validation should live so Nexus keeps fast feedback without losing coverage on auth, data-plane, and cross-client behavior.

## Pyramid Layers

| Layer             | Primary purpose                                                                                      | Preferred commands                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Unit and behavior | Pure functions, copy rules, route helpers, deterministic UI behavior                                 | `npm run test:nav`; `npm run test:behaviors`; focused `npx jest <path>`                        |
| Integration       | Module contracts, adapters, release controls, route contracts, seeded data behavior                  | `npm run test:integration`; focused integration Jest suites                                    |
| E2E               | Authenticated workflows, cross-client isolation, critical browser paths, deployed-preview confidence | `npm run test:e2e`; focused Playwright specs                                                   |
| Release gates     | CI policy, architecture boundaries, release records, hygiene, secret scanning                        | Workflow-equivalent npm scripts plus `npm run release:check -- --base origin/main --head HEAD` |

## Placement Rules

- Prefer unit or behavior tests for deterministic logic that does not need a browser, database, or external service.
- Use integration tests for module boundaries, route contracts, control-plane/data-plane adapter behavior, and seeded scenario logic.
- Use Playwright only when the browser is the product surface being validated: navigation, auth redirect behavior, interactive workflow state, visual availability, or cross-client leakage checks.
- Add a release-gate script or workflow when the risk is structural and future PRs must not regress it.

## Minimum Expectations by Change Type

| Change type                     | Required test posture                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Copy-only docs                  | No runtime test; run whitespace and release-control checks when applicable               |
| UI component behavior           | Focused unit/behavior test, or Playwright if behavior depends on browser workflow        |
| App route or navigation         | Focused route/navigation test; Playwright when authenticated user flow matters           |
| Shared library or agent logic   | Focused Jest tests for normal, edge, and failure cases                                   |
| Data-plane adapter or migration | Integration coverage for tenant/client scoping, RLS assumptions, and failure handling    |
| AI decision support             | Regression test proving labels, citations, human gate, and no autonomous-action language |
| Governance/CI control           | Workflow-equivalent local command and release record                                     |

## Coverage Discipline

Coverage thresholds are not yet enforced repository-wide. Until a threshold gate is added, every PR must still explain why the chosen validation is sufficient for the changed surface. Broad shared-code changes should include at least one negative or failure-path test.

## Known Constraints

Some integration suites need real Azure/Postgres credentials and some E2E suites need real Clerk credentials plus installed Playwright browsers. When those are unavailable locally, list the limitation in the PR and rely on the closest focused local test plus CI or preview validation.

## Review Checklist

- Tests live at the lowest layer that can prove the behavior.
- High-risk user workflows are not validated solely by snapshots or copy checks.
- Cross-client and authorization behavior has explicit negative coverage.
- New CI gates are mergeable with the current repository state.
- The release record lists the exact commands run and any residual test gaps.
