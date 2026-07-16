# 2026-07-16-tower-claude-outcome-caveat-gate — Tower Claude Outcome Caveat Gate

## Release ID

`2026-07-16-tower-claude-outcome-caveat-gate`

## Status

`candidate`

## Plain-English Summary

Tower's Claude-authored CXO story path now distinguishes between unsafe outcome claims and safe caveats that say outcome proof is not ready yet. Claude is also instructed to avoid risky outcome-proof phrases and use executive-safe wording such as measurement readiness, finance-attested proof, and planning hypothesis.

## Layer Impact

- Lane: `global-control-lane`
- Tower runtime: keeps the Claude-authored executive story path active while preserving the value-claim safety boundary.
- AI egress / prompt contract: strengthens Claude instructions for outcome-proof wording without adding arbitrary rendering rewrites.
- QA / governance: adds focused tests for both safe caveat language and blocked positive outcome claims.

## Client Applicability

- All clients: Tower Claude story validation applies globally where the Tower CXO Claude story path is enabled.
- Specific clients: Meridian / Healthcare Demo is the live proof target for this release.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Existing Tower runtime path and environment controls remain unchanged.

## Changes Included

- Updated `src/lib/tower/tower-cxo-claude-story.ts` to prefer prompt-level safe wording and validate positive outcome-proof claims separately from negated/caveated phrases.
- Updated `src/lib/tower/__tests__/tower-cxo-claude-story.test.ts` with safe-caveat and positive-claim rejection coverage.

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/tower-cxo-claude-story.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in Meridian Tower browser proof after ACA deploy.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the runtime image. After deployment, verify ACA revision/digest/traffic and run signed-in Meridian Tower proof against `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: No feature/env flag changes in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and allow the ACA main deploy workflow to publish the rollback image. The fallback deterministic Tower story remains available if Claude validation fails.

## Audit Evidence

- PR URL: Pending.
- CI / validation: local focused test, TypeScript, release check, and diff check.
- Live proof: Pending signed-in Meridian browser proof after deploy.

## Known Gaps

This PR does not redesign the Tower page or change the underlying TowerContextPack data. It only fixes the Claude story validation boundary so safe caveats about missing outcome proof can pass while positive realized/proven/measured outcome claims remain blocked.
