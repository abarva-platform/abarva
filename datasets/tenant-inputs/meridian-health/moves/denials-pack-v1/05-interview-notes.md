# Synthetic role interview notes

Synthetic — not real data — AbarVa demo

These five interviews are invented workshop records dated 10 October 2026. Quotes are fictional; no participant or organisation was interviewed. Roles do not give a real sign-off.

## Interview 1 Revenue cycle director

### Topic

Outcome and throughput

### Session notes

The review meeting receives a total denial count, but the team cannot tell whether yesterday's correction actually removed the first cause. A new spreadsheet becomes the queue when a payer remittance batch lands. The director wants source-team ownership before submission, with an override when a rule is wrong.

### Invented quote

> We learn which check was missing after the claim has already been returned.

### Proposed decision and open conditions

A reviewed primary reason and a visible owner are required before a queue is called actionable. Clean claims must not wait behind unresolved exceptions. The director proposes a shadow comparison before any operational rollout.

## Interview 2 Patient access lead

### Topic

Eligibility and authorization handoff

### Session notes

Coverage responses arrive with versions, but the billing export retains the latest result rather than the service-date result. Authorization scope is tracked separately; an identifier can exist while the approved service does not match. Staff copy a response into a worksheet and call another team when the dates disagree.

### Invented quote

> A green coverage response today does not explain what was checked on the service date.

### Proposed decision and open conditions

Use the service-date coverage version and authorization interval. Keep missing data as an exception rather than treating it as eligible. Patient access certifies eligibility rules; the authorization lead certifies authorization scope. Access must be purpose-bound and approved.

## Interview 3 Coding manager

### Topic

Administrative edits and accountable routing

### Session notes

Reason-code labels drift between analysts. An attachment problem can be entered as a coding problem because the code description is convenient. Queue rows have no shared original-claim identity, so repeat submissions look like additional demand. The manager wants separate reviewed administrative checks and a way to reject a mistaken rule.

### Invented quote

> A reason description is not the same thing as a reviewed root cause.

### Proposed decision and open conditions

Review D-CO with the administrative code pair and source version. D-DO belongs to documentation operations. The taxonomy must retain an unresolved bucket in a live implementation; this fixture contains only reviewed invented groups. No clinical coding advice or autonomous code change is proposed.

## Interview 4 Finance business partner

### Topic

Cash evidence and benefit conversion

### Session notes

The trailing-year baseline contains 618,000 original claims and 97,942 first denials. Final write-offs are $48,785,087.50; cash recovered on denied claims is $126,841,227.50. Rework consumes 83,250.70 hours. Gross charges of $3,453,384,000.00 are not collected value. These are invented mature cohorts, not independently attested financials.

### Invented quote

> Show me the receipt and the comparator before calling prevented loss a cash benefit.

### Proposed decision and open conditions

A reduction in rework time is capacity at zero cash without a recorded release. No collection-vendor contract release is proposed. Faster AR changes receipt timing; do not add the receivables stock as annual revenue. Budget is a ceiling; the approved ROM is the investment cost.

## Interview 5 Data platform owner

### Topic

Identity lineage and source access

### Session notes

The six invented sources use different episode, submission and receipt identifiers. Corrected claim versions must map to the original claim. Remittance reason ordering changes between batches, and one acknowledgement feed lacks a timezone. The platform owner wants restricted landing, reviewed identity mappings and a quality quarantine before products read anything.

### Invented quote

> Keep the source version beside the decision so we can reproduce the exception.

### Proposed decision and open conditions

No extract or entitlement exists yet. Source-owner approval and purpose-bound access precede ingestion. Canonical records carry identity and provenance; product screens project those records. Data platform owns releases of reviewed slices, and finance owns monetary certification.

## Candidate causal findings for human review

- Coverage and authorization versions are missing from the pre-submission decision record.
- Inconsistent denial reason mapping leaves manual correction queues without a shared accountable routing rule.
- Recovery receipts lack a reconciled link to the original denied claim and its final disposition.

These proposals carry no accepted status or confirmed ranking. The owner links actual approved evidence on the new Move, reviews each cause and confirms the order.
