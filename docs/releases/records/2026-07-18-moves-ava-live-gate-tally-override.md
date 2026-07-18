# 2026-07-18-moves-ava-live-gate-tally-override — Moves aVa Live Gate Tally Override

## Release ID

`2026-07-18-moves-ava-live-gate-tally-override`

## Status

`candidate`

## Plain-English Summary

Moves aVa now treats the live Move workspace state as authoritative for gate, evidence, readiness, and workflow-status questions. This fixes a signed-in Meridian proof failure where the page showed one hard gate open, but aVa answered from generic phase-pack guidance and claimed five hard criteria were open.

## Layer Impact

- `global-control-lane`: updates the shared Moves chat grounding prompt and server packet construction for all tenants using the Moves aVa chat hardening flag.

## Client Applicability

- All clients: applies when the Moves aVa chat hardening flag is enabled.
- Specific clients: first verified against Meridian Health.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening`.

## Changes Included

- `src/app/api/chat/agent/route.ts`: adds the same live Strategic Move model used by the workspace shell into the Moves chat packet; sends workspace-level evidence and hard-gate status in `checklistStatus`.
- `src/lib/programs/ava-chat/system-prompt.ts`: marks the live Moves grounding block as authoritative over generic phase packs for current gate/evidence/status questions and renders an explicit live hard-gate tally.
- `src/lib/programs/ava-chat/__tests__/packet.test.ts`: covers the authoritative prompt wording and live tally.

## QA / Validation

- Pass: `npx eslint src/app/api/chat/agent/route.ts src/lib/programs/ava-chat/system-prompt.ts src/lib/programs/ava-chat/__tests__/packet.test.ts`
- Pass: `npx jest src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/ava-chat/__tests__/quality-gate.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pending: `npm run release:check`
- Pending: post-deploy signed-in Meridian browser proof.

## Rollout Plan

Open PR, squash merge to `main`, deploy through the repo-owned ACA main deploy workflow, then rerun the signed-in Meridian proof that previously exposed the mismatch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: no flag or env change.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. The change is prompt/packet-only and has no schema migration.

## Audit Evidence

- PR URL: pending.
- Local proof of pre-fix failure: `proof/moves-phase-intel-s1-live-2026-07-18/`
- Post-deploy proof: pending.

## Known Gaps

- This does not implement Phase Intelligence tabs, KDD decision threads, or new healthcare function packs. Those remain separate planned slices.
