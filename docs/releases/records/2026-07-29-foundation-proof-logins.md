# 2026-07-29-foundation-proof-logins — Foundation Proof Login Roster

## Release ID

`2026-07-29-foundation-proof-logins`

## Status

`candidate`

## Plain-English Summary

Adds a permanent, passwordless proof-login path for foundation-only tenants. These logins let an operator or automation agent verify the governed Knowledge Baseline through the protected Knowledge preview route before the tenant is activated on ordinary product pages.

Follow-up correction: the preview-session priming script now writes auth state and proof artifacts under a writable temp work directory by default. ACA operator images run from a read-only app directory, so repo-relative `.auth/` and `reports/` paths are retained only when explicitly configured through environment variables.

## Layer Impact

- `global-control-lane`: Adds an auth/proof roster and scripts for signed-in preview validation. No product data, review decision, publication, baseline, projection, or Azure job state is changed.

## Client Applicability

- All clients: No.
- Specific clients: Foundation-only preview tenants, beginning with `airline-demo-new`.
- Internal only: Yes, proof-login provisioning and storage-state generation are internal operator workflows.
- Public/demo only: No public route is added.
- Feature flag: None.

## Changes Included

- `src/lib/auth/foundation-proof-logins.ts`
- `scripts/auth/provision-foundation-proof-logins.ts`
- `scripts/auth/prime-foundation-preview-session.ts`
- `src/lib/auth/__tests__/foundation-proof-logins.test.ts`
- `package.json` scripts:
  - `auth:foundation-proof:provision`
  - `auth:foundation-proof:provision:airline:apply`
  - `auth:foundation-proof:prime`
  - `auth:foundation-proof:prime:airline:agent`
  - `auth:foundation-proof:prime:airline:anand`

## QA / Validation

- `pass`: `npm test -- --runTestsByPath src/lib/auth/__tests__/foundation-proof-logins.test.ts`
- `pass`: `npm run auth:foundation-proof:provision -- --tenant airline-demo-new --list`
- `pass`: `FOUNDATION_PROOF_LIST=true npm run auth:foundation-proof:provision`
- `pass`: `npm run ops:aca-job -- --image <deployed-digest> --script auth:foundation-proof:provision:airline:apply --secret-env CLERK_SECRET_KEY=clerk-secret-key --out-dir /tmp/foundation-proof-provision-plan --plan-only`
- `pass`: `npm run ops:aca-job -- --image <deployed-digest> --script auth:foundation-proof:prime:airline:agent --secret-env CLERK_SECRET_KEY=clerk-secret-key --out-dir /tmp/foundation-proof-prime-plan --plan-only`
- `pass`: `npx tsc --noEmit --pretty false`
- `pass`: `npm run release:check`
- `pass`: `FOUNDATION_PROOF_WORK_DIR=/tmp/foundation-preview-auth-test-<stamp> CLERK_SECRET_KEY=sk_test_dummy npx tsx scripts/auth/prime-foundation-preview-session.ts --tenant airline-demo-new --slug agent-airline-foundation --base-url https://app.abarva.ai --refresh` creates temp `.auth/` and `reports/` directories, then reaches the expected Clerk `Unauthorized` response for the dummy key without attempting to create repo-relative `.auth/` or `reports/` directories.
- `blocked`: `npm run auth:foundation-proof:provision -- --tenant airline-demo-new --apply` requires the governed Clerk secret from a VNet-attached operator/runtime environment. Local Key Vault secret read is intentionally blocked by private data-plane access.
- `blocked`: `npm run auth:foundation-proof:prime -- --tenant airline-demo-new --slug agent-airline-foundation --base-url https://app.abarva.ai --refresh` requires the proof identity to exist in Clerk first.

## Rollout Plan

Merge the control-path scripts to main and deploy the image through the normal ACA lane before provisioning. Provisioning is an explicit operator command and defaults to dry-run. Because the lab Key Vault has private data-plane access, the apply/proof commands must run from a VNet-attached ACA runtime or job with the approved Clerk secret reference.

The operator-specific scripts are deliberately argument-free from the ACA wrapper's perspective. The operator job supplies only a digest-pinned image, npm script name, and secret reference; the tenant, apply mode, and proof-bundle behavior are encoded in named package scripts or explicit environment variables.

The automation proof identity uses the controlled `abarva.ai` domain so Clerk provisioning does not depend on reserved placeholder email domains.

## Deployment Authority

- Repo-owned deploy workflow: Required before VNet-attached operator execution so the proof scripts are present in the runtime image.
- Shared runtime mutators: None.
- Approved image digest: Captured by the normal ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy before running proof provisioning from the runtime image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the proof users are provisioned.

## Rollback Plan

Remove or update the Clerk users' foundation-proof metadata, then revert this release through a normal PR if the roster or scripts need to be retired. No data-plane rollback is involved.

## Audit Evidence

- PR for this release.
- Foundation proof provisioning command output.
- Temp `.auth/` storage-state file generated by the prime script, retained outside git.
- Temp `foundation-preview-auth/reports/*.json` and screenshot proof, retained outside git unless explicitly attached to a private evidence bundle.

## Known Gaps

This does not activate `airline-demo-new` on the ordinary `/home` route. It only standardizes the signed-in proof path for the governed Knowledge preview route.
