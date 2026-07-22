# 2026-07-22-home-enterprise-brief-proof-polish — Home first-screen proof polish

## Release ID

`2026-07-22-home-enterprise-brief-proof-polish`

## Status

`candidate`

## Plain-English Summary

Fixes two first-screen polish defects caught by signed-in Meridian and FS Demo proof after the Home read-model performance release deployed: FS Demo should not render as "FS Demo Demo", and the executive-read headline should be sized like a CXO report headline rather than a giant hero title.

## Layer Impact

- `global-control-lane`: Home Enterprise Brief presentation only.

## Client Applicability

- All clients: tenant names that already include "Demo" no longer receive a second demo pill; all clients receive the tighter executive headline sizing.
- Specific clients: Meridian and FS Demo are the first proof targets.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: suppresses the demo pill when `pack.tenant_name` already includes Demo and reduces the executive-read headline font scale.

## QA / Validation

- `pass` — focused ESLint for `src/components/home/HomeKnowledgeDesignContractSurface.tsx`.
- `pass` — `npm run build` with existing Turbopack broad-file-pattern warnings only.
- `not-run` — signed-in Meridian and FS Demo proof pending after deploy.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main lane. Then rerun the signed-in Home proof for Meridian and FS Demo and expand to remaining tenants where storage state is valid.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy.
- Shared runtime mutators: none.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior image. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending.
- Browser proof: pending.

## Known Gaps

- This does not change Home pack data, generation, or relationship graph semantics. It is presentation polish triggered by the first Meridian/FS proof run.
