# 2026-06-02-azure-claude-route-validation - Azure-Routed Claude Validation

## Release ID

`2026-06-02-azure-claude-route-validation`

## Status

`candidate`

## Plain-English Summary

Documented the validated architecture story for keeping AbarVa's application
control plane on Vercel while routing approved Claude model calls through a
Microsoft Foundry Claude endpoint. The record makes the limits explicit:
Azure Marketplace, subscription, region, authentication, data-processing,
tenant-policy, and audit gates must be complete before this can be sold as a
production pilot route.

## Layer Impact

Release lane: `internal-admin`. Adds an architecture validation and
procurement/security narrative for the model-provider route. No runtime model
gateway code, data-plane code, UI, migrations, or cloud resources changed.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: Future Azure-first enterprise clients that require an
  Azure-routed Claude option.
- Internal only: AbarVa architecture, security, legal, sales engineering, and
  operations teams.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/architecture/MODEL1_AZURE_CLAUDE_ROUTE_VALIDATION.md`.
- Added this release record.

## QA / Validation

- Passed: Verified referenced local files exist before writing the document.
- Passed: Reviewed current primary-source Microsoft Learn and Vercel
  Marketplace documentation before drafting the validation.
- Passed: `git diff --check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Not run: Runtime tests, because this is a documentation-only change with no
  application code, migrations, model calls, or infrastructure changes.

## Rollout Plan

Merge to `main`. No Vercel production deploy, Azure deploy, migration, feature
flag, or model-provider activation is required for this documentation change.

## Rollback Plan

Revert the documentation PR if the Azure-routed Claude story needs to be
withdrawn or materially rewritten. No runtime rollback is required.

## Audit Evidence

- Architecture validation:
  `docs/architecture/MODEL1_AZURE_CLAUDE_ROUTE_VALIDATION.md`
- Release record:
  `docs/releases/records/2026-06-02-azure-claude-route-validation.md`
- Primary-source references listed in the architecture validation.
- Local validation commands listed in this record.

## Known Gaps

This release does not provision Microsoft Foundry, subscribe to an Anthropic
Claude offer in Azure Marketplace, implement a Foundry provider adapter, create
tenant policy persistence, or prove customer-specific data-processing terms.
