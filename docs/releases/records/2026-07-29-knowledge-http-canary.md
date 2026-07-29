# 2026-07-29-knowledge-http-canary — Knowledge HTTP Canary

## Release ID

`2026-07-29-knowledge-http-canary`

## Status

`candidate`

## Plain-English Summary

Adds an admin-only canary path for the Knowledge vNext preview so an operator can prove the real HTTP consumption provider against an approved governed baseline before enabling any tenant-facing rollout.

## Layer Impact

- Layer 4 Products: adds a preview-only runtime selection path for the Knowledge shell.
- Consumption API: permits a narrowly allowlisted admin canary tenant override only after platform-admin authorization.
- Data plane: no schema, data, review decision, publication, projection, or baseline mutation.

## Client Applicability

- All clients: no tenant-facing behavior change.
- Specific clients: none activated by this release.
- Internal only: platform-admin Knowledge preview canary.
- Public/demo only: no public route change.
- Feature flag: `home_knowledge_vnext` remains tenant-default off.

## Changes Included

- `/knowledge-preview` can select the HTTP provider for the approved canary tenant through an admin-only query path.
- The HTTP provider can pass an admin canary marker to consumption APIs.
- Consumption APIs honor that marker only for a platform-admin session and only for the allowlisted canary tenant.
- Fixture runtimes remain prohibited for canonical tenant keys.

## QA / Validation

- `npx jest src/lib/knowledge/consumption-client/__tests__/vnext-consumption.test.ts src/lib/knowledge/consumption-client/__tests__/activation-guard.test.ts --runInBand` — passed, 39 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge to main, deploy through the repo-owned Azure Container Apps lane, verify the ACA runtime invariant, then perform signed-in browser proof on the admin canary path before any tenant activation.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this release record.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none for this canary; tenant activation remains separate.
- Live signed-in proof required: yes, before provider activation.

## Rollback Plan

Revert the PR and redeploy through the ACA lane. Because this change does not mutate data or activate a tenant, rollback is code-only.

## Audit Evidence

- PR URL: pending.
- Focused Jest output: local terminal.
- TypeScript output: local terminal.
- Browser screenshots and ACA invariant: pending after deploy.

## Known Gaps

- This release does not activate any tenant-facing HTTP provider.
- This release does not complete signed-in admin or tenant proof.
- Superset and Observable runtime proof remain out of scope for this canary.
