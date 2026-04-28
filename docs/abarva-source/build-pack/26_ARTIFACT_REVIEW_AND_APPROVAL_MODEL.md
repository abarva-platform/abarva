# 26 ARTIFACT REVIEW AND APPROVAL MODEL

## Purpose

AbarVa Source needs configurable review and approval workflows so sourcing artifacts can be defensible for small digital builds, enhanced transformation events, and strategic enterprise deals.

Approval routing should be risk-based, value-aware, and artifact-specific. It should prevent unnecessary approval complexity for small events while enforcing stricter governance for large, sensitive, or high-risk sourcing decisions.

## Routing Inputs

Approval routing should be configured from:

- rigor level
- event value
- artifact type
- risk level
- data sensitivity
- security/compliance requirements
- sourcing stage
- client policy
- required stakeholder groups

## Approval Types

Supported approval types:

- informational review
- required approval
- legal approval
- security approval
- finance approval
- executive approval
- procurement approval
- business sponsor approval
- data governance approval
- architecture approval

Informational review should not block a gate unless the route explicitly marks it as blocking.

Required approval blocks stage or artifact movement until resolved.

## Routing Modes

Approval routing must support:

- sequential approval
- parallel approval
- all approvers required
- any approver required
- fallback approver
- escalation approver
- conditional approver based on risk/value/sensitivity

Examples:

- Sequential: Procurement -> Legal -> CIO
- Parallel: Legal + Security + Finance at the same time, then CIO
- Any required: one of two delegated procurement approvers can approve
- Fallback: if reviewer is inactive or overdue, route to backup owner
- Escalation: overdue executive approval escalates to steering committee chair

## Approval Statuses

Approval statuses:

- Not Required
- Not Started
- Pending
- Approved
- Rejected
- Changes Requested
- Escalated
- Waived
- Expired

Status behavior:

- Pending blocks when approval is required.
- Changes Requested creates a revision loop.
- Rejected blocks until resolved or waived.
- Waived requires rationale and authorized approver.
- Expired triggers alert and escalation.

## Example Approval Routes

### Standard Digital Build

Example event:

- $1M-$5M app build or data project
- standard rigor
- low to moderate sensitivity

Route:

1. Sourcing Lead
2. Procurement

Typical artifacts requiring approval:

- scope document
- RFP/RFI package
- pricing template
- selection memo

### Enhanced Data & AI Modernization

Example event:

- $5M-$25M data modernization partner selection
- enhanced rigor
- high data dependency

Route:

1. Sourcing Lead
2. Procurement
3. Security / Data Governance
4. CDO or CIO sponsor

Typical artifacts requiring approval:

- scope document
- data/security requirements appendix
- RFP/RFI package
- pricing template
- scorecard
- selection memo

### Strategic AMS / Managed Services

Example event:

- $25M-$100M or larger managed services / outsourcing event
- strategic rigor
- operational, legal, security, and financial risk

Route:

1. Sourcing Lead
2. Procurement
3. Legal
4. Finance
5. Security
6. CIO / Steering Committee

Typical artifacts requiring approval:

- scope and retained responsibilities model
- sourcing strategy memo
- RFP/RFI package
- pricing template
- service-level requirements
- scorecard
- exception log
- selection memo
- mobilization checklist

## Approval Behavior

Approvals should have:

- owner
- approver role
- due date
- routing mode
- blocking/non-blocking flag
- rationale requirement
- reminder cadence
- escalation behavior
- final decision timestamp

Approval rules:

- approvals are auditable
- approvals can be waived only with rationale
- locked artifacts cannot be edited unless reopened
- reopening creates a new artifact version
- stage gates can require approvals
- Nexus explains approval blockers
- Steward enforces approval gates
- Atlas summarizes approval status for executives

## Document Review Behavior

Document review should support:

- comments attached to artifact version
- required comments
- optional comments
- changes requested
- comment resolved
- review complete
- redlines uploaded
- new version created from uploaded redlines
- approval reset rules when material changes occur

Review rules:

- comments belong to an artifact version
- required comments must be resolved before lock
- uploaded redlines create a new version
- Source stores review metadata even if edits happen externally
- Sentinel validates required evidence and citations
- Atlas can summarize review and approval posture

## Lock And Reopen Rules

Locked artifact:

- cannot be edited in place
- can be exported
- can be issued/published
- can be superseded
- can be reopened only by authorized role

Reopened artifact:

- creates a new working version
- records reason for reopen
- may reset approvals depending on change type
- preserves prior locked version

Material changes that should reset approval:

- scope expansion or contraction
- pricing model change
- vendor list change
- scorecard weight material change
- legal/security/compliance term change
- value assumption change
- decision recommendation change

## Agent Behavior

Nexus:

- describes approval path
- explains which approvals are missing
- recommends next routing action
- labels whether an artifact can be issued, locked, revised, or must wait

Steward:

- blocks unsafe movement
- requires approval owner
- requires waiver rationale
- prevents lock with unresolved required comments

Sentinel:

- checks whether approval evidence and artifact citations are present
- flags unsupported artifact claims

Atlas:

- summarizes approval status, unresolved blockers, and executive decision readiness

