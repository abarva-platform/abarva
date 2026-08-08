# Contract 360 Golden UX Wireframe and Product Contract

## Design stance

Contract 360 should be a decision page first and a database browser second. The first screen must answer:

1. Why this contract?
2. Why now?
3. What value is supported by evidence?
4. What source systems prove it?
5. What action should the client approve next?

The six-tab structure is global across Contract 360. The two golden contracts prove the path; other contracts should show the same layout with honest gaps.

## Six tabs

| Tab | Purpose | Primary data |
|---|---|---|
| Decision | Executive verdict, ranking, four-ledger values, next action | contract_360, optimization ledger, Tower value claims |
| Scope | Plain-English overview, function/system map, line items | contract overview, pricing schedule, app scope |
| Economics | Contract value, actual spend, PO coverage, invoice exceptions | invoice lines, PO match, pricing schedule |
| Performance | SLA, incidents, credits earned/claimed/received, usage trend | SLA monthly, usage monthly |
| Leverage | Benchmark rights, alternatives, renewal timing, switching risk | CLM terms, sourcing history, category benchmarks |
| Evidence | File lineage, source systems, row ids, review status, gaps | evidence inventory and source row lineage |

## Header sizing

Use restrained professional type: page H1 no larger than 30px desktop and 24px laptop/tablet. No hero-scale serif headers inside app workflow pages. The whole decision view should fit in a normal laptop viewport with minimal or no vertical scroll.

## Decision tab layout

```text
Contract title + compact metadata
[Verdict card: 1 sentence]
[Four-ledger strip: recoverable | avoided | negotiated | realized]
[Two-column body]
  Left: why this / why now / what supports / what is missing
  Right: top evidence sources + launch Door 1
[Source graph: CLM -> AP/PO -> Usage/SLA -> Tower/Finance]
```

## Source workflow implication

The upload workflow must parse and persist source rows before Contract 360 claims the value. CSV presence alone is not enough. A value is visible only when it has flowed through parser, canonical/evidence class, read-model projection, UI rendering and live reconciliation.
