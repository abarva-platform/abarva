# 2026-07-18 Moves aVa Deterministic Status Answer

## Release ID

`2026-07-18-moves-ava-deterministic-status-answer`

## Status

`candidate`

## Plain-English Summary

Moves aVa status questions now answer from the live Move checklist packet instead of asking Claude to reconcile the generic phase playbook with current page state. This prevents gate-status answers such as "all four criteria are open" when the live workspace says "1 hard gate open."

## Layer Impact

- `global-control-lane`: changes the shared `/api/chat/agent` behavior for Moves status, gate, and evidence-readiness questions when the Moves aVa hardening flag is active.
- No data schema, tenant data, ingestion, or promotion behavior changed.

## Client Applicability

- All clients: no.
- Specific clients: tenants with `moves_ava_chat_hardening` enabled.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening`.

## Changes Included

- `src/app/api/chat/agent/route.ts`: returns a deterministic live-status answer for Moves evidence/gate/readiness modes before AI egress.
- `src/lib/programs/ava-chat/answer-modes.ts`: classifies "current gate status" and related wording as `gate_blocker`.
- `src/lib/programs/ava-chat/deterministic-answer.ts`: formats the live checklist/evidence/gate status answer.
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`: covers the live proof failure pattern.

## QA / Validation

- `npx jest src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/ava-chat/__tests__/quality-gate.test.ts --runInBand` passed.
- `npx eslint src/app/api/chat/agent/route.ts src/lib/programs/ava-chat/answer-modes.ts src/lib/programs/ava-chat/deterministic-answer.ts src/lib/programs/ava-chat/__tests__/packet.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.
- `git diff --check` passed.
- `npm run release:check` pending after adding this record.
- Signed-in Meridian production proof pending after merge/deploy.

## Rollout Plan

Open a PR, squash merge to main, allow the repo-owned ACA main deploy workflow to build and deploy the image, then run the signed-in Meridian Moves proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required during deploy.
- Worker image invariant: required during deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR or disable `moves_ava_chat_hardening` for the affected tenant. Because this does not change data or schema, rollback is runtime-only.

## Audit Evidence

- Pre-fix failed proof: `/Users/anand/Projects/nexus/proof/moves-phase-intel-s1b-live-2026-07-18T14-39-56Z`.
- Request capture showing phase-pack drift: `/Users/anand/Projects/nexus/proof/moves-phase-intel-s1b-request-capture-2026-07-18T14-43-29Z`.
- PR URL: pending.
- ACA deploy run: pending.
- Post-deploy signed-in proof: pending.

## Known Gaps

- This only fixes deterministic status/gate/evidence readiness answers. Broader Moves coaching and phase-intelligence UX remain separate slices.
