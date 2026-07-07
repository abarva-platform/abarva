# Operating Cadence Packet

## Purpose

This packet makes ENV-18 executable without turning operations into tribal knowledge. It defines the recurring operating cadence for AbarVa product environments and client private planes.

It is intentionally non-mutating. It can generate reports, collect read-only evidence, summarize CI, and prepare approval requests. It cannot revoke or grant access, run DR restores, deploy to client prod, change DNS, shift traffic, mutate client data, or accept PHI/PII exceptions without explicit approval.

Machine-readable companion: `docs/azure/OPERATING_CADENCE_PACKET_2026-06.json`.

Verifier: `npm run azure:operating-cadence:verify`.

## Scope

This cadence covers:

- product dev
- product preview
- product prod
- client preprod
- client prod

## Weekly Release Readiness

Every week, produce a release-readiness record with:

- open PR summary
- release candidate status
- CI gate summary
- Azure deploy status
- rollback readiness
- known risks
- next-week actions

## Monthly Access Review

Every month, produce an access-review record with:

- Clerk role export
- Azure RBAC export
- database role export
- service principal export
- stale access list
- proposed changes
- approval or defer record

Access review can identify issues. It must not revoke or grant access without explicit approval.

## Quarterly DR/Restore Drill

Every quarter, produce a DR/restore drill record with:

- restore scope
- restore target environment
- backup snapshot id
- restore execution log
- RTO/RPO result
- validation queries
- lessons learned
- follow-up actions

Running the drill itself requires explicit approval because it can create resources, consume budget, or touch data-plane state.

## Post-Release Retrospective

After material releases, produce a retrospective record with:

- release id
- change summary
- user-visible outcome
- incidents or near misses
- test escape analysis
- process improvements
- backlog actions

## Registers

The cadence must maintain or reference these registers:

- release readiness register
- access review register
- DR/restore register
- post-release retro register
- risk and exception register
- client plane evidence register

## Hard Stops

Stop and escalate if any of these are true:

- release record is missing
- required CI gate failed
- Owner or User Access Administrator grant is unreviewed
- stale service principal has no owner
- DR/restore has not been tested within the quarter
- rollback plan is missing for a material release
- client prod action is requested without explicit approval
- PHI or PII exception is requested
- context-bundle proof is missing for a data release
- tenant leakage is detected or not investigated

## Completion Rule

ENV-18 is scaffold-ready when this packet and its verifier are merged.

ENV-18 is complete only after the first weekly release readiness record, monthly access review record, quarterly DR/restore drill record, and post-release retrospective record exist and are accepted.
