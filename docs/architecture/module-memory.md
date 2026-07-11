# Module Memory

Status: official architecture baseline.

Module Memory stores module-created state before promotion. No model output becomes durable fact automatically.

## Write Statuses

- proposed
- evidence-linked
- validated
- approved
- promoted
- superseded
- retired
- rejected
- benchmark-eligible
- benchmark-excluded

## Module Writes

| Module | Writes |
| --- | --- |
| Home | boundary events, unknown-topic logs, evidence gap signals |
| Intelligence | answer packets, claims, citations, accepted insights as proposed memory, blocked claims |
| Moves | phase decisions, gate attestations, artifacts, assumptions, evidence gaps, value commitments, Tower handoff |
| Source | sourcing events, vendor comparisons, negotiation levers, award decisions, obligations, value commitments |
| Tower | outcome measurements, realized value attestations, leakage events, confidence scores, forecast/actual variance |
| Export | artifact records, decision records, export lineage, citations used |
