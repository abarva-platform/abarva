# 2026-06-02-security-reference-architecture-deck - Security Reference Architecture Deck

## Release ID

`2026-06-02-security-reference-architecture-deck`

## Status

`candidate`

## Plain-English Summary

Adds a 15-slide reference architecture deck for customer security reviews. The deck explains AbarVa's trust boundaries, plane model, identity, tenant isolation, AgentContextBroker boundary, data ingestion posture, sensitive-data handling, AI decision accountability, model/tool governance, audit evidence, release controls, deployment options, known gaps, and security-review asks.

## Layer Impact

Internal admin and pilot operations: documentation-only change for security review readiness and sales-engineering enablement. No runtime code, product UI, schema, migration, tenant data, or private data-plane behavior changes.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: Founder, sales engineering, security review, and pilot operations use the deck.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/security/REFERENCE_ARCHITECTURE_SECURITY_REVIEW_DECK.md`
- `docs/gtm/sales-engineering-toolkit/README.md`

## QA / Validation

- `test -f` path-reference check for every concrete source anchor cited in the deck - pass.
- Slide count check for `## Slide ` headings equals 15 - pass.
- `git diff --check` - pass.
- `npm run release:check -- --base origin/main --head HEAD` - pass; release-control reported no release-relevant files changed for this docs-only packet.
- `npm run secrets:staged` - pass expected before PR.

## Rollout Plan

Merge to `main`. The deck becomes available as a pilot security-review leave-behind and is linked from the sales-engineering toolkit.

## Rollback Plan

Revert the PR to remove the deck, toolkit link, and release record. No runtime rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Local validation command output.
- Updated pilot readiness tracker row T050 after merge.

## Known Gaps

The deck is a markdown source deck, not an exported PowerPoint file. It is ready for use as a leave-behind or as the source for a future slide build.
