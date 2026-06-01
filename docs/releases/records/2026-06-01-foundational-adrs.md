# 2026-06-01-foundational-adrs — Add Foundational ADR Framework

## Release ID

`2026-06-01-foundational-adrs`

## Status

`candidate`

## Plain-English Summary

This change adds an ADR template, an ADR index, and five foundational governance ADRs covering control-plane/data-plane separation, the agent context broker boundary, release lanes, per-user RLS, and AI-tool governance.

## Layer Impact

Ops-release-lane and architecture documentation only. The change records existing and intended governance decisions and does not change runtime behavior, product UI, authentication, data access, migrations, or infrastructure.

## Client Applicability

- All clients: None.
- Specific clients: None.
- Internal only: AbarVa maintainers, reviewers, and AI-assisted development workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/adr/ADR-template.md`
- `docs/architecture/adr/README.md`
- `docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md`
- `docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md`
- `docs/architecture/adr/ADR-0003-release-lanes.md`
- `docs/architecture/adr/ADR-0004-per-user-rls.md`
- `docs/architecture/adr/ADR-0005-ai-tool-governance.md`
- `docs/releases/records/2026-06-01-foundational-adrs.md`

## QA / Validation

- Pass: verified referenced paths exist before writing ADRs.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. No runtime rollout, migration, feature flag, or manual data operation is required.

## Rollback Plan

Revert the documentation commit to remove the ADR framework and its release record.

## Audit Evidence

- Pull request for `codex/foundational-adrs`
- Local validation commands listed above
- CI checks on the pull request

## Known Gaps

This is a documentation-only ADR framework. It does not add import-boundary lint rules, generate AI-tool derivative files, or run database RLS probes; those controls remain governed by the referenced implementation paths and future execution tasks.
