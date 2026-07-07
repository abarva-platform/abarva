# 2026-06-06-agent-client-training-gate - Agent Client Auth Training Gate

## Release ID

`2026-06-06-agent-client-training-gate`

## Status

`candidate`

## Plain-English Summary

Agent crawl auth priming now completes both Responsible AI prerequisites before saving local Playwright session state. The previous helper accepted the Responsible AI acknowledgment but could still leave a persona stopped on the newer Responsible AI training page, which blocked signed-in crawls for admin/setup and other private routes.

## Layer Impact

- `internal-admin`: Updates local operator tooling used to create per-client signed-in crawl states for QA and demo evidence capture.
- `global-control-lane`: Aligns the auth priming helper with the global Responsible AI training gate without changing buyer-facing runtime behavior.

## Client Applicability

- All clients: The helper can prime any supported canonical agent persona.
- Specific clients: The issue was observed while validating SkyHarbor admin and CIO crawl flows.
- Internal only: The generated `.auth/*.json` session files remain local-only and are not committed.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/auth/prime-agent-client-auth-states.ts` posts the current Responsible AI training completion after acknowledgment and before route probes.
- `docs/runbooks/agent-client-test-login-crawl-auth.md` documents that the helper completes both Responsible AI gates and records the new failure mode.

## QA / Validation

- Runtime proof before this candidate: local Playwright session states were trained manually against `https://app.abarva.ai`; all five active states returned HTTP 200 from `/api/ai-liability/responsible-ai-training`.
- Runtime proof before this candidate: signed-in route capture passed for Lakeshore CFO/CIO, Meridian CDAO, SkyHarbor CTO, and SkyHarbor admin after training completion.
- Candidate validation to run before merge: `BASE_URL=https://app.abarva.ai npm run auth:agent-client-states -- --client skyharbor --refresh`.
- Candidate validation to run before merge: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to main through the normal PR path. No database migration or production deploy is required for the helper itself; operators pick up the fix when they pull main and regenerate local `.auth/*.json` states.

## Rollback Plan

Revert the PR if the helper cannot complete training in an environment where the route or API is unavailable. Existing local session files can be deleted and regenerated with the prior helper if needed, though those sessions may still require manual training completion.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local runtime evidence: `/private/tmp/nexus-agent-client-auth-20260606/reports/2026-06-06-storage-state-route-captures/2026-06-06T02-51-17-065Z/summary.json`.
- Local runtime evidence: `/private/tmp/nexus-agent-client-auth-20260606/reports/2026-06-06-accelerated-prod-crawl/meridian/2026-06-06T02-48-08-611Z-local`.
- Local runtime evidence: `/private/tmp/nexus-agent-client-auth-20260606/reports/2026-06-06-accelerated-prod-crawl/skyharbor-cto/2026-06-06T02-48-08-773Z-local`.

## Known Gaps

SkyHarbor data-load, Moves, and Source artifact proof remain separate backlog work. This change only removes the agent-login/training gate blocker.
