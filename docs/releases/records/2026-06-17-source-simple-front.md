# 2026-06-17-source-simple-front — Source Start Here Simple Front

## Release ID

`2026-06-17-source-simple-front`

## Status

`candidate`

## Plain-English Summary

Adds a feature-flagged Source "Start here" screen that gives sourcing teams one simple stage front: up to three inputs, one button to write the stage document, and one next step. The advanced Source workspace remains available, but the default path can now feel like a guided sourcing workflow instead of a console.

## Layer Impact

- `global-control-lane`: Adds shared Source UI composition, a new feature flag, and a small evidence-answer API route.
- `client-data-lane`: Writes client-stated evidence answers to existing Source evidence-state rows and the existing Source activity log. No schema change.

## Client Applicability

- All clients: Code is available but disabled by default.
- Specific clients: None automatically enrolled.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_simple_front`.

## Changes Included

- New simple-stage resolver: `src/lib/source/simple-front.ts`.
- New Start Here UI component: `src/components/source/canvas/SimpleStageFront.tsx`.
- New client-stated evidence answer route: `POST /api/v1/source/[eventId]/evidence/[requirementId]/answer`.
- Source event page now evaluates `source_simple_front` and passes it into the canvas.
- Feature flag registry adds `source_simple_front`.

## QA / Validation

- Blocked: `npx tsc --noEmit --pretty false` is blocked by existing missing type packages outside this slice (`@azure-rest/ai-document-intelligence` and `@axe-core/playwright`).
- Pass: `npx eslint src/lib/source/ src/components/source/ src/app/api/v1/source/` completed with 0 errors; existing warnings remain in older Source files.
- Pass: focused resolver/UI/API tests for the simple front and evidence-answer route.
- Pass: `npm run test:behaviors` completed with 195 passing tests.
- Pending: `node scripts/release-check.mjs --base origin/main --head HEAD` after this release-record update.
- Blocked: Local browser proof reached the Clerk one-time-code sign-in screen before the Source event. Product click-proof must run after deploy on a signed-in app domain or with an authenticated dev session.

## Rollout Plan

Merge to main, deploy through the normal Azure Container Apps control-lane build, then enable `source_simple_front` only for the selected pilot tenant via the feature-flag allowlist or environment tenant list.

## Rollback Plan

Disable `source_simple_front` for the tenant to return to the existing Source canvas immediately. If needed, revert the PR; no migration rollback is required.

## Audit Evidence

- PR and CI checks will be attached to the release candidate before promotion.
- Local browser attempt evidence: `http://localhost:3017/source/events/affa4231-eecd-4019-9b76-06bb8d324988?stage=scope` redirected to Clerk sign-in before product UI.
- Evidence answer writes are visible in `source_event_activity` with `action_type=evidence_answered`.

## Known Gaps

- Archetype-tailored input ranking is S1.1 and intentionally out of scope.
- The advanced workspace remains the place for detailed document, evidence, gate, and log inspection.
