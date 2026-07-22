# Source P1 Approval UX Recommendations — 2026-07-22

## Context

During the SRC-004 golden-event crawl extension, the P1 approval workflow looked too cluttered for the decision being asked of the user. The current page exposes too many adjacent governance details at once, which makes the approver work to find the actual decision.

Target direction: Stripe-like execution quality — quiet hierarchy, one obvious next action, progressive disclosure for evidence and audit detail, and no irrelevant controls in the active step.

## Recommended P1 Approval Shape

### 1. First viewport should answer five questions

- What am I approving?
- What changed since the prior step?
- What evidence supports it?
- What is blocking approval, if anything?
- What is the one action I should take now?

Everything else should be secondary or hidden behind disclosure.

### 2. Replace the long page with a focused approval panel

Recommended layout:

- Header strip: stage name, event name, owner, status, last updated.
- Decision summary: 3-5 concise bullets generated from governed stage data.
- Readiness checklist: only the gate confirmations required for this stage.
- Evidence drawer: collapsed by default, with counts and freshness signals visible.
- Audit trail drawer: collapsed by default, showing prior approvals, acceptances, and reviewer notes.
- Footer action bar: `Approve`, `Request changes`, and a small overflow menu for lower-frequency actions.

### 3. Move non-step content out of the active path

Hide or move behind drawers:

- Full artifact inventories.
- Long rationale/history text.
- Non-current stage material.
- System/governance implementation labels.
- Repeated metadata already represented in the header.
- Secondary analytics that do not change the approval decision.

### 4. Make the page behave like a governed checkout

The approver should feel like they are completing a precise, auditable transaction:

- Show only required confirmations inline.
- Disable `Approve` until blockers are resolved.
- Put blocker copy beside the disabled action, not buried in the page.
- Keep rejection/request-change flow symmetric with approval.
- Preserve the audit trail, but do not make the user read it unless needed.

### 5. Suggested acceptance criteria

- A new approver can identify the approval object and primary action in under 5 seconds.
- The first viewport contains no more than one primary action and one secondary action.
- Required confirmations are visible without scrolling.
- Full evidence and audit history remain accessible within one click.
- No current-stage approval page shows unrelated future-stage or artifact-maintenance content by default.

## Non-Goals

- Do not remove governed evidence, approvals, artifact acceptances, or audit records.
- Do not simplify by hiding blockers.
- Do not change the gate contract until the UX contract is agreed.
- Do not mix this UI simplification into the golden-event E2E extension PR.
