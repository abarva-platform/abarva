# 2026-09-08-source-artifact-numeric-grounding — Preserve evidence semantics in generated drafts

## Release ID

`2026-09-08-source-artifact-numeric-grounding`

## Status

`candidate`

## Plain-English Summary

Source-generated strategy and value artifacts now distinguish an intake opportunity target from contract value, spend, and realized savings. The shared advisor instructions also prohibit unsupported market assertions, benchmark percentages, timelines, dates, and commercial norms so downstream RFP and decision artifacts do not inherit a confidently written but ungrounded premise.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: strengthens prompt contracts and version receipts for newly generated strategy and value-target artifacts.
- No Layer 1, Layer 2, or Layer 3 data changes. No schema or migration changes.

## Client Applicability

- All clients: yes, for newly generated Source artifacts after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`
- `src/lib/source/agent-generation/__tests__/strategy-authoring.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/strategy-authoring.test.ts --runInBand` — PASS, 52 tests.
- Scoped ESLint — required before merge.
- TypeScript `--noEmit` — required before merge.
- `npm run release:check` — required before merge.
- `git diff --check` — PASS.

## Rollout Plan

Merge by pull request and deploy through the repo-owned ACA main deploy workflow. Existing persisted drafts remain auditable and are not silently rewritten; an operator must deliberately regenerate a rejected draft after deployment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the repo-owned main deploy workflow only.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: required before declaring deployed.
- Worker image invariant: both delivery workers must match the approved web digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: regenerate a strategy and value-target draft on an approved synthetic event and inspect numeric meaning, dates, source basis, and unsupported-claim behavior.

## Rollback Plan

Revert the prompt-registry commit through a pull request and redeploy the resulting main SHA. Persisted generation receipts retain the prompt version used for each artifact.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deployment artifact with digest, revision, traffic, health, and worker-image proof.
- Signed-in generated-artifact inspection on an approved synthetic event.

## Known Gaps

Prompt controls reduce unsupported claims but do not replace human review. Existing drafts generated under earlier prompt versions must be rejected or superseded deliberately.
