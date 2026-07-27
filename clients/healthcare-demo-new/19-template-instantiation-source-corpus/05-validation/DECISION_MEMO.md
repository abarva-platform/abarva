# Decision Memo: Healthcare Demo New Source Corpus Design

## Recommendation

Approve as a **candidate review package** for human review. The package now passed the independent semantic audit gate, but it is not a frozen synthetic-source foundation and is not approved for Azure/Postgres loading without the next human review gate.

## What changed

- Created Healthcare Demo New package with Epic-centered provider operations, payer-heavy Medicare/MA economics and heavy on-prem analytics debt.
- Modeled Azure as current data foundation plus a few current AI/use-case workloads.
- Modeled AWS as future leadership pivot for agentic and transformational use cases.
- Generated template workbooks, source corpus plan, hidden truth design, source samples, validation report and review ZIP.
- Passed independent semantic audit for multi-origin relationships, endpoint integrity, commercial contract depth, source evidence families and reconstructability.

## What did not happen

No Azure resource was provisioned. No database was created. No migration was applied. No parser was run. No source file was loaded. No product runtime or module read model was changed.

## Next gate

Human review of the candidate package, source-corpus design and hidden-truth evaluator contract before any Azure/Postgres load, parser run, product read-model work or publication job.
