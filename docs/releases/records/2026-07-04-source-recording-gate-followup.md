# 2026-07-04-source-recording-gate-followup — Source Recording Gate Follow-Up

## Release ID

`2026-07-04-source-recording-gate-followup`

## Status

`candidate`

## Plain-English Summary

This release closes the remaining Source recording-readiness gaps found during live signed-in proof. New Source events now persist the five intake facts cleanly so the approval page can read them back without duplicated scope/value/baseline wording. The parser also cleans up older duplicated rows so approval and downstream Source screens remain readable.

## Layer Impact

- `global-control-lane`: Source event intake payload behavior and approval readback parsing are shared Source runtime behavior.
- `public-demo`: Improves the live demo/recording path for Source buyer journeys, especially phase-gate approval and updated/client-final document lineage.

## Client Applicability

- All clients: Source intake parsing and event creation behavior applies to all tenants using Source.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx`: sends raw scope, value target, baseline owner, and category as distinct intake fields instead of pre-composing scope twice.
- `src/lib/source/intake-summary.ts`: normalizes historical duplicated scope/value/baseline summaries for clean approval readback.
- `src/lib/source/__tests__/intake-summary.test.ts`: covers round-trip and duplicated-row normalization.
- `src/__tests__/integration/source/source-originate-page.test.ts`: verifies Source create payload preserves the five fields cleanly.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/__tests__/intake-summary.test.ts src/__tests__/integration/source/source-originate-page.test.ts`
- Pass: `npx eslint src/lib/source/intake-summary.ts src/components/source/SourceOriginatePage.tsx src/lib/source/__tests__/intake-summary.test.ts src/__tests__/integration/source/source-originate-page.test.ts`
- Pending before release: TypeScript, release check, PR CI, ACA deploy, and signed-in live buyer-journey proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun signed-in Source recording-readiness proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps image build/deploy only
- Approved image digest: Pending
- ACA runtime invariant: Pending
- Worker image invariant: Not changed
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Rollback the ACA web app to the previous healthy revision or revert this commit on `main` and redeploy. No migrations or destructive data changes are included.

## Audit Evidence

- PR URL: Pending
- CI run: Pending
- Deployment run: Pending
- Live proof bundle: Pending

## Known Gaps

None known for this narrow follow-up. Full Source recording readiness still requires the signed-in live proof bundle after deployment.
