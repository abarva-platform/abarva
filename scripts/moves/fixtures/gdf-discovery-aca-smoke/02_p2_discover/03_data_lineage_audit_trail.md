# Source-to-measure lineage and AI/model audit trail

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real pipeline, no production lineage,
and no actual model audit record is represented here.

## Working model for the scenario

Every certified measure and every AI feature for the synthetic IDN must trace
from the governed source extract, through the transformation and certification
steps, to the report or model input that consumes it — and that trail must be
inspectable after the fact. A number a clinician or executive sees must be
reproducible from named, dated sources.

## Candidate lineage contract

- Each governed dataset records its source system, extract version, the
  transformation job and version, and the certification decision that released
  it.
- A model or AI feature records which certified datasets and measure versions
  it consumed, the as-of date, and the human who approved its use.
- A published number carries enough lineage that a reviewer can re-derive it
  from the source extract without tribal knowledge.
- A source correction maintains crosswalk and lineage history; it never
  silently rewrites a previously published figure.
- PHI never leaves its governed zone through an untracked path; every export is
  logged with purpose and approver.

## Audit expectations for design review

| Event | Expected recorded trail | Owner to confirm |
|---|---|---|
| Certified measure published | Source, transform version, approver, effective date | Analytics platform owner |
| Model input refreshed | Dataset versions consumed, as-of date | Responsible-AI owner |
| Source value corrected | Crosswalk entry; prior lineage preserved | Source data owner |
| PHI export | Purpose, minimum-necessary scope, approver | HIM and security |

## Still required before this is a client fact

The real pipeline inventory, the actual lineage coverage, and the existing model
audit records are not available here and must be confirmed before production
sizing.
