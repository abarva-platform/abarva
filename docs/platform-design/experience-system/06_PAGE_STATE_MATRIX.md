# Page State Matrix

## Required States

Every major surface should define:

- Empty state.
- Seeded/demo state.
- Active state.
- Waiting state.
- Blocked state.
- At-risk state.
- Needs approval.
- Complete.
- Archived.
- Low evidence.
- Missing data.
- Stale data.
- Upload pending.
- Review pending.

## State Rules

| State | User Sees | Agent Says | Available Action | Disabled / Hidden |
| --- | --- | --- | --- | --- |
| Empty | Setup guidance | What is needed first | Add/import/start | Decision actions |
| Seeded/demo | Clearly labeled sample data | Pattern-level guidance | Explore | Client-specific claims |
| Active | Current work and next action | Context-aware guidance | Advance/inspect | Unsafe next stages |
| Waiting | Owner/due/aging | What is being waited on | Remind/reassign | Premature generation |
| Blocked | Blocker and evidence gap | Why blocked | Resolve blocker | Advance stage |
| At-risk | Risk, value, owner | Pressure signal | Open mitigation | Cosmetic actions |
| Needs approval | Approvers and state | Approval blocker | Request/approve/waive | Lock/finalize |
| Complete | Completed evidence | What changed | Review/archive | Edit locked item |
| Low evidence | Evidence score | Limitations | Add evidence | Decision-grade response |
| Upload pending | Parse/index status | What is not usable yet | Request parse | Citation |

## What Must Not Be Shown

- Client-specific certainty when only pattern guidance exists.
- Citation from unparsed uploads.
- Approval-ready state with unresolved required comments.
- Complete value state without evidence and measurement owner.

