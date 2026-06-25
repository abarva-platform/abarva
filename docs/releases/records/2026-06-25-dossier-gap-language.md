# 2026-06-25-dossier-gap-language — Dossier Gap Language

## Release ID

`2026-06-25-dossier-gap-language`

## Status

`candidate`

## Plain-English Summary

Refines Home/semantic dossier answers so they name missing evidence precisely instead of using broad "not loaded" phrasing. This keeps the answer honest while avoiding language that reads like a generic retrieval failure when the system already has related tenant context.

## Layer Impact

- `global-control-lane`: shared answer composition and Home KNOW quality repair text for all tenants.
- `client-data-lane`: no schema, migration, or tenant data changes.

## Client Applicability

- All clients: applies to semantic dossier answers generated from the shared substrate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates semantic dossier gap labels from broad "not loaded" wording to specific missing-field / missing-relationship-family language.
- Updates organization-answer prose to say which field family is missing while still answering from role/domain evidence.
- Updates Home KNOW repair prose to avoid broad "not loaded" phrasing.
- Updates the semantic dossier test expectation for the new evidence-boundary language.

## QA / Validation

- PASS: `npx jest src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts --runInBand`
- PASS: `npx eslint src/lib/semantic-dossiers/compose-dossier-answer.ts src/lib/semantic-dossiers/build-universal-dimension-dossier.ts src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts src/lib/home/know/home-answer-quality-gate.ts`
- Full TypeScript, release check, deploy, tenant matrix, and reality crawl are required before marking released.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy builds the exact git SHA, deploys a new revision, shifts 100% traffic, and verifies the ACA runtime invariant. After deploy, rerun the signed-in tenant matrix and deep reality crawl against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no manual/shared runtime mutation.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: pending ACA deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR or roll back the ACA revision to the prior approved main digest if the language change causes answer-quality regressions.

## Audit Evidence

- PR: pending.
- CI: pending.
- Deployed tenant matrix: pending.
- Reality crawl report: pending.

## Known Gaps

This only fixes the remaining "not loaded" hedge wording seen in the deployed `295d2654` reality crawl. It does not change retrieval, corpus selection, or visual artifact generation.
