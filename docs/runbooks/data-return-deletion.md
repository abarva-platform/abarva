# Data Return And Deletion Runbook

## Purpose

Use this runbook when a client asks AbarVa to return, export, delete, or prove
deletion of client data. The goal is pilot-ready compliance handling: verify
authority, scope the request by client, preserve audit evidence, avoid
cross-client exposure, and do not destroy data without approval and a recovery
plan.

This is an operational runbook only. It does not add private data-plane
implementation, automated deletion tooling, or legal advice.

## Request Types

| Request | Meaning | Default handling |
| --- | --- | --- |
| Data return | Client asks for a copy of their data or evidence artifacts | Export only approved client-scoped records and attach manifest |
| Data deletion | Client asks AbarVa to delete client data | Verify authority, legal hold, backups, and deletion scope before action |
| Account/user deletion | Client asks to remove a user or admin account | Confirm identity, role impact, and audit retention requirements |
| Proof of deletion | Client asks for evidence that deletion occurred | Provide deletion manifest, timestamps, approvers, and retained exceptions |

## Roles

- Request owner: owns intake, due date, status, and client communication.
- Data lead: owns `clients` / `client_id` scoping, export/deletion plan,
  validation, and manifest.
- Security/legal owner: confirms authority, contract terms, legal hold, and
  retention exceptions.
- Technical executor: performs approved export or deletion steps.
- Reviewer: independently verifies the manifest, row counts, and evidence before
  client delivery.

## Intake

1. Open a request thread with requester, client, request type, received time,
   requested due date, and source of request.
2. Verify requester authority through the approved client contact or contract
   owner.
3. Identify the canonical client row and `client_id`; do not proceed from a
   display name alone.
4. Classify the data classes requested: account, uploads, generated artifacts,
   audit records, engagement records, AI context, billing, email, analytics, or
   optional provider data.
5. Check legal hold, security incident hold, financial retention, audit
   retention, and contractual retention requirements.
6. Decide whether the request is return-only, deletion-only, return then delete,
   or proof-only.
7. Assign owner, executor, reviewer, and client/legal approver.

## Data Return

1. Freeze unrelated edits to the scoped client data if the return must represent
   a point-in-time snapshot.
2. Define export boundaries in writing:
   - Included clients and `client_id` values.
   - Included data classes.
   - Excluded data classes and why.
   - Snapshot time.
   - Format and delivery method.
3. Export only client-scoped data. Do not include other clients, internal notes,
   secrets, credentials, raw provider tokens, or unrelated system logs.
4. Build a manifest with file names, row counts, data classes, created time,
   exporter, reviewer, and hash when available.
5. Store the export in the approved secure delivery location.
6. Have the reviewer confirm row counts, manifest, and absence of cross-client
   data before release.
7. Send the client a plain-English delivery note with scope, exclusions,
   delivery method, and expiration or access instructions.

## Data Deletion

Do not delete data until authority, scope, retention exceptions, and rollback
posture are approved.

1. Confirm the deletion scope in writing:
   - Client and `client_id`.
   - Data classes to delete.
   - Data classes to retain.
   - Backup and audit retention exceptions.
   - Target completion date.
2. Preserve pre-deletion evidence: counts, manifests, relevant audit rows,
   approval, and the recovery point or backup posture.
3. Dry-run the deletion plan where tooling exists. The dry run must list tables,
   predicates, expected row counts, skipped rows, retained exceptions, and
   whether the operation is idempotent.
4. Use the DB migration runbook for any data-plane deletion, repair migration,
   or scripted cleanup.
5. Execute one approved deletion step at a time. Avoid broad `DELETE`, `UPDATE`,
   or `TRUNCATE` operations without a reviewed `client_id` predicate and
   reviewer signoff.
6. Capture command output and row counts immediately.
7. Run post-deletion validation before announcing completion.

## Retention Exceptions

Some records may be retained even when client data is deleted. Document each
exception plainly and get approval before relying on it.

Common exceptions:

- Security, incident, and access audit records required to prove controls.
- Financial, billing, tax, or contractual records.
- Legal hold or dispute preservation.
- Backups retained until normal expiration.
- Aggregated metrics that cannot identify the client or users.
- Provider-side records that require a separate deletion workflow.

If retained records include client-identifying fields, state the reason,
retention period, access controls, and deletion review date.

## Validation Checklist

- [ ] Requester authority verified.
- [ ] Canonical client and `client_id` confirmed.
- [ ] Legal/security retention exceptions reviewed.
- [ ] Export or deletion scope approved in writing.
- [ ] Manifest includes data classes, files or tables, row counts, actor,
  reviewer, timestamps, and exclusions.
- [ ] Cross-client leakage check completed for returned artifacts.
- [ ] Post-deletion row-count checks match approved plan or documented variance.
- [ ] Audit evidence is attached to the request thread.
- [ ] Client communication approved before sending.

## Client Communication

Use a concise status note at intake, execution start, completion, and any delay.

For data return, include:

- Data classes included.
- Data classes excluded and why.
- Snapshot time.
- Delivery method.
- Access expiration or handling instructions.

For deletion, include:

- Data classes deleted.
- Data classes retained and why.
- Backup expiration or retention posture.
- Completion timestamp.
- Proof of deletion evidence available.

Do not promise permanent removal from backups unless the backup retention policy
and expiration evidence prove it.

## Evidence To Attach

- Original request and authority verification.
- Client approval, legal/security approval, and executor/reviewer names.
- Canonical client row and `client_id`.
- Export manifest or deletion manifest.
- Dry-run output.
- Command output and row counts.
- Cross-client validation result.
- Retention exceptions.
- Client delivery or completion notice.
- Follow-up owner for any provider-side or backup-expiration evidence.

## Out Of Scope

- This runbook does not create an automated data export or deletion product
  surface.
- This runbook does not authorize private data-plane implementation work.
- This runbook does not override legal hold, security hold, billing retention,
  or incident-response preservation.
- This runbook does not approve deletion without verified client scope and
  reviewer signoff.
- This runbook does not require changing runtime code or database migrations.
