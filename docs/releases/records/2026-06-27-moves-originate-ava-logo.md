# 2026-06-27-moves-originate-ava-logo — Canonical aVa Logo on New Move Page

## Release ID

`2026-06-27-moves-originate-ava-logo`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves originate page now uses the same canonical aVa wordmark as the shared agent surfaces. This closes the gap where Home, Intelligence, Tower, and Source create already showed the repo-owned logo asset, while the new Move page still rendered a private star/text avatar.

## Layer Impact

- `global-control-lane`: Updates shared product UI behavior for the Strategic Moves originate surface. No tenant data, schema, model prompt, or retrieval behavior changes.

## Client Applicability

- All clients: Yes, wherever `/strategic-moves/new` is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMoveOriginateClient.tsx`: replaces the private star avatar with `AvaAskMark`.
- `src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`: asserts the canonical dark wordmark asset renders on the originate page.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx src/components/agent-answer/__tests__/AvaAskMark.assets.test.ts`.
- Pass: `npx eslint src/components/strategic-moves/StrategicMoveOriginateClient.tsx src/components/strategic-moves/__tests__/StrategicMoveOriginateClient.test.tsx`.
- Pass: `npm run release:check`.
- Not run yet: ACA deploy and signed-in visual smoke on `/strategic-moves/new`.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main workflow, then verify `https://app.abarva.ai/strategic-moves/new` in a signed-in tenant session.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/strategic-moves/new` must show the canonical aVa wordmark.

## Rollback Plan

Revert the component import/render change and redeploy through ACA. This is UI-only and has no data rollback.

## Audit Evidence

- PR: Pending.
- CI: Pending.
- Deployment: Pending.
- Signed-in screenshots: Pending.

## Known Gaps

Live signed-in proof is still pending until this candidate is merged and deployed. The change is intentionally limited to the Moves originate agent header; it does not audit every older Moves sub-surface for canonical logo use.
