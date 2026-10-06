# Worker and organization identity resolution

**SYNTHETIC - NOT CLIENT-ATTESTED.** These candidate rules use no actual
employee identifiers and do not establish that any source key is authoritative.

## Candidate identity contract

- Prefer a governed, non-reused enterprise worker key from the HR source.
- Keep source-native person identifiers in the restricted ingestion zone only.
- Use effective-dated organization and job-family mappings, with versioned
  crosswalks and a named steward.
- Model rehire, transfer, concurrent assignment, contingent worker, and
  termination cases explicitly; do not infer identity from names or email.
- Reject ambiguous or duplicate key mappings from certified Gold outputs until
  a steward resolves them.
- Never use an identity match to join HR data to another domain unless purpose,
  authority, and privacy review explicitly permit it.

## Test cases for design review

| Case | Expected behavior | Owner to confirm |
|---|---|---|
| Rehire with same enterprise key | Link employment episodes; preserve effective dates | HR data steward |
| Source correction changes a native ID | Maintain crosswalk history; do not rewrite published lineage | HR source owner |
| Two records share a key unexpectedly | Quarantine conflict; block affected aggregate | Data quality owner |
| Org hierarchy changes mid-period | Apply agreed snapshot/effective-date rule | Workforce planning |
| Contingent worker lacks enterprise key | Keep out of measure or use approved separate population | HR policy owner |

No match rate or identity quality score is supplied. The actual key, source
ownership, and exception process must be verified before sizing a production
matching implementation.
