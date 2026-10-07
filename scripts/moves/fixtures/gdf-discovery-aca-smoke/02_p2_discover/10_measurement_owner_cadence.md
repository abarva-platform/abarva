# Measurement owners and operating cadence

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real owner roster, no approved review
cadence, and no committed service target is represented here.

## Working model for the scenario

A governed data foundation only stays trustworthy if every certified measure has
a named owner and a recurring review that catches drift, broken lineage, and
quality exceptions before a clinician or executive relies on the number.

## Candidate owner and cadence model

| Measure area (synthetic) | Proposed accountable owner | Proposed review cadence |
|---|---|---|
| Certified clinical/quality measures | Clinical analytics product owner | Monthly definition + drift review |
| Member attribution and panels | Population-health analytics owner | Monthly, aligned to enrollment refresh |
| Data-quality exceptions | Domain data steward | Weekly exception triage |
| Model inputs and responsible-AI checks | Responsible-AI owner | Each model refresh + quarterly review |
| Privacy/PHI controls | Privacy owner | Quarterly, plus on any scope change |

## Operating expectations

1. Each certified measure names one accountable owner; an unowned measure is not
   certified.
2. A recurring review checks definition currency, lineage integrity, freshness,
   and open exceptions, and records decisions.
3. Drift or a broken dependency pauses certification rather than silently
   publishing a stale number.

## Still required before this is a client fact

The real owner roster, the agreed cadences, and the service targets are not
established here and must be confirmed with the client's operations and clinical
leaders.
