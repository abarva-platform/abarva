# Source-to-report lineage and audit trail

**SYNTHETIC - NOT CLIENT-ATTESTED.** This is a candidate lineage design, not a
record of a running pipeline or a production architecture.

## Proposed lineage path

`HR source export/API -> immutable landing (Bronze) -> validated/conformed HR
entities (Silver) -> governed aggregates and certified measures (Gold) -> ten
reports -> authorized HR consumers`

Every hop must preserve a stable batch/run identifier, source object/version,
ingestion time, schema version, transformation commit, quality results, and
publication decision. The report should be able to identify the Gold model
version and underlying approved source batch without exposing row-level source
records to its audience.

## Audit events to capture

| Event | Minimum audit fields | Review question |
|---|---|---|
| Source extract received | source alias, batch id, received time, schema hash | Who authorized the extract and for what purpose? |
| Bronze write | object path, checksum, row-count band, pipeline run | Is the landing immutable and access restricted? |
| Silver transform | code/version, input batch, rule results | Can a failed rule stop or quarantine publication? |
| Gold model build | model version, metric version, publication status | Who certified the semantic contract? |
| Report refresh | report id/version, run id, row-count band | Can a report be traced to a single approved snapshot? |
| Access/release | role, purpose, entitlement change, expiry | Can access be revoked and audited? |

## Failure and replay behavior

Quarantine invalid batches; never overwrite the last certified Gold snapshot in
place. A replay is a new run with a reason and linked predecessor. A metric
definition change creates a new semantic version and lists all impacted reports.
The release log should distinguish a build that completed technically from a
dataset/report that a business owner approved for use.

## Unknowns to collect

Current platform lineage capabilities, audit retention, source snapshot policy,
run-id propagation, report refresh logging, and the authority to release or
revoke a Gold model are not established by this synthetic design.
