# Patient, member, and provider identity resolution

**SYNTHETIC - NOT CLIENT-ATTESTED.** These candidate rules use no actual patient,
member, or provider identifiers and do not establish that any source key is
authoritative.

## Candidate identity contract

- Resolve an enterprise patient identity (an EMPI-style governed key) rather
  than reusing any single source system's medical record number.
- Maintain a governed provider identity keyed on NPI, with specialty, location,
  and network status as effective-dated attributes.
- Maintain a member/enrollment identity with effective-dated plan, product, and
  attribution.
- Keep source-native person identifiers (MRNs, subscriber ids) in the restricted
  ingestion zone only; never expose them in certified outputs.
- Model merge, split, overlay, newborn, and deceased cases explicitly; never
  infer identity from name, date of birth, or address alone.
- Never join clinical identity to another domain unless purpose, authority, and
  privacy review explicitly permit it (and never behavioral-health data without
  the Part 2 consent model).

## Test cases for design review

| Case | Expected behavior | Owner to confirm |
|---|---|---|
| Same patient, two source MRNs | Link under one enterprise key; preserve source crosswalks | Enterprise patient identity steward |
| Overlay / wrong merge detected | Quarantine; block affected aggregates; steward resolves | Data quality owner |
| Provider changes network status | Apply effective-dated snapshot; preserve history | Provider data steward |
| Member re-enrolls after a gap | Link enrollment episodes; keep eligibility spans distinct | Member/enrollment steward |
| Newborn without an enterprise key yet | Approved temporary handling; excluded from attributed measures | Clinical data steward |

No match rate or identity-quality score is supplied here. The real key, source
ownership, overlay rate, and exception process must be verified before sizing a
production matching implementation.
