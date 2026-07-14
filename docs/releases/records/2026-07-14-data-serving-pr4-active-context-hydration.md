# 2026-07-14-data-serving-pr4-active-context-hydration - Active Module Context Hydration

## Release ID

`2026-07-14-data-serving-pr4-active-context-hydration`

## Status

`candidate`

## Plain-English Summary

This release adds DATA-SERVING-PR4: active module context hydration through the
Active Tenant Access pointer. When a tenant has an Active Tenant Access record,
`getModuleContext(...)` in default active mode now returns read-only canonical
records, evidence refs, domain summaries, completeness scores, and deterministic
explanations without reading candidate preview data by default.

This remains a data-layer supplier contract. It does not implement Home UI,
Moves Context Extract, Source behavior, Tower calculations, candidate
promotion, Active Tenant Access updates, production writes, or module runtime
adoption.

## Layer Impact

- `global-control-lane`: extends the shared module context serving contract so
  active mode can supply canonical context for promoted tenants.
- `client-data-lane`: reads active canonical context behind the Active Tenant
  Access pointer; no tenant data is written or promoted.
- `internal-admin`: updates tests proving active mode hydrates records only when
  active access exists and still refuses candidate fallback when it does not.

## Client Applicability

- All clients: the active hydration contract applies to all promoted tenants.
- Specific clients tested: SkyHarbor Air active pointer and Meridian Health no
  active-pointer fallback.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Active mode now hydrates canonical records when Active Tenant Access exists.
- Active records are classified `agent_ready`, while candidate preview records
  remain `candidate_only`.
- Active mode still returns no records when no Active Tenant Access record
  exists.
- Updated deterministic completeness expectations for active context.
- Updated architecture documentation.
- Added this release record.

## QA / Validation

- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:candidate-version`
- Pass: isolated TypeScript compile for the context serving contract
- Pass: `git diff --check`
- Pass: `npm run release:check`

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

- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/enterprise-data/module-context-serving/__tests__/module-context-serving.test.ts`
- `docs/architecture/module-context-serving-contract.md`

## Known Gaps

- This PR does not wire Home, Intelligence, Moves, Source, or Tower runtime
  surfaces to call `getModuleContext(...)` by default.
- This PR does not implement Home Executive Briefing UI.
- This PR does not implement Moves Context Extract.
- Candidate preview remains explicit-only and inactive.
