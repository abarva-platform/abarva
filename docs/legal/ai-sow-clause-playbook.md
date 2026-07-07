# AI SOW Clause Playbook

Status: draft for counsel review
Owner: AbarVa platform owner
Last updated: 2026-06-01
Backlog rows: T219, T220, T221, T222

## Purpose

This playbook gives AbarVa a counsel-ready checklist for AI-specific SOW/MSA
terms. It is not legal advice and should not be inserted into a client contract
without lawyer review.

The business goal is to align contract language with the product posture:
AbarVa provides AI-assisted decision support, while the client remains
responsible for reviewing, validating, approving, and acting on outputs.

## Clause Themes

| Theme | Backlog row | Purpose |
| --- | --- | --- |
| Advisor-not-decider positioning | T219 | Make clear AbarVa supplies recommendations, drafts, summaries, and evidence support; it does not make client decisions. |
| Client validation duty | T219, T222 | Require users to review outputs, complete training, and validate before relying on any output. |
| Hallucination and limitation disclosure | T219 | Preserve the known limitation that AI can be wrong, stale, incomplete, or unsupported. |
| Client reliance indemnity | T220 | Allocate claims arising from client reliance or client-directed use to the client, subject to counsel negotiation. |
| AI-output liability cap carve-out | T221 | Give counsel a specific issue to negotiate rather than hiding AI risk inside a generic cap. |
| Training warranty | T222 | Require the client to ensure authorized users complete required responsible-AI training before access. |

## Required Contract Positions

Counsel should review whether the SOW/MSA includes:

- AI decision-support description.
- Explicit statement that AbarVa does not approve, authorize, award, fund,
  terminate, renew, diagnose, underwrite, or otherwise make consequential
  decisions for the client.
- Client duty to review, validate, edit, and approve outputs before use.
- Hallucination, missing-data, and source-quality limitation language.
- Prohibited or escalated high-risk uses.
- User training and acknowledgment requirement.
- Export and board-pack disclaimer language.
- Decision-owner and approval-evidence obligations.
- Indemnity allocation for client reliance and client-directed use.
- Liability cap treatment for AI-output reliance claims.
- Incident/complaint reporting obligations for AI-output concerns.

## Draft Clause Concepts

These are concepts for counsel, not approved contract text.

### AI Decision Support

AbarVa outputs are decision-support materials. The client remains responsible
for all business, procurement, program, operational, financial, legal,
employment, healthcare, credit, insurance, safety, and regulated decisions.

### Client Review And Validation

The client should review all AI-assisted outputs, source materials,
assumptions, missing-data notices, confidence indicators, and limitations before
using them for a business decision or external communication.

### No Autonomous Action

AbarVa should not be contractually treated as authorized to take external
actions, send vendor communications, approve program gates, bind the client, or
commit client resources without an explicit human approval workflow.

### Known Limitations

AI-assisted outputs may be incomplete, inaccurate, stale, unsupported, or
overconfident. Client use should remain subject to human review, applicable law,
professional judgment, and the client's own governance policies.

### High-Risk Uses

High-risk uses involving employment, healthcare treatment, credit, insurance,
legal determinations, safety, regulated consumer decisions, or individual rights
should require written approval, additional controls, or prohibition depending
on counsel review and pilot scope.

### Training Warranty

The client should be responsible for ensuring authorized users complete required
Responsible AI Use training and acknowledgments before accessing production or
pilot workspaces.

### Reliance And Indemnity

Counsel should evaluate whether the client indemnifies AbarVa for claims
arising from client decisions, client reliance on outputs, client failure to
review/validate outputs, client-directed high-risk uses, or client use outside
the agreed scope.

### Liability Cap Treatment

Counsel should evaluate whether AI-output reliance claims need a separate cap,
sub-cap, exclusion, or negotiated treatment distinct from the general services
cap. The contract should not leave the treatment ambiguous.

## Negotiation Notes

- Keep the posture practical. Buyers may resist broad one-sided language; the
  core requirement is clear responsibility and review duty.
- Do not overstate technical controls that are not implemented.
- Keep public disclosures, SOW language, and product labels aligned.
- Avoid promising model accuracy, outcome attainment, or autonomous compliance.
- Treat client-specific regulated use cases as a scoped addendum, not generic
  platform use.

## Evidence To Attach During Contract Review

- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`
- `docs/architecture/adr/ADR-0006-ai-as-advisor.md`
- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- Public Responsible AI, Model Card, and Known Limitations pages.
- AI-output complaint and escalation runbook when merged.
- Counsel comments and final approved clause version.

## Known Gaps

This playbook is not a lawyer-approved clause library. Rows T219-T222 should
remain open or in progress until counsel reviews and approves final MSA/SOW
language for use with clients.
