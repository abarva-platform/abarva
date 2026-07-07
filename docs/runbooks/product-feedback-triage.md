# Product Feedback Intake And Triage

## Purpose

This runbook is the single operating path for product feedback, feature
requests, enhancement asks, defects that are not incidents, and pilot-client
"can you also" requests.

The goal is simple: every request lands in one queue, gets a named owner, is
triaged on a predictable cadence, and has a customer-safe status. This prevents
side-channel commitments and keeps roadmap decisions tied to release evidence.

## Intake Sources

Accepted sources:

| Source | Examples | Required capture |
| --- | --- | --- |
| Pilot client | Weekly call, email, Slack/Teams export, QBR | Request, client, requester, business reason, affected workflow |
| Internal operator | Support note, demo observation, QA finding | Request, observed evidence, affected route/module |
| Sales/founder | Prospect objection, pricing/package feedback | Request, deal context, urgency, revenue relevance |
| Product/engineering | Refactor need, usability gap, reliability issue | Request, risk, affected files/routes, proposed owner |

Requests should not be accepted as commitments until they pass triage.

## Required Fields

Every item must capture:

- Request title.
- Request type: `defect`, `enhancement`, `workflow-gap`, `data-gap`,
  `commercial-ask`, or `out-of-scope`.
- Client or prospect, if applicable.
- Affected module: Home, Admin/Setup, Moves/Nexus, Source, Tower/Atlas,
  Intelligence/Sentinel, Steward, platform, or private data plane.
- Evidence link: call note, screenshot, PR, ticket, customer email, or
  reproducible step.
- Business outcome: what improves if this is shipped.
- Requested date and requested-by.
- Triage status.
- Owner.
- Target horizon: Now, Next, Later, Rejected, or Needs discovery.

## Triage Cadence

| Cadence | Owner | Agenda |
| --- | --- | --- |
| Weekly 30 minutes | Founder/product owner | Review new intake, classify, assign owners, decide Now/Next/Later |
| Monthly 45 minutes | Founder + engineering lead | Reconcile roadmap, release evidence, customer commitments, and capacity |
| Quarterly | Founder + customer sponsor, when applicable | Confirm major roadmap themes and de-scope stale asks |

Emergency defects use the incident-response runbook instead of this cadence.

## Status Model

| Status | Meaning | Customer wording |
| --- | --- | --- |
| New | Captured but not reviewed | "Received; pending triage." |
| Needs discovery | Missing context, owner, evidence, or sizing | "We need one more clarification before committing." |
| Accepted - Now | Planned for the current release horizon | "Accepted for current release planning." |
| Accepted - Next | Valuable, but not current-sprint scope | "Accepted for the next roadmap horizon." |
| Later | Valid but not near-term | "Not in the immediate pilot scope; retained for roadmap review." |
| Out of scope | Requires paid change order or separate SOW | "Outside current scope; can be estimated separately." |
| Rejected | Not aligned with product/security/commercial posture | "Not planned; rationale recorded." |
| Shipped | Released and validated | "Released; validation evidence is available." |

Do not promise dates unless the item is tied to an approved release candidate.

## Triage Rules

1. Client-visible commitments require an owner and a release path.
2. Security, privacy, tenant-isolation, auth, or regulated-data issues escalate
   to incident response or security backlog, not normal feedback triage.
3. Data-loader/private-data-plane requests must stay single-client scoped.
4. AI-output quality requests must include the prompt, evidence context, model
   route, and expected answer source before engineering accepts them.
5. Out-of-scope requests must be priced or explicitly deferred; do not hide
   them inside normal support.
6. A request cannot be marked shipped until release evidence exists: PR,
   commit, test/QA, deployment or docs artifact, and rollback path when
   relevant.

## Customer-Facing Loop

Use this loop for pilot clients:

1. Capture the request in the single queue within one business day.
2. Acknowledge receipt without committing.
3. Triage weekly.
4. Send status after triage for accepted, rejected, or out-of-scope items.
5. For shipped items, share what changed, where it is visible, and any user
   action required.

## Evidence

The queue can start as a spreadsheet or issue board, but each item must have an
evidence link. The first durable system should preserve these fields:

- `feedback_id`
- `client_id`
- `request_type`
- `module`
- `status`
- `owner`
- `target_horizon`
- `source_evidence_url`
- `release_record_url`
- `created_at`
- `triaged_at`
- `shipped_at`

## Related Runbooks

- `docs/runbooks/incident-response.md`
- `docs/runbooks/product-roadmap-horizons.md`
- `docs/runbooks/spend-approval-controls.md`
- `docs/runbooks/token-consumption-overage-policy.md`
