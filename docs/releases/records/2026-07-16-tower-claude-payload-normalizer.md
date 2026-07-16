# 2026-07-16-tower-claude-payload-normalizer — Tower Claude Payload Normalizer

## Release ID

`2026-07-16-tower-claude-payload-normalizer`

## Status

`candidate`

## Plain-English Summary

Tower now normalizes Claude's structured tool output before validating the CIO/CFO story blocks. This fixes the live case where Claude produced useful executive story content, but the app rejected it because the payload arrived wrapped or named differently than the first extractor expected.

## Layer Impact

- Lane: `global-control-lane`.
- Tower runtime synthesis: accepts governed Claude story payload variants while keeping the same validation rules for locked numbers, internal-language leaks, and unsupported outcome claims.
- AI egress contract: keeps the Anthropic tool-call contract and strengthens the prompt to avoid extra wrapping.
- UI rendering: no visual redesign; the existing Tower page can mark the story as Claude-validated only after the normalized payload passes validation.

## Client Applicability

- All clients: Applies to Tower pages using the Claude CXO story synthesis path.
- Specific clients: Meridian / Healthcare Demo is the live proof target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower runtime flag/path only; this PR does not add a new flag.

## Changes Included

- `src/lib/tower/tower-cxo-claude-story.ts`
- `src/lib/tower/__tests__/tower-cxo-claude-story.test.ts`
- `docs/releases/records/2026-07-16-tower-claude-payload-normalizer.md`

## QA / Validation

- Pass: focused Tower Claude story Jest coverage for direct tool input, nested tool input, runtime field names, and story-root payload normalization.
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
