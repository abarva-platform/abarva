# 2026-07-16-tower-claude-token-budget — Tower Claude Story Token Budget

## Release ID

`2026-07-16-tower-claude-token-budget`

## Status

`candidate`

## Plain-English Summary

Tower now gives Claude enough output budget to complete the governed CIO/CFO story and visual exhibit contract. The live Meridian proof showed Claude still falling back because the response was not valid JSON after the payload-normalizer fix, which is consistent with an incomplete or truncated structured response.

## Layer Impact

- Lane: `global-control-lane`.
- Tower runtime synthesis: increases the default Tower Claude story output budget so the complete story and seven visual specs can be returned and validated.
- AI egress contract: no provider, model, prompt-safety, or data-access change; the existing Anthropic tool-call contract remains in place.
- UI rendering: no visual change; the Tower page still renders only validated Claude output or deterministic fallback.

## Client Applicability

- All clients: Applies to Tower pages using the Claude CXO story synthesis path.
- Specific clients: Meridian / Healthcare Demo is the live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower runtime path only; no new flag.

## Changes Included

- `src/lib/tower/tower-cxo-claude-story.ts`
- `src/lib/tower/__tests__/tower-cxo-claude-story.test.ts`
- `docs/releases/records/2026-07-16-tower-claude-token-budget.md`

## QA / Validation

- Pass: focused Tower Claude story Jest coverage confirms the default `max_tokens` budget is 6000.
- Pass: TypeScript compile with `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Pending: ACA deploy and signed-in Meridian Tower browser proof.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, confirm 100% traffic on the new revision, then run signed-in Meridian Tower proof.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by the ACA main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by deploy workflow.
- Feature/env flag update path: No new flag update.
- Live signed-in proof required: Yes, Meridian Tower must show `data-cxo-story-source="claude_validated"`.

## Rollback Plan

Rollback by reverting this PR and redeploying through the ACA main deploy workflow. The deterministic Tower fallback remains in place if validation fails.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy evidence: pending.
- Signed-in browser proof: pending.

## Known Gaps

Live proof is pending until the PR is merged and deployed.
