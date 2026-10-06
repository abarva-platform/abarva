# Semantic layer and certified report definitions

**SYNTHETIC - NOT CLIENT-ATTESTED.** Report names, formulas, cadences, and
owners below are constructed solely to exercise evidence parsing and review.

## Candidate report catalog

The scenario requests ten reports, all based on governed, aggregated HR data.
These are requirements for sizing, not evidence that a source already contains
the fields or that the reports are approved.

| ID | Synthetic report | Candidate question | Candidate grain | Definition owner |
|---|---|---|---|---|
| R01 | Workforce composition | How is workforce mix changing? | Month / org unit | HR analytics |
| R02 | Hiring funnel | Where do candidates exit? | Requisition / month | Talent operations |
| R03 | Time-to-fill | How long from approved requisition to accepted offer? | Requisition cohort | Talent operations |
| R04 | Internal mobility | How often are roles filled internally? | Quarter / job family | HR analytics |
| R05 | Learning participation | Which groups complete assigned learning? | Course / month / org | Learning operations |
| R06 | Absence trend | What is the aggregate absence trend? | Month / org unit | HR analytics |
| R07 | Retention trend | How does aggregate retention vary by cohort? | Quarter / org unit | HR analytics |
| R08 | Span-of-control view | How are manager spans distributed? | Month / org unit | Workforce planning |
| R09 | Compensation distribution | How do approved compensation bands distribute? | Quarter / job family | Compensation |
| R10 | Capacity planning | Where are planned role needs changing? | Quarter / scenario | Workforce planning |

## Semantic contract proposals

- Define workforce headcount as distinct, active worker keys on the agreed
  month-end snapshot; decide treatment of leave and contingent labor.
- Define time-to-fill start/end events, exclusions, paused intervals, and the
  percentile to report. Averages alone may hide long-tail delays.
- Define retention denominator, eligible population, event window, and
  treatment of transfers. Do not equate retention with engagement.
- Define completion from the learning event system, not assignment status.
- Define compensation measures at aggregate levels and suppress small cells
  under a policy chosen by the data owner.
- Each formula carries a version, owner, source fields, exclusions, test cases,
  and last approval date. No formula is certified by this synthetic file.

## Required certification evidence

For each of the ten reports, collect a named owner, accepted definition,
reconciliation sample, filter/suppression rule, and a record of business review.
The upload supplies a proposed dictionary to critique; it must not be treated as
a certified semantic layer until an authorized reviewer accepts it.
