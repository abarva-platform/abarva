# 2026-08-04-home-ava-visible-contract-recovery — Recover Home aVa visible answers safely

## Release ID

`2026-08-04-home-ava-visible-contract-recovery`

## Status

`candidate`

## Plain-English Summary

Home aVa could bind to the governed Home knowledge provider, but a final display-safety failure could still return an internal error string to the drawer. This release keeps the structured answer artifacts available and rewrites unsafe final prose into a conservative executive fallback before display.

## Layer Impact

`global-control-lane`: Updates the Home aVa API and drawer error boundary for all Home command-center users.

`client-data-lane`: No tenant data, schema, ingestion, promotion, or canonical content changes.

## Client Applicability

- All clients: Home aVa visible-answer safety behavior.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home KNOW flags remain unchanged.

## Changes Included

- `src/app/api/home/know/ask/route.ts` performs final visible-answer recovery before returning the answer.
- `src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx` maps display-safety backend errors to user-facing drawer copy.
- Focused route and component tests cover the recovery path and drawer error masking.

## QA / Validation

- pass: Focused Jest for Home aVa route visible-contract recovery and command-center drawer behavior.
- pass: ESLint.
- pass: TypeScript.
- pass: Production build.
- pass: Release control.
- pending: Post-deploy signed-in Home aVa proof.

## Rollout Plan

Merge to `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and shift traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: verified by the deploy workflow.
- Worker image invariant: verified by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/home` Ask aVa signed-in question proof with screenshot.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, and signed-in Home aVa screenshots.

## Known Gaps

This does not create a new Knowledge publication, promote canonical content, activate a baseline, or change production provider routing.
