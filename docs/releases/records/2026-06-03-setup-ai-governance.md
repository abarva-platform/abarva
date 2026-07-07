# 2026-06-03-setup-ai-governance — Setup AI Approval and Triage Controls

## Release ID

`2026-06-03-setup-ai-governance`

## Status

`candidate`

## Plain-English Summary

Adds setup/admin governance controls so AI-suggested tenant configuration
changes cannot apply without admin approval and a recorded reason, and
AI-detected setup anomalies cannot be remediated without human triage
acknowledgement.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: setup/admin governance and AI liability defense.
- Runtime impact: read-model/control foundation only; no live setup mutation,
  database writes, or automatic remediation.

## Client Applicability

- All clients: future setup/admin AI governance uses this control.
- Specific clients: none.
- Internal only: setup/admin operator controls and deterministic model.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/admin/setup-ai-governance.ts`
- `src/lib/admin/setup-load-studio-view.ts`
- `src/lib/admin/__tests__/setup-ai-governance.test.ts`
- `src/lib/admin/__tests__/setup-load-studio-view.test.ts`
- `scripts/admin/verify-setup-ai-governance.mjs`
- `docs/runbooks/setup-ai-governance.md`
- `docs/build/SETUP_AI_GOVERNANCE_2026-06-03.md`

## QA / Validation

- Pass: `node scripts/admin/verify-setup-ai-governance.mjs`
- Pass: `npx jest src/lib/admin/__tests__/setup-ai-governance.test.ts src/lib/admin/__tests__/setup-load-studio-view.test.ts --runInBand`
- Pass: focused ESLint for model, tests, verifier, and modified setup view.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: live setup/admin action persistence and audit-ledger writes
  remain future runtime work.

## Rollout Plan

Merge to `main`. The Data Loads admin surface will show the new governance
controls, and the pure model becomes available for the follow-on runtime action
gate.

## Rollback Plan

Revert this PR. No data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Unit test output.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T244 and T245 remain `In progress` until live setup/admin actions persist
approval or triage evidence into the audit ledger before applying changes or
remediation.
