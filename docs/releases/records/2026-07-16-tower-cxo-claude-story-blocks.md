# 2026-07-16-tower-cxo-claude-story-blocks — Tower Claude CXO Story Blocks

## Release ID

`2026-07-16-tower-cxo-claude-story-blocks`

## Status

`candidate`

## Plain-English Summary

Tower now has a Claude-owned executive story layer for the Meridian CXO value cockpit. AbarVa still computes the facts, values, claim gates, blocker themes, and renderer model deterministically; audited Claude writes the board-readable CIO/CFO story and visual-spec intent from that bounded packet. The validator blocks internal implementation language, tenant-name leakage, unsupported realized-value claims, and any attempt to change locked card values.

## Layer Impact

- Product UI: Adds story-source metadata and a business-safe Evidence tab note so proof can verify whether the Tower story was Claude-synthesized or deterministic fallback.
- AI egress: Adds a bounded audited Anthropic call for Tower CXO story blocks, tenant-gated to Meridian.
- Control plane: Adds validation and proof artifacts for prompt, Claude output, and rendered story model.
- Data plane: No data writes, migrations, candidate promotion, or Tower value calculation changes.

## Client Applicability

- All clients: No.
- Specific clients: Meridian / Healthcare Demo when the tenant feature flag is enabled.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `tower_cxo_claude_story_blocks`

## Changes Included

- `src/lib/tower/tower-cxo-claude-story.ts`
- `src/lib/tower/tower-v3-runtime-view.ts`
- `src/app/(maestro)/tower/page.tsx`
- `src/components/tower/TowerIndexPage.tsx`
- `scripts/audit/build-tower-cxo-claude-story-proof.ts`
- Focused Tower/feature tests and this release record.
- Follow-up correction: the Tower Claude egress call no longer passes the human-readable `contextPackId` as `artifactId`, because the audit table expects UUID-shaped artifact identifiers. The readable context-pack id remains in request metadata for traceability.
- Follow-up correction: the Tower Claude request no longer sends `temperature`, because Claude Opus 4.7 rejects that deprecated parameter.
- Follow-up correction: the Tower Claude story default model now uses `claude-sonnet-4-6` with a smaller response budget. This keeps the same bounded story/visual-spec contract but avoids server-side Opus timeouts on the live Tower page.

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/tower-cxo-claude-story.test.ts src/lib/tower/__tests__/tower-v3-runtime-view.test.ts src/lib/features/__tests__/is-feature-enabled.test.ts src/lib/cio-tower/__tests__/answer.test.ts --runInBand`.
- Pass: `npx jest src/lib/tower/__tests__/tower-cxo-claude-story.test.ts --runInBand` after the egress artifact-id correction.
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- Blocked locally: `npm run audit:tower-cxo-claude-story` cannot complete on the laptop because the audited egress preflight needs Azure Postgres and the private host does not resolve outside ACA/VNet (`getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`). This proof must run through the deployed ACA runtime.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Partial live proof before correction: ACA served the Tower Claude code path, but the DOM marker showed `claude_fallback` because the audited egress write rejected the non-UUID `artifactId` value `meridian-health-tower-v3-live-context-pack`.
- Partial live proof after artifact-id correction: ACA served the Tower Claude code path, but the DOM marker still showed `claude_fallback` because Claude rejected the deprecated `temperature` parameter for `claude-opus-4-7`.
- Partial live proof after request-parameter correction: ACA served the Tower Claude code path, but the DOM marker still showed `claude_fallback` because the Opus request exceeded the 45-second Tower story guardrail (`tower_cxo_claude_story_timeout`).
- Not run yet: signed-in ACA browser proof after the egress artifact-id, request-parameter, and model-latency corrections.

## Rollout Plan

Merge through PR to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, confirm 100% traffic on the new revision, and run signed-in Meridian Tower browser proof. The runtime page may fall back to deterministic story if Claude is unavailable or validation fails, but the release is not considered live-proven until the DOM source marker shows `claude_validated`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Static tenant flag in code; no manual ACA mutation expected.
- Live signed-in proof required: Yes, Meridian `/tower`.

## Rollback Plan

Disable the `tower_cxo_claude_story_blocks` flag or revert the PR. Deterministic Tower story and claim gates remain available as the fallback path.

## Audit Evidence

- PR URL: Pending.
- Claude proof output: `reports/tower-cxo-claude-story-proof/` after `npm run audit:tower-cxo-claude-story`.
- Live proof output: Pending after ACA deploy.

## Known Gaps

Candidate is not yet deployed or browser-proven after the egress artifact-id, request-parameter, and model-latency corrections. This PR does not migrate additional Tower routes, change value calculations, or promote any data.
