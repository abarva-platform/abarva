# 2026-07-13-phase-success-package-v0 — Moves Phase Success Package V0

## Release ID

`2026-07-13-phase-success-package-v0`

## Status

`candidate`

## Plain-English Summary

Adds a V0 Moves capability to generate two governed artifacts from the active Move phase: a Phase Execution Package and a Next Phase Readiness Package. The generator reads runtime Move state, phase evidence requirements, existing artifacts, gate criteria, linked evidence, sessions, templates, and feed-forward readiness instead of producing a static template document.

## Layer Impact

- Global-control-lane: Adds a Move-scoped API route and UI action that writes generated package artifacts into the existing Move Artifact Vault.
- Product UI: Adds a `Generate Execution & Readiness` action beside the existing session-pack generation action in the Moves session panel.
- Artifact governance: Uses existing artifact versioning, phase-specific artifact types for V0, duplicate-current-artifact reuse, approved-package overwrite blocking, provenance metadata, and generated-package exclusion from future evidence cutoffs.

## Client Applicability

- All clients: Available wherever the Moves session panel and artifact vault are enabled after deployment.
- Specific clients: Meridian Member Experience P2 is the intended live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-success-package/core.ts`
- `src/lib/programs/phase-success-package/generate.ts`
- `src/lib/programs/phase-success-package/__tests__/core.test.ts`
- `src/lib/programs/phase-success-package/__tests__/generate.test.ts`
- `src/app/api/v1/programs/[programId]/phase-success-package/route.ts`
- `src/components/strategic-moves/SessionPlaybookPanel.tsx`

## QA / Validation

- `npx jest src/lib/programs/phase-success-package/__tests__/core.test.ts src/lib/programs/phase-success-package/__tests__/generate.test.ts --runInBand` — Pass. Jest emitted pre-existing duplicate manual mock warnings for markdown-related mocks.
- `npx eslint src/lib/programs/phase-success-package/core.ts src/lib/programs/phase-success-package/generate.ts 'src/app/api/v1/programs/[programId]/phase-success-package/route.ts' src/components/strategic-moves/SessionPlaybookPanel.tsx src/lib/programs/phase-success-package/__tests__/core.test.ts src/lib/programs/phase-success-package/__tests__/generate.test.ts` — Pass.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` — Pass.
- `npm run release:check` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Open a focused PR from `codex/phase-success-package-v0`. After merge, use the repo-owned Azure Container Apps main deploy workflow. Verify the ACA runtime invariant, then run signed-in browser proof on the Meridian Member Experience P2 Move.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab runtime.
- Shared runtime mutators: No ad-hoc ACA mutation allowed.
- Approved image digest: To be captured after deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Not expected to change; verify if deploy workflow reports worker updates.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The route writes governed Move artifacts through authenticated product state.

## Rollback Plan

Revert the PR or disable the UI action by removing the button call path. No migration rollback is required because this change reuses the existing Move Artifact Vault.

## Audit Evidence

- Focused Jest, ESLint, TypeScript, release check, and diff whitespace output.
- PR diff showing only the phase-success-package implementation, route, UI wiring, tests, and this release record.
- Post-deploy ACA runtime invariant proof.
- Signed-in Meridian P2 browser proof showing two artifacts generated or reused, File Cabinet visibility, non-recursive evidence cutoff metadata, duplicate-click reuse, and approved-package overwrite protection.

## Known Gaps

Gate UI integration and client-facing HTML/DOCX/PDF export are intentionally out of scope for V0. Live browser proof is required before claiming this is deployed and product-proven.
