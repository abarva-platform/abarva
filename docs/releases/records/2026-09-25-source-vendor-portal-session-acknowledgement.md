# 2026-09-25-source-vendor-portal-session-acknowledgement

## Release ID

`2026-09-25-source-vendor-portal-session-acknowledgement`

## Status

`candidate`

## Plain-English Summary

The vendor portal session now reaches both the overview and its API. An acknowledgement is reported as recorded only when exactly one open invitation was updated.

## Layer Impact

- Release lane: `global-control-lane` for the shared vendor-facing application path.
- Product projection: vendor-facing session and acknowledgement routes.
- Canonical data: no schema or data mutation in this change. The existing event-vendor row remains an event credential, not a canonical supplier identity.

## Client Applicability

- All clients: vendor portal capability only when separately enabled and its database controls are approved.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Session cookie issuance and sign-out use the same origin-wide path so the overview and API receive the same opaque token.
- Acknowledgement write requires an affected-row count of one; a zero-row conditional update is not a successful response.
- Credential derivation uses Node's callback API directly so the configured scrypt parameters remain explicit and type-checked.
- Added negative regression coverage for the old cookie path and the already-answered race.
- The generated product manual classifies the internet-facing vendor pages as Source public routes.

## QA / Validation

- Red-first tests reproduced the cookie-path mismatch and zero-row false success before the fix.
- Focused vendor-portal Jest tests: 39 passed.
- Chromium cookie-path test: 1 passed, including the old-path negative case.
- Typecheck: passed with an 8 GB Node heap after correcting the credential KDF wrapper; the default 4 GB run exited on heap exhaustion.
- Changed-file ESLint: passed.
- `npm run release:check`: passed, including the generated manual check.
- Broader Source suites: not run in this candidate.
- No live vendor session or data readback was exercised.

## Rollout Plan

Do not activate this branch as a vendor-facing release yet. The source tables still lack proven database-enforced isolation for the portal path, and the event credential is not linked to the existing candidate-supplier identity. A later reviewed release must establish those controls, pass signed-in and opposite-vendor acceptance, then deploy only through the repo-owned ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only, after the remaining controls are complete.
- Shared runtime mutators: none in this candidate.
- Approved image digest: not applicable; not deployed.
- ACA runtime invariant: not claimed.
- Worker image invariant: not claimed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, including the acknowledgement readback and opposite-vendor denial.

## Rollback Plan

This candidate has no data migration. Revert the code commit before deployment. If later deployed, roll back through the repo-owned workflow to the previous approved digest.

## Audit Evidence

- Focused Jest and Chromium test outputs from this worktree.
- Review the route and DAO diff for cookie path and affected-row handling.

## Known Gaps

- Database RLS/restricted-role proof for all four vendor portal tables.
- Linkage from event credentials to the existing candidate-supplier identity requires a reviewed ownership and lifecycle contract.
- Package download bytes, submission upload, and invitation issuance are not complete.
- Full signed-in vendor journey and opposite-vendor acceptance are not proven.
