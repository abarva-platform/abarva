# 2026-07-03-moves-origination-extractor-fix — Moves P0 Extractor Determinism

## Release ID

`2026-07-03-moves-origination-extractor-fix`

## Status

`candidate`

## Plain-English Summary

Strategic Moves origination could answer the user in chat but fail to fill the required P0 checklist, leaving the Promote button disabled. This release makes the fallback extractor deterministic for clearly labeled Move briefs, so fields such as sponsor, scope, evidence family, value hypothesis, and foundation readiness are captured even when Claude does not emit the structured artifact.

## Layer Impact

- `global-control-lane`: Updates the shared Moves P0 origination extraction route used by all tenants.
- `public-demo`: Improves the live demo path for creating a Kyriba treasury Move from the signed-in product.

## Client Applicability

- All clients: Yes, for tenants using Strategic Moves origination.
- Specific clients: Validated locally against the Industrial Demo / Lakeshore CFO demo path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/programs/originate/extract-brief/route.ts`
- `src/app/api/v1/programs/originate/extract-brief/extract-brief-deterministic.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/v1/programs/originate/extract-brief/extract-brief-deterministic.test.ts src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx` — Pass.
- Live pre-fix pressure test showed `/api/v1/programs/originate/extract-brief` returned `{"fields":{}}` for an explicit Kyriba treasury brief and left Promote disabled.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, wait for healthy revision and 100% traffic, then rerun the signed-in Industrial Moves intake and promotion smoke.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None outside normal ACA deploy.
- Approved image digest: Resolved by ACA deploy workflow.
- ACA runtime invariant: Required.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Industrial Moves Kyriba intake through Promote.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image. No database migration is included.

## Audit Evidence

- PR URL: to be added by release owner.
- CI: focused Jest, ESLint, release check, and PR checks.
- Live smoke: signed-in Industrial Moves Kyriba intake/promotion report after deploy.

## Known Gaps

This does not guarantee every conversational answer emits a `brief-progress` artifact. It makes the fallback path reliable for explicitly labeled P0 intake content.
