# 2026-06-02-agent-context-broker-defensive-publication - AgentContextBroker Defensive Publication Draft

## Release ID

`2026-06-02-agent-context-broker-defensive-publication`

## Status

`candidate`

## Plain-English Summary

Adds a counsel-ready defensive-publication draft for the AgentContextBroker boundary contract. The draft explains the problem, disclosed broker pattern, current implementation evidence, and external publication checklist.

## Layer Impact

Internal admin and IP governance: documentation-only change under `docs/ip`, plus a release record. No runtime code, product UI, schema, migration, tenant data, or private data-plane behavior changes.

## Client Applicability

- All clients: No runtime impact.
- Specific clients: None.
- Internal only: Founder, counsel, and AbarVa product/security leadership use the packet.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/ip/defensive-publications/README.md`
- `docs/ip/defensive-publications/2026-06-02-agent-context-broker-boundary-contract.md`

## QA / Validation

- `test -f` path-reference check for every concrete implementation path cited in the publication draft - pass.
- `git diff --check` - pass.
- `npm run release:check -- --base origin/main --head HEAD` - pass; release-control reported no release-relevant files changed for this docs-only IP packet.
- `npm run secrets:staged` - pass expected before PR.

## Rollout Plan

Merge to `main` so the draft is available internally. External publication remains a separate counsel/founder step because the GitHub repository is private.

## Rollback Plan

Revert the PR to remove the defensive-publication draft, index entry, and release record. No runtime rollback is required.

## Audit Evidence

- Pull request for this release candidate.
- Local validation commands from the QA / Validation section.
- External publication URL after counsel/founder posting, if completed later.

## Known Gaps

This PR creates the public-channel-ready draft but does not publish it externally. T072 should remain In progress until a reviewed version is posted to a public defensive-publication channel and the public URL is recorded.
