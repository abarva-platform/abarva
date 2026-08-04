# 2026-08-04-home-cxo-report-visual-quality - Home CXO Report Visual Quality

## Release ID

`2026-08-04-home-cxo-report-visual-quality`

## Status

`candidate`

## Plain-English Summary

Improves the Home executive report canvas so advisory headlines take less vertical space and the Use Cases advisory tab reads as a clear 2x2 leadership-prioritization surface instead of a dense chart.

## Layer Impact

- Release lane: `global-control-lane`.
- CLIENT INTAKE: no client intake contract changes.
- SOURCE ADAPTERS: no loader or adapter changes.
- CANONICAL MODEL: no canonical model mutation.
- PRODUCTS: `/home` presentation changes only. Existing deterministic Home data and narrative inputs remain the source for rendered content.

## Client Applicability

- All clients: yes, for the shared Home command-center presentation once deployed.
- Specific clients: none named in this public release record.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Reduced advisory headline scale and lead spacing in the Home command-center canvas.
- Replaced the Use Cases advisory chart with a deterministic 2x2 matrix grouped by business materiality and evidence readiness.
- Removed no-longer-needed scatter-chart imports from the Home command-center component.

## QA / Validation

- `npx eslint src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx` passed.
- `git diff --check` passed.
- `npm run release:check` passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false` passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npm run build` passed with existing broad-file-pattern Turbopack warnings.
- Focused component test command ran. The advisory render assertion passed, while two pre-existing aVa drawer assertions failed because the test expects the older non-streaming request/response contract.
- Local signed-in browser QA reached the Responsible AI acknowledgment gate, but the local acknowledgment ledger was unavailable, so `/home` visual proof could not proceed in this environment.

## Rollout Plan

Merge through PR. Production activation must use the repo-owned Azure Container Apps main deploy workflow. After the workflow deploys the new main image, run signed-in `/home` proof on the deployed runtime.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this release candidate.
- Approved image digest: assigned by the main ACA deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this release commit through PR and redeploy through the repo-owned ACA main deploy workflow. No migrations or data rebuilds are included.

## Audit Evidence

- Local source diff: `src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx`
- Local source diff: `src/components/home/ai-success-command-center/AiSuccessCommandCenter.module.css`
- Local signed-in blocker screenshot: `reports/home-ai-success-command-center-quality/prod-font-usecase-qa-authed/desktop-thesis.png`

## Known Gaps

- Local signed-in visual proof is blocked by the unavailable Responsible AI acknowledgment ledger in this development environment.
- Production signed-in proof is still required after the ACA deploy workflow completes.
