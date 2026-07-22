# 2026-07-22-home-cxo-language-compact — Home CXO language and compact dashboard polish

## Release ID

`2026-07-22-home-cxo-language-compact`

## Status

`candidate`

## Plain-English Summary

Removes database/ETL language from the Home Knowledge cockpit and tightens the dashboard typography. Executives should see coverage, confidence, evidence support, and mapped connections rather than raw row/fact/edge/node counts. The change keeps source drill-down and CSV export intact while making the default cockpit read like a business dashboard.

## Layer Impact

- `global-control-lane`: Home/Knowledge visible copy and compact dashboard rendering.
- `client-data-lane`: none; no schema or data mutation.

## Client Applicability

- All Home tenants using the shared Home Knowledge design-contract surface.
- First signed-in proof targets: Meridian and FS Demo.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: replace visible row/fact/edge/node/record counters with business posture labels such as broad coverage, source-backed, evidence present, and validated connections.
- Compact dashboard and six-question card typography to better match a professional product dashboard.
- Hide raw numeric axes and matrix cell counts in context visuals where the number represents internal coverage volume rather than an executive business metric.

## QA / Validation

- `pass` — focused ESLint.
- `pass` — TypeScript.
- `pass` — release check passed.
- `not-run` — signed-in browser proof pending after deploy.

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main lane. Run signed-in browser proof for Meridian and FS Demo and confirm visible Home copy no longer leads with raw row/fact/edge/node language.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy.
- Shared runtime mutators: none.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior image. No migration rollback is required.

## Audit Evidence

- PR URL: pending.
- Live proof: pending.

## Known Gaps

- This does not implement the full Enterprise Knowledge Atlas projection contract from the follow-up brief. It cleans the current Home cockpit language and visual scale while that larger Atlas work is scoped separately.
