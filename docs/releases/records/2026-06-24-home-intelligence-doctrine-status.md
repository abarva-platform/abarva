# 2026-06-24-home-intelligence-doctrine-status — Home / Intelligence Doctrine And Status Lock

## Release ID

`2026-06-24-home-intelligence-doctrine-status`

## Status

`candidate`

## Plain-English Summary

Adds the product doctrine that separates Home / Explorer from Intelligence and adds a locked
top-line phase/status table to the Brain Contract progress tracker. Home is now documented as
the factual enterprise memory / evidence explorer. Intelligence is documented as the advisor
layer that reasons over tenant facts plus governed corpus, benchmarks, patterns, and experts.
The release also adds runtime contract enforcement so Home KNOW cannot leak experts, corpus
grounding, internal codes, or decision templates, while Intelligence answers carry explicit
basis labels for tenant facts, industry patterns, benchmarks, expert inference, and gaps.

## Layer Impact

`global-control-lane`: Updates repo-owned product doctrine, execution tracking, and shared
answer-contract enforcement for all tenants and all shared surfaces. No database schema,
feature flag, data load, or deployment behavior changes are included.

## Client Applicability

- All clients: Yes. The doctrine and progress tracker apply to every tenant surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/product/HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`
- `docs/build/BRAIN_CONTRACT.md`
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`
- `docs/releases/records/2026-06-24-home-intelligence-doctrine-status.md`
- `src/lib/intelligence/answer/agent-answer.ts`
- `src/lib/intelligence/answer/surface-doctrine.ts`
- `src/lib/intelligence/answer/engine.ts`
- `src/app/api/intelligence/ask/route.ts`
- `src/lib/home/know/home-know-agent-answer.ts`
- `src/lib/home/know/home-know-engine.ts`
- `src/lib/home/know/__tests__/home-know-engine.test.ts`
- `src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts`

## QA / Validation

- `rg -n "HOME_INTELLIGENCE_SURFACE_DOCTRINE|Locked top-line execution status|Overall execution" docs/build docs/product` — PASS.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts --runInBand` — PASS, 35 tests.
- `npx eslint src/lib/intelligence/answer/agent-answer.ts src/lib/intelligence/answer/surface-doctrine.ts src/lib/intelligence/answer/engine.ts src/lib/home/know/home-know-agent-answer.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/__tests__/home-know-engine.test.ts src/app/api/intelligence/ask/route.ts src/app/api/intelligence/ask/__tests__/route.telemetry.test.ts` — PASS.
- `npm run release:check` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — FAILS on pre-existing missing dependency/type declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no touched-file type errors were reported before those project-level missing dependency errors.

## Rollout Plan

Merge to `main`, then deploy through the approved ACA main workflow. No data migration or
feature flag is required. Subsequent Home, Intelligence, and shared chat implementation PRs must
update the locked phase/status table when their proof state changes.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this documentation-only release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this doctrine/status slice. Runtime implementation PRs still require deployed browser proof.

## Rollback Plan

Revert the PR to remove the doctrine link, locked status table, and answer-contract enforcement.
No data rollback is required.

## Audit Evidence

Inspect the PR diff and this release record. Future PRs should cite the doctrine and update
`docs/build/BRAIN_CONTRACT_PROGRESS.md` when phase percentages or proof states move.

## Known Gaps

- This release changes server-side answer shaping and validation, but it does not redesign the Home UI.
- The top-line percentages are conservative status-tracking values, not acceptance evidence.
- A deployed matrix and reality-crawl run remain the acceptance authority.
