# 2026-06-01-ai-as-advisor-adr — Record AI Advisor Invariant

## Release ID

`2026-06-01-ai-as-advisor-adr`

## Status

`candidate`

## Plain-English Summary

This change records the architecture rule that AbarVa AI provides drafts, recommendations, estimates, and evidence, but never makes consequential decisions on its own. Human users must review and commit consequential actions.

## Layer Impact

Release lane: `internal-admin`.

Architecture documentation and internal release governance only. The change does not alter runtime behavior, product UI, authentication, data access, migrations, infrastructure, or client data.

## Client Applicability

- All clients: None directly; this is a documentation and governance change.
- Specific clients: None.
- Internal only: AbarVa maintainers, reviewers, and future backlog execution agents.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-0006-ai-as-advisor.md`
- `docs/architecture/adr/README.md`
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx`
- `docs/releases/records/2026-06-01-ai-as-advisor-adr.md`

## QA / Validation

- Pass: verified referenced repository paths exist before writing the ADR.
- Pass: inspected the planning workbook and updated the `T203` row for this execution slice.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime rollout, migration, feature flag, manual data operation, or production deploy is required for this documentation-only change.

## Rollback Plan

Revert the PR commit to remove the ADR, ADR index row, release record, and tracker update.

## Audit Evidence

- Pull request: `https://github.com/anandsundaram-hash/abarva/pull/2715`
- Local validation commands listed above
- CI checks on the pull request

## Known Gaps

This change records the invariant only. It does not add reusable AI-liability UI components, dependency-cruiser enforcement, approval evidence storage, click-wrap acknowledgment, training modules, or module retrofits; those remain follow-on Wave 2 and later backlog items.
