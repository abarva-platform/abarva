# 2026-06-27-home-tower-visible-answer-contract — Home and Tower aVa Visible Answer Contract

## Release ID

`2026-06-27-home-tower-visible-answer-contract`

## Status

`candidate`

## Plain-English Summary

Home KNOW and Tower synthesis now share a strict visible-answer contract: Claude writes the answer, while AbarVa owns context, routing, safety, artifacts, and rendering. Answers that expose internal machinery, raw IDs, Atlas branding, template labels, or stock endings are blocked instead of silently rewritten.

## Layer Impact

- `global-control-lane`: Adds a shared agent visible-answer contract used by Home and Tower.
- `global-control-lane`: Changes Tower synthesis from partial token streaming to validated text return so the backend can block violations before users see them.

## Client Applicability

- All clients: yes, for Home KNOW and Tower synthesis.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `src/lib/agent/visible-answer-contract.ts`.
- Wired Home KNOW quality validation through the shared visible-answer contract.
- Changed Home KNOW route behavior to return `visible_answer_contract_failed` instead of silently returning violating prose.
- Updated Tower synthesis prompt from Atlas/ID-oriented instructions to aVa/display-name-only instructions.
- Invalidated cached Tower answers that fail the visible-answer contract.
- Added visible-answer blocking to `/api/v1/atlas/chat` and `/api/v1/atlas/ask`, the legacy Tower chat API paths still used by the Tower dock.
- Added focused Jest coverage for the shared contract, Tower prompt invariants, and the Tower dock adapter.

## QA / Validation

- `npx jest src/lib/agent/__tests__/visible-answer-contract.test.ts src/app/api/tower/synthesis/route.test.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx --runInBand` — passed, 20/20 tests.
- `npx eslint src/lib/agent/visible-answer-contract.ts src/lib/agent/__tests__/visible-answer-contract.test.ts src/app/api/home/know/ask/route.ts src/app/api/tower/synthesis/route.ts src/app/api/tower/synthesis/route.test.ts src/app/api/v1/atlas/chat/route.ts src/app/api/v1/atlas/ask/route.ts src/lib/atlas/prompt.ts src/components/atlas/__tests__/AtlasChatPanel.test.tsx` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to main and deploy through the approved Azure Container Apps lane for `app.abarva.ai`. After deploy, run signed-in Home and Tower browser checks that ask questions known to previously trigger `Read:`, `Evidence:`, `Next move:`, raw IDs, or Atlas branding.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared ACA runtime.
- Shared runtime mutators: Only the approved repo-owned main deploy path should mutate `ca-abarva-web-lab-eastus`.
- Approved image digest: To be recorded after `az acr build`.
- ACA runtime invariant: Template image, 100% traffic revision, and active revision image must match the approved main digest.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not changed.
- Live signed-in proof required: Yes, signed-in Home KNOW and Tower chat checks for aVa branding plus visible-answer contract behavior.

## Rollback Plan

Revert this release commit and redeploy the previous approved ACA image. No schema migration or data rollback is required.

## Audit Evidence

- Focused Jest, ESLint, and TypeScript command outputs from the local release candidate.
- PR URL and ACA revision/image digest to be attached when the release candidate is merged and deployed.

## Context Ingestion Evidence

Not applicable. This release does not change ingestion, parsing, embeddings, search refresh, or client data-plane commit behavior.

## Known Gaps

- Not deployed yet in this local change set.
- Browser-visible proof still needs to be run after ACA deploy.
