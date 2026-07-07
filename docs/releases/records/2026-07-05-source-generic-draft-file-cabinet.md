# 2026-07-05-source-generic-draft-file-cabinet — Source Generated Draft File Cabinet Lineage

## Release ID

`2026-07-05-source-generic-draft-file-cabinet`

## Status

`candidate`

## Plain-English Summary

Source generic generated artifacts now create the same File Cabinet generated-draft lineage that client-final uploads require. This closes a gap where a generated RFP draft could appear in the File Cabinet, but the client-final upload route could still reject the updated client-final RFP because the draft was not registered with the client-scoped File Cabinet fields.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact persistence behavior for all clients.
- `client-data-lane`: Writes richer metadata for future generated Source artifacts, but does not change schema or mutate existing data.

## Client Applicability

- All clients: Yes, for Source events using the generic generated-artifact route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts`
  - Adds File Cabinet generated-draft registration for generic generated artifacts.
  - Sets client-scoped `artifact_group=generated`, `artifact_type`, version, draft status, Blob path, and lineage metadata.
  - Supersedes previous generated versions for the same event/artifact type.

## QA / Validation

- `Pass`: Focused ESLint on the changed Source route.
- `Pass`: TypeScript compile with `tsc --noEmit`.
- `Pass`: `npm run release:check`.
- `Pending`: Signed-in live Source proof after ACA deployment, covering generated RFP draft then client-final RFP upload.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then run a signed-in Lakeshore Source proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Source API route only.
- Approved image digest: Pending deployment.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must route 100% traffic to the deployed revision before live proof is claimed.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the route change and redeploy the prior ACA image. No schema rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI/check output: Pending.
- Live proof bundle: Pending.

## Known Gaps

The heavy `d09_rfp_pack` LLM deliverable generator can still be slow and should be handled as a separate performance/async-generation backlog item. This release fixes generated-draft lineage for the generic generated-artifact route used by recording and client-final upload workflows.
