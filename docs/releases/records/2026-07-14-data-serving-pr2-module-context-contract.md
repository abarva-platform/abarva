# 2026-07-14-data-serving-pr2-module-context-contract - Module Context Serving Contract

## Release ID

`2026-07-14-data-serving-pr2-module-context-contract`

## Status

`validated`

## Plain-English Summary

This release adds DATA-SERVING-PR2: a generic, read-only module context serving
contract for Home, Intelligence, Moves, Source, and Tower. It lets future module
work request tenant-scoped context packets from active context by default or
from candidate preview only when explicitly requested.

This is a supplier contract, not a module feature. It does not implement Moves
Context Extract, create Move evidence, promote candidates, update Active Tenant
Access, or change any module runtime behavior.

## Layer Impact

- `global-control-lane`: adds shared typed context-serving contracts and a
  deterministic read helper for future module consumers.
- `client-data-lane`: exposes lineage-backed active/candidate context packet
  boundaries without writing tenant data or changing active access.
- `internal-admin`: gives operators and builders an audit command that proves
  active-by-default and explicit candidate-preview behavior.

## Client Applicability

- All clients: the contract applies to all current and future tenants.
- Specific clients tested: SkyHarbor Air and Meridian Health.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added typed module context serving request, packet, record, evidence,
  relationship, readiness, lineage, and guardrail types.
- Added `getModuleContext` supplier helper under the enterprise data layer.
- Added `npm run audit:module-context-serving`.
- Added tests proving default module reads do not consume candidate data and
  explicit candidate preview is required.
- Added `docs/architecture/module-context-serving-contract.md`.
- Updated the architecture reading order.
- Added this release record.

## QA / Validation

- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:candidate-version`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for the context serving contract
- Pass: `git diff --check`

## Rollout Plan

Merge through the standard PR path. No Azure Container Apps deployment is
required for this supplier-contract PR because no product route, module runtime
path, database write path, promotion behavior, or Active Tenant Access pointer
is changed.

## Deployment Authority

- Repo-owned deploy workflow: not required for this non-runtime supplier
  contract.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this non-runtime contract.

## Rollback Plan

Revert the PR. No tenant data rollback, promotion rollback, module runtime
rollback, or ACA rollback is required.

## Audit Evidence

- `src/lib/enterprise-data/contracts/module-context-apis.ts`
- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/enterprise-data/module-context-serving/__tests__/module-context-serving.test.ts`
- `docs/architecture/module-context-serving-contract.md`

## Known Gaps

- This PR does not implement Moves Context Extract.
- This PR does not rebuild Home Summary Snapshot from promoted active canonical
  data.
- This PR does not prove browser-visible module consumption.
- Candidate preview remains explicit-only and inactive.
