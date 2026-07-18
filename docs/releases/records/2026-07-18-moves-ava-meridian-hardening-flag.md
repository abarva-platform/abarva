# 2026-07-18 Moves aVa Meridian Hardening Flag

## Release ID

`2026-07-18-moves-ava-meridian-hardening-flag`

## Status

`candidate`

## Plain-English Summary

Moves aVa hardening was implemented and deployed, but signed-in Meridian proof showed it was not active for the Meridian tenant. This change enables the existing hardening path for Meridian so live gate, evidence, and readiness status questions use the deterministic Move packet instead of generic phase-pack inference.

## Layer Impact

- `global-control-lane`: changes feature-flag applicability for the shared Moves aVa chat hardening path.
- No schema, ingestion, data-layer, or tenant-data mutation changed.

## Client Applicability

- All clients: no.
- Specific clients: Lakeshore remains enabled; Meridian is added.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_ava_chat_hardening`.

## Changes Included

- `src/lib/features/registry.ts`: enables `moves_ava_chat_hardening` for Meridian.
- `src/lib/features/__tests__/is-feature-enabled.test.ts`: covers the `meridian-health` alias resolving to the Meridian feature flag.

## QA / Validation

- Pass: `npx jest src/lib/features/__tests__/is-feature-enabled.test.ts src/lib/programs/ava-chat/__tests__/packet.test.ts src/lib/programs/ava-chat/__tests__/quality-gate.test.ts --runInBand`.
- Pass: `npx eslint src/lib/features/registry.ts src/lib/features/__tests__/is-feature-enabled.test.ts`.
- Pass: `git diff --check`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Not-run yet: PR checks.
- Not-run yet: ACA deploy.
- Not-run yet: signed-in Meridian production proof.

## Rollout Plan

Open a PR, squash merge to main, allow the repo-owned ACA main deploy workflow to build and deploy the image, then rerun signed-in Meridian Moves aVa proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required during deploy.
- Worker image invariant: required during deploy.
- Feature/env flag update path: static registry change in this PR.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or remove Meridian from `moves_ava_chat_hardening.includeTenants`. Because this only changes feature applicability, rollback is runtime-only.

## Audit Evidence

- Failed post-#5019 signed-in proof: `/Users/anand/Projects/nexus/proof/moves-phase-intel-s1c-live-2026-07-18T15-13-52-659ZZ`.
- PR URL: pending.
- ACA deploy run: pending.
- Post-deploy signed-in proof: pending.

## Known Gaps

- This only activates the already-built hardening path for Meridian. It does not redesign Moves phase intelligence, document quality, upload UX, or gate-page IA.
