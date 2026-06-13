# 2026-06-13-env-governance-gate-hardening — Environment Governance Gate Hardening

## Release ID

`2026-06-13-env-governance-gate-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens the repo gates needed before AbarVa creates clean Azure Product Dev, Product Preview, and Product Prod environments. It makes existing tenant-purity and legacy-runtime checks part of the production-readiness gate, adds a Vercel production-runtime guard, and aligns remaining GitHub workflows to Node.js 24.

It also fixes one existing Source proof scenario so its `agent_ready` evidence is asserted through the canonical context/corpus policy contract instead of being stamped directly.

## Layer Impact

- `global-control-lane`: strengthens shared CI/release governance for all clients and environments.
- `internal-admin`: supports AbarVa-only environment cutover discipline and cleanup sequencing.

## Client Applicability

- All clients: indirectly protected by stronger shared repo governance.
- Specific clients: none.
- Internal only: applies to AbarVa engineering/release workflows.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `scripts/audit/vercel-production-runtime-guard.mjs`.
- Adds `scripts/audit/vercel-production-runtime-baseline.json`.
- Adds `audit:vercel-production-runtime` and `audit:vercel-production-runtime:check` package scripts.
- Wires `audit:control-plane-purity:check` and `audit:vercel-production-runtime:check` into `.github/workflows/production-readiness-gate.yml`.
- Refreshes `scripts/audit/control-plane-tenant-purity.baseline.json` to current `origin/main` debt so the gate blocks new tenant-name drift from this point forward.
- Aligns remaining Node 20 workflow setup steps to Node 24.
- Routes the SkyHarbor AMS Source scenario fixture through `evaluateGovernedObject` before it can use promoted evidence in the proof.

## QA / Validation

- `npm run audit:vercel-production-runtime:check` passed.
- `npm run audit:control-plane-purity:check` passed after baseline refresh to current main debt.
- `npm run audit:runtime-supabase-imports:guard` passed.
- `npm run audit:deprecated-pattern-table-writes` passed.
- `npm run validate:context-corpus` passed after routing the SkyHarbor AMS scenario through the policy contract.
- `npm test -- src/lib/source/archetypes/__tests__/skyharbor-ams.scenario.test.ts --runInBand` passed (8/8).
- `npx eslint scripts/audit/vercel-production-runtime-guard.mjs src/lib/source/archetypes/scenarios/skyharbor-ams.ts` passed.
- `rg -n "node-version: ['\"]?20" .github/workflows` returned no matches.

## Rollout Plan

Merge to main. The new checks become active through GitHub Actions on subsequent pull requests and merge queue runs. No Azure deployment, database migration, runtime feature flag, DNS change, or data-plane write is required.

## Rollback Plan

Revert this PR to remove the additional CI checks and restore the previous workflow Node versions. Because this is CI-only and additive, rollback has no runtime or data impact.

## Audit Evidence

- Local command output from the validation commands above.
- Pull request CI checks after opening the PR.
- `scripts/audit/vercel-production-runtime-baseline.json` records the one known legacy Vercel rollback path.
- `scripts/audit/control-plane-tenant-purity.baseline.json` records current tenant-string debt.

## Known Gaps

- This does not remove the existing Vercel rollback script; it prevents growth while cleanup is planned.
- This does not remove existing control-plane tenant-name debt; it refreshes the baseline to current main and blocks future growth.
- This does not yet create Product Dev, Product Preview, Product Prod, or client private data-plane subscriptions.
