# 2026-07-12-moves-gate-attestation-routing — Moves Gate Attestation Routing

## Release ID

`2026-07-12-moves-gate-attestation-routing`

## Status

`candidate`

## Plain-English Summary

Moves phase workspace chat can now reach the existing deliverable persistence tools when a user explicitly asks to save, complete, approve, or sign off accepted gate evidence. This keeps self-attested controls such as P3 requirements traceability governed by human acceptance while avoiding the false product dead end where aVa could describe the gate but not access the tool that records the accepted evidence.

## Layer Impact

- Agent tool routing: exposes the existing single and batch deliverable persistence tools on `/strategic-moves/:id/phase/:phase`, matching the phase workspace chat surface.
- Governance controls: preserves the rule that AI-generated drafts do not satisfy self-attestation by themselves; signed deliverables still require publish rights.
- Data plane: no schema, migration, or tenant data changes.

## Client Applicability

- All clients: yes, for users with access to Moves phase workspaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/agent/tools/program/completeDeliverable.ts`
- `src/lib/agent/tools/program/completeDeliverables.ts`
- `src/lib/agent/tools/__tests__/completeDeliverable.test.ts`
- `src/lib/agent/tools/__tests__/completeDeliverables.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/agent/tools/__tests__/completeDeliverable.test.ts --runInBand`
- Pass: `npx jest src/lib/agent/tools/__tests__/completeDeliverables.test.ts --runInBand`
- Pass: `npx jest src/lib/programs/__tests__/failure-mode-prompt.test.ts --runInBand`
- Pass: `npx eslint src/lib/agent/tools/program/completeDeliverable.ts src/lib/agent/tools/program/completeDeliverables.ts src/lib/agent/tools/__tests__/completeDeliverable.test.ts src/lib/agent/tools/__tests__/completeDeliverables.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- Pass: `npm run release:check`
- Not run: signed-in browser proof; requires merged/deployed ACA runtime.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No migration, data-build job, or feature flag rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none in this PR.
- Approved image digest: set by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify a real Moves phase workspace chat exposes and can use the completion path with authorized test evidence.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. This returns the Moves phase workspace to draft-only artifact tooling; no data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI / validation: pending.
- ACA deployment evidence: pending.
- Signed-in browser proof: pending.

## Known Gaps

No production browser proof yet. This candidate fixes the tool availability path; it does not generate traceability evidence automatically, by design.
