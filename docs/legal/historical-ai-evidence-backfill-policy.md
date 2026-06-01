# Historical AI Evidence Backfill Policy

Status: pilot policy baseline
Owner: AbarVa platform owner
Last updated: 2026-06-01
Backlog row: T249

## Purpose

This policy covers records, artifacts, exports, decisions, and workflow events
created before the AI decision-support evidence framework existed or before a
specific module adopted the current controls.

The rule is simple: do not fabricate historical evidence. Mark older records
truthfully, preserve what exists, and capture prospective evidence from the
policy effective date forward.

## Policy Statement

Records that predate the applicable evidence controls must be labeled:

`pre-policy - captured before evidence framework`

The label means the record may be valid business history, but AbarVa cannot
claim that it contains the full decision-owner packet, human attestation,
source-citation set, confidence rationale, missing-data banner, or override
disposition required by the current policy.

## Effective Dates

| Control | Default effective date | Evidence source |
| --- | --- | --- |
| AI as advisor, never final decision-maker | 2026-06-01 | `docs/architecture/adr/ADR-0006-ai-as-advisor.md` |
| Shared decision-support controls | 2026-06-01 | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md` |
| Consequential action catalog | 2026-06-01 | `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md` |
| Generated UI catalog | 2026-06-01 | `docs/legal/AI_GENERATED_UI_CATALOG.md` |

If a module adopts a stricter control later, its release record must state the
module-specific effective date.

## Backfill Rules

Allowed:

- Add the pre-policy label to older records and exports.
- Attach existing evidence that was actually captured at the time.
- Add a reviewer note that explains what evidence is missing.
- Link the record to the current policy and applicable release record.
- Re-run an analysis as a new current-policy artifact when the client asks for a
  decision-grade version.

Not allowed:

- Invent reviewer names, timestamps, citations, confidence, or attestation.
- Rewrite an old AI output to make it appear current-policy compliant.
- Change historical approval state without an explicit new review event.
- Hide missing evidence by converting old records into current records.
- Treat generated text as human-authored merely because a human later viewed it.

## Labeling Standard

Use this language in exports, admin views, or audit notes when older records are
surfaced:

```text
Pre-policy record: this item was captured before AbarVa's current AI
decision-support evidence framework applied to this surface. Review available
source material before relying on it for a current business decision.
```

For client-facing exports, keep the language concise and do not imply the
record is defective. The point is evidence transparency, not alarm.

## Review Workflow

1. Identify the artifact, workflow event, or record set.
2. Confirm client scope using canonical `clients` / `client_id` identifiers.
3. Determine whether the record predates the applicable control.
4. Preserve original content and metadata.
5. Attach the pre-policy label and any existing evidence.
6. If a client needs current reliance, create a new reviewed artifact under the
   current evidence framework.
7. Record the reviewer, date, scope, and reason for the backfill note.

## Audit Evidence

For each backfill batch, retain:

- Client and `client_id`.
- Record type and affected ids.
- Original created timestamp range.
- Applied label or note text.
- Existing evidence found.
- Missing evidence categories.
- Reviewer and approval timestamp.
- Release record or policy reference.

## Known Gaps

This policy does not create an automated migration or UI label. It defines the
truthful handling standard that future migration scripts and UI surfaces should
follow.
