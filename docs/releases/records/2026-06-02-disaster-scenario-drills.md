# 2026-06-02-disaster-scenario-drills - Disaster Scenario Drill Packet

## Release ID

`2026-06-02-disaster-scenario-drills`

## Status

`candidate`

## Plain-English Summary

Added a disaster scenario tabletop drill packet for pilot readiness. The packet
documents how AbarVa should rehearse Vercel outage/bad deploy, model-provider
outage or price shock, Azure region/client data-plane outage, and key-person
unavailability scenarios.

## Layer Impact

Internal-admin operational documentation. No runtime code, product UI,
migrations, data-plane behavior, or infrastructure configuration changed.

## Client Applicability

- All clients: None directly.
- Specific clients: None.
- Internal only: AbarVa operations and pilot preparation.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/runbooks/disaster-scenario-drills.md`.
- Updated `docs/runbooks/disaster-recovery.md` to link the tabletop drill
  packet.
- Updated `docs/internal/README.md` to make disaster tabletop drills
  discoverable.

## QA / Validation

- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` passed.
- Referenced repo paths verified: 56 checked, all exist.
- `npm run secrets:staged` passed with no leaks found.

## Rollout Plan

Merge to main. The drill packet becomes available as internal documentation.
No runtime deployment, migration, feature flag, or customer-facing rollout is
required.

## Rollback Plan

Revert the PR to remove the disaster scenario drill packet and documentation
links.

## Audit Evidence

- PR for this release candidate.
- Local validation output listed above.
- Release record at
  `docs/releases/records/2026-06-02-disaster-scenario-drills.md`.

## Known Gaps

This PR creates the documented drill packet and templates. It does not prove a
live human tabletop session has already been conducted. The first pre-pilot
tabletop should use this packet and produce a filled evidence record.
