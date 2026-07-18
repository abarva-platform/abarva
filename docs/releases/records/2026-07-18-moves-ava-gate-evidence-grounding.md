# 2026-07-18 Moves aVa Gate/Evidence Grounding

## Release ID

`2026-07-18-moves-ava-gate-evidence-grounding`

## Status

`candidate`

## Plain-English Summary

Moves aVa chat now reads the same phase-gate and evidence-readiness sources that the Moves workspace uses. This removes a drift path where the UI could show one gate/evidence state while aVa answered from a thinner "latest action / uploaded count" summary.

## Layer Impact

- `global-control-lane`: shared Moves aVa prompt grounding changes for all tenants where `moves_ava_chat_hardening` is enabled.
- `runtime app`: no schema or data-plane mutation; the chat route performs one additional read through the existing evidence-readiness path when the feature flag is on.

## Client Applicability

- All clients: applies wherever the feature flag is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening`.

## Changes Included

- `src/lib/programs/transformers.ts`: exports the canonical `buildGateCriteria` helper.
- `src/app/api/chat/agent/route.ts`: builds the Moves aVa chat packet from canonical gate criteria and discovery evidence-readiness packets.
- `src/lib/programs/__tests__/strategic-moves-transformers.test.ts`: adds regression coverage for exported canonical gate criteria.

## QA / Validation

- Pass: `npx eslint src/lib/programs/transformers.ts src/app/api/chat/agent/route.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts`
- Pass: `npx jest src/lib/programs/__tests__/strategic-moves-transformers.test.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/ava-chat/__tests__/quality-gate.test.ts src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Baseline pre-existing failures: `npx jest src/lib/programs --runInBand` fails identically after stashing this slice, in unrelated suites covering orchestrated business-case quality expectations, Office upload quarantine, tenant display-name expectations, industry profiles, and function-pack grounding.

## Rollout Plan

Merge to main through PR-only flow. The change becomes runtime-visible after the repo-owned ACA main deploy workflow builds and deploys the main image.

## Deployment Authority

- Repo-owned deploy workflow: required for production visibility.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none in this PR.
- Live signed-in proof required: yes, ask aVa on a real Move for gate status and missing evidence, and compare against the phase workspace.

## Rollback Plan

Revert the PR. Because this only changes read-time prompt grounding and exports an existing helper, rollback does not require a migration or data repair.

## Audit Evidence

- PR URL: pending.
- Browser proof: pending.
- Validation output: local command output in the Codex run.

## Known Gaps

- This does not add the Phase Intelligence tab.
- This does not add Key Design Decision persistence.
- This does not author the healthcare member-service Function Pack.
