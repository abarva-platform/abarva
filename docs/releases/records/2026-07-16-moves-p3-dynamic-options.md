# 2026-07-16-moves-p3-dynamic-options — Dynamic P3 Solution Options

## Release ID

`2026-07-16-moves-p3-dynamic-options`

## Status

`candidate`

## Plain-English Summary

Moves P3 no longer shows the same generic three solution approaches for every use case. P3 now assembles a typed design-input pack from prior phase signals, current-state readiness, evidence gaps, controls, and charter context, then generates use-case-specific solution options with deterministic scoring. aVa can improve narrative, but it does not invent the scores or recommendation.

## Layer Impact

- `global-control-lane`: Updates shared Moves phase workspace behavior for all clients using P3.
- Product UI: Updates the shared Moves phase workspace option cards for P3.
- Program methodology: Adds a typed P2-to-P3 handoff contract and deterministic option assembly.
- Runtime data behavior: No schema, migration, tenant data, candidate data, or Active Tenant Access changes.

## Client Applicability

- All clients: Yes, for Moves P3 phase workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `p3-option-assembler.ts` for P3 design-input-pack construction, use-case inference, option assembly, and deterministic scoring.
- Extends `P3DesignInputsPack` with richer P2-to-P3 contract fields.
- Updates `MovesPhaseStandaloneClient` to render dynamic P3 options and capture the selected dynamic option label.
- Adds unit and component tests covering dynamic options and static fallback prevention.

## QA / Validation

- Pass: `npx jest src/lib/programs/phase-templates/__tests__/p3-option-assembler.test.ts src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` (22 tests passed; existing duplicate manual mock warnings still present)
- Pass: `npx eslint src/lib/programs/phase-templates/p3-option-assembler.ts src/lib/programs/phase-templates/types.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/phase-templates/__tests__/p3-option-assembler.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Not run yet: signed-in browser proof on Meridian P3 after P2 evidence is available.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. After deployment, run signed-in browser proof on a disposable or demo-safe Meridian Move in P3.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. This returns P3 to the previous static option-card behavior without data migration rollback.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4897
- Local validation output: Pending.
- ACA deployment proof: Pending.
- Signed-in Meridian browser proof: Pending.

## Known Gaps

- This is a deterministic V0 using available phase/readiness/evidence signals in the workspace. A future server-side approved P3 Design Inputs Pack store can make the P2-to-P3 contract more explicit and auditable across reloads.
