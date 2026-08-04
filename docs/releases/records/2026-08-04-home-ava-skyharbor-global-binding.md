# 2026-08-04-home-ava-skyharbor-global-binding — Bind Home aVa to Airline Demo context aliases

## Release ID

`2026-08-04-home-ava-skyharbor-global-binding`

## Status

`candidate`

## Plain-English Summary

Live Home command-center proof showed the aVa drawer could open, but a question using the command-center dataset key could not bind to the governed Home knowledge provider. This release recognizes that display/data key as an Airline Demo alias and canonicalizes the Home KNOW dossier lookup before reading governed context.

## Layer Impact

`global-control-lane`: Home aVa requests now bind the command-center page key to the existing governed Home knowledge provider.

`client-data-lane`: No canonical data, schema, load, promotion, or tenant content changes.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo alias handling only.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home KNOW flags remain unchanged.

## Changes Included

- `src/lib/tenant/aliases.ts` recognizes the command-center Airline Demo aliases.
- `src/lib/home/know/home-know-engine.ts` canonicalizes the Home KNOW dossier lookup key.
- Focused unit tests cover the alias and binding behavior.

## QA / Validation

- pass: Focused Jest for tenant alias and Home KNOW tenant binding.
- pass: TypeScript.
- pass: ESLint.
- pass: Production build.
- pass: Release control.
- pending: Post-deploy signed-in Home aVa question proof.

## Rollout Plan

Merge to `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and shift traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: verified by the deploy workflow.
- Worker image invariant: verified by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/home` Ask aVa question.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Home aVa screenshots.

## Known Gaps

This does not promote new Knowledge content, create new baselines, or change canonical tenant data.
