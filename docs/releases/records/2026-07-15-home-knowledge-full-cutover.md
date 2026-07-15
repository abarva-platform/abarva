# 2026-07-15-home-knowledge-full-cutover — Home Knowledge Full Cutover

## Release ID

`2026-07-15-home-knowledge-full-cutover`

## Status

`candidate`

## Plain-English Summary

Default Home now attempts to build the enterprise briefing from the module context serving contract first. The page uses the Enterprise Knowledge Layer as its default supplier for active tenant context, then renders the governed enterprise brief, context confidence, required dimensions, evidence, gaps, relationships, and data rows from that served packet where available. The prior Home browser/read-model path remains only as a guarded fallback and comparison source.

This is not a candidate promotion, tenant data write, or Home/aVa Claude runtime migration.

## Layer Impact

- `global-control-lane`: Updates the shared Home/Knowledge route and surface behavior for all tenants using the product shell.
- `client-data-lane`: Read-only consumption of active module context packets; no tenant data is written, promoted, or mutated.
- `internal-admin`: Adds deterministic audit output for operators to verify the cutover.

## Client Applicability

- All clients: Yes, for the default Home/Knowledge route behavior once deployed.
- Specific clients: No tenant-specific code path.
- Internal only: The audit reports are internal proof artifacts.
- Public/demo only: No.
- Feature flag: No new feature flag. Candidate preview remains explicit and inactive by default.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeSurface.tsx`
- `src/lib/home/home-summary-snapshot.ts`
- `scripts/audit/build-home-knowledge-cutover-proof.ts`
- `package.json`

## QA / Validation

- `npm run audit:home-knowledge-cutover` — Pass. Wrote `reports/enterprise-knowledge-layer/home-cutover-proof/`.
- `npm run audit:home-knowledge-pressure` — Pass.
- `npm run audit:knowledge-layer-live-preview` — Pass.
- `npm run audit:knowledge-layer-signed-in-preview` — Pass.
- `npm run audit:enterprise-knowledge-cache` — Pass.
- `npm run audit:enterprise-knowledge-assembler` — Pass.
- `npm run audit:enterprise-knowledge-layer` — Pass.
- `npm run audit:enterprise-naming` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — Pass after local dependencies were installed in the temp worktree.
- `npm run build` — Pass after local dependencies were installed in the temp worktree. Build emitted existing Turbopack broad-file-pattern warnings from admin/data-build imports, but completed successfully.
- `npm run release:check` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge by PR into `main`. Deploy only through the repo-owned ACA main deploy workflow. After deploy, verify the runtime invariant, production health, and signed-in Home/Knowledge browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required for live ACA rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured after ACA deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker change expected; verify if deploy workflow reports worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, because the default Home route changes.

## Rollback Plan

Revert the PR and deploy the prior `main` SHA through the repo-owned ACA main deploy workflow. No data rollback is required because this change is read-only and does not mutate tenant data, candidate versions, active tenant access, or module runtime data.

## Audit Evidence

- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.md`
- `reports/enterprise-knowledge-layer/home-cutover-proof/summary.json`
- `reports/enterprise-knowledge-layer/home-cutover-proof/home-knowledge-cutover-proof.html`
- Post-deploy ACA revision and signed-in proof to be added after merge/deploy.

## Known Gaps

- Home/aVa chat still uses the existing Home KNOW endpoint in this PR; it is not migrated to a new Claude runtime path here.
- Source, Tower, Intelligence, and Moves default runtime behavior is not changed by this PR.
- Legacy Home browser code remains as fallback/comparison until a later cleanup PR removes it after live proof.
