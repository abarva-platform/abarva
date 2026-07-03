# 2026-07-03-source-client-final-jsonb-persistence — Source Client-Final JSONB Persistence

## Release ID

`2026-07-03-source-client-final-jsonb-persistence`

## Status

`candidate`

## Plain-English Summary

This release fixes the Source client-final acceptance path after live proof found that the uploaded client-final artifact reached the API route and Blob storage, but failed while writing the client-final change summary into the File Cabinet metadata row. The change serializes that JSONB metadata at the shared File Cabinet insert boundary and keeps reads tolerant of either parsed JSON or serialized JSON.

## Layer Impact

- `global-control-lane`: Updates shared Source File Cabinet persistence used by Source artifacts.

## Client Applicability

- All clients: Yes, for Source artifact metadata persistence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/file-cabinet/repository.ts`: serializes `client_final_change_summary` for insert and parses it defensively when rows are read back.
- `src/lib/source/file-cabinet/__tests__/repository.test.ts`: adds a regression proving the client-final metadata insert payload is valid and the returned record maps the summary back into an object.

## QA / Validation

- Pass: focused Jest for Source File Cabinet repository.
- Pass: focused ESLint on changed files.
- Pass: full TypeScript compile with `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- Pass: `npm run release:check`.
- Not run: live signed-in SkyHarbor client-final proof will run after deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, and rerun the live signed-in client-final proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Source File Cabinet persistence.
- Approved image digest: Pending deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic after health.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback the ACA web app to the prior healthy revision or revert the File Cabinet repository change. No schema changes are included in this follow-up release.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof bundle: Pending.

## Known Gaps

This follow-up only fixes client-final JSONB metadata persistence. It does not change client-final governance copy, UI flow, gate semantics, or export resolution.
