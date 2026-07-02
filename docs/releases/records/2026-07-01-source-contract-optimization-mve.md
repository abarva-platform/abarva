# 2026-07-01-source-contract-optimization-mve — Source existing-contract optimization MVE

## Release ID

`2026-07-01-source-contract-optimization-mve`

## Status

`candidate`

## Plain-English Summary

Adds the first Source slices for analyzing and optimizing an existing large
outsourcing contract. The change defines a minimum viable extraction profile,
structured findings, negotiation levers, recommended path, Source UI panel,
aVa grounding, and markdown/DOCX/PDF optimization brief exports so Source can
support renewal, renegotiation, rebid, and optimization decisions without
becoming a generic document browser.

## Layer Impact

- `global-control-lane`: shared Source code and standards for all tenants.
- `client-data-lane`: non-destructive Azure/Postgres migration adds typed
  tenant-scoped contract optimization tables.

## Client Applicability

- All clients: capability and schema are shared.
- Specific clients: the included SkyHarbor pack is synthetic demo evidence only.
- Internal only: none.
- Public/demo only: synthetic pack is for demo/proof only.
- Feature flag: reuses the existing Source event workspace path; the synthetic
  SkyHarbor profile is tenant/event guarded.

## Changes Included

- Contract optimization MVE model:
  `src/lib/source/contract-optimization/*`
- Structured persistence row mapper:
  `src/lib/source/contract-optimization/persistence.ts`
- Structured persistence migration:
  `supabase/migrations/20260701120000_source_contract_optimization_mve.sql`
- Synthetic evidence pack:
  `datasets/source/contract-optimization/skyharbor-ams-renewal-2026/*`
- Product standard:
  `docs/source/SOURCE_EXISTING_CONTRACT_OPTIMIZATION_MVE_STANDARD.md`
- Source event UI panel for the tenant/event-guarded optimization profile.
- Source aVa context grounding for recommended path, findings, and levers.
- Markdown, DOCX, and PDF optimization brief export route for the guarded
  profile.
- Business-facing brief polish for metric units, owner roles, and urgency labels
  so exported content avoids backlog-style priority terms.
- Private-operator-compatible load script:
  `source:contract-optimization:load-skyharbor`.
- Live-binding correction for the deployed SkyHarbor runtime client key:
  the guarded contract-optimization path accepts both `skyharbor` and
  `skyharbor-air` aliases, and the load script now ensures the Source event
  shell plus participant grants exist before proof.
- Participant-grant hardening for the private operator load: the loader now
  resolves SkyHarbor through the supported `clients.tenant_key` / `slug` shape
  and performs participant seeding after the Source event/profile transaction
  commits so a convenience grant mismatch cannot roll back the Source event and
  contract optimization evidence.
- Tenant-alias read/access hardening for Source: persisted Source event lookup
  and participant grants now resolve through the shared tenant alias set
  (`skyharbor` / `skyharbor-air`, etc.) so canonical app keys and production
  data-plane tenant keys do not split the same client workspace.
- Defense-in-depth alias guard for Source event detail/API/export reads: the
  final tenant comparison now checks same-tenant alias families instead of raw
  string equality, and Source policy maps canonical admin/person emails through
  the same alias family before granting event access.

## QA / Validation

- PASS: focused Jest for the new contract optimization module:
  `npx jest src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts --runInBand`
- PASS: focused ESLint for touched Source contract optimization files:
  `npx eslint src/lib/source/contract-optimization/**/*.ts src/components/source/canvas/contract-optimization/ContractOptimizationProfilePanel.tsx 'src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts'`
- PASS: targeted TypeScript compile for new contract optimization files:
  `npx tsc --noEmit --pretty false --target ES2017 --lib dom,dom.iterable,esnext --module esnext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck --types jest src/lib/source/contract-optimization/types.ts src/lib/source/contract-optimization/mve-profile.ts src/lib/source/contract-optimization/index.ts src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts`
- PASS: release check:
  `npm run release:check`
- PASS: architecture rules:
  `npm run audit:architecture-rules`
- PASS: brief polish regression covers joined unit text, duplicated placeholder
  wording, and user-facing `P0`/`P1`/`P2` labels.
- PASS: load runner compiles with the focused Source contract optimization
  TypeScript slice.
- PASS: follow-up live-binding fix passed focused Jest, focused ESLint,
  targeted TypeScript compile, and release check before redeploy.
- PASS: participant-grant hardening removes the stale `clients.key` lookup that
  failed in the live private operator run and keeps optional participant seeding
  outside the critical evidence transaction.
- PASS: Source tenant-alias hardening keeps lookup and access checks inside the
  same tenant alias family rather than requiring one literal client-key spelling.
- PASS: focused alias-guard regression:
  `npx jest src/lib/auth/__tests__/source-access-policy.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts src/lib/source/__tests__/event-code-as-slug.test.ts --runInBand`
- PASS: focused ESLint:
  `npx eslint src/lib/auth/source-access-policy.ts src/lib/source/queries.ts src/lib/auth/__tests__/source-access-policy.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts`
- BLOCKED: full-repo TypeScript with large heap reached existing dependency
  declaration gaps outside this slice (`js-yaml`,
  `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`).

## Rollout Plan

Merge through PR, apply the migration through the approved Azure/Postgres path,
then deploy through the approved ACA main lane. Signed-in browser proof is
required before claiming the Source UI/aVa/export path is live.

## Deployment Authority

- Repo-owned deploy workflow: required for future UI/runtime wiring.
- Shared runtime mutators: none in this slice.
- Approved image digest: not applicable yet.
- ACA runtime invariant: not applicable until runtime wiring.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before claiming the capability live.

## Rollback Plan

Code rollback by reverting the PR. The migration is additive and non-destructive;
if needed, stop writing to the new tables and leave them inert until an approved
schema cleanup is scheduled.

## Audit Evidence

- Focused tests and release check from this branch.
- Migration file and product standard.
- Synthetic evidence pack with `synthetic_demo` labeling.

## Known Gaps

- DOCX/PDF optimization brief routes are wired, but live route download and
  visual inspection still need to be proven after deploy.
- Live data-plane migration has not been applied in this branch.
- Signed-in browser proof has not been run in this branch.
