# Intake enrichment: derive at collection, approve as an overlay

**Status:** contract built. No template declares an enrichment column yet, and no tenant has
been enriched. See `docs/releases/records/2026-08-20-intake-enrichment-overlay.md`.

## The problem this solves

Some of what a client's estate means is knowable from product identity alone. A named
warehouse product is a warehouse for every client that runs it, forever, and that belongs in
a reviewed alias table rather than in anyone's judgement.

A large residue is not knowable that way, because it is genuinely client-specific:

- what role does *this* database instance play in *this* estate?
- is this cloud data platform acting as a warehouse, a lakehouse, or a landing zone?
- which of these systems are systems of record, and which are downstream copies?
- what is the cadence on a flow whose refresh frequency was left blank?

Today that residue lands as unclassified and stays there, because the only people who can
answer are the client's own architects, and nothing asks them. Meanwhile the render layer
quietly guesses, because a picture has to put every box somewhere.

That second half is the real problem. A guess made inside a projection is invisible: it has
no author, no evidence and no date, and it reaches a client-facing document looking exactly
like something the client said.

## The shape

Between collection and load, run each workbook through a model — the client's own GPT
deployment, or Claude through the audited egress path — to derive per-row intelligence.
Review it. Merge only what a person approved.

```
recorded workbook  ──────────────────►  recorded ingestion  ──►  canonical recorded attributes
       │                                                                    ▲
       └── enrichment overlay ──► validate ──► review ──► approved proposals ┘
                                  vs source     per cell     merged, labelled
```

The client still fills in one friendly workbook. On upload the reserved columns are split
out into the overlay and stripped from the recorded stream, so the two never travel together
past intake.

## The constraint that makes it safe

**A derived value must never be indistinguishable from a recorded one.**

This is the whole risk, and adding a model to intake multiplies it. Five mechanisms carry
that constraint, each of which fails loudly rather than quietly.

### 1. Enrichment is an overlay, not a column

Recorded data is immutable. Model output never becomes a column on the recorded record.

The reason is structural rather than stylistic. The canonical build passes every CSV column
through generically, so a gate placed inside that path is one refactor from being bypassed —
and the bypass is silent, producing a canonical attribute that looks exactly as authoritative
as a recorded one. Reserved prefixes (`det__`, `drv__`, `aug__`) are therefore refused
outright on both recorded ingestion paths. The dangerous behaviour now fails instead of
needing to be remembered.

### 2. Three bases, and the prefix is the contract

| basis | prefix | meaning |
|---|---|---|
| recorded | none | the client stated it |
| deterministic | `det__` | we computed it from recorded fields, reproducibly |
| derived | `drv__` | a model concluded it from recorded fields in the same file |
| augmented | `aug__` | a fact from outside the client's own data |

Deterministic values submitted in the workbook are discarded and recomputed. A deterministic
column is reproducible by definition, so accepting the submitted value buys nothing and
admits tampering — and recomputing detects the tampering, which is itself worth knowing about
a workbook.

The estate templates declare no augmented column. Augmentation means adding a fact the client
never gave us, and on the technology estate that would be the least defensible content on the
page.

### 3. Review is per cell

A column routinely contains approved, rejected and still-pending proposals at once, so
admitting or refusing a whole column cannot express the review that actually happened.

Bulk decisions are supported — a reviewer looking at fifty rows that all say the same thing is
making one decision, not fifty — and what persists is still one decision per cell, so every
approved value can name who approved it and against what. A proposal that is the only one of
its kind in a run cannot be bulk-decided: it has no group to be judged as part of.

Approval binds to the recorded source hash, the overlay hash, the proposal-set hash, the
schema version and the run id. A previously approved record cannot be paired with a changed
workbook. A reviewer name typed into a spreadsheet is not approval.

### 4. No financial content, ever, anywhere in a proposal

A derived cost is a fabricated cost. Detection is on the value, not the column name, because
a model can place a figure inside an innocuously named classification field or an evidence
note. Recorded cost columns are untouched: a client's own figure is not ours to refuse.

### 5. Basis travels with the value, and each surface declares what it may read

A recorded and a derived version of the same fact occupy **one logical attribute**. Recorded
always wins; the losing proposal is kept rather than deleted, because "we inferred X, the
client later stated Y" is worth being able to show.

Every merged attribute carries provenance beside it — basis, evidence fields, dependency hash,
run, model, prompt version, approver, approval id. Consumers read that, never a naming
convention.

What each surface may read is then a policy rather than a habit:

| surface | admits | why |
|---|---|---|
| Tower metric | recorded, deterministic | a derived value in a metric turns a judgement into a measurement |
| Home fact band | recorded, deterministic | the band asserts what the record shows |
| Home inference band | + derived | the band already names its content as inference |
| Source answer | + derived | admissible when the citation names the basis |
| Graph edge | recorded, deterministic | an inferred dependency would be indistinguishable from an observed integration |
| Client export | + derived | must carry its own basis marks; the reader cannot come back and ask |

An attribute with no provenance entry is withheld rather than assumed recorded. Unknown basis
must never read as fact.

## Invalidation is exact, and re-checked at merge

Each proposal's dependency hash covers **only the recorded fields it cited**. A client
correcting an unrelated column in the same file does not wipe every derivation in it; a client
correcting a cited field invalidates that proposal immediately, because the derivation no
longer rests on the record it was drawn from.

Evidence is re-checked at merge rather than trusted from the approval. The two are separated
in time, and a proposal whose evidence moved in between is no longer the thing that was
approved.

## Vocabularies are closed, and `unknown` is a real answer

An open field lets a model widen a taxonomy one reasonable-looking row at a time until the
categories no longer partition anything, and nobody notices because each individual value
looked fine. Every classification column declares a closed vocabulary; a column that genuinely
cannot be enumerated — a product name, a count — must say why, so that an argued exception is
distinguishable from an omission.

Every closed vocabulary includes `unknown`. A model with no way to decline picks the nearest
wrong answer. Cells returned as `unknown` are counted and reported to the reviewer: they are a
correct answer and a map of what to ask the client next, not a failure of the run.

## What this does not do

- It does not make a derived classification true. It makes it attributable.
- It does not remove the need to ask the client. It produces the list of what to ask.
- It does not apply to files that have not declared a schema. No template declares an
  enrichment column today.
