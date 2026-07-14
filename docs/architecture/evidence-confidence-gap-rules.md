# Evidence, Confidence, and Gap Rules

Status: design baseline.

## Evidence Rules

Every important assertion must either:

1. trace to an `EvidenceRef`, or
2. be marked as inference, caveat, or gap.

Evidence refs must carry:

- evidence id,
- tenant key,
- source label,
- source type,
- authority,
- truth status,
- optional source path/object/field,
- excerpt,
- as-of date,
- source owner,
- sensitivity,
- confidence,
- citation status.

## Confidence Rules

Context confidence is not a single vanity score. It must summarize:

- breadth,
- depth,
- relationship coverage,
- evidence coverage,
- answerability,
- rationale.

Confidence may say a pack is strong enough for orientation while still blocking
cross-domain dependency reasoning, sourcing savings, realized value, or active
promotion.

## Gap Rules

Gaps are first-class objects, not hidden missing fields.

Gaps should identify:

- missing evidence,
- missing owner,
- missing metric,
- missing relationship,
- candidate-only truth,
- stale source,
- unsupported-claim risk,
- privacy or control gap.

Gaps may block active promotion, module answering, or both.

## Unsupported Claim Rules

The context pack must explicitly list unsupported claims. Common unsupported
claims include:

- candidate fixture proves active tenant truth,
- synthetic source proves realized savings,
- relationship candidates are validated dependencies,
- Tower outcomes exist without measured evidence,
- Source savings are guaranteed without commercial evidence,
- a module can act without operator approval.

## Active/Candidate Rules

- Active tenant context is default.
- Candidate preview must be explicit.
- Synthetic fixtures must be labeled.
- Source-adapter rows are not active truth by default.
- No production tenant data is written by design-proof work.
- No module runtime behavior changes from a design-proof PR.
