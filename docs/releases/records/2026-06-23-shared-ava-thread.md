# 2026-06-23-shared-ava-thread — Shared Ava Conversation Thread

## Release ID

`2026-06-23-shared-ava-thread`

## Status

`candidate`

## Plain-English Summary

Ask Ava now keeps a visible conversation thread instead of replacing the prior answer with the latest one. The canonical `AvaAsk` component appends each user question and Ava answer, clears the composer after submit, keeps multi-line prompts readable, and still renders structured answers through the single `AgentAnswerRenderer`.

Intelligence v2 now uses the same canonical `AvaAsk` component as Home, removing its duplicated ask/answer state and reducing the risk that Home and Intelligence drift.

## Layer Impact

- `global-control-lane`: changes shared client-side ask behavior for surfaces that use `AvaAsk`.
- `public-demo`: no public route change.
- `client-data-lane`: no data/schema/load change.

## Client Applicability

- All clients: yes, for Home and Intelligence surfaces using the shared component.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing surface flags still control whether the React Home/Intelligence surfaces are active.

## Changes Included

- `src/components/agent-answer/AvaAsk.tsx`: stores visible turns as a list, renders user prompt bubbles plus assistant answer cards, and exposes canonical suggested-question handling.
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: removes duplicate ask streaming/render state and mounts `AvaAsk` with the existing Intelligence surface context.
- `src/components/agent-answer/__tests__/AvaAsk.test.tsx`: adds a regression test proving two submitted questions keep both prior and current Q/A visible.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: updates the surface test to prove Intelligence still posts the same context and uses the canonical renderer without exposing raw IDs.

## QA / Validation

- `npm test -- --runTestsByPath src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx --runInBand` passed 4/4, with pre-existing duplicate manual mock warnings.
- `npx eslint src/components/agent-answer/AvaAsk.tsx src/components/intelligence-v2/IntelligenceV2Surface.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx` passed.

## Rollout Plan

Merge to `main`, build and deploy through the approved Azure Container Apps lane, then run signed-in Home and Intelligence browser checks for all five tenants. The fix is not marked green until the deployed browser shows multiple Q/A turns retained.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps web runtime only.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none in this PR.
- Live signed-in proof required: yes, Home + Intelligence ask history on deployed app.

## Rollback Plan

Rollback the ACA web app to the prior approved digest or revert this PR. No data migration or schema rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployed screenshot/report: pending.

## Known Gaps

Tower still needs to be moved onto the same shared threaded ask contract if its current Atlas-specific answer path must preserve visible multi-turn history. This PR fixes the shared `AvaAsk` contract and Intelligence duplication first.
