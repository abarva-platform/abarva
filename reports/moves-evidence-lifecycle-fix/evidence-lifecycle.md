# Evidence Lifecycle Contract

## Upload

A workspace upload creates the evidence row and then opens or reuses an evidence review row.

Initial uploaded-only state:

- `reviewStatus = pending_review`
- `maturityLevel = upload_captured`
- `attachmentStatus = needs_human_review`

## Review

Approved evidence can count toward readiness, context extract attachment, and generation.

Rejected or pending evidence does not count as generation-ready.

## Readiness

Readiness reads the same approved evidence source as the context extract and generation contract:

`program_evidence_reviews.decision = approved`

## Generation

Generation no longer has a raw fallback to unreviewed `program_evidence_items`.

That is intentional. A file being uploaded is not the same as being accepted for phase-gate evidence.

