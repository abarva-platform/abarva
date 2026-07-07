# 2026-06-04-lakeshore-cxo-corpus-activation — Lakeshore CXO Logins + Corpus Activation

## Release ID

`2026-06-04-lakeshore-cxo-corpus-activation`

## Status

`candidate`

## Plain-English Summary

This release prepares Lakeshore Holdings for CXO-level pilot testing by adding two tenant-locked CXO personas, a safe preview mode for Clerk provisioning, and an agent-grounding packet that tells Sentinel, Nexus, Atlas, and Steward exactly which Lakeshore corpus sources they may use and how to avoid overclaiming dry-run or reusable pattern evidence.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific CXO persona metadata and corpus activation artifacts. The release does not mutate production data by itself.
- `internal-admin`: Extends the CXO provisioning script with a Lakeshore-only plan mode so operators can verify intended Clerk metadata before applying secrets-backed changes.
- `global-control-lane`: Adds reusable grounding rules that keep agent behavior provenance-bound when Lakeshore context becomes available.

## Client Applicability

- All clients: No direct tenant data change.
- Specific clients: Lakeshore Holdings only.
- Internal only: Provisioning script and activation plan are internal/operator controls.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added two Lakeshore CXO personas:
  - `cio@lakeshore-holdings.example.com` / Meera Rao / Global Chief Information Officer.
  - `cfo@lakeshore-holdings.example.com` / Daniel Whitaker / Chief Financial Officer and Treasury Sponsor.
- Added Lakeshore support, `--plan-only` preview, and `--clerk-only` apply support to `scripts/provision-cxo-personas.ts`.
- Added `src/lib/lakeshore/corpus-activation.ts` with corpus-source availability, agent grounding rules, activation steps, and hallucination controls.
- Added `src/scripts/lakeshore/generate-corpus-activation-plan.ts` to generate JSON and Markdown activation artifacts.
- Added Lakeshore finance/CFO and Kyriba rollout activation supplements under `docs/build/lakeshore/agent-grounding/`.
- Added tests for CXO persona registration, available corpus artifacts, pending governed-load ledger status, and four-agent grounding rules.
- Added 12 Lakeshore agent-quality golden prompts across Sentinel, Nexus, Atlas, Steward, and Source to enforce tenant grounding, dry-run honesty, Source/Moves usage, and cross-tenant leakage refusal.

## QA / Validation

- PASS: `npx tsx src/scripts/lakeshore/generate-corpus-activation-plan.ts`
- PASS: `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only`
- PASS: `npx tsx scripts/provision-cxo-personas.ts --client=lakeshore --plan-only`
- PASS: `npm run qa:agent-quality:corpus`
- Pending before PR: focused Jest, ESLint, TypeScript, release gate, and diff whitespace checks.

## Rollout Plan

Merge to `main` after CI is green. The application deploy will make the two Lakeshore personas available to the provisioning script and publish the agent-grounding packet. A human/operator still must run one of the apply commands with secrets:

- Clerk users only: `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --clerk-only --apply`
- Clerk users plus membership rows: `npx tsx scripts/provision-cxo-personas.ts --client lakeshore --apply --skip-ban`

## Rollback Plan

Revert this release to remove the Lakeshore CXO personas, provisioning support, and activation artifacts. If the real provisioning command has already been run, use Clerk and the membership tables to disable or remove the two Lakeshore accounts separately; reverting code does not automatically delete external Clerk users.

## Audit Evidence

- Generated activation JSON: `docs/build/lakeshore/agent-grounding/lakeshore-corpus-activation-plan.json`
- Generated activation Markdown: `docs/build/lakeshore/agent-grounding/LAKESHORE_CORPUS_ACTIVATION_PLAN.md`
- Plan-only provisioning output showing exactly two Lakeshore accounts and tenant metadata.
- Test output from the focused Lakeshore corpus activation suite.
- Agent-quality corpus output showing 74 total cases, including 12 Lakeshore Holdings cases.

## Known Gaps

- The governed-load rehearsal ledger remains pending behind PR #2997 review protection. The activation plan marks that source as blocked and does not treat it as available.
- This release does not run the real Clerk mutation because that requires production secrets and an explicit operator apply step.
