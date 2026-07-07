# 2026-06-01-ai-liability-ops-docs - AI Liability Operations Docs

## Release ID

`2026-06-01-ai-liability-ops-docs`

## Status

`candidate`

## Plain-English Summary

Adds operating documents for AI-output complaints, internal escalation/RCA,
historical evidence backfill, and quarterly AI litigation/regulatory
monitoring. These docs make the human-decision control framework operational
after an issue is reported or an old record lacks current evidence.

## Layer Impact

Internal-admin layer: adds runbook and legal-control documentation for AbarVa
operators.

Global-control lane documentation: extends the AI decision-support governance
packet without changing runtime behavior.

## Client Applicability

- All clients: The operating posture applies to all pilots and future clients.
- Specific clients: None.
- Internal only: Primary audience is AbarVa operators and counsel/reviewer
  workflows.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/runbooks/ai-output-complaints.md`.
- Adds `docs/legal/historical-ai-evidence-backfill-policy.md`.
- Adds `docs/legal/ai-litigation-monitoring.md`.

## QA / Validation

- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD` (no release-relevant files changed)
- Pass: ASCII scan for touched docs.

## Rollout Plan

Merge to `main`. These are documentation-only operating controls; no runtime,
database, migration, or private data-plane rollout is required.

## Rollback Plan

Revert the PR to remove the added documents and release record. No runtime or
data rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Release record: `docs/releases/records/2026-06-01-ai-liability-ops-docs.md`.
- Added AI-output complaint, backfill, and monitoring documents.

## Known Gaps

These docs do not create an in-product complaint form, automated migration, or
legal advice. Counsel review is still required for contract and liability
language.
