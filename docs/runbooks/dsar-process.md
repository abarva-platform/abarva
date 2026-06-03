# DSAR Process Runbook

Status: operational draft
Backlog task: T119

## Purpose

Use this runbook when a data subject or client asks AbarVa to access, correct,
export, restrict, or delete personal data. This is the intake and governance
layer for Data Subject Access Requests. Client data return and deletion
execution still follows `docs/runbooks/data-return-deletion.md`.

This runbook is not legal advice and does not create automated DSAR tooling.

## Request Types

| Request type | Meaning | Default handling |
| --- | --- | --- |
| Access | Data subject asks what personal data AbarVa holds | Verify identity, scope by client, export approved personal-data records |
| Correction | Data subject says personal data is inaccurate | Verify authority, identify system of record, record correction decision |
| Deletion | Data subject asks for erasure | Check client authority, legal hold, audit retention, and contract limits |
| Restriction | Data subject asks processing to stop or be limited | Escalate to client owner and legal/security before any operational change |
| Portability | Data subject asks for a machine-readable copy | Treat as data return with personal-data scope and manifest |
| Objection | Data subject objects to processing | Escalate to client owner and legal/security for disposition |

## Roles

- DSAR owner: owns intake, due date, status, and communication log.
- Client owner: confirms whether the requester is a customer contact, employee,
  candidate, or end user of a client.
- Data lead: maps records by `client_id`, user id, email, and provider ids.
- Security/legal reviewer: confirms authority, legal basis, retention
  exceptions, and hold status.
- Executor: performs approved export, correction, restriction, or deletion.
- Reviewer: validates manifest, scope, and absence of cross-client data.

## Intake

1. Log the request with received timestamp, channel, requester, client, request
   type, requested due date, and known identifiers.
2. Acknowledge receipt without promising completion until identity and authority
   are verified.
3. Verify identity using an approved client contact or account-controlled
   channel. Do not rely on unauthenticated email alone.
4. Confirm the canonical client row and `client_id`; never scope a DSAR from a
   display name alone.
5. Identify data classes in scope: account, invite, chat, upload, generated
   artifact, approval/audit record, email, analytics, billing, or provider-side
   data.
6. Check legal hold, security incident hold, billing/tax retention, contractual
   retention, and audit-record exceptions.
7. Assign DSAR owner, data lead, security/legal reviewer, executor, and
   independent reviewer.

## Execution Routing

| DSAR path | Execution runbook |
| --- | --- |
| Return/export personal data | `docs/runbooks/data-return-deletion.md` data-return section |
| Delete personal data | `docs/runbooks/data-return-deletion.md` deletion section |
| Correct personal data | System-of-record correction with before/after evidence |
| Restrict processing | Client-approved suspension or access-change workflow |
| Provider-side records | Vendor-specific subprocessors or support request |

## Validation Checklist

- [ ] Request identity and authority verified.
- [ ] Canonical `client_id` confirmed.
- [ ] Data classes and excluded classes documented.
- [ ] Retention exceptions and legal holds checked.
- [ ] Export, deletion, correction, or restriction plan approved.
- [ ] Manifest includes identifiers, data classes, row/file counts, actor,
  reviewer, timestamps, and exclusions.
- [ ] Cross-client leakage check completed.
- [ ] Provider-side follow-up owners recorded when needed.
- [ ] Completion note reviewed before sending.

## Client / Requester Communication

At minimum, send:

1. Receipt note with verification requirements.
2. Scope confirmation after identity and authority are verified.
3. Delay notice if legal/security review or provider-side work extends timing.
4. Completion note with scope, exclusions, retained exceptions, and delivery
   method or deletion proof.

Do not promise deletion from backups unless the backup retention policy and
expiration evidence support the claim.

## Evidence To Retain

- Original request and all communication.
- Identity and authority verification.
- Canonical `client_id` and requester identifiers.
- Data map and scope decision.
- Legal/security hold and retention review.
- Export, deletion, correction, or restriction manifest.
- Reviewer signoff.
- Completion communication.
- Provider-side request ids, if any.

## Completion Boundary

T119 can be marked Done when this runbook merges and a first manual DSAR record
template or issue process is identified for live operations. Automated DSAR
tooling remains a future product capability unless separately scoped.
