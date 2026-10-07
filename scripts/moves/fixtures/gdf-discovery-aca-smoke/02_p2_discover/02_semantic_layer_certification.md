# Semantic layer and certified measure definitions

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real metric dictionary, no approved
clinical measure specification, and no certified definition is included here.

## Working model for the scenario

AI and analytics for the synthetic IDN must read from certified measures, not
ad hoc queries. The semantic layer defines each shared measure once — its
population, numerator and denominator, inclusion and exclusion logic,
measurement period, and the governed source it reads from — so a readmission
rate or a care-gap count means the same thing to every model and report.

| Candidate certified measure | Definition anchor (synthetic) | Evidence still needed |
|---|---|---|
| 30-day all-cause readmission rate | Index acute inpatient discharges; 30-day window; approved exclusions | Signed numerator/denominator spec and owner |
| Open care gap count (preventive) | Eligible population by measure; gap open at period end | Ratified eligibility and measure version |
| Member attribution to PCP | Attribution rule and look-back window | Approved attribution model and effective date |
| Provider panel size | Attributed active members per provider | Confirmed provider master and active rule |
| ED utilization per 1,000 | ED encounters over attributed member-months | Confirmed denominator source and period |

## Proposed controls

1. Each certified measure links to exactly one approved semantic version; a
   report or model that needs a different cut requests a new version, it does
   not redefine the measure locally.
2. A measure amendment records author, reviewer, effective date, and the
   downstream reports and models affected.
3. Clinical code sets (for example ICD-10, CPT, LOINC — synthetic references
   only here) are versioned and dated; a code-set change is a measure change.
4. A measure is not "certified" until its population, logic, source, and owner
   are all recorded and ratified by the governance council.

## Still required before this is a client fact

The real measure specifications, the authoritative code-set versions, the
certified population logic, and the named measure owners are not supplied here
and must be confirmed with the client's clinical and analytics leaders.
