# 2026-06-02-home-admin-surface-canonicalization - Home/Admin Surface Canonicalization

## Release ID

`2026-06-02-home-admin-surface-canonicalization`

## Status

`candidate`

## Plain-English Summary

This change tightens the Home/Admin separation. Home configuration metadata now points to Admin Setup, Steward setup context only activates on Admin routes, and the SSO setup page describes single-client role assignment instead of any cross-tenant administration.

## Layer Impact

- `global-control-lane`: updates shared navigation metadata, agent surface gating, and admin SSO copy.
- `internal-admin`: clarifies Admin-only setup behavior for users and operators.

## Client Applicability

- All clients: receive the route and prompt-boundary cleanup.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/home/panel-inventory.ts`
- `src/lib/admin/steward-trust-spine-context.ts`
- `src/app/api/chat/agent/route.ts`
- `src/app/(maestro)/admin/users-access/sso-configuration/page.tsx`
- `src/lib/admin/users-access-page-view.ts`
- `src/lib/agent/surface.ts`
- `src/lib/agent/all-agent-doctrine.ts`
- `src/lib/agent/response-shape.ts`
- `src/lib/agent/output-discipline/golden-fixtures.ts`
- `tests/agent-quality/golden/steward.jsonl`
- Focused regression tests for Home panel routing, Steward surface gating, agent prompt gating, and SSO copy.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/home/__tests__/panel-inventory.test.ts src/lib/admin/__tests__/steward-trust-spine-context.test.ts src/app/api/chat/agent/__tests__/agent-quality-answer-key.test.ts src/lib/admin/__tests__/users-access-sso.test.ts --runInBand` (4 suites, 42 tests)
- Pass: `npx jest --runTestsByPath src/lib/agent/__tests__/surface.test.ts src/lib/agent/all-agent-doctrine.test.ts src/lib/agent/__tests__/response-shape.test.ts --runInBand` (3 suites, 66 tests)
- Pass: focused `npx eslint` over the changed TypeScript and TSX files.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. The Vercel deployment updates route metadata, agent surface gating, and SSO copy immediately.

## Rollback Plan

Revert the PR. No migrations or durable data changes are included.

## Audit Evidence

- PR URL: pending
- Local validation: focused Jest suites passed, ESLint passed, whitespace check passed, and release control passed.
- CI: pending

## Known Gaps

This does not implement the private data-plane SSO/Entra dress rehearsal. That remains a separate client-data/private-plane test track requiring explicit approval.
